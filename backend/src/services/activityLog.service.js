const prisma = require("../config/db");

async function logActivity({ actor, action, targetType, targetId, metadata, ipAddress }) {
  return prisma.activityLog.create({
    data: {
      actorId: actor?.id ?? null,
      actorType: actor ? actor.type : "SYSTEM",
      actorName: actor?.fullName ?? "System",
      action,
      targetType,
      targetId,
      metadata,
      ipAddress,
    },
  });
}

module.exports = { logActivity };
