import type { MessageKey } from "@/lib/i18n/messages";

export type NotificationTranslate = (
  key: MessageKey,
  vars?: Record<string, string | number>,
) => string;

function asMeta(
  raw: unknown,
): Record<string, unknown> | null {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return null;
}

function str(v: unknown): string {
  return v != null && typeof v === "string" ? v : "";
}

function getEventType(n: {
  type?: string;
  metadata?: unknown;
  eventType?: string;
}): string | undefined {
  if (typeof n.eventType === "string" && n.eventType.trim()) {
    return n.eventType.trim();
  }
  const meta = asMeta(n.metadata);
  const et = meta?.eventType;
  return typeof et === "string" && et.trim() ? et.trim() : undefined;
}

export function notificationIntlLocale(locale: string): string {
  if (locale === "id") return "id-ID";
  if (locale === "ar") return "ar";
  return "en-US";
}

export function formatNotificationTimestamp(
  value: string | number | Date,
  intlLocale: string,
): string {
  const d =
    typeof value === "string" || typeof value === "number"
      ? new Date(value)
      : value;
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(intlLocale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function parseNewProposal(content: string): {
  providerName: string;
  projectTitle: string;
  currency: string;
  amount: string;
} | null {
  const m = content.match(
    /^You have received a new proposal from (.+?) for "([^"]+)"\. Bid amount:\s*(\S+)\s+([\d.]+)\s*$/,
  );
  if (!m) return null;
  return {
    providerName: m[1].trim(),
    projectTitle: m[2],
    currency: m[3],
    amount: m[4],
  };
}

function parseDisputeOpened(content: string): {
  raisedBy: string;
  projectTitle: string;
  reason: string;
} | null {
  const m = content.match(
    /^(.+?) opened a dispute on "([^"]*)"\. Reason: (.*)\.$/,
  );
  if (!m) return null;
  return { raisedBy: m[1].trim(), projectTitle: m[2], reason: m[3] };
}

function parseDisputeUpdated(content: string): {
  projectTitle: string;
  status: string;
} | null {
  const m = content.match(
    /^The dispute on "([^"]*)" was updated with new information or attachments\. Current status: (.+)\.$/,
  );
  if (!m) return null;
  return { projectTitle: m[1], status: m[2].trim() };
}

function parseDisputeAdminBody(content: string): {
  projectTitle: string;
  previousStatus: string;
  newStatus: string;
  resolution: string;
} | null {
  const m = content.match(
    /^An admin updated the dispute on "([^"]*)" from (\S+) to (\S+)\.([\s\S]*)$/,
  );
  if (!m) return null;
  return {
    projectTitle: m[1],
    previousStatus: m[2].trim(),
    newStatus: m[3].trim(),
    resolution: m[4].trim(),
  };
}

function disputeHeadlineKey(newStatus: string): MessageKey {
  switch (newStatus) {
    case "RESOLVED":
      return "app.layout.notificationEvent.disputeHeadline.resolved";
    case "REJECTED":
      return "app.layout.notificationEvent.disputeHeadline.rejected";
    case "CLOSED":
      return "app.layout.notificationEvent.disputeHeadline.closed";
    case "UNDER_REVIEW":
      return "app.layout.notificationEvent.disputeHeadline.underReview";
    case "OPEN":
      return "app.layout.notificationEvent.disputeHeadline.open";
    default:
      return "app.layout.notificationEvent.disputeHeadline.generic";
  }
}

function parsePaymentEscrowed(
  content: string,
  role: "provider" | "customer",
): { milestoneTitle: string } | null {
  if (role === "provider") {
    const m = content.match(
      /^Client has paid for milestone:\s*(.+?)\.\s*You can now start working!\s*$/,
    );
    if (!m) return null;
    return { milestoneTitle: m[1].trim() };
  }
  const m = content.match(
    /^Your payment for milestone "([^"]*)" is successful and now held in escrow\.\s*$/,
  );
  if (!m) return null;
  return { milestoneTitle: m[1] };
}

function parsePaymentReleasePending(content: string): {
  amount: string;
  accountName: string;
  bankName?: string;
} | null {
  const m1 = content.match(
    /^Payment of [A-Z]{3} ([\d.]+) needs to be transferred to (.+)$/,
  );
  if (m1) {
    const rest = m1[2].trim();
    const paren = rest.match(/^(.+?)\s*\((.+)\)\.\s*$/);
    if (paren) {
      return {
        amount: m1[1],
        accountName: paren[1].trim(),
        bankName: paren[2].trim(),
      };
    }
    return { amount: m1[1], accountName: rest.replace(/\.$/, "").trim() };
  }
  return null;
}

