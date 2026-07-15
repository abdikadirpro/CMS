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

module.exports = { authenticate, optionalAuthenticate };
