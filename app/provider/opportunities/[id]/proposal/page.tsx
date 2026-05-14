"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ChevronLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PROPOSAL_REQUIRED } from "@/contexts/ProviderCompletionContext";
import { ProfileCompletionGateModal } from "@/components/provider/ProfileCompletionGateModal";
import SubmitProposalForm from "@/components/provider/opportunities/SubmitProposalForm";
import type {
  ProposalFieldErrors,
  ProposalFormData,
  ProposalMilestone,
  SubmitProposalProjectContext,
} from "@/components/provider/opportunities/submit-proposal-types";
import { validateProviderProposal } from "@/lib/submit-proposal-validation";
import {
  generateProviderOpportunityAiDraft,
  getProviderOpportunityById,
  getProviderProfile,
  getProviderProfileCompletion,
  sendProposal,
} from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { FriendlyErrorState } from "@/components/FriendlyErrorState";
import { toast } from "@/lib/toast";
import { validateFileBeforeUpload } from "@/lib/upload";
import { buildTimelineData, timelineToDays } from "@/lib/timeline-utils";
import { useI18n } from "@/contexts/I18nProvider";
import {
  syncBidPreferredStringFromProject,
  syncBidProjectStringFromPreferred,
} from "@/lib/proposal-currency-sync";

const MAX_FILES = 3;
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

type OpportunityMilestoneInput = {
  title: string;
  description: string;
  amount: number;
  durationAmount: string;
  durationUnit: "day" | "week" | "month";
};

function stripMarkdown(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/(\*\*|__|\*|_)(.*?)\1/g, "$2")
    .replace(/~~(.*?)~~/g, "$1")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-*+]\s+/gm, "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function extractRequestedMilestoneCount(input: string): number | null {
  const text = String(input || "").toLowerCase();
  const digitMatch = text.match(
    /(\d+)\s*(milestone|milestones|phase|phases|tahap|steps?)/i,
  );
  if (digitMatch) {
    const n = Number(digitMatch[1]);
    if (Number.isFinite(n) && n >= 1 && n <= 12) return Math.floor(n);
  }
  return null;
}

function normalizeTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => stripMarkdown(String(item || "").trim()))
      .filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,|;/g)
      .map((item) => stripMarkdown(item.replace(/^[-*]\s*/, "").trim()))
      .filter(Boolean);
  }
  return [];
}

function splitDurationIntoMilestones(
  totalDays: number,
  count: number,
): Array<{ amount: string; unit: "day" | "week" | "month" }> {
  const safeCount = Math.max(1, count);
  const base = Math.floor(totalDays / safeCount);
  let remainder = totalDays % safeCount;
  return Array.from({ length: safeCount }, () => {
    const days = Math.max(1, base + (remainder-- > 0 ? 1 : 0));
    if (days % 30 === 0) return { amount: String(days / 30), unit: "month" };
    if (days % 7 === 0) return { amount: String(days / 7), unit: "week" };
    return { amount: String(days), unit: "day" };
  });
}

function splitAmounts(total: number, count: number): number[] {
  const safeCount = Math.max(1, count);
  const raw = Array.from({ length: safeCount }, () => total / safeCount);
  return raw.map((n, idx) =>
    idx === safeCount - 1
      ? Math.max(
          0,
          Number(
            (total - raw.slice(0, idx).reduce((s, v) => s + v, 0)).toFixed(2),
          ),
        )
      : Number(n.toFixed(2)),
  );
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
  return splitAmounts(totalClient, safeCount).map((n) => n.toFixed(2));
}

function buildProviderStyleDescription(params: {
  index: number;
  total: number;
  requirement?: string;
  deliverable?: string;
  skill?: string;
  processPreference?: string;
}): string {
  const { index, total, requirement, deliverable, skill, processPreference } =
    params;

  const phaseLead =
    index === 0
      ? "In this phase, I will align the scope and confirm the implementation plan."
      : index === total - 1
        ? "In this final phase, I will complete delivery, verification, and handover."
        : "In this phase, I will deliver the agreed work items and keep progress transparent.";

  const details: string[] = [];
  if (requirement) details.push(`This includes ${requirement.toLowerCase()}.`);
  if (deliverable)
    details.push(`The output will be ${deliverable.toLowerCase()}.`);
  if (skill)
    details.push(
      `I will apply ${skill.toLowerCase()} to ensure quality results.`,
    );
  if (processPreference && processPreference.trim()) {
    details.push(
      "I will follow your preferred collaboration flow and provide clear updates throughout this milestone.",
    );
  }

  return stripMarkdown([phaseLead, ...details].join(" "));
}

