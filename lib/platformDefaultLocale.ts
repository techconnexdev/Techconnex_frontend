import { isLocale, type Locale } from "@/lib/i18n/locales";

const API_URL =
  typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
    ? process.env.NEXT_PUBLIC_API_URL
    : "http://localhost:4000";

/** Reads platform default locale from admin settings (public GET). */
export async function fetchPlatformDefaultLocale(): Promise<Locale | null> {
  try {
    const res = await fetch(`${API_URL}/admin/settings`);
    const data = (await res.json()) as {
      success?: boolean;
      data?: { defaultLocale?: unknown };
    };
    const raw = data?.data?.defaultLocale;
    if (typeof raw === "string" && isLocale(raw)) return raw;
  } catch {
    // ignore
  }
  return null;
}
