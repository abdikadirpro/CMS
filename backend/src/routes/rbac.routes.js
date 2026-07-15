const { Router } = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const { validate } = require("../middleware/validate");
const ctrl = require("../controllers/rbac.controller");

const router = Router();

router.use(authenticate, authorize("SUPER_ADMIN"));

router.get("/roles", ctrl.listRoles);
router.post("/roles", [body("name").trim().notEmpty()], validate, ctrl.createRole);
router.patch("/roles/:id", ctrl.updateRole);
router.delete("/roles/:id", ctrl.deleteRole);
router.get("/permissions", ctrl.listPermissions);

module.exports = router;
