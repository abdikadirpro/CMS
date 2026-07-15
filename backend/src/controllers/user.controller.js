const prisma = require("../config/db");
const { success } = require("../utils/apiResponse");
const { sanitizeUser, hashPassword, comparePassword } = require("../services/auth.service");
const { ApiError } = require("../utils/apiResponse");
const { scopeForAdmin } = require("../middleware/rbac");

/** Citizen directory visible to admins — scoped to citizens who have filed a complaint in the admin's jurisdiction. */
async function listForAdmin(req, res, next) {
  try {
    const { search, page = 1, pageSize = 20 } = req.query;
    const take = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    let where = {};
    if (req.actor.adminType !== "SUPER_ADMIN") {
      const scopedComplaints = await prisma.complaint.findMany({
        where: { ...scopeForAdmin(req.actor), submitterId: { not: null } },
        select: { submitterId: true },
        distinct: ["submitterId"],
      });
      where.id = { in: scopedComplaints.map((c) => c.submitterId) };
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, fullName: true, email: true, phone: true, isActive: true, createdAt: true, _count: { select: { complaints: true } } },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.user.count({ where }),
    ]);

    return success(res, { data: items, meta: { total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take) } });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    const { fullName, phone, idNumber } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.actor.id },
      data: { fullName, phone, idNumber },
    });
    return success(res, { message: "Profile updated", data: sanitizeUser(updated) });
  } catch (err) {
    next(err);
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.actor.id } });
    const matches = await comparePassword(currentPassword, user.passwordHash);
    if (!matches) throw new ApiError(400, "Current password is incorrect");

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    return success(res, { message: "Password changed" });
  } catch (err) {
    next(err);
  }
}

module.exports = { updateProfile, changePassword, listForAdmin };
