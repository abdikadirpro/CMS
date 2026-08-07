const prisma = require("../config/db");
const { ApiError, success } = require("../utils/apiResponse");
const { scopeForPartyAdmin } = require("../middleware/rbac");
const { logActivity } = require("../services/activityLog.service");

async function register(req, res, next) {
  try {
    const { fullName, phone, email, interest, districtId, zoneId, townAdministrationId, officeId, partyBranchId } = req.body;

    if (!districtId && !zoneId && !townAdministrationId && !officeId) {
      throw new ApiError(422, "Please select a District, Zone, Town Administration, or Office");
    }

    const volunteer = await prisma.volunteer.create({
      data: {
        fullName,
        phone,
        email: email || null,
        interest: interest || null,
        districtId: districtId || null,
        zoneId: zoneId || null,
        townAdministrationId: townAdministrationId || null,
        officeId: officeId || null,
        partyBranchId: partyBranchId || null,
      },
    });

    await logActivity({
      actor: null,
      action: "VOLUNTEER_REGISTERED",
      targetType: "Volunteer",
      targetId: volunteer.id,
      ipAddress: req.ip,
    });

    return success(res, {
      statusCode: 201,
      message: "Thanks for signing up to volunteer! A party admin in your area will be in touch.",
      data: { id: volunteer.id },
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { status, search, page = 1, pageSize = 20 } = req.query;
    const take = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = { ...scopeForPartyAdmin(req.actor) };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.volunteer.findMany({
        where,
        include: { zone: true, district: true, townAdministration: true, office: true, partyBranch: true },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.volunteer.count({ where }),
    ]);

    return success(res, {
      data: items,
      meta: { total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take) },
    });
  } catch (err) {
    next(err);
  }
}

function assertInJurisdiction(actor, volunteer) {
  if (actor.partyAdminType === "PARTY_SUPER_ADMIN") return;
  const scope = scopeForPartyAdmin(actor);
  const [key, value] = Object.entries(scope)[0] || [];
  if (key && volunteer[key] !== value) {
    throw new ApiError(403, "This volunteer is outside your jurisdiction");
  }
}

async function getById(req, res, next) {
  try {
    const volunteer = await prisma.volunteer.findUnique({
      where: { id: req.params.id },
      include: { zone: true, district: true, townAdministration: true, office: true, partyBranch: true },
    });
    if (!volunteer) throw new ApiError(404, "Volunteer not found");
    assertInJurisdiction(req.actor, volunteer);

    return success(res, { data: volunteer });
  } catch (err) {
    next(err);
  }
}

const UPDATABLE_FIELDS = ["fullName", "phone", "email", "interest", "status", "zoneId", "districtId", "townAdministrationId", "officeId", "partyBranchId"];

function sanitizeBody(body) {
  return Object.fromEntries(
    UPDATABLE_FIELDS.filter((key) => key in body).map((key) => [key, body[key] === "" ? null : body[key]])
  );
}

async function update(req, res, next) {
  try {
    const volunteer = await prisma.volunteer.findUnique({ where: { id: req.params.id } });
    if (!volunteer) throw new ApiError(404, "Volunteer not found");
    assertInJurisdiction(req.actor, volunteer);

    const data = sanitizeBody(req.body);
    const updated = await prisma.volunteer.update({ where: { id: volunteer.id }, data });

    await logActivity({
      actor: { type: "PARTY_ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "VOLUNTEER_UPDATED",
      targetType: "Volunteer",
      targetId: volunteer.id,
    });

    return success(res, { message: "Volunteer updated", data: updated });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const volunteer = await prisma.volunteer.findUnique({ where: { id: req.params.id } });
    if (!volunteer) throw new ApiError(404, "Volunteer not found");

    await prisma.volunteer.delete({ where: { id: volunteer.id } });

    await logActivity({
      actor: { type: "PARTY_ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "VOLUNTEER_DELETED",
      targetType: "Volunteer",
      targetId: volunteer.id,
    });

    return success(res, { message: "Volunteer deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, list, getById, update, remove };
