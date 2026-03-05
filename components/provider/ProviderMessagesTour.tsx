"use client";

import { CustomerDashboardTour, type TourStep } from "@/components/customer/CustomerDashboardTour";

const PROVIDER_MESSAGES_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Conversations",
    content:
      "Your conversations with clients appear here. Search for a conversation, or click any chat to open it. The green badge shows you're connected. Unread counts appear next to each conversation.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Chat area",
    content:
      "Messages for the selected conversation appear here. Type in the input box and press Send. Use the paperclip to attach files. Click a client name to view their company profile.",
  },
  {
    target: '[data-tour-step="6"]',
    title: "Navigation menu",
    content:
      "Use this menu to go to Dashboard, Opportunities, Projects, Earnings, and other sections.",
  },
];

export function ProviderMessagesTour() {
  return (
    <CustomerDashboardTour
      steps={PROVIDER_MESSAGES_STEPS}
      storageKeyPrefix="provider-messages-tour-done"
    />
  );
}
