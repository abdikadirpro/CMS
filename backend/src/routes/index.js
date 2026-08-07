const { Router } = require("express");

const authRoutes = require("./auth.routes");
const partyAuthRoutes = require("./partyAuth.routes");
const userRoutes = require("./user.routes");
const complaintRoutes = require("./complaint.routes");
const memberRoutes = require("./member.routes");
const volunteerRoutes = require("./volunteer.routes");
const donationRoutes = require("./donation.routes");
const adminRoutes = require("./admin.routes");
const partyAdminRoutes = require("./partyAdmin.routes");
const partyAdminBootstrapRoutes = require("./partyAdminBootstrap.routes");
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
  partyBranchesRouter,
} = require("./hierarchy.routes");

const router = Router();

router.use("/auth", authRoutes);
router.use("/party-auth", partyAuthRoutes);
router.use("/users", userRoutes);
router.use("/complaints", complaintRoutes);
router.use("/members", memberRoutes);
router.use("/volunteers", volunteerRoutes);
router.use("/donations", donationRoutes);
router.use("/admins", adminRoutes);
router.use("/party-admins", partyAdminRoutes);
router.use("/party-admin-bootstrap", partyAdminBootstrapRoutes);
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
router.use("/party-branches", partyBranchesRouter);

module.exports = router;
