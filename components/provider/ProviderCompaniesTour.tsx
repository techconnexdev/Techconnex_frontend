"use client";

import { CustomerDashboardTour, type TourStep } from "@/components/customer/CustomerDashboardTour";

const PROVIDER_COMPANIES_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Find Companies",
    content:
      "Discover companies looking for ICT professionals. Browse by search, rating, and verification. Click any company to view details. Save companies you’re interested in for quick access later.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Saved Companies",
    content:
      "View companies you’ve saved. Save companies from the list to build a shortlist for future opportunities.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Search & filters",
    content:
      "Search by company name or industry. Filter by rating (e.g. 4.5+ stars) and verification status (Verified Only or Unverified). Results update as you change filters.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Company results",
    content:
      "Browse the company cards. Use the sort dropdown to order by Highest Rated, Verified First, Most Projects, or Newest. Click a card to view the company profile and their open projects.",
  },
  {
    target: '[data-tour-step="6"]',
    title: "Navigation menu",
    content:
      "Use this menu to go to Dashboard, Opportunities, Messages, Earnings, and other sections.",
  },
];

export function ProviderCompaniesTour() {
  return (
    <CustomerDashboardTour
      steps={PROVIDER_COMPANIES_STEPS}
      storageKeyPrefix="provider-companies-tour-done"
    />
  );
}
