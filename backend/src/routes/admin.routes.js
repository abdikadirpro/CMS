const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");
const ctrl = require("../controllers/admin.controller");

const router = Router();

// Available to any authenticated admin — used to pick assign/transfer targets, or manage their own profile.
router.get("/directory", authenticate, authorize(), ctrl.directory);
router.patch("/me/profile", authenticate, authorize(), [body("fullName").optional().trim().notEmpty()], validate, ctrl.updateOwnProfile);
router.patch(
  "/me/password",
  authenticate,
  authorize(),
  [body("currentPassword").notEmpty(), body("newPassword").isLength({ min: 8 })],
  validate,
  ctrl.changeOwnPassword
);

router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/", ctrl.list);
router.get("/:id", ctrl.getById);
router.post(
  "/",
  [
    body("fullName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("adminType").isIn(["SUPER_ADMIN", "ZONE_ADMIN", "TOWN_ADMIN", "DISTRICT_ADMIN", "OFFICE_ADMIN"]),
  ],
  validate,
  ctrl.create
);
router.patch("/:id", ctrl.update);
router.patch("/:id/password", [body("newPassword").isLength({ min: 8 })], validate, ctrl.resetAdminPassword);
router.delete("/:id", ctrl.remove);

module.exports = router;
