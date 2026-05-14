"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast, useToast } from "@/components/ui/use-toast";
import {
  MessageSquare,
  DollarSign,
  User,
  MapPin,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Paperclip,
  Download,
  FileText,
  Eye,
  X,
} from "lucide-react";
import {
  getProviderProjectById,
  updateProviderMilestoneStatus,
  getProviderProjectMilestones,
  approveProviderMilestones,
  createDispute,
  getDisputesByProject,
  updateDispute,
  getProfileImageUrl,
  getAttachmentUrl,
  getR2DownloadUrl,
  type Milestone,
} from "@/lib/api";
import {
  formatTimeline,
  formatDurationDays,
} from "@/lib/timeline-utils";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import { Separator } from "@/components/separator";
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { convertWithSnapshot, type FxRatesMap } from "@/lib/fx-snapshot";
import { ProviderProjectReviewInline } from "@/components/provider/projects/ProviderProjectReviewInline";

type ProjectCustomer = {
  id: string;
  name: string;
  email?: string;
  customerProfile?: {
    profileImageUrl?: string;
    industry?: string;
    location?: string;
    website?: string;
  };
};

type ProjectProposal = {
  id: string;
  attachmentUrls?: string[];
  createdAt?: string;
  submittedAt?: string;
  deliveryTime?: number;
};

type ProjectData = {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  displayBudgetMin?: number;
  displayBudgetMax?: number;
  /** Customer / project request budget in project currency */
  originalBudgetMin?: number;
  originalBudgetMax?: number;
  originalCurrencyCode?: string;
  currencyCode?: string;
  displayCurrencyCode?: string;
  fxSnapshotRatesJson?: FxRatesMap;
  approvedPrice?: number;
  progress?: number;
  completedMilestones?: number;
  totalMilestones?: number;
  skills?: string[];
  requirements?: string | string[];
  deliverables?: string | string[];
  milestones?: Milestone[];
  bids?: unknown[];
  files?: unknown[];
  messages?: unknown[];
  customer?: ProjectCustomer;
  customerId?: string;
  provider?: { id: string; name: string };
  providerId?: string;
  createdAt: string;
  originalTimeline?: string | null;
  providerProposedTimeline?: number | null;
  proposal?: ProjectProposal;
  Proposal?: ProjectProposal;
};

type DisputeData = {
  id: string;
  status: string;
  reason: string;
  description: string;
  contestedAmount?: number;
  suggestedResolution?: string;
  attachments?: string[];
  milestone?: { title: string; amount: number };
  raisedBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  resolutionNotes?: Array<{
    note: string;
    adminName?: string;
    createdAt: string;
  }>;
};

type UserData = {
  id: string;
  name?: string;
  email?: string;
};

type MessageData = {
  id: string;
  content?: string;
  message?: string;
  senderId?: string;
  sender?: { id: string; name: string };
  senderName?: string;
  createdAt?: string;
  timestamp?: string;
  attachments?: string[];
};

/** Milestone statuses that cannot be linked to a dispute (picker + submit validation). */
const DISPUTE_MILESTONE_EXCLUDED_STATUSES = new Set([
  "LOCKED",
  "DRAFT",
  "PAID",
  "DISBUTED",
  "APPROVED",
]);

