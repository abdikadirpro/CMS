const prisma = require("../config/db");
const { ApiError, success } = require("../utils/apiResponse");
const {
  createUniqueTrackingId,
  resolveJurisdictionFromLocation,
  assertSubmissionAllowed,
  assertGuestSubmissionAllowed,
  getEscalationStatus,
} = require("../services/complaint.service");
const { scopeForAdmin } = require("../middleware/rbac");
const { isValidTransferTarget } = require("../services/jurisdiction.service");
const { notify, notifyMany } = require("../services/notification.service");
const { emitToJurisdiction } = require("../sockets/index");
const { logActivity } = require("../services/activityLog.service");

const ATTACHMENT_URL_PREFIX = "/uploads/complaints";

function serializeComplaint(complaint) {
  return {
    ...complaint,
    attachments: complaint.attachments?.map((a) => ({
      ...a,
      url: `${ATTACHMENT_URL_PREFIX}/${a.filePath.split(/[\\/]/).pop()}`,
    })),
  };
}

async function create(req, res, next) {
  try {
    const {
      title,
      description,
      categoryId,
      location,
      officeId,
      districtId,
      zoneId,
      townAdministrationId,
      isAnonymous,
      guestFullName,
      guestEmail,
      guestPhone,
      guestOffice,
      guestJobTitle,
      guestIdNumber,
    } = req.body;

    // "Where did this happen?" is satisfied by a District, Zone, or Town Administration — or,
    // for regional-level issues with no specific sub-jurisdiction, an Office directly (Office
    // Admins report straight to Super Admin, same as Zone/District/Town Administration admins).
    if (!districtId && !zoneId && !townAdministrationId && !officeId) {
      throw new ApiError(422, "Please select where this complaint occurred (a District, Zone, Town Administration, or Office)");
    }

    const anonymous = isAnonymous === "true" || isAnonymous === true;
    const submitterId = !anonymous && req.actor?.type === "USER" ? req.actor.id : null;
    // Guest identity fields matter whenever the complaint isn't tied to a logged-in account
    // (anonymous submissions, or a guest who never registered) — not only when isAnonymous is set.
    const isGuestSubmission = !submitterId;

    // Check the logged-in actor's own submission history, not submitterId — an anonymous
    // submission from a logged-in account has submitterId=null but must still be rate-limited
    // against that account, or the "anonymous" checkbox would be an unlimited-submissions bypass.
    // A genuinely unauthenticated guest has no account to key that on, so fall back to their IP.
    if (req.actor?.type === "USER") await assertSubmissionAllowed(req.actor.id);
    else await assertGuestSubmissionAllowed(req.ip);

    const trackingId = await createUniqueTrackingId();

    let jurisdiction = {};
    if (districtId || zoneId || townAdministrationId) {
      jurisdiction = await resolveJurisdictionFromLocation({ districtId, zoneId, townAdministrationId });
      if (Object.keys(jurisdiction).length === 0) {
        throw new ApiError(422, "The selected District/Zone/Town Administration was not found");
      }
    } else if (officeId) {
      const office = await prisma.office.findUnique({ where: { id: officeId } });
      if (!office) throw new ApiError(422, "The selected Office was not found");
    }

    const files = req.files || [];

    const complaint = await prisma.complaint.create({
      data: {
        trackingId,
        title,
        description,
        location,
        categoryId: categoryId || null,
        officeId: officeId || null,
        isAnonymous: anonymous,
        submitterId,
        guestFullName: isGuestSubmission ? guestFullName : undefined,
        guestEmail: isGuestSubmission ? guestEmail : undefined,
        guestPhone: isGuestSubmission ? guestPhone : undefined,
        guestOffice,
        guestJobTitle,
        guestIdNumber,
        ...jurisdiction,
        attachments: {
          create: files.map((f) => ({
            fileName: f.originalname,
            filePath: f.path,
            mimeType: f.mimetype,
            fileSize: f.size,
          })),
        },
        statusHistory: {
          create: { toStatus: "PENDING", changedByType: submitterId ? "USER" : "SYSTEM", reason: "Complaint submitted" },
        },
      },
      include: { attachments: true },
    });

    await logActivity({
      actor: req.actor ? { type: req.actor.type, id: req.actor.id, fullName: req.actor.fullName } : null,
      action: "COMPLAINT_CREATED",
      targetType: "Complaint",
      targetId: complaint.id,
      ipAddress: req.ip,
    });

    // Notify admins scoped to this jurisdiction that a new complaint has arrived
    const room = jurisdiction.districtId
      ? `admin:district:${jurisdiction.districtId}`
      : jurisdiction.zoneId
      ? `admin:zone:${jurisdiction.zoneId}`
      : jurisdiction.townAdministrationId
      ? `admin:town:${jurisdiction.townAdministrationId}`
      : officeId
      ? `admin:office:${officeId}`
      : "admin:super";
    emitToJurisdiction(room, "complaint:new", { id: complaint.id, trackingId: complaint.trackingId, title: complaint.title });

    return success(res, {
      statusCode: 201,
      message: "Complaint submitted successfully",
      data: { trackingId: complaint.trackingId, id: complaint.id },
    });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { status, categoryId, search, page = 1, pageSize = 20 } = req.query;
    const take = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (Math.max(parseInt(page, 10) || 1, 1) - 1) * take;

    let where = {};
    if (req.actor.type === "ADMIN") {
      where = { ...scopeForAdmin(req.actor) };
    } else {
      where = { submitterId: req.actor.id };
    }

    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { trackingId: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.complaint.findMany({
        where,
        include: { category: true, office: true, assignedAdmin: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.complaint.count({ where }),
    ]);

    return success(res, {
      data: items,
      meta: { total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take) },
    });
  } catch (err) {
    next(err);
  }
}

// This is a public, unauthenticated endpoint — anyone with the tracking ID can call it, so the
// complainant's identity (guest name/email/phone/ID number) must never appear in this payload.
async function getByTrackingId(req, res, next) {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { trackingId: req.params.trackingId },
      select: {
        id: true,
        trackingId: true,
        title: true,
        description: true,
        location: true,
        status: true,
        isAnonymous: true,
        createdAt: true,
        updatedAt: true,
        category: true,
        office: { select: { name: true } },
        zone: { select: { name: true } },
        district: { select: { name: true } },
        townAdministration: { select: { name: true } },
        attachments: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    });
    if (!complaint) throw new ApiError(404, "No complaint found with that tracking ID");

    return success(res, { data: serializeComplaint(complaint) });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        office: true,
        zone: true,
        district: true,
        townAdministration: true,
        assignedAdmin: { select: { id: true, fullName: true, adminType: true } },
        attachments: true,
        notes: { include: { admin: { select: { id: true, fullName: true } } }, orderBy: { createdAt: "desc" } },
        statusHistory: { orderBy: { createdAt: "asc" } },
        transfers: { orderBy: { createdAt: "desc" } },
        submitter: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });
    if (!complaint) throw new ApiError(404, "Complaint not found");

    if (req.actor.type === "USER" && complaint.submitterId !== req.actor.id) {
      throw new ApiError(403, "You do not have access to this complaint");
    }
    if (req.actor.type === "ADMIN" && req.actor.adminType !== "SUPER_ADMIN") {
      const scope = scopeForAdmin(req.actor);
      const [key, value] = Object.entries(scope)[0] || [];
      if (key && complaint[key] !== value) {
        throw new ApiError(403, "This complaint is outside your jurisdiction");
      }
    }

    return success(res, { data: { ...serializeComplaint(complaint), escalation: getEscalationStatus(complaint) } });
  } catch (err) {
    next(err);
  }
}

