const prisma = require("../config/db");
const { success } = require("../utils/apiResponse");

async function list(req, res, next) {
  try {
    const { actorType, action, page = 1, pageSize = 30 } = req.query;
    const take = Math.min(parseInt(pageSize, 10) || 30, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = {};
    if (actorType) where.actorType = actorType;
    if (action) where.action = { contains: action, mode: "insensitive" };

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
      prisma.activityLog.count({ where }),
    ]);

    return success(res, { data: items, meta: { total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take) } });
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
