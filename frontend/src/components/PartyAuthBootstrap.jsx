import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { usePartyRefreshSessionMutation, useLazyGetPartyMeQuery } from "../app/api/partyAuthApi";
import { setCredentials } from "../app/partyAuthSlice";
import { Flag } from "lucide-react";

/** Attempts a silent session restore via the httpOnly barwaaqo_refresh_token cookie on first load. */
export default function PartyAuthBootstrap({ children }) {
  const [ready, setReady] = useState(false);
  const [refreshSession] = usePartyRefreshSessionMutation();
  const [getMe] = useLazyGetPartyMeQuery();
  const dispatch = useDispatch();
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    const BOOTSTRAP_TIMEOUT_MS = 8000;
    let settled = false;
    const timeoutId = setTimeout(() => {
      if (!settled) setReady(true);
    }, BOOTSTRAP_TIMEOUT_MS);

    (async () => {
      try {
        const refreshResult = await refreshSession().unwrap();
        dispatch(setCredentials({ accessToken: refreshResult.data.accessToken }));
        const meResult = await getMe().unwrap();
        dispatch(setCredentials({ actor: meResult.data.actor }));
      } catch {
        // no valid session — user will land on the party login page
      } finally {
        settled = true;
        clearTimeout(timeoutId);
        setReady(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3 text-primary">
          <Flag className="h-10 w-10 animate-pulse" />
          <p className="text-sm text-slate-400">Loading Xisbiga Barwaaqo...</p>
        </div>
      </div>
    );
  }

  return children;
}
