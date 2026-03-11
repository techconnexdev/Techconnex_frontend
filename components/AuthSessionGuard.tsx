"use client";

import { useEffect } from "react";
import Cookies from "js-cookie";

export function AuthSessionGuard() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const response = await originalFetch(...args);

      try {
        const status = response.status;

        if (status === 401 || status === 403) {
          const cloned = response.clone();
          let data: unknown = null;

          try {
            data = await cloned.json();
          } catch {
            // ignore JSON parse errors – do not break original fetch
          }

          const maybeObject = (data ?? {}) as { [key: string]: unknown };
          const code = (maybeObject.code || maybeObject.errorCode) as string | undefined;
          const rawMessage =
            (maybeObject.message as string | undefined) ||
            (maybeObject.error as string | undefined) ||
            "";

          const message = typeof rawMessage === "string" ? rawMessage : "";
          const isSuspended =
            code === "ACCOUNT_SUSPENDED" ||
            (message && message.toLowerCase().includes("suspended"));

          if (isSuspended) {
            try {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
            } catch {
              // ignore
            }

            try {
              Cookies.remove("token", { path: "/" });
            } catch {
              // ignore
            }

            const url = new URL(window.location.href);

            // Avoid redirect loop if already on auth pages
            if (!url.pathname.startsWith("/auth/")) {
              window.location.href = "/auth/login?suspended=1";
            }
          }
        }
      } catch {
        // Never break the original fetch chain due to guard errors
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}

