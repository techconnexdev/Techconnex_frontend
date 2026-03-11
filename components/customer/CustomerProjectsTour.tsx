"use client";

import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";

const PROJECTS_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "My Projects",
    content:
      "This is where you manage all your ICT projects. For new users, the list may be empty until you create your first project.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Create a new project",
    content:
      "Click here to start a new project. You can add details, set a budget, and providers will be able to find and send proposals to your project.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Project stats",
    content:
      "Quick overview of your projects: Total count, Active (in progress), Completed, Pending (awaiting providers), and Disputed. All start at zero for new users.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Search and filters",
    content:
      "Search by name, filter by status (pending, in progress, completed), sort by date or budget, and switch between grid or list view.",
  },
  {
    target: '[data-tour-step="4"]',
    title: "Projects list",
    content:
      "Your projects appear here. Click any card to view details, message your provider, or track progress.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Navigation menu",
    content:
      "Use this sidebar to jump back to Dashboard, Find Providers, Messages, Billing, and other sections.",
  },
];

export function CustomerProjectsTour() {
  return (
    <CustomerDashboardTour
      steps={PROJECTS_TOUR_STEPS}
      storageKeyPrefix="customer-projects-tour-done"
    />
  );
}
