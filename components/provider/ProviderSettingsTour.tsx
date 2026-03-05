"use client";

import { CustomerDashboardTour, type TourStep } from "@/components/customer/CustomerDashboardTour";

const PROVIDER_SETTINGS_STEPS: TourStep[] = [
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
      "Control what clients can see on your profile. Toggle Show Email to let clients see your email. Show Phone lets them see your phone number. Allow Direct Messages enables clients to contact you through the platform. Use Save Settings to apply your changes.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Security tab",
    content:
      "Change your password and manage account security. Use a strong password (8+ chars, upper/lowercase, number, special character). The Delete Account option permanently removes your account and all data.",
  },
  {
    target: '[data-tour-step="sec-card"]',
    title: "Change Password",
    content:
      "Enter your current password, then a new one. The strength meter shows if your password meets requirements. Confirm the new password and click Update Password.",
  },
  {
    target: '[data-tour-step="del-card"]',
    title: "Delete Account",
    content:
      "Permanently delete your account and all associated data. This action cannot be undone. All projects, messages, and earnings history will be lost.",
  },
  {
    target: '[data-tour-step="6"]',
    title: "Navigation menu",
    content:
      "Use this menu to go to Dashboard, Opportunities, Messages, Earnings, and other sections.",
  },
];

export function ProviderSettingsTour() {
  return (
    <CustomerDashboardTour
      steps={PROVIDER_SETTINGS_STEPS}
      storageKeyPrefix="provider-settings-tour-done"
    />
  );
}
