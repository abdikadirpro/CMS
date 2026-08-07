const { Router } = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticatePartyAdmin, authenticateMember } = require("../middleware/auth");
const { authorizePartyAdmin } = require("../middleware/rbac");
const { memberUpload } = require("../middleware/upload");
const ctrl = require("../controllers/member.controller");

const router = Router();

router.post(
  "/",
  memberUpload.single("idDocument"),
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("phone").trim().notEmpty().withMessage("Phone number is required"),
    body("email").isEmail().withMessage("A valid email is required").normalizeEmail(),
    body("idNumber").trim().notEmpty().withMessage("National ID is required"),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body().custom((_, { req }) => {
      if (!req.body.districtId && !req.body.zoneId && !req.body.townAdministrationId && !req.body.officeId) {
        throw new Error("Select a District, Zone, Town Administration, or Office");
      }
      return true;
    }),
  ],
  validate,
  ctrl.register
);

router.get("/track/:membershipNumber", ctrl.trackByMembershipNumber);

// Member self-service routes — must be registered before the generic "/:id" routes below, or
// Express would match "/me" as if "me" were an :id (same-level path, registration order wins).
router.get("/me", authenticateMember, ctrl.getOwnProfile);
router.patch(
  "/me",
  authenticateMember,
  [body("email").optional().isEmail().withMessage("A valid email is required").normalizeEmail()],
  validate,
  ctrl.updateOwnProfile
);
router.post("/me/renew", authenticateMember, ctrl.renewOwnMembership);

router.get("/", authenticatePartyAdmin, ctrl.list);
router.get("/:id", authenticatePartyAdmin, ctrl.getById);
router.post("/:id/approve", authenticatePartyAdmin, ctrl.approve);
router.post("/:id/finalize", authenticatePartyAdmin, ctrl.finalize);
router.post("/:id/reject", authenticatePartyAdmin, [body("reason").trim().notEmpty().withMessage("A rejection reason is required")], validate, ctrl.reject);

router.patch(
  "/:id",
  authenticatePartyAdmin,
  authorizePartyAdmin("PARTY_SUPER_ADMIN"),
  [body("status").optional().isIn(["PENDING", "PROBATIONARY", "FULL", "REJECTED"]).withMessage("Invalid status")],
  validate,
  ctrl.update
);
router.delete("/:id", authenticatePartyAdmin, authorizePartyAdmin("PARTY_SUPER_ADMIN"), ctrl.remove);

module.exports = router;
