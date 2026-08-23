"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { AUTH_STATUS_CHANGED_EVENT } from "@/lib/auth/client-events";

type AuthStatus = {
  authenticated: boolean;
  hasProductAccess: boolean;
  isAdmin: boolean;
};

type AuthStatusContextValue = AuthStatus & {
  loaded: boolean;
  refresh: () => Promise<void>;
};

const anonymousStatus: AuthStatus = {
  authenticated: false,
  hasProductAccess: false,
  isAdmin: false
};

const AuthStatusContext = createContext<AuthStatusContextValue>({
  ...anonymousStatus,
  loaded: false,
  refresh: async () => undefined
});

export function AuthStatusProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [status, setStatus] = useState<AuthStatus>(anonymousStatus);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch("/api/auth/status", {
        cache: "no-store",
        credentials: "same-origin",
        signal
      });
      const nextStatus = response.ok
        ? ((await response.json()) as AuthStatus)
        : anonymousStatus;

      setStatus(nextStatus);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setStatus(anonymousStatus);
    } finally {
      if (!signal?.aborted) setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const handleAuthChange = () => {
      void refresh();
    };

    void refresh(controller.signal);
    window.addEventListener(AUTH_STATUS_CHANGED_EVENT, handleAuthChange);

    return () => {
      controller.abort();
      window.removeEventListener(AUTH_STATUS_CHANGED_EVENT, handleAuthChange);
    };
  }, [pathname, refresh]);

  const value = useMemo(
    () => ({ ...status, loaded, refresh: () => refresh() }),
    [loaded, refresh, status]
  );

  return <AuthStatusContext.Provider value={value}>{children}</AuthStatusContext.Provider>;
}

export function useAuthStatus() {
  return useContext(AuthStatusContext);
}
