/**
 * Supported UI locales. Add new codes here and register messages + suffix mapping in cmsField.
 */
export const LOCALES = ["en", "id", "ar"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Locales listed in the public language switcher and account settings.
 * Arabic is temporarily omitted from these UIs; restore by adding "ar" here.
 */
export const LOCALES_LANGUAGE_PICKER = ["en", "id"] as const;

export const DEFAULT_LOCALE: Locale = "en";

export const I18N_STORAGE_KEY = "techconnex_locale";

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** BCP 47 language tag for <html lang> */
export function localeToHtmlLang(locale: Locale): string {
  switch (locale) {
    case "en":
      return "en";
    case "id":
      return "id";
    case "ar":
      return "ar";
    default:
      return "en";
  }
}

export function isRtlLocale(locale: Locale): boolean {
  return locale === "ar";
}
