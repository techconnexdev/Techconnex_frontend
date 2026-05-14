"use client";

import { useMemo } from "react";
import type { Provider } from "../types";
import { useI18n } from "@/contexts/I18nProvider";
import { formatProviderMoney } from "@/lib/provider-currency-format";
import {
  convertWithSnapshot,
  hasCurrencyInSnapshot,
  normalizeCurrencyCode,
  type FxRatesMap,
} from "@/lib/fx-snapshot";

type Props = {
  provider: Provider;
  viewerPreferredCurrency?: string;
  primaryClassName?: string;
  secondaryClassName?: string;
  captionClassName?: string;
};

export function CustomerProviderHourlyRate({
  provider,
  viewerPreferredCurrency,
  primaryClassName = "",
  secondaryClassName = "text-xs text-gray-600",
  captionClassName = "text-[10px] sm:text-xs text-gray-500",
}: Props) {
  const { t, locale } = useI18n();

  const { primaryLine, secondaryLine, showCaptions, providerCode, viewerCode } =
    useMemo(() => {
      const pc = normalizeCurrencyCode(provider.preferredCurrency || "MYR");
      const rate = Number(provider.hourlyRate) || 0;
      const vc = normalizeCurrencyCode(viewerPreferredCurrency || pc);
      const ratesMap = provider.pricingFxSnapshotRatesJson as FxRatesMap | null;

      const primaryLine = t("customer.providers.detail.hourlyRateLine", {
        rate: formatProviderMoney(rate, pc, locale),
      });

      if (rate === 0) {
        return {
          primaryLine,
          secondaryLine: null as string | null,
          showCaptions: false,
          providerCode: pc,
          viewerCode: vc,
        };
      }

      if (!viewerPreferredCurrency || vc === pc) {
        return {
          primaryLine,
          secondaryLine: null as string | null,
          showCaptions: false,
          providerCode: pc,
          viewerCode: vc,
        };
      }

      if (
        !ratesMap ||
        !hasCurrencyInSnapshot(pc, ratesMap) ||
        !hasCurrencyInSnapshot(vc, ratesMap)
      ) {
        return {
          primaryLine,
          secondaryLine: null,
          showCaptions: false,
          providerCode: pc,
          viewerCode: vc,
        };
      }

      const converted = convertWithSnapshot({
        amount: rate,
        fromCurrencyCode: pc,
        toCurrencyCode: vc,
        ratesMap,
      });

      if (converted == null) {
        return {
          primaryLine,
          secondaryLine: null,
          showCaptions: false,
          providerCode: pc,
          viewerCode: vc,
        };
      }

      const secondaryLine = t("customer.providers.detail.hourlyRateLine", {
        rate: formatProviderMoney(converted, vc, locale),
      });

      return {
        primaryLine,
        secondaryLine,
        showCaptions: true,
        providerCode: pc,
        viewerCode: vc,
      };
    }, [
      provider.hourlyRate,
      provider.preferredCurrency,
      provider.pricingFxSnapshotRatesJson,
      viewerPreferredCurrency,
      locale,
      t,
    ]);

  return (
    <div className="space-y-0.5">
      <div>
        <p className={primaryClassName}>{primaryLine}</p>
        {showCaptions ? (
          <p className={captionClassName}>
            {t("customer.providers.card.hourlyCaptionProvider", {
              code: providerCode,
            })}
          </p>
        ) : null}
      </div>
      {secondaryLine ? (
        <div className="pt-0.5">
          <p className={secondaryClassName}>{secondaryLine}</p>
          <p className={captionClassName}>
            {t("customer.providers.card.hourlyCaptionYours", {
              code: viewerCode,
            })}
          </p>
        </div>
      ) : null}
    </div>
  );
}
