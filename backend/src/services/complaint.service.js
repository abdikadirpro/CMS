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
 * Resolves the complaint's routing jurisdiction from the citizen's explicit location choice, per
 * the Ethics & Investigation office's routing table:
 *   District              -> the district's own Zone Ethics & Investigation Office
 *   Zone (general)         -> Regional (DDS) Ethics & Investigation Office (Super Admin)
 *   Town Administration    -> Regional (DDS) Ethics & Investigation Office (Super Admin)
 *   Office / Bureau        -> Regional (DDS) Ethics & Investigation Office (Super Admin)
 *   Regional Level          -> Regional Ethics & Investigation Commission (Super Admin)
 * Only a District selection lands with a jurisdiction-scoped admin (its Zone Admin) — every other
 * option is intentionally left unassigned (no zoneId/townAdministrationId/officeId) so it goes
 * straight to Super Admin instead of that level's own admin; see scopeForAdmin in rbac.js. The
 * originally selected Zone/Town/Office name is still preserved in the free-text `location` field
 * so nothing is lost for display purposes even though it's no longer a routing FK. Returns `null`
 * if a supplied id doesn't resolve to a real record.
 */
async function resolveJurisdictionFromLocation({ districtId, zoneId, townAdministrationId, officeId, isRegionalLevel }) {
  if (districtId) {
    const district = await prisma.district.findUnique({ where: { id: districtId } });
    if (!district) return null;
    return { jurisdiction: { districtId: district.id, zoneId: district.zoneId, townAdministrationId: null, officeId: null }, locationLabel: null };
  }
  if (zoneId) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneId } });
    if (!zone) return null;
    return { jurisdiction: { districtId: null, zoneId: null, townAdministrationId: null, officeId: null }, locationLabel: `Zone: ${zone.name}` };
  }
  if (townAdministrationId) {
    const town = await prisma.townAdministration.findUnique({ where: { id: townAdministrationId } });
    if (!town) return null;
    return { jurisdiction: { districtId: null, zoneId: null, townAdministrationId: null, officeId: null }, locationLabel: `Town Administration: ${town.name}` };
  }
  if (officeId) {
    const office = await prisma.office.findUnique({ where: { id: officeId } });
    if (!office) return null;
    return { jurisdiction: { districtId: null, zoneId: null, townAdministrationId: null, officeId: null }, locationLabel: `Office: ${office.name}` };
  }
  if (isRegionalLevel) {
    return { jurisdiction: { districtId: null, zoneId: null, townAdministrationId: null, officeId: null }, locationLabel: "Regional Level" };
  }
  return null;
}

