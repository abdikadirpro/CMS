const { ApiError } = require("../utils/apiResponse");
const prisma = require("../config/db");

/** Restricts a route to specific admin types. Must run after `authenticate`. */
function authorize(...adminTypes) {
  return (req, res, next) => {
    if (!req.actor || req.actor.type !== "ADMIN") {
      return next(new ApiError(403, "Admin access required"));
    }
    if (adminTypes.length > 0 && !adminTypes.includes(req.actor.adminType)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    next();
  };
}

/** Restricts a route to a specific fine-grained permission code, resolved through the admin's role. */
function requirePermission(code) {
  return async (req, res, next) => {
    try {
      if (!req.actor || req.actor.type !== "ADMIN") {
        return next(new ApiError(403, "Admin access required"));
      }
      if (req.actor.adminType === "SUPER_ADMIN") return next();
      if (!req.actor.roleId) return next(new ApiError(403, "No role assigned"));

      const rolePermission = await prisma.rolePermission.findFirst({
        where: { roleId: req.actor.roleId, permission: { code } },
      });
      if (!rolePermission) return next(new ApiError(403, "Missing required permission"));
      next();
    } catch (err) {
      next(err);
    }
  };
}

/**
 * Builds a Prisma `where` scope object restricting complaint/report queries to the admin's own
 * jurisdiction. Per the routing table in complaint.service.js's resolveJurisdictionFromLocation,
 * only District-origin complaints (which cascade both districtId and zoneId) land with a Zone
 * Admin automatically — a directly-selected "Zone (general)" complaint never gets zoneId set, so
 * requiring districtId here keeps it out of a fresh Zone Admin's queue (it goes to Super Admin
 * instead). District Admins no longer handle complaints at all — the routing ladder now starts at
 * the Zone — so their scope always resolves to nothing; they can still be reassigned complaints
 * manually for other duties, just not through complaint routing.
 */
function scopeForAdmin(admin) {
  switch (admin.adminType) {
    case "SUPER_ADMIN":
      return {};
    case "ZONE_ADMIN":
      return { zoneId: admin.zoneId, districtId: { not: null } };
    case "TOWN_ADMIN":
      return { townAdministrationId: admin.townAdministrationId };
    case "DISTRICT_ADMIN":
      return { id: "__none__" };
    case "OFFICE_ADMIN":
      return { officeId: admin.officeId };
    default:
      return { id: "__none__" };
  }
}

/** Restricts a route to specific party admin types. Must run after `authenticatePartyAdmin`. */
function authorizePartyAdmin(...partyAdminTypes) {
  return (req, res, next) => {
    if (!req.actor || req.actor.type !== "PARTY_ADMIN") {
      return next(new ApiError(403, "Party admin access required"));
    }
    if (partyAdminTypes.length > 0 && !partyAdminTypes.includes(req.actor.partyAdminType)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    next();
  };
}

/** Builds a Prisma `where` scope object restricting member queries to the party admin's own jurisdiction. */
function scopeForPartyAdmin(partyAdmin) {
  switch (partyAdmin.partyAdminType) {
    case "PARTY_SUPER_ADMIN":
      return {};
    case "PARTY_ZONE_ADMIN":
      return { zoneId: partyAdmin.zoneId };
    case "PARTY_TOWN_ADMIN":
      return { townAdministrationId: partyAdmin.townAdministrationId };
    case "PARTY_DISTRICT_ADMIN":
      return { districtId: partyAdmin.districtId };
    case "PARTY_OFFICE_ADMIN":
      return { officeId: partyAdmin.officeId };
    default:
      return { id: "__none__" };
  }
}

module.exports = { authorize, requirePermission, scopeForAdmin, authorizePartyAdmin, scopeForPartyAdmin };
