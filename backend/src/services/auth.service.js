const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const prisma = require("../config/db");
const { signAccessToken, signRefreshToken, hashToken } = require("../utils/jwt");
const { jurisdictionRoomForAdmin } = require("./jurisdiction.service");
const env = require("../config/env");

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

async function issueTokenPair(actor) {
  const jurisdiction =
    actor.type === "ADMIN" ? { room: jurisdictionRoomForAdmin(actor) } : {};

  const basePayload = {
    sub: actor.id,
    type: actor.type,
    ...(actor.type === "ADMIN" ? { adminType: actor.adminType } : {}),
    jurisdiction,
  };

  const accessToken = signAccessToken(basePayload);
  // A random jti guarantees a unique token (and thus a unique tokenHash row) even if two refresh
  // tokens are issued for the same actor within the same second (e.g. concurrent tab loads).
  const refreshToken = signRefreshToken({ sub: actor.id, type: actor.type, jti: crypto.randomUUID() });

  const expiresAt = new Date(Date.now() + parseDurationMs(env.jwt.refreshExpiresIn));
  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: actor.type === "USER" ? actor.id : null,
      adminId: actor.type === "ADMIN" ? actor.id : null,
      expiresAt,
    },
  });

  return { accessToken, refreshToken };
}

function parseDurationMs(duration) {
  const match = /^(\d+)([smhd])$/.exec(duration);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]];
  return value * unitMs;
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

async function comparePassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function sanitizeUser(user) {
  const { passwordHash, otpCodeHash, resetTokenHash, ...safe } = user;
  return { ...safe, type: "USER" };
}

function sanitizeAdmin(admin) {
  const { passwordHash, resetTokenHash, ...safe } = admin;
  return { ...safe, type: "ADMIN" };
}

module.exports = {
  generateOtp,
  issueTokenPair,
  hashPassword,
  comparePassword,
  sanitizeUser,
  sanitizeAdmin,
};
