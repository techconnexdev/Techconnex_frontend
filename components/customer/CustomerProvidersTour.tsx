"use client";

import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";

const PROVIDERS_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Find ICT Professionals",
    content:
      "Discover and hire top-rated ICT experts for your projects. Browse all providers or get AI-recommended matches based on your projects.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Saved Providers",
    content:
      "Click here to view providers you've saved for later. Save any provider's profile with the heart icon to quickly find them again.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Search and filters",
    content:
      "Search by name or skills, filter by rating (e.g. 4.5+ stars), and show only verified providers. Use these to narrow down your search.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "All vs AI Recommended",
    content:
      "Switch between all providers and AI Recommended. The AI tab suggests providers that match your open projects. Create a project first to get recommendations.",
  },
  {
    target: '[data-tour-step="4"]',
    title: "Provider cards",
    content:
      "Each card shows a provider's profile—rating, experience, skills, and hourly rate. Click View Profile or Contact to connect with them.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Navigation menu",
    content:
      "Use this sidebar to go back to Dashboard, My Projects, Messages, Billing, and other sections.",
  },
];

export function CustomerProvidersTour() {
  return (
    <CustomerDashboardTour
      steps={PROVIDERS_TOUR_STEPS}
      storageKeyPrefix="customer-providers-tour-done"
    />
  );
}
