import type { Locale } from "../locales";
import { DEFAULT_LOCALE } from "../locales";
import type { MessageKey } from "./en";
import { enMessages } from "./en";
import { idMessages } from "./id";
import { arMessages } from "./ar";

export type { MessageKey } from "./en";

const enFlat = enMessages as Record<MessageKey, string>;

const byLocale: Record<
  Locale,
  Record<MessageKey, string> | Partial<Record<MessageKey, string>>
> = {
  en: enFlat,
  id: idMessages,
  ar: arMessages,
};

/**
 * Locale patches are merged over English so new keys (e.g. legal.*) need not be
 * duplicated in every locale file until translated.
 */
export function getMessagesForLocale(locale: Locale): Record<MessageKey, string> {
  if (locale === DEFAULT_LOCALE) return enFlat;
  const patch = byLocale[locale];
  if (!patch) return enFlat;
  return { ...enFlat, ...patch };
}
