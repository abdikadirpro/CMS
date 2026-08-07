import { Navigate, Outlet } from "react-router-dom";
import { usePartyAuth } from "../hooks/usePartyAuth";

/** Restricts a subtree to specific party admin types. */
export default function PartyRoleRoute({ types = [] }) {
  const { isAuthenticated, partyAdminType } = usePartyAuth();

  if (!isAuthenticated) return <Navigate to="/barwaaqo/login" replace />;
  if (types.length > 0 && !types.includes(partyAdminType)) return <Navigate to="/barwaaqo/app" replace />;

  return <Outlet />;
}
