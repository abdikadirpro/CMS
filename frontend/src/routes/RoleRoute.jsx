import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

/** Restricts a subtree to specific admin types. Pass adminTypes=[] to just require "any admin". */
export default function RoleRoute({ adminTypes = [] }) {
  const { isAdmin, adminType } = useAuth();

  if (!isAdmin) return <Navigate to="/app" replace />;
  if (adminTypes.length > 0 && !adminTypes.includes(adminType)) return <Navigate to="/app" replace />;

  return <Outlet />;
}
