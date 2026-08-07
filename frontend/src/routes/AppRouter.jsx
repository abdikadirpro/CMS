import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import AuthLayout from "../layouts/AuthLayout";
import DashboardLayout from "../layouts/DashboardLayout";
import PartyAuthLayout from "../layouts/PartyAuthLayout";
import PartyDashboardLayout from "../layouts/PartyDashboardLayout";
import EthicsPublicLayout from "../layouts/EthicsPublicLayout";
import MembershipPublicLayout from "../layouts/MembershipPublicLayout";
import ProtectedRoute from "./ProtectedRoute";
import PartyProtectedRoute from "./PartyProtectedRoute";
import RoleRoute from "./RoleRoute";
import PartyRoleRoute from "./PartyRoleRoute";
import MemberDashboardLayout from "../layouts/MemberDashboardLayout";
import MemberProtectedRoute from "./MemberProtectedRoute";

import Landing from "../pages/public/Landing";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import Faq from "../pages/public/Faq";
import TrackComplaintPublic from "../pages/public/TrackComplaintPublic";
import MemberRegister from "../pages/public/MemberRegister";
import TrackMembershipPublic from "../pages/public/TrackMembershipPublic";
import VolunteerSignup from "../pages/public/VolunteerSignup";
import GetStarted from "../pages/public/GetStarted";

import EthicsHome from "../pages/ethics/EthicsHome";
import EthicsAbout from "../pages/ethics/EthicsAbout";
import EthicsContact from "../pages/ethics/EthicsContact";
import EthicsGetStarted from "../pages/ethics/EthicsGetStarted";
import EthicsRegister from "../pages/ethics/EthicsRegister";

import MembershipHome from "../pages/party/MembershipHome";
import MembershipAbout from "../pages/party/MembershipAbout";
import MembershipContact from "../pages/party/MembershipContact";
import Principles from "../pages/party/Principles";
import Donate from "../pages/party/Donate";
import MembershipHub from "../pages/party/MembershipHub";
import OurTeam from "../pages/party/OurTeam";
import OurLocations from "../pages/party/OurLocations";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import OtpVerification from "../pages/auth/OtpVerification";

import PartyLogin from "../pages/partyadmin/PartyLogin";
import PartyForgotPassword from "../pages/partyadmin/PartyForgotPassword";
import PartyDashboard from "../pages/partyadmin/PartyDashboard";
import MemberManagement from "../pages/partyadmin/MemberManagement";
import MemberAnalytics from "../pages/partyadmin/MemberAnalytics";
import PartyBranchManagement from "../pages/partyadmin/PartyBranchManagement";
import PartyAdminSelfManagement from "../pages/partyadmin/PartyAdminManagement";
import VolunteerManagement from "../pages/partyadmin/VolunteerManagement";
import DonationManagement from "../pages/partyadmin/DonationManagement";

import MemberDashboard from "../pages/member/MemberDashboard";

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
        <Route path="/get-started" element={<GetStarted />} />
      </Route>

      <Route element={<EthicsPublicLayout />}>
        <Route path="/ethics" element={<EthicsHome />} />
        <Route path="/ethics/about" element={<EthicsAbout />} />
        <Route path="/ethics/contact" element={<EthicsContact />} />
        <Route path="/ethics/get-started" element={<EthicsGetStarted />} />
        <Route path="/ethics/register" element={<EthicsRegister />} />
      </Route>

      <Route element={<MembershipPublicLayout />}>
        <Route path="/membership" element={<MembershipHome />} />
        <Route path="/membership/about" element={<MembershipAbout />} />
        <Route path="/membership/contact" element={<MembershipContact />} />
        <Route path="/membership/principles" element={<Principles />} />
        <Route path="/membership/team" element={<OurTeam />} />
        <Route path="/membership/locations" element={<OurLocations />} />
        <Route path="/membership/donate" element={<Donate />} />
        <Route path="/membership/hub" element={<MembershipHub />} />
        <Route path="/membership/register" element={<MemberRegister />} />
        <Route path="/membership/track" element={<TrackMembershipPublic />} />
        <Route path="/volunteer" element={<VolunteerSignup />} />
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

      <Route element={<PartyAuthLayout />}>
        <Route path="/barwaaqo/login" element={<PartyLogin />} />
        <Route path="/barwaaqo/forgot-password" element={<PartyForgotPassword />} />
      </Route>

      <Route element={<PartyProtectedRoute />}>
        <Route path="/barwaaqo/app" element={<PartyDashboardLayout />}>
          <Route index element={<PartyDashboard />} />
          <Route path="members" element={<MemberManagement />} />
          <Route path="members/analytics" element={<MemberAnalytics />} />
          <Route path="volunteers" element={<VolunteerManagement />} />
          <Route path="donations" element={<DonationManagement />} />

          <Route element={<PartyRoleRoute types={["PARTY_SUPER_ADMIN"]} />}>
            <Route path="party-branches" element={<PartyBranchManagement />} />
            <Route path="party-admins" element={<PartyAdminSelfManagement />} />
          </Route>
        </Route>
      </Route>

      <Route element={<MemberProtectedRoute />}>
        <Route path="/membership/app" element={<MemberDashboardLayout />}>
          <Route index element={<MemberDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
