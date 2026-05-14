"use client";

import { useMemo } from "react";
import {
  CustomerDashboardTour,
  type TourStep,
} from "@/components/customer/CustomerDashboardTour";
import { useI18n } from "@/contexts/I18nProvider";

export function ProviderCompaniesTour() {
  const { t } = useI18n();

  const steps: TourStep[] = useMemo(
    () => [
      {
        target: '[data-tour-step="0"]',
        title: t("provider.companies.tour.step0.title"),
        content: t("provider.companies.tour.step0.content"),
      },
      {
        target: '[data-tour-step="1"]',
        title: t("provider.companies.tour.step1.title"),
        content: t("provider.companies.tour.step1.content"),
      },
      {
        target: '[data-tour-step="2"]',
        title: t("provider.companies.tour.step2.title"),
        content: t("provider.companies.tour.step2.content"),
      },
      {
        target: '[data-tour-step="3"]',
        title: t("provider.companies.tour.step3.title"),
        content: t("provider.companies.tour.step3.content"),
      },
      {
        target: '[data-tour-step="6"]',
        title: t("provider.companies.tour.step4.title"),
        content: t("provider.companies.tour.step4.content"),
      },
    ],
    [t],
  );

  return (
    <CustomerDashboardTour
      steps={steps}
      storageKeyPrefix="provider-companies-tour-done"
    />
  );
}
