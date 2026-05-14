"use client";

import { useMemo } from "react";
import {
  CustomerDashboardTour,
  type TourStep,
} from "@/components/customer/CustomerDashboardTour";
import { useI18n } from "@/contexts/I18nProvider";

export function ProviderProfileTour() {
  const { t } = useI18n();

  const steps: TourStep[] = useMemo(
    () => [
      {
        target: '[data-tour-step="0"]',
        title: t("provider.profile.tour.step0.title"),
        content: t("provider.profile.tour.step0.content"),
      },
      {
        target: '[data-tour-step="1"]',
        title: t("provider.profile.tour.step1.title"),
        content: t("provider.profile.tour.step1.content"),
      },
      {
        target: '[data-tour-step="2"]',
        title: t("provider.profile.tour.step2.title"),
        content: t("provider.profile.tour.step2.content"),
      },
      {
        target: '[data-tour-step="3"]',
        title: t("provider.profile.tour.step3.title"),
        content: t("provider.profile.tour.step3.content"),
      },
      {
        target: '[data-tour-step="4"]',
        title: t("provider.profile.tour.step4.title"),
        content: t("provider.profile.tour.step4.content"),
      },
      {
        target: '[data-tour-step="5"]',
        title: t("provider.profile.tour.step5.title"),
        content: t("provider.profile.tour.step5.content"),
      },
      {
        target: '[data-tour-step="6"]',
        title: t("provider.profile.tour.step6.title"),
        content: t("provider.profile.tour.step6.content"),
      },
    ],
    [t],
  );

  return (
    <CustomerDashboardTour
      steps={steps}
      storageKeyPrefix="provider-profile-tour-done"
    />
  );
}
