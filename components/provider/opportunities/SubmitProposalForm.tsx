"use client";

import {
  useId,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowLeftRight,
  Bot,
  Loader2,
  Paperclip,
  Sparkles,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { formatTimeline, timelineToDays } from "@/lib/timeline-utils";
import { convertWithSnapshot } from "@/lib/fx-snapshot";
import {
  milestonePreferredFromProjectRaw,
  milestoneProjectStrFromPreferredAmount,
  syncBidPreferredStringFromProject,
  syncBidProjectStringFromPreferred,
} from "@/lib/proposal-currency-sync";
import { MIN_MONETARY_AMOUNT } from "@/lib/amount-constraints";
import { cn, formatBidAmountDisplay, parseBidAmountInput } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nProvider";
import type {
  ProposalFieldErrors,
  ProposalFormData,
  ProposalMilestone,
  SubmitProposalProjectContext,
} from "./submit-proposal-types";

const formatCurrencyAmount = (amount: number, currencyCode: string = "MYR") =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount || 0);

function FxConversionHint({
  amount,
  project,
  t,
}: {
  amount: number | null;
  project: SubmitProposalProjectContext;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
  const pref = project.preferredCurrencyCode;
  const proj = project.projectCurrencyCode;
  if (amount == null || !Number.isFinite(amount) || amount <= 0) return null;
  if (pref === proj) {
    return (
      <p className="text-xs text-gray-500 mt-1">
        {t("provider.opportunities.proposal.storedSameCurrency", {
          currency: proj,
        })}
      </p>
    );
  }
  const converted = convertWithSnapshot({
    amount,
    fromCurrencyCode: pref,
    toCurrencyCode: proj,
    ratesMap: project.fxSnapshotRatesJson,
  });
  if (converted == null) {
    return (
      <p className="text-xs text-amber-800/90 mt-1.5 rounded-md border border-amber-200/60 bg-amber-50/50 px-2 py-1.5">
        {t("provider.opportunities.proposal.previewUnavailable")}
      </p>
    );
  }
  return (
    <p className="mt-1.5 text-xs font-medium text-gray-700">
      {t("provider.opportunities.proposal.convertedToProject", {
        amount: formatCurrencyAmount(converted, proj),
        projectCurrency: proj,
      })}
    </p>
  );
}

/** Matches provider onboarding input styling */
const FIELD =
  "bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500";
const FIELD_ERR = "border-red-500 focus-visible:ring-red-500";

export default function SubmitProposalForm({
  project,
  proposalData,
  setProposalData,
  proposalErrors,
  setProposalErrors,
  onAddMilestone,
  onUpdateMilestone,
  onRemoveMilestone,
  onFileUpload,
  onRemoveAttachment,
  submittingProposal,
  onSubmit,
  onCancel,
  footerValidationMessages,
  aiMilestonePrompt,
  setAiMilestonePrompt,
  onGenerateAiMilestones,
  aiGeneratingMilestones,
  aiMilestoneError,
  aiMilestoneExplanation,
  aiGeneratedMilestones,
  onClearAiMilestones,
  onGenerateAiCoverLetter,
  aiGeneratingCoverLetter,
  aiCoverLetterError,
}: {
  project: SubmitProposalProjectContext;
  proposalData: ProposalFormData;
  setProposalData: Dispatch<SetStateAction<ProposalFormData>>;
  proposalErrors: ProposalFieldErrors;
  setProposalErrors: Dispatch<SetStateAction<ProposalFieldErrors>>;
  onAddMilestone: () => void;
  onUpdateMilestone: (i: number, patch: Partial<ProposalMilestone>) => void;
  onRemoveMilestone: (i: number) => void;
  onFileUpload: (e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveAttachment: (index: number) => void;
  submittingProposal: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  /** Shown above Cancel / Submit after a failed submit attempt */
  footerValidationMessages?: string[];
  aiMilestonePrompt: string;
  setAiMilestonePrompt: (value: string) => void;
  onGenerateAiMilestones: () => void;
  aiGeneratingMilestones: boolean;
  aiMilestoneError: string | null;
  aiMilestoneExplanation: string[];
  aiGeneratedMilestones: boolean;
  onClearAiMilestones: () => void;
  onGenerateAiCoverLetter: () => void;
  aiGeneratingCoverLetter: boolean;
  aiCoverLetterError: string | null;
}) {
  const { t } = useI18n();
  const fileInputId = useId();
  const [aiBoxOpen, setAiBoxOpen] = useState(false);
  const pref = project.preferredCurrencyCode || "MYR";
  const proj = project.projectCurrencyCode || "MYR";
  const bidNum = (() => {
    const raw = parseBidAmountInput(proposalData.bidAmount);
    const n = parseFloat(raw);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();

  const bidConvertedToProject =
    pref !== proj
      ? (() => {
          const explicitProjectBid = Number(proposalData.bidAmountProject || 0);
          if (Number.isFinite(explicitProjectBid) && explicitProjectBid > 0) {
            return explicitProjectBid;
          }
          if (bidNum == null) return null;
          return convertWithSnapshot({
            amount: bidNum,
            fromCurrencyCode: pref,
            toCurrencyCode: proj,
            ratesMap: project.fxSnapshotRatesJson,
          });
        })()
      : null;

  return (
    <div className="space-y-6 pt-2">
      {pref !== proj && (
        <div className="rounded-lg border border-blue-200/80 bg-blue-50/60 p-3 text-sm text-gray-700">
          {t("provider.opportunities.proposal.fxInfoBanner", {
            preferred: pref,
            project: proj,
          })}
          {project.fxSnapshotDate && (
            <span className="mt-1 block text-xs text-gray-600">
              {t("provider.opportunities.proposal.fxRatesDate", {
                date: project.fxSnapshotDate,
              })}
            </span>
          )}
        </div>
      )}

      <div className="rounded-xl border border-slate-200/90 bg-gradient-to-br from-white/90 to-slate-50/80 p-4 shadow-sm space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("provider.opportunities.proposal.clientBudgetHeading")}
          </h3>
        </div>
        <div className="grid gap-2 text-sm">
          <p className="text-gray-700">
            <span className="font-medium text-gray-800">
              {t("provider.opportunities.proposal.clientBudgetAsPosted", {
                currency: proj,
              })}
            </span>{" "}
            <span className="tabular-nums">
              {formatCurrencyAmount(project.clientBudgetMin ?? 0, proj)} –{" "}
              {formatCurrencyAmount(project.clientBudgetMax ?? 0, proj)}
            </span>
          </p>
          {pref !== proj && (
            <p className="text-gray-600 text-xs sm:text-sm">
              <span className="font-medium text-gray-700">
                {t("provider.opportunities.proposal.budgetInYourCurrency", {
                  currency: pref,
                })}
              </span>{" "}
              <span className="tabular-nums">
                {formatCurrencyAmount(project.budgetMin ?? 0, pref)} –{" "}
                {formatCurrencyAmount(project.budgetMax ?? 0, pref)}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="min-w-0 w-full">
          <p className="mb-3 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
            For client-facing amounts ({proj}), please avoid fractional values
            (for example, use 5 instead of 5.25) whenever possible.
          </p>
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-gray-900">
              {t("provider.opportunities.proposal.yourBidHeading")}
            </h3>
            {pref !== proj && (
              <p className="text-xs text-gray-500 mt-0.5">
                {t("provider.opportunities.proposal.dualAmountHint")}
              </p>
            )}
          </div>
          {pref === proj ? (
            <div className="space-y-2">
              <Label htmlFor="bidAmount">
                {t("provider.opportunities.proposal.bidLabel", {
                  currency: pref,
                })}
              </Label>
              <Input
                id="bidAmount"
                type="text"
                inputMode="decimal"
                placeholder={t(
                  "provider.opportunities.proposal.bidPlaceholder",
                )}
                value={formatBidAmountDisplay(proposalData.bidAmount)}
                onChange={(e) =>
                  setProposalData((prev) => ({
                    ...prev,
                    bidAmount: parseBidAmountInput(e.target.value),
                    bidAmountProject: parseBidAmountInput(e.target.value),
                  }))
                }
                className={cn(FIELD, proposalErrors.bidAmount && FIELD_ERR)}
              />
              {proposalErrors.bidAmount && (
                <p className="text-xs text-red-600">
                  {proposalErrors.bidAmount}
                </p>
              )}
              <FxConversionHint
                amount={bidNum}
                project={project}
                t={
                  t as (
                    key: string,
                    values?: Record<string, string | number>,
                  ) => string
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="bidAmountPref" className="text-gray-800">
                  {t("provider.opportunities.proposal.bidLabel", {
                    currency: pref,
                  })}
                </Label>
                <Input
                  id="bidAmountPref"
                  type="text"
                  inputMode="decimal"
                  placeholder={t(
                    "provider.opportunities.proposal.bidPlaceholder",
                  )}
                  value={formatBidAmountDisplay(proposalData.bidAmount)}
                  onChange={(e) => {
                    const raw = parseBidAmountInput(e.target.value);
                    setProposalData((prev) => ({
                      ...prev,
                      bidAmount: raw,
                      bidAmountProject: syncBidProjectStringFromPreferred(
                        raw,
                        pref,
                        proj,
                        project.fxSnapshotRatesJson,
                      ),
                    }));
                  }}
                  className={cn(FIELD, proposalErrors.bidAmount && FIELD_ERR)}
                />
              </div>
              <div
                className="flex items-center justify-center py-1 text-muted-foreground md:pb-2"
                aria-hidden
              >
                <ArrowLeftRight className="h-5 w-5 shrink-0 rotate-90 md:rotate-0" />
              </div>
              <div className="space-y-1.5 min-w-0">
                <Label htmlFor="bidAmountProj" className="text-gray-800">
                  {t("provider.opportunities.proposal.bidLabelClient", {
                    currency: proj,
                  })}
                </Label>
                <Input
                  id="bidAmountProj"
                  type="text"
                  inputMode="decimal"
                  placeholder={t(
                    "provider.opportunities.proposal.bidPlaceholder",
                  )}
                  value={formatBidAmountDisplay(proposalData.bidAmountProject)}
                  onChange={(e) => {
                    const raw = parseBidAmountInput(e.target.value);
                    setProposalData((prev) => ({
                      ...prev,
                      bidAmountProject: raw,
                      bidAmount: syncBidPreferredStringFromProject(
                        raw,
                        pref,
                        proj,
                        project.fxSnapshotRatesJson,
                      ),
                    }));
                  }}
                  className={cn(FIELD, proposalErrors.bidAmount && FIELD_ERR)}
                />
              </div>
              {proposalErrors.bidAmount && (
                <p className="text-xs text-red-600 md:col-span-3">
                  {proposalErrors.bidAmount}
                </p>
              )}
            </div>
          )}
        </div>
        <div className="w-full">
          <Label htmlFor="timelineAmount">
            {t("provider.opportunities.proposal.deliveryTimeline")}
          </Label>
          <div className="flex gap-2">
            <Input
              id="timelineAmount"
              type="number"
              placeholder={t(
                "provider.opportunities.proposal.timelineAmountPh",
              )}
              min="1"
              value={proposalData.timelineAmount}
              onChange={(e) =>
                setProposalData((prev) => ({
                  ...prev,
                  timelineAmount: e.target.value,
                }))
              }
              className={cn(FIELD, proposalErrors.timelineAmount && FIELD_ERR)}
            />
            <Select
              value={proposalData.timelineUnit}
              onValueChange={(value: "day" | "week" | "month") =>
                setProposalData((prev) => ({
                  ...prev,
                  timelineUnit: value,
                }))
              }
            >
              <SelectTrigger
                className={cn(
                  FIELD,
                  proposalErrors.timelineUnit &&
                    "border-red-500 focus:ring-red-500",
                )}
              >
                <SelectValue
                  placeholder={t(
                    "provider.opportunities.proposal.unitPlaceholder",
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">
                  {t("provider.opportunities.proposal.day")}
                </SelectItem>
                <SelectItem value="week">
                  {t("provider.opportunities.proposal.week")}
                </SelectItem>
                <SelectItem value="month">
                  {t("provider.opportunities.proposal.month")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {proposalErrors.timelineAmount && (
            <p className="text-xs text-red-600 mt-1">
              {proposalErrors.timelineAmount}
            </p>
          )}
          {proposalErrors.timelineUnit && (
            <p className="text-xs text-red-600 mt-1">
              {proposalErrors.timelineUnit}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {t("provider.opportunities.proposal.companyTimeline", {
              value: project.originalTimeline
                ? formatTimeline(project.originalTimeline)
                : t("customer.dashboard.timelineNotSpecified"),
            })}
          </p>
        </div>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between gap-2">
          <Label htmlFor="coverLetter">
            {t("provider.opportunities.proposal.coverLetter")}
          </Label>
          <Button
            type="button"
            variant="outline"
            className="bg-transparent"
            onClick={onGenerateAiCoverLetter}
            disabled={aiGeneratingCoverLetter}
          >
            {aiGeneratingCoverLetter ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-blue-600" />
            )}
            {aiGeneratingCoverLetter ? "Writing..." : "Use AI"}
          </Button>
        </div>
        <Textarea
          id="coverLetter"
          placeholder={t("provider.opportunities.proposal.coverPlaceholder")}
          className={cn(
            "min-h-[120px]",
            FIELD,
            proposalErrors.coverLetter && FIELD_ERR,
          )}
          value={proposalData.coverLetter}
          onChange={(e) =>
            setProposalData((prev) => ({
              ...prev,
              coverLetter: e.target.value,
            }))
          }
        />
        {proposalErrors.coverLetter && (
          <p className="text-xs text-red-600">{proposalErrors.coverLetter}</p>
        )}
        {aiCoverLetterError ? (
          <p className="text-xs text-red-600 mt-1">{aiCoverLetterError}</p>
        ) : null}
        <p className="text-xs text-gray-500 mt-1">
          {t("provider.opportunities.proposal.charCount", {
            n: proposalData.coverLetter.length,
          })}
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>
            {t("provider.opportunities.proposal.milestonesLabel")}{" "}
            <span className="text-red-500">*</span>
          </Label>
          <div className="flex items-center gap-2">
            {aiGeneratedMilestones ? (
              <Button
                type="button"
                variant="outline"
                className="border-red-200 text-red-600 hover:text-red-700 bg-transparent"
                onClick={onClearAiMilestones}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete AI milestones
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              onClick={() => setAiBoxOpen((prev) => !prev)}
            >
              {aiBoxOpen ? (
                <X className="mr-2 h-4 w-4" />
              ) : (
                <Bot className="mr-2 h-4 w-4 text-blue-600" />
              )}
              Use AI
            </Button>
            <Button
              type="button"
              variant="outline"
              className="bg-transparent"
              onClick={onAddMilestone}
            >
              {t("provider.opportunities.proposal.addMilestone")}
            </Button>
          </div>
        </div>
        {aiBoxOpen ? (
          <div className="mb-4 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI Milestone Chat
            </div>
            <p className="mt-1 text-xs text-gray-600">
              AI already understands project requirements and timeline. Add an
              optional process note and generate milestones.
            </p>
            <Textarea
              rows={3}
              className="mt-3 bg-white"
              placeholder="Optional: Weekly review calls and beta sign-off before final handover."
              value={aiMilestonePrompt}
              onChange={(e) => setAiMilestonePrompt(e.target.value)}
            />
            {aiMilestoneError ? (
              <p className="mt-2 text-xs text-red-600">{aiMilestoneError}</p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={onGenerateAiMilestones}
                disabled={aiGeneratingMilestones}
              >
                {aiGeneratingMilestones ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-4 w-4" />
                )}
                {aiGeneratingMilestones
                  ? "Generating..."
                  : "Generate milestones"}
              </Button>
            </div>
            {aiMilestoneExplanation.length > 0 ? (
              <div className="mt-3 rounded-md border border-slate-200 bg-white/90 p-3">
                <p className="text-xs font-semibold text-gray-800">AI notes</p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-xs text-gray-700">
                  {aiMilestoneExplanation.map((item, idx) => (
                    <li key={`${idx}-${item.slice(0, 20)}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {proposalData.milestones.length === 0 && (
          <p
            className={`text-sm ${
              proposalErrors.milestones
                ? "text-red-600 font-medium"
                : "text-gray-500"
            }`}
          >
            {proposalErrors.milestones ||
              t("provider.opportunities.proposal.milestonesHint")}
          </p>
        )}

        <div className="space-y-3">
          {proposalData.milestones.map((m, i) => (
            <Card
              key={i}
              className="border border-gray-200/80 bg-white/60 shadow-sm"
            >
              <CardContent className="p-4 space-y-3">
                <div className="grid md:grid-cols-12 gap-3">
                  <div className="md:col-span-1">
                    <label className="text-sm font-medium">
                      {t("provider.opportunities.proposal.seq")}
                    </label>
                    <Input
                      type="number"
                      value={i + 1}
                      disabled
                      className="bg-gray-50/80"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="text-sm font-medium">
                      {t("provider.opportunities.proposal.titleField")}
                    </label>
                    <Input
                      value={m.title}
                      onChange={(e) => {
                        onUpdateMilestone(i, { title: e.target.value });
                        if (proposalErrors.milestoneFields?.[i]?.title) {
                          setProposalErrors((prev) => ({
                            ...prev,
                            milestoneFields: {
                              ...prev.milestoneFields,
                              [i]: {
                                ...prev.milestoneFields?.[i],
                                title: undefined,
                              },
                            },
                          }));
                        }
                      }}
                      placeholder={t(
                        "provider.opportunities.proposal.milestoneTitlePh",
                      )}
                      className={cn(
                        FIELD,
                        proposalErrors.milestoneFields?.[i]?.title && FIELD_ERR,
                      )}
                    />
                    {proposalErrors.milestoneFields?.[i]?.title && (
                      <p className="text-xs text-red-600 mt-1">
                        {proposalErrors.milestoneFields[i].title}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-6">
                    <label className="text-sm font-medium">
                      {t("provider.opportunities.proposal.duration")}
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2 mt-1.5">
                      <Input
                        type="number"
                        min={1}
                        placeholder={t(
                          "provider.opportunities.proposal.durationPh",
                        )}
                        value={m.durationAmount ?? ""}
                        onChange={(e) => {
                          onUpdateMilestone(i, {
                            durationAmount: e.target.value,
                            durationUnit: m.durationUnit || "",
                          });
                          if (
                            proposalErrors.milestoneFields?.[i]?.durationAmount
                          ) {
                            setProposalErrors((prev) => ({
                              ...prev,
                              milestoneFields: {
                                ...prev.milestoneFields,
                                [i]: {
                                  ...prev.milestoneFields?.[i],
                                  durationAmount: undefined,
                                },
                              },
                            }));
                          }
                        }}
                        className={cn(
                          FIELD,
                          proposalErrors.milestoneFields?.[i]?.durationAmount &&
                            FIELD_ERR,
                        )}
                      />
                      <Select
                        value={m.durationUnit || ""}
                        onValueChange={(value: "day" | "week" | "month") => {
                          onUpdateMilestone(i, {
                            durationAmount: m.durationAmount ?? "",
                            durationUnit: value,
                          });
                          if (
                            proposalErrors.milestoneFields?.[i]?.durationUnit
                          ) {
                            setProposalErrors((prev) => ({
                              ...prev,
                              milestoneFields: {
                                ...prev.milestoneFields,
                                [i]: {
                                  ...prev.milestoneFields?.[i],
                                  durationUnit: undefined,
                                },
                              },
                            }));
                          }
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            FIELD,
                            proposalErrors.milestoneFields?.[i]?.durationUnit &&
                              "border-red-500 focus:ring-red-500",
                          )}
                        >
                          <SelectValue
                            placeholder={t(
                              "provider.opportunities.proposal.unitPlaceholder",
                            )}
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="day">
                            {t("provider.opportunities.proposal.day")}
                          </SelectItem>
                          <SelectItem value="week">
                            {t("provider.opportunities.proposal.week")}
                          </SelectItem>
                          <SelectItem value="month">
                            {t("provider.opportunities.proposal.month")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(proposalErrors.milestoneFields?.[i]?.durationAmount ||
                      proposalErrors.milestoneFields?.[i]?.durationUnit) && (
                      <p className="text-xs text-red-600 mt-1">
                        {proposalErrors.milestoneFields[i].durationAmount ||
                          proposalErrors.milestoneFields[i].durationUnit}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-12">
                    <div className="rounded-lg border border-violet-100/90 bg-gradient-to-br from-violet-50/40 to-white/60 p-3 space-y-2">
                      <p className="text-xs font-semibold text-gray-800">
                        {t(
                          "provider.opportunities.proposal.milestoneAmountRowTitle",
                        )}
                      </p>
                      {pref === proj ? (
                        <div className="space-y-1.5 max-w-md">
                          <label className="text-sm font-medium">
                            {t(
                              "provider.opportunities.proposal.milestoneAmountLabel",
                              { currency: pref },
                            )}
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            min={MIN_MONETARY_AMOUNT}
                            value={m.amount === 0 ? "" : m.amount}
                            onChange={(e) => {
                              const v = e.target.value;
                              const n = v === "" ? 0 : parseFloat(v);
                              onUpdateMilestone(i, {
                                amount: Number.isFinite(n) && n >= 0 ? n : 0,
                              });
                              if (proposalErrors.milestoneFields?.[i]?.amount) {
                                setProposalErrors((prev) => ({
                                  ...prev,
                                  milestoneFields: {
                                    ...prev.milestoneFields,
                                    [i]: {
                                      ...prev.milestoneFields?.[i],
                                      amount: undefined,
                                    },
                                  },
                                }));
                              }
                            }}
                            className={cn(
                              FIELD,
                              proposalErrors.milestoneFields?.[i]?.amount &&
                                FIELD_ERR,
                            )}
                          />
                          {proposalErrors.milestoneFields?.[i]?.amount && (
                            <p className="text-xs text-red-600">
                              {proposalErrors.milestoneFields[i].amount}
                            </p>
                          )}
                          <FxConversionHint
                            amount={
                              Number(m.amount) > 0 &&
                              Number.isFinite(Number(m.amount))
                                ? Number(m.amount)
                                : null
                            }
                            project={project}
                            t={
                              t as (
                                key: string,
                                values?: Record<string, string | number>,
                              ) => string
                            }
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 md:gap-3 items-end">
                          <div className="space-y-1 min-w-0">
                            <label className="text-sm font-medium">
                              {t(
                                "provider.opportunities.proposal.milestoneAmountLabel",
                                { currency: pref },
                              )}
                            </label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder={t(
                                "provider.opportunities.proposal.bidPlaceholder",
                              )}
                              value={formatBidAmountDisplay(
                                m.amount > 0
                                  ? parseBidAmountInput(String(m.amount))
                                  : "",
                              )}
                              onChange={(e) => {
                                const raw = parseBidAmountInput(e.target.value);
                                const n = parseFloat(raw);
                                const amount =
                                  Number.isFinite(n) && n >= 0 ? n : 0;
                                onUpdateMilestone(i, {
                                  amount,
                                  amountProjectStr:
                                    milestoneProjectStrFromPreferredAmount(
                                      amount,
                                      pref,
                                      proj,
                                      project.fxSnapshotRatesJson,
                                    ),
                                });
                                if (
                                  proposalErrors.milestoneFields?.[i]?.amount
                                ) {
                                  setProposalErrors((prev) => ({
                                    ...prev,
                                    milestoneFields: {
                                      ...prev.milestoneFields,
                                      [i]: {
                                        ...prev.milestoneFields?.[i],
                                        amount: undefined,
                                      },
                                    },
                                  }));
                                }
                              }}
                              className={cn(
                                FIELD,
                                proposalErrors.milestoneFields?.[i]?.amount &&
                                  FIELD_ERR,
                              )}
                            />
                          </div>
                          <div
                            className="flex items-center justify-center py-1 text-muted-foreground md:pb-2"
                            aria-hidden
                          >
                            <ArrowLeftRight className="h-4 w-4 shrink-0 rotate-90 md:rotate-0" />
                          </div>
                          <div className="space-y-1 min-w-0">
                            <label className="text-sm font-medium">
                              {t(
                                "provider.opportunities.proposal.milestoneAmountLabelClient",
                                { currency: proj },
                              )}
                            </label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder={t(
                                "provider.opportunities.proposal.bidPlaceholder",
                              )}
                              value={formatBidAmountDisplay(
                                (() => {
                                  const derived =
                                    milestoneProjectStrFromPreferredAmount(
                                      m.amount,
                                      pref,
                                      proj,
                                      project.fxSnapshotRatesJson,
                                    );
                                  if (
                                    m.amountProjectStr !== undefined &&
                                    m.amountProjectStr !== ""
                                  ) {
                                    return m.amountProjectStr;
                                  }
                                  return derived;
                                })(),
                              )}
                              onChange={(e) => {
                                const raw = parseBidAmountInput(e.target.value);
                                const { amount, amountProjectStr } =
                                  milestonePreferredFromProjectRaw(
                                    raw,
                                    pref,
                                    proj,
                                    project.fxSnapshotRatesJson,
                                  );
                                onUpdateMilestone(i, {
                                  amount,
                                  amountProjectStr,
                                });
                                if (
                                  proposalErrors.milestoneFields?.[i]?.amount
                                ) {
                                  setProposalErrors((prev) => ({
                                    ...prev,
                                    milestoneFields: {
                                      ...prev.milestoneFields,
                                      [i]: {
                                        ...prev.milestoneFields?.[i],
                                        amount: undefined,
                                      },
                                    },
                                  }));
                                }
                              }}
                              className={cn(
                                FIELD,
                                proposalErrors.milestoneFields?.[i]?.amount &&
                                  FIELD_ERR,
                              )}
                            />
                          </div>
                          {proposalErrors.milestoneFields?.[i]?.amount && (
                            <p className="text-xs text-red-600 md:col-span-3">
                              {proposalErrors.milestoneFields[i].amount}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    {t("provider.opportunities.proposal.descriptionField")}
                  </label>
                  <Textarea
                    rows={2}
                    value={m.description || ""}
                    onChange={(e) => {
                      onUpdateMilestone(i, { description: e.target.value });
                      if (proposalErrors.milestoneFields?.[i]?.description) {
                        setProposalErrors((prev) => ({
                          ...prev,
                          milestoneFields: {
                            ...prev.milestoneFields,
                            [i]: {
                              ...prev.milestoneFields?.[i],
                              description: undefined,
                            },
                          },
                        }));
                      }
                    }}
                    placeholder={t(
                      "provider.opportunities.proposal.milestoneDescPh",
                    )}
                    className={cn(
                      FIELD,
                      proposalErrors.milestoneFields?.[i]?.description &&
                        FIELD_ERR,
                    )}
                  />
                  {proposalErrors.milestoneFields?.[i]?.description && (
                    <p className="text-xs text-red-600 mt-1">
                      {proposalErrors.milestoneFields[i].description}
                    </p>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="bg-transparent"
                    onClick={() => onRemoveMilestone(i)}
                  >
                    {t("provider.opportunities.proposal.remove")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {proposalData.milestones.length > 0 && (
          <div className="mt-4 rounded-lg border border-gray-200/80 bg-white/50 p-3 text-sm space-y-3">
            {(() => {
              const bidAmountClientNum = Number(
                proposalData.bidAmountProject || proposalData.bidAmount || 0,
              );
              const sumMilestonesClient = proposalData.milestones.reduce(
                (sum, m) => {
                  const projectRaw =
                    pref === proj
                      ? String(m.amount ?? 0)
                      : (m.amountProjectStr ??
                        milestoneProjectStrFromPreferredAmount(
                          m.amount,
                          pref,
                          proj,
                          project.fxSnapshotRatesJson,
                        ));
                  const val = Number(projectRaw);
                  if (!isNaN(val)) return sum + val;
                  return sum;
                },
                0,
              );
              const bidDiff = Math.abs(
                sumMilestonesClient - bidAmountClientNum,
              );
              const bidMatch = bidAmountClientNum > 0 && bidDiff <= 0.01;

              const deliveryTimeDays = timelineToDays(
                Number(proposalData.timelineAmount || 0),
                proposalData.timelineUnit || "",
              );
              const milestonesDurationDays = proposalData.milestones.reduce(
                (sum, m) =>
                  sum +
                  (timelineToDays(
                    Number(m.durationAmount || 0),
                    m.durationUnit || "",
                  ) || 0),
                0,
              );
              const timeMatch =
                deliveryTimeDays > 0 &&
                milestonesDurationDays === deliveryTimeDays;

              return (
                <>
                  <div className="flex justify-between flex-wrap gap-2">
                    <div>
                      <div className="font-medium">
                        {t("provider.opportunities.proposal.milestonesTotal", {
                          sum: formatCurrencyAmount(
                            sumMilestonesClient || 0,
                            proj,
                          ),
                        })}
                      </div>
                      <div>
                        {t("provider.opportunities.proposal.yourBidLine", {
                          amount: formatCurrencyAmount(
                            bidAmountClientNum || 0,
                            proj,
                          ),
                        })}
                      </div>
                    </div>
                    <div
                      className={
                        "text-xs font-semibold " +
                        (bidMatch ? "text-green-600" : "text-red-600")
                      }
                    >
                      {bidMatch
                        ? t("provider.opportunities.proposal.bidMatchOk")
                        : t("provider.opportunities.proposal.bidMatchBad")}
                    </div>
                  </div>
                  <div className="flex justify-between flex-wrap gap-2 border-t pt-2">
                    <div>
                      <div className="font-medium">
                        {t("provider.opportunities.proposal.durationTotal", {
                          days: milestonesDurationDays,
                        })}
                      </div>
                      <div>
                        {t("provider.opportunities.proposal.deliveryDaysLine", {
                          days: deliveryTimeDays,
                        })}
                      </div>
                    </div>
                    <div
                      className={
                        "text-xs font-semibold " +
                        (timeMatch ? "text-green-600" : "text-red-600")
                      }
                    >
                      {timeMatch
                        ? t("provider.opportunities.proposal.timeMatchOk")
                        : t("provider.opportunities.proposal.timeMatchBad")}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}
        {proposalErrors.milestones && (
          <p className="text-xs text-red-600 mt-1">
            {proposalErrors.milestones}
          </p>
        )}
      </div>

      <div>
        <Label>{t("provider.opportunities.proposal.attachments")}</Label>
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center bg-white/50 transition-colors",
            proposalErrors.attachments
              ? "border-red-500 bg-red-50/80"
              : "border-gray-300 hover:border-blue-400",
          )}
        >
          <input
            type="file"
            multiple
            onChange={onFileUpload}
            className="hidden"
            id={fileInputId}
            accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp"
          />
          <label htmlFor={fileInputId} className="cursor-pointer">
            <Paperclip className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600">
              {t("provider.opportunities.proposal.uploadHint")}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t("provider.opportunities.proposal.uploadTypes")}
            </p>
          </label>
        </div>

        {proposalData.attachments.length > 0 && (
          <div className="mt-3 space-y-2">
            {proposalData.attachments.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded border border-gray-200/60 bg-white/50 p-2"
              >
                <span className="text-sm text-gray-700">{file.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveAttachment(index)}
                >
                  {t("provider.opportunities.proposal.remove")}
                </Button>
              </div>
            ))}
          </div>
        )}
        {proposalErrors.attachments && (
          <p className="text-xs text-red-600 mt-2">
            {proposalErrors.attachments}
          </p>
        )}
      </div>

      <Card className="border border-gray-200/80 bg-white/50 backdrop-blur-sm shadow-sm">
        <CardContent className="p-4">
          <h4 className="font-semibold mb-2 text-gray-900">
            {t("provider.opportunities.proposal.summaryTitle")}
          </h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span>{t("provider.opportunities.proposal.summaryBid")}</span>
              <span className="font-semibold">
                {formatCurrencyAmount(
                  Number(proposalData.bidAmount || 0),
                  pref,
                )}
              </span>
            </div>
            {pref !== proj && bidConvertedToProject != null && (
              <div className="flex justify-between border-t border-gray-200/80 pt-1 text-xs text-gray-600">
                <span>
                  {t("provider.opportunities.proposal.summaryStoredAs")}
                </span>
                <span className="font-medium text-gray-800">
                  {formatCurrencyAmount(bidConvertedToProject, proj)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>
                {t("provider.opportunities.proposal.summaryTimeline")}
              </span>
              <span>
                {formatTimeline(
                  proposalData.timelineAmount,
                  proposalData.timelineUnit,
                ) || t("customer.dashboard.timelineNotSpecified")}
              </span>
            </div>
            <div className="flex justify-between">
              <span>
                {t("provider.opportunities.proposal.summaryAttachments")}
              </span>
              <span>
                {t("provider.opportunities.proposal.filesCount", {
                  n: proposalData.attachments.length,
                })}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {footerValidationMessages && footerValidationMessages.length > 0 ? (
        <div
          className="mt-8 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900"
          role="alert"
          aria-live="polite"
        >
          <div className="flex gap-2 font-medium">
            <AlertCircle
              className="w-5 h-5 shrink-0 text-red-600 mt-0.5"
              aria-hidden
            />
            <span>
              {t("provider.opportunities.proposal.validationSummaryTitle")}
            </span>
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-9 text-red-800">
            {footerValidationMessages.map((msg, i) => (
              <li key={`${i}-${msg.slice(0, 24)}`}>{msg}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8 pt-6 border-t border-gray-200">
        <Button
          variant="outline"
          className="bg-transparent"
          onClick={onCancel}
          disabled={submittingProposal}
        >
          {t("provider.opportunities.proposal.cancel")}
        </Button>
        <Button
          onClick={onSubmit}
          disabled={submittingProposal}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
        >
          {submittingProposal ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {submittingProposal
            ? t("provider.opportunities.proposal.submitting")
            : t("provider.opportunities.submitProposal")}
        </Button>
      </div>
    </div>
  );
}
