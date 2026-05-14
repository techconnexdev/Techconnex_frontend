"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Paperclip, Send } from "lucide-react";
import { formatBidAmountDisplay, parseBidAmountInput } from "@/lib/utils";
import { formatTimeline } from "@/lib/timeline-utils";
import type { Opportunity, ProposalDraft } from "../types";
import { useI18n } from "@/contexts/I18nProvider";

export default function ProposalDialog({
  open,
  onOpenChange,
  draft,
  setDraft,
  opportunity,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draft: ProposalDraft;
  setDraft: (v: ProposalDraft) => void;
  opportunity: Opportunity | null;
  onSubmit: () => void;
}) {
  const { t } = useI18n();

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDraft({ ...draft, attachments: [...draft.attachments, ...files] });
  };
  const removeFile = (i: number) =>
    setDraft({
      ...draft,
      attachments: draft.attachments.filter((_, idx) => idx !== i),
    });

  const title = opportunity?.title ?? "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("provider.opportunities.proposal.title")}</DialogTitle>
          <DialogDescription>
            {t("provider.opportunities.proposal.subtitle", { title })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bid">
                {t("provider.opportunities.proposal.bidLabel", {
                  currency: opportunity?.currencyCode ?? "MYR",
                })}
              </Label>
              <Input
                id="bid"
                type="text"
                inputMode="decimal"
                placeholder={t("provider.opportunities.proposal.bidPlaceholder")}
                value={formatBidAmountDisplay(draft.bidAmount)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    bidAmount: parseBidAmountInput(e.target.value),
                  })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("provider.opportunities.proposal.clientBudget", {
                  budget: opportunity?.budget ?? "—",
                })}
              </p>
            </div>
            <div>
              <Label htmlFor="time">{t("provider.opportunities.proposal.deliveryTimeline")}</Label>
              <Input
                id="time"
                placeholder={t("provider.opportunities.proposal.deliveryTextPh")}
                value={draft.timeline}
                onChange={(e) =>
                  setDraft({ ...draft, timeline: e.target.value })
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("provider.opportunities.proposal.companyTimeline", {
                  value: opportunity?.timeline
                    ? formatTimeline(opportunity.timeline)
                    : t("customer.dashboard.timelineNotSpecified"),
                })}
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="cover">{t("provider.opportunities.proposal.coverLetter")}</Label>
            <Textarea
              id="cover"
              className="min-h-[120px]"
              placeholder={t("provider.opportunities.proposal.coverPlaceholder")}
              value={draft.coverLetter}
              onChange={(e) =>
                setDraft({ ...draft, coverLetter: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              {t("provider.opportunities.proposal.charCount", { n: draft.coverLetter.length })}
            </p>
          </div>

          <div>
            <Label htmlFor="milestones">{t("provider.opportunities.proposal.milestonesOptional")}</Label>
            <Textarea
              id="milestones"
              className="min-h-[100px]"
              placeholder={t("provider.opportunities.proposal.milestonesTextPh")}
              value={draft.milestones}
              onChange={(e) =>
                setDraft({ ...draft, milestones: e.target.value })
              }
            />
          </div>

          <div>
            <Label>{t("provider.opportunities.proposal.attachments")}</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={addFiles}
                className="hidden"
                accept=".pdf,.doc,.docx,.txt,.jpg,.png"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Paperclip className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">
                  {t("provider.opportunities.proposal.uploadHint")}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {t("provider.opportunities.proposal.uploadTypes")}
                </p>
              </label>
            </div>
            {draft.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {draft.attachments.map((f, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-gray-50 p-2 rounded"
                  >
                    <span className="text-sm text-gray-700">{f.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(i)}
                    >
                      {t("provider.opportunities.proposal.remove")}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">{t("provider.opportunities.proposal.summaryTitle")}</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{t("provider.opportunities.proposal.summaryBid")}</span>
                  <span className="font-semibold">
                    RM {draft.bidAmount || "0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>{t("provider.opportunities.proposal.summaryTimeline")}</span>
                  <span>{draft.timeline || t("provider.profile.notSpecified")}</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("provider.opportunities.proposal.summaryAttachments")}</span>
                  <span>{t("provider.opportunities.proposal.filesCount", { n: draft.attachments.length })}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("provider.opportunities.proposal.cancel")}
          </Button>
          <Button onClick={onSubmit}>
            <Send className="w-4 h-4 mr-2" />
            {t("provider.opportunities.submitProposal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
