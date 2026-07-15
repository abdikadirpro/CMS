const { Router } = require("express");

const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const complaintRoutes = require("./complaint.routes");
const adminRoutes = require("./admin.routes");
const rbacRoutes = require("./rbac.routes");
const notificationRoutes = require("./notification.routes");
const activityLogRoutes = require("./activityLog.routes");
const analyticsRoutes = require("./analytics.routes");
const backupRoutes = require("./backup.routes");
const {
  zonesRouter,
  districtsRouter,
  townAdministrationsRouter,
  officesRouter,
  categoriesRouter,
} = require("./hierarchy.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/complaints", complaintRoutes);
router.use("/admins", adminRoutes);
router.use("/rbac", rbacRoutes);
router.use("/notifications", notificationRoutes);
router.use("/activity-logs", activityLogRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/backup", backupRoutes);
router.use("/zones", zonesRouter);
router.use("/districts", districtsRouter);
router.use("/town-administrations", townAdministrationsRouter);
router.use("/offices", officesRouter);
router.use("/categories", categoriesRouter);

module.exports = router;
