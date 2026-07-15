import { useSelector } from "react-redux";
import { selectCurrentActor, selectIsAuthenticated } from "../app/authSlice";

export function useAuth() {
  const actor = useSelector(selectCurrentActor);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isAdmin = actor?.type === "ADMIN";
  const isUser = actor?.type === "USER";
  return { actor, isAuthenticated, isAdmin, isUser, adminType: actor?.adminType };
}
