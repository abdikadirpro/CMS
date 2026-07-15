const prisma = require("../config/db");
const { generateTrackingId } = require("../utils/trackingId");

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

module.exports = { createUniqueTrackingId, resolveJurisdictionFromLocation, STATUS_BUCKET_MAP };
