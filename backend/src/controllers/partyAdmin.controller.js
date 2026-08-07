const prisma = require("../config/db");
const { ApiError, success } = require("../utils/apiResponse");
const { hashPassword } = require("../services/auth.service");
const { logActivity } = require("../services/activityLog.service");

const SELECT_SAFE = {
  id: true, fullName: true, email: true, phone: true, partyAdminType: true, isActive: true,
  zoneId: true, districtId: true, townAdministrationId: true, officeId: true,
  createdAt: true, updatedAt: true,
  zone: true, district: true, townAdministration: true, office: true,
};

async function list(req, res, next) {
  try {
    const { search, page = 1, pageSize = 20 } = req.query;
    const take = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.partyAdmin.findMany({ where, select: SELECT_SAFE, orderBy: { createdAt: "desc" }, take, skip }),
      prisma.partyAdmin.count({ where }),
    ]);

    return success(res, { data: items, meta: { total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take) } });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const { fullName, email, password, phone, partyAdminType } = req.body;
    // Optional foreign-key <select> fields submit "" when left unselected — Prisma needs null, not "".
    const zoneId = req.body.zoneId || null;
    const districtId = req.body.districtId || null;
    const townAdministrationId = req.body.townAdministrationId || null;
    const officeId = req.body.officeId || null;

    const existing = await prisma.partyAdmin.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "A party admin with this email already exists");

    const passwordHash = await hashPassword(password);
    const partyAdmin = await prisma.partyAdmin.create({
      data: { fullName, email, phone, partyAdminType, passwordHash, zoneId, districtId, townAdministrationId, officeId },
      select: SELECT_SAFE,
    });

    await logActivity({
      actor: { type: req.actor.type, id: req.actor.id, fullName: req.actor.fullName },
      action: "PARTY_ADMIN_CREATED",
      targetType: "PartyAdmin",
      targetId: partyAdmin.id,
    });

    return success(res, { statusCode: 201, message: "Party admin created", data: partyAdmin });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const body = req.body;
    const data = {};
    const directFields = ["fullName", "phone", "isActive"];
    const fkFields = ["zoneId", "districtId", "townAdministrationId", "officeId"];
    directFields.forEach((key) => { if (body[key] !== undefined) data[key] = body[key]; });
    fkFields.forEach((key) => { if (body[key] !== undefined) data[key] = body[key] || null; });

    const partyAdmin = await prisma.partyAdmin.update({ where: { id: req.params.id }, data, select: SELECT_SAFE });

    await logActivity({
      actor: { type: req.actor.type, id: req.actor.id, fullName: req.actor.fullName },
      action: "PARTY_ADMIN_UPDATED",
      targetType: "PartyAdmin",
      targetId: partyAdmin.id,
    });

    return success(res, { message: "Party admin updated", data: partyAdmin });
  } catch (err) {
    next(err);
  }
}

async function resetPartyAdminPassword(req, res, next) {
  try {
    const { newPassword } = req.body;
    const passwordHash = await hashPassword(newPassword);
    await prisma.partyAdmin.update({ where: { id: req.params.id }, data: { passwordHash } });

    await logActivity({
      actor: { type: req.actor.type, id: req.actor.id, fullName: req.actor.fullName },
      action: "PARTY_ADMIN_PASSWORD_RESET",
      targetType: "PartyAdmin",
      targetId: req.params.id,
    });

    return success(res, { message: "Password reset" });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    if (req.actor.type === "PARTY_ADMIN" && req.params.id === req.actor.id) {
      throw new ApiError(400, "You cannot delete your own account");
    }
    await prisma.partyAdmin.delete({ where: { id: req.params.id } });

    await logActivity({
      actor: { type: req.actor.type, id: req.actor.id, fullName: req.actor.fullName },
      action: "PARTY_ADMIN_DELETED",
      targetType: "PartyAdmin",
      targetId: req.params.id,
    });

    return success(res, { message: "Party admin deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, create, update, resetPartyAdminPassword, remove };
