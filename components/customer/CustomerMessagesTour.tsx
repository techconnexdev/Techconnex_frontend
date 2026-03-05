"use client";

import { CustomerDashboardTour, type TourStep } from "./CustomerDashboardTour";

const MESSAGES_TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour-step="0"]',
    title: "Conversations list",
    content:
      "Your chats with providers appear here. Click any conversation to open it. The green badge shows you're online. For new users, the list may be empty until you contact a provider or accept a proposal.",
  },
  {
    target: '[data-tour-step="1"]',
    title: "Chat area",
    content:
      "When you select a conversation, messages appear here. Type your message and click Send, or attach files. You can also share project requests with the provider.",
  },
  {
    target: '[data-tour-step="5"]',
    title: "Navigation menu",
    content:
      "Use this sidebar to go back to Dashboard, My Projects, Find Providers, and other sections.",
  },
];

export function CustomerMessagesTour() {
  return (
    <CustomerDashboardTour
      steps={MESSAGES_TOUR_STEPS}
      storageKeyPrefix="customer-messages-tour-done"
    />
  );
}