function parsePaymentReleased(content: string): { amount: string } | null {
  const m = content.match(
    /^Your payment of [A-Z]{3} ([\d.]+) is being processed\. You'll receive it within 1-3 business days\.\s*$/,
  );
  if (!m) return null;
  return { amount: m[1] };
}

function parsePaymentTransferred(content: string): {
  amount: string;
  reference: string;
} | null {
  const m = content.match(
    /^[A-Z]{3} ([\d.]+) has been transferred to your bank account\. Reference:\s*(.+)\s*$/,
  );
  if (!m) return null;
  return { amount: m[1], reference: m[2].trim() };
}

function parseRefundFull(content: string): { amount: string; reason: string } | null {
  const m = content.match(
    /^Your payment of [A-Z]{3} ([\d.]+) has been refunded\. Reason:\s*(.+)\s*$/,
  );
  if (!m) return null;
  return { amount: m[1], reason: m[2].trim() };
}

function parseMilestoneChangesRequested(content: string): {
  milestoneTitle: string;
  reason: string;
} | null {
  const m = content.match(
    /^Changes requested for milestone "([^"]*)"\.\s*Please review and resubmit\.(?:\s*Reason:\s*(.*))?$/,
  );
  if (!m) return null;
  return { milestoneTitle: m[1], reason: (m[2] || "").trim() };
}

function parseMilestoneApproved(content: string): { milestoneTitle: string } | null {
  const m = content.match(
    /^Milestone "([^"]*)" has been approved and is ready for payment\s*$/,
  );
  if (!m) return null;
  return { milestoneTitle: m[1] };
}

function parseMilestoneWorkStarted(content: string): {
  milestoneTitle: string;
} | null {
  const m = content.match(
    /^Provider has started working on milestone "([^"]*)"\s*$/,
  );
  if (!m) return null;
  return { milestoneTitle: m[1] };
}

function parseProjectStatusUpdated(content: string): {
  projectTitle: string;
  status: string;
} | null {
  const m = content.match(
    /^Project "([^"]*)" status has been updated to (\S+)\s*$/,
  );
  if (!m) return null;
  return { projectTitle: m[1], status: m[2] };
}

function parseDisputeAutoResolvedBody(content: string): {
  projectTitle: string;
} | null {
  const m = content.match(
    /^The dispute on "([^"]*)" was automatically marked resolved because the project was completed\.\s*$/,
  );
  if (!m) return null;
  return { projectTitle: m[1] };
}

function parseReviewReceived(content: string): {
  reviewerName: string;
  rating: string;
  projectTitle: string;
  excerpt: string;
} | null {
  const m = content.match(
    /^(.+?) left you a (\d+(?:\.\d+)?)-star review for the project "([^"]*)"\.\s*(?:Review:\s*([\s\S]*))?$/,
  );
  if (!m) return null;
  return {
    reviewerName: m[1].trim(),
    rating: m[2],
    projectTitle: m[3],
    excerpt: (m[4] || "").trim(),
  };
}

function parseMilestoneSubmitted(content: string): {
  milestoneTitle: string;
  hasAttachment: boolean;
} | null {
  const m1 = content.match(
    /^Milestone "([^"]*)" has been submitted for review with attachment\s*$/,
  );
  if (m1) return { milestoneTitle: m1[1], hasAttachment: true };
  const m2 = content.match(
    /^Milestone "([^"]*)" has been submitted for review\s*$/,
  );
  if (m2) return { milestoneTitle: m2[1], hasAttachment: false };
  return null;
}

function parseRefundPartial(content: string): {
  refundAmount: string;
  remaining: string;
  reason: string;
} | null {
  const m = content.match(
    /^A partial refund of [A-Z]{3} ([\d.]+) has been processed\. Remaining amount: [A-Z]{3} ([\d.]+)\. Reason:\s*(.+)\s*$/,
  );
  if (!m) return null;
  return { refundAmount: m[1], remaining: m[2], reason: m[3].trim() };
}

