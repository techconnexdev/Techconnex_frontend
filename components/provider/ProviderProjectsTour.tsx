"use client";

import { CustomerDashboardTour, type TourStep } from "@/components/customer/CustomerDashboardTour";

const PROVIDER_PROJECTS_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "My Projects",
    content:
      "Manage and track all your active and completed projects. Use the tabs below to filter by status, and click any project to view details, milestones, and message clients.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Stats cards",
    content:
      "Total Projects, Active (in progress), Completed, Disputed, and Total Earnings. These numbers update as you work on projects and complete milestones.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Search & filter",
    content:
      "Search projects by name or description. Use the status dropdown to show only In Progress, Completed, or Disputed projects. Export Report downloads a PDF of your projects.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Project tabs",
    content:
      "Switch between All Projects, Active Projects, Completed, and Disputed. Each tab shows projects matching that status. Click project cards to view details or message the client.",
  },
  {
    target: '[data-tour-step="6"]',
    title: "Navigation menu",
    content:
      "Use this menu to go back to Dashboard, Opportunities, Messages, Earnings, and other sections.",
  },
];

export function ProviderProjectsTour() {
  return (
    <CustomerDashboardTour
      steps={PROVIDER_PROJECTS_STEPS}
      storageKeyPrefix="provider-projects-tour-done"
    />
  );
}
