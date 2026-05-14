import { getCountries } from "libphonenumber-js";
import type { Country } from "react-phone-number-input";

/** Strong defaults when UI locale implies a primary market. */
const APP_LOCALE_PRIMARY: Partial<Record<string, Country>> = {
  id: "ID",
  ar: "AE",
};

/**
 * Picks a sensible default calling-code country for phone inputs:
 * UI locale (id → Indonesia, ar → UAE), else browser region (e.g. en-US → US),
 * else Malaysia as product fallback.
 */
export function guessDefaultCountryFromLocale(appLocale: string): Country {
  const countries = getCountries() as Country[];

  const mapped = APP_LOCALE_PRIMARY[appLocale];
  if (mapped && countries.includes(mapped)) {
    return mapped;
  }

  if (typeof navigator !== "undefined") {
    const region = navigator.language?.split("-")[1]?.toUpperCase();
    if (region && countries.includes(region as Country)) {
      return region as Country;
    }
  }

  if (countries.includes("MY")) {
    return "MY";
  }

  return countries[0] as Country;
}
