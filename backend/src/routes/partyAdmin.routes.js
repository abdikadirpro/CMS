const { Router } = require("express");
const { body } = require("express-validator");
const { authenticatePartyAdmin } = require("../middleware/auth");
const { authorizePartyAdmin } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");
const ctrl = require("../controllers/partyAdmin.controller");

const router = Router();

// Xisbiga Barwaaqo party admin accounts (Zone/District/Town/Office, and further Party Super
// Admins) are self-managed by an existing Party Super Admin from within the Barwaaqo portal — not
// by the complaint-system SUPER_ADMIN (which only bootstraps the very first Party Super Admin,
// see partyAdminBootstrap.routes.js).
router.use(authenticatePartyAdmin, authorizePartyAdmin("PARTY_SUPER_ADMIN"));

router.get("/", ctrl.list);
router.post(
  "/",
  [
    body("fullName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("partyAdminType").isIn(["PARTY_SUPER_ADMIN", "PARTY_ZONE_ADMIN", "PARTY_TOWN_ADMIN", "PARTY_DISTRICT_ADMIN", "PARTY_OFFICE_ADMIN"]),
  ],
  validate,
  ctrl.create
);
router.patch("/:id", ctrl.update);
router.patch("/:id/password", [body("newPassword").isLength({ min: 8 })], validate, ctrl.resetPartyAdminPassword);
router.delete("/:id", ctrl.remove);

module.exports = router;
