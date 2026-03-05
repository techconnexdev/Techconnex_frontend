"use client";

import { CustomerDashboardTour, type TourStep } from "@/components/customer/CustomerDashboardTour";

const PROVIDER_REVIEWS_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Reviews & Feedback",
    content:
      "Manage reviews you leave for clients and feedback you receive. Write reviews for completed projects, read reviews from companies, and respond to feedback.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Write Review",
    content:
      "Click here to leave a review for a completed or disputed project. Rate Communication, Clarity, Payment, and Professionalism, then add your feedback.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Stats cards",
    content:
      "Total Reviews (given + received), Average Rating (from reviews you received), and Pending Reviews (completed projects awaiting your review).",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Search & filters",
    content:
      "Search by company or project name. Filter by star rating (1–5) and sort by Newest, Oldest, Highest rating, or Lowest rating.",
  },
  {
    target: '[data-tour-step="4"]',
    title: "Tabs",
    content:
      "Reviews Given: reviews you wrote for clients. Reviews Received: feedback from companies about your work. Pending: completed projects you haven't reviewed yet.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Review list",
    content:
      "Your reviews or received reviews appear here. Edit or delete your reviews. Reply to reviews you received. For Pending tab, click Write Review on any project to leave feedback.",
  },
  {
    target: '[data-tour-step="6"]',
    title: "Navigation menu",
    content:
      "Use this menu to go to Dashboard, Opportunities, Messages, Earnings, and other sections.",
  },
];

export function ProviderReviewsTour() {
  return (
    <CustomerDashboardTour
      steps={PROVIDER_REVIEWS_STEPS}
      storageKeyPrefix="provider-reviews-tour-done"
    />
  );
}
