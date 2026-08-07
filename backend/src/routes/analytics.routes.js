const { Router } = require("express");
const { authenticate, authenticatePartyAdmin } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const ctrl = require("../controllers/analytics.controller");

const router = Router();

// Both citizens and admins hit this endpoint — the controller itself scopes by actor type
// (citizens see only their own complaints, admins see their jurisdiction), so no authorize() gate here.
router.get("/dashboard", authenticate, ctrl.dashboard);
router.get("/global", authenticate, authorize("SUPER_ADMIN"), ctrl.globalOverview);
router.get("/members", authenticatePartyAdmin, ctrl.memberOverview);
router.get("/party-overview", authenticatePartyAdmin, ctrl.partyOverview);

module.exports = router;
