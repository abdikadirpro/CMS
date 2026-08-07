const prisma = require("../config/db");
const { ApiError, success } = require("../utils/apiResponse");
const { logActivity } = require("../services/activityLog.service");

// Optional foreign-key <select> fields submit "" when left unselected — Prisma needs null, not "".
// Also whitelists to only the fields this resource actually allows writing — the frontend's edit
// form resets from the full fetched record (including relations/_count/createdAt), and blindly
// forwarding req.body to Prisma would choke on those extra keys.
function sanitizeBody(body, allowedFields) {
  return Object.fromEntries(
    allowedFields
      .filter((key) => key in body)
      .map((key) => [key, body[key] === "" ? null : body[key]])
  );
}

function crudFor(model, { includeCounts, editableFields = ["name"] } = {}) {
  return {
    async list(req, res, next) {
      try {
        const items = await prisma[model].findMany({
          orderBy: { name: "asc" },
          include: includeCounts ? includeCounts() : undefined,
        });
        return success(res, { data: items });
      } catch (err) {
        next(err);
      }
    },
    async getById(req, res, next) {
      try {
        const item = await prisma[model].findUnique({ where: { id: req.params.id } });
        if (!item) throw new ApiError(404, "Not found");
        return success(res, { data: item });
      } catch (err) {
        next(err);
      }
    },
    async create(req, res, next) {
      try {
        const item = await prisma[model].create({ data: sanitizeBody(req.body, editableFields) });
        await logActivity({
          actor: { type: req.actor.type, id: req.actor.id, fullName: req.actor.fullName },
          action: `${model.toUpperCase()}_CREATED`,
          targetType: model,
          targetId: item.id,
        });
        return success(res, { statusCode: 201, message: "Created", data: item });
      } catch (err) {
        next(err);
      }
    },
    async update(req, res, next) {
      try {
        const item = await prisma[model].update({ where: { id: req.params.id }, data: sanitizeBody(req.body, editableFields) });
        await logActivity({
          actor: { type: req.actor.type, id: req.actor.id, fullName: req.actor.fullName },
          action: `${model.toUpperCase()}_UPDATED`,
          targetType: model,
          targetId: item.id,
        });
        return success(res, { message: "Updated", data: item });
      } catch (err) {
        next(err);
      }
    },
    async remove(req, res, next) {
      try {
        await prisma[model].delete({ where: { id: req.params.id } });
        await logActivity({
          actor: { type: req.actor.type, id: req.actor.id, fullName: req.actor.fullName },
          action: `${model.toUpperCase()}_DELETED`,
          targetType: model,
          targetId: req.params.id,
        });
        return success(res, { message: "Deleted" });
      } catch (err) {
        next(err);
      }
    },
  };
}

const zones = crudFor("zone", {
  includeCounts: () => ({ _count: { select: { districts: true, admins: true, complaints: true } } }),
  editableFields: ["name"],
});
const districts = crudFor("district", {
  includeCounts: () => ({ zone: true, _count: { select: { admins: true, complaints: true } } }),
  editableFields: ["name", "zoneId"],
});
const townAdministrations = crudFor("townAdministration", {
  includeCounts: () => ({ _count: { select: { admins: true, complaints: true } } }),
  editableFields: ["name"],
});
const offices = crudFor("office", {
  includeCounts: () => ({ zone: true, district: true, townAdministration: true, _count: { select: { admins: true, complaints: true } } }),
  editableFields: ["name", "zoneId", "districtId", "townAdministrationId"],
});
const categories = crudFor("category", { editableFields: ["name", "description"] });
const partyBranches = crudFor("partyBranch", {
  includeCounts: () => ({ _count: { select: { members: true } } }),
  editableFields: ["name"],
});

module.exports = { zones, districts, townAdministrations, offices, categories, partyBranches };
