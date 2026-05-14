import type { MessageKey } from "@/lib/i18n/messages/en"

export type PaymentsT = (
  key: MessageKey,
  vars?: Record<string, string | number>
) => string

const PAYMENT_STATUS_KEY: Record<string, MessageKey> = {
  COMPLETED: "admin.payments.status.COMPLETED",
  TRANSFERRED: "admin.payments.status.TRANSFERRED",
  ESCROWED: "admin.payments.status.ESCROWED",
  RELEASED: "admin.payments.status.RELEASED",
  PENDING: "admin.payments.status.PENDING",
  IN_PROGRESS: "admin.payments.status.IN_PROGRESS",
  FAILED: "admin.payments.status.FAILED",
  REFUNDED: "admin.payments.status.REFUNDED",
  DISPUTED: "admin.payments.status.DISPUTED",
}

export function paymentStatusLabel(
  status: string | undefined,
  t: PaymentsT
): string {
  const k = PAYMENT_STATUS_KEY[status?.toUpperCase() ?? ""]
  if (k) return t(k)
  return status
    ? t("admin.payments.status.UNKNOWN", { status })
    : t("admin.payments.status.UNKNOWN", { status: "" })
}

const METHOD_KEY: Record<string, MessageKey> = {
  STRIPE: "admin.payments.method.STRIPE",
  FPX: "admin.payments.method.FPX",
  EWALLET: "admin.payments.method.EWALLET",
}

export function paymentMethodLabel(
  method: string | undefined,
  t: PaymentsT
): string {
  const k = METHOD_KEY[method?.toUpperCase() ?? ""]
  if (k) return t(k)
  return method || ""
}

const MILESTONE_STATUS_KEY: Record<string, MessageKey> = {
  APPROVED: "admin.payments.milestoneStatus.APPROVED",
  PENDING: "admin.payments.milestoneStatus.PENDING",
  IN_PROGRESS: "admin.payments.milestoneStatus.IN_PROGRESS",
  SUBMITTED: "admin.payments.milestoneStatus.SUBMITTED",
  REJECTED: "admin.payments.milestoneStatus.REJECTED",
  COMPLETED: "admin.payments.milestoneStatus.COMPLETED",
  PAID: "admin.payments.milestoneStatus.PAID",
}

export function milestoneStatusLabel(
  status: string | undefined,
  t: PaymentsT
): string {
  const k = MILESTONE_STATUS_KEY[status?.toUpperCase() ?? ""]
  if (k) return t(k)
  return status
    ? t("admin.payments.milestoneStatus.UNKNOWN", { status })
    : t("admin.payments.milestoneStatus.UNKNOWN", { status: "" })
}
