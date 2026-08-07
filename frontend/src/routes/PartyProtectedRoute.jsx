import { Navigate, Outlet, useLocation } from "react-router-dom";
import { usePartyAuth } from "../hooks/usePartyAuth";

export default function PartyProtectedRoute() {
  const { isAuthenticated, isPartyAdmin } = usePartyAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/barwaaqo/login" replace state={{ from: location }} />;
  }
  // A logged-in Member hitting an admin-only route gets sent to their own dashboard instead.
  if (!isPartyAdmin) {
    return <Navigate to="/membership/app" replace />;
  }
  return <Outlet />;
}