function generateSmartMilestones(params: {
  processPreference: string;
  requestedMilestoneCount: number | null;
  project: SubmitProposalProjectContext;
  bidAmount: number;
  timelineDays: number;
  requirements: string[];
  deliverables: string[];
  skills: string[];
}): { milestones: OpportunityMilestoneInput[]; explanation: string[] } {
  const {
    processPreference,
    requestedMilestoneCount,
    project,
    bidAmount,
    timelineDays,
    requirements,
    deliverables,
    skills,
  } = params;
  const combined = [
    processPreference,
    requirements.join(" "),
    deliverables.join(" "),
    project.title,
  ]
    .join(" ")
    .toLowerCase();

  const suggestedCount = requestedMilestoneCount
    ? Math.min(12, Math.max(1, requestedMilestoneCount))
    : Math.min(
        6,
        Math.max(3, deliverables.length > 0 ? deliverables.length : 4),
      );
  const durationPlan = splitDurationIntoMilestones(
    timelineDays,
    suggestedCount,
  );
  const amountPlan = splitAmounts(bidAmount, suggestedCount);

  const baseTitles = [
    "Discovery & alignment",
    "Design & technical planning",
    "Core build",
    "Integration & quality assurance",
    "Launch & handover",
    "Post-launch support",
  ];
  const ecommerceHints =
    combined.includes("payment") || combined.includes("checkout");
  const dashboardHints =
    combined.includes("dashboard") || combined.includes("analytics");
  if (ecommerceHints) baseTitles[3] = "Payment flow, security & QA";
  if (dashboardHints) baseTitles[2] = "Core build with dashboard modules";

  const milestones = Array.from({ length: suggestedCount }, (_, i) => {
    const req = stripMarkdown(requirements[i] || requirements[0] || "");
    const del = stripMarkdown(deliverables[i] || deliverables[0] || "");
    const skill = stripMarkdown(skills[i] || "");
    return {
      title: stripMarkdown(baseTitles[i] || `Milestone ${i + 1}`),
      description: buildProviderStyleDescription({
        index: i,
        total: suggestedCount,
        requirement: req,
        deliverable: del,
        skill,
        processPreference,
      }),
      amount: amountPlan[i] ?? 0,
      durationAmount: durationPlan[i]?.amount || "1",
      durationUnit: durationPlan[i]?.unit || "week",
    };
  });

  const explanation = [
    `Built from your brief plus ${requirements.length} requirement(s) and ${deliverables.length} deliverable(s).`,
    `Milestone amounts are distributed to exactly match your bid (${project.preferredCurrencyCode} ${bidAmount.toFixed(2)}).`,
    `Durations are allocated to match your delivery timeline (${timelineDays} day(s) total).`,
    processPreference.trim()
      ? "Your process preference was considered in sequencing and milestone emphasis."
      : "No extra process note was required; milestones were inferred from the project context.",
    "You can approve this draft directly or adjust any milestone before submitting.",
  ];

  return { milestones, explanation };
}

