"use client";

import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";

const REQUESTS_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Provider Requests",
    content:
      "When providers respond to your service requests, their proposals appear here. For new users, this list may be empty until you create a project and receive bids.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Export and refresh",
    content:
      "Export your requests as PDF or click Refresh to fetch the latest proposals. Use these when you need a record or want to check for new responses.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Request stats",
    content:
      "Total requests, Pending (awaiting your decision), Accepted (you approved the provider), and Rejected. All start at zero until providers send proposals.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Search and filters",
    content:
      "Search by provider name or project, filter by status (pending, accepted, rejected) or by project, and sort by date or bid amount.",
  },
  {
    target: '[data-tour-step="4"]',
    title: "Requests list",
    content:
      "Each card shows a provider's proposal—bid amount, timeline, cover letter. Hover or tap to see AI fit analysis. Click to view details and accept or reject.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Navigation menu",
    content:
      "Use this sidebar to go back to Dashboard, My Projects, Find Providers, Messages, and other sections.",
  },
];

export function CustomerRequestsTour() {
  return (
    <CustomerDashboardTour
      steps={REQUESTS_TOUR_STEPS}
      storageKeyPrefix="customer-requests-tour-done"
    />
  );
}
