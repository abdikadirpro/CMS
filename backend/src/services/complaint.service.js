const prisma = require("../config/db");
const { generateTrackingId } = require("../utils/trackingId");
const { ApiError } = require("../utils/apiResponse");

async function createUniqueTrackingId() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const trackingId = generateTrackingId();
    const existing = await prisma.complaint.findUnique({ where: { trackingId } });
    if (!existing) return trackingId;
  }
  throw new Error("Failed to generate a unique tracking ID, please retry");
}

/**
 * Resolves the complaint's geographic jurisdiction from the citizen's explicit location choice —
 * a District (cascades its parent Zone), a Zone directly (for zone-wide issues with no specific
 * district), or a standalone Town Administration — never from the selected Office, since offices
 * (e.g. national ministries) are a separate "who handles it" concern from "where it happened".
 */
async function resolveJurisdictionFromLocation({ districtId, zoneId, townAdministrationId }) {
  if (districtId) {
    const district = await prisma.district.findUnique({ where: { id: districtId } });
    if (!district) return {};
    return { districtId: district.id, zoneId: district.zoneId, townAdministrationId: null };
  }
  if (zoneId) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) return {};
    return { zoneId: zone.id, districtId: null, townAdministrationId: null };
  }
  if (townAdministrationId) {
    const town = await prisma.townAdministration.findUnique({ where: { id: townAdministrationId } });
    if (!town) return {};
    return { townAdministrationId: town.id, districtId: null, zoneId: null };
  }
  return {};
}

