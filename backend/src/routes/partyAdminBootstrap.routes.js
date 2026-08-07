const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");
const ctrl = require("../controllers/partyAdmin.controller");

const router = Router();

// The complaint-system SUPER_ADMIN's only remaining involvement with Xisbiga Barwaaqo admin
// accounts: bootstrapping a Party Super Admin. Every other party-admin level (Zone/District/
// Town/Office) and every subsequent Party Super Admin is created from within the Barwaaqo portal
// itself by an existing Party Super Admin (see partyAdmin.routes.js).
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  [
    body("fullName").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("partyAdminType").equals("PARTY_SUPER_ADMIN").withMessage("Only a Party Super Admin account can be bootstrapped here"),
  ],
  validate,
  ctrl.create
);

module.exports = router;
