"use client";

import { CustomerDashboardTour, type TourStep } from "@/components/customer/CustomerDashboardTour";

const PROVIDER_EARNINGS_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Earnings",
    content:
      "Track your income and payment history. View total earnings, pending payments, available balance, and manage how you get paid.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Time filter & Export",
    content:
      "Filter earnings by This Week, This Month, Last Month, or This Year. Export Report downloads a PDF of your earnings for the selected period.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Stats cards",
    content:
      "Total Earnings (all time), This Month (with growth %), Pending Payments (awaiting release), and Available Balance (already transferred).",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Tabs",
    content:
      "Overview: monthly trend and recent payments. Payment History: full list of all transactions. Payment Methods: add bank, PayPal, or other payout methods.",
  },
  {
    target: '[data-tour-step="4"]',
    title: "Monthly Earnings & Recent Payments",
    content:
      "Monthly Earnings Trend shows your income by month—select a year to filter. Recent Payments lists your latest transactions with project, client, milestone, amount, and status.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Quick Stats",
    content:
      "Average Project Value, Projects This Month, Success Rate, and Repeat Clients. These metrics help you understand your earnings performance.",
  },
  {
    target: '[data-tour-step="6"]',
    title: "Navigation menu",
    content:
      "Use this menu to go to Dashboard, Opportunities, Messages, Reviews, and other sections.",
  },
];

export function ProviderEarningsTour() {
  return (
    <CustomerDashboardTour
      steps={PROVIDER_EARNINGS_STEPS}
      storageKeyPrefix="provider-earnings-tour-done"
    />
  );
}
