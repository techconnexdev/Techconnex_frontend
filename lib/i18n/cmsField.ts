import type { Locale } from "./locales";
import { DEFAULT_LOCALE, LOCALES } from "./locales";

/** Suffix for API/CMS fields like title_en, description_id. Extend when adding locales. */
const LOCALE_FIELD_SUFFIX: Record<Locale, string> = {
  en: "_en",
  id: "_id",
  ar: "_ar",
};

/**
 * Reads localized fields from a flat object (e.g. API JSON).
 * Tries current locale, then fallback chain (default: English), then any remaining locale with a non-empty string.
 *
 * @param fieldBase - Base name without locale suffix, e.g. "title" for title_en / title_id / title_ar
 */
export function pickLocalizedField(
  record: Record<string, unknown> | null | undefined,
  fieldBase: string,
  locale: Locale,
  options?: { fallbackLocales?: Locale[] }
): string {
  if (!record) return "";

  const fallbackLocales = options?.fallbackLocales ?? [
    locale,
    DEFAULT_LOCALE,
    ...LOCALES.filter((l) => l !== locale && l !== DEFAULT_LOCALE),
  ];
  const seen = new Set<Locale>();
  const ordered = fallbackLocales.filter((l) => {
    if (seen.has(l)) return false;
    seen.add(l);
    return true;
  });

  for (const loc of ordered) {
    const key = `${fieldBase}${LOCALE_FIELD_SUFFIX[loc]}`;
    const v = record[key];
    if (typeof v === "string" && v.trim() !== "") return v;
  }

  const plain = record[fieldBase];
  if (typeof plain === "string" && plain.trim() !== "") return plain;

  return "";
}