function parseUserRegistration(content: string): {
  userKind: string;
  name: string;
  email: string;
} | null {
  const m = content.match(
    /^A new (.+?) has registered:\s*(.+?)\s*\(([^)]+)\)\s*$/,
  );
  if (!m) return null;
  return { userKind: m[1].trim(), name: m[2].trim(), email: m[3].trim() };
}

function userKindFromRoles(
  roles: unknown,
  parsedKind: string | undefined,
  t: NotificationTranslate,
): string {
  const rs = Array.isArray(roles) ? roles.map((x) => String(x)) : [];
  if (rs.includes("ADMIN")) {
    return t("app.layout.notificationEvent.user_registration.userKind.admin");
  }
  if (rs.includes("PROVIDER") && rs.includes("CUSTOMER")) {
    return t(
      "app.layout.notificationEvent.user_registration.userKind.providerCustomer",
    );
  }
  if (rs.includes("PROVIDER")) {
    return t("app.layout.notificationEvent.user_registration.userKind.provider");
  }
  if (rs.includes("CUSTOMER")) {
    return t("app.layout.notificationEvent.user_registration.userKind.customer");
  }
  if (parsedKind) return parsedKind;
  return t("app.layout.notificationEvent.user_registration.userKind.user");
}

function parseKycApproved(content: string): { notes: string } {
  const base =
    "Your KYC verification has been approved. Your account is now verified.";
  if (content.startsWith(base)) {
    const rest = content.slice(base.length).trim();
    if (rest.startsWith("Notes:")) {
      return { notes: rest.replace(/^Notes:\s*/i, "").trim() };
    }
  }
  return { notes: "" };
}

function parseKycRejected(content: string): { notes: string } {
  const prefix = "Your KYC verification has been rejected.";
  if (!content.startsWith(prefix)) return { notes: "" };
  const rest = content.slice(prefix.length).trim();
  if (rest.startsWith("Reason:")) {
    return { notes: rest.replace(/^Reason:\s*/i, "").trim() };
  }
  if (
    rest.startsWith("Please review your documents") ||
    rest === "Please review your documents and resubmit."
  ) {
    return { notes: "" };
  }
  return { notes: rest };
}

/**
 * Localizes known server-driven notification titles/bodies using metadata and
 * stable English patterns. Falls back to API strings when unknown.
 */
