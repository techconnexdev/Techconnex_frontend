import type { MessageKey } from "@/lib/i18n/messages";
import type { NotificationCategory } from "@/lib/notification-categories";

/** i18n keys for notification dropdown categories (customer & provider layouts). */
export const NOTIFICATION_CATEGORY_I18N_KEYS: Record<
  NotificationCategory,
  MessageKey
> = {
  announcements: "app.layout.notificationCategory.announcements",
  proposals: "app.layout.notificationCategory.proposals",
  milestones: "app.layout.notificationCategory.milestones",
  reviews: "app.layout.notificationCategory.reviews",
  payments: "app.layout.notificationCategory.payments",
  project: "app.layout.notificationCategory.project",
  system: "app.layout.notificationCategory.system",
};