const SUBMISSION_MONTHLY_LIMIT = 3;
const SUBMISSION_MIN_GAP_MS = 10 * 24 * 60 * 60 * 1000;
const SUBMISSION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Throws if a logged-in citizen has submitted a complaint too recently (< 10 days ago) or has
 * already hit the 3-per-rolling-month cap. Applies to every authenticated submission, including
 * ones marked anonymous — anonymous complaints intentionally leave submitterId null (so admins
 * can't see who filed them), so this counts against the ActivityLog's COMPLAINT_CREATED entries
 * (recorded for every submission regardless of anonymity) instead of Complaint.submitterId, which
 * an anonymous submission would never show up under. Guest/unauthenticated submitters have no
 * account to key this on — see assertGuestSubmissionAllowed for their (IP-based) limit instead.
 */
async function assertSubmissionAllowed(userId) {
  const last = await prisma.activityLog.findFirst({
    where: { actorId: userId, actorType: "USER", action: "COMPLAINT_CREATED" },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (last) {
    const elapsedMs = Date.now() - last.createdAt.getTime();
    if (elapsedMs < SUBMISSION_MIN_GAP_MS) {
      const daysLeft = Math.ceil((SUBMISSION_MIN_GAP_MS - elapsedMs) / (24 * 60 * 60 * 1000));
      throw new ApiError(429, `Please wait ${daysLeft} more day(s) before submitting another complaint (minimum 10 days between submissions).`);
    }
  }

  const recentCount = await prisma.activityLog.count({
    where: { actorId: userId, actorType: "USER", action: "COMPLAINT_CREATED", createdAt: { gte: new Date(Date.now() - SUBMISSION_WINDOW_MS) } },
  });
  if (recentCount >= SUBMISSION_MONTHLY_LIMIT) {
    throw new ApiError(429, `You've reached the limit of ${SUBMISSION_MONTHLY_LIMIT} complaints per month. Please try again later.`);
  }
}

/**
 * Same 10-day-gap / 3-per-month cap as assertSubmissionAllowed, but for guest (not logged in)
 * submissions, keyed by IP address since there's no account to check. Deliberately scoped to
 * guest activity only (actorId: null) so it never collides with an authenticated citizen's own
 * per-account limit. Coarser than the account-based check by nature — a shared/NAT'd IP (an
 * office, a campus, a mobile carrier) can trip this for multiple distinct genuine citizens — so
 * callers should treat it as a spam backstop, not a precise per-person guarantee.
 */
async function assertGuestSubmissionAllowed(ipAddress) {
  if (!ipAddress) return; // nothing reliable to key the limit on at all

  const last = await prisma.activityLog.findFirst({
    where: { actorId: null, action: "COMPLAINT_CREATED", ipAddress },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (last) {
    const elapsedMs = Date.now() - last.createdAt.getTime();
    if (elapsedMs < SUBMISSION_MIN_GAP_MS) {
      const daysLeft = Math.ceil((SUBMISSION_MIN_GAP_MS - elapsedMs) / (24 * 60 * 60 * 1000));
      throw new ApiError(429, `Please wait ${daysLeft} more day(s) before submitting another guest complaint from this network (minimum 10 days between submissions). Log in to submit under your own account instead.`);
    }
  }

  const recentCount = await prisma.activityLog.count({
    where: { actorId: null, action: "COMPLAINT_CREATED", ipAddress, createdAt: { gte: new Date(Date.now() - SUBMISSION_WINDOW_MS) } },
  });
  if (recentCount >= SUBMISSION_MONTHLY_LIMIT) {
    throw new ApiError(429, `This network has reached the limit of ${SUBMISSION_MONTHLY_LIMIT} guest complaints per month. Please log in to submit more, or try again later.`);
  }
}

const ESCALATION_WINDOW_MS = 10 * 24 * 60 * 60 * 1000;
const ESCALATION_TERMINAL_STATUSES = new Set(["SOLVED", "CLOSED", "REJECTED"]);

/**
 * The next hierarchy level a complaint can escalate to. `escalatedTo` tracks the level it has
 * already escalated to (districtId/zoneId stay put during escalation, so they alone can't tell
 * a first hop from a second) — District -> Zone -> Super Admin, or Zone -> Super Admin.
 */
function getNextEscalationLevel(complaint) {
  if (complaint.escalatedTo === "SUPER_ADMIN") return null; // already at the top
  if (complaint.escalatedTo === "ZONE_ADMIN") return "SUPER_ADMIN"; // second hop: District -> Zone -> Super Admin
  if (complaint.districtId) return "ZONE_ADMIN"; // first hop from a District-origin complaint
  if (complaint.zoneId) return "SUPER_ADMIN"; // first (and only) hop from a Zone-origin complaint
  return null; // Town Administration / Office origin has no escalation path
}

/**
 * Computes whether the complaint's submitter can escalate it right now: 10 days must have
 * passed since it arrived at its current handling level, with no admin status change since.
 */
function getEscalationStatus(complaint) {
  const nextLevel = getNextEscalationLevel(complaint);
  if (!nextLevel || ESCALATION_TERMINAL_STATUSES.has(complaint.status)) {
    return { canEscalate: false, nextLevel: null, eligibleAt: null, hasFeedback: false };
  }
  const eligibleAt = new Date(complaint.currentLevelEnteredAt.getTime() + ESCALATION_WINDOW_MS);
  const hasFeedback = Boolean(complaint.lastFeedbackAt);
  return { canEscalate: !hasFeedback && Date.now() >= eligibleAt.getTime(), nextLevel, eligibleAt, hasFeedback };
}

const STATUS_BUCKET_MAP = {
  PENDING: "pending",
  UNDER_REVIEW: "active",
  ASSIGNED: "active",
  IN_PROGRESS: "active",
  WAITING: "waiting",
  SOLVED: "solved",
  CLOSED: "closed",
  TRANSFERRED: "transferred",
  REJECTED: "rejected",
  ESCALATED: "escalated",
};

module.exports = {
  createUniqueTrackingId,
  resolveJurisdictionFromLocation,
  STATUS_BUCKET_MAP,
  assertSubmissionAllowed,
  assertGuestSubmissionAllowed,
  getEscalationStatus,
  getNextEscalationLevel,
};