async function updateStatus(req, res, next) {
  try {
    const { status, reason } = req.body;
    const complaint = await prisma.complaint.findUnique({ where: { id: req.params.id } });
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status,
        lastFeedbackAt: new Date(),
        statusHistory: {
          create: { fromStatus: complaint.status, toStatus: status, changedById: req.actor.id, changedByType: "ADMIN", reason },
        },
      },
    });

    await logActivity({
      actor: { type: "ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "COMPLAINT_STATUS_CHANGED",
      targetType: "Complaint",
      targetId: complaint.id,
      metadata: { from: complaint.status, to: status },
    });

    if (complaint.submitterId) {
      await notify({
        recipient: { type: "USER", id: complaint.submitterId },
        type: "STATUS_CHANGED",
        title: "Complaint status updated",
        message: `Your complaint "${complaint.title}" is now ${status.replace("_", " ").toLowerCase()}.`,
        link: `/app/complaints/${complaint.id}`,
      });
    }

    return success(res, { message: "Status updated", data: updated });
  } catch (err) {
    next(err);
  }
}

async function assign(req, res, next) {
  try {
    const { adminId } = req.body;
    const complaint = await prisma.complaint.findUnique({ where: { id: req.params.id } });
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const targetAdmin = await prisma.admin.findUnique({ where: { id: adminId } });
    if (!targetAdmin) throw new ApiError(404, "Target admin not found");

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        assignedAdminId: adminId,
        status: "ASSIGNED",
        lastFeedbackAt: new Date(),
        statusHistory: {
          create: { fromStatus: complaint.status, toStatus: "ASSIGNED", changedById: req.actor.id, changedByType: "ADMIN", reason: "Assigned to admin" },
        },
      },
    });

    await notify({
      recipient: { type: "ADMIN", id: adminId },
      type: "COMPLAINT_ASSIGNED",
      title: "New complaint assigned to you",
      message: `Complaint "${complaint.title}" (${complaint.trackingId}) has been assigned to you.`,
      link: `/app/complaints/${complaint.id}`,
    });

    return success(res, { message: "Complaint assigned", data: updated });
  } catch (err) {
    next(err);
  }
}

