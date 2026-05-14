import type { Locale } from "@/lib/i18n/locales";

/** Keep `localStorage.user` in sync after saving locale on the server. */
export function mergeUserLocaleInStorage(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    const user = JSON.parse(raw) as Record<string, unknown>;
    const prev = user.settings as Record<string, unknown> | undefined;
    user.settings = { ...(prev ?? {}), locale };
    localStorage.setItem("user", JSON.stringify(user));
  } catch {
    // ignore
  }
}

/** Keep `localStorage.user.settings` in sync after saving preferred currency (matches server). */
export function mergeUserPreferredCurrencyInStorage(currencyCode: string): void {
  if (typeof window === "undefined") return;
  const code = (currencyCode || "").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(code)) return;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return;
    const user = JSON.parse(raw) as Record<string, unknown>;
    const prev = user.settings as Record<string, unknown> | undefined;
    user.settings = { ...(prev ?? {}), preferredCurrency: code };
    localStorage.setItem("user", JSON.stringify(user));
  } catch {
    // ignore
  }
}
