"use client";

import type { Dispatch, ReactNode, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, CheckCircle, Loader2 } from "lucide-react";
import type { Milestone } from "@/lib/api";
import { convertWithSnapshot, type FxRatesMap } from "@/lib/fx-snapshot";
import {
  milestonePreferredFromProjectRaw,
  milestoneProjectStrFromPreferredAmount,
} from "@/lib/proposal-currency-sync";
import { MIN_MONETARY_AMOUNT } from "@/lib/amount-constraints";
import { cn, formatBidAmountDisplay, parseBidAmountInput } from "@/lib/utils";
import { useI18n } from "@/contexts/I18nProvider";

const FIELD =
  "bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500";
const FIELD_ERR = "border-red-500 focus-visible:ring-red-500";

const formatCurrencyAmount = (amount: number, currencyCode: string = "MYR") =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount || 0);

/** Same behavior as SubmitProposalForm `FxConversionHint` (single-currency milestone amount). */
function MilestoneFxConversionHint({
  amount,
  pref,
  proj,
  rates,
  t,
}: {
  amount: number | null;
  pref: string;
  proj: string;
  rates: FxRatesMap | null;
  t: (key: string, values?: Record<string, string | number>) => string;
}) {
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
    ratesMap: rates,
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

export type MilestoneCurrencyContext = {
  projectCurrencyCode: string;
  preferredCurrencyCode: string;
  fxSnapshotRatesJson: FxRatesMap | null;
};

export type MilestoneFieldErrors = Record<
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

type Props = {
  projectMilestones: Milestone[];
  originalProjectMilestones: Milestone[];
  milestoneErrors: MilestoneFieldErrors;
  milestoneApprovalState: {
    milestonesLocked: boolean;
    companyApproved: boolean;
    providerApproved: boolean;
    milestonesApprovedAt: string | null;
  };
  normalizeMilestoneSequences: (items: Milestone[]) => Milestone[];
  updateProjectMilestone: (
    i: number,
    patch: Partial<Milestone & { amountProjectStr?: string }>,
  ) => void;
  addProjectMilestone: () => void;
  removeProjectMilestone: (i: number) => void;
  setMilestoneErrors: Dispatch<SetStateAction<MilestoneFieldErrors>>;
  onSave: () => void;
  onApprove: () => void;
  savingMilestones: boolean;
  approvingMilestones: boolean;
  /** When true, Save is disabled (e.g. validation not satisfied) */
  saveDisabled?: boolean;
  /** Rendered after milestone cards, before save/approve actions */
  summaryBelowMilestones?: ReactNode;
  /** Provider: show amounts in project currency + preferred equivalent (proposal-style) */
  currencyContext?: MilestoneCurrencyContext;
};

export function CustomerProjectMilestonesEditorForm({
  projectMilestones,
  originalProjectMilestones,
  milestoneErrors,
  milestoneApprovalState,
  normalizeMilestoneSequences,
  updateProjectMilestone,
  addProjectMilestone,
  removeProjectMilestone,
  setMilestoneErrors,
  onSave,
  onApprove,
  savingMilestones,
  approvingMilestones,
  saveDisabled = false,
  summaryBelowMilestones,
  currencyContext,
}: Props) {
  const { t } = useI18n();
  const proj = (currencyContext?.projectCurrencyCode || "").toUpperCase();
  const pref = (currencyContext?.preferredCurrencyCode || "").toUpperCase();
  const rates = currencyContext?.fxSnapshotRatesJson ?? null;
  /** Same as SubmitProposalForm: dual fields need FX snapshot to sync. */
  const showDualAmount =
    Boolean(currencyContext) && proj && pref && proj !== pref && Boolean(rates);
  const showProjectCurrencyOnly =
    Boolean(currencyContext) && proj && pref && proj !== pref && !rates;

  return (
    <div className="space-y-3 sm:space-y-4">
      {projectMilestones.map((m, i) => (
        <Card
          key={m.id ?? i}
          className="border border-gray-200/80 bg-white/60 shadow-sm"
        >
          <CardContent className="p-3 sm:p-4 space-y-3">
            <div className="grid md:grid-cols-12 gap-3">
              <div className="md:col-span-1">
                <label className="text-xs sm:text-sm font-medium">
                  {t("customer.projects.detail.milestonesModal.seq")}
                </label>
                <Input
                  type="number"
                  value={i + 1}
                  disabled
                  className={cn(
                    "mt-1.5 text-sm sm:text-base bg-gray-50/80",
                    FIELD,
                  )}
                />
              </div>
              <div className="md:col-span-5">
                <label className="text-xs sm:text-sm font-medium">
                  {t("customer.projects.detail.milestonesModal.titleLabel")}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <Input
                  value={m.title}
                  onChange={(e) => {
                    updateProjectMilestone(i, { title: e.target.value });
                    if (milestoneErrors[i]?.title) {
                      setMilestoneErrors((prev) => ({
                        ...prev,
                        [i]: { ...prev[i], title: undefined },
                      }));
                    }
                  }}
                  className={cn(
                    "mt-1.5 text-sm sm:text-base",
                    FIELD,
                    milestoneErrors[i]?.title && FIELD_ERR,
                  )}
                />
                {milestoneErrors[i]?.title && (
                  <p className="text-xs text-red-600 mt-1">
                    {milestoneErrors[i].title}
                  </p>
                )}
              </div>
              <div className="md:col-span-6">
                <label className="text-xs sm:text-sm font-medium">
                  {t(
                    "customer.projects.detail.milestonesModal.durationRequired",
                  )}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2 mt-1.5">
                  <Input
                    type="number"
                    min={1}
                    placeholder={t(
                      "customer.projects.detail.milestonesModal.durationPlaceholder",
                    )}
                    value={
                      (m as Milestone & { durationAmount?: string })
                        .durationAmount ?? ""
                    }
                    onChange={(e) => {
                      updateProjectMilestone(i, {
                        durationAmount: e.target.value,
                        durationUnit:
                          (m as Milestone & { durationUnit?: string })
                            .durationUnit || "",
                      } as Partial<Milestone>);
                      if (
                        milestoneErrors[i]?.durationAmount ||
                        milestoneErrors[i]?.durationUnit
                      ) {
                        setMilestoneErrors((prev) => ({
                          ...prev,
                          [i]: {
                            ...prev[i],
                            durationAmount: undefined,
                            durationUnit: undefined,
                          },
                        }));
                      }
                      if (milestoneErrors[-1]) {
                        setMilestoneErrors((prev) => {
                          const next = { ...prev };
                          delete next[-1];
                          return next;
                        });
                      }
                    }}
                    className={cn(
                      "text-sm sm:text-base flex-1",
                      FIELD,
                      milestoneErrors[i]?.durationAmount &&
                        "border-red-500 focus-visible:ring-red-500",
                    )}
                  />
                  <Select
                    value={
                      (m as Milestone & { durationUnit?: string })
                        .durationUnit || ""
                    }
                    onValueChange={(value: "day" | "week" | "month") => {
                      updateProjectMilestone(i, {
                        durationAmount:
                          (m as Milestone & { durationAmount?: string })
                            .durationAmount ?? "",
                        durationUnit: value,
                      } as Partial<Milestone>);
                      if (milestoneErrors[i]?.durationUnit) {
                        setMilestoneErrors((prev) => ({
                          ...prev,
                          [i]: { ...prev[i], durationUnit: undefined },
                        }));
                      }
                      if (milestoneErrors[-1]) {
                        setMilestoneErrors((prev) => {
                          const next = { ...prev };
                          delete next[-1];
                          return next;
                        });
                      }
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        "text-sm sm:text-base w-[100px]",
                        FIELD,
                        milestoneErrors[i]?.durationUnit &&
                          "border-red-500 focus:ring-red-500",
                      )}
                    >
                      <SelectValue
                        placeholder={t(
                          "customer.projects.detail.milestonesModal.unitPlaceholder",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="day">
                        {t("customer.projects.detail.durationUnit.day")}
                      </SelectItem>
                      <SelectItem value="week">
                        {t("customer.projects.detail.durationUnit.week")}
                      </SelectItem>
                      <SelectItem value="month">
                        {t("customer.projects.detail.durationUnit.month")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(milestoneErrors[i]?.durationAmount ||
                  milestoneErrors[i]?.durationUnit) && (
                  <p className="text-xs text-red-600 mt-1">
                    {milestoneErrors[i].durationAmount ||
                      milestoneErrors[i].durationUnit}
                  </p>
                )}
              </div>

              <div className="md:col-span-12">
                {!currencyContext ? (
                  <div className="max-w-md">
                    <label className="text-xs sm:text-sm font-medium">
                      {t("customer.projects.detail.milestonesModal.amount")}
                    </label>
                    <Input
                      type="number"
                      min={MIN_MONETARY_AMOUNT}
                      step="0.01"
                      value={String(m.amount ?? 0)}
                      onChange={(e) => {
                        updateProjectMilestone(i, {
                          amount: Number(e.target.value),
                        });
                        if (milestoneErrors[i]?.amount) {
                          setMilestoneErrors((prev) => ({
                            ...prev,
                            [i]: { ...prev[i], amount: undefined },
                          }));
                        }
                        if (milestoneErrors[-1]) {
                          setMilestoneErrors((prev) => {
                            const next = { ...prev };
                            delete next[-1];
                            return next;
                          });
                        }
                      }}
                      className={cn(
                        "mt-1.5 text-sm sm:text-base",
                        FIELD,
                        milestoneErrors[i]?.amount && FIELD_ERR,
                      )}
                    />
                    {milestoneErrors[i]?.amount && (
                      <p className="text-xs text-red-600 mt-1">
                        {milestoneErrors[i].amount}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-violet-100/90 bg-gradient-to-br from-violet-50/40 to-white/60 p-3 space-y-2">
                    <p className="text-xs font-semibold text-gray-800">
                      {t(
                        "provider.opportunities.proposal.milestoneAmountRowTitle",
                      )}
                    </p>
                    {showProjectCurrencyOnly ? (
                      <div className="space-y-1.5 max-w-md">
                        <label className="text-sm font-medium">
                          {t(
                            "provider.opportunities.proposal.milestoneAmountLabelClient",
                            { currency: proj },
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
                            updateProjectMilestone(i, {
                              amount: Number.isFinite(n) && n >= 0 ? n : 0,
                              amountProjectStr: undefined,
                            });
                            if (milestoneErrors[i]?.amount) {
                              setMilestoneErrors((prev) => ({
                                ...prev,
                                [i]: { ...prev[i], amount: undefined },
                              }));
                            }
                            if (milestoneErrors[-1]) {
                              setMilestoneErrors((prev) => {
                                const next = { ...prev };
                                delete next[-1];
                                return next;
                              });
                            }
                          }}
                          className={cn(
                            FIELD,
                            milestoneErrors[i]?.amount && FIELD_ERR,
                          )}
                        />
                        {milestoneErrors[i]?.amount && (
                          <p className="text-xs text-red-600 mt-1">
                            {milestoneErrors[i].amount}
                          </p>
                        )}
                        <p className="text-xs text-amber-800/90 rounded-md border border-amber-200/60 bg-amber-50/50 px-2 py-1.5">
                          {t(
                            "provider.opportunities.proposal.previewUnavailable",
                          )}
                        </p>
                      </div>
                    ) : showDualAmount ? (
                      <div className="space-y-2">
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
                              updateProjectMilestone(i, {
                                amount,
                                amountProjectStr:
                                  milestoneProjectStrFromPreferredAmount(
                                    amount,
                                    pref,
                                    proj,
                                    rates,
                                  ),
                              });
                              if (milestoneErrors[i]?.amount) {
                                setMilestoneErrors((prev) => ({
                                  ...prev,
                                  [i]: { ...prev[i], amount: undefined },
                                }));
                              }
                              if (milestoneErrors[-1]) {
                                setMilestoneErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[-1];
                                  return next;
                                });
                              }
                            }}
                            className={cn(
                              FIELD,
                              milestoneErrors[i]?.amount && FIELD_ERR,
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
                                    rates,
                                  );
                                const mm = m as Milestone & {
                                  amountProjectStr?: string;
                                };
                                if (
                                  mm.amountProjectStr !== undefined &&
                                  mm.amountProjectStr !== ""
                                ) {
                                  return mm.amountProjectStr;
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
                                  rates,
                                );
                              updateProjectMilestone(i, {
                                amount,
                                amountProjectStr,
                              });
                              if (milestoneErrors[i]?.amount) {
                                setMilestoneErrors((prev) => ({
                                  ...prev,
                                  [i]: { ...prev[i], amount: undefined },
                                }));
                              }
                              if (milestoneErrors[-1]) {
                                setMilestoneErrors((prev) => {
                                  const next = { ...prev };
                                  delete next[-1];
                                  return next;
                                });
                              }
                            }}
                            className={cn(
                              FIELD,
                              milestoneErrors[i]?.amount && FIELD_ERR,
                            )}
                          />
                        </div>
                      </div>
                        {milestoneErrors[i]?.amount && (
                          <p className="text-xs text-red-600">
                            {milestoneErrors[i].amount}
                          </p>
                        )}
                      </div>
                    ) : (
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
                            updateProjectMilestone(i, {
                              amount: Number.isFinite(n) && n >= 0 ? n : 0,
                            });
                            if (milestoneErrors[i]?.amount) {
                              setMilestoneErrors((prev) => ({
                                ...prev,
                                [i]: { ...prev[i], amount: undefined },
                              }));
                            }
                            if (milestoneErrors[-1]) {
                              setMilestoneErrors((prev) => {
                                const next = { ...prev };
                                delete next[-1];
                                return next;
                              });
                            }
                          }}
                          className={cn(
                            FIELD,
                            milestoneErrors[i]?.amount && FIELD_ERR,
                          )}
                        />
                        {milestoneErrors[i]?.amount && (
                          <p className="text-xs text-red-600 mt-1">
                            {milestoneErrors[i].amount}
                          </p>
                        )}
                        <MilestoneFxConversionHint
                          amount={
                            Number(m.amount) > 0 &&
                            Number.isFinite(Number(m.amount))
                              ? Number(m.amount)
                              : null
                          }
                          pref={pref}
                          proj={proj}
                          rates={rates}
                          t={
                            t as (
                              key: string,
                              values?: Record<string, string | number>,
                            ) => string
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs sm:text-sm font-medium">
                {t("customer.projects.detail.milestonesModal.description")}{" "}
                <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={2}
                value={m.description || ""}
                onChange={(e) => {
                  updateProjectMilestone(i, {
                    description: e.target.value,
                  });
                  if (milestoneErrors[i]?.description) {
                    setMilestoneErrors((prev) => ({
                      ...prev,
                      [i]: { ...prev[i], description: undefined },
                    }));
                  }
                }}
                className={cn(
                  "mt-1.5 text-sm sm:text-base",
                  FIELD,
                  milestoneErrors[i]?.description &&
                    "border-red-500 focus-visible:ring-red-500",
                )}
              />
              {milestoneErrors[i]?.description && (
                <p className="text-xs text-red-600 mt-1">
                  {milestoneErrors[i].description}
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => removeProjectMilestone(i)}
                size="sm"
                className="text-xs sm:text-sm bg-transparent"
              >
                {t("customer.projects.detail.milestonesModal.remove")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {summaryBelowMilestones}

      <p className="text-xs text-gray-600 pt-2 border-t border-gray-200/80 mt-2">
        {t("customer.projects.detail.milestonesModal.saveFirstHint")}
      </p>
      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-2 pt-2">
        <Button
          variant="outline"
          onClick={addProjectMilestone}
          size="sm"
          className="text-xs sm:text-sm w-full sm:w-auto bg-transparent"
        >
          {t("customer.projects.detail.milestonesModal.addMilestone")}
        </Button>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={onSave}
            disabled={savingMilestones || approvingMilestones || saveDisabled}
            size="sm"
            className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto bg-transparent"
          >
            {savingMilestones ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                {t("customer.projects.detail.milestonesModal.saving")}
              </>
            ) : (
              t("customer.projects.detail.milestonesModal.saveChanges")
            )}
          </Button>
          {!milestoneApprovalState.companyApproved && (
            <Button
              onClick={onApprove}
              disabled={
                savingMilestones ||
                approvingMilestones ||
                JSON.stringify(
                  normalizeMilestoneSequences(projectMilestones),
                ) !==
                  JSON.stringify(
                    normalizeMilestoneSequences(originalProjectMilestones),
                  )
              }
              size="sm"
              className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              {approvingMilestones ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  {t("customer.projects.detail.milestonesModal.approving")}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {t("customer.projects.detail.milestonesModal.approve")}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      {milestoneErrors[-1]?.title && (
        <div
          className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 font-medium"
          role="alert"
        >
          {milestoneErrors[-1]?.title}
        </div>
      )}
    </div>
  );
}
