const { Router } = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticatePartyAdmin } = require("../middleware/auth");
const { authorizePartyAdmin } = require("../middleware/rbac");
const ctrl = require("../controllers/volunteer.controller");

const router = Router();

router.post(
  "/",
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("phone").trim().notEmpty().withMessage("Phone number is required"),
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

router.get("/", authenticatePartyAdmin, ctrl.list);
router.get("/:id", authenticatePartyAdmin, ctrl.getById);
router.patch("/:id", authenticatePartyAdmin, ctrl.update);
router.delete("/:id", authenticatePartyAdmin, authorizePartyAdmin("PARTY_SUPER_ADMIN"), ctrl.remove);

module.exports = router;
