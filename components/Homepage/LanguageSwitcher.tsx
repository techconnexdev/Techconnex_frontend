"use client";

import { Languages } from "lucide-react";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";

const LOCALE_LABEL_KEY: Record<Locale, MessageKey> = {
  en: "home.langSwitcher.en",
  id: "home.langSwitcher.id",
  ar: "home.langSwitcher.ar",
};

const LOCALE_SYMBOL: Record<Locale, string> = {
  en: "EN",
  id: "ID",
  ar: "AR",
};

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const visibleLocales = LOCALES.filter((code) => code !== "ar");

  return (
    <div
      className="flex items-center gap-1 rounded-full border border-blue-700/20 bg-white/85 p-1 shadow-sm backdrop-blur-sm"
      role="radiogroup"
      aria-label={t("home.langSwitcher.label")}
    >
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full text-blue-700/80">
        <Languages className="h-4 w-4" />
      </span>
      {visibleLocales.map((code) => {
        const selected = locale === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            role="radio"
            aria-checked={selected}
            title={t(LOCALE_LABEL_KEY[code])}
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide transition-all duration-200 ${
              selected
                ? "bg-gradient-to-r from-[#2D6DFC] to-[#614EF8] text-white shadow-[0_6px_16px_rgba(45,109,252,0.35)]"
                : "text-slate-700 hover:bg-blue-50 hover:text-[#185df9]"
            }`}
          >
            {LOCALE_SYMBOL[code]}
          </button>
        );
      })}
    </div>
  );
}
