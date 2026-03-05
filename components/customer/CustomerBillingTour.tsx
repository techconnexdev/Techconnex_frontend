"use client";

import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";

const BILLING_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Billing & Finance",
    content:
      "Manage payments, view transactions, and track your spending. For new users, most areas will show zeros until you have paid milestones or completed transactions.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Export report",
    content:
      "Download your billing data as a report. Use this when you need records for accounting or tax purposes.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Financial overview",
    content:
      "Total spent, pending payments, this month's spend, and average transaction. These numbers update as you pay milestones and release funds to providers.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Overview card",
    content:
      "Financial summary with stats, upcoming payments, and recent activity. Scroll down to the Transactions card for full history with search and filters.",
  },
  {
    target: '[data-tour-step="4"]',
    title: "Upcoming payments",
    content:
      "Milestone payments that are due or pending approval. Click Pay Now to complete a payment when the milestone is ready. This list may be empty for new users.",
  },
  {
    target: '[data-tour-step="bill-5"]',
    title: "Transactions card",
    content:
      "Full transaction history with search and period filters. Each transaction shows description, project, provider, milestone, method, and amount. Use View Details or Receipt for more. New users will see an empty list until payments are made.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Navigation menu",
    content:
      "Use this sidebar to go back to Dashboard, My Projects, Find Providers, and other sections.",
  },
];

export function CustomerBillingTour() {
  return (
    <CustomerDashboardTour
      steps={BILLING_TOUR_STEPS}
      storageKeyPrefix="customer-billing-tour-done"
    />
  );
}
