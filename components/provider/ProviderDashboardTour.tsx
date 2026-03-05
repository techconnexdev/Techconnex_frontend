"use client";

import { CustomerDashboardTour, type TourStep } from "@/components/customer/CustomerDashboardTour";

const PROVIDER_DASHBOARD_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Welcome to your Provider Dashboard",
    content:
      "This is your home base for finding work and managing projects. Most areas will be empty at first. As you browse opportunities and work with clients, your stats and lists will fill in here.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Browse Jobs",
    content:
      "Start by clicking here to find project opportunities. You can search by skills, filter by budget or timeline, and send proposals to clients. AI recommendations will surface projects that match your profile.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Stats cards",
    content:
      "Active Projects (current work), Total Earnings (payments received), your Rating from client reviews, and Completed Projects. These numbers update as you complete work and receive reviews.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Active Projects",
    content:
      "Your in-progress projects appear here. Click any project to view details, milestones, and progress. Use View All to see your full project list.",
  },
  {
    target: '[data-tour-step="4"]',
    title: "AI Recommendations",
    content:
      "Top-matched projects based on your skills and preferences. Hover over cards to see why each is recommended. Click View Details to read the full opportunity and send a proposal.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Performance Metrics",
    content:
      "Your completion rate, on-time delivery, repeat clients, and response rate. These metrics help clients evaluate you. Keep them high to win more work.",
  },
  {
    target: '[data-tour-step="6"]',
    title: "Navigation menu",
    content:
      "Use this menu to go to My Projects, Opportunities, Find Companies, Messages, Earnings, and more. Dashboard shows this overview.",
  },
];

export function ProviderDashboardTour() {
  return (
    <CustomerDashboardTour
      steps={PROVIDER_DASHBOARD_STEPS}
      storageKeyPrefix="provider-dashboard-tour-done"
    />
  );
}
