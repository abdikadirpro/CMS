import { useAuth } from "../../hooks/useAuth";
import Dashboard from "./Dashboard";
import GlobalDashboard from "../superadmin/GlobalDashboard";

export default function DashboardIndex() {
  const { adminType } = useAuth();
  if (adminType === "SUPER_ADMIN") return <GlobalDashboard />;
  return <Dashboard />;
}
