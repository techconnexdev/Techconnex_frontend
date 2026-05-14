"use client";

import { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { useI18n } from "@/contexts/I18nProvider";

const BETA_DISMISSED_KEY = "techconnex_beta_dismissed";

export default function BetaBanner() {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(BETA_DISMISSED_KEY);
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(BETA_DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="banner"
      aria-label={t("home.beta.bannerAria")}
      className="relative z-50 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600/90 to-indigo-600/90 px-4 py-2 text-center text-sm text-white shadow-sm"
    >
      <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
      <span className="flex flex-wrap items-center justify-center gap-1.5">
        <strong className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-semibold">
          {t("home.beta.badge")}
        </strong>
        {t("home.beta.notice")}
      </span>
      <button
        type="button"
        onClick={dismiss}
        aria-label={t("home.beta.dismissAria")}
        className="absolute right-2 rounded p-1 text-white/90 transition-colors hover:bg-white/20 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
