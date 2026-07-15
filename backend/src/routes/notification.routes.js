const { Router } = require("express");
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/notification.controller");

const router = Router();

router.get("/", authenticate, ctrl.list);
router.patch("/:id/read", authenticate, ctrl.markRead);
router.patch("/read-all", authenticate, ctrl.markAllRead);
router.delete("/read", authenticate, ctrl.clearRead);

module.exports = router;
