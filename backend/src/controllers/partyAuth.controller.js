const prisma = require("../config/db");
const env = require("../config/env");
const { ApiError, success } = require("../utils/apiResponse");
const { hashToken, verifyRefreshToken } = require("../utils/jwt");
const {
  generateOtp,
  issueTokenPair,
  hashPassword,
  comparePassword,
  sanitizePartyAdmin,
  sanitizeMember,
  recordFailedLogin,
  resetLoginAttempts,
} = require("../services/auth.service");
const { logActivity } = require("../services/activityLog.service");
const { sendPasswordResetEmail } = require("../services/email.service");

// Shared login for both Xisbiga Barwaaqo actor types (party admins and members) — one email,
// one password, one session — same dual-lookup shape as the complaint system's own
// auth.controller.js login() (Admin vs User), just for PartyAdmin vs Member. Fully separate from
// the complaint-system's own refresh cookie — a party/member session and a complaint-admin
// session must be able to coexist in the same browser without one clobbering the other's cookie.
const REFRESH_COOKIE_NAME = "barwaaqo_refresh_token";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: env.nodeEnv === "production" ? "none" : "lax",
  secure: env.nodeEnv === "production",
  path: "/api/party-auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

function sanitizeByType(actorType, record) {
  return actorType === "PARTY_ADMIN" ? sanitizePartyAdmin(record) : sanitizeMember(record);
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    let actor = await prisma.partyAdmin.findUnique({ where: { email } });
    let actorType = "PARTY_ADMIN";
    if (!actor) {
      actor = await prisma.member.findUnique({ where: { email } });
      actorType = "MEMBER";
    }
    // A Member with no passwordHash yet (pre-existing row from before self-service login existed)
    // must fail the same generic way as "not found" — never reveal which case it is.
    if (!actor || (actorType === "MEMBER" && !actor.passwordHash)) {
      throw new ApiError(401, "Invalid email or password");
    }
    if (actorType === "PARTY_ADMIN" && !actor.isActive) {
      throw new ApiError(403, "This account has been deactivated");
    }

    if (actor.lockedUntil && actor.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((actor.lockedUntil.getTime() - Date.now()) / 60000);
      throw new ApiError(423, `Too many failed login attempts. Try again in ${minutesLeft} minute(s).`, {
        code: "ACCOUNT_LOCKED",
        lockedUntil: actor.lockedUntil,
      });
    }

    const passwordMatches = await comparePassword(password, actor.passwordHash);
    if (!passwordMatches) {
      const { lockedUntil } = await recordFailedLogin(actorType, actor);
      if (lockedUntil) {
        throw new ApiError(423, "Too many failed login attempts. Your account is locked for 1 hour.", {
          code: "ACCOUNT_LOCKED",
          lockedUntil,
        });
      }
      throw new ApiError(401, "Invalid email or password");
    }
    await resetLoginAttempts(actorType, actor);

    const tokens = await issueTokenPair({ type: actorType, ...actor });
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    await logActivity({
      actor: { type: actorType, id: actor.id, fullName: actor.fullName },
      action: "LOGIN",
      targetType: actorType === "PARTY_ADMIN" ? "PartyAdmin" : "Member",
      targetId: actor.id,
      ipAddress: req.ip,
    });

    return success(res, {
      message: "Login successful",
      data: { accessToken: tokens.accessToken, actor: sanitizeByType(actorType, actor) },
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) throw new ApiError(401, "No refresh token provided");

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      throw new ApiError(401, "Invalid or expired refresh token");
    }
    if (payload.type !== "PARTY_ADMIN" && payload.type !== "MEMBER") {
      throw new ApiError(401, "Invalid or expired refresh token");
    }

    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new ApiError(401, "Refresh token no longer valid");
    }

    const actor =
      payload.type === "PARTY_ADMIN"
        ? await prisma.partyAdmin.findUnique({ where: { id: payload.sub } })
        : await prisma.member.findUnique({ where: { id: payload.sub } });
    if (!actor) throw new ApiError(401, "Account not found");
    if (payload.type === "PARTY_ADMIN" && !actor.isActive) throw new ApiError(401, "Account not found or inactive");

    await prisma.refreshToken.update({ where: { tokenHash }, data: { revoked: true } });

    const tokens = await issueTokenPair({ type: payload.type, ...actor });
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    return success(res, { message: "Token refreshed", data: { accessToken: tokens.accessToken } });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (token) {
      await prisma.refreshToken.updateMany({ where: { tokenHash: hashToken(token) }, data: { revoked: true } });
    }
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/party-auth" });
    return success(res, { message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    return success(res, { data: { actor: sanitizeByType(req.actor.type, req.actor) } });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    let actor = await prisma.partyAdmin.findUnique({ where: { email } });
    let table = "partyAdmin";
    if (!actor) {
      actor = await prisma.member.findUnique({ where: { email } });
      table = "member";
    }

    // Always respond success to avoid leaking which emails are registered
    if (!actor) {
      return success(res, { message: "If that email exists, a reset code has been sent" });
    }

    const otp = generateOtp();
    const data = { resetTokenHash: hashToken(otp), resetTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000) };
    await prisma[table].update({ where: { id: actor.id }, data });

    await sendPasswordResetEmail({ to: email, fullName: actor.fullName, code: otp });

    return success(res, { message: "If that email exists, a reset code has been sent" });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;

    let actor = await prisma.partyAdmin.findUnique({ where: { email } });
    let table = "partyAdmin";
    if (!actor) {
      actor = await prisma.member.findUnique({ where: { email } });
      table = "member";
    }
    if (!actor || !actor.resetTokenHash || !actor.resetTokenExpiresAt) {
      throw new ApiError(400, "Invalid or expired reset code");
    }
    if (actor.resetTokenExpiresAt < new Date()) throw new ApiError(400, "Reset code expired");
    if (hashToken(code) !== actor.resetTokenHash) throw new ApiError(400, "Invalid reset code");

    const passwordHash = await hashPassword(newPassword);
    await prisma[table].update({
      where: { id: actor.id },
      data: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null },
    });

    return success(res, { message: "Password reset successful. You can now log in." });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, refresh, logout, me, forgotPassword, resetPassword };