function generateCoverLetterFromContext(params: {
  providerProfile: Record<string, unknown> | null;
  rawOpportunity: Record<string, unknown>;
  project: SubmitProposalProjectContext;
  bidAmount: string;
  timelineAmount: string;
  timelineUnit: "day" | "week" | "month" | "";
}): string {
  const {
    providerProfile,
    rawOpportunity,
    project,
    bidAmount,
    timelineAmount,
    timelineUnit,
  } = params;
  const profileUser =
    providerProfile?.user && typeof providerProfile.user === "object"
      ? (providerProfile.user as Record<string, unknown>)
      : null;
  const resolvedName = stripMarkdown(
    String(
      providerProfile?.name ||
        profileUser?.name ||
        [profileUser?.firstName, profileUser?.lastName]
          .filter(Boolean)
          .join(" ") ||
        "our team",
    ),
  ).trim();
  const name = resolvedName || "our team";
  const major = stripMarkdown(String(providerProfile?.major || "")).trim();
  const bio = stripMarkdown(String(providerProfile?.bio || "")).trim();
  const skills = normalizeTextList(providerProfile?.skills).slice(0, 5);
  const yearsExperience = Number(providerProfile?.yearsExperience || 0);
  const requirements = normalizeTextList(rawOpportunity.requirements).slice(
    0,
    3,
  );
  const deliverables = normalizeTextList(rawOpportunity.deliverables).slice(
    0,
    3,
  );
  const timelineText =
    timelineAmount && timelineUnit
      ? `${timelineAmount} ${timelineUnit}${timelineAmount === "1" ? "" : "s"}`
      : "the requested timeline";
  const bidText =
    Number(bidAmount || 0) > 0
      ? `${project.preferredCurrencyCode} ${Number(bidAmount).toFixed(2)}`
      : "the proposed budget";

  const intro = `Hello, I am ${name}${major ? `, a ${major} specialist` : ""}.`;
  const fit = bio
    ? `Based on your project, I can contribute effectively with this background: ${bio.slice(0, 220)}${bio.length > 220 ? "..." : ""}`
    : yearsExperience > 0
      ? `I have ${yearsExperience}+ years of experience delivering similar projects and can support your business goals end to end.`
      : "I can support your project from planning through delivery with a structured and reliable workflow.";
  const capability = skills.length
    ? `My key capabilities for this project include ${skills.join(", ")}.`
    : "I will apply the right technical approach to deliver a reliable, maintainable solution.";
  const scopeLine =
    requirements.length > 0 || deliverables.length > 0
      ? `I understand the scope, including ${[...requirements, ...deliverables].slice(0, 3).join(", ")}.`
      : `I understand your project requirements and expected outcomes, and I will align each phase with your priorities.`;
  const commitment = `I can deliver this within ${timelineText} for ${bidText}, with clear milestone updates and timely communication throughout the project.`;
  const close =
    "I would be happy to collaborate and discuss any adjustments you would like before we begin.";

  return stripMarkdown(
    [intro, fit, capability, scopeLine, commitment, close].join(" "),
  );
}

function mapApiToProjectContext(
  opp: Record<string, unknown>,
): SubmitProposalProjectContext {
  const projectCurrency = String(
    (opp.originalCurrencyCode as string) ||
      (opp.currencyCode as string) ||
      "MYR",
  ).toUpperCase();
  const preferred = String(
    (opp.preferredCurrency as string) ||
      (opp.displayCurrencyCode as string) ||
      projectCurrency,
  ).toUpperCase();
  const rawRates = opp.fxSnapshotRatesJson;
  const fxSnapshotRatesJson =
    rawRates && typeof rawRates === "object" && !Array.isArray(rawRates)
      ? (rawRates as Record<string, { unit: number; middleRate: number }>)
      : null;

  const clientMin = Number(opp.originalBudgetMin ?? opp.budgetMin ?? 0) || 0;
  const clientMax = Number(opp.originalBudgetMax ?? opp.budgetMax ?? 0) || 0;

  return {
    title: String(opp.title || ""),
    projectCurrencyCode: projectCurrency,
    preferredCurrencyCode: preferred,
    budgetMin: Number(opp.displayBudgetMin ?? opp.budgetMin ?? 0) || 0,
    budgetMax: Number(opp.displayBudgetMax ?? opp.budgetMax ?? 0) || 0,
    clientBudgetMin: clientMin,
    clientBudgetMax: clientMax,
    originalTimeline: opp.timeline ? String(opp.timeline) : null,
    fxSnapshotRatesJson,
    fxSnapshotDate: opp.fxSnapshotDate ? String(opp.fxSnapshotDate) : null,
    fxSnapshotSession: opp.fxSnapshotSession
      ? String(opp.fxSnapshotSession)
      : null,
  };
}

