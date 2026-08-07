import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePartyAuth } from "../hooks/usePartyAuth";

export default function MemberProtectedRoute() {
  const { isAuthenticated, isMember } = usePartyAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/barwaaqo/login" replace state={{ from: location }} />;
  }
  // A logged-in Party Admin hitting a member-only route gets sent to their own dashboard instead.
  if (!isMember) {
    return <Navigate to="/barwaaqo/app" replace />;
  }
  return <Outlet />;
}
