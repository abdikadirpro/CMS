import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useRefreshSessionMutation, useLazyGetMeQuery } from "../app/api/authApi";
import { setCredentials } from "../app/authSlice";
import { ShieldCheck } from "lucide-react";

/** Attempts a silent session restore via the httpOnly refresh cookie on first load. */
export default function AuthBootstrap({ children }) {
  const [ready, setReady] = useState(false);
  const [refreshSession] = useRefreshSessionMutation();
  const [getMe] = useLazyGetMeQuery();
  const dispatch = useDispatch();
  // Refresh tokens are single-use/rotated, so a duplicate call (e.g. React 18 StrictMode
  // double-invoking this effect in dev) makes the second request fail with 401 — and if it
  // resolves before the first, this briefly reports "not authenticated", bouncing the user to
  // /login before the real result comes back. Guard so the bootstrap only ever runs once.
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;

    // The backend (Render free tier) can cold-start in 20-30s after being idle. Don't hold the
    // entire app hostage behind that — if the refresh hasn't settled within BOOTSTRAP_TIMEOUT_MS,
    // let the app render as "logged out" anyway. The refresh/getMe calls keep running in the
    // background regardless, so a session that resolves after the timeout still logs the user in
    // silently (no redirect needed) once it lands.
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
        // no valid session — user will land on public/auth pages
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
          <ShieldCheck className="h-10 w-10 animate-pulse" />
          <p className="text-sm text-slate-400">Loading CMS...</p>
        </div>
      </div>
    );
  }

  return children;
}
