"use client";

import { CustomerDashboardTour, type TourStep } from "@/components/customer/CustomerDashboardTour";

const PROVIDER_PROFILE_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "My Profile",
    content:
      "Manage your professional profile and showcase your expertise. A complete profile helps clients find you and win more projects.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Edit Profile",
    content:
      "Click here to edit your profile. Update your bio, location, major, hourly rate, skills, and more. Save Changes when done.",
  },
  {
    target: '[data-tour-step="2"]',
    title: "Profile Completion",
    content:
      "This shows how complete your profile is. Add missing information to reach 100%. Suggestions appear for incomplete sections. Higher completion attracts more clients.",
  },
  {
    target: '[data-tour-step="3"]',
    title: "Tabs",
    content:
      "Overview: basic info, resume, certifications. Portfolio: platform projects and external work. Skills: languages, technical skills, budget preferences. Verification: upload KYC documents.",
  },
  {
    target: '[data-tour-step="4"]',
    title: "Basic Information",
    content:
      "Your photo, name, email, location, major, and bio. Click the camera icon (in edit mode) to upload a profile photo. This is how clients see you.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Resume & Certifications",
    content:
      "Upload your resume and add certifications. These build trust with clients. Use Portfolio tab to add project work and Skills tab to list your expertise.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Performance & Contact",
    content:
      "Performance Stats shows your rating, projects, and earnings. Contact info and Portfolio Links appear here. Edit mode lets you update website and portfolio URLs.",
  },
  {
    target: '[data-tour-step="6"]',
    title: "Navigation menu",
    content:
      "Use this menu to go to Dashboard, Opportunities, Messages, Earnings, and other sections.",
  },
];

export function ProviderProfileTour() {
  return (
    <CustomerDashboardTour
      steps={PROVIDER_PROFILE_STEPS}
      storageKeyPrefix="provider-profile-tour-done"
    />
  );
}