async function transfer(req, res, next) {
  try {
    const { toAdminId, toOfficeName, reason } = req.body;
    const complaint = await prisma.complaint.findUnique({ where: { id: req.params.id }, include: { office: true } });
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const toAdmin = toAdminId ? await prisma.admin.findUnique({ where: { id: toAdminId } }) : null;
    if (!isValidTransferTarget(complaint, toAdmin)) {
      throw new ApiError(403, "You can only transfer this complaint to its own zone, within its current jurisdiction, or to the Super Admin.");
    }

    const [updated] = await prisma.$transaction([
      prisma.complaint.update({
        where: { id: complaint.id },
        data: {
          status: "TRANSFERRED",
          assignedAdminId: toAdmin?.id ?? complaint.assignedAdminId,
          zoneId: toAdmin?.zoneId ?? complaint.zoneId,
          districtId: toAdmin?.districtId ?? complaint.districtId,
          townAdministrationId: toAdmin?.townAdministrationId ?? complaint.townAdministrationId,
          officeId: toAdmin?.officeId ?? complaint.officeId,
          currentLevelEnteredAt: new Date(),
          lastFeedbackAt: null,
          escalatedTo: null,
          statusHistory: {
            create: { fromStatus: complaint.status, toStatus: "TRANSFERRED", changedById: req.actor.id, changedByType: "ADMIN", reason },
          },
          transfers: {
            create: {
              fromAdminId: req.actor.id,
              toAdminId: toAdmin?.id ?? null,
              fromOfficeName: complaint.office?.name ?? null,
              toOfficeName: toOfficeName ?? null,
              reason,
            },
          },
        },
      }),
    ]);

    if (toAdmin) {
      await notify({
        recipient: { type: "ADMIN", id: toAdmin.id },
        type: "COMPLAINT_TRANSFERRED",
        title: "A complaint has been transferred to you",
        message: `Complaint "${complaint.title}" (${complaint.trackingId}) was transferred to you.`,
        link: `/app/complaints/${complaint.id}`,
      });
    }
    if (complaint.submitterId) {
      await notify({
        recipient: { type: "USER", id: complaint.submitterId },
        type: "COMPLAINT_TRANSFERRED",
        title: "Your complaint was transferred",
        message: `Your complaint "${complaint.title}" was transferred to another office for handling.`,
        link: `/app/complaints/${complaint.id}`,
      });
    }

    return success(res, { message: "Complaint transferred", data: updated });
  } catch (err) {
    next(err);
  }
}

