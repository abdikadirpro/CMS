const prisma = require("../config/db");
const { ApiError, success } = require("../utils/apiResponse");
const { createUniqueMembershipNumber, isEligibleForApproval, getEligibleAt } = require("../services/member.service");
const { scopeForPartyAdmin } = require("../middleware/rbac");
const { hashPassword } = require("../services/auth.service");
const { logActivity } = require("../services/activityLog.service");

const ID_DOC_URL_PREFIX = "/uploads/members";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

function oneYearFrom(date) {
  return new Date(date.getTime() + ONE_YEAR_MS);
}

// Strips self-service-auth internals (password hash, reset token, lockout state) — party admins
// managing members should never see these in list/detail/approve/reject responses.
function serializeMember(member) {
  const { passwordHash, resetTokenHash, resetTokenExpiresAt, failedLoginAttempts, lockedUntil, ...safe } = member;
  return {
    ...safe,
    eligibleAt: getEligibleAt(member),
    idDocumentUrl: member.idDocumentPath ? `${ID_DOC_URL_PREFIX}/${member.idDocumentPath.split(/[\\/]/).pop()}` : null,
  };
}

async function register(req, res, next) {
  try {
    const { fullName, phone, email, idNumber, password, districtId, zoneId, townAdministrationId, officeId, partyBranchId } = req.body;

    if (!districtId && !zoneId && !townAdministrationId && !officeId) {
      throw new ApiError(422, "Please select a District, Zone, Town Administration, or Office");
    }

    const existing = await prisma.member.findUnique({ where: { email } });
    if (existing) throw new ApiError(409, "A member account with this email already exists");

    const membershipNumber = await createUniqueMembershipNumber();
    const passwordHash = await hashPassword(password);

    const member = await prisma.member.create({
      data: {
        membershipNumber,
        fullName,
        phone,
        email,
        idNumber,
        passwordHash,
        idDocumentPath: req.file ? req.file.path : null,
        districtId: districtId || null,
        zoneId: zoneId || null,
        townAdministrationId: townAdministrationId || null,
        officeId: officeId || null,
        partyBranchId: partyBranchId || null,
      },
    });

    await logActivity({
      actor: null,
      action: "MEMBER_REGISTERED",
      targetType: "Member",
      targetId: member.id,
      ipAddress: req.ip,
    });

    return success(res, {
      statusCode: 201,
      message: "Registration received. You'll be eligible for full membership after 6 months, pending admin approval.",
      data: { membershipNumber: member.membershipNumber, id: member.id },
    });
  } catch (err) {
    next(err);
  }
}

/** Public lookup by membership number — mirrors complaint.controller.js's getByTrackingId, but
 * keeps sensitive PII (ID number, ID document, phone, email) out of the public response since a
 * membership number is easier to guess/share than a complaint tracking ID. */
async function trackByMembershipNumber(req, res, next) {
  try {
    const member = await prisma.member.findUnique({
      where: { membershipNumber: req.params.membershipNumber },
      select: {
        membershipNumber: true,
        fullName: true,
        status: true,
        rejectionReason: true,
        createdAt: true,
        probationStartedAt: true,
        membershipExpiresAt: true,
        zone: { select: { name: true } },
        district: { select: { name: true } },
        townAdministration: { select: { name: true } },
        office: { select: { name: true } },
        partyBranch: { select: { name: true } },
      },
    });
    if (!member) throw new ApiError(404, "No membership found with that number");

    return success(res, { data: { ...member, eligibleAt: getEligibleAt(member) } });
  } catch (err) {
    next(err);
  }
}

/** A member's own dashboard — unlike the public tracker above, this is authenticated and can
 * safely include phone/email so "Update My Information" has values to pre-fill and edit. */
async function getOwnProfile(req, res, next) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.actor.id },
      include: { zone: true, district: true, townAdministration: true, office: true, partyBranch: true },
    });
    if (!member) throw new ApiError(404, "Member not found");

    return success(res, { data: serializeMember(member) });
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
        { membershipNumber: { contains: search, mode: "insensitive" } },
        { idNumber: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.member.findMany({
        where,
        include: { zone: true, district: true, townAdministration: true, office: true, partyBranch: true, reviewedBy: { select: { id: true, fullName: true } } },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.member.count({ where }),
    ]);

    return success(res, {
      data: items.map(serializeMember),
      meta: { total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take) },
    });
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: { zone: true, district: true, townAdministration: true, office: true, partyBranch: true, reviewedBy: { select: { id: true, fullName: true } } },
    });
    if (!member) throw new ApiError(404, "Member not found");

    if (req.actor.partyAdminType !== "PARTY_SUPER_ADMIN") {
      const scope = scopeForPartyAdmin(req.actor);
      const [key, value] = Object.entries(scope)[0] || [];
      if (key && member[key] !== value) {
        throw new ApiError(403, "This member is outside your jurisdiction");
      }
    }

    return success(res, { data: serializeMember(member) });
  } catch (err) {
    next(err);
  }
}

