"use client";

import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";

const REVIEWS_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Company Reviews",
    content:
      "Track reviews you've written for providers, feedback you've received, and any completed projects that still need your review. For new users, most areas will be empty at first.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Write a review",
    content:
      "After a project is completed, click here to leave a review for the provider. Rate communication, quality, timeliness, and professionalism. You can edit reviews you've already written.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Review stats",
    content:
      "Total reviews (given + received), your average rating from providers, and how many completed projects are still awaiting your feedback. All start at zero for new users.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Search and filters",
    content:
      "Search by provider or project name, filter by star rating, and sort by date or rating. Use these to find specific reviews quickly.",
  },
  {
    target: '[data-tour-step="4"]',
    title: "Reviews tabs",
    content:
      "Reviews Given (reviews you wrote), Reviews Received (feedback from providers), and Pending (completed projects waiting for your review). Switch tabs to see each type.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Navigation menu",
    content:
      "Use this sidebar to go back to Dashboard, My Projects, Find Providers, and other sections.",
  },
];

export function CustomerReviewsTour() {
  return (
    <CustomerDashboardTour
      steps={REVIEWS_TOUR_STEPS}
      storageKeyPrefix="customer-reviews-tour-done"
    />
  );
}
