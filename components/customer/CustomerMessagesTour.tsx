"use client";

import { useMemo } from "react";
import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";
import { useI18n } from "@/contexts/I18nProvider";

export function CustomerMessagesTour() {
  const { t } = useI18n();
  const steps = useMemo<TourStep[]>(
    () => [
      {
        target: '[data-tour-step="0"]',
        title: t("customer.messages.tour.step0.title"),
        content: t("customer.messages.tour.step0.body"),
      },
      {
        target: '[data-tour-step="1"]',
        title: t("customer.messages.tour.step1.title"),
        content: t("customer.messages.tour.step1.body"),
      },
      {
        target: '[data-tour-step="5"]',
        title: t("customer.messages.tour.step5.title"),
        content: t("customer.messages.tour.step5.body"),
      },
    ],
    [t],
  );

  return (
    <CustomerDashboardTour
      steps={steps}
      storageKeyPrefix="customer-messages-tour-done"
    />
  );
}