export function getLocalizedNotificationText(
  raw: {
    title: string;
    content: string;
    type?: string;
    metadata?: unknown;
    /** When present (e.g. grouped API row), used before metadata.eventType */
    eventType?: string;
  },
  t: NotificationTranslate,
): { title: string; content: string } {
  const title = String(raw.title ?? "");
  const content = String(raw.content ?? "");
  const type = String(raw.type ?? "");
  const meta = asMeta(raw.metadata);
  const eventType = getEventType(raw);

  const metaTitle = str(meta?.projectTitle) || str(meta?.milestoneTitle);
  const milestoneTitle =
    str(meta?.milestoneTitle) || str(meta?.serviceRequestTitle);

  try {
    if (eventType === "new_proposal") {
      const parsed = parseNewProposal(content);
      if (parsed) {
        return {
          title: t("app.layout.notificationEvent.new_proposal.title"),
          content: t("app.layout.notificationEvent.new_proposal.content", {
            providerName: parsed.providerName,
            projectTitle: parsed.projectTitle,
            currency: parsed.currency,
            amount: parsed.amount,
          }),
        };
      }
    }

    if (eventType === "proposal_accepted") {
      return {
        title: t("app.layout.notificationEvent.proposal_accepted.title"),
        content: t("app.layout.notificationEvent.proposal_accepted.content"),
      };
    }

    if (eventType === "proposal_rejected") {
      const pt = str(meta?.projectTitle) || metaTitle;
      const reason = str(meta?.reason);
      return {
        title: t("app.layout.notificationEvent.proposal_rejected.title"),
        content: t("app.layout.notificationEvent.proposal_rejected.content", {
          projectTitle: pt || "—",
          reason: reason || "—",
        }),
      };
    }

    if (eventType === "milestones_updated") {
      if (content.includes("The provider has")) {
        const pt = str(meta?.projectTitle) || metaTitle;
        return {
          title: t("app.layout.notificationEvent.milestones_updated.title"),
          content: t(
            "app.layout.notificationEvent.milestones_updated.providerBody",
            { projectTitle: pt || "—" },
          ),
        };
      }
      if (content.includes("The company has")) {
        const pt = str(meta?.projectTitle) || metaTitle;
        return {
          title: t("app.layout.notificationEvent.milestones_updated.title"),
          content: t(
            "app.layout.notificationEvent.milestones_updated.companyBody",
            { projectTitle: pt || "—" },
          ),
        };
      }
    }

    if (eventType === "milestones_locked") {
      const pt = str(meta?.projectTitle) || metaTitle;
      if (content.includes("You can now start working on the first milestone")) {
        return {
          title: t("app.layout.notificationEvent.milestones_locked.title"),
          content: t(
            "app.layout.notificationEvent.milestones_locked.providerBody",
            { projectTitle: pt || "—" },
          ),
        };
      }
      if (content.includes("The provider can now start working")) {
        return {
          title: t("app.layout.notificationEvent.milestones_locked.title"),
          content: t(
            "app.layout.notificationEvent.milestones_locked.customerBody",
            { projectTitle: pt || "—" },
          ),
        };
      }
    }

    if (eventType === "milestones_approved_by_provider") {
      const pt = str(meta?.projectTitle) || metaTitle;
      return {
        title: t(
          "app.layout.notificationEvent.milestones_approved_by_provider.title",
        ),
        content: t(
          "app.layout.notificationEvent.milestones_approved_by_provider.content",
          { projectTitle: pt || "—" },
        ),
      };
    }

    if (eventType === "milestones_approved_by_company") {
      const pt = str(meta?.projectTitle) || metaTitle;
      return {
        title: t(
          "app.layout.notificationEvent.milestones_approved_by_company.title",
        ),
        content: t(
          "app.layout.notificationEvent.milestones_approved_by_company.content",
          { projectTitle: pt || "—" },
        ),
      };
    }

    if (eventType === "milestone_changes_requested") {
      const parsed = parseMilestoneChangesRequested(content);
      const mt =
        str(meta?.milestoneTitle) || milestoneTitle || parsed?.milestoneTitle;
      const pt = str(meta?.projectTitle) || metaTitle;
      const reason = str(meta?.reason) || parsed?.reason || "—";
      if (mt) {
        return {
          title: t(
            "app.layout.notificationEvent.milestone_changes_requested.title",
          ),
          content: t(
            "app.layout.notificationEvent.milestone_changes_requested.content",
            {
              milestoneTitle: mt,
              projectTitle: pt || "—",
              reason,
            },
          ),
        };
      }
    }

    if (eventType === "milestone_approved") {
      const parsed = parseMilestoneApproved(content);
      const mt =
        str(meta?.milestoneTitle) || milestoneTitle || parsed?.milestoneTitle;
      const pt = str(meta?.projectTitle) || metaTitle;
      if (mt) {
        return {
          title: t("app.layout.notificationEvent.milestone_approved.title"),
          content: t(
            "app.layout.notificationEvent.milestone_approved.content",
            {
              milestoneTitle: mt,
              projectTitle: pt || "—",
            },
          ),
        };
      }
    }

    if (eventType === "milestone_submitted") {
      const parsed = parseMilestoneSubmitted(content);
      const mt =
        str(meta?.milestoneTitle) || milestoneTitle || parsed?.milestoneTitle;
      const pt = str(meta?.projectTitle) || metaTitle;
      const hasAttachment =
        meta?.hasAttachment === true || parsed?.hasAttachment === true;
      if (mt) {
        return {
          title: t("app.layout.notificationEvent.milestone_submitted.title"),
          content: hasAttachment
            ? t(
                "app.layout.notificationEvent.milestone_submitted.contentWithAttachment",
                { milestoneTitle: mt, projectTitle: pt || "—" },
              )
            : t(
                "app.layout.notificationEvent.milestone_submitted.contentNoAttachment",
                { milestoneTitle: mt, projectTitle: pt || "—" },
              ),
        };
      }
    }

    if (eventType === "milestone_work_started") {
      const parsed = parseMilestoneWorkStarted(content);
      const mt =
        str(meta?.milestoneTitle) || milestoneTitle || parsed?.milestoneTitle;
      const pt = str(meta?.projectTitle) || metaTitle;
      if (mt) {
        return {
          title: t("app.layout.notificationEvent.milestone_work_started.title"),
          content: t(
            "app.layout.notificationEvent.milestone_work_started.content",
            { milestoneTitle: mt, projectTitle: pt || "—" },
          ),
        };
      }
    }

    if (eventType === "project_status_updated") {
      const parsed = parseProjectStatusUpdated(content);
      const pt =
        str(meta?.projectTitle) || metaTitle || parsed?.projectTitle || "—";
      const st = str(meta?.newStatus) || parsed?.status || "—";
      return {
        title: t("app.layout.notificationEvent.project_status_updated.title"),
        content: t(
          "app.layout.notificationEvent.project_status_updated.content",
          { projectTitle: pt, status: st },
        ),
      };
    }

    if (eventType === "payment_escrowed") {
      const providerParsed = parsePaymentEscrowed(content, "provider");
      if (providerParsed) {
        return {
          title: t(
            "app.layout.notificationEvent.payment_escrowed.providerTitle",
          ),
          content: t(
            "app.layout.notificationEvent.payment_escrowed.providerContent",
            { milestoneTitle: providerParsed.milestoneTitle },
          ),
        };
      }

      const customerParsed = parsePaymentEscrowed(content, "customer");
      if (customerParsed) {
        return {
          title: t(
            "app.layout.notificationEvent.payment_escrowed.customerTitle",
          ),
          content: t(
            "app.layout.notificationEvent.payment_escrowed.customerContent",
            { milestoneTitle: customerParsed.milestoneTitle },
          ),
        };
      }
    }

    if (eventType === "dispute_created") {
      const parsed = parseDisputeOpened(content);
      if (parsed) {
        return {
          title: t("app.layout.notificationEvent.dispute_created.title"),
          content: t("app.layout.notificationEvent.dispute_created.content", {
            raisedBy: parsed.raisedBy,
            projectTitle: parsed.projectTitle,
            reason: parsed.reason,
          }),
        };
      }
    }

    if (eventType === "dispute_updated") {
      const parsed = parseDisputeUpdated(content);
      if (parsed) {
        return {
          title: t("app.layout.notificationEvent.dispute_updated.title"),
          content: t("app.layout.notificationEvent.dispute_updated.content", {
            projectTitle: parsed.projectTitle,
            status: parsed.status,
          }),
        };
      }
    }

    if (eventType === "dispute_admin_decision") {
      const ns = str(meta?.newStatus);
      const parsed = parseDisputeAdminBody(content);
      if (parsed && ns) {
        const res = parsed.resolution
          ? ` ${parsed.resolution}`
          : "";
        return {
          title: t(disputeHeadlineKey(ns)),
          content: t(
            "app.layout.notificationEvent.dispute_admin_decision.content",
            {
              projectTitle: parsed.projectTitle,
              previousStatus: parsed.previousStatus,
              newStatus: parsed.newStatus,
              resolution: res,
            },
          ),
        };
      }
    }

    if (eventType === "dispute_auto_resolved") {
      const parsed = parseDisputeAutoResolvedBody(content);
      const pt =
        str(meta?.projectTitle) || metaTitle || parsed?.projectTitle || "—";
      return {
        title: t("app.layout.notificationEvent.dispute_auto_resolved.title"),
        content: t(
          "app.layout.notificationEvent.dispute_auto_resolved.content",
          { projectTitle: pt },
        ),
      };
    }

    if (eventType === "review_received") {
      const parsed = parseReviewReceived(content);
      const reviewerName =
        str(meta?.reviewerName) || parsed?.reviewerName || "";
      const rating = str(meta?.rating) || parsed?.rating || "";
      const pt =
        str(meta?.projectTitle) || metaTitle || parsed?.projectTitle || "";
      const excerpt = parsed?.excerpt || "";
      if (reviewerName && rating && pt) {
        if (excerpt) {
          return {
            title: t("app.layout.notificationEvent.review_received.title"),
            content: t(
              "app.layout.notificationEvent.review_received.contentWithExcerpt",
              { reviewerName, rating, projectTitle: pt, excerpt },
            ),
          };
        }
        return {
          title: t("app.layout.notificationEvent.review_received.title"),
          content: t("app.layout.notificationEvent.review_received.content", {
            reviewerName,
            rating,
            projectTitle: pt,
          }),
        };
      }
    }

    if (eventType === "user_registration") {
      const parsed = parseUserRegistration(content);
      const name = str(meta?.newUserName) || parsed?.name || "—";
      const email = str(meta?.newUserEmail) || parsed?.email || "—";
      const userKind = userKindFromRoles(
        meta?.newUserRole,
        parsed?.userKind,
        t,
      );
      return {
        title: t("app.layout.notificationEvent.user_registration.title"),
        content: t("app.layout.notificationEvent.user_registration.content", {
          userKind,
          name,
          email,
        }),
      };
    }

    if (eventType === "announcement") {
      return { title, content };
    }

    if (type === "system" && title === "KYC Verification Approved") {
      const { notes } = parseKycApproved(content);
      return {
        title: t("app.layout.notificationEvent.kyc_approved.title"),
        content: notes
          ? t("app.layout.notificationEvent.kyc_approved.contentWithNotes", {
              notes,
            })
          : t("app.layout.notificationEvent.kyc_approved.content"),
      };
    }

    if (type === "system" && title === "KYC Verification Rejected") {
      const { notes } = parseKycRejected(content);
      return {
        title: t("app.layout.notificationEvent.kyc_rejected.title"),
        content: notes
          ? t("app.layout.notificationEvent.kyc_rejected.contentWithReason", {
              notes,
            })
          : t("app.layout.notificationEvent.kyc_rejected.content"),
      };
    }

    if (type === "PAYMENT_RELEASE_PENDING") {
      const parsed = parsePaymentReleasePending(content);
      if (parsed) {
        return {
          title: t("app.layout.notificationEvent.payment_release_pending.title"),
          content: parsed.bankName
            ? t(
                "app.layout.notificationEvent.payment_release_pending.contentWithBank",
                {
                  amount: parsed.amount,
                  accountName: parsed.accountName,
                  bankName: parsed.bankName,
                },
              )
            : t("app.layout.notificationEvent.payment_release_pending.content", {
                amount: parsed.amount,
                accountName: parsed.accountName,
              }),
        };
      }
    }

    if (type === "PAYMENT_RELEASED") {
      const parsed = parsePaymentReleased(content);
      if (parsed) {
        return {
          title: t("app.layout.notificationEvent.payment_released.title"),
          content: t("app.layout.notificationEvent.payment_released.content", {
            amount: parsed.amount,
          }),
        };
      }
    }

    if (type === "PAYMENT_TRANSFERRED") {
      const parsed = parsePaymentTransferred(content);
      if (parsed) {
        return {
          title: t("app.layout.notificationEvent.payment_transferred.title"),
          content: t(
            "app.layout.notificationEvent.payment_transferred.content",
            { amount: parsed.amount, reference: parsed.reference },
          ),
        };
      }
    }

    if (type === "PAYMENT_REFUNDED") {
      const parsedFull = parseRefundFull(content);
      if (parsedFull) {
        return {
          title: t("app.layout.notificationEvent.payment_refunded_full.title"),
          content: t(
            "app.layout.notificationEvent.payment_refunded_full.content",
            { amount: parsedFull.amount, reason: parsedFull.reason },
          ),
        };
      }

      const parsedPartial = parseRefundPartial(content);
      if (parsedPartial) {
        return {
          title: t(
            "app.layout.notificationEvent.payment_refunded_partial.title",
          ),
          content: t(
            "app.layout.notificationEvent.payment_refunded_partial.content",
            {
              refundAmount: parsedPartial.refundAmount,
              remaining: parsedPartial.remaining,
              reason: parsedPartial.reason,
            },
          ),
        };
      }
    }

    if (type === "payment" && title === "Payment Update") {
      const m = content.match(
        /^Payment for milestone "([^"]*)" has been processed \(RM ([\d.]+)\)\s*$/,
      );
      const pt = str(meta?.projectTitle) || metaTitle;
      if (m) {
        return {
          title: t("app.layout.notificationEvent.payment_milestone_processed.title"),
          content: t(
            "app.layout.notificationEvent.payment_milestone_processed.content",
            { milestoneTitle: m[1], amount: m[2], projectTitle: pt || "—" },
          ),
        };
      }
    }

    if (title === "Project Completed" && type === "system") {
      const pt = str(meta?.projectTitle) || metaTitle;
      return {
        title: t("app.layout.notificationEvent.project_completed.title"),
        content: t("app.layout.notificationEvent.project_completed.content", {
          projectTitle: pt || "—",
        }),
      };
    }
  } catch {
    /* fall through */
  }

  return { title, content };
}
