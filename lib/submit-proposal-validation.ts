import { MIN_MONETARY_AMOUNT } from "@/lib/amount-constraints";
import { timelineToDays } from "@/lib/timeline-utils";
import type {
  ProposalFormData,
  ProposalMilestone,
} from "@/components/provider/opportunities/submit-proposal-types";

export function validateProviderProposal(
  form: ProposalFormData,
  t: (key: string, values?: Record<string, string | number>) => string,
) {
  const newErrors: {
    bidAmount?: string;
    timelineAmount?: string;
    timelineUnit?: string;
    coverLetter?: string;
    milestones?: string;
    milestoneFields?: Record<
      number,
      {
        title?: string;
        description?: string;
        amount?: string;
        dueDate?: string;
        daysFromStart?: string;
        durationAmount?: string;
        durationUnit?: string;
      }
    >;
  } = {};

  const messages: string[] = [];

  const bidAmountNum = Number(form.bidAmount);
  const bidAmountClientNum = Number(form.bidAmountProject || form.bidAmount);
  if (!form.bidAmount) {
    const msg = t("provider.opportunities.validation.bidRequired");
    newErrors.bidAmount = msg;
    messages.push(msg);
  } else if (
    isNaN(bidAmountNum) ||
    bidAmountNum < MIN_MONETARY_AMOUNT
  ) {
    const msg = t("provider.opportunities.validation.amountMin", {
      min: MIN_MONETARY_AMOUNT,
    });
    newErrors.bidAmount = msg;
    messages.push(msg);
  }

  const timelineAmountNum = Number(form.timelineAmount);
  if (!form.timelineAmount) {
    const msg = t("provider.opportunities.validation.timelineAmountRequired");
    newErrors.timelineAmount = msg;
    messages.push(msg);
  } else if (isNaN(timelineAmountNum) || timelineAmountNum <= 0) {
    const msg = t("provider.opportunities.validation.timelineAmountPositive");
    newErrors.timelineAmount = msg;
    messages.push(msg);
  }

  if (!form.timelineUnit) {
    const msg = t("provider.opportunities.validation.timelineUnitRequired");
    newErrors.timelineUnit = msg;
    messages.push(msg);
  }

  if (!form.coverLetter || form.coverLetter.trim().length < 20) {
    const msg = t("provider.opportunities.validation.coverLetterMin");
    newErrors.coverLetter = msg;
    messages.push(msg);
  }

  const milestoneFieldErrors: Record<
    number,
    {
      title?: string;
      description?: string;
      amount?: string;
      dueDate?: string;
      daysFromStart?: string;
      durationAmount?: string;
      durationUnit?: string;
    }
  > = {};

  const deliveryTimeDays = timelineToDays(
    Number(form.timelineAmount),
    form.timelineUnit,
  );

  if (form.milestones.length === 0) {
    const msg = t("provider.opportunities.validation.milestonesRequired");
    newErrors.milestones = msg;
    messages.push(msg);
  } else {
    form.milestones.forEach((m: ProposalMilestone, idx: number) => {
      milestoneFieldErrors[idx] = {};

      if (!m.title || !m.title.trim()) {
        const errorMsg = t("provider.projects.validation.titleRequired");
        milestoneFieldErrors[idx].title = errorMsg;
        messages.push(
          t("provider.opportunities.validation.milestoneTitle", {
            n: idx + 1,
          }),
        );
      }
      if (!m.description || !m.description.trim()) {
        const errorMsg = t("provider.projects.validation.descriptionRequired");
        milestoneFieldErrors[idx].description = errorMsg;
        messages.push(
          t("provider.opportunities.validation.milestoneDescription", {
            n: idx + 1,
          }),
        );
      }
      if (
        m.amount == null ||
        isNaN(Number(m.amount)) ||
        Number(m.amount) < MIN_MONETARY_AMOUNT
      ) {
        const errorMsg = t("provider.opportunities.validation.amountMin", {
          min: MIN_MONETARY_AMOUNT,
        });
        milestoneFieldErrors[idx].amount = errorMsg;
        messages.push(
          t("provider.opportunities.validation.milestoneAmount", {
            n: idx + 1,
            min: MIN_MONETARY_AMOUNT,
          }),
        );
      }
      const durAmount =
        m.durationAmount != null ? String(m.durationAmount).trim() : "";
      const durUnit = m.durationUnit || "";
      if (!durAmount || isNaN(Number(durAmount)) || Number(durAmount) <= 0) {
        milestoneFieldErrors[idx].durationAmount = t(
          "provider.projects.validation.durationAmount",
        );
        messages.push(
          t("provider.opportunities.validation.milestoneDurationAmount", {
            n: idx + 1,
          }),
        );
      }
      if (!durUnit) {
        const unitMsg = t("provider.projects.validation.durationUnit");
        milestoneFieldErrors[idx].durationUnit = unitMsg;
        messages.push(
          t("provider.opportunities.validation.milestoneDurationUnit", {
            n: idx + 1,
          }),
        );
      }
    });

    if (deliveryTimeDays > 0 && form.milestones.length > 0) {
      const milestonesDurationDays = form.milestones.reduce((sum, m) => {
        const d = timelineToDays(
          Number(m.durationAmount || 0),
          m.durationUnit || "",
        );
        return sum + (d > 0 ? d : 0);
      }, 0);
      if (milestonesDurationDays !== deliveryTimeDays) {
        const msg = t("provider.opportunities.validation.durationSumMismatch", {
          expected: deliveryTimeDays,
          actual: milestonesDurationDays,
        });
        newErrors.milestones = newErrors.milestones || msg;
        messages.push(msg);
      }
    }

    if (Object.keys(milestoneFieldErrors).length > 0) {
      newErrors.milestoneFields = milestoneFieldErrors;
    }

    if (!isNaN(bidAmountClientNum) && bidAmountClientNum > 0) {
      const sumMilestonesClient = form.milestones.reduce(
        (sum: number, m: ProposalMilestone) => {
          const val = Number(
            m.amountProjectStr != null && String(m.amountProjectStr).trim() !== ""
              ? m.amountProjectStr
              : m.amount,
          );
          if (!isNaN(val)) return sum + val;
          return sum;
        },
        0,
      );
      const roundedSum = Number(sumMilestonesClient.toFixed(2));
      const roundedBid = Number(bidAmountClientNum.toFixed(2));
      const equalWithinTolerance = Math.abs(roundedSum - roundedBid) <= 0.01;

      if (!equalWithinTolerance) {
        const msg = t("provider.opportunities.validation.milestoneSumBid", {
          sum: roundedSum,
          bid: roundedBid,
        });
        newErrors.milestones = msg;
        messages.push(msg);
      }
    }
  }

  return { fieldErrors: newErrors, messages };
}
