"use client";

import { CustomerDashboardTour, type TourStep } from "@/components/customer/CustomerDashboardTour";

const PROVIDER_OPPORTUNITIES_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Job Opportunities",
    content:
      "Discover projects that match your skills. Browse all opportunities or view AI-recommended ones. Click any card to see details and submit a proposal to win the job.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Search & filters",
    content:
      "Search by title, client, or skills. Filter by submission status (Not Submitted, Already Submitted) and sort by Best match or Newest. Use Filters to refine by tags from your profile or from all opportunities.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "All vs AI Recommended",
    content:
      "All shows every available opportunity. AI Recommended shows projects matched to your skills and preferences, with insights on why each fits you. Hover over cards to see AI explanations.",
  },
  {
    target: '[data-tour-step="6"]',
    title: "Navigation menu",
    content:
      "Use this menu to go to Dashboard, My Projects, Messages, Earnings, and other sections.",
  },
];

export function ProviderOpportunitiesTour() {
  return (
    <CustomerDashboardTour
      steps={PROVIDER_OPPORTUNITIES_STEPS}
      storageKeyPrefix="provider-opportunities-tour-done"
    />
  );
}
