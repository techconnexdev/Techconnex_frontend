"use client";

import { useMemo } from "react";
import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";
import { useI18n } from "@/contexts/I18nProvider";

export function CustomerSettingsTour() {
  const { t } = useI18n();
  const steps = useMemo<TourStep[]>(
    () => [
      {
        target: '[data-tour-step="0"]',
        title: t("customer.settings.tour.step0.title"),
        content: t("customer.settings.tour.step0.body"),
      },
      {
        target: '[data-tour-step="1"]',
        title: t("customer.settings.tour.step1.title"),
        content: t("customer.settings.tour.step1.body"),
      },
      {
        target: '[data-tour-step="priv-card"]',
        title: t("customer.settings.tour.privacyCard.title"),
        content: t("customer.settings.tour.privacyCard.body"),
      },
      {
        target: '[data-tour-step="2"]',
        title: t("customer.settings.tour.step2.title"),
        content: t("customer.settings.tour.step2.body"),
      },
      {
        target: '[data-tour-step="5"]',
        title: t("customer.settings.tour.step5.title"),
        content: t("customer.settings.tour.step5.body"),
      },
    ],
    [t],
  );

  return (
    <CustomerDashboardTour
      steps={steps}
      storageKeyPrefix="customer-settings-tour-done"
    />
  );
}
