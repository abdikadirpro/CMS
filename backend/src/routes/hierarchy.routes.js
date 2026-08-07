const { Router } = require("express");
const { authenticate, authenticatePartyAdmin } = require("../middleware/auth");
const { authorize, authorizePartyAdmin } = require("../middleware/rbac");
const { zones, districts, townAdministrations, offices, categories, partyBranches } = require("../controllers/hierarchy.controller");

function buildRouter(handlers, { writeRoles = ["SUPER_ADMIN"] } = {}) {
  const router = Router();
  // Reference data (zones/districts/offices/categories/etc.) is public so the
  // public complaint submission form can populate its dropdowns for anonymous/guest users.
  router.get("/", handlers.list);
  router.get("/:id", handlers.getById);
  router.post("/", authenticate, authorize(...writeRoles), handlers.create);
  router.patch("/:id", authenticate, authorize(...writeRoles), handlers.update);
  router.delete("/:id", authenticate, authorize(...writeRoles), handlers.remove);
  return router;
}

// Party branches are Xisbiga Barwaaqo's own resource — writes go through the separate
// PartyAdmin identity, not the complaint-system Admin/authorize() pipeline. Restricted to
// Party Super Admin, same as branch management was SUPER_ADMIN-only before independence.
function buildPartyAdminRouter(handlers) {
  const router = Router();
  router.get("/", handlers.list);
  router.get("/:id", handlers.getById);
  router.post("/", authenticatePartyAdmin, authorizePartyAdmin("PARTY_SUPER_ADMIN"), handlers.create);
  router.patch("/:id", authenticatePartyAdmin, authorizePartyAdmin("PARTY_SUPER_ADMIN"), handlers.update);
  router.delete("/:id", authenticatePartyAdmin, authorizePartyAdmin("PARTY_SUPER_ADMIN"), handlers.remove);
  return router;
}

const zonesRouter = buildRouter(zones, { writeRoles: ["SUPER_ADMIN"] });
const districtsRouter = buildRouter(districts, { writeRoles: ["SUPER_ADMIN", "ZONE_ADMIN"] });
const townAdministrationsRouter = buildRouter(townAdministrations, { writeRoles: ["SUPER_ADMIN"] });
const officesRouter = buildRouter(offices, { writeRoles: ["SUPER_ADMIN"] });
const categoriesRouter = buildRouter(categories, { writeRoles: ["SUPER_ADMIN"] });
const partyBranchesRouter = buildPartyAdminRouter(partyBranches);

module.exports = {
  zonesRouter, districtsRouter, townAdministrationsRouter, officesRouter, categoriesRouter, partyBranchesRouter,
};
