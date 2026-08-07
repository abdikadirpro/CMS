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
      partyAdminId: actor.type === "PARTY_ADMIN" ? actor.id : null,
      memberId: actor.type === "MEMBER" ? actor.id : null,
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

const MAX_LOGIN_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 60 * 60 * 1000;

function actorTable(actorType) {
  if (actorType === "ADMIN") return prisma.admin;
  if (actorType === "PARTY_ADMIN") return prisma.partyAdmin;
  if (actorType === "MEMBER") return prisma.member;
  return prisma.user;
}

/**
 * Records a failed password attempt and locks the account for an hour once it hits
 * MAX_LOGIN_ATTEMPTS. Returns the updated { failedLoginAttempts, lockedUntil } so the
 * caller can decide which error message to show.
 */
async function recordFailedLogin(actorType, actor) {
  // A lock that has already expired doesn't count toward a fresh streak of attempts.
  const previousAttempts = actor.lockedUntil && actor.lockedUntil <= new Date() ? 0 : actor.failedLoginAttempts;
  const attempts = previousAttempts + 1;

  const data =
    attempts >= MAX_LOGIN_ATTEMPTS
      ? { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) }
      : { failedLoginAttempts: attempts, lockedUntil: null };

  const updated = await actorTable(actorType).update({ where: { id: actor.id }, data });
  return { failedLoginAttempts: updated.failedLoginAttempts, lockedUntil: updated.lockedUntil };
}

/** Clears any failed-attempt/lockout state after a successful login. */
async function resetLoginAttempts(actorType, actor) {
  if (!actor.failedLoginAttempts && !actor.lockedUntil) return;
  await actorTable(actorType).update({
    where: { id: actor.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });
}

function sanitizeUser(user) {
  const { passwordHash, otpCodeHash, resetTokenHash, ...safe } = user;
  return { ...safe, type: "USER" };
}

function sanitizeAdmin(admin) {
  const { passwordHash, resetTokenHash, ...safe } = admin;
  return { ...safe, type: "ADMIN" };
}

function sanitizePartyAdmin(partyAdmin) {
  const { passwordHash, resetTokenHash, ...safe } = partyAdmin;
  return { ...safe, type: "PARTY_ADMIN" };
}

function sanitizeMember(member) {
  const { passwordHash, resetTokenHash, ...safe } = member;
  return { ...safe, type: "MEMBER" };
}

module.exports = {
  generateOtp,
  issueTokenPair,
  hashPassword,
  comparePassword,
  sanitizeUser,
  sanitizeAdmin,
  sanitizePartyAdmin,
  sanitizeMember,
  recordFailedLogin,
  resetLoginAttempts,
  MAX_LOGIN_ATTEMPTS,
};