/** Citizen-initiated escalation: moves the submitter's own unanswered complaint one level up (District -> Zone -> Super Admin) once its 10-day window has passed with no admin response. */
async function escalate(req, res, next) {
  try {
    const complaint = await prisma.complaint.findUnique({ where: { id: req.params.id } });
    if (!complaint) throw new ApiError(404, "Complaint not found");
    if (req.actor.type !== "USER" || complaint.submitterId !== req.actor.id) {
      throw new ApiError(403, "Only the citizen who filed this complaint can escalate it");
    }

    const { canEscalate, nextLevel } = getEscalationStatus(complaint);
    if (!canEscalate) throw new ApiError(400, "This complaint is not yet eligible for escalation");

    const nextLevelLabel = nextLevel === "ZONE_ADMIN" ? "Zone Office" : "Regional Office (Super Admin)";
    const currentLevelLabel = complaint.escalatedTo === "ZONE_ADMIN" ? "Zone" : complaint.districtId ? "District" : "Zone";
    const reason = `Auto-escalated by citizen after 10 days with no response from the ${currentLevelLabel} office`;

    const updated = await prisma.complaint.update({
      where: { id: complaint.id },
      data: {
        status: "ESCALATED",
        escalatedTo: nextLevel,
        assignedAdminId: null,
        currentLevelEnteredAt: new Date(),
        lastFeedbackAt: null,
        statusHistory: {
          create: { fromStatus: complaint.status, toStatus: "ESCALATED", changedById: req.actor.id, changedByType: "USER", reason },
        },
        transfers: {
          create: { fromAdminId: null, toAdminId: null, toOfficeName: nextLevelLabel, reason },
        },
      },
    });

    const recipients =
      nextLevel === "ZONE_ADMIN"
        ? await prisma.admin.findMany({ where: { adminType: "ZONE_ADMIN", zoneId: complaint.zoneId } })
        : await prisma.admin.findMany({ where: { adminType: "SUPER_ADMIN" } });

    await notifyMany(
      recipients.map((a) => ({ type: "ADMIN", id: a.id })),
      {
        type: "COMPLAINT_TRANSFERRED",
        title: "A complaint was escalated to you",
        message: `Complaint "${complaint.title}" (${complaint.trackingId}) was escalated after 10 days with no response.`,
        link: `/app/complaints/${complaint.id}`,
      }
    );

    await notify({
      recipient: { type: "USER", id: req.actor.id },
      type: "COMPLAINT_TRANSFERRED",
      title: "Your complaint was escalated",
      message: `Your complaint "${complaint.title}" was escalated to the ${nextLevelLabel} after 10 days with no response.`,
      link: `/app/complaints/${complaint.id}`,
    });

    return success(res, { message: "Complaint escalated", data: updated });
  } catch (err) {
    next(err);
  }
}

async function addNote(req, res, next) {
  try {
    const { content } = req.body;
    const complaint = await prisma.complaint.findUnique({ where: { id: req.params.id } });
    if (!complaint) throw new ApiError(404, "Complaint not found");

    const note = await prisma.complaintNote.create({
      data: { complaintId: complaint.id, adminId: req.actor.id, content },
      include: { admin: { select: { id: true, fullName: true } } },
    });

    return success(res, { statusCode: 201, message: "Note added", data: note });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getByTrackingId, getById, updateStatus, assign, transfer, escalate, addNote };
