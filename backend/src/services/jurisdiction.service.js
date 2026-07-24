/** Returns the socket room name representing an admin's jurisdiction, used both for JWT payload and socket auth. */
function jurisdictionRoomForAdmin(admin) {
  switch (admin.adminType) {
    case "SUPER_ADMIN":
      return "admin:super";
    case "ZONE_ADMIN":
      return `admin:zone:${admin.zoneId}`;
    case "TOWN_ADMIN":
      return `admin:town:${admin.townAdministrationId}`;
    case "DISTRICT_ADMIN":
      return `admin:district:${admin.districtId}`;
    case "OFFICE_ADMIN":
      return `admin:office:${admin.officeId}`;
    default:
      return null;
  }
}

/**
 * A transfer may only move a complaint one step up its own real hierarchy chain (its District's
 * own Zone, or on to Super Admin) or laterally within its current jurisdiction — never sideways
 * into an unrelated zone/district. Applies uniformly to every admin type that can transfer.
 */
function isValidTransferTarget(complaint, toAdmin) {
  if (!toAdmin) return true; // free-text office name only, no admin jurisdiction to validate
  if (toAdmin.adminType === "SUPER_ADMIN") return true; // the apex is always a valid destination

  if (complaint.districtId) {
    if (toAdmin.districtId === complaint.districtId) return true; // same district
    if (toAdmin.adminType === "ZONE_ADMIN" && toAdmin.zoneId === complaint.zoneId) return true; // its own zone
    return false;
  }
  if (complaint.zoneId) return toAdmin.zoneId === complaint.zoneId; // same zone only, else via SUPER_ADMIN
  if (complaint.townAdministrationId) return toAdmin.townAdministrationId === complaint.townAdministrationId;
  if (complaint.officeId) return toAdmin.officeId === complaint.officeId;
  return true; // complaint has no jurisdiction FK set — nothing to validate against
}

module.exports = { jurisdictionRoomForAdmin, isValidTransferTarget };
