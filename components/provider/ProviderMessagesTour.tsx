"use client";

import { useMemo } from "react";
import {
  CustomerDashboardTour,
  type TourStep,
} from "@/components/customer/CustomerDashboardTour";
import { useI18n } from "@/contexts/I18nProvider";

export function ProviderMessagesTour() {
  const { t } = useI18n();

  const steps: TourStep[] = useMemo(
    () => [
      {
        target: '[data-tour-step="0"]',
        title: t("provider.messages.tour.step0.title"),
        content: t("provider.messages.tour.step0.content"),
      },
      {
        target: '[data-tour-step="1"]',
        title: t("provider.messages.tour.step1.title"),
        content: t("provider.messages.tour.step1.content"),
      },
      {
        target: '[data-tour-step="6"]',
        title: t("provider.messages.tour.step2.title"),
        content: t("provider.messages.tour.step2.content"),
      },
    ],
    [t],
  );

  return (
    <CustomerDashboardTour
      steps={steps}
      storageKeyPrefix="provider-messages-tour-done"
    />
  );
}
