const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const ctrl = require("../controllers/backup.controller");

const router = Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/", ctrl.list);
router.post("/", ctrl.create);
router.get("/:fileName/download", ctrl.download);

module.exports = router;
