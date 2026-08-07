const { verifyAccessToken } = require("../utils/jwt");
const { ApiError } = require("../utils/apiResponse");
const prisma = require("../config/db");

/**
 * Requires a valid access token. Populates req.actor = { type: 'USER'|'ADMIN', ...record }.
 */
async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);

    if (payload.type === "ADMIN") {
      const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
      if (!admin || !admin.isActive) throw new ApiError(401, "Account not found or inactive");
      req.actor = { type: "ADMIN", ...admin };
    } else {
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || !user.isActive) throw new ApiError(401, "Account not found or inactive");
      req.actor = { type: "USER", ...user };
    }
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

/**
 * Requires a valid PARTY_ADMIN access token. Kept fully separate from `authenticate` — a
 * complaint-admin/citizen token must never authorize a Xisbiga Barwaaqo party route, and vice
 * versa. Populates req.actor = { type: 'PARTY_ADMIN', ...record }.
 */
async function authenticatePartyAdmin(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    if (payload.type !== "PARTY_ADMIN") throw new ApiError(401, "Invalid or expired token");

    const partyAdmin = await prisma.partyAdmin.findUnique({ where: { id: payload.sub } });
    if (!partyAdmin || !partyAdmin.isActive) throw new ApiError(401, "Account not found or inactive");
    req.actor = { type: "PARTY_ADMIN", ...partyAdmin };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

/**
 * Requires a valid PARTY_ADMIN or MEMBER access token — used only by the shared
 * `/api/party-auth/me` endpoint, where either actor type logged in through the same shared login
 * needs to fetch their own profile. Never use this to guard a resource route — a Member must
 * never pass as a party admin. All member-management endpoints must keep using
 * `authenticatePartyAdmin`, which still rejects MEMBER tokens outright. No isActive gate on the
 * MEMBER branch — unlike Admin/PartyAdmin/User, a Member has no activation flag; a rejected
 * applicant can still log in to see their own status.
 */
async function authenticateBarwaaqoActor(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);

    if (payload.type === "PARTY_ADMIN") {
      const partyAdmin = await prisma.partyAdmin.findUnique({ where: { id: payload.sub } });
      if (!partyAdmin || !partyAdmin.isActive) throw new ApiError(401, "Account not found or inactive");
      req.actor = { type: "PARTY_ADMIN", ...partyAdmin };
    } else if (payload.type === "MEMBER") {
      const member = await prisma.member.findUnique({ where: { id: payload.sub } });
      if (!member) throw new ApiError(401, "Account not found");
      req.actor = { type: "MEMBER", ...member };
    } else {
      throw new ApiError(401, "Invalid or expired token");
    }
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

/**
 * Requires a valid MEMBER access token specifically — unlike `authenticateBarwaaqoActor` (which
 * accepts either actor type for the shared `/me` endpoint), this rejects PARTY_ADMIN tokens.
 * Used to guard a Member's own self-service actions (update own profile, renew own membership)
 * so a party admin token can never be used to act "as" a member.
 */
async function authenticateMember(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);
    if (payload.type !== "MEMBER") throw new ApiError(401, "Invalid or expired token");

    const member = await prisma.member.findUnique({ where: { id: payload.sub } });
    if (!member) throw new ApiError(401, "Account not found");
    req.actor = { type: "MEMBER", ...member };
    next();
  } catch (err) {
    if (err instanceof ApiError) return next(err);
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

/** Allows both authenticated and anonymous requests; populates req.actor if a valid token is present. */
async function optionalAuthenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();

  try {
    const token = header.slice("Bearer ".length);
    const payload = verifyAccessToken(token);

    if (payload.type === "ADMIN") {
      const admin = await prisma.admin.findUnique({ where: { id: payload.sub } });
      if (admin && admin.isActive) req.actor = { type: "ADMIN", ...admin };
    } else {
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (user && user.isActive) req.actor = { type: "USER", ...user };
    }
  } catch {
    // invalid/expired token on an optional route: proceed as anonymous
  }
  next();
}

module.exports = { authenticate, authenticatePartyAdmin, authenticateBarwaaqoActor, authenticateMember, optionalAuthenticate };
