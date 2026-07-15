const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const ctrl = require("../controllers/activityLog.controller");

const router = Router();

router.get("/", authenticate, authorize("SUPER_ADMIN"), ctrl.list);

module.exports = router;
