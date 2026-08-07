const prisma = require("../config/db");
const { ApiError, success } = require("../utils/apiResponse");
const { scopeForPartyAdmin } = require("../middleware/rbac");
const { logActivity } = require("../services/activityLog.service");

const RECEIPT_URL_PREFIX = "/uploads/donations";

function serializeDonation(donation) {
  return {
    ...donation,
    receiptUrl: donation.receiptPath ? `${RECEIPT_URL_PREFIX}/${donation.receiptPath.split(/[\\/]/).pop()}` : null,
  };
}

async function register(req, res, next) {
  try {
    const { donorName, phone, email, amount, note, districtId, zoneId, townAdministrationId, officeId, partyBranchId } = req.body;

    if (!districtId && !zoneId && !townAdministrationId && !officeId) {
      throw new ApiError(422, "Please select a District, Zone, Town Administration, or Office");
    }

    const donation = await prisma.donation.create({
      data: {
        donorName,
        phone,
        email: email || null,
        amount,
        note: note || null,
        receiptPath: req.file ? req.file.path : null,
        districtId: districtId || null,
        zoneId: zoneId || null,
        townAdministrationId: townAdministrationId || null,
        officeId: officeId || null,
        partyBranchId: partyBranchId || null,
      },
    });

    await logActivity({
      actor: null,
      action: "DONATION_SUBMITTED",
      targetType: "Donation",
      targetId: donation.id,
      ipAddress: req.ip,
    });

    return success(res, {
      statusCode: 201,
      message: "Thank you for your support! A party admin will confirm your donation shortly.",
      data: { id: donation.id },
    });
  } catch (err) {
    next(err);
  }
}

/** Public status check for a donor tracking their own submission — deliberately excludes any
 * PII (name/phone/email/receipt) since the id alone is enough to look this up unauthenticated. */
async function getStatus(req, res, next) {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, createdAt: true, receiptPath: true },
    });
    if (!donation) throw new ApiError(404, "Donation not found");

    return success(res, {
      data: {
        id: donation.id,
        status: donation.status,
        createdAt: donation.createdAt,
        hasReceipt: Boolean(donation.receiptPath),
      },
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
        { donorName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.donation.findMany({
        where,
        include: { zone: true, district: true, townAdministration: true, office: true, partyBranch: true },
        orderBy: { createdAt: "desc" },
        take,
        skip,
      }),
      prisma.donation.count({ where }),
    ]);

    return success(res, {
      data: items.map(serializeDonation),
      meta: { total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take) },
    });
  } catch (err) {
    next(err);
  }
}

function assertInJurisdiction(actor, donation) {
  if (actor.partyAdminType === "PARTY_SUPER_ADMIN") return;
  const scope = scopeForPartyAdmin(actor);
  const [key, value] = Object.entries(scope)[0] || [];
  if (key && donation[key] !== value) {
    throw new ApiError(403, "This donation is outside your jurisdiction");
  }
}

async function update(req, res, next) {
  try {
    const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
    if (!donation) throw new ApiError(404, "Donation not found");
    assertInJurisdiction(req.actor, donation);

    const { status } = req.body;
    const updated = await prisma.donation.update({ where: { id: donation.id }, data: { status } });

    await logActivity({
      actor: { type: "PARTY_ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "DONATION_UPDATED",
      targetType: "Donation",
      targetId: donation.id,
    });

    return success(res, { message: "Donation updated", data: serializeDonation(updated) });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const donation = await prisma.donation.findUnique({ where: { id: req.params.id } });
    if (!donation) throw new ApiError(404, "Donation not found");

    await prisma.donation.delete({ where: { id: donation.id } });

    await logActivity({
      actor: { type: "PARTY_ADMIN", id: req.actor.id, fullName: req.actor.fullName },
      action: "DONATION_DELETED",
      targetType: "Donation",
      targetId: donation.id,
    });

    return success(res, { message: "Donation deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, getStatus, list, update, remove };
