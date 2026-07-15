const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");
const ctrl = require("../controllers/user.controller");

const router = Router();

router.get("/", authenticate, authorize(), ctrl.listForAdmin);

router.patch("/profile", authenticate, [body("fullName").optional().trim().notEmpty()], validate, ctrl.updateProfile);
router.patch(
  "/change-password",
  authenticate,
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 8 })],
  validate,
  ctrl.changePassword
);

module.exports = router;
