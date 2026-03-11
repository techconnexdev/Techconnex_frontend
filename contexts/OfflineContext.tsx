"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { API_BASE } from "@/lib/api";
import { setOfflineGetter } from "@/lib/toast";

type OfflineContextValue = {
  isOffline: boolean;
};

const OfflineContext = createContext<OfflineContextValue>({ isOffline: false });

function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const msg = (error as Error).message?.toLowerCase() ?? "";
    return (
      msg.includes("failed to fetch") ||
      msg.includes("network request failed") ||
      msg.includes("networkerror")
    );
  }
  return false;
}

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const isOfflineRef = useRef(isOffline);
  isOfflineRef.current = isOffline;

  const setOffline = useCallback((offline: boolean) => {
    setIsOffline(offline);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setOfflineGetter(() => isOfflineRef.current);

    const handleOffline = () => setOffline(true);

    const handleOnline = async () => {
      try {
        const res = await fetch(`${API_BASE}/health`, {
          method: "GET",
          cache: "no-store",
        });
        if (res.ok) setOffline(false);
      } catch {
        // Keep offline until health succeeds
      }
    };

    setIsOffline(!navigator.onLine);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const res = await originalFetch(...args);
        return res;
      } catch (err) {
        if (isNetworkError(err)) setOffline(true);
        throw err;
      }
    };

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      window.fetch = originalFetch;
    };
  }, [setOffline]);

  const value: OfflineContextValue = { isOffline };

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (ctx === undefined) {
    throw new Error("useOffline must be used within OfflineProvider");
  }
  return ctx;
}
