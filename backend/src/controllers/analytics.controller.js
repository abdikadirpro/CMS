const { Prisma } = require("@prisma/client");
const prisma = require("../config/db");
const { success } = require("../utils/apiResponse");
const { scopeForAdmin } = require("../middleware/rbac");
const { STATUS_BUCKET_MAP, getSubmissionTokenStatus } = require("../services/complaint.service");

const ALL_STATUSES = Object.keys(STATUS_BUCKET_MAP);

/** Mirrors the Prisma `where` scope as a raw-SQL fragment, since the trend query can't take a Prisma `where` object. */
function scopeConditionSql(where) {
  if (where.districtId) return Prisma.sql`AND "districtId" = ${where.districtId}`;
  if (where.zoneId) return Prisma.sql`AND "zoneId" = ${where.zoneId}`;
  if (where.townAdministrationId) return Prisma.sql`AND "townAdministrationId" = ${where.townAdministrationId}`;
  if (where.officeId) return Prisma.sql`AND "officeId" = ${where.officeId}`;
  if (where.submitterId) return Prisma.sql`AND "submitterId" = ${where.submitterId}`;
  if (where.id) return Prisma.sql`AND "id" = ${where.id}`;
  return Prisma.sql``;
}

async function dashboard(req, res, next) {
  try {
    const where = req.actor.type === "ADMIN" ? scopeForAdmin(req.actor) : { submitterId: req.actor.id };

    const [statusCounts, total, categoryCounts, last30Days] = await Promise.all([
      prisma.complaint.groupBy({ by: ["status"], where, _count: { _all: true } }),
      prisma.complaint.count({ where }),
      prisma.complaint.groupBy({ by: ["categoryId"], where, _count: { _all: true } }),
      prisma.$queryRaw`
        SELECT DATE("createdAt") AS date, COUNT(*)::int AS count
        FROM complaints
        WHERE "createdAt" >= NOW() - INTERVAL '30 days'
        ${scopeConditionSql(where)}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
    ]);

    const statusMap = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0]));
    statusCounts.forEach((row) => {
      statusMap[row.status] = row._count._all;
    });

    const buckets = {
      pending: 0, inProgress: 0, waiting: 0, solved: 0, transferred: 0, rejected: 0, escalated: 0,
    };
    Object.entries(statusMap).forEach(([status, count]) => {
      buckets[STATUS_BUCKET_MAP[status]] += count;
    });

    const categories = await prisma.category.findMany();
    const categoryLabelMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));
    const categoryBreakdown = categoryCounts.map((row) => ({
      category: row.categoryId ? categoryLabelMap[row.categoryId] || "Unknown" : "Uncategorized",
      count: row._count._all,
    }));

    const tokens = req.actor.type === "USER" ? await getSubmissionTokenStatus(req.actor.id) : undefined;

    return success(res, {
      data: {
        total,
        statusBreakdown: statusMap,
        caseBuckets: buckets,
        categoryBreakdown,
        trend: last30Days,
        tokens,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function globalOverview(req, res, next) {
  try {
    const [zoneBreakdown, adminCounts, userCount, complaintCount, zoneCount, districtCount, townAdministrationCount, officeCount] =
      await Promise.all([
        prisma.complaint.groupBy({ by: ["zoneId"], _count: { _all: true } }),
        prisma.admin.groupBy({ by: ["adminType"], _count: { _all: true } }),
        prisma.user.count(),
        prisma.complaint.count(),
        // Counted directly rather than derived from the complaint groupBy above, which would
        // silently undercount — a zone/district/etc. with zero complaints so far still exists.
        prisma.zone.count(),
        prisma.district.count(),
        prisma.townAdministration.count(),
        prisma.office.count(),
      ]);

    const zones = await prisma.zone.findMany();
    const zoneLabelMap = Object.fromEntries(zones.map((z) => [z.id, z.name]));

    return success(res, {
      data: {
        userCount,
        complaintCount,
        zoneCount,
        districtCount,
        townAdministrationCount,
        officeCount,
        adminCounts: Object.fromEntries(adminCounts.map((a) => [a.adminType, a._count._all])),
        zoneBreakdown: zoneBreakdown.map((row) => ({
          zone: row.zoneId ? zoneLabelMap[row.zoneId] || "Unknown" : "Unassigned",
          count: row._count._all,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { dashboard, globalOverview };
