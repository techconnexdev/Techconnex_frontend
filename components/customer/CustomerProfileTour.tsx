"use client";

import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";

const PROFILE_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "My Profile",
    content:
      "Manage your company profile and account settings. A complete profile helps providers understand your needs and increases your visibility.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Edit profile",
    content:
      "Click here to edit your profile. Add or update your company description, industry, location, and other details. Save changes when done.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Profile completion",
    content:
      "This shows how complete your profile is. Add missing information to reach 100% and attract more providers. Suggestions will appear for incomplete sections.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Profile tabs",
    content:
      "Profile (account info), Company (business details), and Verification (KYC documents). Switch tabs to edit each section.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Navigation menu",
    content:
      "Use this sidebar to go back to Dashboard, My Projects, Find Providers, and other sections.",
  },
];

export function CustomerProfileTour() {
  return (
    <CustomerDashboardTour
      steps={PROFILE_TOUR_STEPS}
      storageKeyPrefix="customer-profile-tour-done"
    />
  );
}
