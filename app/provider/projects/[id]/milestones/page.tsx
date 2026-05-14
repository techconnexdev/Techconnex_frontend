"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, CheckCircle, Loader2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  CustomerProjectMilestonesEditorForm,
  type MilestoneCurrencyContext,
  type MilestoneFieldErrors,
} from "@/components/customer/CustomerProjectMilestonesEditorForm";
import {
  generateProviderProjectMilestonesAiDraft,
  getProviderProjectById,
  getProviderProjectMilestones,
  updateProviderProjectMilestones,
  approveProviderMilestones,
  type Milestone,
} from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { formatDurationDays, timelineToDays } from "@/lib/timeline-utils";
import { useI18n } from "@/contexts/I18nProvider";
import { convertWithSnapshot, type FxRatesMap } from "@/lib/fx-snapshot";
import { milestoneProjectStrFromPreferredAmount } from "@/lib/proposal-currency-sync";
import { parseBidAmountInput } from "@/lib/utils";
import { MIN_MONETARY_AMOUNT } from "@/lib/amount-constraints";

const formatCurrencyAmount = (amount: number, currencyCode: string = "MYR") =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount || 0);

function numFromUnknown(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function stripMarkdown(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/(\*\*|__|\*|_)(.*?)\1/g, "$2")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((x) => stripMarkdown(String(x || ""))).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,|;/g)
      .map((x) => stripMarkdown(x))
      .filter(Boolean);
  }
  return [];
}

function splitClientAmountsForAi(totalClient: number, count: number): string[] {
  const safeCount = Math.max(1, count);
  const isWhole = Math.abs(totalClient - Math.round(totalClient)) < 1e-9;
  if (isWhole) {
    const totalInt = Math.round(totalClient);
    const base = Math.floor(totalInt / safeCount);
    let remainder = totalInt % safeCount;
    return Array.from({ length: safeCount }, () =>
      String(base + (remainder-- > 0 ? 1 : 0)),
    );
  }
  const raw = Array.from({ length: safeCount }, () => totalClient / safeCount);
  return raw.map((n, idx) =>
    idx === safeCount - 1
      ? (
          totalClient - raw.slice(0, idx).reduce((s, v) => s + v, 0)
        ).toFixed(2)
      : n.toFixed(2),
  );
}

function splitDurationIntoMilestones(totalDays: number, count: number) {
  const safeCount = Math.max(1, count);
  const base = Math.floor(totalDays / safeCount);
  let remainder = totalDays % safeCount;
  return Array.from({ length: safeCount }, () => {
    const days = Math.max(1, base + (remainder-- > 0 ? 1 : 0));
    return { durationAmount: String(days), durationUnit: "day" as const };
  });
}

function projectTargets(project: Record<string, unknown> | null | undefined) {
  if (!project) return { bidAmount: 0, deliveryTimeDays: 0 };
  const approvedPrice = numFromUnknown(project.approvedPrice);
  const bidFromProposal = numFromUnknown(project.bidAmount);
  const bidAmount = approvedPrice || bidFromProposal || 0;
  const raw = project.providerProposedTimeline;
  const deliveryTimeDays =
    typeof raw === "number" && Number.isFinite(raw)
      ? Math.max(0, Math.floor(raw))
      : typeof raw === "string"
        ? Math.max(0, Math.floor(Number(raw)) || 0)
        : 0;
  return { bidAmount, deliveryTimeDays };
}

function buildMilestoneCurrencyContextFromProject(
  projectRecord: Record<string, unknown> | null | undefined,
): MilestoneCurrencyContext | undefined {
  if (!projectRecord) return undefined;
  const p = projectRecord;
  const proj = String(
    p.originalCurrencyCode || p.currencyCode || "MYR",
  ).toUpperCase();
  const pref = String(
    p.displayCurrencyCode || p.currencyCode || "MYR",
  ).toUpperCase();
  const raw = p.fxSnapshotRatesJson;
  const fxSnapshotRatesJson: FxRatesMap | null =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as FxRatesMap)
      : null;
  return {
    projectCurrencyCode: proj,
    preferredCurrencyCode: pref,
    fxSnapshotRatesJson,
  };
}

