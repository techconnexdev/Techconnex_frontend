/**
 * Maps notification type (and optional eventType) to a display category
 * for grouping in the notification dropdown (Proposals, Milestones, Reviews, etc.).
 */

export type NotificationCategory =
  | "proposals"
  | "milestones"
  | "reviews"
  | "payments"
  | "project"
  | "system";

export const DISPLAY_CATEGORIES: NotificationCategory[] = [
  "proposals",
  "milestones",
  "reviews",
  "payments",
  "project",
  "system",
];

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  proposals: "Proposals",
  milestones: "Milestones",
  reviews: "Reviews",
  payments: "Payments",
  project: "Project updates",
  system: "System",
};

/**
 * Returns the display category for a notification given its type and optional eventType.
 */
export function getNotificationCategory(
  type: string,
  eventType?: string | null
): NotificationCategory {
  const t = (type || "").trim();
  const e = (eventType || "").trim();

  if (t === "proposal") return "proposals";
  if (t === "milestone") return "milestones";
  if (t === "system" && e === "review_received") return "reviews";
  if (t === "project") return "project";

  const lower = t.toLowerCase();
  if (
    lower.startsWith("payment") ||
    lower.startsWith("payment_") ||
    lower.startsWith("refund_") ||
    lower.startsWith("dispute_")
  ) {
    return "payments";
  }
  if (
    t === "PAYMENT_ESCROWED" ||
    t === "PAYMENT_RELEASE_PENDING" ||
    t === "PAYMENT_RELEASED" ||
    t === "PAYMENT_TRANSFERRED" ||
    t === "PAYMENT_REFUNDED" ||
    t === "PAYMENT_FAILED" ||
    t === "REFUND_COMPLETED" ||
    t === "DISPUTE_CREATED" ||
    t === "DISPUTE_RESOLVED"
  ) {
    return "payments";
  }

  return "system";
}