/** Application review step: PENDING -> PROBATIONARY. Starts the 6-month probation clock. */
async function approve(req, res, next) {
  try {
    const member = await prisma.member.findUnique({ where: { id: req.params.id } });
    if (!member) throw new ApiError(404, "Member not found");

    if (req.actor.partyAdminType !== "PARTY_SUPER_ADMIN") {
      const scope = scopeForPartyAdmin(req.actor);
      const [key, value] = Object.entries(scope)[0] || [];
      if (key && member[key] !== value) {
        throw new ApiError(403, "This member is outside your jurisdiction");
      }
    }

    if (member.status !== "PENDING") {
      throw new ApiError(400, "This application has already been reviewed");
    }

    const updated = await prisma.member.update({
      where: { id: member.id },
      data: { status: "PROBATIONARY", probationStartedAt: new Date(), reviewedById: req.actor.id, reviewedAt: new Date() },
    });

    await logActivity({
      actor: { type: "PARTY_ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "MEMBER_APPROVED",
      targetType: "Member",
      targetId: member.id,
    });

    return success(res, { message: "Application approved — member is now in the 6-month probation period", data: serializeMember(updated) });
  } catch (err) {
    next(err);
  }
}

/** Final membership approval: PROBATIONARY -> FULL, gated on the 6-month probation clock. */
async function finalize(req, res, next) {
  try {
    const member = await prisma.member.findUnique({ where: { id: req.params.id } });
    if (!member) throw new ApiError(404, "Member not found");

    if (req.actor.partyAdminType !== "PARTY_SUPER_ADMIN") {
      const scope = scopeForPartyAdmin(req.actor);
      const [key, value] = Object.entries(scope)[0] || [];
      if (key && member[key] !== value) {
        throw new ApiError(403, "This member is outside your jurisdiction");
      }
    }

    if (member.status !== "PROBATIONARY") {
      throw new ApiError(400, "This member is not currently in probation");
    }
    // Party Super Admin can override the 6-month wait; every other party admin type must respect it.
    if (req.actor.partyAdminType !== "PARTY_SUPER_ADMIN" && !isEligibleForApproval(member)) {
      throw new ApiError(400, `Not yet eligible. This member becomes eligible for full membership on ${getEligibleAt(member).toDateString()}.`);
    }

    const updated = await prisma.member.update({
      where: { id: member.id },
      data: {
        status: "FULL",
        reviewedById: req.actor.id,
        reviewedAt: new Date(),
        membershipExpiresAt: member.membershipExpiresAt || oneYearFrom(new Date()),
      },
    });

    await logActivity({
      actor: { type: "PARTY_ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "MEMBER_FINALIZED",
      targetType: "Member",
      targetId: member.id,
    });

    return success(res, { message: "Member confirmed as a full member", data: serializeMember(updated) });
  } catch (err) {
    next(err);
  }
}

async function reject(req, res, next) {
  try {
    const { reason } = req.body;
    const member = await prisma.member.findUnique({ where: { id: req.params.id } });
    if (!member) throw new ApiError(404, "Member not found");

    if (req.actor.partyAdminType !== "PARTY_SUPER_ADMIN") {
      const scope = scopeForPartyAdmin(req.actor);
      const [key, value] = Object.entries(scope)[0] || [];
      if (key && member[key] !== value) {
        throw new ApiError(403, "This member is outside your jurisdiction");
      }
    }

    if (member.status !== "PENDING") {
      throw new ApiError(400, "This member has already been reviewed");
    }

    const updated = await prisma.member.update({
      where: { id: member.id },
      data: { status: "REJECTED", reviewedById: req.actor.id, reviewedAt: new Date(), rejectionReason: reason },
    });

    await logActivity({
      actor: { type: "PARTY_ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "MEMBER_REJECTED",
      targetType: "Member",
      targetId: member.id,
      metadata: { reason },
    });

    return success(res, { message: "Member registration rejected", data: serializeMember(updated) });
  } catch (err) {
    next(err);
  }
}

const UPDATABLE_FIELDS = [
  "fullName", "phone", "email", "idNumber", "status",
  "zoneId", "districtId", "townAdministrationId", "officeId", "partyBranchId", "rejectionReason",
];

// Optional foreign-key/select fields submit "" when left unselected — Prisma needs null, not "".
function sanitizeBody(body) {
  return Object.fromEntries(
    UPDATABLE_FIELDS.filter((key) => key in body).map((key) => [key, body[key] === "" ? null : body[key]])
  );
}

/** Full edit of any member, including directly overriding status. */
async function update(req, res, next) {
  try {
    const member = await prisma.member.findUnique({ where: { id: req.params.id } });
    if (!member) throw new ApiError(404, "Member not found");

    const data = sanitizeBody(req.body);
    // A direct status override is an admin decision same as Approve/Reject — stamp the reviewer
    // so it shows up in the audit trail the same way.
    if (data.status && data.status !== member.status) {
      data.reviewedById = req.actor.id;
      data.reviewedAt = new Date();
      // Overriding straight into PROBATIONARY (skipping the normal approve() step) still needs
      // the probation clock started, or eligibility for full membership could never compute.
      if (data.status === "PROBATIONARY" && !member.probationStartedAt) {
        data.probationStartedAt = new Date();
      }
      // Same for FULL — an admin overriding status directly still needs a renewal clock started.
      if (data.status === "FULL" && !member.membershipExpiresAt) {
        data.membershipExpiresAt = oneYearFrom(new Date());
      }
    }

    const updated = await prisma.member.update({ where: { id: member.id }, data });

    await logActivity({
      actor: { type: "PARTY_ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "MEMBER_UPDATED",
      targetType: "Member",
      targetId: member.id,
    });

    return success(res, { message: "Member updated", data: serializeMember(updated) });
  } catch (err) {
    next(err);
  }
}

/** Permanently remove a member registration. */
async function remove(req, res, next) {
  try {
    const member = await prisma.member.findUnique({ where: { id: req.params.id } });
    if (!member) throw new ApiError(404, "Member not found");

    await prisma.member.delete({ where: { id: member.id } });

    await logActivity({
      actor: { type: "PARTY_ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "MEMBER_DELETED",
      targetType: "Member",
      targetId: member.id,
    });

    return success(res, { message: "Member deleted" });
  } catch (err) {
    next(err);
  }
}

/** A member editing their own contact details from their own dashboard. */
async function updateOwnProfile(req, res, next) {
  try {
    const { fullName, phone, email } = req.body;
    const data = {};
    if (fullName !== undefined) data.fullName = fullName;
    if (phone !== undefined) data.phone = phone;
    if (email !== undefined && email !== req.actor.email) {
      const existing = await prisma.member.findUnique({ where: { email } });
      if (existing) throw new ApiError(409, "A member account with this email already exists");
      data.email = email;
    }

    const updated = await prisma.member.update({ where: { id: req.actor.id }, data });

    await logActivity({
      actor: { type: "MEMBER", id: req.actor.id, fullName: updated.fullName },
      action: "MEMBER_PROFILE_UPDATED",
      targetType: "Member",
      targetId: req.actor.id,
    });

    return success(res, { message: "Profile updated", data: serializeMember(updated) });
  } catch (err) {
    next(err);
  }
}

/** A Full Member extending their own membership by a year from their own dashboard. */
async function renewOwnMembership(req, res, next) {
  try {
    if (req.actor.status !== "FULL") {
      throw new ApiError(400, "Only full members can renew their membership");
    }
    const base = req.actor.membershipExpiresAt && req.actor.membershipExpiresAt > new Date()
      ? req.actor.membershipExpiresAt
      : new Date();
    const membershipExpiresAt = oneYearFrom(base);

    const updated = await prisma.member.update({ where: { id: req.actor.id }, data: { membershipExpiresAt } });

    await logActivity({
      actor: { type: "MEMBER", id: req.actor.id, fullName: req.actor.fullName },
      action: "MEMBER_RENEWED",
      targetType: "Member",
      targetId: req.actor.id,
    });

    return success(res, { message: "Membership renewed", data: serializeMember(updated) });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register, trackByMembershipNumber, list, getById, approve, finalize, reject, update, remove,
  getOwnProfile, updateOwnProfile, renewOwnMembership,
};