export default function ProviderProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast: toastHook } = useToast();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null,
  );
  const [milestoneDeliverables, setMilestoneDeliverables] = useState("");
  const [submitDeliverables, setSubmitDeliverables] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionAttachment, setSubmissionAttachment] = useState<File | null>(
    null,
  );
  const [updating, setUpdating] = useState(false);

  // Project milestone management
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [approvingMilestones, setApprovingMilestones] = useState(false);
  const [milestoneApprovalState, setMilestoneApprovalState] = useState({
    milestonesLocked: false,
    companyApproved: false,
    providerApproved: false,
    milestonesApprovedAt: null as string | null,
  });
  const [milestoneFinalizeOpen, setMilestoneFinalizeOpen] = useState(false);

  // Dispute creation state
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [viewDisputeDialogOpen, setViewDisputeDialogOpen] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<DisputeData | null>(
    null,
  );
  const [projectDisputes, setProjectDisputes] = useState<DisputeData[]>([]);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeSuggestedResolution, setDisputeSuggestedResolution] =
    useState("");
  const [disputeAttachments, setDisputeAttachments] = useState<File[]>([]);
  const [selectedMilestoneForDispute, setSelectedMilestoneForDispute] =
    useState<string | null>(null);
  const [projectLevelDisputeAck, setProjectLevelDisputeAck] = useState(false);
  const [creatingDispute, setCreatingDispute] = useState(false);
  const [updatingDispute, setUpdatingDispute] = useState(false);
  const [disputeAdditionalNotes, setDisputeAdditionalNotes] = useState("");
  const [disputeUpdateAttachments, setDisputeUpdateAttachments] = useState<
    File[]
  >([]);
  const [projectMessages, setProjectMessages] = useState<MessageData[]>([]);
  const [token, setToken] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const searchParams = useSearchParams();
  const { t } = useI18n();

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "overview" ||
      tab === "milestones" ||
      tab === "files" ||
      tab === "messages"
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const activeDispute = useMemo(
    () =>
      projectDisputes.find(
        (d) => d.status !== "CLOSED" && d.status !== "RESOLVED",
      ) ?? null,
    [projectDisputes],
  );

  /** Hide when project completed (e.g. admin refund-to-company) or an open dispute exists. */
  const canReportNewDispute = useMemo(() => {
    if (!project) return false;
    if (String(project.status ?? "").toUpperCase() === "COMPLETED")
      return false;
    if (activeDispute) return false;
    return true;
  }, [project, activeDispute]);

  useEffect(() => {
    if (!canReportNewDispute && disputeDialogOpen) setDisputeDialogOpen(false);
  }, [canReportNewDispute, disputeDialogOpen]);

  /** Matches selected milestone amount, or 0 for project-level / no milestone. */
  const reportDisputeContestedAmount = useMemo(() => {
    if (!selectedMilestoneForDispute) return 0;
    const m = projectMilestones.find(
      (x) => x.id === selectedMilestoneForDispute,
    );
    if (!m) return 0;
    const n = Number(m.amount);
    return Number.isFinite(n) ? n : 0;
  }, [selectedMilestoneForDispute, projectMilestones]);

  const loadProjectDisputes = useCallback(async (projectId: string) => {
    try {
      const res = await getDisputesByProject(projectId);
      const list =
        res.success && Array.isArray(res.data)
          ? (res.data as DisputeData[])
          : [];
      setProjectDisputes(list);
      return list;
    } catch {
      setProjectDisputes([]);
      return [];
    }
  }, []);

  // Load auth from localStorage on mount
  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
    const user = localStorage.getItem("user");
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProviderProjectById(params.id as string);

        if (response.success) {
          setProject(response.project);

          await loadProjectDisputes(response.project.id);
        } else {
          setError(t("provider.projects.detail.fetchFailed"));
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(
          err instanceof Error
            ? err.message
            : t("provider.projects.detail.fetchFailedGeneric"),
        );
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProject();
    }
  }, [params.id, t]);

  // Load project milestones
  useEffect(() => {
    (async () => {
      if (!project?.id) return;
      try {
        const milestoneData = await getProviderProjectMilestones(project.id);
        const raw = Array.isArray(milestoneData.milestones)
          ? milestoneData.milestones.map(
              (m) =>
                ({
                  ...m,
                  sequence:
                    (m as Milestone & { order?: number }).order ??
                    (m as Milestone).sequence ??
                    0,
                  submissionAttachmentUrl: (m as Milestone)
                    .submissionAttachmentUrl,
                  submissionNote: (m as Milestone).submissionNote,
                  submittedAt: (m as Milestone).submittedAt,
                  startDeliverables: (m as Milestone).startDeliverables,
                  submitDeliverables: (m as Milestone).submitDeliverables,
                  revisionNumber: (m as Milestone).revisionNumber,
                  submissionHistory: (m as Milestone).submissionHistory,
                }) as Milestone,
            )
          : [];
        const sorted = [...raw].sort(
          (a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0),
        );
        const withDuration = sorted.map((m, i) => {
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
        setProjectMilestones(withDuration);
        setMilestoneApprovalState({
          milestonesLocked: milestoneData.milestonesLocked,
          companyApproved: milestoneData.companyApproved,
          providerApproved: milestoneData.providerApproved,
          milestonesApprovedAt: milestoneData.milestonesApprovedAt,
        });
      } catch (e) {
        console.warn("Failed to load project milestones:", e);
      }
    })();
  }, [project?.id]);

  // Fetch messages between the two project participants when Messages tab is opened
  const fetchProjectMessages = async () => {
    if (!token || !project) return;
    try {
      const currentUserId = currentUser?.id;
      const providerId = project.providerId || project.provider?.id;
      const customerId = project.customerId || project.customer?.id;
      const otherUserId =
        String(currentUserId) === String(providerId) ? customerId : providerId;
      if (!otherUserId) return;

      const url = `${
        process.env.NEXT_PUBLIC_API_URL || ""
      }/messages?otherUserId=${otherUserId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.success) {
        setProjectMessages(Array.isArray(data.data) ? data.data : []);
      } else {
        console.warn("No project messages fetched:", data?.message);
        setProjectMessages([]);
      }
    } catch (err) {
      console.error("Error fetching project messages:", err);
      setProjectMessages([]);
    }
  };

  useEffect(() => {
    if (activeTab === "messages") {
      fetchProjectMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token, project]);

  // Approve project milestones
  const handleApproveProjectMilestones = async () => {
    if (!project?.id) return;
    if (approvingMilestones) return;
    try {
      setApprovingMilestones(true);
      const res = await approveProviderMilestones(project.id);
      setMilestoneApprovalState({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      // Refresh project data to get updated milestones
      await refreshProjectData();

      // Toast feedback
      toast({
        title: t("provider.projects.toast.milestonesApprovedTitle"),
        description: res.milestonesLocked
          ? t("provider.projects.toast.milestonesLockedWork")
          : t("provider.projects.toast.waitingCompanyApprove"),
      });

      // Open the finalize/summary dialog
      setMilestoneFinalizeOpen(true);
    } catch (e) {
      toast({
        title: t("provider.projects.toast.approvalFailed"),
        description:
          e instanceof Error
            ? e.message
            : t("provider.projects.toast.couldNotApprove"),
        variant: "destructive",
      });
    } finally {
      setApprovingMilestones(false);
    }
  };

  // Function to refresh all project data
  const refreshProjectData = async () => {
    if (!params.id) return;
    try {
      // Refresh project data
      const projectResponse = await getProviderProjectById(params.id as string);
      if (projectResponse.success) {
        setProject(projectResponse.project);
      }

      // Refresh milestones
      const milestoneData = await getProviderProjectMilestones(
        params.id as string,
      );
      if (milestoneData.milestones) {
        const loadedMilestones = Array.isArray(milestoneData.milestones)
          ? milestoneData.milestones.map(
              (m) =>
                ({
                  ...m,
                  sequence:
                    (m as Milestone & { order?: number }).order ??
                    (m as Milestone).sequence ??
                    0,
                  submissionAttachmentUrl: (m as Milestone)
                    .submissionAttachmentUrl,
                  submissionNote: (m as Milestone).submissionNote,
                  submittedAt: (m as Milestone).submittedAt,
                  startDeliverables: (m as Milestone).startDeliverables,
                  submitDeliverables: (m as Milestone).submitDeliverables,
                  revisionNumber: (m as Milestone).revisionNumber,
                  submissionHistory: (m as Milestone).submissionHistory,
                }) as Milestone,
            )
          : [];
        const sorted = [...loadedMilestones].sort(
          (a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0),
        );
        const withDuration = sorted.map((m, i) => {
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
        setProjectMilestones(withDuration);
        setMilestoneApprovalState({
          milestonesLocked: milestoneData.milestonesLocked,
          companyApproved: milestoneData.companyApproved,
          providerApproved: milestoneData.providerApproved,
          milestonesApprovedAt: milestoneData.milestonesApprovedAt,
        });
      }

      await loadProjectDisputes(params.id as string);
    } catch (err) {
      console.error("Error refreshing project data:", err);
    }
  };
  // Ensure a value is an array before mapping
  const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);

  // Helper functions for file handling
  const isImage = (file: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
  const isPDF = (file: string) => /\.pdf$/i.test(file);

  const getFullUrl = (path: string) => {
    const normalized = path.replace(/\\/g, "/");
    return normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        }/${normalized.replace(/^\//, "")}`;
  };

  const handleMilestoneUpdate = async (status: string) => {
    try {
      setUpdating(true);
      // Determine which deliverables to use based on status transition
      let deliverables = undefined;
      if (status === "IN_PROGRESS" && selectedMilestone?.status === "LOCKED") {
        // Starting work - use milestoneDeliverables (start deliverables)
        deliverables = milestoneDeliverables
          ? { description: milestoneDeliverables }
          : undefined;
      } else if (
        status === "SUBMITTED" &&
        selectedMilestone?.status === "IN_PROGRESS"
      ) {
        // Submitting work - use submitDeliverables
        deliverables = submitDeliverables
          ? { description: submitDeliverables }
          : undefined;
      } else {
        // Fallback to milestoneDeliverables for other cases
        deliverables = milestoneDeliverables
          ? { description: milestoneDeliverables }
          : undefined;
      }

      if (!selectedMilestone?.id) {
        toast({
          title: t("provider.projects.toast.error"),
          description: t("provider.projects.toast.milestoneMissing"),
          variant: "destructive",
        });
        return;
      }

      const response = await updateProviderMilestoneStatus(
        selectedMilestone.id,
        status,
        deliverables,
        submissionNote || undefined,
        submissionAttachment || undefined,
      );

      if (response.success) {
        // Refresh all project data including milestones
        await refreshProjectData();

        toast({
          title: t("provider.projects.toast.success"),
          description: t("provider.projects.toast.milestoneUpdated"),
        });
        setIsMilestoneDialogOpen(false);
        setSelectedMilestone(null);
        setMilestoneDeliverables("");
        setSubmitDeliverables("");
        setSubmissionNote("");
        setSubmissionAttachment(null);
      }
    } catch (err) {
      toast({
        title: t("provider.projects.toast.error"),
        description:
          err instanceof Error
            ? err.message
            : t("provider.projects.toast.milestoneUpdateFailed"),
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle dispute creation/update
  const handleCreateDispute = async () => {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      toast({
        title: t("provider.projects.toast.validationError"),
        description: t("provider.projects.toast.disputeReasonRequired"),
        variant: "destructive",
      });
      return;
    }

    if (!project?.id) {
      toast({
        title: t("provider.projects.toast.error"),
        description: t("provider.projects.toast.projectIdMissing"),
        variant: "destructive",
      });
      return;
    }

    const milestoneCount = projectMilestones?.length ?? 0;
    let milestoneIdPayload: string | undefined;
    if (milestoneCount > 0) {
      if (paidMilestonesForDispute.length > 0) {
        if (!selectedMilestoneForDispute) {
          toast({
            title: t("provider.projects.toast.validationError"),
            description: t(
              "provider.projects.toast.disputeSelectPaidMilestone",
            ),
            variant: "destructive",
          });
          return;
        }
        const selectedMilestone = projectMilestones.find(
          (m: Milestone) => m.id === selectedMilestoneForDispute,
        );
        if (
          !selectedMilestone ||
          !selectedMilestone.status ||
          DISPUTE_MILESTONE_EXCLUDED_STATUSES.has(selectedMilestone.status)
        ) {
          toast({
            title: t("provider.projects.toast.validationError"),
            description: t(
              "provider.projects.toast.disputeInvalidPaidMilestone",
            ),
            variant: "destructive",
          });
          return;
        }
        milestoneIdPayload = selectedMilestoneForDispute;
      } else {
        if (!projectLevelDisputeAck) {
          toast({
            title: t("provider.projects.toast.validationError"),
            description: t(
              "provider.projects.toast.disputeProjectLevelAckRequired",
            ),
            variant: "destructive",
          });
          return;
        }
        milestoneIdPayload = undefined;
      }
    }

    const wasUpdatingExisting = Boolean(activeDispute);

    try {
      setCreatingDispute(true);
      await createDispute({
        projectId: project.id,
        milestoneId: milestoneIdPayload,
        reason: disputeReason.trim(),
        description: disputeDescription.trim(),
        contestedAmount: reportDisputeContestedAmount,
        suggestedResolution: disputeSuggestedResolution.trim() || undefined,
        attachments:
          disputeAttachments.length > 0 ? disputeAttachments : undefined,
      });

      toast({
        title: wasUpdatingExisting
          ? t("provider.projects.toast.disputeUpdatedTitle")
          : t("provider.projects.toast.disputeCreatedTitle"),
        description: wasUpdatingExisting
          ? t("provider.projects.toast.disputeUpdatedDesc")
          : t("provider.projects.toast.disputeCreatedDesc"),
      });

      // Refresh all project data including dispute and milestones
      await refreshProjectData();

      // Reset form
      setDisputeDialogOpen(false);
      setDisputeReason("");
      setDisputeDescription("");
      setDisputeSuggestedResolution("");
      setDisputeAttachments([]);
      setSelectedMilestoneForDispute(null);
      setProjectLevelDisputeAck(false);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("provider.projects.toast.disputeCreateFailed");
      toast({
        title: t("provider.projects.toast.error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreatingDispute(false);
    }
  };

  const handleViewDispute = async () => {
    if (!project?.id) return;
    try {
      const list = await loadProjectDisputes(project.id);
      const pick =
        list.find((d) => d.status !== "CLOSED" && d.status !== "RESOLVED") ||
        list[0] ||
        null;
      setCurrentDispute(pick);
      setViewDisputeDialogOpen(true);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("provider.projects.toast.disputeLoadFailed");
      toast({
        title: t("provider.projects.toast.error"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdateDispute = async () => {
    if (!activeDispute?.id) return;
    if (
      !disputeAdditionalNotes.trim() &&
      disputeUpdateAttachments.length === 0
    ) {
      toast({
        title: t("provider.projects.toast.validationError"),
        description: t("provider.projects.toast.disputeUpdateNeedsContent"),
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingDispute(true);
      await updateDispute(activeDispute.id, {
        additionalNotes: disputeAdditionalNotes.trim() || undefined,
        attachments:
          disputeUpdateAttachments.length > 0
            ? disputeUpdateAttachments
            : undefined,
        projectId: project?.id,
      });

      toast({
        title: t("provider.projects.toast.disputeUpdatedTitle"),
        description: t("provider.projects.toast.disputeNoteAdded"),
      });

      // Refresh all project data including dispute
      await refreshProjectData();

      // Reset form
      setDisputeAdditionalNotes("");
      setDisputeUpdateAttachments([]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("provider.projects.toast.disputeUpdateFailed");
      toast({
        title: t("provider.projects.toast.error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdatingDispute(false);
    }
  };

  const handleDisputeAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setDisputeAttachments((prev) => [...prev, ...fileArray]);
    }
  };

  const handleDisputeUpdateAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setDisputeUpdateAttachments((prev) => [...prev, ...fileArray]);
    }
  };

  const removeDisputeAttachment = (index: number) => {
    setDisputeAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDisputeUpdateAttachment = (index: number) => {
    setDisputeUpdateAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getDisputeStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "REJECTED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "DISPUTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return t("customer.dashboard.status.completed");
      case "IN_PROGRESS":
        return t("customer.dashboard.status.inProgress");
      case "DISPUTED":
        return t("customer.dashboard.status.disputed");
      default:
        return status;
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "SUBMITTED":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "LOCKED":
        return "bg-purple-100 text-purple-800";
      case "PENDING":
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMilestoneStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return t("provider.projects.milestone.paid");
      case "APPROVED":
        return t("provider.projects.milestone.approved");
      case "SUBMITTED":
        return t("provider.projects.milestone.submitted");
      case "IN_PROGRESS":
        return t("provider.projects.milestone.inProgress");
      case "LOCKED":
        return t("provider.projects.milestone.locked");
      case "PENDING":
        return t("provider.projects.milestone.pending");
      case "DRAFT":
        return t("provider.projects.milestone.draft");
      case "REJECTED":
        return t("provider.projects.milestone.rejected");
      default:
        return status;
    }
  };

  const getDisputeStatusLabel = (status: string) => {
    const s = (status || "").toUpperCase();
    switch (s) {
      case "OPEN":
        return t("provider.projects.dispute.open");
      case "UNDER_REVIEW":
        return t("provider.projects.dispute.underReview");
      case "RESOLVED":
        return t("provider.projects.dispute.resolved");
      case "CLOSED":
        return t("provider.projects.dispute.closed");
      case "REJECTED":
        return t("provider.projects.dispute.rejected");
      default:
        return status?.replace(/_/g, " ") || "";
    }
  };

  const translateDisputeReason = (reason: string) => {
    const map: Record<string, MessageKey> = {
      "Missed deadline": "customer.projects.detail.disputeReason.missedDeadline",
      "Low quality": "customer.projects.detail.disputeReason.lowQuality",
      "Payment not released":
        "customer.projects.detail.disputeReason.paymentNotReleased",
      "Work not completed":
        "customer.projects.detail.disputeReason.workNotCompleted",
      "Communication issues":
        "customer.projects.detail.disputeReason.communicationIssues",
      "Scope change": "customer.projects.detail.disputeReason.scopeChange",
      "Other": "customer.projects.detail.disputeReason.other",
    };
    const key = map[reason];
    return key ? t(key) : reason;
  };

  const paidMilestonesForDispute = (projectMilestones ?? []).filter(
    (m: Milestone) =>
      Boolean(m.status) &&
      !DISPUTE_MILESTONE_EXCLUDED_STATUSES.has(m.status as string),
  );
  const disputeMilestoneSubmitBlocked =
    (projectMilestones?.length ?? 0) > 0 &&
    (paidMilestonesForDispute.length > 0
      ? !selectedMilestoneForDispute
      : !projectLevelDisputeAck);

  const formatCurrency = (amount: number, currencyCode: string = "MYR") => {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  /** Contract / milestone amounts are always in the project's currency */
  const projectCurrencyCode =
    project?.currencyCode || project?.originalCurrencyCode || "MYR";

  const approvedPriceDualCurrency = useMemo(() => {
    if (!project?.approvedPrice || !(project.approvedPrice > 0)) return null;
    const amount = project.approvedPrice;
    const projCode = projectCurrencyCode;
    const dispCode =
      project.displayCurrencyCode || project.currencyCode || "MYR";
    if (projCode.toUpperCase() === dispCode.toUpperCase()) {
      return { showDual: false as const, amount, projCode, dispCode };
    }
    const converted = convertWithSnapshot({
      amount,
      fromCurrencyCode: projCode,
      toCurrencyCode: dispCode,
      ratesMap: project.fxSnapshotRatesJson ?? null,
    });
    if (converted == null) {
      return { showDual: false as const, amount, projCode, dispCode };
    }
    return {
      showDual: true as const,
      amount,
      converted,
      projCode,
      dispCode,
    };
  }, [project, projectCurrencyCode]);

  /** Milestone amounts are stored in project currency; show provider (display) equivalent when different. */
  const renderMilestoneAmountProviderEquiv = useCallback(
    (amount: number) => {
      const amt = Number(amount || 0);
      const projCode = projectCurrencyCode;
      const dispCode = String(
        project?.displayCurrencyCode ||
          project?.currencyCode ||
          projCode ||
          "MYR",
      );
      if (projCode.toUpperCase() === dispCode.toUpperCase()) {
        return (
          <span className="text-xs sm:text-sm font-medium tabular-nums">
            {formatCurrency(amt, projCode)}
          </span>
        );
      }
      const converted = convertWithSnapshot({
        amount: amt,
        fromCurrencyCode: projCode,
        toCurrencyCode: dispCode,
        ratesMap: project?.fxSnapshotRatesJson ?? null,
      });
      return (
        <span className="text-xs sm:text-sm font-medium text-right tabular-nums inline-flex flex-col items-end gap-0.5">
          <span>{formatCurrency(amt, projCode)}</span>
          {converted != null && (
            <span className="text-xs text-gray-500 font-normal">
              {t("provider.projects.milestones.amountEquivPreferred", {
                amount: formatCurrency(converted, dispCode),
              })}
            </span>
          )}
        </span>
      );
    },
    [project, projectCurrencyCode, t],
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-8 w-64 sm:w-96 max-w-full" />
            <Skeleton className="h-4 w-56 sm:w-80" />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Skeleton className="h-9 w-full sm:w-36 rounded-md" />
            <Skeleton className="h-9 w-full sm:w-36 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </CardContent>
        </Card>
        <div className="text-center">
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("provider.projects.detail.loadingDesc")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px] px-4">
          <div className="text-center">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              {t("provider.projects.detail.errorTitle")}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {error || t("provider.projects.detail.notFound")}
            </p>
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="text-xs sm:text-sm"
            >
              {t("provider.projects.detail.goBack")}
            </Button>
          </div>
        </div>
      
    );
  }

  // Normalize project data to safe arrays to avoid runtime errors
  const safeProject = project ?? ({} as ProjectData);
  const messages = asArray<MessageData>(safeProject.messages);
  const currentUserId = currentUser?.id;
  const msgsToRender =
    projectMessages && projectMessages.length > 0 ? projectMessages : messages;

  const handleContact = (
    customerId?: string,
    customerName?: string,
    customerAvatar?: string,
  ) => {
    if (!customerId || !customerName) return;
    router.push(
      `/provider/messages?userId=${customerId}&name=${encodeURIComponent(
        customerName,
      )}&avatar=${encodeURIComponent(customerAvatar || "")}`,
    );
  };

  return (
    
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
              {project.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 break-words">
              {project.description}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-xs sm:text-sm"
              onClick={() =>
                handleContact(
                  project.customer?.id,
                  project.customer?.name,
                  (project.customer as { profileImageUrl?: string } | undefined)
                    ?.profileImageUrl ||
                    project.customer?.customerProfile?.profileImageUrl,
                )
              }
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {t("provider.projects.detail.messageClient")}
            </Button>
            {projectDisputes.length > 0 && (
              <Button
                variant="outline"
                className="bg-orange-50 active:bg-orange-100 sm:hover:bg-orange-100 text-orange-700 border-orange-300 w-full sm:w-auto text-xs sm:text-sm"
                onClick={handleViewDispute}
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {projectDisputes.length > 1
                  ? t("provider.projects.detail.viewDisputes")
                  : t("provider.projects.detail.viewDispute")}
              </Button>
            )}
            {canReportNewDispute && (
              <Button
                onClick={() => setDisputeDialogOpen(true)}
                disabled={creatingDispute}
                className="bg-red-600 active:bg-red-700 sm:hover:bg-red-700 text-white w-full sm:w-auto text-xs sm:text-sm"
              >
                {creatingDispute ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                )}
                {t("provider.projects.detail.reportDispute")}
              </Button>
            )}
          </div>
        </div>

        {/* Provider approval reminder - outside tabs */}
        {!milestoneApprovalState.providerApproved &&
          projectMilestones &&
          projectMilestones.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:px-4 sm:py-3.5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-900">
                  {t("provider.projects.detail.approveBanner.title")}
                </p>
                <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                  {t("provider.projects.detail.approveBanner.bodyPrefix")}{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-amber-800 underline font-semibold"
                    onClick={() => setActiveTab("milestones")}
                  >
                    {t("provider.projects.detail.tab.milestones")}
                  </Button>{" "}
                  {t("provider.projects.detail.approveBanner.bodySuffix")}
                </p>
              </div>
            </div>
          )}

        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4 sm:space-y-6"
            >
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 h-auto p-2 sm:p-3 bg-gray-100 rounded-lg">
                <TabsTrigger
                  value="overview"
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all duration-200 font-medium"
                >
                  {t("provider.projects.detail.tab.overview")}
                </TabsTrigger>
                <TabsTrigger
                  value="milestones"
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all duration-200 font-medium"
                >
                  {t("provider.projects.detail.tab.milestones")}
                </TabsTrigger>
                <TabsTrigger
                  value="files"
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all duration-200 font-medium"
                >
                  {t("provider.projects.detail.tab.files")}
                </TabsTrigger>
                <TabsTrigger
                  value="messages"
                  className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all duration-200 font-medium"
                >
                  {t("provider.projects.detail.tab.messages")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                {/* Project Details */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                      {t("provider.projects.detail.overview.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.projects.detail.label.category")}
                        </Label>
                        <p className="text-base sm:text-lg mt-1">
                          {project.category}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.projects.detail.label.status")}
                        </Label>
                        <div className="mt-1">
                          <Badge
                            className={`${getStatusColor(
                              project.status,
                            )} text-xs`}
                          >
                            {getStatusText(project.status)}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.projects.detail.label.budgetRange")}
                        </Label>
                        {(() => {
                          const origCode =
                            project.originalCurrencyCode ||
                            project.currencyCode ||
                            "MYR";
                          const dispCode =
                            project.displayCurrencyCode ||
                            project.currencyCode ||
                            "MYR";
                          const origMin =
                            project.originalBudgetMin ?? project.budgetMin;
                          const origMax =
                            project.originalBudgetMax ?? project.budgetMax;
                          const dispMin =
                            project.displayBudgetMin ?? project.budgetMin;
                          const dispMax =
                            project.displayBudgetMax ?? project.budgetMax;
                          const showDualBudget =
                            origCode.toUpperCase() !== dispCode.toUpperCase();
                          return showDualBudget ? (
                            <div className="mt-1 space-y-2 break-words">
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">
                                  {t(
                                    "provider.projects.detail.budgetRangeInYourCurrency",
                                    { currency: dispCode },
                                  )}
                                </p>
                                <p className="text-base sm:text-lg font-medium">
                                  {formatCurrency(dispMin, dispCode)} -{" "}
                                  {formatCurrency(dispMax, dispCode)}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">
                                  {t(
                                    "provider.projects.detail.budgetRangeCustomerOriginal",
                                    { currency: origCode },
                                  )}
                                </p>
                                <p className="text-base sm:text-lg">
                                  {formatCurrency(origMin, origCode)} -{" "}
                                  {formatCurrency(origMax, origCode)}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-base sm:text-lg mt-1 break-words">
                              {formatCurrency(origMin, origCode)} -{" "}
                              {formatCurrency(origMax, origCode)}
                            </p>
                          );
                        })()}
                      </div>
                      {project.approvedPrice && approvedPriceDualCurrency && (
                        <div>
                          <Label className="text-xs sm:text-sm font-medium text-gray-500">
                            {t("provider.projects.detail.label.approvedPrice")}
                          </Label>
                          {approvedPriceDualCurrency.showDual ? (
                            <div className="mt-1 space-y-2">
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">
                                  {t(
                                    "provider.projects.detail.budgetRangeInYourCurrency",
                                    {
                                      currency: approvedPriceDualCurrency.dispCode,
                                    },
                                  )}
                                </p>
                                <p className="text-base sm:text-lg font-semibold text-green-600">
                                  {formatCurrency(
                                    approvedPriceDualCurrency.converted,
                                    approvedPriceDualCurrency.dispCode,
                                  )}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">
                                  {t(
                                    "provider.projects.detail.approvedPriceInProjectCurrency",
                                    {
                                      currency: approvedPriceDualCurrency.projCode,
                                    },
                                  )}
                                </p>
                                <p className="text-base sm:text-lg font-medium text-gray-900">
                                  {formatCurrency(
                                    approvedPriceDualCurrency.amount,
                                    approvedPriceDualCurrency.projCode,
                                  )}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-base sm:text-lg font-semibold text-green-600 mt-1">
                              {formatCurrency(
                                approvedPriceDualCurrency.amount,
                                approvedPriceDualCurrency.projCode,
                              )}
                            </p>
                          )}
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.projects.detail.label.timeline")}
                        </Label>
                        <div className="space-y-2 mt-1">
                          {project.originalTimeline && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                {t(
                                  "provider.projects.detail.timeline.originalCompany",
                                )}
                              </p>
                              <p className="text-sm text-gray-900 font-medium break-words">
                                {formatTimeline(project.originalTimeline)}
                              </p>
                            </div>
                          )}
                          {project.providerProposedTimeline && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                {t(
                                  "provider.projects.detail.timeline.approved",
                                )}
                              </p>
                              <p className="text-sm text-gray-900 font-medium break-words">
                                {formatTimeline(
                                  project.providerProposedTimeline,
                                  "day",
                                )}
                              </p>
                            </div>
                          )}
                          {milestoneApprovalState.milestonesLocked &&
                            projectMilestones &&
                            projectMilestones.length > 0 &&
                            (() => {
                              const sorted = [...projectMilestones].sort(
                                (a, b) =>
                                  (a.order ?? a.sequence ?? 0) -
                                  (b.order ?? b.sequence ?? 0),
                              );
                              const last = sorted[
                                sorted.length - 1
                              ] as Milestone & { daysFromStart?: number };
                              const totalDays = last?.daysFromStart ?? 0;
                              const lastDueDate = last?.dueDate;
                              return (
                                <>
                                  {totalDays > 0 && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">
                                        {t(
                                          "provider.projects.detail.timeline.approved",
                                        )}
                                      </p>
                                      <p className="text-sm font-semibold text-green-600 break-words">
                                        {formatDurationDays(totalDays)}
                                      </p>
                                    </div>
                                  )}
                                  {lastDueDate && (
                                    <div>
                                      <p className="text-xs text-gray-500 mb-1">
                                        {t(
                                          "provider.projects.detail.timeline.dueDateProject",
                                        )}
                                      </p>
                                      <p className="text-sm font-semibold text-green-600 break-words">
                                        {formatDate(lastDueDate)}
                                      </p>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
                          {!project.originalTimeline &&
                            !project.providerProposedTimeline &&
                            !(
                              milestoneApprovalState.milestonesLocked &&
                              projectMilestones?.length
                            ) && (
                              <p className="text-sm text-gray-600">
                                {t(
                                  "provider.projects.detail.timeline.notSpecified",
                                )}
                              </p>
                            )}
                        </div>
                      </div>
                    </div>

                    {project.skills && project.skills.length > 0 && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.projects.detail.requiredSkills")}
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.skills.map(
                            (skill: string, index: number) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs"
                              >
                                {skill}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {project.requirements && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.projects.detail.requirements")}
                        </Label>
                        <div className="mt-2 space-y-3">
                          {Array.isArray(project.requirements) ? (
                            project.requirements.map(
                              (req: string | unknown, index: number) => (
                                <div key={index} className="text-gray-700">
                                  <MarkdownViewer
                                    content={
                                      typeof req === "string"
                                        ? req
                                        : String(req)
                                    }
                                    className="prose max-w-none text-gray-700"
                                    emptyMessage={""}
                                  />
                                </div>
                              ),
                            )
                          ) : (
                            <div className="text-gray-700">
                              <MarkdownViewer
                                content={String(project.requirements)}
                                className="prose max-w-none text-gray-700"
                                emptyMessage={""}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {project.deliverables && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.projects.detail.deliverables")}
                        </Label>
                        <div className="mt-2 space-y-3">
                          {Array.isArray(project.deliverables) ? (
                            project.deliverables.map(
                              (del: string | unknown, index: number) => (
                                <div key={index} className="text-gray-700">
                                  <MarkdownViewer
                                    content={
                                      typeof del === "string"
                                        ? del
                                        : String(del)
                                    }
                                    className="prose max-w-none text-gray-700"
                                    emptyMessage={""}
                                  />
                                </div>
                              ),
                            )
                          ) : (
                            <div className="text-gray-700">
                              <MarkdownViewer
                                content={String(project.deliverables)}
                                className="prose max-w-none text-gray-700"
                                emptyMessage={""}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {project.status === "COMPLETED" &&
                  (() => {
                    const reviewCustomerId =
                      project.customer?.id ?? project.customerId;
                    if (!reviewCustomerId) return null;
                    return (
                      <ProviderProjectReviewInline
                        projectId={project.id}
                        customerId={String(reviewCustomerId)}
                        customerName={project.customer?.name}
                        projectCompleted
                      />
                    );
                  })()}

                {/* Progress */}
                {project.status === "IN_PROGRESS" && (
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg sm:text-xl">
                        {t("provider.projects.detail.progressCard.title")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between text-xs sm:text-sm">
                          <span>
                            {t("provider.projects.detail.progressCard.overall")}
                          </span>
                          <span>{project.progress || 0}%</span>
                        </div>
                        <Progress
                          value={project.progress || 0}
                          className="h-2 sm:h-3"
                        />
                        <div className="flex justify-between text-xs sm:text-sm text-gray-600">
                          <span>
                            {t(
                              "provider.projects.detail.progressCard.milestonesOf",
                              {
                                completed: project.completedMilestones || 0,
                                total: project.totalMilestones || 0,
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent
                value="milestones"
                className="space-y-4 sm:space-y-6"
              >
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                      {t("provider.projects.detail.milestones.title")}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {t("provider.projects.detail.milestones.desc")}
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                      <Badge variant="outline" className="text-xs">
                        {t("provider.projects.detail.milestones.badge.company")}{" "}
                        {milestoneApprovalState.companyApproved ? "✓" : "✗"} ·{" "}
                        {t(
                          "provider.projects.detail.milestones.badge.provider",
                        )}{" "}
                        {milestoneApprovalState.providerApproved ? "✓" : "✗"}
                        {milestoneApprovalState.milestonesLocked &&
                          ` · ${t("provider.projects.detail.milestones.badge.locked")}`}
                      </Badge>
                      {milestoneApprovalState.milestonesLocked &&
                        projectMilestones &&
                        projectMilestones.length > 0 &&
                        (() => {
                          const sorted = [...projectMilestones].sort(
                            (a, b) =>
                              (a.order ?? a.sequence ?? 0) -
                              (b.order ?? b.sequence ?? 0),
                          );
                          const last = sorted[sorted.length - 1] as
                            | { daysFromStart?: number }
                            | undefined;
                          const totalDays = last?.daysFromStart ?? 0;
                          return totalDays > 0 ? (
                            <span className="text-xs sm:text-sm text-green-600 font-medium">
                              {t(
                                "provider.projects.detail.milestones.approvedTimelinePrefix",
                              )}{" "}
                              {formatDurationDays(totalDays)}
                            </span>
                          ) : null;
                        })()}
                      {!milestoneApprovalState.milestonesLocked && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm"
                            asChild
                          >
                            <Link
                              href={`/provider/projects/${params.id}/milestones`}
                            >
                              {t("provider.projects.detail.milestones.edit")}
                            </Link>
                          </Button>
                          {!milestoneApprovalState.providerApproved && (
                            <Button
                              size="sm"
                              className="inline-flex items-center gap-1.5 text-xs sm:text-sm"
                              onClick={handleApproveProjectMilestones}
                              disabled={approvingMilestones}
                            >
                              {approvingMilestones ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                  {t(
                                    "provider.projects.detail.milestones.approving",
                                  )}
                                </>
                              ) : (
                                t("provider.projects.detail.milestones.approve")
                              )}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {projectMilestones && projectMilestones.length > 0 ? (
                        projectMilestones.map(
                          (milestone: Milestone, index: number) => {
                            return (
                              <div
                                key={milestone.id}
                                className="border rounded-lg p-3 sm:p-4"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                                      {milestone.order}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h4 className="font-medium text-sm sm:text-base break-words">
                                        {milestone.title}
                                      </h4>
                                      <p className="text-xs sm:text-sm text-gray-600 break-words">
                                        {milestone.description}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                    <Badge
                                      className={`${getMilestoneStatusColor(
                                        milestone.status || "",
                                      )} text-xs shrink-0`}
                                    >
                                      {getMilestoneStatusText(
                                        milestone.status || "",
                                      )}
                                    </Badge>
                                    {renderMilestoneAmountProviderEquiv(
                                      milestone.amount,
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-xs sm:text-sm text-gray-600">
                                  <span>
                                    {(() => {
                                      const sorted = [
                                        ...(projectMilestones || []),
                                      ].sort(
                                        (a, b) =>
                                          (a.order ?? a.sequence ?? 0) -
                                          (b.order ?? b.sequence ?? 0),
                                      );
                                      const idx = sorted.findIndex(
                                        (x) => x.id === milestone.id,
                                      );
                                      if (idx < 0)
                                        return milestone.dueDate
                                          ? t(
                                              "provider.projects.detail.milestone.due",
                                              {
                                                date: formatDate(
                                                  milestone.dueDate,
                                                ),
                                              },
                                            )
                                          : t("provider.projects.list.dueDash");
                                      const prev = sorted[idx - 1] as
                                        | { daysFromStart?: number }
                                        | undefined;
                                      const currDays =
                                        (
                                          milestone as Milestone & {
                                            daysFromStart?: number;
                                          }
                                        ).daysFromStart ?? 0;
                                      const prevDays = prev?.daysFromStart ?? 0;
                                      const durationDays = currDays - prevDays;
                                      const durationStr =
                                        durationDays > 0
                                          ? t(
                                              "provider.projects.detail.milestone.duration",
                                              {
                                                value:
                                                  formatDurationDays(
                                                    durationDays,
                                                  ),
                                              },
                                            )
                                          : "";
                                      const dueStr = milestone.dueDate
                                        ? t(
                                            "provider.projects.detail.milestone.due",
                                            {
                                              date: formatDate(
                                                milestone.dueDate,
                                              ),
                                            },
                                          )
                                        : "";
                                      if (
                                        milestoneApprovalState.milestonesLocked &&
                                        dueStr
                                      ) {
                                        return [durationStr, dueStr]
                                          .filter(Boolean)
                                          .join(" · ");
                                      }
                                      return (
                                        durationStr ||
                                        dueStr ||
                                        t("provider.projects.list.dueDash")
                                      );
                                    })()}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {milestone.status === "PAID" && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="text-xs sm:text-sm font-medium">
                                          {t(
                                            "provider.projects.detail.milestone.paidLabel",
                                          )}
                                        </span>
                                      </div>
                                    )}
                                    {milestone.status === "LOCKED" &&
                                      project.status === "IN_PROGRESS" && (
                                        <div>
                                          <Button
                                            size="sm"
                                            disabled={true}
                                            className="text-xs sm:text-sm"
                                          >
                                            {t(
                                              "provider.projects.detail.milestone.startWork",
                                            )}
                                          </Button>
                                        </div>
                                      )}
                                    {milestone.status === "LOCKED" &&
                                      project?.status === "IN_PROGRESS" &&
                                      projectMilestones.findIndex(
                                        (m: Milestone) =>
                                          m.status === "LOCKED" &&
                                          project?.status === "IN_PROGRESS",
                                      ) === index && (
                                        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                                      )}
                                    {milestone.status === "IN_PROGRESS" &&
                                      project.status === "ESCROWED" && (
                                        <Button
                                          size="sm"
                                          className="text-xs sm:text-sm"
                                          onClick={() => {
                                            setSelectedMilestone(milestone);
                                            setIsMilestoneDialogOpen(true);
                                          }}
                                        >
                                          {t(
                                            "provider.projects.detail.milestone.startWork",
                                          )}
                                        </Button>
                                      )}
                                    {milestone.status === "IN_PROGRESS" && (
                                      <Button
                                        size="sm"
                                        className="text-xs sm:text-sm"
                                        onClick={() => {
                                          setSelectedMilestone(milestone);
                                          setIsMilestoneDialogOpen(true);
                                        }}
                                      >
                                        {t(
                                          "provider.projects.detail.milestone.submit",
                                        )}
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Show warning for first locked milestone that complies */}
                                {milestone.status === "LOCKED" &&
                                project?.status === "IN_PROGRESS" &&
                                projectMilestones.findIndex(
                                  (m: Milestone) =>
                                    m.status === "LOCKED" &&
                                    project?.status === "IN_PROGRESS",
                                ) === index ? (
                                  <div className="mt-3 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs sm:text-sm text-amber-800 break-words">
                                      {index > 0 &&
                                      projectMilestones[index - 1].status !==
                                        "APPROVED"
                                        ? t(
                                            "provider.projects.detail.milestone.waitPrevApproved",
                                          )
                                        : t(
                                            "provider.projects.detail.milestone.waitClientPaid",
                                          )}
                                    </p>
                                  </div>
                                ) : null}

                                {/* FIX 1: Start Deliverables */}
                                {/* Added explicit return type to IIFE */}
                                {((): React.ReactNode => {
                                  if (!milestone.startDeliverables) return null;

                                  const sd = milestone.startDeliverables;
                                  let displayText: string = "";

                                  if (typeof sd === "string") {
                                    displayText = sd;
                                  } else if (
                                    typeof sd === "object" &&
                                    sd !== null
                                  ) {
                                    const desc = (sd as Record<string, unknown>)
                                      .description;
                                    displayText =
                                      typeof desc === "string"
                                        ? desc
                                        : String(desc || "");
                                  } else {
                                    displayText = String(sd);
                                  }

                                  if (!displayText) return null;

                                  return (
                                    <div className="mt-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <p className="text-xs sm:text-sm font-medium text-green-900 mb-1">
                                        {t(
                                          "provider.projects.detail.milestoneUi.planTitle",
                                        )}
                                      </p>
                                      <p className="text-xs sm:text-sm text-green-800 whitespace-pre-wrap break-words">
                                        {displayText}
                                      </p>
                                    </div>
                                  );
                                })()}

                                {/* FIX 2: Submit Deliverables (Main Loop) */}
                                {/* Added !! to force boolean check to avoid returning 'unknown' */}
                                {!!milestone.submitDeliverables && (
                                  <div className="mt-3 p-2 sm:p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                    <p className="text-xs sm:text-sm font-medium text-purple-900 mb-1">
                                      {t(
                                        "provider.projects.detail.milestoneUi.submitDeliverablesTitle",
                                      )}
                                    </p>
                                    <p className="text-xs sm:text-sm text-purple-800 whitespace-pre-wrap break-words">
                                      {((): React.ReactNode => {
                                        const sd = milestone.submitDeliverables;
                                        let text: string = "";
                                        if (typeof sd === "string") {
                                          text = sd;
                                        } else if (
                                          typeof sd === "object" &&
                                          sd !== null &&
                                          "description" in sd
                                        ) {
                                          const desc = (
                                            sd as Record<string, unknown>
                                          ).description;
                                          text =
                                            typeof desc === "string"
                                              ? desc
                                              : String(desc || "");
                                        } else {
                                          text = String(sd || "");
                                        }
                                        return text;
                                      })()}
                                    </p>
                                  </div>
                                )}

                                {/* Show submission note if available */}
                                {/* Added !! to force boolean check */}
                                {!!milestone.submissionNote && (
                                  <div className="mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">
                                      {t(
                                        "provider.projects.detail.milestoneUi.submissionNoteTitle",
                                      )}
                                    </p>
                                    <p className="text-xs sm:text-sm text-blue-800 whitespace-pre-wrap break-words">
                                      {milestone.submissionNote}
                                    </p>
                                  </div>
                                )}

                                {/* Show latest requested changes reason if available */}
                                {milestone.submissionHistory &&
                                  Array.isArray(milestone.submissionHistory) &&
                                  milestone.submissionHistory.length > 0 &&
                                  ((): React.ReactNode => {
                                    const latestRequest = milestone
                                      .submissionHistory[
                                      milestone.submissionHistory.length - 1
                                    ] as Record<string, unknown>;
                                    if (
                                      latestRequest &&
                                      typeof latestRequest === "object" &&
                                      "requestedChangesReason" in
                                        latestRequest &&
                                      typeof latestRequest.requestedChangesReason ===
                                        "string"
                                    ) {
                                      return (
                                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                          <p className="text-sm font-medium text-orange-900 mb-1">
                                            {t(
                                              "provider.projects.detail.milestoneUi.latestChangesTitle",
                                              {
                                                n:
                                                  typeof latestRequest.revisionNumber ===
                                                  "number"
                                                    ? latestRequest.revisionNumber
                                                    : milestone.submissionHistory
                                                        .length,
                                              },
                                            )}
                                          </p>
                                          <p className="text-sm text-orange-800 whitespace-pre-wrap">
                                            {typeof latestRequest.requestedChangesReason ===
                                            "string"
                                              ? latestRequest.requestedChangesReason
                                              : ""}
                                          </p>
                                          {latestRequest.requestedChangesAt &&
                                          typeof latestRequest.requestedChangesAt ===
                                            "string" ? (
                                            <p className="text-xs text-orange-600 mt-2">
                                              {t(
                                                "provider.projects.detail.milestoneUi.requestedOn",
                                              )}{" "}
                                              {new Date(
                                                latestRequest.requestedChangesAt as string,
                                              ).toLocaleString()}
                                            </p>
                                          ) : null}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}

                                {/* Show attachment if available */}
                                {/* Added !! to force boolean check */}
                                {!!milestone.submissionAttachmentUrl && (
                                  <div className="mt-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Paperclip className="w-4 h-4 text-gray-600" />
                                      <span className="text-sm font-medium text-gray-900">
                                        {t(
                                          "provider.projects.detail.milestoneUi.submissionAttachment",
                                        )}
                                      </span>
                                    </div>
                                    {((): React.ReactNode => {
                                      const normalized =
                                        milestone.submissionAttachmentUrl!.replace(
                                          /\\/g,
                                          "/",
                                        );
                                      const fileName =
                                        normalized.split("/").pop() ||
                                        t(
                                          "provider.projects.detail.milestoneUi.attachmentFallback",
                                        );
                                      const attachmentUrl = getAttachmentUrl(
                                        milestone.submissionAttachmentUrl,
                                      );
                                      const isR2Key =
                                        attachmentUrl === "#" ||
                                        (!attachmentUrl.startsWith("http") &&
                                          !attachmentUrl.startsWith(
                                            "/uploads/",
                                          ) &&
                                          !attachmentUrl.includes(
                                            process.env.NEXT_PUBLIC_API_URL ||
                                              "localhost",
                                          ));

                                      return (
                                        <a
                                          href={attachmentUrl}
                                          download={fileName}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={
                                            isR2Key &&
                                            milestone.submissionAttachmentUrl
                                              ? async (e) => {
                                                  e.preventDefault();
                                                  try {
                                                    const downloadUrl =
                                                      await getR2DownloadUrl(
                                                        milestone.submissionAttachmentUrl as string,
                                                      );
                                                    window.open(
                                                      downloadUrl.downloadUrl,
                                                      "_blank",
                                                    );
                                                  } catch (error) {
                                                    console.error(
                                                      "Failed to get download URL:",
                                                      error,
                                                    );
                                                    toastHook({
                                                      title: t(
                                                        "provider.projects.toast.error",
                                                      ),
                                                      description: t(
                                                        "provider.projects.toast.downloadFailed",
                                                      ),
                                                      variant: "destructive",
                                                    });
                                                  }
                                                }
                                              : undefined
                                          }
                                          className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 hover:shadow-sm transition"
                                        >
                                          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                            {t(
                                              "provider.projects.detail.milestoneUi.pdfBadge",
                                            )}
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                              {fileName}
                                            </span>
                                            <span className="text-xs text-gray-500 leading-snug">
                                              {t(
                                                "provider.projects.detail.milestoneUi.clickPreviewDownload",
                                              )}
                                            </span>
                                          </div>
                                          <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                                            <Download className="w-4 h-4" />
                                          </div>
                                        </a>
                                      );
                                    })()}
                                  </div>
                                )}

                                {/* Show submission history if available */}
                                {milestone.submissionHistory &&
                                  Array.isArray(milestone.submissionHistory) &&
                                  milestone.submissionHistory.length > 0 && (
                                    <div className="mt-4 border-t pt-4">
                                      <p className="text-sm font-semibold text-gray-900 mb-3">
                                        {t(
                                          "provider.projects.detail.milestoneUi.historyTitle",
                                        )}
                                      </p>
                                      <Accordion
                                        type="single"
                                        collapsible
                                        className="w-full space-y-2"
                                      >
                                        {(
                                          milestone.submissionHistory as Array<
                                            Record<string, unknown>
                                          >
                                        ).map(
                                          (
                                            history: Record<string, unknown>,
                                            idx: number,
                                          ) => {
                                            const revisionNumberValue =
                                              history.revisionNumber;
                                            const revisionNumber: number =
                                              typeof revisionNumberValue ===
                                                "number" &&
                                              revisionNumberValue !== null &&
                                              revisionNumberValue !== undefined
                                                ? revisionNumberValue
                                                : idx + 1;

                                            const requestedChangesAt =
                                              history.requestedChangesAt;
                                            const requestedChangesReason =
                                              history.requestedChangesReason;
                                            const submitDeliverables =
                                              history.submitDeliverables;
                                            const submissionNote =
                                              history.submissionNote;
                                            const submissionAttachmentUrl =
                                              history.submissionAttachmentUrl;
                                            const submittedAt =
                                              history.submittedAt;

                                            return (
                                              <AccordionItem
                                                key={idx}
                                                value={`revision-${milestone.id}-${idx}`}
                                                className="bg-gray-50 border border-gray-200 rounded-lg px-3"
                                              >
                                                <AccordionTrigger className="py-3 hover:no-underline">
                                                  <div className="flex w-full items-center justify-between gap-3 pr-2 text-left">
                                                    <p className="text-sm font-medium text-gray-900">
                                                      {t(
                                                        "provider.projects.detail.milestoneUi.revisionN",
                                                        {
                                                          n: revisionNumber,
                                                        },
                                                      )}
                                                    </p>
                                                    {requestedChangesAt &&
                                                    typeof requestedChangesAt ===
                                                      "string" ? (
                                                      <span className="text-xs text-gray-500">
                                                        {t(
                                                          "provider.projects.detail.milestoneUi.changesRequestedAt",
                                                        )}{" "}
                                                        {new Date(
                                                          requestedChangesAt,
                                                        ).toLocaleDateString()}
                                                      </span>
                                                    ) : null}
                                                  </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="pb-3">
                                                  {requestedChangesReason &&
                                                  typeof requestedChangesReason ===
                                                    "string" ? (
                                                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                                      <p className="text-xs font-medium text-red-900 mb-1">
                                                        {t(
                                                          "provider.projects.detail.milestoneUi.reasonForChanges",
                                                        )}
                                                      </p>
                                                      <p className="text-xs text-red-800">
                                                        {requestedChangesReason}
                                                      </p>
                                                    </div>
                                                  ) : null}

                                                  {/* FIX 3: History Submit Deliverables */}
                                                  {/* Added boolean cast check */}
                                                  {!!submitDeliverables ? (
                                                    <div className="mb-2">
                                                      <p className="text-xs font-medium text-gray-700 mb-1">
                                                        {t(
                                                          "provider.projects.detail.milestoneUi.deliverables",
                                                        )}
                                                      </p>
                                                      <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                                        {((): React.ReactNode => {
                                                          let text: string = "";
                                                          if (
                                                            typeof submitDeliverables ===
                                                            "string"
                                                          ) {
                                                            text =
                                                              submitDeliverables;
                                                          } else if (
                                                            typeof submitDeliverables ===
                                                              "object" &&
                                                            submitDeliverables !==
                                                              null &&
                                                            "description" in
                                                              submitDeliverables
                                                          ) {
                                                            const desc = (
                                                              submitDeliverables as Record<
                                                                string,
                                                                unknown
                                                              >
                                                            ).description;
                                                            text =
                                                              typeof desc ===
                                                              "string"
                                                                ? desc
                                                                : String(
                                                                    desc || "",
                                                                  );
                                                          } else {
                                                            text = String(
                                                              submitDeliverables ||
                                                                "",
                                                            );
                                                          }
                                                          return text;
                                                        })()}
                                                      </p>
                                                    </div>
                                                  ) : null}

                                                {submissionNote &&
                                                typeof submissionNote ===
                                                  "string" ? (
                                                  <div className="mb-2">
                                                    <p className="text-xs font-medium text-gray-700 mb-1">
                                                      {t(
                                                        "provider.projects.detail.milestoneUi.note",
                                                      )}
                                                    </p>
                                                    <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                                      {submissionNote}
                                                    </p>
                                                  </div>
                                                ) : null}

                                                {submissionAttachmentUrl &&
                                                typeof submissionAttachmentUrl ===
                                                  "string" ? (
                                                  <div>
                                                    <p className="text-xs font-medium text-gray-700 mb-1">
                                                      {t(
                                                        "provider.projects.detail.milestoneUi.attachment",
                                                      )}
                                                    </p>
                                                    {((): React.ReactNode => {
                                                      const attachmentUrl =
                                                        getAttachmentUrl(
                                                          submissionAttachmentUrl,
                                                        );
                                                      const isR2Key =
                                                        attachmentUrl === "#" ||
                                                        (!attachmentUrl.startsWith(
                                                          "http",
                                                        ) &&
                                                          !attachmentUrl.startsWith(
                                                            "/uploads/",
                                                          ) &&
                                                          !attachmentUrl.includes(
                                                            process.env
                                                              .NEXT_PUBLIC_API_URL ||
                                                              "localhost",
                                                          ));
                                                      const fileName =
                                                        submissionAttachmentUrl
                                                          .replace(/\\/g, "/")
                                                          .split("/")
                                                          .pop() ||
                                                        t(
                                                          "provider.projects.detail.milestoneUi.attachmentFallback",
                                                        );

                                                      return (
                                                        <a
                                                          href={attachmentUrl}
                                                          download={fileName}
                                                          target="_blank"
                                                          rel="noopener noreferrer"
                                                          onClick={
                                                            isR2Key
                                                              ? async (e) => {
                                                                  e.preventDefault();
                                                                  try {
                                                                    const downloadUrl =
                                                                      await getR2DownloadUrl(
                                                                        submissionAttachmentUrl,
                                                                      );
                                                                    window.open(
                                                                      downloadUrl.downloadUrl,
                                                                      "_blank",
                                                                    );
                                                                  } catch (error) {
                                                                    console.error(
                                                                      "Failed to get download URL:",
                                                                      error,
                                                                    );
                                                                    toastHook({
                                                                      title: t(
                                                                        "provider.projects.toast.error",
                                                                      ),
                                                                      description:
                                                                        t(
                                                                          "provider.projects.toast.downloadFailed",
                                                                        ),
                                                                      variant:
                                                                        "destructive",
                                                                    });
                                                                  }
                                                                }
                                                              : undefined
                                                          }
                                                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                        >
                                                          {fileName}
                                                        </a>
                                                      );
                                                    })()}
                                                  </div>
                                                ) : null}

                                                  {submittedAt &&
                                                  typeof submittedAt ===
                                                    "string" ? (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                      {t(
                                                        "provider.projects.detail.milestoneUi.submittedAt",
                                                      )}{" "}
                                                      {new Date(
                                                        submittedAt,
                                                      ).toLocaleString()}
                                                    </p>
                                                  ) : null}
                                                </AccordionContent>
                                              </AccordionItem>
                                            );
                                          },
                                        )}
                                      </Accordion>
                                    </div>
                                  )}
                              </div>
                            );
                          },
                        )
                      ) : (
                        <p className="text-gray-600 text-center py-8">
                          {t("provider.projects.detail.milestonesEmpty")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="space-y-4 sm:space-y-6">
                {/* Proposal Attachments Section */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                      {t("provider.projects.detail.files.proposalTitle")}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {t("provider.projects.detail.files.proposalDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {(() => {
                      // Get attachments from the provider's proposal
                      const proposalAttachments: string[] = [];

                      // Get attachments from project.proposal or project.Proposal (backend returns it as proposal)
                      if (
                        project?.proposal?.attachmentUrls &&
                        Array.isArray(project.proposal.attachmentUrls)
                      ) {
                        proposalAttachments.push(
                          ...project.proposal.attachmentUrls,
                        );
                      } else if (
                        project?.Proposal?.attachmentUrls &&
                        Array.isArray(project.Proposal.attachmentUrls)
                      ) {
                        proposalAttachments.push(
                          ...project.Proposal.attachmentUrls,
                        );
                      }

                      if (proposalAttachments.length === 0) {
                        return (
                          <p className="text-xs sm:text-sm text-gray-500 text-center py-6 sm:py-8">
                            {t("provider.projects.detail.files.proposalEmpty")}
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {proposalAttachments.map((url, idx) => {
                            const normalized = url.replace(/\\/g, "/");
                            const fileName =
                              normalized.split("/").pop() || `file-${idx + 1}`;
                            const attachmentUrl = getAttachmentUrl(url);
                            const isR2Key =
                              attachmentUrl === "#" ||
                              (!attachmentUrl.startsWith("http") &&
                                !attachmentUrl.startsWith("/uploads/") &&
                                !attachmentUrl.includes(
                                  process.env.NEXT_PUBLIC_API_URL ||
                                    "localhost",
                                ));

                            return (
                              <a
                                key={idx}
                                href={
                                  attachmentUrl === "#"
                                    ? undefined
                                    : attachmentUrl
                                }
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={
                                  isR2Key
                                    ? async (e) => {
                                        e.preventDefault();
                                        try {
                                          const downloadUrl =
                                            await getR2DownloadUrl(url); // Use original URL/key
                                          window.open(
                                            downloadUrl.downloadUrl,
                                            "_blank",
                                          );
                                        } catch (error) {
                                          console.error(
                                            "Failed to get download URL:",
                                            error,
                                          );
                                          toastHook({
                                            title: t(
                                              "provider.projects.toast.error",
                                            ),
                                            description: t(
                                              "provider.projects.toast.downloadFailed",
                                            ),
                                            variant: "destructive",
                                          });
                                        }
                                      }
                                    : undefined
                                }
                                className="flex items-start gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 active:bg-gray-50 sm:hover:bg-gray-50 sm:hover:shadow-sm transition"
                              >
                                <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                  {t(
                                    "provider.projects.detail.milestoneUi.pdfBadge",
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs sm:text-sm font-medium text-gray-900 break-all leading-snug">
                                    {fileName}
                                  </span>
                                  <span className="text-xs text-gray-500 leading-snug">
                                    {t(
                                      "provider.projects.detail.files.fromProposal",
                                    )}
                                    {project?.proposal?.createdAt &&
                                      ` • ${t("provider.projects.detail.files.submittedOn")} ${new Date(
                                        project.proposal.createdAt,
                                      ).toLocaleDateString()}`}
                                    {project?.proposal?.submittedAt &&
                                      ` • ${t("provider.projects.detail.files.submittedOn")} ${new Date(
                                        project.proposal.submittedAt,
                                      ).toLocaleDateString()}`}
                                    <span className="block mt-0.5">
                                      {t(
                                        "provider.projects.detail.milestoneUi.clickPreviewDownload",
                                      )}
                                    </span>
                                  </span>
                                </div>
                                <div className="ml-auto flex items-center text-gray-500 active:text-gray-700 sm:hover:text-gray-700">
                                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Milestone Attachments Section */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                      {t("provider.projects.detail.files.milestoneTitle")}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {t("provider.projects.detail.files.milestoneDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {(() => {
                      // Get attachments from milestones
                      const milestoneAttachments: Array<{
                        url: string;
                        milestoneTitle: string;
                        milestoneId: string;
                        submittedAt?: string;
                      }> = [];

                      projectMilestones.forEach((milestone) => {
                        // Current submission attachment
                        if (milestone.submissionAttachmentUrl && milestone.id) {
                          milestoneAttachments.push({
                            url: milestone.submissionAttachmentUrl,
                            milestoneTitle: milestone.title,
                            milestoneId: milestone.id,
                            submittedAt: milestone.submittedAt,
                          });
                        }

                        // History submission attachments
                        if (
                          milestone.submissionHistory &&
                          Array.isArray(milestone.submissionHistory) &&
                          milestone.id
                        ) {
                          const milestoneId = milestone.id; // Store in const for type narrowing
                          (
                            milestone.submissionHistory as Array<
                              Record<string, unknown>
                            >
                          ).forEach((history: Record<string, unknown>) => {
                            const submissionAttachmentUrl =
                              history.submissionAttachmentUrl;
                            if (
                              submissionAttachmentUrl &&
                              typeof submissionAttachmentUrl === "string"
                            ) {
                              const revisionNumber = history.revisionNumber;
                              const submittedAt = history.submittedAt;
                              const revDisplay =
                                typeof revisionNumber === "number"
                                  ? revisionNumber
                                  : revisionNumber !== undefined &&
                                      revisionNumber !== null
                                    ? String(revisionNumber)
                                    : t(
                                        "provider.projects.detail.files.revisionNA",
                                      );
                              milestoneAttachments.push({
                                url: submissionAttachmentUrl,
                                milestoneTitle: t(
                                  "provider.projects.detail.files.milestoneRevisionTitle",
                                  {
                                    title: milestone.title || "",
                                    revision: revDisplay,
                                  },
                                ),
                                milestoneId: milestoneId,
                                submittedAt:
                                  typeof submittedAt === "string"
                                    ? submittedAt
                                    : undefined,
                              });
                            }
                          });
                        }
                      });

                      if (milestoneAttachments.length === 0) {
                        return (
                          <p className="text-xs sm:text-sm text-gray-500 text-center py-6 sm:py-8">
                            {t("provider.projects.detail.files.milestoneEmpty")}
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {milestoneAttachments.map((attachment, idx) => {
                            const normalized = attachment.url.replace(
                              /\\/g,
                              "/",
                            );
                            const fileName =
                              normalized.split("/").pop() || `file-${idx + 1}`;
                            const attachmentUrl = getAttachmentUrl(
                              attachment.url,
                            );
                            const isR2Key =
                              attachmentUrl === "#" ||
                              (!attachmentUrl.startsWith("http") &&
                                !attachmentUrl.startsWith("/uploads/") &&
                                !attachmentUrl.includes(
                                  process.env.NEXT_PUBLIC_API_URL ||
                                    "localhost",
                                ));

                            return (
                              <a
                                key={idx}
                                href={
                                  attachmentUrl === "#"
                                    ? undefined
                                    : attachmentUrl
                                }
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={
                                  isR2Key
                                    ? async (e) => {
                                        e.preventDefault();
                                        try {
                                          const downloadUrl =
                                            await getR2DownloadUrl(
                                              attachment.url,
                                            ); // Use original URL/key
                                          window.open(
                                            downloadUrl.downloadUrl,
                                            "_blank",
                                          );
                                        } catch (error) {
                                          console.error(
                                            "Failed to get download URL:",
                                            error,
                                          );
                                          toastHook({
                                            title: t(
                                              "provider.projects.toast.error",
                                            ),
                                            description: t(
                                              "provider.projects.toast.downloadFailed",
                                            ),
                                            variant: "destructive",
                                          });
                                        }
                                      }
                                    : undefined
                                }
                                className="flex items-start gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 active:bg-gray-50 sm:hover:bg-gray-50 sm:hover:shadow-sm transition"
                              >
                                <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                  {t(
                                    "provider.projects.detail.milestoneUi.pdfBadge",
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs sm:text-sm font-medium text-gray-900 break-all leading-snug">
                                    {fileName}
                                  </span>
                                  <span className="text-xs text-gray-500 leading-snug">
                                    {t(
                                      "provider.projects.detail.files.fromMilestone",
                                    )}{" "}
                                    {attachment.milestoneTitle}
                                    {attachment.submittedAt &&
                                      ` • ${t("provider.projects.detail.files.submittedOn")} ${new Date(
                                        attachment.submittedAt,
                                      ).toLocaleDateString()}`}
                                    <span className="block mt-0.5">
                                      {t(
                                        "provider.projects.detail.milestoneUi.clickPreviewDownload",
                                      )}
                                    </span>
                                  </span>
                                </div>
                                <div className="ml-auto flex items-center text-gray-500 active:text-gray-700 sm:hover:text-gray-700">
                                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Message Attachments Section */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                      {t("provider.projects.detail.files.messageTitle")}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {t("provider.projects.detail.files.messageDesc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {(() => {
                      const messageAttachments = msgsToRender.flatMap(
                        (message: MessageData) =>
                          Array.isArray(message.attachments)
                            ? message.attachments.map((url: string) => ({
                                url,
                                senderName:
                                  (message.sender?.name as string) ||
                                  (message.senderName as string) ||
                                  t(
                                    "provider.projects.detail.messages.senderUser",
                                  ),
                                messageId: message.id as string,
                                timestamp:
                                  (message.createdAt as string) ||
                                  (message.timestamp as string),
                              }))
                            : [],
                      );
                      if (messageAttachments.length === 0) {
                        return (
                          <p className="text-xs sm:text-sm text-gray-500 text-center py-6 sm:py-8">
                            {t("provider.projects.detail.files.messageEmpty")}
                          </p>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          {messageAttachments.map((attachment, idx) => {
                            const normalized = attachment.url.replace(
                              /\\/g,
                              "/",
                            );
                            const fileName =
                              normalized.split("/").pop() || `file-${idx + 1}`;

                            // Use getAttachmentUrl helper for consistent URL handling
                            const attachmentUrl = getAttachmentUrl(
                              attachment.url,
                            );
                            const isR2Key =
                              attachmentUrl === "#" ||
                              (!attachmentUrl.startsWith("http") &&
                                !attachmentUrl.startsWith("/uploads/") &&
                                !attachmentUrl.includes(
                                  process.env.NEXT_PUBLIC_API_URL ||
                                    "localhost",
                                ));

                            return (
                              <a
                                key={idx}
                                href={
                                  attachmentUrl === "#"
                                    ? undefined
                                    : attachmentUrl
                                }
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={
                                  isR2Key
                                    ? async (e) => {
                                        e.preventDefault();
                                        try {
                                          const downloadUrl =
                                            await getR2DownloadUrl(
                                              attachment.url,
                                            ); // Use original URL/key
                                          window.open(
                                            downloadUrl.downloadUrl,
                                            "_blank",
                                          );
                                        } catch (error) {
                                          console.error(
                                            "Failed to get download URL:",
                                            error,
                                          );
                                          toastHook({
                                            title: t(
                                              "provider.projects.toast.error",
                                            ),
                                            description: t(
                                              "provider.projects.toast.downloadFailed",
                                            ),
                                            variant: "destructive",
                                          });
                                        }
                                      }
                                    : undefined
                                }
                                className="flex items-start gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 active:bg-gray-50 sm:hover:bg-gray-50 sm:hover:shadow-sm transition"
                              >
                                <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                  {t(
                                    "provider.projects.detail.milestoneUi.pdfBadge",
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs sm:text-sm font-medium text-gray-900 break-all leading-snug">
                                    {fileName}
                                  </span>
                                  <span className="text-xs text-gray-500 leading-snug">
                                    {t(
                                      "provider.projects.detail.files.fromSenderHint",
                                      { name: attachment.senderName },
                                    )}
                                  </span>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                      {t(
                        "provider.projects.detail.messages.sectionTitle",
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {t(
                        "provider.projects.detail.messages.sectionDesc",
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                      {msgsToRender.map((message: MessageData) => {
                        const isCurrentUser =
                          String(message.senderId || message.sender?.id) ===
                          String(currentUserId);
                        const text = message.content ?? message.message ?? "";
                        const ts = message.createdAt ?? message.timestamp ?? "";
                        const avatarChar =
                          (
                            message.sender?.name ||
                            message.senderName ||
                            (isCurrentUser
                              ? t(
                                  "provider.projects.detail.messages.senderYou",
                                )
                              : t(
                                  "provider.projects.detail.messages.senderUser",
                                ))
                          )?.charAt?.(0) ||
                          t(
                            "provider.projects.detail.viewDispute.unknownUser",
                          ).charAt(0);

                        return (
                          <div
                            key={message.id}
                            className={`flex gap-2 sm:gap-3 ${
                              isCurrentUser ? "flex-row-reverse" : ""
                            }`}
                          >
                            <Avatar className="w-7 h-7 sm:w-8 sm:h-8 flex-shrink-0">
                              <AvatarFallback className="text-xs">
                                {avatarChar}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`flex-1 min-w-0 max-w-[70%] sm:max-w-[14rem] ${
                                isCurrentUser ? "text-right" : ""
                              }`}
                            >
                              <div
                                className={`p-2 sm:p-3 rounded-lg ${
                                  isCurrentUser
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100"
                                }`}
                              >
                                <p className="text-xs sm:text-sm break-words">
                                  {text}
                                </p>
                                {message.attachments &&
                                  Array.isArray(message.attachments) &&
                                  message.attachments.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-opacity-20 space-y-2">
                                      {(message.attachments as unknown[]).map(
                                        (
                                          attachment: unknown,
                                          index: number,
                                        ) => {
                                          const attachmentStr =
                                            typeof attachment === "string"
                                              ? attachment
                                              : String(attachment);
                                          const url = getFullUrl(attachmentStr);
                                          const attachmentUrl =
                                            getAttachmentUrl(attachmentStr);
                                          const name =
                                            url.split("/").pop() ||
                                            `file-${index}`;
                                          const isR2Key =
                                            attachmentUrl === "#" ||
                                            (!attachmentUrl.startsWith(
                                              "http",
                                            ) &&
                                              !attachmentUrl.startsWith(
                                                "/uploads/",
                                              ) &&
                                              !attachmentUrl.includes(
                                                process.env
                                                  .NEXT_PUBLIC_API_URL ||
                                                  "localhost",
                                              ));

                                          return (
                                            <div
                                              key={index}
                                              className="text-xs"
                                            >
                                              {isImage(url) ? (
                                                <div className="relative w-32 h-auto rounded border cursor-pointer">
                                                  <Image
                                                    src={url}
                                                    alt={name}
                                                    width={128}
                                                    height={128}
                                                    className="w-32 h-auto rounded border"
                                                    unoptimized
                                                    onError={async (e) => {
                                                      const target =
                                                        e.target as HTMLImageElement;
                                                      // If image fails to load and it's an R2 key, try to get download URL
                                                      if (isR2Key) {
                                                        try {
                                                          const downloadUrl =
                                                            await getR2DownloadUrl(
                                                              attachmentStr,
                                                            );
                                                          target.src =
                                                            downloadUrl.downloadUrl;
                                                        } catch (error) {
                                                          console.error(
                                                            "Failed to get download URL:",
                                                            error,
                                                          );
                                                          target.style.display =
                                                            "none";
                                                        }
                                                      } else {
                                                        target.style.display =
                                                          "none";
                                                      }
                                                    }}
                                                  />
                                                </div>
                                              ) : isPDF(url) ? (
                                                <a
                                                  href={
                                                    attachmentUrl !== "#"
                                                      ? attachmentUrl
                                                      : url
                                                  }
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={
                                                    isR2Key
                                                      ? async (e) => {
                                                          e.preventDefault();
                                                          try {
                                                            const downloadUrl =
                                                              await getR2DownloadUrl(
                                                                attachmentStr,
                                                              );
                                                            window.open(
                                                              downloadUrl.downloadUrl,
                                                              "_blank",
                                                            );
                                                          } catch (error) {
                                                            console.error(
                                                              "Failed to get download URL:",
                                                              error,
                                                            );
                                                            toastHook({
                                                              title: t(
                                                                "provider.projects.toast.error",
                                                              ),
                                                              description: t(
                                                                "provider.projects.toast.downloadFailed",
                                                              ),
                                                              variant:
                                                                "destructive",
                                                            });
                                                          }
                                                        }
                                                      : undefined
                                                  }
                                                  className={`flex items-center gap-2 ${
                                                    isCurrentUser
                                                      ? "text-blue-200 underline"
                                                      : "text-blue-500 underline"
                                                  }`}
                                                >
                                                  {t(
                                                    "provider.projects.detail.messages.attachmentPdfLabel",
                                                    { name },
                                                  )}
                                                </a>
                                              ) : (
                                                <a
                                                  href={
                                                    attachmentUrl !== "#"
                                                      ? attachmentUrl
                                                      : url
                                                  }
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={
                                                    isR2Key
                                                      ? async (e) => {
                                                          e.preventDefault();
                                                          try {
                                                            const downloadUrl =
                                                              await getR2DownloadUrl(
                                                                attachmentStr,
                                                              );
                                                            window.open(
                                                              downloadUrl.downloadUrl,
                                                              "_blank",
                                                            );
                                                          } catch (error) {
                                                            console.error(
                                                              "Failed to get download URL:",
                                                              error,
                                                            );
                                                            toastHook({
                                                              title: t(
                                                                "provider.projects.toast.error",
                                                              ),
                                                              description: t(
                                                                "provider.projects.toast.downloadFailed",
                                                              ),
                                                              variant:
                                                                "destructive",
                                                            });
                                                          }
                                                        }
                                                      : undefined
                                                  }
                                                  className={`flex items-center gap-2 ${
                                                    isCurrentUser
                                                      ? "text-blue-200 underline"
                                                      : "text-blue-500 underline"
                                                  }`}
                                                >
                                                  {t(
                                                    "provider.projects.detail.messages.attachmentOtherLabel",
                                                    { name },
                                                  )}
                                                </a>
                                              )}
                                            </div>
                                          );
                                        },
                                      )}
                                    </div>
                                  )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{ts}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="my-3 sm:my-4" />
                    <div className="flex justify-center gap-2">
                      <Button
                        className="w-full sm:w-auto text-xs sm:text-sm"
                        onClick={() =>
                          handleContact(
                            project.customer?.id,
                            project.customer?.name,
                            (
                              project.customer as
                                | { profileImageUrl?: string }
                                | undefined
                            )?.profileImageUrl ||
                              project.customer?.customerProfile
                                ?.profileImageUrl,
                          )
                        }
                      >
                        {t("provider.projects.detail.messages.contact")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  {t("provider.projects.detail.sidebar.clientTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    <AvatarImage
                      src={getProfileImageUrl(
                        project.customer?.customerProfile?.profileImageUrl,
                      )}
                    />
                    <AvatarFallback>
                      {project.customer?.name?.charAt(0) ||
                        t("provider.dashboard.avatarFallbackClient")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    {project.customer?.id ? (
                      <Link
                        href={`/provider/companies/${project.customer.id}`}
                        className="font-medium text-sm sm:text-base text-blue-600 active:text-blue-800 sm:hover:text-blue-800 sm:hover:underline block break-words"
                      >
                        {project.customer?.name}
                      </Link>
                    ) : (
                      <p className="font-medium text-sm sm:text-base break-words">
                        {project.customer?.name}
                      </p>
                    )}
                    <p className="text-xs sm:text-sm text-gray-600 break-words">
                      {project.customer?.email}
                    </p>
                  </div>
                </div>

                {project.customer?.customerProfile && (
                  <div className="space-y-2 text-xs sm:text-sm">
                    {project.customer.customerProfile.industry && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="break-words">
                          {project.customer.customerProfile.industry}
                        </span>
                      </div>
                    )}
                    {project.customer.customerProfile.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <span className="break-words">
                          {project.customer.customerProfile.location}
                        </span>
                      </div>
                    )}
                    {project.customer.customerProfile.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                        <a
                          href={project.customer.customerProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 active:text-blue-800 sm:hover:underline break-all"
                        >
                          {t("provider.projects.detail.sidebar.website")}
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  {t("provider.projects.detail.sidebar.statsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">
                    {t("provider.projects.detail.sidebar.totalMilestones")}
                  </span>
                  <span className="font-medium text-sm sm:text-base">
                    {project.totalMilestones || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">
                    {t("provider.projects.detail.sidebar.completed")}
                  </span>
                  <span className="font-medium text-sm sm:text-base text-green-600">
                    {project.completedMilestones || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">
                    {t("provider.projects.detail.sidebar.progress")}
                  </span>
                  <span className="font-medium text-sm sm:text-base">
                    {project.progress || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">
                    {t("provider.projects.detail.sidebar.created")}
                  </span>
                  <span className="font-medium text-sm sm:text-base">
                    {formatDate(project.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Milestone Update Dialog */}
        <Dialog
          open={isMilestoneDialogOpen}
          onOpenChange={setIsMilestoneDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedMilestone?.status === "LOCKED"
                  ? t("provider.projects.detail.dialog.startTitle")
                  : t("provider.projects.detail.dialog.submitTitle")}
              </DialogTitle>
              <DialogDescription>
                {selectedMilestone?.status === "LOCKED"
                  ? t("provider.projects.detail.dialog.startDesc")
                  : t("provider.projects.detail.dialog.submitDesc")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedMilestone?.status === "LOCKED" && (
                <div>
                  <Label htmlFor="startDeliverables">
                    {t(
                      "provider.projects.detail.dialog.labelStartDeliverables",
                    )}
                  </Label>
                  <Textarea
                    id="startDeliverables"
                    placeholder={t(
                      "provider.projects.detail.dialog.phStartDeliverables",
                    )}
                    value={milestoneDeliverables}
                    onChange={(e) => setMilestoneDeliverables(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {selectedMilestone?.status === "IN_PROGRESS" && (
                <>
                  <div>
                    <Label htmlFor="submitDeliverables">
                      {t(
                        "provider.projects.detail.dialog.labelSubmitDeliverables",
                      )}
                    </Label>
                    <Textarea
                      id="submitDeliverables"
                      placeholder={t(
                        "provider.projects.detail.dialog.phSubmitDeliverables",
                      )}
                      value={submitDeliverables}
                      onChange={(e) => setSubmitDeliverables(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="submissionNote">
                      {t(
                        "provider.projects.detail.dialog.labelSubmissionNote",
                      )}
                    </Label>
                    <Textarea
                      id="submissionNote"
                      placeholder={t(
                        "provider.projects.detail.dialog.phSubmissionNote",
                      )}
                      value={submissionNote}
                      onChange={(e) => setSubmissionNote(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="attachment">
                      {t("provider.projects.detail.dialog.labelAttachment")}
                    </Label>
                    <Input
                      id="attachment"
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSubmissionAttachment(file);
                        }
                      }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.jpg,.jpeg,.png"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {t(
                        "provider.projects.detail.dialog.attachmentTypesHint",
                      )}
                    </p>
                    {submissionAttachment && (
                      <div className="mt-2 text-sm text-gray-600">
                        {t("provider.projects.detail.dialog.selectedFile", {
                          name: submissionAttachment.name,
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsMilestoneDialogOpen(false)}
              >
                {t("provider.projects.detail.common.cancel")}
              </Button>
              <Button
                onClick={() =>
                  handleMilestoneUpdate(
                    selectedMilestone?.status === "LOCKED"
                      ? "IN_PROGRESS"
                      : "SUBMITTED",
                  )
                }
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {selectedMilestone?.status === "LOCKED"
                  ? t("provider.projects.detail.milestone.startWork")
                  : t("provider.projects.detail.dialog.actionSubmit")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Milestones Finalized Dialog */}
        <Dialog
          open={milestoneFinalizeOpen}
          onOpenChange={setMilestoneFinalizeOpen}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {t("provider.projects.detail.finalize.title")}
              </DialogTitle>
              <DialogDescription>
                {t("provider.projects.detail.finalize.desc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <CheckCircle
                  className={`w-5 h-5 flex-shrink-0 ${
                    milestoneApprovalState.companyApproved
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t("provider.projects.detail.finalize.companyTitle")}
                  </div>
                  <div>
                    {milestoneApprovalState.companyApproved
                      ? t("provider.projects.detail.finalize.companyYes")
                      : t("provider.projects.detail.finalize.companyNo")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t("provider.projects.detail.finalize.providerTitle")}
                  </div>
                  <div>
                    {milestoneApprovalState.providerApproved
                      ? t("provider.projects.detail.finalize.providerYes")
                      : t("provider.projects.detail.finalize.providerNo")}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle
                  className={`w-5 h-5 flex-shrink-0 ${
                    milestoneApprovalState.milestonesLocked
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    {t("provider.projects.detail.finalize.lockedTitle")}
                  </div>
                  <div>
                    {milestoneApprovalState.milestonesLocked
                      ? t("provider.projects.detail.finalize.lockedYes")
                      : t("provider.projects.detail.finalize.lockedNo")}
                  </div>
                  {milestoneApprovalState.milestonesApprovedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      {t("provider.projects.detail.finalize.lockedAt")}{" "}
                      {new Date(
                        milestoneApprovalState.milestonesApprovedAt,
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setMilestoneFinalizeOpen(false)}>
                {t("provider.projects.detail.finalize.done")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dispute Creation Dialog */}
        <Dialog
          open={disputeDialogOpen}
          onOpenChange={(open) => {
            setDisputeDialogOpen(open);
            if (open) {
              setProjectLevelDisputeAck(false);
              setSelectedMilestoneForDispute(null);
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t("provider.projects.dispute.form.title")}
              </DialogTitle>
              <DialogDescription>
                {t("provider.projects.dispute.form.desc")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Milestone Selection (if applicable) */}
              {projectMilestones && projectMilestones.length > 0 && (
                <div className="space-y-3">
                  {paidMilestonesForDispute.length > 0 ? (
                    <>
                      <div>
                        <Label htmlFor="disputeMilestone">
                          {t("provider.projects.dispute.relatedMilestoneLabel")}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          value={selectedMilestoneForDispute || undefined}
                          onValueChange={(value) => {
                            setSelectedMilestoneForDispute(value || null);
                            setProjectLevelDisputeAck(false);
                          }}
                        >
                          <SelectTrigger id="disputeMilestone">
                            <SelectValue
                              placeholder={t(
                                "provider.projects.dispute.placeholderSelectPaid",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {paidMilestonesForDispute.map((m: Milestone) => (
                              <SelectItem
                                key={m.id || ""}
                                value={m.id || ""}
                                className="items-start"
                              >
                                <div className="flex flex-col gap-0.5 text-left">
                                  <span>
                                    {m.title}{" "}
                                    <span className="text-muted-foreground">
                                      (
                                      {getMilestoneStatusText(m.status || "")}
                                      )
                                    </span>
                                  </span>
                                  {renderMilestoneAmountProviderEquiv(
                                    Number(m.amount || 0),
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500 mt-1">
                          {t("provider.projects.dispute.relatedMilestoneHint")}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        {t("provider.projects.dispute.noPaidMilestonesMessage")}
                      </div>
                      <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50/80 p-3">
                        <Checkbox
                          id="projectLevelDisputeAck"
                          checked={projectLevelDisputeAck}
                          onCheckedChange={(c) => {
                            const on = c === true;
                            setProjectLevelDisputeAck(on);
                            if (on) setSelectedMilestoneForDispute(null);
                          }}
                          className="mt-0.5"
                        />
                        <div className="space-y-1">
                          <Label
                            htmlFor="projectLevelDisputeAck"
                            className="text-sm font-medium leading-snug cursor-pointer"
                          >
                            {t("provider.projects.dispute.projectLevelLabel")}{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <p className="text-xs text-gray-600">
                            {t("provider.projects.dispute.projectLevelHint")}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Reason */}
              <div>
                <Label htmlFor="disputeReason">
                  {t("provider.projects.dispute.form.reasonLabel")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select value={disputeReason} onValueChange={setDisputeReason}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "provider.projects.dispute.form.reasonPlaceholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Missed deadline">
                      {t(
                        "customer.projects.detail.disputeReason.missedDeadline",
                      )}
                    </SelectItem>
                    <SelectItem value="Low quality">
                      {t("customer.projects.detail.disputeReason.lowQuality")}
                    </SelectItem>
                    <SelectItem value="Payment not released">
                      {t(
                        "customer.projects.detail.disputeReason.paymentNotReleased",
                      )}
                    </SelectItem>
                    <SelectItem value="Work not completed">
                      {t(
                        "customer.projects.detail.disputeReason.workNotCompleted",
                      )}
                    </SelectItem>
                    <SelectItem value="Communication issues">
                      {t(
                        "customer.projects.detail.disputeReason.communicationIssues",
                      )}
                    </SelectItem>
                    <SelectItem value="Scope change">
                      {t(
                        "customer.projects.detail.disputeReason.scopeChange",
                      )}
                    </SelectItem>
                    <SelectItem value="Other">
                      {t("customer.projects.detail.disputeReason.other")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="disputeDescription">
                  {t("provider.projects.dispute.form.descriptionLabel")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="disputeDescription"
                  placeholder={t(
                    "provider.projects.dispute.form.descriptionPlaceholder",
                  )}
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              <div className="rounded-md border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm">
                <span className="text-gray-600">
                  {t("provider.projects.dispute.form.contestedAmount", {
                    currency: projectCurrencyCode,
                  })}
                </span>
                <span className="font-semibold text-gray-900">
                  {reportDisputeContestedAmount.toLocaleString()}
                </span>
                <p className="text-xs text-gray-500 mt-1.5">
                  {t("provider.projects.dispute.form.contestedHint", {
                    currency: projectCurrencyCode,
                  })}
                </p>
              </div>

              {/* Suggested Resolution */}
              <div>
                <Label htmlFor="disputeSuggestedResolution">
                  {t("provider.projects.dispute.form.suggestedResolution")}
                </Label>
                <Textarea
                  id="disputeSuggestedResolution"
                  placeholder={t(
                    "provider.projects.dispute.form.suggestedPlaceholder",
                  )}
                  value={disputeSuggestedResolution}
                  onChange={(e) =>
                    setDisputeSuggestedResolution(e.target.value)
                  }
                  rows={4}
                />
              </div>

              {/* Attachments */}
              <div>
                <Label htmlFor="disputeAttachments">
                  {t("provider.projects.dispute.form.attachmentsOptional")}
                </Label>
                <Input
                  id="disputeAttachments"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.jpg,.jpeg,.png"
                  onChange={handleDisputeAttachmentChange}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("provider.projects.dispute.form.supportedTypes")}
                </p>
                {disputeAttachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {disputeAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <span className="text-sm text-gray-700 truncate flex-1">
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDisputeAttachment(index)}
                          className="ml-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDisputeDialogOpen(false);
                  setDisputeReason("");
                  setDisputeDescription("");
                  setDisputeSuggestedResolution("");
                  setDisputeAttachments([]);
                  setSelectedMilestoneForDispute(null);
                  setProjectLevelDisputeAck(false);
                }}
                disabled={creatingDispute}
              >
                {t("provider.projects.dispute.form.cancel")}
              </Button>
              <Button
                onClick={handleCreateDispute}
                disabled={
                  creatingDispute ||
                  !disputeReason.trim() ||
                  !disputeDescription.trim() ||
                  disputeMilestoneSubmitBlocked
                }
                className="bg-red-600 hover:bg-red-700"
              >
                {creatingDispute ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("provider.projects.dispute.form.submitting")}
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    {t("provider.projects.dispute.form.submit")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dispute Dialog */}
        <Dialog
          open={viewDisputeDialogOpen}
          onOpenChange={setViewDisputeDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {t("provider.projects.detail.viewDispute.title")}
              </DialogTitle>
              <DialogDescription>
                {projectDisputes.length > 1
                  ? t("provider.projects.detail.viewDisputesHint")
                  : t("provider.projects.detail.viewDisputeDesc")}
              </DialogDescription>
            </DialogHeader>

            {projectDisputes.length > 1 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("provider.projects.detail.disputeRecordSelect")}
                </Label>
                <Select
                  value={currentDispute?.id || ""}
                  onValueChange={(id) => {
                    const d = projectDisputes.find((x) => x.id === id);
                    if (d) setCurrentDispute(d);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t(
                        "provider.projects.detail.disputeRecordSelect",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {projectDisputes.map((d, idx) => (
                      <SelectItem key={d.id} value={d.id}>
                        #{projectDisputes.length - idx} ·{" "}
                        {getDisputeStatusLabel(d.status)} ·{" "}
                        {new Date(d.createdAt).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentDispute && (
              <div className="space-y-6">
                {/* Dispute Status */}
                <div className="flex items-center justify-between">
                  <Badge
                    className={getDisputeStatusColor(currentDispute.status)}
                  >
                    {getDisputeStatusLabel(currentDispute.status)}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {t("provider.projects.detail.viewDispute.created")}{" "}
                    {new Date(currentDispute.createdAt).toLocaleDateString()}
                    {currentDispute.updatedAt !== currentDispute.createdAt && (
                      <>
                        {" "}
                        • {t("provider.projects.detail.viewDispute.updated")}{" "}
                        {new Date(
                          currentDispute.updatedAt,
                        ).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>

                {/* Dispute Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {t("provider.projects.detail.viewDispute.infoTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t("provider.projects.detail.viewDispute.reason")}
                      </Label>
                      <p className="mt-1">
                        {currentDispute.reason
                          ? translateDisputeReason(currentDispute.reason)
                          : t(
                              "provider.projects.detail.viewDispute.notApplicable",
                            )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t(
                          "provider.projects.detail.viewDispute.descriptionUpdates",
                        )}
                      </Label>
                      <div className="mt-2 space-y-3">
                        {(() => {
                          // Parse description to show original and updates separately
                          const description = currentDispute.description || "";
                          const parts = description.split(/\n---\n/);
                          const originalDescription = parts[0]?.trim() || "";
                          const updates = parts.slice(1);

                          return (
                            <>
                              {/* Original Description */}
                              <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback>
                                      {currentDispute.raisedBy?.name?.charAt(
                                        0,
                                      ) ||
                                        t(
                                          "provider.projects.detail.viewDispute.unknownUser",
                                        ).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-900">
                                      {currentDispute.raisedBy?.name ||
                                        t(
                                          "provider.projects.detail.viewDispute.unknownUser",
                                        )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {t(
                                        "provider.projects.detail.viewDispute.originalDisputeMeta",
                                      )}{" "}
                                      {new Date(
                                        currentDispute.createdAt,
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                                  {originalDescription}
                                </p>
                              </div>

                              {/* Updates */}
                              {updates.map((update: string, idx: number) => {
                                // Parse update format: [Update by Name on Date]: content
                                // Also handle old format: [Update by userId]: content
                                const match = update.match(
                                  /^\[Update by (.+?) on (.+?)\]:\s*([\s\S]+)$/,
                                );
                                let userName = "";
                                let updateDate = "";
                                let updateContent = "";

                                if (match) {
                                  [, userName, updateDate, updateContent] =
                                    match;
                                } else {
                                  // Try old format: [Update by userId]: content
                                  const oldMatch = update.match(
                                    /^\[Update by (.+?)\]:\s*([\s\S]+)$/,
                                  );
                                  if (oldMatch) {
                                    const [, userIdOrName, content] = oldMatch;
                                    // Check if it's a UUID (old format)
                                    const uuidRegex =
                                      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                                    if (uuidRegex.test(userIdOrName)) {
                                      // It's a UUID, try to match with customer or provider
                                      if (
                                        project?.customer?.id === userIdOrName
                                      ) {
                                        userName =
                                          project?.customer?.name ||
                                          t(
                                            "provider.projects.detail.viewDispute.roleCustomer",
                                          );
                                      } else if (
                                        project?.provider?.id === userIdOrName
                                      ) {
                                        userName =
                                          project?.provider?.name ||
                                          t(
                                            "provider.projects.detail.viewDispute.roleProvider",
                                          );
                                      } else if (
                                        currentDispute?.raisedBy?.id ===
                                        userIdOrName
                                      ) {
                                        userName =
                                          currentDispute?.raisedBy?.name ||
                                          t(
                                            "provider.projects.detail.viewDispute.unknownUser",
                                          );
                                      } else {
                                        userName = t(
                                          "provider.projects.detail.viewDispute.unknownUser",
                                        );
                                      }
                                      updateDate = t(
                                        "provider.projects.detail.viewDispute.unknownDate",
                                      );
                                      updateContent = content;
                                    } else {
                                      userName = userIdOrName;
                                      updateDate = t(
                                        "provider.projects.detail.viewDispute.unknownDate",
                                      );
                                      updateContent = content;
                                    }
                                  } else {
                                    // Fallback: treat entire update as content
                                    updateContent = update;
                                    userName = t(
                                      "provider.projects.detail.viewDispute.unknownUser",
                                    );
                                    updateDate = t(
                                      "provider.projects.detail.viewDispute.unknownDate",
                                    );
                                  }
                                }

                                const isCustomer =
                                  project?.customer?.name === userName;
                                const isProvider =
                                  project?.provider?.name === userName;

                                return (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded-lg border-l-4 ${
                                      isCustomer
                                        ? "bg-blue-50 border-blue-400"
                                        : isProvider
                                          ? "bg-green-50 border-green-400"
                                          : "bg-yellow-50 border-yellow-400"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <Avatar className="w-5 h-5">
                                        <AvatarFallback className="text-xs">
                                          {userName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-semibold text-gray-900">
                                            {userName}
                                          </p>
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] px-1.5 py-0"
                                          >
                                            {isCustomer
                                              ? t(
                                                  "provider.projects.detail.viewDispute.roleCustomer",
                                                )
                                              : isProvider
                                                ? t(
                                                    "provider.projects.detail.viewDispute.roleProvider",
                                                  )
                                                : t(
                                                    "provider.projects.detail.viewDispute.roleUser",
                                                  )}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          {t(
                                            "provider.projects.detail.viewDispute.updateMetaLine",
                                            {
                                              n: idx + 1,
                                              date: updateDate,
                                            },
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                                      {updateContent.trim()}
                                    </p>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    {currentDispute.contestedAmount && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          {t(
                            "provider.projects.detail.viewDispute.contestedAmount",
                          )}
                        </Label>
                        <p className="mt-1 font-medium">
                          {formatCurrency(
                            Number(currentDispute.contestedAmount || 0),
                            projectCurrencyCode,
                          )}
                        </p>
                      </div>
                    )}
                    {currentDispute.suggestedResolution && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          {t(
                            "provider.projects.detail.viewDispute.suggestedResolution",
                          )}
                        </Label>
                        <p className="mt-1 whitespace-pre-wrap">
                          {currentDispute.suggestedResolution}
                        </p>
                      </div>
                    )}
                    {currentDispute.milestone && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          {t(
                            "provider.projects.detail.viewDispute.relatedMilestone",
                          )}
                        </Label>
                        <div className="mt-1 flex flex-col gap-0.5">
                          <span>{currentDispute.milestone.title}</span>
                          {renderMilestoneAmountProviderEquiv(
                            Number(currentDispute.milestone.amount || 0),
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Admin Resolution Notes */}
                {currentDispute.resolutionNotes &&
                  Array.isArray(currentDispute.resolutionNotes) &&
                  currentDispute.resolutionNotes.length > 0 && (
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="text-purple-800">
                          {t(
                            "provider.projects.detail.viewDispute.adminNotesTitle",
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {currentDispute.resolutionNotes.map(
                          (
                            note: {
                              note?: string;
                              adminName?: string;
                              createdAt: string;
                            },
                            index: number,
                          ) => {
                            // Check if note contains "--- Admin Note ---" separator
                            const noteParts =
                              note.note?.split(/\n--- Admin Note ---\n/) || [];
                            const hasAdminNote = noteParts.length > 1;
                            const resolutionResult = noteParts[0] || note.note;
                            const adminNote = noteParts[1];

                            return (
                              <div
                                key={index}
                                className="bg-white p-4 rounded-lg border-l-4 border-purple-500"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="bg-purple-100 text-purple-700">
                                      {note.adminName?.charAt(0) ||
                                        t(
                                          "provider.projects.detail.viewDispute.adminFallback",
                                        ).charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      {t(
                                        "provider.projects.detail.viewDispute.resolutionNoteN",
                                        { n: index + 1 },
                                      )}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {t(
                                        "provider.projects.detail.viewDispute.byAdmin",
                                      )}{" "}
                                      {note.adminName ||
                                        t(
                                          "provider.projects.detail.viewDispute.adminFallback",
                                        )}{" "}
                                      •{" "}
                                      {new Date(
                                        note.createdAt,
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-3 mt-2">
                                  {/* Resolution Result */}
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">
                                      {t(
                                        "provider.projects.detail.viewDispute.resolutionResult",
                                      )}
                                    </p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                                      {resolutionResult}
                                    </p>
                                  </div>
                                  {/* Admin Note (if exists) */}
                                  {hasAdminNote && adminNote && (
                                    <div>
                                      <p className="text-xs font-semibold text-purple-600 mb-1">
                                        {t(
                                          "provider.projects.detail.viewDispute.adminNoteLabel",
                                        )}
                                      </p>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-purple-50 p-2 rounded border-l-2 border-purple-300">
                                        {adminNote}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          },
                        )}
                      </CardContent>
                    </Card>
                  )}

                {/* Legacy Resolution (for backward compatibility) */}
                {currentDispute.resolution &&
                  (!currentDispute.resolutionNotes ||
                    !Array.isArray(currentDispute.resolutionNotes) ||
                    currentDispute.resolutionNotes.length === 0) && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-green-800">
                          {t(
                            "provider.projects.detail.viewDispute.adminResolutionTitle",
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-green-700 whitespace-pre-wrap">
                          {currentDispute.resolution}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                {/* Attachments */}
                {currentDispute.attachments &&
                  Array.isArray(currentDispute.attachments) &&
                  currentDispute.attachments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {t(
                            "provider.projects.detail.viewDispute.attachmentsTitle",
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {currentDispute.attachments.map(
                            (url: string, index: number) => {
                              const unknownUserLabel = t(
                                "provider.projects.detail.viewDispute.unknownUser",
                              );
                              const unknownDateLabel = t(
                                "provider.projects.detail.viewDispute.unknownDate",
                              );
                              // Extract filename from path
                              const normalized = url.replace(/\\/g, "/");
                              const filename =
                                normalized.split("/").pop() ||
                                t(
                                  "provider.projects.detail.viewDispute.attachmentFallback",
                                  { n: index + 1 },
                                );
                              // Remove timestamp prefix if present (format: timestamp_filename.ext)
                              const cleanFilename = filename.replace(
                                /^\d+_/,
                                "",
                              );

                              // Try to find attachment metadata in description
                              const attachmentMetadataMatch =
                                currentDispute.description?.match(
                                  new RegExp(
                                    `\\[Attachment: (.+?) uploaded by (.+?) on (.+?)\\]`,
                                    "g",
                                  ),
                                );
                              let uploadedBy = unknownUserLabel;
                              let uploadedAt = unknownDateLabel;

                              if (attachmentMetadataMatch) {
                                // Find matching metadata for this file
                                for (const meta of attachmentMetadataMatch) {
                                  const metaMatch = meta.match(
                                    /\[Attachment: (.+?) uploaded by (.+?) on (.+?)\]/,
                                  );
                                  if (metaMatch && metaMatch[1] === filename) {
                                    uploadedBy = metaMatch[2];
                                    uploadedAt = metaMatch[3];
                                    break;
                                  }
                                }
                              }

                              // Also check if it's from the original dispute creator
                              if (
                                uploadedBy === unknownUserLabel &&
                                index === 0 &&
                                currentDispute.attachments &&
                                currentDispute.attachments.length === 1
                              ) {
                                uploadedBy =
                                  currentDispute.raisedBy?.name ||
                                  unknownUserLabel;
                                uploadedAt = new Date(
                                  currentDispute.createdAt,
                                ).toLocaleString();
                              }

                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 border rounded"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {cleanFilename}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {t(
                                          "provider.projects.detail.viewDispute.uploadedByLine",
                                          {
                                            name: uploadedBy,
                                            date: uploadedAt,
                                          },
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                  {(() => {
                                    const attachmentUrl = getAttachmentUrl(url);
                                    const isR2Key =
                                      attachmentUrl === "#" ||
                                      (!attachmentUrl.startsWith("http") &&
                                        !attachmentUrl.startsWith(
                                          "/uploads/",
                                        ) &&
                                        !attachmentUrl.includes(
                                          process.env.NEXT_PUBLIC_API_URL ||
                                            "localhost",
                                        ));

                                    return (
                                      <a
                                        href={
                                          attachmentUrl === "#"
                                            ? undefined
                                            : attachmentUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={
                                          isR2Key
                                            ? async (e) => {
                                                e.preventDefault();
                                                try {
                                                  const downloadUrl =
                                                    await getR2DownloadUrl(url); // Use original URL/key - url is from the map function
                                                  window.open(
                                                    downloadUrl.downloadUrl,
                                                    "_blank",
                                                  );
                                                } catch (error) {
                                                  console.error(
                                                    "Failed to get download URL:",
                                                    error,
                                                  );
                                                  toast({
                                                    title: t(
                                                      "provider.projects.toast.error",
                                                    ),
                                                    description: t(
                                                      "provider.projects.toast.downloadFailed",
                                                    ),
                                                    variant: "destructive",
                                                  });
                                                }
                                              }
                                            : undefined
                                        }
                                      >
                                        <Button variant="outline" size="sm">
                                          <Download className="w-4 h-4 mr-2" />
                                          {t(
                                            "provider.projects.detail.viewDispute.download",
                                          )}
                                        </Button>
                                      </a>
                                    );
                                  })()}
                                </div>
                              );
                            },
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Add update only for the active (open) dispute while viewing it */}
                {activeDispute &&
                  currentDispute.id === activeDispute.id &&
                  currentDispute.status !== "CLOSED" &&
                  currentDispute.status !== "RESOLVED" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>
                          {t(
                            "provider.projects.detail.viewDispute.addUpdateTitle",
                          )}
                        </CardTitle>
                        <CardDescription>
                          {t(
                            "provider.projects.detail.viewDispute.addUpdateDesc",
                          )}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="disputeAdditionalNotes">
                            {t(
                              "provider.projects.detail.viewDispute.additionalNotes",
                            )}
                          </Label>
                          <Textarea
                            id="disputeAdditionalNotes"
                            placeholder={t(
                              "provider.projects.detail.viewDispute.additionalNotesPlaceholder",
                            )}
                            value={disputeAdditionalNotes}
                            onChange={(e) =>
                              setDisputeAdditionalNotes(e.target.value)
                            }
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label htmlFor="disputeUpdateAttachments">
                            {t(
                              "provider.projects.detail.viewDispute.additionalAttachments",
                            )}
                          </Label>
                          <Input
                            id="disputeUpdateAttachments"
                            type="file"
                            multiple
                            onChange={handleDisputeUpdateAttachmentChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.jpg,.png"
                          />
                          {disputeUpdateAttachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {disputeUpdateAttachments.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                                >
                                  <span>{file.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeDisputeUpdateAttachment(index)
                                    }
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={handleUpdateDispute}
                          disabled={
                            updatingDispute ||
                            (!disputeAdditionalNotes.trim() &&
                              disputeUpdateAttachments.length === 0)
                          }
                          className="w-full"
                        >
                          {updatingDispute ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {t(
                                "provider.projects.detail.viewDispute.updating",
                              )}
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              {t(
                                "provider.projects.detail.viewDispute.addUpdateButton",
                              )}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                {(currentDispute.status === "CLOSED" ||
                  currentDispute.status === "RESOLVED") && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-2 text-amber-900">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="font-medium text-sm leading-relaxed">
                          {currentDispute.status === "CLOSED"
                            ? t("provider.projects.detail.disputeClosedNotice")
                            : t(
                                "provider.projects.detail.disputeResolvedNotice",
                              )}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewDisputeDialogOpen(false)}
              >
                {t("provider.projects.detail.common.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    
  );
}