export default function ProviderSubmitProposalPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const opportunityId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawOpportunity, setRawOpportunity] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [project, setProject] = useState<SubmitProposalProjectContext | null>(
    null,
  );

  const [proposalGateOpen, setProposalGateOpen] = useState(false);
  const [proposalCompletionChecking, setProposalCompletionChecking] =
    useState(true);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [providerProfile, setProviderProfile] = useState<Record<
    string,
    unknown
  > | null>(null);

  const [proposalData, setProposalData] = useState<ProposalFormData>({
    coverLetter: "",
    bidAmount: "",
    bidAmountProject: "",
    timelineAmount: "",
    timelineUnit: "",
    milestones: [],
    attachments: [],
  });

  const [proposalErrors, setProposalErrors] = useState<ProposalFieldErrors>({});
  const [formValidationMessages, setFormValidationMessages] = useState<
    string[]
  >([]);
  const [aiMilestonePrompt, setAiMilestonePrompt] = useState("");
  const [aiGeneratingMilestones, setAiGeneratingMilestones] = useState(false);
  const [aiMilestoneExplanation, setAiMilestoneExplanation] = useState<
    string[]
  >([]);
  const [aiMilestoneError, setAiMilestoneError] = useState<string | null>(null);
  const [aiGeneratedMilestones, setAiGeneratedMilestones] = useState(false);
  const [aiGeneratingCoverLetter, setAiGeneratingCoverLetter] = useState(false);
  const [aiCoverLetterError, setAiCoverLetterError] = useState<string | null>(
    null,
  );
  /** After a failed submit, re-validate on change so errors clear as the user fixes fields. */
  const [liveValidationActive, setLiveValidationActive] = useState(false);

  const normalizeDraftSequences = (items: ProposalMilestone[]) =>
    items
      .map((m, i) => ({ ...m, sequence: i + 1 }))
      .sort((a, b) => a.sequence - b.sequence);

  const addProposalMilestone = () => {
    setProposalData((prev) => ({
      ...prev,
      milestones: normalizeDraftSequences([
        ...prev.milestones,
        {
          sequence: prev.milestones.length + 1,
          title: "",
          description: "",
          amount: 0,
          amountProjectStr: "",
          durationAmount: "1",
          durationUnit: "week",
        },
      ]),
    }));
  };

  const updateProposalMilestone = (
    i: number,
    patch: Partial<ProposalMilestone>,
  ) => {
    setProposalData((prev) => ({
      ...prev,
      milestones: normalizeDraftSequences(
        prev.milestones.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
      ),
    }));
  };

  const removeProposalMilestone = (i: number) => {
    setProposalData((prev) => ({
      ...prev,
      milestones: normalizeDraftSequences(
        prev.milestones.filter((_, idx) => idx !== i),
      ),
    }));
  };

  const handleGenerateAiMilestones = () => {
    if (!project || !rawOpportunity) return;
    const processPreference = aiMilestonePrompt.trim();
    const requestedMilestoneCount =
      extractRequestedMilestoneCount(processPreference);
    const bidAmount = Number(proposalData.bidAmount || 0);
    if (!Number.isFinite(bidAmount) || bidAmount <= 0) {
      setAiMilestoneError("Enter your bid amount first before generating.");
      return;
    }
    const timelineDays = timelineToDays(
      Number(proposalData.timelineAmount || 0),
      proposalData.timelineUnit || "",
    );
    if (!timelineDays || timelineDays <= 0) {
      setAiMilestoneError("Enter delivery timeline first before generating.");
      return;
    }

    setAiGeneratingMilestones(true);
    setAiMilestoneError(null);
    const run = async () => {
      try {
        let aiMilestones: Array<{
          title?: string;
          description?: string;
        }> | null = null;
        let aiExplanation: string[] = [];

        try {
          const aiRes = await generateProviderOpportunityAiDraft(
            opportunityId,
            {
              processPreference,
              bidAmount: proposalData.bidAmount,
              timelineAmount: proposalData.timelineAmount,
              timelineUnit: proposalData.timelineUnit,
            },
          );
          aiMilestones =
            Array.isArray(aiRes?.draft?.milestones) &&
            aiRes.draft.milestones.length > 0
              ? aiRes.draft.milestones
              : null;
          aiExplanation = Array.isArray(aiRes?.draft?.explanation)
            ? aiRes.draft.explanation.map((x: unknown) =>
                stripMarkdown(String(x)),
              )
            : [];
        } catch {
          aiMilestones = null;
        }

        if (aiMilestones) {
          const targetCount = requestedMilestoneCount
            ? Math.min(12, Math.max(1, requestedMilestoneCount))
            : aiMilestones.length;
          const normalizedAiMilestones =
            aiMilestones.length === targetCount
              ? aiMilestones
              : aiMilestones.length > targetCount
                ? aiMilestones.slice(0, targetCount)
                : [
                    ...aiMilestones,
                    ...Array.from(
                      { length: targetCount - aiMilestones.length },
                      (_, padIdx) => ({
                        title: `Milestone ${aiMilestones.length + padIdx + 1}`,
                        description:
                          "This milestone is added to match your requested milestone count.",
                      }),
                    ),
                  ];
          const durationPlan = splitDurationIntoMilestones(
            timelineDays,
            normalizedAiMilestones.length,
          );
          const clientBidAmount = Number(
            proposalData.bidAmountProject || proposalData.bidAmount || 0,
          );
          const clientAmountPlan = splitClientAmountsForAi(
            clientBidAmount,
            normalizedAiMilestones.length,
          );
          const generatedMilestones: ProposalMilestone[] =
            normalizedAiMilestones.map((m, idx) => {
              const projectAmountStr = clientAmountPlan[idx] || "0";
              const preferredAmount =
                project.preferredCurrencyCode !== project.projectCurrencyCode
                  ? Number(
                      syncBidPreferredStringFromProject(
                        projectAmountStr,
                        project.preferredCurrencyCode,
                        project.projectCurrencyCode,
                        project.fxSnapshotRatesJson,
                      ),
                    )
                  : Number(projectAmountStr);
              const amount =
                Number.isFinite(preferredAmount) && preferredAmount >= 0
                  ? preferredAmount
                  : 0;
              return {
                sequence: idx + 1,
                title: stripMarkdown(
                  String(m?.title || `Milestone ${idx + 1}`),
                ),
                description: stripMarkdown(String(m?.description || "")),
                amount,
                amountProjectStr: projectAmountStr,
                durationAmount: durationPlan[idx]?.amount || "1",
                durationUnit: durationPlan[idx]?.unit || "week",
              };
            });

          setAiMilestoneExplanation(
            aiExplanation.length > 0
              ? aiExplanation
              : [
                  "AI generated milestones based on your profile and project context.",
                ],
          );
          setProposalData((prev) => ({
            ...prev,
            milestones: normalizeDraftSequences(generatedMilestones),
          }));
          setAiGeneratedMilestones(true);
          setProposalErrors((prev) => ({
            ...prev,
            milestones: undefined,
            milestoneFields: undefined,
          }));
          toast.success(
            "AI milestones generated from provider and project context.",
          );
          return;
        }

        const requirements = normalizeTextList(rawOpportunity.requirements);
        const deliverables = normalizeTextList(rawOpportunity.deliverables);
        const skills = normalizeTextList(rawOpportunity.skills);
        const { milestones, explanation } = generateSmartMilestones({
          processPreference,
          requestedMilestoneCount,
          project,
          bidAmount,
          timelineDays,
          requirements,
          deliverables,
          skills,
        });

        setAiMilestoneExplanation(explanation);
        const clientBidAmount = Number(
          proposalData.bidAmountProject || proposalData.bidAmount || 0,
        );
        const clientAmountPlan = splitClientAmountsForAi(
          clientBidAmount,
          milestones.length,
        );
        const generatedMilestones: ProposalMilestone[] = milestones.map(
          (m, idx) => ({
            sequence: idx + 1,
            title: m.title,
            description: m.description,
            amount: (() => {
              const projectAmountStr = clientAmountPlan[idx] || "0";
              const preferredAmount =
                project.preferredCurrencyCode !== project.projectCurrencyCode
                  ? Number(
                      syncBidPreferredStringFromProject(
                        projectAmountStr,
                        project.preferredCurrencyCode,
                        project.projectCurrencyCode,
                        project.fxSnapshotRatesJson,
                      ),
                    )
                  : Number(projectAmountStr);
              return Number.isFinite(preferredAmount) && preferredAmount >= 0
                ? preferredAmount
                : 0;
            })(),
            amountProjectStr: clientAmountPlan[idx] || "0",
            durationAmount: m.durationAmount,
            durationUnit: m.durationUnit,
          }),
        );
        setProposalData((prev) => ({
          ...prev,
          milestones: normalizeDraftSequences(generatedMilestones),
        }));
        setAiGeneratedMilestones(true);
        setProposalErrors((prev) => ({
          ...prev,
          milestones: undefined,
          milestoneFields: undefined,
        }));
        toast.success("Milestones generated and filled automatically.");
      } catch {
        setAiMilestoneError(
          "Unable to generate milestones right now. Please adjust details and retry.",
        );
      } finally {
        setAiGeneratingMilestones(false);
      }
    };
    void run();
  };

  const clearAiGeneratedMilestones = () => {
    setProposalData((prev) => ({ ...prev, milestones: [] }));
    setAiMilestoneExplanation([]);
    setAiMilestoneError(null);
    setAiGeneratedMilestones(false);
    toast.success("AI-generated milestones removed.");
  };

  const handleGenerateAiCoverLetter = () => {
    if (!project || !rawOpportunity) return;
    const run = async () => {
      try {
        setAiGeneratingCoverLetter(true);
        setAiCoverLetterError(null);
        try {
          const aiRes = await generateProviderOpportunityAiDraft(
            opportunityId,
            {
              processPreference: aiMilestonePrompt,
              bidAmount: proposalData.bidAmount,
              timelineAmount: proposalData.timelineAmount,
              timelineUnit: proposalData.timelineUnit,
            },
          );
          const aiCover = stripMarkdown(
            String(aiRes?.draft?.coverLetter || ""),
          );
          if (aiCover) {
            setProposalData((prev) => ({ ...prev, coverLetter: aiCover }));
            setProposalErrors((prev) => ({ ...prev, coverLetter: undefined }));
            toast.success(
              "AI cover letter generated from your profile and project context.",
            );
            return;
          }
        } catch {
          // Fall through to local fallback generation below
        }
        const coverLetter = generateCoverLetterFromContext({
          providerProfile,
          rawOpportunity,
          project,
          bidAmount: proposalData.bidAmount,
          timelineAmount: proposalData.timelineAmount,
          timelineUnit: proposalData.timelineUnit,
        });
        setProposalData((prev) => ({ ...prev, coverLetter }));
        setProposalErrors((prev) => ({ ...prev, coverLetter: undefined }));
        toast.success(
          "AI cover letter generated. You can edit it before submitting.",
        );
      } catch {
        setAiCoverLetterError("Unable to generate cover letter right now.");
      } finally {
        setAiGeneratingCoverLetter(false);
      }
    };
    void run();
  };

  const loadOpportunity = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProviderOpportunityById(opportunityId);
      if (response.success && response.opportunity) {
        const o = response.opportunity as Record<string, unknown>;
        setRawOpportunity(o);
        const ctx = mapApiToProjectContext(o);
        setProject(ctx);
        if ((o.hasProposed as boolean) === true) {
          return;
        }
        const min = o.displayBudgetMin ?? o.budgetMin;
        const bidAmount = String(min ?? "");
        const bidAmountProject =
          ctx.preferredCurrencyCode !== ctx.projectCurrencyCode
            ? syncBidProjectStringFromPreferred(
                bidAmount,
                ctx.preferredCurrencyCode,
                ctx.projectCurrencyCode,
                ctx.fxSnapshotRatesJson,
              )
            : bidAmount;
        setProposalData({
          coverLetter: "",
          bidAmount,
          bidAmountProject,
          timelineAmount: "",
          timelineUnit: "",
          milestones: [],
          attachments: [],
        });
        setProposalErrors({});
        setFormValidationMessages([]);
        setLiveValidationActive(false);
      } else {
        setError(
          getUserFriendlyErrorMessage(undefined, "provider opportunity detail"),
        );
      }
    } catch (err: unknown) {
      const apiErr = err as {
        status?: number;
        code?: string;
        projectId?: string;
      };

      if (
        apiErr?.code === "OPPORTUNITY_MOVED_TO_PROJECT" &&
        typeof apiErr.projectId === "string"
      ) {
        router.replace(`/provider/projects/${apiErr.projectId}`);
        return;
      }

      if (apiErr?.code === "OPPORTUNITY_MOVED_TO_PROJECT") {
        setError(t("provider.opportunities.detail.redirectProjectMissing"));
        return;
      }

      if (apiErr?.code === "OPPORTUNITY_NO_LONGER_AVAILABLE") {
        setError(t("provider.opportunities.detail.opportunityFilled"));
        return;
      }

      if (apiErr?.status === 403) {
        setError(t("provider.opportunities.detail.permissionDenied"));
        return;
      }

      if (apiErr?.status === 404) {
        setError(t("provider.opportunities.detail.notFound"));
        return;
      }

      setError(getUserFriendlyErrorMessage(err, "provider opportunity detail"));
    } finally {
      setLoading(false);
    }
  }, [opportunityId, router, t]);

  useEffect(() => {
    void loadOpportunity();
  }, [loadOpportunity]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getProviderProfile();
        if (cancelled) return;
        const profile =
          (res?.profile as Record<string, unknown> | undefined) ??
          (res?.data as Record<string, unknown> | undefined) ??
          (res as Record<string, unknown>);
        setProviderProfile(profile || null);
      } catch {
        if (!cancelled) setProviderProfile(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setProposalCompletionChecking(true);
      try {
        const res = await getProviderProfileCompletion();
        const data = res?.data ?? res;
        const completion =
          typeof (data as { completion?: number })?.completion === "number"
            ? (data as { completion: number }).completion
            : 0;
        if (!cancelled && completion < PROPOSAL_REQUIRED) {
          setProposalGateOpen(true);
        }
      } catch {
        if (!cancelled) setProposalGateOpen(true);
      } finally {
        if (!cancelled) setProposalCompletionChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!liveValidationActive) return;
    const { fieldErrors, messages } = validateProviderProposal(
      proposalData,
      t as (key: string, values?: Record<string, string | number>) => string,
    );
    setProposalErrors((prev) => ({
      ...fieldErrors,
      ...(prev.attachments ? { attachments: prev.attachments } : {}),
    }));
    setFormValidationMessages(messages);
  }, [proposalData, liveValidationActive, t]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);
    if (incoming.length === 0) return;

    setProposalErrors((prev) => ({ ...prev, attachments: undefined }));

    for (const file of incoming) {
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(
          t("provider.opportunities.toast.fileTooLarge", { name: file.name }),
        );
        setProposalErrors((prev) => ({
          ...prev,
          attachments: t("provider.opportunities.proposal.attachmentExceeds", {
            name: file.name,
          }),
        }));
        event.target.value = "";
        return;
      }
    }

    for (const file of incoming) {
      const { valid, error } = validateFileBeforeUpload(file, "document");
      if (!valid) {
        toast.error(
          error ||
            t("provider.opportunities.toast.fileTypeNotAllowed", {
              name: file.name,
            }),
        );
        setProposalErrors((prev) => ({
          ...prev,
          attachments:
            error || t("provider.opportunities.proposal.invalidFileType"),
        }));
        event.target.value = "";
        return;
      }
    }

    setProposalData((prev) => {
      const combined = [...prev.attachments, ...incoming];
      if (combined.length > MAX_FILES) {
        const errorMsg = t("provider.opportunities.proposal.maxFiles", {
          n: MAX_FILES,
        });
        toast.error(errorMsg);
        setProposalErrors((prevErr) => ({
          ...prevErr,
          attachments: errorMsg,
        }));
        event.target.value = "";
        return prev;
      }
      return { ...prev, attachments: combined };
    });

    event.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setProposalData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const handleProposalSubmit = async () => {
    const { fieldErrors, messages } = validateProviderProposal(
      proposalData,
      t as (key: string, values?: Record<string, string | number>) => string,
    );
    setProposalErrors(fieldErrors);

    if (messages.length > 0) {
      setLiveValidationActive(true);
      setFormValidationMessages(messages);
      toast.error(messages.map((m) => `• ${m}`).join("\n"));
      return;
    }
    setLiveValidationActive(false);
    setFormValidationMessages([]);

    if (!rawOpportunity) {
      toast.error(t("provider.opportunities.toast.invalidProject"));
      return;
    }

    if (proposalData.attachments.length > MAX_FILES) {
      toast.error(t("provider.opportunities.toast.maxAttachments"));
      return;
    }
    for (const file of proposalData.attachments) {
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(
          t("provider.opportunities.toast.fileTooLarge", { name: file.name }),
        );
        return;
      }
    }

    try {
      setSubmittingProposal(true);

      const sorted = normalizeDraftSequences(proposalData.milestones);
      let cumulativeDays = 0;
      const normalized = sorted.map((m: ProposalMilestone, idx: number) => {
        const durationDays = timelineToDays(
          Number(m.durationAmount || 0),
          m.durationUnit || "",
        );
        cumulativeDays += durationDays > 0 ? durationDays : 0;
        return {
          sequence: idx + 1,
          title: (m.title || "").trim(),
          description: m.description || "",
          amount: Number(m.amount || 0),
          amountProject:
            m.amountProjectStr != null &&
            String(m.amountProjectStr).trim() !== ""
              ? Number(m.amountProjectStr)
              : Number(m.amount || 0),
          daysFromStart: cumulativeDays,
        };
      });

      const formDataToSend = new FormData();
      formDataToSend.append(
        "serviceRequestId",
        String(rawOpportunity.id ?? ""),
      );
      formDataToSend.append(
        "bidAmount",
        parseFloat(proposalData.bidAmount).toString(),
      );
      formDataToSend.append(
        "bidAmountProject",
        parseFloat(
          proposalData.bidAmountProject || proposalData.bidAmount || "0",
        ).toString(),
      );
      const { timeline, timelineInDays } = buildTimelineData(
        Number(proposalData.timelineAmount),
        proposalData.timelineUnit,
      );
      formDataToSend.append("deliveryTime", timelineInDays.toString());
      formDataToSend.append("timeline", timeline);
      formDataToSend.append("timelineInDays", timelineInDays.toString());
      formDataToSend.append("coverLetter", proposalData.coverLetter);

      normalized.forEach((row, idx) => {
        formDataToSend.append(
          `milestones[${idx}][sequence]`,
          String(row.sequence),
        );
        formDataToSend.append(`milestones[${idx}][title]`, row.title);
        formDataToSend.append(
          `milestones[${idx}][description]`,
          row.description,
        );
        formDataToSend.append(
          `milestones[${idx}][amount]`,
          row.amount != null ? String(row.amount) : "0",
        );
        formDataToSend.append(
          `milestones[${idx}][amountProject]`,
          row.amountProject != null ? String(row.amountProject) : "0",
        );
        if (row.daysFromStart != null) {
          formDataToSend.append(
            `milestones[${idx}][daysFromStart]`,
            String(row.daysFromStart),
          );
        }
      });

      proposalData.attachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      const response = await sendProposal(
        formDataToSend,
        proposalData.attachments,
      );

      if (response.success) {
        toast.success(t("provider.opportunities.toast.proposalSuccess"));
        router.push("/provider/opportunities");
      } else {
        toast.error(
          getUserFriendlyErrorMessage(
            undefined,
            "provider opportunities submit proposal",
          ),
        );
      }
    } catch (err: unknown) {
      toast.error(
        getUserFriendlyErrorMessage(
          err,
          "provider opportunities submit proposal",
        ),
      );
    } finally {
      setSubmittingProposal(false);
    }
  };

  const hasProposed = rawOpportunity?.hasProposed === true;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
        <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !project || !rawOpportunity) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl" />
        </div>
        <motion.div
          className="w-full max-w-lg relative z-10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-gray-900">
                {t("provider.opportunities.proposal.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FriendlyErrorState
                message={
                  error || t("provider.opportunities.toast.invalidProject")
                }
              />
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => router.push("/provider/opportunities")}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                {t("provider.opportunities.detail.back")}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (hasProposed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
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
          className="w-full max-w-lg relative z-10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                {t("provider.opportunities.detail.proposalSubmitted")}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {project.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full bg-blue-600 hover:bg-blue-700">
                <Link href={`/provider/opportunities/${opportunityId}`}>
                  {t("provider.opportunities.title")}
                </Link>
              </Button>
              <div className="text-center">
                <Link
                  href="/provider/opportunities"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {t("provider.opportunities.detail.back")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-4 sm:p-6">
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
          className="w-full max-w-4xl relative z-10"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="text-center mb-6">
            <Link
              href="/provider/opportunities"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              {t("provider.opportunities.detail.back")}
            </Link>
          </div>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                <Send className="w-6 h-6 text-blue-600" />
                {t("provider.opportunities.proposal.title")}
              </CardTitle>
              <CardDescription className="text-gray-600 text-base">
                {t("provider.opportunities.proposal.subtitle", {
                  title: project.title,
                })}
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-8">
              <SubmitProposalForm
                project={project}
                proposalData={proposalData}
                setProposalData={setProposalData}
                proposalErrors={proposalErrors}
                setProposalErrors={setProposalErrors}
                onAddMilestone={addProposalMilestone}
                onUpdateMilestone={updateProposalMilestone}
                onRemoveMilestone={removeProposalMilestone}
                onFileUpload={handleFileUpload}
                onRemoveAttachment={removeAttachment}
                submittingProposal={submittingProposal}
                onSubmit={handleProposalSubmit}
                onCancel={() => router.push("/provider/opportunities")}
                footerValidationMessages={formValidationMessages}
                aiMilestonePrompt={aiMilestonePrompt}
                setAiMilestonePrompt={setAiMilestonePrompt}
                onGenerateAiMilestones={handleGenerateAiMilestones}
                aiGeneratingMilestones={aiGeneratingMilestones}
                aiMilestoneError={aiMilestoneError}
                aiMilestoneExplanation={aiMilestoneExplanation}
                aiGeneratedMilestones={aiGeneratedMilestones}
                onClearAiMilestones={clearAiGeneratedMilestones}
                onGenerateAiCoverLetter={handleGenerateAiCoverLetter}
                aiGeneratingCoverLetter={aiGeneratingCoverLetter}
                aiCoverLetterError={aiCoverLetterError}
              />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <ProfileCompletionGateModal
        open={proposalGateOpen}
        onOpenChange={setProposalGateOpen}
        requiredPercent={PROPOSAL_REQUIRED}
        actionLabel={t("provider.opportunities.gate.submitProposals")}
      />
    </>
  );
}
