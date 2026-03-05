"use client";

import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";

const SETTINGS_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Settings",
    content:
      "Manage your account preferences, privacy controls, and security. Use the tabs below to switch between Privacy and Security settings.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Privacy tab",
    content:
      "Click here to open the Privacy settings. Switch to Security to change your password or delete your account.",
  },
  {
    target: '[data-tour-step="priv-card"]',
    title: "Privacy Settings",
    content:
      "Control what providers can see on your profile. Toggle Show Email to let providers see your email. Show Phone lets them see your phone number. Allow Direct Messages enables providers to contact you through the platform. Use Save Settings to apply your changes.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Security tab",
    content:
      "Change your password and manage account security. Use a strong password. The Delete Account option permanently removes your account and all data.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Navigation menu",
    content:
      "Use this sidebar to go back to Dashboard, My Projects, Find Providers, and other sections.",
  },
];

export function CustomerSettingsTour() {
  return (
    <CustomerDashboardTour
      steps={SETTINGS_TOUR_STEPS}
      storageKeyPrefix="customer-settings-tour-done"
    />
  );
}
