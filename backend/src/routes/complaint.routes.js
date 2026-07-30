const { Router } = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { authenticate, optionalAuthenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { upload } = require("../middleware/upload");
const ctrl = require("../controllers/complaint.controller");

const router = Router();

router.post(
  "/",
  optionalAuthenticate,
  upload.array("attachments", 5),
  [
    body("title").trim().notEmpty().withMessage("Title is required"),
    body("description").trim().notEmpty().withMessage("Description is required"),
    body("guestIdNumber").trim().notEmpty().withMessage("National ID is required"),
    body().custom((_, { req }) => {
      if (!req.body.districtId && !req.body.zoneId && !req.body.townAdministrationId && !req.body.officeId) {
        throw new Error("Select a District, Zone, Town Administration, or Office");
      }
      return true;
    }),
  ],
  validate,
  ctrl.create
);

router.get("/track/:trackingId", ctrl.getByTrackingId);

router.get("/", authenticate, ctrl.list);
router.get("/:id", authenticate, ctrl.getById);

router.patch(
  "/:id/status",
  authenticate,
  authorize(),
  [body("status").isIn(["PENDING", "IN_PROGRESS", "WAITING", "SOLVED", "TRANSFERRED", "REJECTED", "ESCALATED"])],
  validate,
  ctrl.updateStatus
);

router.post("/:id/assign", authenticate, authorize(), [body("adminId").isString().notEmpty()], validate, ctrl.assign);

router.post(
  "/:id/transfer",
  authenticate,
  authorize(),
  [body("reason").trim().notEmpty().withMessage("A transfer reason is required")],
  validate,
  ctrl.transfer
);

router.post("/:id/escalate", authenticate, ctrl.escalate);

router.post(
  "/:id/satisfaction",
  authenticate,
  [body("satisfied").isBoolean().withMessage("satisfied must be a boolean")],
  validate,
  ctrl.submitSatisfaction
);

router.post("/:id/notes", authenticate, authorize(), [body("content").trim().notEmpty()], validate, ctrl.addNote);

module.exports = router;
