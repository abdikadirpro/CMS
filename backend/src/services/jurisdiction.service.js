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

module.exports = { jurisdictionRoomForAdmin };
