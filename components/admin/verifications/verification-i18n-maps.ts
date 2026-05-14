import type { MessageKey } from "@/lib/i18n/messages";
import type { VerificationRow } from "./types";

export const PILL_STATUS_KEYS: Record<
  VerificationRow["_uiStatus"],
  MessageKey
> = {
  uploaded: "admin.verifications.pill.uploaded",
  verified: "admin.verifications.pill.verified",
  rejected: "admin.verifications.pill.rejected",
};

export const UI_TYPE_KEYS: Record<VerificationRow["_uiType"], MessageKey> = {
  provider: "admin.verifications.type.provider",
  customer: "admin.verifications.type.customer",
  admin: "admin.verifications.type.admin",
};

const DOC_STATUS_KEYS: Record<string, MessageKey> = {
  uploaded: "admin.verifications.docStatus.uploaded",
  verified: "admin.verifications.docStatus.verified",
  rejected: "admin.verifications.docStatus.rejected",
};

export function docStatusLabel(
  status: string,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string
) {
  const key = DOC_STATUS_KEYS[status.toLowerCase()];
  return key ? t(key) : status;
}
