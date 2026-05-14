import type { MessageKey } from "@/lib/i18n/messages/en"

export type DisputeT = (
  key: MessageKey,
  vars?: Record<string, string | number>
) => string

const DISPUTE_STATUS_KEY: Record<string, MessageKey> = {
  OPEN: "admin.disputes.status.OPEN",
  UNDER_REVIEW: "admin.disputes.status.UNDER_REVIEW",
  RESOLVED: "admin.disputes.status.RESOLVED",
  CLOSED: "admin.disputes.status.CLOSED",
  REJECTED: "admin.disputes.status.REJECTED",
  CANCELLED: "admin.disputes.status.CANCELLED",
}

export function disputeStatusLabel(
  status: string | undefined,
  t: DisputeT
): string {
  const k = DISPUTE_STATUS_KEY[status?.toUpperCase() ?? ""]
  if (k) return t(k)
  if (status) return status.replace(/_/g, " ")
  return t("admin.disputes.status.UNKNOWN")
}

const PAYMENT_STATUS_KEY: Record<string, MessageKey> = {
  ESCROWED: "admin.disputes.paymentStatus.ESCROWED",
  REFUNDED: "admin.disputes.paymentStatus.REFUNDED",
  RELEASED: "admin.disputes.paymentStatus.RELEASED",
  DISPUTED: "admin.disputes.paymentStatus.DISPUTED",
}

export function paymentStatusLabel(
  status: string | undefined,
  t: DisputeT
): string {
  const k = PAYMENT_STATUS_KEY[status?.toUpperCase() ?? ""]
  if (k) return t(k)
  return status?.length ? status : t("admin.disputes.na")
}
