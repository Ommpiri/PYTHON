import { useEffect, useState } from "react";

export type SessionUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  username?: string | null;
  onboarding_completed?: boolean;
};

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

export type Session = {
  user: SessionUser | null;
  status: SessionStatus;
};

let cachedSession: SessionUser | null | undefined = undefined; // undefined = not fetched yet

/**
 * Lightweight hook that fetches /api/auth/session once and caches it.
 * Use it anywhere you need to know whether the user is logged in.
 */
export function useSession(): Session {
  const [state, setState] = useState<Session>({
    user: cachedSession ?? null,
    status: cachedSession === undefined ? "loading" : cachedSession ? "authenticated" : "unauthenticated",
  });

  useEffect(() => {
    if (cachedSession !== undefined) return; // already fetched

    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        const user: SessionUser | null =
          data && data.user && Object.keys(data.user).length > 0 ? data.user : null;
        cachedSession = user;
        setState({ user, status: user ? "authenticated" : "unauthenticated" });
      })
      .catch(() => {
        cachedSession = null;
        setState({ user: null, status: "unauthenticated" });
      });
  }, []);

  // Re-sync when the user navigates back to the tab or logs in/out
  useEffect(() => {
    const refresh = () => {
      cachedSession = undefined;
      fetch("/api/auth/session")
        .then((r) => r.json())
        .then((data) => {
          const user: SessionUser | null =
            data && data.user && Object.keys(data.user).length > 0 ? data.user : null;
          cachedSession = user;
          setState({ user, status: user ? "authenticated" : "unauthenticated" });
        })
        .catch(() => {
          cachedSession = null;
          setState({ user: null, status: "unauthenticated" });
        });
    };
    window.addEventListener("pyc-session-change", refresh);
    return () => window.removeEventListener("pyc-session-change", refresh);
  }, []);

  return state;
}