/** DB stores milestone amounts in project (client) currency. */
function milestoneAmountInProjectCurrency(
  m: Milestone & { amountProjectStr?: string },
  ctx: MilestoneCurrencyContext | undefined,
): number {
  if (!ctx) return Number(m.amount) || 0;
  const pref = ctx.preferredCurrencyCode.toUpperCase();
  const proj = ctx.projectCurrencyCode.toUpperCase();
  const rates = ctx.fxSnapshotRatesJson;
  if (pref === proj || !rates) return Number(m.amount) || 0;
  const raw =
    m.amountProjectStr !== undefined && m.amountProjectStr !== ""
      ? m.amountProjectStr
      : milestoneProjectStrFromPreferredAmount(
          Number(m.amount),
          pref,
          proj,
          rates,
        );
  const n = parseFloat(parseBidAmountInput(raw || "0"));
  if (Number.isFinite(n) && n >= 0) return n;
  const c = convertWithSnapshot({
    amount: Number(m.amount),
    fromCurrencyCode: pref,
    toCurrencyCode: proj,
    ratesMap: rates,
  });
  return c != null && Number.isFinite(c) ? c : Number(m.amount) || 0;
}

/** When preferred ≠ project and FX exists, validate the project-currency row as well (major units). */
function dualMilestoneProjectAmountParsed(
  m: Milestone & { amountProjectStr?: string },
  ctx: MilestoneCurrencyContext | undefined,
): number | null {
  if (!ctx) return null;
  const pref = ctx.preferredCurrencyCode.toUpperCase();
  const proj = ctx.projectCurrencyCode.toUpperCase();
  const rates = ctx.fxSnapshotRatesJson;
  if (pref === proj || !rates) return null;
  const mm = m as Milestone & { amountProjectStr?: string };
  const raw =
    mm.amountProjectStr !== undefined && mm.amountProjectStr !== ""
      ? mm.amountProjectStr
      : milestoneProjectStrFromPreferredAmount(
          Number(m.amount),
          pref,
          proj,
          rates,
        );
  const n = parseFloat(parseBidAmountInput(String(raw ?? "0")));
  return Number.isFinite(n) ? n : null;
}

function applyProviderMilestoneLoad(
  milestones: Milestone[],
  projectRecord: Record<string, unknown> | null | undefined,
): Milestone[] {
  const ctx = buildMilestoneCurrencyContextFromProject(projectRecord);
  if (!ctx || ctx.preferredCurrencyCode === ctx.projectCurrencyCode) {
    return milestones.map((m) => ({ ...m, amountProjectStr: undefined }));
  }
  const pref = ctx.preferredCurrencyCode.toUpperCase();
  const proj = ctx.projectCurrencyCode.toUpperCase();
  const rates = ctx.fxSnapshotRatesJson;
  if (!rates) {
    return milestones.map((m) => ({ ...m, amountProjectStr: undefined }));
  }
  return milestones.map((m) => {
    const projectAmt = Number(m.amount) || 0;
    const prefAmt = convertWithSnapshot({
      amount: projectAmt,
      fromCurrencyCode: proj,
      toCurrencyCode: pref,
      ratesMap: rates,
    });
    const converted =
      prefAmt != null && Number.isFinite(prefAmt) ? prefAmt : projectAmt;
    return {
      ...m,
      amount: converted,
      amountProjectStr: parseBidAmountInput(String(projectAmt)),
    };
  });
}

function mapLoadedMilestones(
  raw: Milestone[],
): (Milestone & { durationAmount?: string; durationUnit?: string })[] {
  const sorted = [...raw].sort(
    (a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0),
  );
  return sorted.map((m, i) => {
    const prev = sorted[i - 1] as { daysFromStart?: number } | undefined;
    const currDays =
      (m as Milestone & { daysFromStart?: number }).daysFromStart ?? 0;
    const prevDays = prev?.daysFromStart ?? 0;
    const durationDays = currDays - prevDays;
    return {
      ...m,
      durationAmount: durationDays > 0 ? String(durationDays) : "",
      durationUnit: (durationDays > 0 ? "day" : "") as
        | "day"
        | "week"
        | "month"
        | "",
    } as Milestone & { durationAmount?: string; durationUnit?: string };
  });
}

