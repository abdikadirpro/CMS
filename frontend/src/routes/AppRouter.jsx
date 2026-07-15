import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import Landing from "../pages/public/Landing";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import Faq from "../pages/public/Faq";
import TrackComplaintPublic from "../pages/public/TrackComplaintPublic";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import OtpVerification from "../pages/auth/OtpVerification";

import DashboardIndex from "../pages/shared/DashboardIndex";
import SubmitComplaint from "../pages/user/SubmitComplaint";
import ComplaintsList from "../pages/shared/ComplaintsList";
import ComplaintDetail from "../pages/shared/ComplaintDetail";
import Notifications from "../pages/user/Notifications";
import ProfileSettings from "../pages/shared/ProfileSettings";

import TransferManagement from "../pages/admin/TransferManagement";
import ReportsAnalytics from "../pages/admin/ReportsAnalytics";
import UserManagement from "../pages/admin/UserManagement";
import DistrictManagement from "../pages/admin/DistrictManagement";
import ZoneManagement from "../pages/admin/ZoneManagement";
import TownAdministrationManagement from "../pages/admin/TownAdministrationManagement";
import OfficeManagement from "../pages/admin/OfficeManagement";
import CategoryManagement from "../pages/admin/CategoryManagement";

import AdminControlCenter from "../pages/superadmin/AdminControlCenter";
import PermissionManagement from "../pages/superadmin/PermissionManagement";
import AuditLogs from "../pages/superadmin/AuditLogs";
import SecurityLogs from "../pages/superadmin/SecurityLogs";
import BackupRecovery from "../pages/superadmin/BackupRecovery";
import SystemSettings from "../pages/superadmin/SystemSettings";

export default function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<Faq />} />
        <Route path="/track" element={<TrackComplaintPublic />} />
        <Route path="/submit" element={<SubmitComplaint />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-otp" element={<OtpVerification />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<DashboardLayout />}>
          <Route index element={<DashboardIndex />} />
          <Route path="submit" element={<SubmitComplaint />} />
          <Route path="complaints" element={<ComplaintsList />} />
          <Route path="complaints/:id" element={<ComplaintDetail />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<ProfileSettings />} />

          <Route element={<RoleRoute adminTypes={[]} />}>
            <Route path="transfers" element={<TransferManagement />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="users" element={<UserManagement />} />
          </Route>

          <Route element={<RoleRoute adminTypes={["ZONE_ADMIN", "SUPER_ADMIN"]} />}>
            <Route path="districts" element={<DistrictManagement />} />
          </Route>

          <Route element={<RoleRoute adminTypes={["SUPER_ADMIN"]} />}>
            <Route path="zones" element={<ZoneManagement />} />
            <Route path="town-administrations" element={<TownAdministrationManagement />} />
            <Route path="offices" element={<OfficeManagement />} />
            <Route path="categories" element={<CategoryManagement />} />
            <Route path="admins" element={<AdminControlCenter />} />
            <Route path="permissions" element={<PermissionManagement />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="security-logs" element={<SecurityLogs />} />
            <Route path="backup" element={<BackupRecovery />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