const SUBMISSION_MONTHLY_LIMIT = 3;
const SUBMISSION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Throws if a logged-in citizen has already hit the 3-per-rolling-month cap. Applies to every
 * authenticated submission, including ones marked anonymous — anonymous complaints intentionally
 * leave submitterId null (so admins can't see who filed them), so this counts against the
 * ActivityLog's COMPLAINT_CREATED entries
 * (recorded for every submission regardless of anonymity) instead of Complaint.submitterId, which
 * an anonymous submission would never show up under. Guest/unauthenticated submitters have no
 * account to key this on — see assertGuestSubmissionAllowed for their (IP-based) limit instead.
 */
async function assertSubmissionAllowed(userId) {
  const recentCount = await prisma.activityLog.count({
    where: { actorId: userId, actorType: "USER", action: "COMPLAINT_CREATED", createdAt: { gte: new Date(Date.now() - SUBMISSION_WINDOW_MS) } },
  });
  if (recentCount >= SUBMISSION_MONTHLY_LIMIT) {
    throw new ApiError(429, `You've reached the limit of ${SUBMISSION_MONTHLY_LIMIT} complaints per month. Please try again later.`);
  }
}

/**
 * Read-only view of a citizen's current submission "tokens" — how many of their 3 monthly slots
 * are used, how many remain, and (if blocked right now) when the next one opens up. Mirrors the
 * rule assertSubmissionAllowed enforces, but never throws — this is for display only.
 */
async function getSubmissionTokenStatus(userId) {
  const windowStart = new Date(Date.now() - SUBMISSION_WINDOW_MS);
  const recent = await prisma.activityLog.findMany({
    where: { actorId: userId, actorType: "USER", action: "COMPLAINT_CREATED", createdAt: { gte: windowStart } },
    orderBy: { createdAt: "asc" },
    select: { createdAt: true },
  });

  const used = recent.length;
  const remaining = Math.max(0, SUBMISSION_MONTHLY_LIMIT - used);
  // The monthly cap frees up when the oldest counted submission ages out of the rolling window.
  const nextEligibleAt = remaining === 0 ? new Date(recent[0].createdAt.getTime() + SUBMISSION_WINDOW_MS) : null;

  return {
    used,
    limit: SUBMISSION_MONTHLY_LIMIT,
    remaining,
    canSubmitNow: remaining > 0,
    nextEligibleAt,
  };
}

/**
 * Same 3-per-month cap as assertSubmissionAllowed, but for guest (not logged in)
 * submissions, keyed by IP address since there's no account to check. Deliberately scoped to
 * guest activity only (actorId: null) so it never collides with an authenticated citizen's own
 * per-account limit. Coarser than the account-based check by nature — a shared/NAT'd IP (an
 * office, a campus, a mobile carrier) can trip this for multiple distinct genuine citizens — so
 * callers should treat it as a spam backstop, not a precise per-person guarantee.
 */
async function assertGuestSubmissionAllowed(ipAddress) {
  if (!ipAddress) return; // nothing reliable to key the limit on at all

  const recentCount = await prisma.activityLog.count({
    where: { actorId: null, action: "COMPLAINT_CREATED", ipAddress, createdAt: { gte: new Date(Date.now() - SUBMISSION_WINDOW_MS) } },
  });
  if (recentCount >= SUBMISSION_MONTHLY_LIMIT) {
    throw new ApiError(429, `This network has reached the limit of ${SUBMISSION_MONTHLY_LIMIT} guest complaints per month. Please log in to submit more, or try again later.`);
  }
}

const ESCALATION_WINDOW_MS = 10 * 24 * 60 * 60 * 1000;
const ESCALATION_TERMINAL_STATUSES = new Set(["SOLVED", "REJECTED"]);
const SATISFACTION_REJECTION_THRESHOLD = 3;

/**
 * The next hierarchy level a complaint can escalate to. Only a District-origin complaint has an
 * escalation path at all — it already starts with its Zone Admin (see resolveJurisdictionFromLocation),
 * so its one and only hop is up to Super Admin. Every other origin (Zone/Town/Office/Regional) is
 * unassigned from submission and already sits with Super Admin, so there's nowhere left to escalate to.
 * The `escalatedTo === "ZONE_ADMIN"` branch is kept only for complaints created before this routing
 * change that may still be sitting at that legacy intermediate state.
 */
function getNextEscalationLevel(complaint) {
  if (complaint.escalatedTo === "SUPER_ADMIN") return null; // already at the top
  if (complaint.escalatedTo === "ZONE_ADMIN") return "SUPER_ADMIN"; // legacy data: second hop to Super Admin
  if (complaint.districtId) return "SUPER_ADMIN"; // District-origin complaints start at the Zone Admin and escalate once, to Super Admin
  return null; // Zone/Town/Office/Regional-origin complaints already sit with Super Admin
}

/**
 * Computes whether the complaint's submitter can escalate it right now. Two independent paths
 * unlock escalation: 10 days have passed since it arrived at its current handling level with no
 * admin response, OR the citizen has rejected a SOLVED resolution at this level 3+ times
 * (satisfactionRejections, see rejectResolution in complaint.controller.js).
 */
function getEscalationStatus(complaint) {
  const nextLevel = getNextEscalationLevel(complaint);
  if (!nextLevel || ESCALATION_TERMINAL_STATUSES.has(complaint.status)) {
    return { canEscalate: false, nextLevel: null, eligibleAt: null, hasFeedback: false, dissatisfactionEligible: false };
  }
  const eligibleAt = new Date(complaint.currentLevelEnteredAt.getTime() + ESCALATION_WINDOW_MS);
  const hasFeedback = Boolean(complaint.lastFeedbackAt);
  const timeEligible = Date.now() >= eligibleAt.getTime();
  const dissatisfactionEligible = complaint.satisfactionRejections >= SATISFACTION_REJECTION_THRESHOLD;
  return {
    canEscalate: !hasFeedback && (timeEligible || dissatisfactionEligible),
    nextLevel,
    eligibleAt,
    hasFeedback,
    dissatisfactionEligible,
  };
}

const STATUS_BUCKET_MAP = {
  PENDING: "pending",
  IN_PROGRESS: "inProgress",
  WAITING: "waiting",
  SOLVED: "solved",
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
  getSubmissionTokenStatus,
  getEscalationStatus,
  getNextEscalationLevel,
  SATISFACTION_REJECTION_THRESHOLD,
};
