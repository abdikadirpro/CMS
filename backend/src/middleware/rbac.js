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

/** Builds a Prisma `where` scope object restricting complaint/report queries to the admin's own jurisdiction. */
function scopeForAdmin(admin) {
  switch (admin.adminType) {
    case "SUPER_ADMIN":
      return {};
    case "ZONE_ADMIN":
      return { zoneId: admin.zoneId };
    case "TOWN_ADMIN":
      return { townAdministrationId: admin.townAdministrationId };
    case "DISTRICT_ADMIN":
      return { districtId: admin.districtId };
    case "OFFICE_ADMIN":
      return { officeId: admin.officeId };
    default:
      return { id: "__none__" };
  }
}

module.exports = { authorize, requirePermission, scopeForAdmin };
