"use client";

import { useMemo } from "react";
import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";
import { useI18n } from "@/contexts/I18nProvider";

export function CustomerReviewsTour() {
  const { t } = useI18n();
  const steps = useMemo<TourStep[]>(
    () => [
      {
        target: '[data-tour-step="0"]',
        title: t("customer.reviews.tour.step0.title"),
        content: t("customer.reviews.tour.step0.body"),
      },
      {
        target: '[data-tour-step="1"]',
        title: t("customer.reviews.tour.step1.title"),
        content: t("customer.reviews.tour.step1.body"),
      },
      {
        target: '[data-tour-step="2"]',
        title: t("customer.reviews.tour.step2.title"),
        content: t("customer.reviews.tour.step2.body"),
      },
      {
        target: '[data-tour-step="3"]',
        title: t("customer.reviews.tour.step3.title"),
        content: t("customer.reviews.tour.step3.body"),
      },
      {
        target: '[data-tour-step="4"]',
        title: t("customer.reviews.tour.step4.title"),
        content: t("customer.reviews.tour.step4.body"),
      },
      {
        target: '[data-tour-step="5"]',
        title: t("customer.reviews.tour.step5.title"),
        content: t("customer.reviews.tour.step5.body"),
      },
    ],
    [t],
  );

  return (
    <CustomerDashboardTour
      steps={steps}
      storageKeyPrefix="customer-reviews-tour-done"
    />
  );
}
