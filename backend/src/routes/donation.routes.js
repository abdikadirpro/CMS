const { Router } = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticatePartyAdmin } = require("../middleware/auth");
const { authorizePartyAdmin } = require("../middleware/rbac");
const { donationUpload } = require("../middleware/upload");
const ctrl = require("../controllers/donation.controller");

const router = Router();

router.post(
  "/",
  donationUpload.single("receipt"),
  [
    body("donorName").trim().notEmpty().withMessage("Name is required"),
    body("phone").trim().notEmpty().withMessage("Phone number is required"),
    body("amount").isFloat({ gt: 0 }).withMessage("Enter a valid donation amount"),
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

router.get("/:id/status", ctrl.getStatus);

router.get("/", authenticatePartyAdmin, ctrl.list);
router.patch(
  "/:id",
  authenticatePartyAdmin,
  [body("status").isIn(["PENDING", "CONFIRMED"]).withMessage("Invalid status")],
  validate,
  ctrl.update
);
router.delete("/:id", authenticatePartyAdmin, authorizePartyAdmin("PARTY_SUPER_ADMIN"), ctrl.remove);

module.exports = router;