export default function ProviderEditProjectMilestonesPage() {
  const params = useParams();
  const { t } = useI18n();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<Record<string, unknown> | null>(null);
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [originalProjectMilestones, setOriginalProjectMilestones] = useState<
    Milestone[]
  >([]);
  const [milestoneApprovalState, setMilestoneApprovalState] = useState({
    milestonesLocked: false,
    companyApproved: false,
    providerApproved: false,
    milestonesApprovedAt: null as string | null,
  });
  const [milestoneErrors, setMilestoneErrors] = useState<MilestoneFieldErrors>(
    {},
  );
  const [savingMilestones, setSavingMilestones] = useState(false);
  const [approvingMilestones, setApprovingMilestones] = useState(false);
  const [finalizeShown, setFinalizeShown] = useState(false);
  const [aiMilestonePrompt, setAiMilestonePrompt] = useState("");
  const [aiGeneratingMilestones, setAiGeneratingMilestones] = useState(false);
  const [aiMilestoneError, setAiMilestoneError] = useState<string | null>(null);
  const [aiGeneratedMilestones, setAiGeneratedMilestones] = useState(false);

  const projectRef = useRef<Record<string, unknown> | null>(null);
  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  /** Contract amounts are in project (customer) currency */
  const currency: string =
    typeof project?.currencyCode === "string"
      ? (project.currencyCode as string)
      : "MYR";

  const milestoneCurrencyContext = useMemo(
    () => buildMilestoneCurrencyContextFromProject(project),
    [project],
  );

  const projectCurrency =
    milestoneCurrencyContext?.projectCurrencyCode || currency;

  const milestoneMatchSummary = useMemo(() => {
    const p = project as Record<string, unknown> | null;
    const { bidAmount: bidAmountNum, deliveryTimeDays } = projectTargets(p);
    const sumMilestones = projectMilestones.reduce((sum, m) => {
      const val = milestoneAmountInProjectCurrency(
        m as Milestone & { amountProjectStr?: string },
        milestoneCurrencyContext,
      );
      if (!isNaN(val)) return sum + val;
      return sum;
    }, 0);
    const milestonesDurationDays = projectMilestones.reduce((sum, m) => {
      const mm = m as Milestone & {
        durationAmount?: string;
        durationUnit?: string;
      };
      const d = timelineToDays(
        Number(mm.durationAmount || 0),
        mm.durationUnit || "",
      );
      return sum + (d > 0 ? d : 0);
    }, 0);
    const bidMatch =
      bidAmountNum > 0 &&
      Math.abs(
        Number(sumMilestones.toFixed(2)) - Number(bidAmountNum.toFixed(2)),
      ) <= 0.01;
    const timeMatch =
      deliveryTimeDays > 0 && milestonesDurationDays === deliveryTimeDays;
    return {
      bidAmountNum,
      deliveryTimeDays,
      sumMilestones,
      milestonesDurationDays,
      bidMatch,
      timeMatch,
    };
  }, [project, projectMilestones, milestoneCurrencyContext]);

  const preferredCurrency =
    milestoneCurrencyContext?.preferredCurrencyCode || projectCurrency;
  const showFxInfoBanner =
    milestoneCurrencyContext != null && projectCurrency !== preferredCurrency;

  const dualCurrencyAmountHints = useMemo(() => {
    const rates = milestoneCurrencyContext?.fxSnapshotRatesJson;
    if (!rates || projectCurrency === preferredCurrency) {
      return {
        bidEquiv: null as number | null,
        sumEquiv: null as number | null,
      };
    }
    return {
      bidEquiv:
        convertWithSnapshot({
          amount: milestoneMatchSummary.bidAmountNum || 0,
          fromCurrencyCode: projectCurrency,
          toCurrencyCode: preferredCurrency,
          ratesMap: rates,
        }) ?? null,
      sumEquiv:
        convertWithSnapshot({
          amount: milestoneMatchSummary.sumMilestones || 0,
          fromCurrencyCode: projectCurrency,
          toCurrencyCode: preferredCurrency,
          ratesMap: rates,
        }) ?? null,
    };
  }, [
    milestoneCurrencyContext,
    projectCurrency,
    preferredCurrency,
    milestoneMatchSummary.bidAmountNum,
    milestoneMatchSummary.sumMilestones,
  ]);

  const canSaveMilestones = useMemo(() => {
    const p = project as Record<string, unknown> | null;
    const { bidAmount, deliveryTimeDays } = projectTargets(p);

    for (const m of projectMilestones) {
      const mm = m as Milestone & {
        durationAmount?: string;
        durationUnit?: string;
      };
      if (!m.title?.trim()) return false;
      if (!m.description?.trim()) return false;
      const prefAmt = Number(m.amount);
      if (!Number.isFinite(prefAmt) || prefAmt < MIN_MONETARY_AMOUNT)
        return false;
      const projDual = dualMilestoneProjectAmountParsed(
        m as Milestone & { amountProjectStr?: string },
        milestoneCurrencyContext,
      );
      if (projDual !== null && projDual < MIN_MONETARY_AMOUNT) return false;
      const durAmount =
        mm.durationAmount != null ? String(mm.durationAmount).trim() : "";
      if (!durAmount || Number(durAmount) <= 0) return false;
      if (!mm.durationUnit) return false;
    }

    if (bidAmount > 0 && !milestoneMatchSummary.bidMatch) return false;
    if (
      deliveryTimeDays > 0 &&
      projectMilestones.length > 0 &&
      !milestoneMatchSummary.timeMatch
    )
      return false;

    return true;
  }, [project, projectMilestones, milestoneMatchSummary]);

  const normalizeMilestoneSequences = useCallback((items: Milestone[]) => {
    return items
      .map((m, i) => ({ ...m, sequence: i + 1 }) as Milestone)
      .sort((a, b) => a.sequence - b.sequence);
  }, []);

  const addProjectMilestone = () => {
    setProjectMilestones((prev) =>
      normalizeMilestoneSequences([
        ...prev,
        {
          sequence: prev.length + 1,
          title: "",
          description: "",
          amount: 0,
          amountProjectStr: "",
          durationAmount: "",
          durationUnit: "" as "day" | "week" | "month" | "",
        } as Milestone & {
          durationAmount?: string;
          durationUnit?: string;
          amountProjectStr?: string;
        },
      ]),
    );
  };

  const generateAiMilestones = () => {
    const p = project as Record<string, unknown> | null;
    if (!p) return;
    const { bidAmount, deliveryTimeDays } = projectTargets(p);
    if (bidAmount <= 0 || deliveryTimeDays <= 0) {
      setAiMilestoneError(t("provider.projects.milestones.ai.errorNeedBidTimeline"));
      return;
    }
    setAiGeneratingMilestones(true);
    setAiMilestoneError(null);
    const run = async () => {
      try {
        let aiTitlesAndDesc: Array<{ title?: string; description?: string }> = [];
        try {
          const aiRes = await generateProviderProjectMilestonesAiDraft(projectId, {
            processPreference: aiMilestonePrompt,
            bidAmount: String(bidAmount),
            timelineAmount: String(deliveryTimeDays),
            timelineUnit: "day",
          });
          if (Array.isArray(aiRes?.draft?.milestones)) {
            aiTitlesAndDesc = aiRes.draft.milestones;
          }
        } catch {
          aiTitlesAndDesc = [];
        }

        const requirements = normalizeTextList(
          p.serviceRequestRequirements || p.requirements || p.projectRequirements || "",
        );
        const deliverables = normalizeTextList(
          p.serviceRequestDeliverables || p.deliverables || "",
        );
        const skills = normalizeTextList(
          p.serviceRequestSkills || p.skills || p.requiredSkills || "",
        );
        const hints = stripMarkdown(aiMilestonePrompt || "");
        const count = Math.min(
          6,
          Math.max(
            3,
            aiTitlesAndDesc.length || deliverables.length || requirements.length || 4,
          ),
        );
        const clientAmounts = splitClientAmountsForAi(bidAmount, count);
        const durations = splitDurationIntoMilestones(deliveryTimeDays, count);
        const titles = [
          t("provider.projects.milestones.ai.fallbackTitle1"),
          t("provider.projects.milestones.ai.fallbackTitle2"),
          t("provider.projects.milestones.ai.fallbackTitle3"),
          t("provider.projects.milestones.ai.fallbackTitle4"),
          t("provider.projects.milestones.ai.fallbackTitle5"),
          t("provider.projects.milestones.ai.fallbackTitle6"),
        ];

        const next = Array.from({ length: count }, (_, i) => {
          const projectAmountStr = clientAmounts[i] || "0";
          const preferredAmount =
            milestoneCurrencyContext &&
            milestoneCurrencyContext.preferredCurrencyCode !==
              milestoneCurrencyContext.projectCurrencyCode &&
            milestoneCurrencyContext.fxSnapshotRatesJson
              ? convertWithSnapshot({
                  amount: Number(projectAmountStr),
                  fromCurrencyCode: milestoneCurrencyContext.projectCurrencyCode,
                  toCurrencyCode: milestoneCurrencyContext.preferredCurrencyCode,
                  ratesMap: milestoneCurrencyContext.fxSnapshotRatesJson,
                }) ?? Number(projectAmountStr)
              : Number(projectAmountStr);
          const aiM = aiTitlesAndDesc[i];
          const defaultDel = t(
            "provider.projects.milestones.ai.descDefaultDeliverable",
          );
          return {
            sequence: i + 1,
            title: stripMarkdown(
              aiM?.title ||
                titles[i] ||
                t("provider.projects.milestones.ai.fallbackMilestoneTitle", {
                  n: i + 1,
                }),
            ),
            description: stripMarkdown(
              aiM?.description ||
                [
                  t("provider.projects.milestones.ai.descCompleteDeliverable", {
                    deliverable:
                      deliverables[i] || deliverables[0] || defaultDel,
                  }),
                  requirements[i] || requirements[0]
                    ? t("provider.projects.milestones.ai.descRequirements", {
                        text: requirements[i] || requirements[0] || "",
                      })
                    : "",
                  skills[i] || skills[0]
                    ? t("provider.projects.milestones.ai.descSkills", {
                        text: skills[i] || skills[0] || "",
                      })
                    : "",
                  hints ? t("provider.projects.milestones.ai.descProcessHint") : "",
                ]
                  .filter(Boolean)
                  .join(" "),
            ),
            amount: Number.isFinite(Number(preferredAmount))
              ? Number(preferredAmount)
              : 0,
            amountProjectStr: projectAmountStr,
            durationAmount: durations[i]?.durationAmount || "1",
            durationUnit: durations[i]?.durationUnit || "day",
          } as Milestone;
        });

        setProjectMilestones(normalizeMilestoneSequences(next));
        setAiGeneratedMilestones(true);
        setMilestoneErrors({});
        toast.success(t("provider.projects.milestones.ai.toastSuccess"));
      } catch {
        setAiMilestoneError(t("provider.projects.milestones.ai.errorGeneric"));
      } finally {
        setAiGeneratingMilestones(false);
      }
    };
    void run();
  };

  const updateProjectMilestone = (i: number, patch: Partial<Milestone>) => {
    setProjectMilestones((prev) =>
      normalizeMilestoneSequences(
        prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
      ),
    );
  };

  const removeProjectMilestone = (i: number) => {
    setProjectMilestones((prev) =>
      normalizeMilestoneSequences(prev.filter((_, idx) => idx !== i)),
    );
  };

  const reloadMilestones = useCallback(
    async (projectRecord?: Record<string, unknown> | null) => {
      const milestoneData = await getProviderProjectMilestones(projectId);
      const loadedMilestones: Milestone[] = Array.isArray(
        milestoneData.milestones,
      )
        ? milestoneData.milestones.map(
            (m: Milestone | Record<string, unknown>) =>
              ({
                ...(m as Milestone),
                sequence: ((m as Milestone).order ??
                  (m as Record<string, unknown>).order) as number,
              }) as Milestone,
          )
        : [];
      const withDuration = mapLoadedMilestones(loadedMilestones);
      const pr = projectRecord ?? projectRef.current;
      const transformed = applyProviderMilestoneLoad(withDuration, pr);
      setProjectMilestones(transformed);
      setOriginalProjectMilestones(JSON.parse(JSON.stringify(transformed)));
      setMilestoneApprovalState({
        milestonesLocked: milestoneData.milestonesLocked,
        companyApproved: milestoneData.companyApproved,
        providerApproved: milestoneData.providerApproved,
        milestonesApprovedAt: milestoneData.milestonesApprovedAt,
      });
    },
    [projectId],
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getProviderProjectById(projectId);
        if (!res?.success || !res.project) {
          setError(t("provider.projects.detail.notFound"));
          return;
        }
        if (cancelled) return;
        setProject(res.project as Record<string, unknown>);
        await reloadMilestones(res.project as Record<string, unknown>);
      } catch (e) {
        if (!cancelled) {
          setError(
            getUserFriendlyErrorMessage(e, "provider project milestones load"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, reloadMilestones, t]);

  const handleSaveProjectMilestones = async () => {
    if (!project?.id) return;
    if (!canSaveMilestones) return;

    type Err = {
      title?: string;
      description?: string;
      amount?: string;
      durationAmount?: string;
      durationUnit?: string;
    };
    const errors: MilestoneFieldErrors = {};
    let hasErrors = false;
    projectMilestones.forEach((m, idx) => {
      const milestoneErrorsOne: Err = {};
      const mm = m as Milestone & {
        durationAmount?: string;
        durationUnit?: string;
      };

      if (!m.title || !m.title.trim()) {
        milestoneErrorsOne.title = t(
          "provider.projects.validation.titleRequired",
        );
        hasErrors = true;
      }
      if (!m.description || !m.description.trim()) {
        milestoneErrorsOne.description = t(
          "provider.projects.validation.descriptionRequired",
        );
        hasErrors = true;
      }
      const durAmount =
        mm.durationAmount != null ? String(mm.durationAmount).trim() : "";
      const durUnit = mm.durationUnit || "";
      if (!durAmount || Number(durAmount) <= 0) {
        milestoneErrorsOne.durationAmount = t(
          "provider.projects.validation.durationAmount",
        );
        hasErrors = true;
      }
      if (!durUnit) {
        milestoneErrorsOne.durationUnit = t(
          "provider.projects.validation.durationUnit",
        );
        hasErrors = true;
      }
      const prefAmt = Number(m.amount);
      if (!Number.isFinite(prefAmt) || prefAmt < MIN_MONETARY_AMOUNT) {
        milestoneErrorsOne.amount = t(
          "provider.opportunities.validation.amountMin",
          {
            min: MIN_MONETARY_AMOUNT,
          },
        );
        hasErrors = true;
      }
      const projDual = dualMilestoneProjectAmountParsed(
        m as Milestone & { amountProjectStr?: string },
        milestoneCurrencyContext,
      );
      if (projDual !== null && projDual < MIN_MONETARY_AMOUNT) {
        milestoneErrorsOne.amount = t(
          "provider.opportunities.validation.amountMin",
          {
            min: MIN_MONETARY_AMOUNT,
          },
        );
        hasErrors = true;
      }
      if (Object.keys(milestoneErrorsOne).length > 0)
        errors[idx] = milestoneErrorsOne;
    });

    const { bidAmount, deliveryTimeDays } = projectTargets(
      project as Record<string, unknown> | null,
    );

    if (bidAmount > 0) {
      const sumMilestones = projectMilestones.reduce((sum, m) => {
        const val = milestoneAmountInProjectCurrency(
          m as Milestone & { amountProjectStr?: string },
          milestoneCurrencyContext,
        );
        if (!isNaN(val)) return sum + val;
        return sum;
      }, 0);

      if (Math.abs(Number(sumMilestones.toFixed(2)) - Number(bidAmount.toFixed(2))) > 0.01) {
        const msg = t("provider.projects.validation.milestoneSumMismatch", {
          sum: Number(sumMilestones.toFixed(2)).toLocaleString(),
          bid: Number(bidAmount.toFixed(2)).toLocaleString(),
        });
        errors[-1] = { ...errors[-1], title: errors[-1]?.title ?? msg };
        hasErrors = true;
      }
    }

    if (deliveryTimeDays > 0 && projectMilestones.length > 0) {
      const milestonesDurationDays = projectMilestones.reduce((sum, m) => {
        const mm = m as Milestone & {
          durationAmount?: string;
          durationUnit?: string;
        };
        const d = timelineToDays(
          Number(mm.durationAmount || 0),
          mm.durationUnit || "",
        );
        return sum + (d > 0 ? d : 0);
      }, 0);
      if (milestonesDurationDays !== deliveryTimeDays) {
        const msg = t("provider.opportunities.validation.durationSumMismatch", {
          expected: deliveryTimeDays,
          actual: milestonesDurationDays,
        });
        errors[-1] = { ...errors[-1], title: errors[-1]?.title ?? msg };
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setMilestoneErrors(errors);
      toast.error(t("provider.projects.validation.fillMilestonesToast"));
      return;
    }

    setMilestoneErrors({});

    if (savingMilestones || approvingMilestones) return;

    try {
      setSavingMilestones(true);
      const sorted = normalizeMilestoneSequences(projectMilestones);
      let cum = 0;
      const payload = sorted.map((m) => {
        const mm = m as Milestone & {
          durationAmount?: string;
          durationUnit?: string;
        };
        const d = timelineToDays(
          Number(mm.durationAmount || 0),
          mm.durationUnit || "",
        );
        cum += d;
        return {
          sequence: m.sequence ?? m.order,
          title: m.title,
          description: m.description ?? "",
          amount: Number(
            milestoneAmountInProjectCurrency(
              m as Milestone & { amountProjectStr?: string },
              milestoneCurrencyContext,
            ).toFixed(2),
          ),
          daysFromStart: cum,
        };
      });
      await updateProviderProjectMilestones(project.id as string, payload);
      await reloadMilestones();
      toast.success(t("provider.projects.toast.milestonesUpdatedDesc"));
    } catch (e) {
      toast.error(
        getUserFriendlyErrorMessage(e, "provider project save milestones"),
      );
    } finally {
      setSavingMilestones(false);
    }
  };

  const handleApproveProjectMilestones = async () => {
    if (!project?.id) return;
    if (savingMilestones || approvingMilestones) return;
    try {
      setApprovingMilestones(true);
      const res = await approveProviderMilestones(project.id as string);
      setMilestoneApprovalState({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });
      await reloadMilestones();
      setFinalizeShown(true);
      toast.success(
        res.milestonesLocked
          ? t("provider.projects.toast.milestonesLockedWork")
          : t("provider.projects.toast.waitingCompanyApprove"),
      );
    } catch (e) {
      toast.error(
        getUserFriendlyErrorMessage(e, "provider project approve milestones"),
      );
    } finally {
      setApprovingMilestones(false);
    }
  };

  const backHref = `/provider/projects/${projectId}?tab=milestones`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
        <Card className="max-w-md bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">
              {t("provider.projects.detail.errorTitle")}
            </CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="bg-transparent">
              <Link href={backHref}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t("provider.projects.milestonesPage.backToProject")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (milestoneApprovalState.milestonesLocked && !finalizeShown) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 sm:p-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
            animate={{ rotate: -360 }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          />
        </div>
        <motion.div
          className="max-w-lg mx-auto relative z-10 pt-8"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle>
                {t("provider.projects.detail.milestones.badge.locked")}
              </CardTitle>
              <CardDescription>
                {t("provider.projects.milestonesPage.milestonesLockedDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href={backHref}>
                  {t("provider.projects.milestonesPage.backToProject")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <motion.div
        className="relative z-10 max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 pb-16"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <div className="mb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("provider.projects.milestonesPage.backToProject")}
          </Link>
        </div>

        {finalizeShown ? (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-600" />
                {t("provider.projects.toast.milestonesApprovedTitle")}
              </CardTitle>
              <CardDescription>
                {t("provider.projects.toast.milestonesUpdatedDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <CheckCircle
                  className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    milestoneApprovalState.companyApproved
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t("provider.projects.detail.milestones.badge.company")}
                  </div>
                  <div>
                    {milestoneApprovalState.companyApproved
                      ? t(
                          "provider.projects.milestonesPage.companyApprovedBody",
                        )
                      : t("provider.projects.toast.waitingCompanyApprove")}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t("provider.projects.detail.milestones.badge.provider")}
                  </div>
                  <div>
                    {milestoneApprovalState.providerApproved
                      ? t("provider.projects.toast.milestonesApprovedTitle")
                      : "—"}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle
                  className={`w-5 h-5 shrink-0 mt-0.5 ${
                    milestoneApprovalState.milestonesLocked
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t("provider.projects.detail.milestones.badge.locked")}
                  </div>
                  <div>
                    {milestoneApprovalState.milestonesLocked
                      ? t("provider.projects.toast.milestonesLockedWork")
                      : t("provider.projects.toast.waitingCompanyApprove")}
                  </div>
                  {milestoneApprovalState.milestonesApprovedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(
                        milestoneApprovalState.milestonesApprovedAt,
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              <Button
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
              >
                <Link href={backHref}>
                  {t("provider.projects.milestonesPage.backToProject")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="text-center sm:text-left">
              <CardTitle className="text-2xl font-bold text-gray-900">
                {t("provider.projects.detail.milestones.edit")}
              </CardTitle>
              <CardDescription className="text-base text-gray-600">
                {String(project.title ?? "Project")} ·{" "}
                {t("provider.projects.detail.milestones.badge.company")}{" "}
                {milestoneApprovalState.companyApproved ? "✓" : "✗"} ·{" "}
                {t("provider.projects.detail.milestones.badge.provider")}{" "}
                {milestoneApprovalState.providerApproved ? "✓" : "✗"}
                {milestoneApprovalState.milestonesLocked &&
                  ` · ${t("provider.projects.detail.milestones.badge.locked")}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              {showFxInfoBanner ? (
                <div className="mb-4 rounded-lg border border-blue-200/80 bg-blue-50/60 p-3 text-sm text-gray-700">
                  {t("provider.opportunities.proposal.fxInfoBanner", {
                    preferred: preferredCurrency,
                    project: projectCurrency,
                  })}
                  {typeof project?.fxSnapshotDate === "string" &&
                    project.fxSnapshotDate && (
                      <span className="mt-1 block text-xs text-gray-600">
                        {t("provider.opportunities.proposal.fxRatesDate", {
                          date: project.fxSnapshotDate,
                        })}
                      </span>
                    )}
                </div>
              ) : null}

              <div className="mb-4 rounded-xl border border-gray-200/80 bg-white/60 p-4 text-sm text-gray-800">
                <div className="font-medium space-y-1">
                  <div>
                    {t("customer.projects.milestones.edit.agreedBid", {
                      amount: formatCurrencyAmount(
                        milestoneMatchSummary.bidAmountNum || 0,
                        projectCurrency,
                      ),
                    })}
                  </div>
                  {dualCurrencyAmountHints.bidEquiv != null ? (
                    <div className="text-xs text-gray-600 font-normal">
                      {t("provider.projects.milestones.amountEquivPreferred", {
                        amount: formatCurrencyAmount(
                          dualCurrencyAmountHints.bidEquiv,
                          preferredCurrency,
                        ),
                      })}
                    </div>
                  ) : null}
                </div>
                <div className="mt-1 text-gray-700">
                  {t("customer.projects.milestones.edit.agreedDelivery", {
                    duration: formatDurationDays(
                      milestoneMatchSummary.deliveryTimeDays || 0,
                    ),
                  })}
                </div>
              </div>
              <p className="mb-4 rounded-md border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
                For client-facing amounts ({projectCurrency}), avoid fractional
                values (for example, use 500 instead of 500.25) whenever possible.
              </p>
              <div className="mb-4 rounded-xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 to-white p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  {t("provider.projects.milestones.ai.title")}
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {t("provider.projects.milestones.ai.description")}
                </p>
                <Textarea
                  rows={3}
                  className="mt-3 bg-white"
                  placeholder={t(
                    "provider.projects.milestones.ai.promptPlaceholder",
                  )}
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
                    onClick={generateAiMilestones}
                    disabled={aiGeneratingMilestones}
                  >
                    {aiGeneratingMilestones ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    {aiGeneratingMilestones
                      ? t("provider.projects.milestones.ai.generating")
                      : t("provider.projects.milestones.ai.generate")}
                  </Button>
                  {aiGeneratedMilestones ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-red-200 text-red-600 hover:text-red-700 bg-transparent"
                      onClick={() => {
                        setProjectMilestones([]);
                        setAiGeneratedMilestones(false);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {t("provider.projects.milestones.ai.deleteDrafts")}
                    </Button>
                  ) : null}
                </div>
              </div>

              <CustomerProjectMilestonesEditorForm
                projectMilestones={projectMilestones}
                originalProjectMilestones={originalProjectMilestones}
                milestoneErrors={milestoneErrors}
                milestoneApprovalState={milestoneApprovalState}
                normalizeMilestoneSequences={normalizeMilestoneSequences}
                updateProjectMilestone={updateProjectMilestone}
                addProjectMilestone={addProjectMilestone}
                removeProjectMilestone={removeProjectMilestone}
                setMilestoneErrors={setMilestoneErrors}
                onSave={handleSaveProjectMilestones}
                onApprove={handleApproveProjectMilestones}
                savingMilestones={savingMilestones}
                approvingMilestones={approvingMilestones}
                saveDisabled={!canSaveMilestones}
                currencyContext={milestoneCurrencyContext}
                summaryBelowMilestones={
                  projectMilestones.length > 0 ? (
                    <div className="rounded-lg border border-gray-200/80 bg-white/50 p-3 text-sm space-y-3">
                      <div className="flex justify-between flex-wrap gap-2">
                        <div>
                          <div className="font-medium space-y-1">
                            <div>
                              {t(
                                "provider.opportunities.proposal.milestonesTotal",
                                {
                                  sum: formatCurrencyAmount(
                                    milestoneMatchSummary.sumMilestones || 0,
                                    projectCurrency,
                                  ),
                                },
                              )}
                            </div>
                            {dualCurrencyAmountHints.sumEquiv != null ? (
                              <div className="text-xs text-gray-600 font-normal">
                                {t(
                                  "provider.projects.milestones.amountEquivPreferred",
                                  {
                                    amount: formatCurrencyAmount(
                                      dualCurrencyAmountHints.sumEquiv,
                                      preferredCurrency,
                                    ),
                                  },
                                )}
                              </div>
                            ) : null}
                            <div>
                              {t(
                                "provider.opportunities.proposal.yourBidLine",
                                {
                                  amount: formatCurrencyAmount(
                                    milestoneMatchSummary.bidAmountNum || 0,
                                    projectCurrency,
                                  ),
                                },
                              )}
                            </div>
                            {dualCurrencyAmountHints.bidEquiv != null ? (
                              <div className="text-xs text-gray-600 font-normal">
                                {t(
                                  "provider.projects.milestones.amountEquivPreferred",
                                  {
                                    amount: formatCurrencyAmount(
                                      dualCurrencyAmountHints.bidEquiv,
                                      preferredCurrency,
                                    ),
                                  },
                                )}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div
                          className={
                            "text-xs font-semibold " +
                            (milestoneMatchSummary.bidMatch
                              ? "text-green-600"
                              : "text-red-600")
                          }
                        >
                          {milestoneMatchSummary.bidMatch
                            ? t("provider.opportunities.proposal.bidMatchOk")
                            : t("provider.opportunities.proposal.bidMatchBad")}
                        </div>
                      </div>
                      <div className="flex justify-between flex-wrap gap-2 border-t pt-2">
                        <div>
                          <div className="font-medium">
                            {t(
                              "provider.opportunities.proposal.durationTotal",
                              {
                                days: milestoneMatchSummary.milestonesDurationDays,
                              },
                            )}
                          </div>
                          <div>
                            {t(
                              "provider.opportunities.proposal.deliveryDaysLine",
                              {
                                days: milestoneMatchSummary.deliveryTimeDays,
                              },
                            )}
                          </div>
                        </div>
                        <div
                          className={
                            "text-xs font-semibold " +
                            (milestoneMatchSummary.timeMatch
                              ? "text-green-600"
                              : "text-red-600")
                          }
                        >
                          {milestoneMatchSummary.timeMatch
                            ? t("provider.opportunities.proposal.timeMatchOk")
                            : t("provider.opportunities.proposal.timeMatchBad")}
                        </div>
                      </div>
                    </div>
                  ) : null
                }
              />
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
}
