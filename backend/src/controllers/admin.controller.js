const prisma = require("../config/db");
const { ApiError, success } = require("../utils/apiResponse");
const { hashPassword, comparePassword, sanitizeAdmin } = require("../services/auth.service");
const { logActivity } = require("../services/activityLog.service");

const SELECT_SAFE = {
  id: true, fullName: true, email: true, phone: true, adminType: true, isActive: true,
  roleId: true, zoneId: true, districtId: true, townAdministrationId: true, officeId: true,
  createdAt: true, updatedAt: true,
  role: true, zone: true, district: true, townAdministration: true, office: true,
};

async function list(req, res, next) {
  try {
    const { adminType, search, page = 1, pageSize = 20 } = req.query;
    const take = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {};
    if (adminType) where.adminType = adminType;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.admin.findMany({ where, select: SELECT_SAFE, orderBy: { createdAt: "desc" }, take, skip }),
      prisma.admin.count({ where }),
    ]);

    return success(res, { data: items, meta: { total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take) } });
  } catch (err) {
    next(err);
  }
}

const DIRECTORY_SELECT = {
  id: true, fullName: true, adminType: true, zoneId: true, districtId: true, townAdministrationId: true, officeId: true,
  zone: { select: { name: true } }, district: { select: { name: true } },
  townAdministration: { select: { name: true } }, office: { select: { name: true } },
};

/** Lightweight admin list (no emails/roles) any admin can query to pick assign/transfer targets. */
async function directory(req, res, next) {
  try {
    const { adminType, zoneId, districtId, townAdministrationId, officeId, search } = req.query;
    const where = { isActive: true };
    if (adminType) where.adminType = adminType;
    if (zoneId) where.zoneId = zoneId;
    if (districtId) where.districtId = districtId;
    if (townAdministrationId) where.townAdministrationId = townAdministrationId;
    if (officeId) where.officeId = officeId;
    if (search) where.fullName = { contains: search, mode: "insensitive" };

    const admins = await prisma.admin.findMany({ where, select: DIRECTORY_SELECT, orderBy: { fullName: "asc" }, take: 100 });
    return success(res, { data: admins });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const admin = await prisma.admin.findUnique({ where: { id: req.params.id }, select: SELECT_SAFE });
    if (!admin) throw new ApiError(404, "Admin not found");
    return success(res, { data: admin });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { fullName, email, password, phone, adminType } = req.body;
    // Optional foreign-key <select> fields submit "" when left unselected — Prisma needs null, not "".
    const roleId = req.body.roleId || null;
    const zoneId = req.body.zoneId || null;
    const districtId = req.body.districtId || null;
    const townAdministrationId = req.body.townAdministrationId || null;
    const officeId = req.body.officeId || null;

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "An admin with this email already exists");

    const passwordHash = await hashPassword(password);
    const admin = await prisma.admin.create({
      data: { fullName, email, phone, adminType, passwordHash, roleId, zoneId, districtId, townAdministrationId, officeId },
      select: SELECT_SAFE,
    });

    await logActivity({
      actor: { type: "ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "ADMIN_CREATED",
      targetType: "Admin",
      targetId: admin.id,
      metadata: { adminType },
    });

    return success(res, { statusCode: 201, message: "Admin created", data: admin });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const body = req.body;
    // PATCH semantics: a field absent from the body is left unchanged (undefined), while an
    // explicit "" from an unselected <select> means "clear it" (null) — the two must not collapse together.
    const data = {};
    const directFields = ["fullName", "phone", "isActive"];
    const fkFields = ["roleId", "zoneId", "districtId", "townAdministrationId", "officeId"];
    directFields.forEach((key) => { if (body[key] !== undefined) data[key] = body[key]; });
    fkFields.forEach((key) => { if (body[key] !== undefined) data[key] = body[key] || null; });

    const admin = await prisma.admin.update({ where: { id: req.params.id }, data, select: SELECT_SAFE });

    await logActivity({
      actor: { type: "ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "ADMIN_UPDATED",
      targetType: "Admin",
      targetId: admin.id,
    });

    return success(res, { message: "Admin updated", data: admin });
  } catch (err) {
    next(err);
  }
}

async function resetAdminPassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    const passwordHash = await hashPassword(newPassword);
    await prisma.admin.update({ where: { id: req.params.id }, data: { passwordHash } });

    await logActivity({
      actor: { type: "ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "ADMIN_PASSWORD_RESET",
      targetType: "Admin",
      targetId: req.params.id,
    });

    return success(res, { message: "Password reset" });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    if (req.params.id === req.actor.id) throw new ApiError(400, "You cannot delete your own account");
    await prisma.admin.delete({ where: { id: req.params.id } });

    await logActivity({
      actor: { type: "ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "ADMIN_DELETED",
      targetType: "Admin",
      targetId: req.params.id,
    });

    return success(res, { message: "Admin deleted" });
  } catch (err) {
    next(err);
  }
}

async function updateOwnProfile(req, res, next) {
  try {
    const { fullName, phone } = req.body;
    const updated = await prisma.admin.update({ where: { id: req.actor.id }, data: { fullName, phone } });
    return success(res, { message: "Profile updated", data: sanitizeAdmin(updated) });
  } catch (err) {
    next(err);
  }
}

async function changeOwnPassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const admin = await prisma.admin.findUnique({ where: { id: req.actor.id } });
    const matches = await comparePassword(currentPassword, admin.passwordHash);
    if (!matches) throw new ApiError(400, "Current password is incorrect");

    const passwordHash = await hashPassword(newPassword);
    await prisma.admin.update({ where: { id: admin.id }, data: { passwordHash } });
    return success(res, { message: "Password changed" });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list, getById, create, update, resetAdminPassword, remove, directory,
  updateOwnProfile, changeOwnPassword,
};
