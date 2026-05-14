"use client";

import { useMemo } from "react";
import {
  CustomerDashboardTour,
  type TourStep,
} from "./CustomerDashboardTour";
import { useI18n } from "@/contexts/I18nProvider";

export function CustomerProjectsTour() {
  const { t } = useI18n();
  const steps = useMemo<TourStep[]>(
    () => [
      {
        target: '[data-tour-step="0"]',
        title: t("customer.projects.tour.step0.title"),
        content: t("customer.projects.tour.step0.content"),
      },
      {
        target: '[data-tour-step="1"]',
        title: t("customer.projects.tour.step1.title"),
        content: t("customer.projects.tour.step1.content"),
      },
      {
        target: '[data-tour-step="2"]',
        title: t("customer.projects.tour.step2.title"),
        content: t("customer.projects.tour.step2.content"),
      },
      {
        target: '[data-tour-step="3"]',
        title: t("customer.projects.tour.step3.title"),
        content: t("customer.projects.tour.step3.content"),
      },
      {
        target: '[data-tour-step="4"]',
        title: t("customer.projects.tour.step4.title"),
        content: t("customer.projects.tour.step4.content"),
      },
      {
        target: '[data-tour-step="5"]',
        title: t("customer.projects.tour.step5.title"),
        content: t("customer.projects.tour.step5.content"),
      },
    ],
    [t],
  );

  return (
    <CustomerDashboardTour
      steps={steps}
      storageKeyPrefix="customer-projects-tour-done"
    />
  );
}
