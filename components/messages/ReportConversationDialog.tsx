"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Loader2, CheckCircle } from "lucide-react";
import { API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";

export const REPORT_REASONS = [
  {
    value: "OUTSOURCE_OFF_PLATFORM",
    label: "Attempting to outsource project outside the platform",
  },
  {
    value: "SPAM_IRRELEVANT",
    label: "Spam or irrelevant messages",
  },
  {
    value: "HARASSMENT_INAPPROPRIATE",
    label: "Harassment or inappropriate language",
  },
  {
    value: "FRAUD_IMPERSONATION",
    label: "Suspected fraud or impersonation",
  },
] as const;

type ReportReason = (typeof REPORT_REASONS)[number]["value"];

const REPORT_REASON_I18N: Record<ReportReason, MessageKey> = {
  OUTSOURCE_OFF_PLATFORM: "customer.messages.report.reason.OUTSOURCE_OFF_PLATFORM",
  SPAM_IRRELEVANT: "customer.messages.report.reason.SPAM_IRRELEVANT",
  HARASSMENT_INAPPROPRIATE: "customer.messages.report.reason.HARASSMENT_INAPPROPRIATE",
  FRAUD_IMPERSONATION: "customer.messages.report.reason.FRAUD_IMPERSONATION",
};

type ReportConversationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportedUserName: string;
  reportedUserId: string;
  onReportSubmitted?: () => void;
};

export function ReportConversationDialog({
  open,
  onOpenChange,
  reportedUserName,
  reportedUserId,
  onReportSubmitted,
}: ReportConversationDialogProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [checkingReport, setCheckingReport] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  // Check if user has already reported this conversation when dialog opens
  useEffect(() => {
    if (!open || !reportedUserId) {
      setAlreadyReported(false);
      return;
    }
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;

    let cancelled = false;
    setCheckingReport(true);
    setAlreadyReported(false);

    fetch(
      `${API_BASE}/messages/check-report?reportedUserId=${encodeURIComponent(reportedUserId)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.success && data.data?.reported) {
          setAlreadyReported(true);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setCheckingReport(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, reportedUserId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast({
        title: t("customer.messages.report.toast.selectReasonTitle"),
        description: t("customer.messages.report.toast.selectReasonDesc"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        toast({
          title: t("customer.messages.report.toast.notAuthTitle"),
          description: t("customer.messages.report.toast.notAuthDesc"),
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(`${API_BASE}/messages/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reportedUserId,
          reason,
          additionalDetails: additionalDetails.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: t("customer.messages.report.toast.submittedTitle"),
          description: t("customer.messages.report.toast.submittedDesc"),
        });
        setReason("");
        setAdditionalDetails("");
        setAlreadyReported(true); // Show feedback in dialog
        onReportSubmitted?.(); // Notify parent to disable messaging
      } else {
        // Handle "already reported" - show feedback instead of error
        if (data.message?.includes("already reported")) {
          setAlreadyReported(true);
        } else {
          toast({
            title: t("customer.messages.report.toast.failedTitle"),
            description: data.message || t("customer.messages.report.toast.failedDesc"),
            variant: "destructive",
          });
        }
      }
    } catch {
      toast({
        title: t("customer.messages.toast.errorTitle"),
        description: t("customer.messages.report.toast.errorDesc"),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && !submitting) {
      setReason("");
      setAdditionalDetails("");
      setAlreadyReported(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="h-5 w-5 text-amber-500" />
            {t("customer.messages.report.title")}
          </DialogTitle>
          <DialogDescription>
            {alreadyReported ? (
              t("customer.messages.report.alreadyReportedShort")
            ) : (
              t("customer.messages.report.description", { name: reportedUserName })
            )}
          </DialogDescription>
        </DialogHeader>

        {checkingReport ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : alreadyReported ? (
          <div className="py-6">
            <div className="flex flex-col items-center gap-4 rounded-lg bg-green-50 p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="text-sm text-gray-700">
                {t("customer.messages.report.alreadyReportedLong")}
              </p>
              <Button onClick={() => handleOpenChange(false)}>
                {t("customer.messages.report.close")}
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t("customer.messages.report.reasonLabel")}</Label>
              <div className="space-y-2">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.value}
                    className="flex items-start gap-3 cursor-pointer rounded-lg border p-3 hover:bg-muted/50 has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50/50"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r.value}
                      checked={reason === r.value}
                      onChange={() => setReason(r.value as ReportReason)}
                      className="mt-1"
                    />
                    <span className="text-sm">{t(REPORT_REASON_I18N[r.value])}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="details">{t("customer.messages.report.additionalDetails")}</Label>
              <Textarea
                id="details"
                placeholder={t("customer.messages.report.detailsPlaceholder")}
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              {t("customer.messages.report.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("customer.messages.report.submitting")}
                </>
              ) : (
                t("customer.messages.report.submit")
              )}
            </Button>
          </DialogFooter>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
