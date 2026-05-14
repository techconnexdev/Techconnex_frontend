import type { Locale } from "@/lib/i18n/locales";

function intlLocaleForAppLocale(locale: Locale): string {
  return locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US";
}

/** Normalize provider settings currency; invalid or missing → MYR. */
export function providerDisplayCurrencyCode(preferred?: string | null): string {
  const raw = (preferred ?? "MYR").trim();
  return typeof raw === "string" && /^[A-Z]{3}$/i.test(raw)
    ? raw.toUpperCase()
    : "MYR";
}

export function formatProviderMoney(
  amount: number,
  preferred: string | null | undefined,
  locale: Locale,
): string {
  const currency = providerDisplayCurrencyCode(preferred);
  const intlLocale = intlLocaleForAppLocale(locale);
  const n = Number(amount) || 0;
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${currency} ${n.toLocaleString(intlLocale)}`;
  }
}
