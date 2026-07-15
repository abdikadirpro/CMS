const { Router } = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate } = require("../middleware/auth");
const ctrl = require("../controllers/auth.controller");

const router = Router();

router.post(
  "/register",
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
    body("phone").optional({ checkFalsy: true }).isString(),
    body("idNumber").optional({ checkFalsy: true }).isString(),
  ],
  validate,
  ctrl.register
);

router.post(
  "/otp/verify",
  [body("userId").isString().notEmpty(), body("code").isString().isLength({ min: 6, max: 6 })],
  validate,
  ctrl.verifyOtp
);

router.post("/otp/resend", [body("userId").isString().notEmpty()], validate, ctrl.resendOtp);

router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  validate,
  ctrl.login
);

router.post("/refresh", ctrl.refresh);
router.post("/logout", ctrl.logout);
router.get("/me", authenticate, ctrl.me);

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
