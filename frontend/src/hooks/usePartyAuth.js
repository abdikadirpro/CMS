import { useSelector } from "react-redux";
import { selectCurrentPartyAdmin, selectIsPartyAuthenticated } from "../app/partyAuthSlice";

// Shared hook for both Xisbiga Barwaaqo actor types (party admins and members) — they log in
// through the same session now, distinguished by actor.type.
export function usePartyAuth() {
  const actor = useSelector(selectCurrentPartyAdmin);
  const isAuthenticated = useSelector(selectIsPartyAuthenticated);
  const isPartyAdmin = actor?.type === "PARTY_ADMIN";
  const isMember = actor?.type === "MEMBER";
  return { actor, isAuthenticated, isPartyAdmin, isMember, partyAdminType: actor?.partyAdminType };
}
