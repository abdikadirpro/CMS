const prisma = require("../config/db");
const { ApiError, success } = require("../utils/apiResponse");
const { hashToken, verifyRefreshToken } = require("../utils/jwt");
const {
  generateOtp,
  issueTokenPair,
  hashPassword,
  comparePassword,
  sanitizeUser,
  sanitizeAdmin,
  recordFailedLogin,
  resetLoginAttempts,
} = require("../services/auth.service");
const { logActivity } = require("../services/activityLog.service");
const { sendOtpEmail, sendPasswordResetEmail } = require("../services/email.service");

// Attaches the admin's organization name(s) — and, for a District Admin, their parent Zone's name
// too — so the dashboard can show "District: X / Zone: Y" etc. without a second round-trip. Plain
// scoping (RBAC filtering by districtId/zoneId/etc.) never needed this; it only matters for display.
const ADMIN_ORG_INCLUDE = {
  zone: { select: { id: true, name: true } },
  district: { select: { id: true, name: true, zone: { select: { id: true, name: true } } } },
  townAdministration: { select: { id: true, name: true } },
  office: { select: { id: true, name: true } },
};

const REFRESH_COOKIE_NAME = "cms_refresh_token";
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

async function register(req, res, next) {
  try {
    const { fullName, email, phone, idNumber, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "An account with this email already exists");

    const passwordHash = await hashPassword(password);
    const otp = generateOtp();
    const otpCodeHash = hashToken(otp);

    const user = await prisma.user.create({
      data: {
        fullName,
        email,
        phone,
        idNumber,
        passwordHash,
        otpCodeHash,
        otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await sendOtpEmail({ to: email, fullName, otp });
    await logActivity({ actor: { type: "USER", id: user.id, fullName }, action: "USER_REGISTERED", targetType: "User", targetId: user.id });

    return success(res, {
      statusCode: 201,
      message: "Account created. Enter the verification code sent to your email to activate it.",
      data: { userId: user.id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}

async function verifyOtp(req, res, next) {
  try {
    const { userId, code } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.otpCodeHash || !user.otpExpiresAt) {
      throw new ApiError(400, "No pending verification for this account");
    }
    if (user.otpExpiresAt < new Date()) throw new ApiError(400, "Verification code expired");
    if (hashToken(code) !== user.otpCodeHash) throw new ApiError(400, "Invalid verification code");

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, otpCodeHash: null, otpExpiresAt: null },
    });

    const tokens = await issueTokenPair({ type: "USER", id: updated.id });
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    return success(res, {
      message: "Account verified",
      data: { accessToken: tokens.accessToken, actor: sanitizeUser(updated) },
    });
  } catch (err) {
    next(err);
  }
}

async function resendOtp(req, res, next) {
  try {
    const { userId } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ApiError(404, "Account not found");
    if (user.isEmailVerified) throw new ApiError(400, "Account already verified");

    const otp = generateOtp();
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCodeHash: hashToken(otp), otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });
    await sendOtpEmail({ to: user.email, fullName: user.fullName, otp });

    return success(res, { message: "A new verification code has been sent" });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    let actor = await prisma.admin.findUnique({ where: { email }, include: ADMIN_ORG_INCLUDE });
    let actorType = "ADMIN";
    if (!actor) {
      actor = await prisma.user.findUnique({ where: { email } });
      actorType = "USER";
    }
    if (!actor) throw new ApiError(401, "Invalid email or password");
    if (!actor.isActive) throw new ApiError(403, "This account has been deactivated");

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

    if (actorType === "USER" && !actor.isEmailVerified) {
      throw new ApiError(403, "Please verify your email before logging in", {
        code: "EMAIL_NOT_VERIFIED",
        userId: actor.id,
      });
    }

    const tokens = await issueTokenPair({ type: actorType, ...actor });
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, REFRESH_COOKIE_OPTIONS);

    await logActivity({
      actor: { type: actorType, id: actor.id, fullName: actor.fullName },
      action: "LOGIN",
      targetType: actorType,
      targetId: actor.id,
      ipAddress: req.ip,
    });

    const sanitized = actorType === "ADMIN" ? sanitizeAdmin(actor) : sanitizeUser(actor);
    return success(res, {
      message: "Login successful",
      data: { accessToken: tokens.accessToken, actor: sanitized },
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

    const tokenHash = hashToken(token);
    const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new ApiError(401, "Refresh token no longer valid");
    }

    const actor =
      payload.type === "ADMIN"
        ? await prisma.admin.findUnique({ where: { id: payload.sub } })
        : await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!actor || !actor.isActive) throw new ApiError(401, "Account not found or inactive");

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
    res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/auth" });
    return success(res, { message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    if (req.actor.type === "ADMIN") {
      // req.actor (from the auth middleware) is a lean fetch with no relations, since RBAC scoping
      // only needs the raw FK columns already on it — re-fetch with names included just for display.
      const admin = await prisma.admin.findUnique({ where: { id: req.actor.id }, include: ADMIN_ORG_INCLUDE });
      return success(res, { data: { actor: sanitizeAdmin(admin) } });
    }
    return success(res, { data: { actor: sanitizeUser(req.actor) } });
  } catch (err) {
    next(err);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    let actor = await prisma.admin.findUnique({ where: { email } });
    let table = "admin";
    if (!actor) {
      actor = await prisma.user.findUnique({ where: { email } });
      table = "user";
    }

    // Always respond success to avoid leaking which emails are registered
    if (!actor) {
      return success(res, { message: "If that email exists, a reset code has been sent" });
    }

    const otp = generateOtp();
    const data = { resetTokenHash: hashToken(otp), resetTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000) };
    if (table === "admin") await prisma.admin.update({ where: { id: actor.id }, data });
    else await prisma.user.update({ where: { id: actor.id }, data });

    await sendPasswordResetEmail({ to: email, fullName: actor.fullName, code: otp });

    return success(res, { message: "If that email exists, a reset code has been sent" });
  } catch (err) {
    next(err);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { email, code, newPassword } = req.body;

    let actor = await prisma.admin.findUnique({ where: { email } });
    let table = "admin";
    if (!actor) {
      actor = await prisma.user.findUnique({ where: { email } });
      table = "user";
    }
    if (!actor || !actor.resetTokenHash || !actor.resetTokenExpiresAt) {
      throw new ApiError(400, "Invalid or expired reset code");
    }
    if (actor.resetTokenExpiresAt < new Date()) throw new ApiError(400, "Reset code expired");
    if (hashToken(code) !== actor.resetTokenHash) throw new ApiError(400, "Invalid reset code");

    const passwordHash = await hashPassword(newPassword);
    const data = { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null };
    if (table === "admin") await prisma.admin.update({ where: { id: actor.id }, data });
    else await prisma.user.update({ where: { id: actor.id }, data });

    return success(res, { message: "Password reset successful. You can now log in." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  refresh,
  logout,
  me,
  forgotPassword,
  resetPassword,
};
