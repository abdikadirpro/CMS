const prisma = require("../config/db");
const { success } = require("../utils/apiResponse");

function scopeForActor(actor) {
  return actor.type === "ADMIN" ? { adminId: actor.id } : { userId: actor.id };
}

async function list(req, res, next) {
  try {
    const { page = 1, pageSize = 20, unreadOnly } = req.query;
    const take = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    const where = { ...scopeForActor(req.actor), ...(unreadOnly === "true" ? { isRead: false } : {}) };

    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, take, skip }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...scopeForActor(req.actor), isRead: false } }),
    ]);

    return success(res, { data: items, meta: { total, unreadCount, page: Number(page), pageSize: take } });
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, ...scopeForActor(req.actor) },
      data: { isRead: true },
    });
    return success(res, { message: "Marked as read" });
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await prisma.notification.updateMany({ where: { ...scopeForActor(req.actor), isRead: false }, data: { isRead: true } });
    return success(res, { message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
}

async function clearRead(req, res, next) {
  try {
    const { count } = await prisma.notification.deleteMany({ where: { ...scopeForActor(req.actor), isRead: true } });
    return success(res, { message: `Cleared ${count} notification${count === 1 ? "" : "s"}` });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, markAllRead, clearRead };
