"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  I18N_STORAGE_KEY,
  isLocale,
  isRtlLocale,
  localeToHtmlLang,
  type Locale,
} from "@/lib/i18n/locales";
import { fetchPlatformDefaultLocale } from "@/lib/platformDefaultLocale";
import { formatMessage } from "@/lib/i18n/formatMessage";
import { getMessagesForLocale } from "@/lib/i18n/messages";
import type { MessageKey } from "@/lib/i18n/messages";

export type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** UI copy; optional vars replace {{name}}-style placeholders */
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const stored = localStorage.getItem(I18N_STORAGE_KEY);
        if (stored && isLocale(stored)) {
          if (!cancelled) setLocaleState(stored);
          return;
        }
        const platformDefault = await fetchPlatformDefaultLocale();
        if (
          !cancelled &&
          platformDefault &&
          isLocale(platformDefault)
        ) {
          setLocaleState(platformDefault);
          try {
            localStorage.setItem(I18N_STORAGE_KEY, platformDefault);
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(I18N_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    if (typeof document !== "undefined") {
      document.documentElement.lang = localeToHtmlLang(next);
      document.documentElement.dir = isRtlLocale(next) ? "rtl" : "ltr";
    }
  }, []);

  useEffect(() => {
    if (!ready || typeof document === "undefined") return;
    document.documentElement.lang = localeToHtmlLang(locale);
    document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
  }, [locale, ready]);

  const messages = useMemo(
    () => getMessagesForLocale(locale),
    [locale]
  );

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      const raw = messages[key];
      if (raw === undefined) return String(key);
      return formatMessage(raw, vars);
    },
    [messages]
  );

  const value = useMemo(
    () => ({ locale, setLocale, t }),
    [locale, setLocale, t]
  );

  return (
    <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
