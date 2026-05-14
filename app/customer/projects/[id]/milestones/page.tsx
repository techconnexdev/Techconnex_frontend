"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CustomerProjectMilestonesEditorForm,
  type MilestoneFieldErrors,
} from "@/components/customer/CustomerProjectMilestonesEditorForm";
import {
  getProjectById,
  getCompanyProjectMilestones,
  updateCompanyProjectMilestones,
  approveCompanyMilestones,
  type Milestone,
} from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { formatDurationDays, timelineToDays } from "@/lib/timeline-utils";
import { useI18n } from "@/contexts/I18nProvider";
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

export default function CustomerEditProjectMilestonesPage() {
  const params = useParams();
  const router = useRouter();
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

  const currency: string =
    typeof project?.displayCurrencyCode === "string"
      ? (project.displayCurrencyCode as string)
      : typeof project?.currencyCode === "string"
        ? (project.currencyCode as string)
        : "MYR";

  const milestoneMatchSummary = useMemo(() => {
    const p = project as Record<string, unknown> | null;
    const { bidAmount: bidAmountNum, deliveryTimeDays } = projectTargets(p);
    const sumMilestones = projectMilestones.reduce((sum, m) => {
      const val = Number(m.amount);
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
    const bidMatch = bidAmountNum > 0 && sumMilestones === bidAmountNum;
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
  }, [project, projectMilestones]);

  /** Same rules as handleSave — Save stays disabled until this is true */
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
      const amt = Number(m.amount);
      if (!Number.isFinite(amt) || amt < MIN_MONETARY_AMOUNT) return false;
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
          durationAmount: "",
          durationUnit: "" as "day" | "week" | "month" | "",
        } as Milestone & { durationAmount?: string; durationUnit?: string },
      ]),
    );
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

  const reloadMilestones = useCallback(async (forProjectId?: string) => {
    const pid = forProjectId ?? projectId;
    const milestoneData = await getCompanyProjectMilestones(pid);
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
    setProjectMilestones(withDuration);
    setOriginalProjectMilestones(JSON.parse(JSON.stringify(withDuration)));
    setMilestoneApprovalState({
      milestonesLocked: milestoneData.milestonesLocked,
      companyApproved: milestoneData.companyApproved,
      providerApproved: milestoneData.providerApproved,
      milestonesApprovedAt: milestoneData.milestonesApprovedAt,
    });
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getProjectById(projectId);
        if (!res?.success || !res.project) {
          setError(t("customer.projects.detail.notFound"));
          return;
        }
        if (cancelled) return;
        const p = res.project as Record<string, unknown>;
        setProject(p);
        if (p.type !== "Project") {
          setError(t("customer.projects.milestones.page.projectsOnly"));
          return;
        }
        const canonicalId = String(p.id ?? projectId);
        if (canonicalId && canonicalId !== projectId) {
          router.replace(`/customer/projects/${canonicalId}/milestones`);
        }
        await reloadMilestones(canonicalId);
      } catch (e) {
        if (!cancelled) {
          setError(
            getUserFriendlyErrorMessage(e, "customer project milestones load"),
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, reloadMilestones, router, t]);

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
          "customer.projects.detail.validation.titleRequired",
        );
        hasErrors = true;
      }
      if (!m.description || !m.description.trim()) {
        milestoneErrorsOne.description = t(
          "customer.projects.detail.validation.descriptionRequired",
        );
        hasErrors = true;
      }
      const durAmount =
        mm.durationAmount != null ? String(mm.durationAmount).trim() : "";
      const durUnit = mm.durationUnit || "";
      if (!durAmount || Number(durAmount) <= 0) {
        milestoneErrorsOne.durationAmount = t(
          "customer.projects.detail.validation.durationAmount",
        );
        hasErrors = true;
      }
      if (!durUnit) {
        milestoneErrorsOne.durationUnit = t(
          "customer.projects.detail.validation.unitRequired",
        );
        hasErrors = true;
      }
      const amt = Number(m.amount);
      if (!Number.isFinite(amt) || amt < MIN_MONETARY_AMOUNT) {
        milestoneErrorsOne.amount = t("provider.opportunities.validation.amountMin", {
          min: MIN_MONETARY_AMOUNT,
        });
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
        const val = Number(m.amount);
        if (!isNaN(val)) return sum + val;
        return sum;
      }, 0);

      if (sumMilestones !== bidAmount) {
        const msg = t("customer.projects.detail.validation.sumMismatch", {
          sumCurrency: currency,
          sum: sumMilestones.toLocaleString(),
          bidCurrency: currency,
          bid: bidAmount.toLocaleString(),
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
      toast.error(t("customer.projects.milestones.edit.saveValidationToast"));
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
          amount: Number(m.amount),
          daysFromStart: cum,
        };
      });
      await updateCompanyProjectMilestones(project.id as string, payload);
      await reloadMilestones(String(project.id));
      toast.success(
        t("customer.projects.detail.toast.milestonesUpdatedDesc"),
      );
    } catch (e) {
      toast.error(
        getUserFriendlyErrorMessage(
          e,
          "customer project detail save milestones",
        ),
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
      const res = await approveCompanyMilestones(project.id as string);
      setMilestoneApprovalState({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });
      await reloadMilestones(String(project.id));
      setFinalizeShown(true);
      toast.success(
        res.milestonesLocked
          ? t("customer.projects.detail.toast.milestonesApprovedLockedDesc")
          : t("customer.projects.detail.toast.milestonesApprovedWaitingDesc"),
      );
    } catch (e) {
      toast.error(
        getUserFriendlyErrorMessage(
          e,
          "customer project detail approve milestones",
        ),
      );
    } finally {
      setApprovingMilestones(false);
    }
  };

  const backHref = `/customer/projects/${projectId}?tab=milestones`;

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
                {t("customer.projects.detail.errorTitle")}
              </CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="bg-transparent">
                <Link href={backHref}>
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  {t("customer.projects.milestones.page.backToProject")}
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
                  {t("customer.projects.milestones.page.lockedTitle")}
                </CardTitle>
                <CardDescription>
                  {t("customer.projects.milestones.page.lockedDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  asChild
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Link href={backHref}>
                    {t("customer.projects.milestones.page.backToProject")}
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
              {t("customer.projects.milestones.page.backToProject")}
            </Link>
          </div>

          {finalizeShown ? (
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  {t("customer.projects.detail.milestonesFinalized.title")}
                </CardTitle>
                <CardDescription>
                  {t("customer.projects.detail.milestonesFinalized.desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {t(
                        "customer.projects.detail.milestonesFinalized.companyTitle",
                      )}
                    </div>
                    <div>
                      {milestoneApprovalState.companyApproved
                        ? t(
                            "customer.projects.detail.milestonesFinalized.companyYes",
                          )
                        : t(
                            "customer.projects.detail.milestonesFinalized.companyNo",
                          )}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle
                    className={`w-5 h-5 shrink-0 mt-0.5 ${
                      milestoneApprovalState.providerApproved
                        ? "text-green-600"
                        : "text-gray-400"
                    }`}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">
                      {t(
                        "customer.projects.detail.milestonesFinalized.providerTitle",
                      )}
                    </div>
                    <div>
                      {milestoneApprovalState.providerApproved
                        ? t(
                            "customer.projects.detail.milestonesFinalized.providerYes",
                          )
                        : t(
                            "customer.projects.detail.milestonesFinalized.providerNo",
                          )}
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
                      {t(
                        "customer.projects.detail.milestonesFinalized.lockedTitle",
                      )}
                    </div>
                    <div>
                      {milestoneApprovalState.milestonesLocked
                        ? t(
                            "customer.projects.detail.milestonesFinalized.lockedYes",
                          )
                        : t(
                            "customer.projects.detail.milestonesFinalized.lockedNo",
                          )}
                    </div>
                    {milestoneApprovalState.milestonesApprovedAt && (
                      <div className="text-xs text-gray-500 mt-1">
                        {t(
                          "customer.projects.detail.milestonesFinalized.lockedAt",
                        )}{" "}
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
                    {t("customer.projects.detail.milestonesFinalized.done")}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="text-center sm:text-left">
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {t("customer.projects.detail.milestonesModal.title")}
                </CardTitle>
                <CardDescription className="text-base text-gray-600">
                  {String(
                    project.title ??
                      t("customer.projects.milestones.page.defaultTitle"),
                  )}{" "}
                  ·{" "}
                  {t("customer.projects.detail.milestonesModal.statusLine", {
                    company: milestoneApprovalState.companyApproved
                      ? "✓"
                      : "✗",
                    provider: milestoneApprovalState.providerApproved
                      ? "✓"
                      : "✗",
                    locked: milestoneApprovalState.milestonesLocked
                      ? ` · ${t("customer.projects.detail.milestones.locked")}`
                      : "",
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-8">
                <div className="mb-4 rounded-xl border border-gray-200/80 bg-white/60 p-4 text-sm text-gray-800">
                  <div className="font-medium">
                    {t("customer.projects.milestones.edit.agreedBid", {
                      amount: formatCurrencyAmount(
                        milestoneMatchSummary.bidAmountNum || 0,
                        currency,
                      ),
                    })}
                  </div>
                  <div className="mt-1 text-gray-700">
                    {t("customer.projects.milestones.edit.agreedDelivery", {
                      duration: formatDurationDays(
                        milestoneMatchSummary.deliveryTimeDays || 0,
                      ),
                    })}
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
                  summaryBelowMilestones={
                    projectMilestones.length > 0 ? (
                      <div className="rounded-lg border border-gray-200/80 bg-white/50 p-3 text-sm space-y-3">
                        <div className="flex justify-between flex-wrap gap-2">
                          <div>
                            <div className="font-medium">
                              {t(
                                "provider.opportunities.proposal.milestonesTotal",
                                {
                                  sum: formatCurrencyAmount(
                                    milestoneMatchSummary.sumMilestones || 0,
                                    currency,
                                  ),
                                },
                              )}
                            </div>
                            <div>
                              {t(
                                "provider.opportunities.proposal.yourBidLine",
                                {
                                  amount: formatCurrencyAmount(
                                    milestoneMatchSummary.bidAmountNum || 0,
                                    currency,
                                  ),
                                },
                              )}
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
                              : t(
                                  "provider.opportunities.proposal.bidMatchBad",
                                )}
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
                              : t(
                                  "provider.opportunities.proposal.timeMatchBad",
                                )}
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
