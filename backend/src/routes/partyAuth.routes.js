const { Router } = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticateBarwaaqoActor } = require("../middleware/auth");
const ctrl = require("../controllers/partyAuth.controller");

const router = Router();

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  ctrl.login
);

router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", authenticateBarwaaqoActor, ctrl.me);

router.post("/forgot-password", [body("email").isEmail().normalizeEmail()], validate, ctrl.forgotPassword);

router.post(
  "/reset-password",
  [
    body("email").isEmail().normalizeEmail(),
    body("code").isString().isLength({ min: 6, max: 6 }),
    body("newPassword").isLength({ min: 8 }),
  ],
  validate,
  ctrl.resetPassword
);

module.exports = router;
