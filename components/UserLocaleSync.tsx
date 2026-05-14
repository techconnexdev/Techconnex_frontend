"use client";

import { useEffect } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { DEFAULT_LOCALE, isLocale } from "@/lib/i18n/locales";

/**
 * After login, `user` in localStorage includes `settings.locale` from the API.
 * Apply it so the UI matches the server (overrides anonymous `techconnex_locale` when signed in).
 */
export function UserLocaleSync() {
  const { setLocale } = useI18n();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const user = JSON.parse(raw) as {
        settings?: { locale?: string | null };
      };
      const loc = user?.settings?.locale;
      if (typeof loc === "string" && isLocale(loc)) {
        // Arabic temporarily not offered in language pickers; avoid forcing ar from profile.
        setLocale(loc === "ar" ? DEFAULT_LOCALE : loc);
      }
    } catch {
      // ignore
    }
  }, [setLocale]);

  return null;
}
