"use client";
//projects
import React, { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Download,
  Edit,
  Eye,
  Send,
  Loader2,
  X,
  Check,
  Paperclip,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import NextLink from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import {
  getProjectById,
  getCompanyProjectRequests,
  getBidExplanation,
  acceptProjectRequest,
  rejectProjectRequest,
  createDispute,
  getDisputesByProject,
  updateDispute,
  getProfileImageUrl,
  getAttachmentUrl,
  getR2DownloadUrl,
} from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { updateCompanyProject } from "@/lib/api";
// ADD with the other imports
import {
  getCompanyProjectMilestones,
  updateCompanyProjectMilestones,
  approveCompanyMilestones,
  approveIndividualMilestone,
  requestMilestoneChanges,
  type Milestone,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  formatTimeline,
  formatDurationDays,
  timelineToDays,
} from "@/lib/timeline-utils";
import { cn } from "@/lib/utils";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import { RichEditor } from "@/components/markdown/RichTextEditor";
import MilestonePayment from "@/components/MilestonePayment";
import { useRecommendedProviders } from "@/hooks/useRecommendedProviders";
import { RecommendedProvidersList } from "@/components/customer/RecommendedProvidersList";
import type { RecommendedProvider } from "@/hooks/useRecommendedProviders";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { CustomerProjectReviewInline } from "@/components/customer/projects/CustomerProjectReviewInline";

// Project type definition
interface Project {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  timeline?: string;
  originalTimeline?: string | number;
  providerProposedTimeline?: string | number;
  budgetMin?: number | string;
  budgetMax?: number | string;
  progress?: number | string;
  status?: string;
  createdAt?: string | number | Date;
  startDate?: string | Date;
  startedAt?: string | Date;
  endDate?: string | Date;
  isFeatured?: boolean;
  currency?: string;
  customer?: {
    id?: string;
    name?: string;
  };
  provider?: {
    id?: string;
    name?: string;
  };
  assignedProvider?: {
    id?: string;
    name?: string;
    avatar?: string;
    providerProfile?: {
      profileImageUrl?: string;
      rating?: number;
      completedJobs?: number;
    };
  };
  [key: string]: unknown; // Allow additional properties
}

// Dispute type definition
interface Dispute {
  id?: string;
  status?: string;
  reason?: string;
  description?: string;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  contestedAmount?: number;
  suggestedResolution?: string;
  resolution?: string;
  milestone?: {
    title?: string;
    amount?: number;
  };
  raisedBy?: {
    id?: string;
    name?: string;
  };
  resolutionNotes?: Array<{
    note?: string;
    adminName?: string;
    createdAt?: string | number | Date;
  }>;
  attachments?: string[];
  [key: string]: unknown; // Allow additional properties
}

/** Milestone statuses that cannot be linked to a dispute (picker + submit validation). */
const DISPUTE_MILESTONE_EXCLUDED_STATUSES = new Set([
  "LOCKED",
  "DRAFT",
  "PAID",
  "DISBUTED",
  "APPROVED",
]);

/** AI Recommended Providers for an opportunity (ServiceRequest) – same UI as dashboard. */
function AIRecommendedProvidersSection({
  serviceRequestId,
  showScrollNote = false,
}: {
  serviceRequestId: string;
  showScrollNote?: boolean;
}) {
  const { t, locale } = useI18n();
  const { providers, loading, error } =
    useRecommendedProviders(serviceRequestId);
  const router = useRouter();
  const handleContact = (provider: RecommendedProvider) => {
    router.push(
      `/customer/messages?userId=${provider.id}&name=${encodeURIComponent(provider.name)}&avatar=${encodeURIComponent(provider.avatar)}`,
    );
  };
  return (
    <Card id="recommended-providers-section">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">
          {t("customer.projects.detail.aiRecommendedTitle")}
        </CardTitle>
        <CardDescription className="text-xs sm:text-sm">
          {t("customer.projects.detail.aiRecommendedDesc")}
        </CardDescription>
        {showScrollNote ? (
          <div className="mt-3 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs sm:text-sm text-blue-700">
            {t("customer.projects.detail.aiRecommendedScrollNote")}
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <RecommendedProvidersList
          providers={providers}
          loading={loading}
          error={error}
          onContact={handleContact}
          emptyMessage={t("customer.projects.detail.emptyRecommendations")}
        />
      </CardContent>
    </Card>
  );
}

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t, locale } = useI18n();
  const { toast: toastHook } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const shouldFocusRecommended =
    searchParams.get("focus") === "recommended-providers";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestChangesDialogOpen, setRequestChangesDialogOpen] =
    useState(false);
  const [requestChangesReason, setRequestChangesReason] = useState("");
  const [selectedMilestoneForReject, setSelectedMilestoneForReject] = useState<
    string | null
  >(null);
  const [approveMilestoneDialogOpen, setApproveMilestoneDialogOpen] =
    useState(false);
  const [milestoneIdPendingApprove, setMilestoneIdPendingApprove] = useState<
    string | null
  >(null);
  const [approvingIndividualMilestoneId, setApprovingIndividualMilestoneId] =
    useState<string | null>(null);
  const [selectedProposalForAction, setSelectedProposalForAction] =
    useState<ProviderRequest | null>(null);
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [acceptingProposal, setAcceptingProposal] =
    useState<ProviderRequest | null>(null);

  // for milestone editing after accepting
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [milestonesDraft, setMilestonesDraft] = useState<Milestone[]>([]);
  const [savingMilestonesModal, setSavingMilestonesModal] = useState(false);
  const [approvingMilestonesModal, setApprovingMilestonesModal] =
    useState(false);
  const [milestoneApprovalStateModal, setMilestoneApprovalStateModal] =
    useState({
      milestonesLocked: false,
      companyApproved: false,
      providerApproved: false,
      milestonesApprovedAt: null as string | null,
    });
  const [milestoneDraftErrors, setMilestoneDraftErrors] = useState<
    Record<
      number,
      {
        title?: string;
        description?: string;
        dueDate?: string;
        daysFromStart?: string;
        durationAmount?: string;
        durationUnit?: string;
      }
    >
  >({});
  const [originalMilestonesDraft, setOriginalMilestonesDraft] = useState<
    Milestone[]
  >([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [token, setToken] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [projectMessages, setProjectMessages] = useState<
    Record<string, unknown>[]
  >([]);
  const [projectFiles, setProjectFiels] = useState<Record<string, unknown>[]>(
    [],
  );

  // Extract id from params which may be a Promise in newer Next.js versions
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [edit, setEdit] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    timeline: "",
    budgetMin: "",
    budgetMax: "",
    skills: "", // comma/newline separated
    requirements: "", // one per line
    deliverables: "", // one per line
  });

  // Project milestone management
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [savingMilestones, setSavingMilestones] = useState(false);
  const [approvingMilestones, setApprovingMilestones] = useState(false);
  const [milestoneApprovalState, setMilestoneApprovalState] = useState({
    milestonesLocked: false,
    companyApproved: false,
    providerApproved: false,
    milestonesApprovedAt: null as string | null,
  });
  const [milestoneErrors, setMilestoneErrors] = useState<
    Record<
      number,
      {
        title?: string;
        description?: string;
        dueDate?: string;
        daysFromStart?: string;
        durationAmount?: string;
        durationUnit?: string;
      }
    >
  >({});
  const [originalProjectMilestones, setOriginalProjectMilestones] = useState<
    Milestone[]
  >([]);

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedMilestoneForPayment, setSelectedMilestoneForPayment] =
    useState<Milestone | null>(null);

  // controls the proposal "View Details" dialog
  const [proposalDetailsOpen, setProposalDetailsOpen] = useState(false);
  const [selectedProposalDetails, setSelectedProposalDetails] =
    useState<ProviderRequest | null>(null);

  // controls the post-accept milestone review/approval dialog
  const [milestoneFinalizeOpen, setMilestoneFinalizeOpen] = useState(false);

  // Dispute creation state
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [viewDisputeDialogOpen, setViewDisputeDialogOpen] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);
  const [projectDisputes, setProjectDisputes] = useState<Dispute[]>([]);
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
  interface ProviderRequest {
    id: string;
    providerId: string;
    providerName: string;
    providerAvatar: string;
    providerRating: number;
    providerLocation: string;
    projectId: string | undefined;
    projectTitle: string;
    bidAmount: number;
    proposedTimeline: string;
    deliveryTime?: string;
    coverLetter: string;
    status: "pending" | "accepted" | "rejected";
    submittedAt: string;
    createdAt?: string;
    skills: string[];
    portfolio: string[];
    experience: string;
    attachments: string[];
    attachmentUrls?: string[];
    milestones: Array<{
      title: string;
      description?: string;
      amount: number;
      dueDate?: string;
      daysFromStart?: number;
      order: number;
    }>;
    provider?: {
      id: string;
      name: string;
      avatar?: string;
      rating?: number;
      location?: string;
      providerProfile?: {
        profileImageUrl?: string;
      };
    };
    /** From backend ranking: 0–100 fit score. */
    matchScore?: number;
    /** 1-based rank (1 = best). */
    rank?: number;
    /** True if in top 5 fits. */
    isTopFive?: boolean;
    /** AI summary stored at proposal creation (why it fits + drawbacks). */
    aiFitExplanation?: string | Record<string, string> | null;
  }
  function normalizeExplanationLocale(locale: string): "en" | "id" | "ar" {
    const lower = String(locale || "en").toLowerCase();
    if (lower.startsWith("id")) return "id";
    if (lower.startsWith("ar")) return "ar";
    return "en";
  }
  function getLocalizedAiFitExplanation(
    value: string | Record<string, string> | null | undefined,
    locale: string,
  ): string {
    if (typeof value === "string") return value.trim();
    if (!value || typeof value !== "object") return "";
    const localeKey = normalizeExplanationLocale(locale);
    const byLocale = typeof value[localeKey] === "string" ? value[localeKey].trim() : "";
    const en = typeof value.en === "string" ? value.en.trim() : "";
    const id = typeof value.id === "string" ? value.id.trim() : "";
    const ar = typeof value.ar === "string" ? value.ar.trim() : "";
    return byLocale || en || id || ar || "";
  }
  function hasAiFitExplanationForLocale(
    value: string | Record<string, string> | null | undefined,
    locale: string,
  ): boolean {
    const localeKey = normalizeExplanationLocale(locale);
    if (typeof value === "string") {
      return localeKey === "en" && value.trim().length > 0;
    }
    if (!value || typeof value !== "object") return false;
    const text = value[localeKey];
    return typeof text === "string" && text.trim().length > 0;
  }
  const isImage = (file: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file);

  const isPDF = (file: string) => /\.pdf$/i.test(file);

  const getFullUrl = (path: string) => {
    const normalized = path.replace(/\\/g, "/");
    return normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `${process.env.NEXT_PUBLIC_API_URL}/${normalized.replace(/^\//, "")}`;
  };

  // this array drives the Bids tab UI
  const [proposals, setProposals] = useState<ProviderRequest[]>([]);

  // optional loading/error for bids section
  const [bidsLoading, setBidsLoading] = useState<boolean>(true);
  const [bidsError, setBidsError] = useState<string | null>(null);
  // AI "why this bid" explanation for top 5 (hover)
  const [openExplanationId, setOpenExplanationId] = useState<string | null>(
    null,
  );
  const [explanationCache, setExplanationCache] = useState<
    Record<string, string>
  >({});
  const [explanationLoading, setExplanationLoading] = useState<
    Record<string, boolean>
  >({});
  /** On small screens: which proposal card is showing the AI summary in-place (replacing card content). */
  const [cardSummaryViewId, setCardSummaryViewId] = useState<string | null>(
    null,
  );
  const fetchedExplanationIds = React.useRef<Set<string>>(new Set());
  const bidPanelLeaveTimeoutRef = React.useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const cardRefsMap = React.useRef<Record<string, HTMLDivElement | null>>({});
  const rightPanelColumnRef = React.useRef<HTMLDivElement | null>(null);
  const [panelTopOffset, setPanelTopOffset] = React.useState(0);

  const getBidSummary = (
    proposalId: string,
    stored: string | Record<string, string> | null | undefined,
    cached: string | undefined,
  ) => {
    const text = getLocalizedAiFitExplanation(stored, locale) || (cached && cached.trim());
    return text || t("customer.projects.detail.defaultBidSummary");
  };

  // Align right panel with the hovered card (desktop only)
  useEffect(() => {
    if (!openExplanationId || !rightPanelColumnRef.current) {
      setPanelTopOffset(0);
      return;
    }
    const cardEl = cardRefsMap.current[openExplanationId];
    if (!cardEl) {
      setPanelTopOffset(0);
      return;
    }
    const updatePosition = () => {
      const col = rightPanelColumnRef.current;
      if (!cardEl || !col) return;
      const cardRect = cardEl.getBoundingClientRect();
      const colRect = col.getBoundingClientRect();
      setPanelTopOffset(Math.max(0, cardRect.top - colRect.top));
    };
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [openExplanationId]);

  // Fetch AI bid explanation only for legacy proposals (no stored aiFitExplanation)
  useEffect(() => {
    if (!openExplanationId) return;
    const hasStoredForLocale = hasAiFitExplanationForLocale(
      proposals.find(
      (x) => x.id === openExplanationId,
      )?.aiFitExplanation,
      locale,
    );
    if (hasStoredForLocale) return; // Use stored locale value, no fetch
    if (fetchedExplanationIds.current.has(openExplanationId)) return;
    fetchedExplanationIds.current.add(openExplanationId);
    setExplanationLoading((prev) => ({ ...prev, [openExplanationId]: true }));
    getBidExplanation(openExplanationId, locale)
      .then((r) => {
        if (r.success && r.explanation)
          setExplanationCache((prev) => ({
            ...prev,
            [openExplanationId]: r.explanation!,
          }));
      })
      .catch(() => {})
      .finally(() =>
        setExplanationLoading((prev) => ({
          ...prev,
          [openExplanationId]: false,
        })),
      );
  }, [locale, openExplanationId, proposals]);

  useEffect(() => {
    fetchedExplanationIds.current.clear();
    setExplanationCache({});
    setExplanationLoading({});
  }, [locale]);

  useEffect(() => {
    if (!project) return;
    // Convert requirements/deliverables: if array, convert to markdown; if string, use as-is
    const convertToMarkdown = (value: unknown): string => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (Array.isArray(value)) {
        const items = value.map(String).filter(Boolean);
        return items.length > 0
          ? items.map((item) => `- ${item}`).join("\n")
          : "";
      }
      return "";
    };

    setEdit({
      title: (typeof project.title === "string" ? project.title : "") ?? "",
      description:
        (typeof project.description === "string" ? project.description : "") ??
        "",
      category:
        (typeof project.category === "string" ? project.category : "") ?? "",
      priority:
        (typeof project.priority === "string" ? project.priority : "") ?? "",
      timeline:
        (typeof project.timeline === "string" ? project.timeline : "") ?? "",
      budgetMin:
        (typeof project.budgetMin === "number"
          ? project.budgetMin.toString()
          : typeof project.budgetMin === "string"
            ? project.budgetMin
            : "") ?? "",
      budgetMax:
        (typeof project.budgetMax === "number"
          ? project.budgetMax.toString()
          : typeof project.budgetMax === "string"
            ? project.budgetMax
            : "") ?? "",
      skills: (Array.isArray(project.skills) ? project.skills : []).join(", "),
      requirements: convertToMarkdown(project.requirements),
      deliverables: convertToMarkdown(project.deliverables),
    });
  }, [project]);

  const toLines = (s: string) =>
    s
      .split(/\r?\n|,/)
      .map((x) => x.trim())
      .filter(Boolean);

  useEffect(() => {
    let mounted = true;
    Promise.resolve(params)
      .then((p: { id?: string }) => {
        if (mounted) setResolvedId(p?.id ?? null);
      })
      .catch(() => {
        if (mounted) setResolvedId(null);
      });
    return () => {
      mounted = false;
    };
  }, [params]);

  useEffect(() => {
    if (!shouldFocusRecommended || loading) return;
    const target = document.getElementById("recommended-providers-section");
    if (!target) return;

    const timer = window.setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);

    return () => window.clearTimeout(timer);
  }, [shouldFocusRecommended, loading, project?.id, project?.type]);

  // Load auth token and user from localStorage (client-side)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const t = localStorage.getItem("token") || "";
      const u = localStorage.getItem("user");
      setToken(t);
      setCurrentUser(u ? JSON.parse(u) : null);
    } catch (e) {
      console.error("Error loading auth info:", e);
    }
  }, []);

  // Fetch messages between the two project participants when Messages tab is opened
  const fetchProjectMessages = async () => {
    if (!token || !project) return;
    try {
      const currentUserId = (currentUser as { id?: string } | null)?.id;
      const providerId =
        (typeof project.providerId === "string"
          ? project.providerId
          : undefined) || (project.provider as { id?: string } | undefined)?.id;
      const customerId =
        (typeof project.customerId === "string"
          ? project.customerId
          : undefined) || (project.customer as { id?: string } | undefined)?.id;
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
        const threadProjectId = String(project.id ?? resolvedId ?? "");
        const filtered = Array.isArray(data.data)
          ? data.data.filter(
              (msg: Record<string, unknown>) =>
                String(msg.projectId) === threadProjectId,
            )
          : [];

        setProjectMessages(Array.isArray(data.data) ? data.data : []);
        setProjectFiels(filtered);
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
    if (activeTab === "messages" || activeTab === "files") {
      fetchProjectMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token, project]);

  // Safe formatter for numbers - prevents calling toLocaleString on undefined
  const fmt = (v: unknown, fallback = "0"): string => {
    if (v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : fallback;
  };

  // Ensure a value is an array before mapping
  const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);

  // Helper function to map API proposals to ProviderRequest format
  const mapProposalsToProviderRequests = useCallback(
    (rawProposals: Record<string, unknown>[]): ProviderRequest[] => {
      return rawProposals.map((p: Record<string, unknown>): ProviderRequest => {
        const provider = (p.provider as Record<string, unknown>) || {};
        const profile =
          (provider.providerProfile as Record<string, unknown>) || {};

        return {
          id: p.id as string,
          providerId: provider.id as string,
          providerName: provider.name as string,
          providerAvatar: getProfileImageUrl(
            profile.profileImageUrl as string | undefined,
          ),
          providerRating:
            (profile.rating as number | undefined) ??
            (provider.rating as number | undefined) ??
            0,
          providerLocation:
            (profile.location as string | undefined) ??
            (provider.location as string | undefined) ??
            "",
          projectId: (p.serviceRequest as Record<string, unknown> | undefined)
            ?.id as string | undefined,
          projectTitle:
            ((p.serviceRequest as Record<string, unknown> | undefined)
              ?.title as string | undefined) ?? "",
          bidAmount: p.bidAmount as number,
          proposedTimeline:
            formatTimeline(
              p.deliveryTime as string | number | undefined,
              "day",
            ) || "",
          coverLetter: p.coverLetter as string,
          status: p.status
            ? (String(p.status).toLowerCase() as
                | "pending"
                | "accepted"
                | "rejected")
            : "pending",
          submittedAt:
            (p.createdAt as string | undefined) ||
            (p.submittedAt as string | undefined) ||
            "",
          skills: Array.isArray(profile.skills)
            ? (profile.skills as string[])
            : Array.isArray(provider.skills)
              ? (provider.skills as string[])
              : [],
          portfolio: Array.isArray(profile.portfolios)
            ? (profile.portfolios as string[])
            : Array.isArray(provider.portfolio)
              ? (provider.portfolio as string[])
              : [],
          experience:
            (profile.experience as string | undefined) ??
            (provider.experience as string | undefined) ??
            "",
          attachments: Array.isArray(p.attachmentUrls)
            ? (p.attachmentUrls as string[])
            : [],
          milestones: Array.isArray(p.milestones)
            ? p.milestones.map(
                (m: {
                  title: string;
                  description?: string;
                  amount: number;
                  dueDate?: string;
                  daysFromStart?: number | string;
                  order?: number;
                  sequence?: number;
                }) => ({
                  title: m.title,
                  description: m.description,
                  amount: m.amount,
                  dueDate: m.dueDate,
                  daysFromStart:
                    m.daysFromStart != null
                      ? Number(m.daysFromStart)
                      : undefined,
                  order: m.order ?? m.sequence ?? 0,
                }),
              )
            : [],
          matchScore: p.matchScore as number | undefined,
          rank: p.rank as number | undefined,
          isTopFive: p.isTopFive as boolean | undefined,
          aiFitExplanation:
            (p.aiFitExplanation as string | Record<string, string> | undefined) ??
            null,
        };
      });
    },
    [],
  );

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

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (
      tab === "overview" ||
      tab === "milestones" ||
      tab === "bids" ||
      tab === "files" ||
      tab === "messages"
    ) {
      setActiveTab(tab);
    }
  }, [searchParams]);

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
        res.success && Array.isArray(res.data) ? (res.data as Dispute[]) : [];
      setProjectDisputes(list);
      return list;
    } catch {
      setProjectDisputes([]);
      return [];
    }
  }, []);

  // Fetch project data + proposals (bids)
  useEffect(() => {
    const fetchAll = async () => {
      if (!resolvedId) return;

      try {
        // page-level loading
        setLoading(true);
        setError(null);

        // bids-section loading
        setBidsLoading(true);
        setBidsError(null);

        // 1. load the project / service request
        const projectRes = await getProjectById(resolvedId);

        if (!projectRes?.success || !projectRes.project) {
          throw new Error("Failed to fetch project");
        }

        const loadedProject = projectRes.project;
        const loadedId = String(loadedProject.id ?? "");
        if (
          loadedId &&
          resolvedId &&
          loadedId !== String(resolvedId)
        ) {
          const qs = searchParams.toString();
          router.replace(
            `/customer/projects/${loadedId}${qs ? `?${qs}` : ""}`,
          );
        }
        setProject(loadedProject);

        try {
          await loadProjectDisputes(loadedProject.id as string);
        } catch {
          console.log("No disputes loaded for project");
        }

        // figure out the "request id" to ask proposals for
        // For ServiceRequest: use the project id (which IS the serviceRequestId)
        // For Project: use serviceRequestId from the response (the original ServiceRequest that created this Project)
        let serviceRequestId: string | null = null;
        if (loadedProject.type === "ServiceRequest") {
          serviceRequestId = loadedProject.id;
        } else {
          // For Projects, use the serviceRequestId from backend (if available)
          const projectRecord = loadedProject as Record<string, unknown>;
          serviceRequestId =
            (projectRecord?.serviceRequestId as string | undefined) ||
            (projectRecord?.originalRequestId as string | undefined) ||
            null;
        }

        // 2. load proposals/bids the same way Requests page does (only if we have a valid serviceRequestId)
        if (serviceRequestId) {
          const proposalsResponse = await getCompanyProjectRequests({
            serviceRequestId,
            sort: "newest",
          });

          // 3. normalize proposalsResponse to an array
          const rawProposals = Array.isArray(proposalsResponse?.proposals)
            ? proposalsResponse.proposals
            : Array.isArray(proposalsResponse?.data)
              ? proposalsResponse.data
              : Array.isArray(proposalsResponse?.items)
                ? proposalsResponse.items
                : [];

          // 4. map raw proposals -> ProviderRequest[]
          const mappedProposals = mapProposalsToProviderRequests(rawProposals);
          setProposals(mappedProposals);
        } else {
          // No serviceRequestId means this Project wasn't created from a ServiceRequest (unlikely but handle gracefully)
          console.warn(
            "No serviceRequestId found for Project, cannot load proposals",
          );
          setProposals([]);
        }
      } catch (err: unknown) {
        const errorMessage = getUserFriendlyErrorMessage(
          err,
          "customer project detail load",
        );
        setError(errorMessage);
        setBidsError(errorMessage);
        setProposals([]);
      } finally {
        setLoading(false);
        setBidsLoading(false);
      }
    };

    fetchAll();
  }, [resolvedId, mapProposalsToProviderRequests, loadProjectDisputes, router]);

  // Function to refresh all project data
  const refreshProjectData = async () => {
    if (!resolvedId) return;
    try {
      // Refresh project data
      const projectRes = await getProjectById(resolvedId);
      if (!projectRes?.success || !projectRes.project) {
        return;
      }

      const loadedProject = projectRes.project;
      const loadedId = String(loadedProject.id ?? "");
      if (loadedId && resolvedId && loadedId !== String(resolvedId)) {
        const qs = searchParams.toString();
        router.replace(
          `/customer/projects/${loadedId}${qs ? `?${qs}` : ""}`,
        );
      }
      setProject(loadedProject);

      // Refresh milestones
      const milestoneData = await getCompanyProjectMilestones(loadedProject.id);
      const loadedMilestones: Milestone[] = Array.isArray(
        milestoneData.milestones,
      )
        ? milestoneData.milestones.map(
            (m: Milestone | Record<string, unknown>) =>
              ({
                ...(m as Milestone),
                sequence: ((m as Milestone).order ??
                  (m as Record<string, unknown>).order) as number,
                submissionAttachmentUrl: ((m as Milestone)
                  .submissionAttachmentUrl ??
                  (m as Record<string, unknown>).submissionAttachmentUrl) as
                  | string
                  | undefined,
                submissionNote: ((m as Milestone).submissionNote ??
                  (m as Record<string, unknown>).submissionNote) as
                  | string
                  | undefined,
                submittedAt: ((m as Milestone).submittedAt ??
                  (m as Record<string, unknown>).submittedAt) as
                  | string
                  | undefined,
                startDeliverables: ((m as Milestone).startDeliverables ??
                  (m as Record<string, unknown>).startDeliverables) as
                  | string
                  | undefined,
                submitDeliverables: ((m as Milestone).submitDeliverables ??
                  (m as Record<string, unknown>).submitDeliverables) as
                  | string
                  | undefined,
                revisionNumber: ((m as Milestone).revisionNumber ??
                  (m as Record<string, unknown>).revisionNumber) as
                  | number
                  | undefined,
                submissionHistory: ((m as Milestone).submissionHistory ??
                  (m as Record<string, unknown>).submissionHistory) as
                  | unknown[]
                  | undefined,
              }) as Milestone,
          )
        : [];
      const sortedLoad = [...loadedMilestones].sort(
        (a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0),
      );
      const withDuration = sortedLoad.map((m, i) => {
        const prev = sortedLoad[i - 1] as
          | { daysFromStart?: number }
          | undefined;
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
      setOriginalProjectMilestones(JSON.parse(JSON.stringify(withDuration)));
      setMilestoneApprovalState({
        milestonesLocked: milestoneData.milestonesLocked,
        companyApproved: milestoneData.companyApproved,
        providerApproved: milestoneData.providerApproved,
        milestonesApprovedAt: milestoneData.milestonesApprovedAt,
      });

      await loadProjectDisputes(loadedProject.id as string);

      // Refresh proposals/bids
      let serviceRequestId: string | null = null;
      if (loadedProject.type === "ServiceRequest") {
        serviceRequestId = loadedProject.id;
      } else {
        const projectRecord = loadedProject as Record<string, unknown>;
        serviceRequestId =
          (projectRecord?.serviceRequestId as string | undefined) ||
          (projectRecord?.originalRequestId as string | undefined) ||
          null;
      }

      if (serviceRequestId) {
        try {
          const proposalsResponse = await getCompanyProjectRequests({
            serviceRequestId,
            sort: "newest",
          });

          const rawProposals = Array.isArray(proposalsResponse?.proposals)
            ? proposalsResponse.proposals
            : Array.isArray(proposalsResponse?.data)
              ? proposalsResponse.data
              : Array.isArray(proposalsResponse?.items)
                ? proposalsResponse.items
                : [];

          const mappedProposals = mapProposalsToProviderRequests(rawProposals);
          setProposals(mappedProposals);
        } catch {
          console.warn("Failed to refresh proposals");
        }
      }
    } catch (err) {
      console.error("Error refreshing project data:", err);
    }
  };

  // Load project milestones
  useEffect(() => {
    (async () => {
      if (!project?.id) return;
      try {
        const milestoneData = await getCompanyProjectMilestones(
          project.id as string,
        );
        const loadedMilestones: Milestone[] = Array.isArray(
          milestoneData.milestones,
        )
          ? milestoneData.milestones.map(
              (m: Milestone | Record<string, unknown>) =>
                ({
                  ...(m as Milestone),
                  sequence: ((m as Milestone).order ??
                    (m as Record<string, unknown>).order) as number,
                  submissionAttachmentUrl: ((m as Milestone)
                    .submissionAttachmentUrl ??
                    (m as Record<string, unknown>).submissionAttachmentUrl) as
                    | string
                    | undefined,
                  submissionNote: ((m as Milestone).submissionNote ??
                    (m as Record<string, unknown>).submissionNote) as
                    | string
                    | undefined,
                  submittedAt: ((m as Milestone).submittedAt ??
                    (m as Record<string, unknown>).submittedAt) as
                    | string
                    | undefined,
                  startDeliverables: ((m as Milestone).startDeliverables ??
                    (m as Record<string, unknown>).startDeliverables) as
                    | string
                    | undefined,
                  submitDeliverables: ((m as Milestone).submitDeliverables ??
                    (m as Record<string, unknown>).submitDeliverables) as
                    | string
                    | undefined,
                  revisionNumber: ((m as Milestone).revisionNumber ??
                    (m as Record<string, unknown>).revisionNumber) as
                    | number
                    | undefined,
                  submissionHistory: ((m as Milestone).submissionHistory ??
                    (m as Record<string, unknown>).submissionHistory) as
                    | unknown[]
                    | undefined,
                }) as Milestone,
            )
          : [];
        const sortedLoad2 = [...loadedMilestones].sort(
          (a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0),
        );
        const withDuration2 = sortedLoad2.map((m, i) => {
          const prev = sortedLoad2[i - 1] as
            | { daysFromStart?: number }
            | undefined;
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
        setProjectMilestones(withDuration2);
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

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 px-4 py-4 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-56 sm:w-72" />
            <Skeleton className="h-4 w-40 sm:w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-36" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </CardContent>
        </Card>

        <div className="flex items-center justify-center pt-2">
          <span className="text-sm text-muted-foreground">
            {t("customer.projects.detail.loading")}
          </span>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center py-8 sm:py-12 px-4">
        <div className="text-center">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            {t("customer.projects.detail.errorTitle")}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
            {error || t("customer.projects.detail.notFound")}
          </p>
          <Button
            onClick={() => window.location.reload()}
            size="sm"
            className="sm:size-default"
          >
            {t("customer.projects.detail.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  const norm = (s: unknown) => String(s || "").toUpperCase();

  const getStatusColor = (status: string) => {
    const S = norm(status);
    switch (S) {
      case "COMPLETED":
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
      case "OPEN":
      case "PENDING":
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "ON_HOLD":
      case "CANCELLED":
      case "REJECTED":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    const S = norm(status);
    const map: Record<string, MessageKey> = {
      COMPLETED: "customer.dashboard.status.completed",
      PAID: "customer.projects.milestone.paid",
      APPROVED: "customer.projects.milestone.approved",
      SUBMITTED: "customer.projects.milestone.submitted",
      IN_PROGRESS: "customer.projects.milestone.inProgress",
      LOCKED: "customer.projects.milestone.locked",
      OPEN: "customer.projects.milestone.pending",
      PENDING: "customer.projects.milestone.pending",
      DRAFT: "customer.projects.milestone.draft",
      ON_HOLD: "customer.projects.milestone.onHold",
      CANCELLED: "customer.dashboard.status.cancelled",
      REJECTED: "customer.projects.milestone.rejected",
    };
    const key = map[S];
    return key ? t(key) : status;
  };

  const getMilestoneStatusIcon = (status: string) => {
    const S = norm(status);
    switch (S) {
      case "PAID":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "SUBMITTED":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "LOCKED":
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      case "PENDING":
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case "DRAFT":
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const paidMilestonesForDispute = projectMilestones.filter(
    (m: Milestone) =>
      Boolean(m.status) &&
      !DISPUTE_MILESTONE_EXCLUDED_STATUSES.has(m.status as string),
  );
  const disputeMilestoneSubmitBlocked =
    projectMilestones.length > 0 &&
    (paidMilestonesForDispute.length > 0
      ? !selectedMilestoneForDispute
      : !projectLevelDisputeAck);

  // Helpers for project milestone editor
  const normalizeMilestoneSequences = (items: Milestone[]): Milestone[] =>
    items
      .map((m, i) => ({ ...m, sequence: i + 1 }) as Milestone)
      .sort((a, b) => a.sequence - b.sequence);

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

  // Normalize project data to safe arrays to avoid runtime errors
  const safeProject = project ?? {};
  const skills = asArray<string>(safeProject.skills);
  // Requirements and deliverables are now markdown strings
  const requirements =
    typeof safeProject.requirements === "string"
      ? safeProject.requirements
      : Array.isArray(safeProject.requirements)
        ? safeProject.requirements
            .map((r: unknown) => `- ${String(r)}`)
            .join("\n")
        : "";
  const deliverables =
    typeof safeProject.deliverables === "string"
      ? safeProject.deliverables
      : Array.isArray(safeProject.deliverables)
        ? safeProject.deliverables
            .map((d: unknown) => `- ${String(d)}`)
            .join("\n")
        : "";
  const messages = asArray<Record<string, unknown>>(safeProject.messages);
  const currentUserId = currentUser?.id;
  const msgsToRender =
    projectMessages && projectMessages.length > 0 ? projectMessages : messages;

  const handleContact = (
    providerId?: string,
    providerName?: string,
    providerAvatar?: string,
  ) => {
    if (!providerId || !providerName) return;
    router.push(
      `/customer/messages?userId=${providerId}&name=${encodeURIComponent(
        providerName,
      )}&avatar=${encodeURIComponent(providerAvatar || "")}`,
    );
  };
  // ⬇️ ADD THIS just after you define `project` (and `proposals` if present)
  const currency: string =
    typeof project?.displayCurrencyCode === "string"
      ? project.displayCurrencyCode
      : typeof project?.currencyCode === "string"
        ? project.currencyCode
        : "MYR";
  const bidCount = Number(
    project?.bidCount ?? (Array.isArray(proposals) ? proposals.length : 0),
  );
  const startDate = project?.startDate
    ? new Date(project.startDate as string | number | Date)
    : null;
  const endDate = project?.endDate
    ? new Date(project.endDate as string | number | Date)
    : null;

  // Compute project stats values with proper typing
  const approvedPriceValue: number = project
    ? typeof project.approvedPrice === "number"
      ? project.approvedPrice
      : typeof project.approvedPrice === "string"
        ? Number(project.approvedPrice) || 0
        : 0
    : 0;

  const totalSpentValue: number = project
    ? typeof project.totalSpent === "number"
      ? project.totalSpent
      : typeof project.totalSpent === "string"
        ? Number(project.totalSpent) || 0
        : 0
    : 0;

  const progressValue: number = project
    ? typeof project.progress === "number"
      ? project.progress
      : typeof project.progress === "string"
        ? Number(project.progress) || 0
        : 0
    : 0;

  const daysLeftValue: number | null = (() => {
    if (
      !project ||
      project.daysLeft === null ||
      project.daysLeft === undefined
    ) {
      return null;
    }
    if (typeof project.daysLeft === "number") {
      return project.daysLeft;
    }
    if (typeof project.daysLeft === "string") {
      const parsed = Number(project.daysLeft);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  })();

  const handleSave = async () => {
    try {
      const payload: Record<string, unknown> = {
        title: edit.title,
        description: edit.description,
        category: edit.category,
        priority: edit.priority,
        timeline: edit.timeline,
      };

      if (edit.budgetMin) payload.budgetMin = Number(edit.budgetMin);
      if (edit.budgetMax) payload.budgetMax = Number(edit.budgetMax);

      const skillsArr = toLines(edit.skills);
      if (skillsArr.length) payload.skills = skillsArr;

      // Send markdown strings directly
      if (edit.requirements?.trim())
        payload.requirements = edit.requirements.trim();
      if (edit.deliverables?.trim())
        payload.deliverables = edit.deliverables.trim();

      const { project: updated } = await updateCompanyProject(
        project.id as string,
        payload,
      );
      setProject(updated);
      toast({
        title: t("customer.projects.detail.toast.savedTitle"),
        description: t("customer.projects.detail.toast.savedDesc"),
      });
      setIsEditOpen(false);
    } catch (err) {
      toast({
        title: t("customer.projects.detail.toast.updateFailedTitle"),
        description: getUserFriendlyErrorMessage(
          err,
          "customer project detail update",
        ),
        variant: "destructive",
      });
    }
  };

  // ADD - save draft
  const handleSaveProjectMilestones = async () => {
    if (!project?.id) return;

    type Err = {
      title?: string;
      description?: string;
      dueDate?: string;
      daysFromStart?: string;
      durationAmount?: string;
      durationUnit?: string;
    };
    const errors: Record<number, Err> = {};
    let hasErrors = false;
    projectMilestones.forEach((m, idx) => {
      const milestoneErrors: Err = {};
      const mm = m as Milestone & {
        durationAmount?: string;
        durationUnit?: string;
      };

      if (!m.title || !m.title.trim()) {
        milestoneErrors.title = t("customer.projects.detail.validation.titleRequired");
        hasErrors = true;
      }
      if (!m.description || !m.description.trim()) {
        milestoneErrors.description = t(
          "customer.projects.detail.validation.descriptionRequired",
        );
        hasErrors = true;
      }
      const durAmount =
        mm.durationAmount != null ? String(mm.durationAmount).trim() : "";
      const durUnit = mm.durationUnit || "";
      if (!durAmount || Number(durAmount) <= 0) {
        milestoneErrors.durationAmount = t(
          "customer.projects.detail.validation.durationAmount",
        );
        hasErrors = true;
      }
      if (!durUnit) {
        milestoneErrors.durationUnit = t(
          "customer.projects.detail.validation.unitRequired",
        );
        hasErrors = true;
      }
      if (Object.keys(milestoneErrors).length > 0)
        errors[idx] = milestoneErrors;
    });

    // Validate milestone sum equals bid amount
    const approvedPrice =
      typeof project?.approvedPrice === "number"
        ? project.approvedPrice
        : typeof project?.approvedPrice === "string"
          ? Number(project.approvedPrice)
          : 0;
    const bidAmountValue =
      typeof project?.bidAmount === "number"
        ? project.bidAmount
        : typeof project?.bidAmount === "string"
          ? Number(project.bidAmount)
          : 0;
    const bidAmount = approvedPrice || bidAmountValue || 0;
    if (bidAmount > 0) {
      const sumMilestones = projectMilestones.reduce(
        (sum: number, m: Milestone) => {
          const val = Number(m.amount);
          if (!isNaN(val)) return sum + val;
          return sum;
        },
        0,
      );

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

    if (hasErrors) {
      setMilestoneErrors(errors);
      toast({
        title: t("customer.projects.detail.toast.validationTitle"),
        description: t("customer.projects.detail.toast.milestoneValidationDesc"),
        variant: "destructive",
      });
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
      const res = await updateCompanyProjectMilestones(
        project.id as string,
        payload,
      );
      setMilestoneApprovalState({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      // Refresh milestones from API
      const milestoneData = await getCompanyProjectMilestones(
        project.id as string,
      );
      const refreshedMilestones: Milestone[] = Array.isArray(
        milestoneData.milestones,
      )
        ? milestoneData.milestones.map(
            (m: Milestone | Record<string, unknown>) =>
              ({
                ...(m as Milestone),
                sequence: ((m as Milestone).order ??
                  (m as Record<string, unknown>).order) as number,
                submissionAttachmentUrl: ((m as Milestone)
                  .submissionAttachmentUrl ??
                  (m as Record<string, unknown>).submissionAttachmentUrl) as
                  | string
                  | undefined,
                submissionNote: ((m as Milestone).submissionNote ??
                  (m as Record<string, unknown>).submissionNote) as
                  | string
                  | undefined,
                submittedAt: ((m as Milestone).submittedAt ??
                  (m as Record<string, unknown>).submittedAt) as
                  | string
                  | undefined,
                startDeliverables: ((m as Milestone).startDeliverables ??
                  (m as Record<string, unknown>).startDeliverables) as
                  | string
                  | undefined,
                submitDeliverables: ((m as Milestone).submitDeliverables ??
                  (m as Record<string, unknown>).submitDeliverables) as
                  | string
                  | undefined,
                revisionNumber: ((m as Milestone).revisionNumber ??
                  (m as Record<string, unknown>).revisionNumber) as
                  | number
                  | undefined,
                submissionHistory: ((m as Milestone).submissionHistory ??
                  (m as Record<string, unknown>).submissionHistory) as
                  | unknown[]
                  | undefined,
              }) as Milestone,
          )
        : [];
      const sortedRef = [...refreshedMilestones].sort(
        (a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0),
      );
      const withDurationRef = sortedRef.map((m, i) => {
        const prev = sortedRef[i - 1] as { daysFromStart?: number } | undefined;
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

      setProjectMilestones(withDurationRef);
      setOriginalProjectMilestones(JSON.parse(JSON.stringify(withDurationRef)));

      await refreshProjectData();

      toast({
        title: t("customer.projects.detail.toast.milestonesUpdatedTitle"),
        description: t("customer.projects.detail.toast.milestonesUpdatedDesc"),
      });
    } catch (e) {
      toast({
        title: t("customer.projects.detail.toast.saveFailedTitle"),
        description: getUserFriendlyErrorMessage(
          e,
          "customer project detail save milestones",
        ),
        variant: "destructive",
      });
    } finally {
      setSavingMilestones(false);
    }
  };

  // ADD - confirm
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

      // Refresh project data to get updated milestones
      await refreshProjectData();

      // Toast feedback
      toast({
        title: t("customer.projects.detail.toast.milestonesApprovedTitle"),
        description: res.milestonesLocked
          ? t("customer.projects.detail.toast.milestonesApprovedLockedDesc")
          : t("customer.projects.detail.toast.milestonesApprovedWaitingDesc"),
      });

      // Pop the finalize/summary dialog
      setMilestoneFinalizeOpen(true);
    } catch (e) {
      toast({
        title: t("customer.projects.detail.toast.approvalFailedTitle"),
        description: getUserFriendlyErrorMessage(
          e,
          "customer project detail approve milestones",
        ),
        variant: "destructive",
      });
    } finally {
      setApprovingMilestones(false);
    }
  };

  // Approve individual milestone (after confirmation)
  const handleApproveIndividualMilestone = async (milestoneId: string) => {
    try {
      setApprovingIndividualMilestoneId(milestoneId);
      await approveIndividualMilestone(milestoneId);

      // Refresh all project data including milestones
      await refreshProjectData();

      toast({
        title: t("customer.projects.detail.toast.milestoneApprovedTitle"),
        description: t("customer.projects.detail.toast.milestoneApprovedDesc"),
      });
      setApproveMilestoneDialogOpen(false);
      setMilestoneIdPendingApprove(null);
    } catch (e) {
      toast({
        title: t("customer.projects.detail.toast.approvalFailedTitle"),
        description: getUserFriendlyErrorMessage(
          e,
          "customer project detail approve milestone",
        ),
        variant: "destructive",
      });
    } finally {
      setApprovingIndividualMilestoneId(null);
    }
  };

  const handleOpenApproveMilestoneDialog = (milestoneId: string) => {
    setMilestoneIdPendingApprove(milestoneId);
    setApproveMilestoneDialogOpen(true);
  };

  const handleCancelApproveMilestone = () => {
    if (approvingIndividualMilestoneId) return;
    setApproveMilestoneDialogOpen(false);
    setMilestoneIdPendingApprove(null);
  };

  const handleConfirmApproveMilestone = () => {
    if (!milestoneIdPendingApprove) return;
    void handleApproveIndividualMilestone(milestoneIdPendingApprove);
  };

  // Open request changes dialog
  const handleRequestChangesClick = (milestoneId: string) => {
    setSelectedMilestoneForReject(milestoneId);
    setRequestChangesReason("");
    setRequestChangesDialogOpen(true);
  };

  // Reject milestone (request changes)
  const handleRejectMilestone = async () => {
    if (!selectedMilestoneForReject) return;

    if (!requestChangesReason.trim()) {
      toast({
        title: t("customer.projects.detail.toast.notesRequiredTitle"),
        description: t("customer.projects.detail.toast.notesRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    try {
      // Request changes - this will reset milestone to IN_PROGRESS and save to history
      await requestMilestoneChanges(
        selectedMilestoneForReject,
        requestChangesReason.trim(),
      );

      // Refresh all project data including milestones
      await refreshProjectData();

      // Close dialog and reset
      setRequestChangesDialogOpen(false);
      setSelectedMilestoneForReject(null);
      setRequestChangesReason("");

      toast({
        title: t("customer.projects.detail.toast.changesRequestedTitle"),
        description: t("customer.projects.detail.toast.changesRequestedDesc"),
      });
    } catch (e) {
      toast({
        title: t("customer.projects.detail.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          e,
          "customer project detail request changes",
        ),
        variant: "destructive",
      });
    }
  };

  // Handle payment button click
  const handlePayMilestone = (milestoneId: string) => {
    const milestone = projectMilestones.find((m) => m.id === milestoneId);
    if (milestone) {
      setSelectedMilestoneForPayment(milestone);
      setPaymentDialogOpen(true);
    }
  };

  const handleAcceptProposal = async (proposal: ProviderRequest) => {
    try {
      const proposalId = proposal.id || (proposal as ProviderRequest)?.id;
      setProcessingId(proposalId);
      const response = await acceptProjectRequest(proposalId, true);

      // Get the created project ID from the response
      const projectId =
        ((response as Record<string, unknown>)?.id as string | undefined) ||
        ((
          (response as Record<string, unknown>)?.project as
            | Record<string, unknown>
            | undefined
        )?.id as string | undefined);

      // Optimistic status update
      setProposals((prev: ProviderRequest[]) =>
        prev.map((p) =>
          p.id === proposalId ? { ...p, status: "accepted" as const } : p,
        ),
      );

      toast({
        title: t("customer.projects.detail.toast.requestAcceptedTitle"),
        description: t("customer.projects.detail.toast.requestAcceptedDesc"),
      });

      if (projectId) {
        router.push(`/customer/projects/${projectId}/milestones`);
      }
    } catch (err) {
      toast({
        title: t("customer.projects.detail.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          err,
          "customer project detail accept request",
        ),
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Save milestones after accept (inside modal)
  const handleSaveAcceptedMilestones = async () => {
    if (!activeProjectId) return;

    type Err = {
      title?: string;
      description?: string;
      dueDate?: string;
      daysFromStart?: string;
      durationAmount?: string;
      durationUnit?: string;
    };
    const errors: Record<number, Err> = {};
    let hasErrors = false;
    milestonesDraft.forEach((m, idx) => {
      const milestoneErrors: Err = {};
      const mm = m as Milestone & {
        durationAmount?: string;
        durationUnit?: string;
      };
      if (!m.title || !m.title.trim()) {
        milestoneErrors.title = t("customer.projects.detail.validation.titleRequired");
        hasErrors = true;
      }
      if (!m.description || !m.description.trim()) {
        milestoneErrors.description = t(
          "customer.projects.detail.validation.descriptionRequired",
        );
        hasErrors = true;
      }
      const durAmount =
        mm.durationAmount != null ? String(mm.durationAmount).trim() : "";
      const durUnit = mm.durationUnit || "";
      if (!durAmount || Number(durAmount) <= 0) {
        milestoneErrors.durationAmount = t(
          "customer.projects.detail.validation.durationAmount",
        );
        hasErrors = true;
      }
      if (!durUnit) {
        milestoneErrors.durationUnit = t(
          "customer.projects.detail.validation.unitRequired",
        );
        hasErrors = true;
      }
      if (Object.keys(milestoneErrors).length > 0)
        errors[idx] = milestoneErrors;
    });

    const projectData = project || {};
    const approvedPrice =
      typeof projectData.approvedPrice === "number"
        ? projectData.approvedPrice
        : typeof projectData.approvedPrice === "string"
          ? Number(projectData.approvedPrice)
          : 0;
    const bidAmountValue =
      typeof projectData.bidAmount === "number"
        ? projectData.bidAmount
        : typeof projectData.bidAmount === "string"
          ? Number(projectData.bidAmount)
          : 0;
    const bidAmount = approvedPrice || bidAmountValue || 0;
    if (bidAmount > 0) {
      const sumMilestones = milestonesDraft.reduce(
        (sum: number, m: Milestone) => {
          const val = Number(m.amount);
          if (!isNaN(val)) return sum + val;
          return sum;
        },
        0,
      );

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

    if (hasErrors) {
      setMilestoneDraftErrors(errors);
      toast({
        title: t("customer.projects.detail.toast.validationTitle"),
        description: t("customer.projects.detail.toast.milestoneValidationDesc"),
        variant: "destructive",
      });
      return;
    }

    setMilestoneDraftErrors({});

    if (savingMilestonesModal || approvingMilestonesModal) return;

    try {
      setSavingMilestonesModal(true);

      const sortedDraft = [...milestonesDraft].sort(
        (a, b) => (a.sequence ?? 0) - (b.sequence ?? 0),
      );
      let cum = 0;
      const payload = sortedDraft.map((m) => {
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
          sequence: m.sequence ?? 0,
          title: m.title,
          description: m.description ?? "",
          amount: Number(m.amount),
          daysFromStart: cum,
        };
      });

      const res = await updateCompanyProjectMilestones(
        activeProjectId,
        payload as Milestone[],
      );

      setMilestoneApprovalStateModal({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      const milestoneData = await getCompanyProjectMilestones(activeProjectId);
      const rawRefreshed: Milestone[] = Array.isArray(milestoneData.milestones)
        ? milestoneData.milestones.map(
            (m: Milestone | Record<string, unknown>) =>
              ({
                ...(m as Milestone),
                sequence: ((m as Milestone).order ??
                  (m as Record<string, unknown>).order) as number,
              }) as Milestone,
          )
        : [];
      const sortedDr = [...rawRefreshed].sort(
        (a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0),
      );
      const withDurationDr = sortedDr.map((m, i) => {
        const prev = sortedDr[i - 1] as { daysFromStart?: number } | undefined;
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

      setMilestonesDraft(withDurationDr);
      setOriginalMilestonesDraft(JSON.parse(JSON.stringify(withDurationDr)));

      toast({
        title: t("customer.projects.detail.toast.milestonesUpdatedTitle"),
        description: t("customer.projects.detail.toast.milestonesUpdatedDesc"),
      });
    } catch (e) {
      toast({
        title: t("customer.projects.detail.toast.saveFailedTitle"),
        description: getUserFriendlyErrorMessage(
          e,
          "customer project detail save accepted milestones",
        ),
        variant: "destructive",
      });
    } finally {
      setSavingMilestonesModal(false);
    }
  };

  // Approve milestones after editing (inside modal)
  const handleApproveAcceptedMilestones = async () => {
    if (!activeProjectId) return;
    if (savingMilestonesModal || approvingMilestonesModal) return;

    try {
      setApprovingMilestonesModal(true);
      const res = await approveCompanyMilestones(activeProjectId);

      // sync the approval state shown in the finalize dialog
      setMilestoneApprovalStateModal({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      // 1. ALWAYS close the milestone editor dialog
      setMilestonesOpen(false);

      // 2. Show success toast
      toast({
        title: t("customer.projects.detail.toast.milestonesApprovedTitle"),
        description: res.milestonesLocked
          ? t("customer.projects.detail.toast.milestonesApprovedLockedDesc")
          : t("customer.projects.detail.toast.milestonesApprovedWaitingDesc"),
      });

      // 3. Open the summary/status dialog
      setMilestoneFinalizeOpen(true);
    } catch (e) {
      toast({
        title: t("customer.projects.detail.toast.approvalFailedTitle"),
        description: getUserFriendlyErrorMessage(
          e,
          "customer project detail approve accepted milestones",
        ),
        variant: "destructive",
      });
    } finally {
      setApprovingMilestonesModal(false);
    }
  };

  // Reject proposal flow
  const handleStartRejectProposal = (proposal: ProviderRequest) => {
    setSelectedProposalForAction(proposal);
    setRejectDialogOpen(true);
  };

  const handleConfirmRejectProposal = async () => {
    if (!selectedProposalForAction) return;
    try {
      setProcessingId(selectedProposalForAction.id);

      await rejectProjectRequest(selectedProposalForAction.id, rejectReason);

      // 🔁 Don't remove it. Just mark REJECTED (use lowercase to match ProviderRequest interface).
      setProposals((prev: ProviderRequest[]) =>
        prev.map((p) =>
          p.id === selectedProposalForAction.id
            ? { ...p, status: "rejected" }
            : p,
        ),
      );

      // Refresh proposals from server to ensure we have the latest status
      const projectRecord = project as Record<string, unknown>;
      const serviceRequestId =
        project?.type === "ServiceRequest"
          ? project.id
          : (projectRecord?.serviceRequestId as string | undefined) ||
            (projectRecord?.originalRequestId as string | undefined) ||
            resolvedId;

      if (serviceRequestId) {
        try {
          const proposalsResponse = await getCompanyProjectRequests({
            serviceRequestId: serviceRequestId as string,
            sort: "newest",
          });

          const rawProposals = Array.isArray(proposalsResponse?.proposals)
            ? proposalsResponse.proposals
            : Array.isArray(proposalsResponse?.data)
              ? proposalsResponse.data
              : Array.isArray(proposalsResponse?.items)
                ? proposalsResponse.items
                : [];

          const mappedProposals = mapProposalsToProviderRequests(rawProposals);
          setProposals(mappedProposals);
        } catch (err) {
          console.warn("Failed to refresh proposals after reject:", err);
        }
      }

      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedProposalForAction(null);

      toast({
        title: t("customer.projects.detail.toast.requestRejectedTitle"),
        description: t("customer.projects.detail.toast.requestRejectedDesc"),
      });
    } catch (err) {
      toast({
        title: t("customer.projects.detail.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          err,
          "customer project detail reject request",
        ),
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Handle dispute creation/update
  const handleCreateDispute = async () => {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      toast({
        title: t("customer.projects.detail.toast.validationTitle"),
        description: t("customer.projects.detail.toast.reasonDescriptionRequired"),
        variant: "destructive",
      });
      return;
    }

    if (!project?.id) {
      toast({
        title: t("customer.projects.detail.toast.errorTitle"),
        description: t("customer.projects.detail.toast.projectIdMissing"),
        variant: "destructive",
      });
      return;
    }

    let milestoneIdPayload: string | undefined;
    if (projectMilestones.length > 0) {
      if (paidMilestonesForDispute.length > 0) {
        if (!selectedMilestoneForDispute) {
          toast({
            title: t("customer.projects.detail.toast.validationTitle"),
            description: t(
              "customer.projects.detail.toast.disputeSelectPaidMilestone",
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
            title: t("customer.projects.detail.toast.validationTitle"),
            description: t(
              "customer.projects.detail.toast.disputeInvalidPaidMilestone",
            ),
            variant: "destructive",
          });
          return;
        }
        milestoneIdPayload = selectedMilestoneForDispute;
      } else {
        if (!projectLevelDisputeAck) {
          toast({
            title: t("customer.projects.detail.toast.validationTitle"),
            description: t(
              "customer.projects.detail.toast.disputeProjectLevelAckRequired",
            ),
            variant: "destructive",
          });
          return;
        }
        milestoneIdPayload = undefined;
      }
    }

    try {
      setCreatingDispute(true);
      await createDispute({
        projectId: project.id as string,
        milestoneId: milestoneIdPayload,
        reason: disputeReason.trim(),
        description: disputeDescription.trim(),
        contestedAmount: reportDisputeContestedAmount,
        suggestedResolution: disputeSuggestedResolution.trim() || undefined,
        attachments:
          disputeAttachments.length > 0 ? disputeAttachments : undefined,
      });

      const wasUpdatingExisting = Boolean(activeDispute);
      toast({
        title: wasUpdatingExisting
          ? t("customer.projects.detail.toast.disputeUpdatedTitle")
          : t("customer.projects.detail.toast.disputeCreatedTitle"),
        description: wasUpdatingExisting
          ? t("customer.projects.detail.toast.disputeUpdatedDesc")
          : t("customer.projects.detail.toast.disputeCreatedDesc"),
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
      toast({
        title: t("customer.projects.detail.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer project detail create dispute",
        ),
        variant: "destructive",
      });
    } finally {
      setCreatingDispute(false);
    }
  };

  const handleViewDispute = async () => {
    if (!project?.id) return;
    try {
      const list = await loadProjectDisputes(project.id as string);
      const pick =
        list.find((d) => d.status !== "CLOSED" && d.status !== "RESOLVED") ||
        list[0] ||
        null;
      setCurrentDispute(pick);
      setViewDisputeDialogOpen(true);
    } catch (error: unknown) {
      toast({
        title: t("customer.projects.detail.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer project detail load dispute",
        ),
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
        title: t("customer.projects.detail.toast.validationTitle"),
        description: t("customer.projects.detail.toast.disputeUpdateNeedsContent"),
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingDispute(true);
      await updateDispute(activeDispute.id as string, {
        additionalNotes: disputeAdditionalNotes.trim() || undefined,
        attachments:
          disputeUpdateAttachments.length > 0
            ? disputeUpdateAttachments
            : undefined,
        projectId: project?.id as string | undefined,
      });

      toast({
        title: t("customer.projects.detail.toast.disputeUpdateSuccessTitle"),
        description: t("customer.projects.detail.toast.disputeUpdateSuccessDesc"),
      });

      // Refresh all project data including dispute
      await refreshProjectData();

      // Reset form
      setDisputeAdditionalNotes("");
      setDisputeUpdateAttachments([]);
    } catch (error: unknown) {
      toast({
        title: t("customer.projects.detail.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer project detail update dispute",
        ),
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

  const getProposalStatusLabel = (s: string) => {
    const k = String(s || "").toLowerCase();
    if (k === "pending")
      return t("customer.projects.detail.proposalStatus.pending");
    if (k === "accepted")
      return t("customer.projects.detail.proposalStatus.accepted");
    if (k === "rejected")
      return t("customer.projects.detail.proposalStatus.rejected");
    return s;
  };

  const getDisputeStatusLabel = (raw: string) => {
    const k = String(raw || "")
      .toUpperCase()
      .replace(/\s+/g, "_");
    const map: Record<string, MessageKey> = {
      OPEN: "customer.projects.detail.disputeStatus.open",
      UNDER_REVIEW: "customer.projects.detail.disputeStatus.under_review",
      RESOLVED: "customer.projects.detail.disputeStatus.resolved",
      CLOSED: "customer.projects.detail.disputeStatus.closed",
      REJECTED: "customer.projects.detail.disputeStatus.rejected",
    };
    const key = map[k];
    if (key) return t(key);
    return (
      raw.replace(/_/g, " ") ||
      t("customer.projects.detail.viewDispute.unknown")
    );
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

  return (
    <>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                {project.title as string}
              </h1>
              <Badge className={getStatusColor(project.status as string)}>
                {getStatusText(project.status as string)}
              </Badge>
              {(project.priority as string) === "high" && (
                <Badge variant="destructive" className="text-xs sm:text-sm">
                  {t("customer.projects.detail.badge.highPriority")}
                </Badge>
              )}
              {Boolean(project.isFeatured) && (
                <Badge className="bg-purple-100 text-purple-800 text-xs sm:text-sm">
                  {t("customer.projects.detail.badge.featured")}
                </Badge>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 break-words">
              {project.description as string}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>
                  {t("customer.projects.detail.meta.created")}{" "}
                  {new Date(
                    project.createdAt as string | number | Date,
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>
                  {t("customer.projects.detail.meta.bids", {
                    count: bidCount,
                  })}
                </span>
              </div>
              {/* Date range only shown if startDate and endDate exist */}
              {Boolean(project.startDate) &&
              Boolean(project.endDate) &&
              startDate &&
              endDate &&
              !isNaN(startDate.getTime()) &&
              !isNaN(endDate.getTime()) ? (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {startDate.toLocaleDateString()} -{" "}
                    {endDate.toLocaleDateString()}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
            {/* 
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className="flex-1 sm:flex-initial text-xs sm:text-sm"
            >
              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">
                {t("customer.projects.detail.editDialog.title")}
              </span>
              <span className="sm:hidden">
                {t("customer.projects.detail.header.editShort")}
              </span>
            </Button>
            */}

            {/* <Button
              variant="outline"
              className="flex-1 sm:flex-initial text-xs sm:text-sm"
              onClick={() =>
                handleContact(
                  project.provider?.id,
                  project.provider?.name,
                  (
                    project.provider as
                      | { providerProfile?: { profileImageUrl?: string } }
                      | undefined
                  )?.providerProfile?.profileImageUrl ||
                    project.assignedProvider?.providerProfile?.profileImageUrl,
                )
              }
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Message Provider</span>
              <span className="sm:hidden">Message</span>
            </Button> */}
            {projectDisputes.length > 0 && (
              <Button
                variant="outline"
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300 flex-1 sm:flex-initial text-xs sm:text-sm"
                onClick={handleViewDispute}
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">
                  {projectDisputes.length > 1
                    ? t("customer.projects.detail.viewDisputes")
                    : t("customer.projects.detail.viewDispute")}
                </span>
                <span className="sm:hidden">
                  {t("customer.projects.detail.dispute.mobileShort")}
                </span>
              </Button>
            )}
            {canReportNewDispute && (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-initial text-xs sm:text-sm"
                onClick={() => setDisputeDialogOpen(true)}
              >
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">
                  {t("customer.projects.detail.reportDispute")}
                </span>
                <span className="sm:hidden">
                  {t("customer.projects.detail.dispute.mobileShort")}
                </span>
              </Button>
            )}
          </div>
        </div>

        {/* Company approval reminder - outside tabs */}
        {!milestoneApprovalState.companyApproved &&
          projectMilestones &&
          projectMilestones.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:px-4 sm:py-3.5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-amber-900">
                  {t("customer.projects.detail.reminder.approveTitle")}
                </p>
                <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                  {t("customer.projects.detail.reminder.approveBodyBeforeTab")}{" "}
                  <Button
                    variant="link"
                    className="h-auto p-0 text-amber-800 underline font-semibold"
                    onClick={() => setActiveTab("milestones")}
                  >
                    {t("customer.projects.detail.reminder.milestonesTab")}
                  </Button>{" "}
                  {t("customer.projects.detail.reminder.approveBodyAfterTab")}
                </p>
              </div>
            </div>
          )}

        {/* Project Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">
                    {t("customer.projects.detail.stats.approvedPriceShort")}
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 break-words">
                    {currency} {fmt(approvedPriceValue || 0)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">
                    {t("customer.projects.detail.stats.totalSpent")}
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 break-words">
                    {currency} {fmt(totalSpentValue || 0)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">
                    {t("customer.projects.detail.stats.progress")}
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">
                    {progressValue || 0}%
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex items-center justify-center flex-shrink-0 ml-2">
                  <div
                    className="w-full h-full rounded-full border-4 border-purple-600 border-t-transparent animate-spin"
                    style={{ animationDuration: "2s" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {daysLeftValue == null ? (
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {t("customer.projects.detail.stats.daysLeft")}
                    </p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">
                      {t("customer.projects.detail.milestone.emDash")}
                    </p>
                  </div>
                  <Calendar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {daysLeftValue < 0
                        ? t("customer.projects.detail.stats.late")
                        : t("customer.projects.detail.stats.daysLeft")}
                    </p>
                    <p
                      className={`text-lg sm:text-xl lg:text-2xl font-bold mt-1 ${
                        daysLeftValue < 0 ? "text-red-600" : ""
                      }`}
                    >
                      {daysLeftValue < 0
                        ? Math.abs(daysLeftValue) === 1
                          ? t("customer.projects.detail.stats.lateByOneDay")
                          : t("customer.projects.detail.stats.lateByDays", {
                              n: Math.abs(daysLeftValue),
                            })
                        : daysLeftValue}
                    </p>
                  </div>
                  <Calendar
                    className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex-shrink-0 ml-2 ${
                      daysLeftValue < 0 ? "text-red-600" : "text-orange-600"
                    }`}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress Bar */}
        {(project.status as string) === "in_progress" && (
          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm sm:text-base">
                  {t("customer.projects.detail.progressBarTitle")}
                </h3>
                <span className="text-xs sm:text-sm text-gray-500">
                  {typeof project.progress === "number"
                    ? project.progress
                    : typeof project.progress === "string"
                      ? Number(project.progress) || 0
                      : 0}
                  {t("customer.projects.detail.percentCompleteSuffix")}
                </span>
              </div>
              <Progress
                value={
                  typeof project.progress === "number"
                    ? project.progress
                    : typeof project.progress === "string"
                      ? Number(project.progress) || 0
                      : 0
                }
                className="h-2 sm:h-3"
              />
            </CardContent>
          </Card>
        )}

        {/* Assigned Provider */}
        {project.assignedProvider && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                {t("customer.projects.detail.assignedProvider")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    <AvatarImage
                      src={getProfileImageUrl(
                        project.assignedProvider?.providerProfile
                          ?.profileImageUrl || project.assignedProvider?.avatar,
                      )}
                    />
                    <AvatarFallback>
                      {project.assignedProvider.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {project.assignedProvider.name ||
                        t("customer.projects.detail.unknownProvider")}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                        <span>
                          {project.assignedProvider.providerProfile?.rating ||
                            0}
                        </span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate">
                        {project.assignedProvider.providerProfile
                          ?.completedJobs || 0}{" "}
                        {t("customer.projects.detail.jobsCompleted")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    {t("customer.projects.detail.message")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    {t("customer.projects.detail.viewProfile")}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 sm:space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 h-auto p-2 sm:p-3 bg-gray-100 rounded-lg">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all duration-200 font-medium"
            >
              {t("customer.projects.detail.tab.overview")}
            </TabsTrigger>
            <TabsTrigger
              value="milestones"
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all duration-200 font-medium"
            >
              {t("customer.projects.detail.tab.milestones")}
            </TabsTrigger>
            <TabsTrigger
              value="bids"
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all duration-200 font-medium"
            >
              {t("customer.projects.detail.tab.bids")}
            </TabsTrigger>
            <TabsTrigger
              value="files"
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all duration-200 font-medium"
            >
              {t("customer.projects.detail.tab.files")}
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md bg-gray-100 text-gray-600 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md transition-all duration-200 font-medium"
            >
              {t("customer.projects.detail.tab.messages")}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Overview details: Project Details first */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  {t("customer.projects.detail.projectDetails")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      {t("customer.projects.detail.label.category")}
                    </Label>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs sm:text-sm">
                        {project.category}
                      </Badge>
                    </div>
                  </div>
                  {(typeof project.budgetMin === "number" ||
                    typeof project.budgetMax === "number" ||
                    (project.budgetMin != null &&
                      project.budgetMax != null)) && (
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-500">
                        {t("customer.projects.detail.label.budgetRange")}
                      </Label>
                      <p className="text-base sm:text-lg mt-1 break-words">
                        {currency}{" "}
                        {fmt(
                          typeof project.budgetMin === "number"
                            ? project.budgetMin
                            : Number(project.budgetMin) || 0,
                        )}{" "}
                        - {currency}{" "}
                        {fmt(
                          typeof project.budgetMax === "number"
                            ? project.budgetMax
                            : Number(project.budgetMax) || 0,
                        )}
                      </p>
                    </div>
                  )}
                  {approvedPriceValue > 0 && (
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-500">
                        {t("customer.projects.detail.label.approvedPrice")}
                      </Label>
                      <p className="text-base sm:text-lg font-semibold text-green-600 mt-1">
                        {currency} {fmt(approvedPriceValue)}
                      </p>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      {t("customer.projects.detail.label.timeline")}
                    </Label>
                    <div className="space-y-2 mt-1">
                      {(() => {
                        const statusNorm = String(
                          project.status ?? "",
                        ).toUpperCase();
                        const isOpenOrPending =
                          (project.type === "ServiceRequest" &&
                            statusNorm === "OPEN") ||
                          statusNorm === "PENDING" ||
                          statusNorm === "OPEN";
                        const milestonesLocked =
                          milestoneApprovalState.milestonesLocked &&
                          projectMilestones &&
                          projectMilestones.length > 0;

                        if (isOpenOrPending) {
                          const companyTimeline =
                            project.originalTimeline ?? project.timeline;
                          return companyTimeline ? (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                {t("customer.projects.detail.label.timelineCompany")}
                              </p>
                              <p className="text-sm text-gray-900 font-medium">
                                {formatTimeline(companyTimeline)}
                              </p>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">
                              {t("customer.projects.detail.notSpecified")}
                            </p>
                          );
                        }

                        if (milestonesLocked) {
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
                          if (totalDays > 0 || lastDueDate) {
                            return (
                              <>
                                {totalDays > 0 && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      {t(
                                        "customer.projects.detail.label.timelineApprovedBoth",
                                      )}
                                    </p>
                                    <p className="text-sm font-semibold text-green-600">
                                      {formatDurationDays(totalDays)}
                                    </p>
                                  </div>
                                )}
                                {lastDueDate && (
                                  <div>
                                    <p className="text-xs text-gray-500 mb-1">
                                      {t(
                                        "customer.projects.detail.label.dueDateProject",
                                      )}
                                    </p>
                                    <p className="text-sm font-semibold text-green-600">
                                      {new Date(
                                        lastDueDate,
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>
                                )}
                              </>
                            );
                          }
                        }

                        if (project.providerProposedTimeline) {
                          return (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                {t(
                                  "customer.projects.detail.label.agreedTimeline",
                                )}
                              </p>
                              <p className="text-sm text-gray-900 font-medium">
                                {formatTimeline(
                                  project.providerProposedTimeline,
                                  "day",
                                )}
                              </p>
                            </div>
                          );
                        }

                        const fallbackCompanyTimeline =
                          project.originalTimeline ?? project.timeline;
                        return fallbackCompanyTimeline ? (
                          <div>
                            <p className="text-xs text-gray-500 mb-1">
                              {t("customer.projects.detail.label.timelineCompany")}
                            </p>
                            <p className="text-sm text-gray-900 font-medium">
                              {formatTimeline(fallbackCompanyTimeline)}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">
                            {t("customer.projects.detail.notSpecified")}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      {t("customer.projects.detail.label.requiredSkills")}
                    </Label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-1">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {project &&
              String(project.status ?? "").toUpperCase() === "COMPLETED" &&
              (() => {
                const providerForReview =
                  project.assignedProvider ||
                  (project.provider as
                    | { id?: string; name?: string }
                    | undefined);
                const reviewProviderId =
                  providerForReview?.id ??
                  (project as { providerId?: string }).providerId;
                if (!reviewProviderId || !project.id) return null;
                return (
                  <CustomerProjectReviewInline
                    projectId={String(project.id)}
                    providerId={String(reviewProviderId)}
                    providerName={providerForReview?.name}
                    projectCompleted
                  />
                );
              })()}

            {/* Provider Details - when provider is available and both are matched */}
            {(project.assignedProvider || project.provider) &&
              (() => {
                const provider =
                  project.assignedProvider ||
                  (project.provider as
                    | {
                        id?: string;
                        name?: string;
                        avatar?: string;
                        providerProfile?: {
                          profileImageUrl?: string;
                          rating?: number | string;
                          bio?: string;
                          major?: string;
                          location?: string;
                          completedJobs?: number;
                        };
                      }
                    | undefined);
                if (!provider) return null;
                const providerId =
                  provider.id ??
                  (project as { providerId?: string }).providerId;
                const profile = provider.providerProfile as
                  | {
                      profileImageUrl?: string;
                      rating?: number | string;
                      bio?: string;
                      major?: string;
                      location?: string;
                      completedJobs?: number;
                    }
                  | undefined;
                const profileImageUrl =
                  profile?.profileImageUrl || provider.avatar;
                const rating = profile?.rating ?? 0;
                const bio = profile?.bio;
                const major = profile?.major;
                const location = profile?.location;
                const completedJobs = profile?.completedJobs ?? 0;
                return (
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg">
                        {t("customer.projects.detail.providerCard.title")}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {t("customer.projects.detail.providerCard.subtitle")}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex items-center space-x-3 sm:space-x-4 flex-shrink-0">
                          <Avatar className="w-12 h-12 sm:w-14 sm:h-14">
                            <AvatarImage
                              src={getProfileImageUrl(profileImageUrl)}
                            />
                            <AvatarFallback>
                              {provider.name?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">
                              {provider.name ||
                                t("customer.projects.detail.unknownProvider")}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500 mt-0.5">
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                                <span>{Number(rating) || 0}</span>
                              </div>
                              <span className="hidden sm:inline">•</span>
                              <span>
                                {completedJobs}{" "}
                                {t("customer.projects.detail.jobsCompleted")}
                              </span>
                              {(major || location) && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="truncate">
                                    {[major, location]
                                      .filter(Boolean)
                                      .join(" · ")}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        {(bio || major || location) && (
                          <div className="flex-1 text-xs sm:text-sm text-gray-600 border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 sm:border-gray-200">
                            {bio && <p className="line-clamp-3">{bio}</p>}
                            {!bio && (major || location) && (
                              <p>
                                {major && <span>{major}</span>}
                                {major && location && " · "}
                                {location && <span>{location}</span>}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <Button
                          variant="default"
                          size="sm"
                          className="text-xs sm:text-sm"
                          onClick={() =>
                            handleContact(
                              providerId,
                              provider.name,
                              typeof profileImageUrl === "string"
                                ? profileImageUrl
                                : undefined,
                            )
                          }
                        >
                          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                          {t("customer.projects.detail.message")}
                        </Button>
                        {providerId && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs sm:text-sm"
                            asChild
                          >
                            <NextLink
                              href={`/customer/providers/${providerId}`}
                            >
                              {t("customer.projects.detail.viewProfile")}
                            </NextLink>
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}

            {/* Requirements and Deliverables side by side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    {t("customer.projects.detail.editDialog.labelRequirements")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <MarkdownViewer
                    content={requirements}
                    emptyMessage={t(
                      "customer.projects.detail.overview.requirementsEmpty",
                    )}
                    className="text-xs sm:text-sm"
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    {t("customer.projects.detail.editDialog.labelDeliverables")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <MarkdownViewer
                    content={deliverables}
                    emptyMessage={t(
                      "customer.projects.detail.overview.deliverablesEmpty",
                    )}
                    className="text-xs sm:text-sm"
                  />
                </CardContent>
              </Card>
            </div>

            {/* AI Recommended Providers under all overview details */}
            {project?.type === "ServiceRequest" && project?.id && (
              <AIRecommendedProvidersSection
                serviceRequestId={project.id}
                showScrollNote={shouldFocusRecommended}
              />
            )}
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  {t("customer.projects.detail.milestones.sectionTitle")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t("customer.projects.detail.milestones.sectionDesc")}
                </CardDescription>
                {project?.type === "Project" && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                    <Badge variant="outline" className="text-xs sm:text-sm">
                      {t("customer.projects.detail.milestones.badgeCompany")}{" "}
                      {milestoneApprovalState.companyApproved ? "✓" : "✗"} ·{" "}
                      {t("customer.projects.detail.milestones.badgeProvider")}{" "}
                      {milestoneApprovalState.providerApproved ? "✓" : "✗"}
                      {milestoneApprovalState.milestonesLocked &&
                        ` · ${t("customer.projects.detail.milestones.locked")}`}
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
                              "customer.projects.detail.milestones.approvedTimeline",
                              { duration: formatDurationDays(totalDays) },
                            )}
                          </span>
                        ) : null;
                      })()}
                    {!milestoneApprovalState.milestonesLocked && (
                      <>
                        <Button
                          variant="outline"
                          asChild
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          <NextLink
                            href={`/customer/projects/${project.id}/milestones`}
                          >
                            {t("customer.projects.detail.milestones.editMilestones")}
                          </NextLink>
                        </Button>
                        {!milestoneApprovalState.companyApproved && (
                          <Button
                            onClick={handleApproveProjectMilestones}
                            size="sm"
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm"
                            disabled={savingMilestones || approvingMilestones}
                          >
                            {approvingMilestones ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                {t("customer.projects.detail.milestones.approving")}
                              </>
                            ) : (
                              t("customer.projects.detail.milestones.approve")
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-4 sm:space-y-6">
                  {projectMilestones && projectMilestones.length > 0 ? (
                    projectMilestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex gap-2 sm:gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-5 h-5 sm:w-6 sm:h-6">
                            {getMilestoneStatusIcon(milestone.status || "")}
                          </div>
                          {index < projectMilestones.length - 1 && (
                            <div className="w-px h-12 sm:h-16 bg-gray-200 mt-1 sm:mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-6 sm:pb-8">
                          <div className="flex flex-col gap-2 mb-2">
                            {/* Top Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <h3 className="font-semibold text-sm sm:text-base break-words">
                                {milestone.title}
                              </h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  className={`${getStatusColor(
                                    milestone.status || "",
                                  )} text-xs`}
                                >
                                  {getStatusText(milestone.status || "")}
                                </Badge>
                                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                                  {fmt(milestone.amount)} {currency}
                                </span>
                              </div>
                            </div>

                            {/* Description Row */}
                            <div className="mb-2 sm:mb-3">
                              <p className="text-xs sm:text-sm text-gray-600 break-words">
                                {milestone.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
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
                                      ? t("customer.projects.detail.milestone.dueLine", {
                                          date: new Date(
                                            milestone.dueDate,
                                          ).toLocaleDateString(),
                                        })
                                      : t("customer.projects.detail.milestone.emDash");
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
                                          "customer.projects.detail.milestone.durationLine",
                                          {
                                            duration:
                                              formatDurationDays(durationDays),
                                          },
                                        )
                                      : "";
                                  const dueStr = milestone.dueDate
                                    ? t("customer.projects.detail.milestone.dueLine", {
                                        date: new Date(
                                          milestone.dueDate,
                                        ).toLocaleDateString(),
                                      })
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
                                    t("customer.projects.detail.milestone.emDash")
                                  );
                                })()}
                              </span>
                            </div>
                            {milestone.completedAt && (
                              <div className="flex items-center gap-1">
                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span>
                                  {t(
                                    "customer.projects.detail.milestone.completedLine",
                                    {
                                      date: new Date(
                                        milestone.completedAt,
                                      ).toLocaleDateString(),
                                    },
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                          {norm(milestone.status) === "IN_PROGRESS" &&
                            milestone.progress && (
                              <div className="mt-2 sm:mt-3">
                                <div className="flex justify-between text-xs sm:text-sm mb-1">
                                  <span>
                                    {t("customer.projects.detail.stats.progress")}
                                  </span>
                                  <span>{milestone.progress}%</span>
                                </div>
                                <Progress
                                  value={milestone.progress}
                                  className="h-2"
                                />
                              </div>
                            )}

                          {/* Show start deliverables if available (persists even after status changes) */}
                          {milestone.startDeliverables ? (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm font-medium text-green-900 mb-1">
                                📋{" "}
                                {t(
                                  "customer.projects.detail.milestone.planDeliverablesTitle",
                                )}
                              </p>
                              <p className="text-sm text-green-800 whitespace-pre-wrap">
                                {typeof milestone.startDeliverables ===
                                  "object" &&
                                milestone.startDeliverables !== null &&
                                "description" in milestone.startDeliverables &&
                                typeof (
                                  milestone.startDeliverables as {
                                    description?: unknown;
                                  }
                                ).description === "string"
                                  ? (
                                      milestone.startDeliverables as {
                                        description: string;
                                      }
                                    ).description
                                  : JSON.stringify(milestone.startDeliverables)}
                              </p>
                            </div>
                          ) : null}

                          {/* Show submit deliverables if available (persists even after status changes) */}
                          {milestone.submitDeliverables ? (
                            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <p className="text-sm font-medium text-purple-900 mb-1">
                                ✅{" "}
                                {t(
                                  "customer.projects.detail.milestone.submitDeliverablesTitle",
                                )}
                              </p>
                              <p className="text-sm text-purple-800 whitespace-pre-wrap">
                                {typeof milestone.submitDeliverables ===
                                  "object" &&
                                milestone.submitDeliverables !== null &&
                                "description" in milestone.submitDeliverables &&
                                typeof (
                                  milestone.submitDeliverables as {
                                    description?: unknown;
                                  }
                                ).description === "string"
                                  ? (
                                      milestone.submitDeliverables as {
                                        description: string;
                                      }
                                    ).description
                                  : JSON.stringify(
                                      milestone.submitDeliverables,
                                    )}
                              </p>
                            </div>
                          ) : null}

                          {/* Show submission note if available (persists even after status changes) */}
                          {milestone.submissionNote && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                📝{" "}
                                {t(
                                  "customer.projects.detail.milestone.submissionNoteTitle",
                                )}
                              </p>
                              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                {milestone.submissionNote}
                              </p>
                            </div>
                          )}

                          {/* Show latest requested changes reason if available (persists even after status changes) */}
                          {milestone.submissionHistory &&
                            Array.isArray(milestone.submissionHistory) &&
                            milestone.submissionHistory.length > 0 &&
                            (() => {
                              const latestRequest = milestone.submissionHistory[
                                milestone.submissionHistory.length - 1
                              ] as Record<string, unknown> | undefined;
                              if (
                                latestRequest &&
                                typeof latestRequest === "object" &&
                                "requestedChangesReason" in latestRequest &&
                                typeof latestRequest.requestedChangesReason ===
                                  "string"
                              ) {
                                return (
                                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-sm font-medium text-orange-900 mb-1">
                                      🔄{" "}
                                      {t(
                                        "customer.projects.detail.milestone.latestChangesTitle",
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
                                      {latestRequest.requestedChangesReason}
                                    </p>
                                    {latestRequest.requestedChangesAt &&
                                    typeof latestRequest.requestedChangesAt ===
                                      "string" ? (
                                      <p className="text-xs text-orange-600 mt-2">
                                        {t(
                                          "customer.projects.detail.milestone.requestedOn",
                                        )}{" "}
                                        {new Date(
                                          latestRequest.requestedChangesAt,
                                        ).toLocaleString()}
                                      </p>
                                    ) : null}
                                  </div>
                                );
                              }
                              return null;
                            })()}

                          {/* Show attachment if available (persists even after status changes) */}
                          {milestone.submissionAttachmentUrl && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Paperclip className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-900">
                                  📎{" "}
                                  {t(
                                    "customer.projects.detail.milestone.submissionAttachment",
                                  )}
                                </span>
                              </div>
                              {((): React.ReactNode => {
                                const normalized =
                                  milestone.submissionAttachmentUrl.replace(
                                    /\\/g,
                                    "/",
                                  );
                                const fileName =
                                  normalized.split("/").pop() ||
                                  t(
                                    "customer.projects.detail.milestone.attachmentFallbackName",
                                  );
                                const attachmentUrl = getAttachmentUrl(
                                  milestone.submissionAttachmentUrl,
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
                                    href={
                                      attachmentUrl === "#"
                                        ? undefined
                                        : attachmentUrl
                                    }
                                    download={fileName}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={
                                      isR2Key &&
                                      milestone.submissionAttachmentUrl
                                        ? async (e) => {
                                            e.preventDefault();
                                            if (
                                              !milestone.submissionAttachmentUrl
                                            )
                                              return;
                                            try {
                                              const downloadUrl =
                                                await getR2DownloadUrl(
                                                  milestone.submissionAttachmentUrl,
                                                );
                                              window.open(
                                                downloadUrl.downloadUrl,
                                                "_blank",
                                              );
                                            } catch (error) {
                                              toastHook({
                                                title: t("customer.projects.detail.toast.errorTitle"),
                                                description:
                                                  getUserFriendlyErrorMessage(
                                                    error,
                                                    "customer project attachment download",
                                                  ),
                                                variant: "destructive",
                                              });
                                            }
                                          }
                                        : undefined
                                    }
                                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 hover:shadow-sm transition"
                                  >
                                    {/* Icon circle */}
                                    <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                      {t(
                                        "customer.projects.detail.milestone.attachmentPdfBadge",
                                      )}
                                    </div>

                                    {/* File info */}
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                        {fileName}
                                      </span>
                                      <span className="text-xs text-gray-500 leading-snug">
                                        {t(
                                          "customer.projects.detail.milestone.clickPreviewDownload",
                                        )}
                                      </span>
                                    </div>

                                    {/* Download icon */}
                                    <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                                      <Download className="w-4 h-4" />
                                    </div>
                                  </a>
                                );
                              })()}
                            </div>
                          )}

                          {/* Show submission history if available (persists even after status changes) */}
                          {milestone.submissionHistory &&
                            Array.isArray(milestone.submissionHistory) &&
                            milestone.submissionHistory.length > 0 && (
                              <div className="mt-4 border-t pt-4">
                                <p className="text-sm font-semibold text-gray-900 mb-3">
                                  📚{" "}
                                  {t("customer.projects.detail.milestone.historyTitle")}
                                </p>
                                <Accordion
                                  type="single"
                                  collapsible
                                  className="w-full space-y-2"
                                >
                                  {(
                                    milestone.submissionHistory as unknown[]
                                  ).map((history: unknown, idx: number) => {
                                    const historyRecord = history as Record<
                                      string,
                                      unknown
                                    >;
                                    // Calculate revision number: first submission is revision 1, then 2, 3, etc.
                                    // The revision number in history is the one BEFORE it was rejected
                                    const revisionNumber =
                                      typeof historyRecord.revisionNumber ===
                                      "number"
                                        ? historyRecord.revisionNumber
                                        : idx + 1;

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
                                                "customer.projects.detail.milestone.revisionN",
                                                { n: revisionNumber },
                                              )}
                                            </p>
                                            {historyRecord.requestedChangesAt &&
                                            typeof historyRecord.requestedChangesAt ===
                                              "string" ? (
                                              <span className="text-xs text-gray-500">
                                                {t(
                                                  "customer.projects.detail.milestone.changesRequestedLine",
                                                  {
                                                    date: new Date(
                                                      historyRecord.requestedChangesAt,
                                                    ).toLocaleDateString(),
                                                  },
                                                )}
                                              </span>
                                            ) : null}
                                          </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="pb-3">

                                        {historyRecord.requestedChangesReason &&
                                        typeof historyRecord.requestedChangesReason ===
                                          "string" ? (
                                          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                            <p className="text-xs font-medium text-red-900 mb-1">
                                              {t(
                                                "customer.projects.detail.milestone.reasonForChanges",
                                              )}
                                            </p>
                                            <p className="text-xs text-red-800">
                                              {
                                                historyRecord.requestedChangesReason
                                              }
                                            </p>
                                          </div>
                                        ) : null}

                                        {historyRecord.submitDeliverables ? (
                                          <div className="mb-2">
                                            <p className="text-xs font-medium text-gray-700 mb-1">
                                              {t(
                                                "customer.projects.detail.milestone.historyDeliverables",
                                              )}
                                            </p>
                                            <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                              {typeof historyRecord.submitDeliverables ===
                                                "object" &&
                                              historyRecord.submitDeliverables !==
                                                null &&
                                              "description" in
                                                historyRecord.submitDeliverables &&
                                              typeof (
                                                historyRecord.submitDeliverables as {
                                                  description?: unknown;
                                                }
                                              ).description === "string"
                                                ? (
                                                    historyRecord.submitDeliverables as {
                                                      description: string;
                                                    }
                                                  ).description
                                                : JSON.stringify(
                                                    historyRecord.submitDeliverables,
                                                  )}
                                            </p>
                                          </div>
                                        ) : null}

                                        {historyRecord.submissionNote &&
                                        typeof historyRecord.submissionNote ===
                                          "string" ? (
                                          <div className="mb-2">
                                            <p className="text-xs font-medium text-gray-700 mb-1">
                                              {t(
                                                "customer.projects.detail.milestone.historyNote",
                                              )}
                                            </p>
                                            <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                              {historyRecord.submissionNote}
                                            </p>
                                          </div>
                                        ) : null}

                                        {historyRecord.submissionAttachmentUrl &&
                                        typeof historyRecord.submissionAttachmentUrl ===
                                          "string" ? (
                                          <div>
                                            <p className="text-xs font-medium text-gray-700 mb-1">
                                              {t(
                                                "customer.projects.detail.milestone.historyAttachment",
                                              )}
                                            </p>
                                            {((): React.ReactNode => {
                                              const attachmentUrl =
                                                getAttachmentUrl(
                                                  historyRecord.submissionAttachmentUrl,
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
                                              const normalized =
                                                historyRecord.submissionAttachmentUrl.replace(
                                                  /\\/g,
                                                  "/",
                                                );
                                              const fileName =
                                                normalized.split("/").pop() ||
                                                t(
                                                  "customer.projects.detail.milestone.attachmentFallbackName",
                                                );

                                              return (
                                                <a
                                                  href={
                                                    attachmentUrl === "#"
                                                      ? undefined
                                                      : attachmentUrl
                                                  }
                                                  download={fileName}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  onClick={
                                                    isR2Key &&
                                                    typeof historyRecord.submissionAttachmentUrl ===
                                                      "string"
                                                      ? async (e) => {
                                                          e.preventDefault();
                                                          const attachmentUrl =
                                                            historyRecord.submissionAttachmentUrl;
                                                          if (
                                                            typeof attachmentUrl !==
                                                            "string"
                                                          )
                                                            return;
                                                          try {
                                                            const downloadUrl =
                                                              await getR2DownloadUrl(
                                                                attachmentUrl,
                                                              );
                                                            window.open(
                                                              downloadUrl.downloadUrl,
                                                              "_blank",
                                                            );
                                                          } catch (error) {
                                                            toastHook({
                                                              title: t("customer.projects.detail.toast.errorTitle"),
                                                              description:
                                                                getUserFriendlyErrorMessage(
                                                                  error,
                                                                  "customer project attachment download",
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

                                        {historyRecord.submittedAt &&
                                        typeof historyRecord.submittedAt ===
                                          "string" &&
                                        !isNaN(
                                          new Date(
                                            historyRecord.submittedAt,
                                          ).getTime(),
                                        ) ? (
                                          <p className="text-xs text-gray-500 mt-2">
                                            {t(
                                              "customer.projects.detail.milestone.submittedLine",
                                              {
                                                dateTime: new Date(
                                                  historyRecord.submittedAt,
                                                ).toLocaleString(),
                                              },
                                            )}
                                          </p>
                                        ) : null}
                                        </AccordionContent>
                                      </AccordionItem>
                                    );
                                  })}
                                </Accordion>
                              </div>
                            )}

                          {/* Request Changes Dialog */}
                          <Dialog
                            open={requestChangesDialogOpen}
                            onOpenChange={setRequestChangesDialogOpen}
                          >
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {t(
                                    "customer.projects.detail.requestChangesDialog.title",
                                  )}
                                </DialogTitle>
                                <DialogDescription>
                                  {t(
                                    "customer.projects.detail.requestChangesDialog.desc",
                                  )}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="requestChangesReason">
                                    {t(
                                      "customer.projects.detail.requestChangesDialog.label",
                                    )}
                                  </Label>
                                  <Textarea
                                    id="requestChangesReason"
                                    placeholder={t(
                                      "customer.projects.detail.requestChangesDialog.placeholder",
                                    )}
                                    value={requestChangesReason}
                                    onChange={(e) =>
                                      setRequestChangesReason(e.target.value)
                                    }
                                    rows={5}
                                    required
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    {t(
                                      "customer.projects.detail.requestChangesDialog.hint",
                                    )}
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRequestChangesDialogOpen(false);
                                    setRequestChangesReason("");
                                    setSelectedMilestoneForReject(null);
                                  }}
                                >
                                  {t("customer.projects.detail.common.cancel")}
                                </Button>
                                <Button
                                  onClick={handleRejectMilestone}
                                  disabled={!requestChangesReason.trim()}
                                >
                                  {t(
                                    "customer.projects.detail.milestone.requestChanges",
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          {milestone.status === "LOCKED" &&
                            projectMilestones.findIndex(
                              (m: Milestone) =>
                                m.status === "LOCKED" &&
                                project.status === "IN_PROGRESS",
                            ) === index && (
                              <>
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />

                                  <p className="text-sm text-amber-800">
                                    {
                                      // 🟡 CHECK PREVIOUS MILESTONE (if exists)
                                      index > 0 &&
                                      projectMilestones[index - 1].status !==
                                        "APPROVED"
                                        ? t(
                                            "customer.projects.detail.milestone.lockPreviousNotApproved",
                                          )
                                        : t(
                                            "customer.projects.detail.milestone.lockPaymentFirst",
                                          )
                                    }
                                  </p>
                                </div>
                                <div className="mt-3">
                                  <Button
                                    size="sm"
                                    disabled={
                                      index > 0 &&
                                      projectMilestones[index - 1].status !==
                                        "APPROVED" &&
                                      projectMilestones[index - 1].status !==
                                        "PAID"
                                        ? true
                                        : false
                                    }
                                    onClick={() =>
                                      milestone.id &&
                                      handlePayMilestone(milestone.id)
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-full sm:w-auto"
                                  >
                                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                    {t("customer.projects.detail.milestone.payNow")}
                                  </Button>
                                </div>
                              </>
                            )}
                          {/* Action buttons only shown for SUBMITTED status */}
                          {milestone.status === "SUBMITTED" && milestone.id ? (
                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleOpenApproveMilestoneDialog(
                                    milestone.id!,
                                  )
                                }
                                disabled={
                                  approvingIndividualMilestoneId ===
                                  milestone.id
                                }
                                className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm w-full sm:w-auto"
                              >
                                {approvingIndividualMilestoneId ===
                                milestone.id ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                                    {t(
                                      "customer.projects.detail.milestone.approvingShort",
                                    )}
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                    {t(
                                      "customer.projects.detail.milestone.approveMilestone",
                                    )}
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleRequestChangesClick(milestone.id!)
                                }
                                className="text-xs sm:text-sm w-full sm:w-auto"
                              >
                                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                {t(
                                  "customer.projects.detail.milestone.requestChanges",
                                )}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-8">
                      {t("customer.projects.detail.milestones.noneFound")}
                    </p>
                  )}
                </div>

                <Dialog
                  open={approveMilestoneDialogOpen}
                  onOpenChange={(open) => {
                    if (!open && !approvingIndividualMilestoneId) {
                      setApproveMilestoneDialogOpen(false);
                      setMilestoneIdPendingApprove(null);
                    }
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {t(
                          "customer.projects.detail.approveMilestoneDialog.title",
                        )}
                      </DialogTitle>
                      <DialogDescription>
                        {t(
                          "customer.projects.detail.approveMilestoneDialog.desc",
                        )}
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={handleCancelApproveMilestone}
                        disabled={!!approvingIndividualMilestoneId}
                      >
                        {t("customer.projects.detail.common.cancel")}
                      </Button>
                      <Button
                        onClick={handleConfirmApproveMilestone}
                        disabled={!!approvingIndividualMilestoneId}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {approvingIndividualMilestoneId &&
                        approvingIndividualMilestoneId ===
                          milestoneIdPendingApprove ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            {t(
                              "customer.projects.detail.milestone.approvingShort",
                            )}
                          </>
                        ) : (
                          t("customer.projects.detail.common.confirm")
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bids Tab */}
          <TabsContent value="bids">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b bg-gray-50 p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg font-semibold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span>
                    {proposals.length === 0
                      ? t("customer.projects.detail.bids.titleReceivedZero")
                      : proposals.length <= 5
                        ? t("customer.projects.detail.bids.titleReceived", {
                            n: proposals.length,
                          })
                        : t("customer.projects.detail.bids.titleBestOf", {
                            total: proposals.length,
                          })}
                  </span>
                  {bidsLoading && (
                    <span className="text-xs text-gray-500 font-normal">
                      {t("customer.projects.detail.bids.loading")}
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  {t("customer.projects.detail.bids.sectionDesc")}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 lg:p-6">
                {bidsError && (
                  <div className="text-red-600 text-sm">{bidsError}</div>
                )}

                {!bidsLoading && proposals.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    {t("customer.projects.detail.bids.empty")}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex gap-0 lg:gap-4 relative">
                      {/* Left: list of best 5 proposal cards */}
                      <div
                        className="flex-1 min-w-0 space-y-3 sm:space-y-4"
                        onMouseLeave={() => {
                          if (bidPanelLeaveTimeoutRef.current)
                            clearTimeout(bidPanelLeaveTimeoutRef.current);
                          bidPanelLeaveTimeoutRef.current = setTimeout(
                            () => setOpenExplanationId(null),
                            200,
                          );
                        }}
                      >
                        {proposals.slice(0, 5).map((p) => (
                          <div
                            key={p.id}
                            ref={(el) => {
                              cardRefsMap.current[p.id] = el;
                            }}
                            data-proposal-id={p.id}
                            className="w-full"
                          >
                            <Card
                              className="hover:shadow-md transition-shadow"
                              onMouseEnter={() => {
                                if (bidPanelLeaveTimeoutRef.current) {
                                  clearTimeout(bidPanelLeaveTimeoutRef.current);
                                  bidPanelLeaveTimeoutRef.current = null;
                                }
                                if (p.isTopFive) setOpenExplanationId(p.id);
                              }}
                            >
                              <CardContent className="p-4 sm:p-5 lg:p-6">
                                {/* Small screens only: in-card AI summary when this card is expanded */}
                                {cardSummaryViewId === p.id && (
                                  <div className="lg:hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-4 shadow-sm">
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="p-1.5 rounded-lg bg-blue-100 flex-shrink-0">
                                          <Sparkles className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 truncate">
                                          {p.providerName ||
                                            t(
                                              "customer.projects.detail.common.providerNameFallback",
                                            )}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCardSummaryViewId(null);
                                          setOpenExplanationId(null);
                                        }}
                                        className="shrink-0 p-1.5 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        aria-label={t(
                                          "customer.projects.detail.bids.closeAria",
                                        )}
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                      {t("customer.projects.detail.bids.whyFits")}
                                    </p>
                                    {!p.aiFitExplanation &&
                                    explanationLoading[p.id] ? (
                                      <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                                        <span>
                                          {t("customer.projects.detail.bids.loading")}
                                        </span>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-700 leading-relaxed">
                                        {getBidSummary(
                                          p.id,
                                          p.aiFitExplanation,
                                          explanationCache[p.id],
                                        )}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* Normal card content (hidden on small when this card is showing summary) */}
                                <div
                                  className={cn(
                                    "flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6",
                                    cardSummaryViewId === p.id &&
                                      "hidden lg:flex",
                                  )}
                                >
                                  {/* Provider Info */}
                                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                                    <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                      <AvatarImage
                                        src={
                                          p.providerAvatar &&
                                          p.providerAvatar !==
                                            "/placeholder.svg?height=40&width=40" &&
                                          !p.providerAvatar.includes(
                                            "/placeholder.svg",
                                          )
                                            ? p.providerAvatar
                                            : "/placeholder.svg"
                                        }
                                      />
                                      <AvatarFallback>
                                        {String(p.providerName || "P")
                                          .split(" ")
                                          .filter(Boolean)
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                          {p.providerName ||
                                            t(
                                              "customer.projects.detail.common.providerNameFallback",
                                            )}
                                        </h3>
                                        {p.isTopFive && (
                                          <Badge
                                            className="bg-blue-100 text-blue-800 border-blue-300 text-xs shrink-0"
                                            title={t(
                                              "customer.projects.detail.bids.topBidTooltip",
                                            )}
                                          >
                                            <Sparkles className="w-3 h-3 mr-1" />
                                            {t(
                                              "customer.projects.detail.bids.bestRank",
                                              { rank: p.rank ?? "" },
                                            )}
                                          </Badge>
                                        )}
                                        {p.matchScore != null &&
                                          p.matchScore > 0 && (
                                            <span className="text-xs text-gray-500">
                                              {t(
                                                "customer.projects.detail.bids.matchPercent",
                                                { n: p.matchScore },
                                              )}
                                            </span>
                                          )}
                                        <div className="flex items-center gap-1">
                                          <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                                          <span className="text-xs sm:text-sm text-gray-600">
                                            {p.providerRating ??
                                              t(
                                                "customer.projects.detail.bids.noRating",
                                              )}
                                          </span>
                                        </div>
                                        {/* Mobile: tap to show AI summary in-card */}
                                        {p.isTopFive && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenExplanationId((prev) =>
                                                prev === p.id ? null : p.id,
                                              );
                                              setCardSummaryViewId((prev) =>
                                                prev === p.id ? null : p.id,
                                              );
                                            }}
                                            className="lg:hidden inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                                            aria-label={t(
                                              "customer.projects.detail.bids.seeWhyAria",
                                            )}
                                          >
                                            <HelpCircle className="w-3.5 h-3.5" />
                                            {t(
                                              "customer.projects.detail.bids.tapHereToSee",
                                            )}
                                          </button>
                                        )}
                                      </div>

                                      {p.coverLetter && (
                                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 break-words">
                                          {p.coverLetter}
                                        </p>
                                      )}

                                      {Array.isArray(p.skills) &&
                                        p.skills.length > 0 && (
                                          <div className="flex flex-wrap gap-1">
                                            {p.skills
                                              .slice(0, 3)
                                              .map((skill: string) => (
                                                <Badge
                                                  key={skill}
                                                  variant="secondary"
                                                  className="text-[10px] leading-tight"
                                                >
                                                  {skill}
                                                </Badge>
                                              ))}
                                            {p.skills.length > 3 && (
                                              <Badge
                                                variant="secondary"
                                                className="text-[10px] leading-tight"
                                              >
                                                {t(
                                                  "customer.projects.detail.bids.moreSkills",
                                                  {
                                                    n: p.skills.length - 3,
                                                  },
                                                )}
                                              </Badge>
                                            )}
                                          </div>
                                        )}
                                    </div>
                                  </div>

                                  {/* Right column */}
                                  <div className="lg:w-80 space-y-2 sm:space-y-3">
                                    {/* Status + submitted date */}
                                    <div className="flex justify-between items-center">
                                      <Badge
                                        className={
                                          p.status === "pending"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : p.status === "accepted"
                                              ? "bg-green-100 text-green-800"
                                              : p.status === "rejected"
                                                ? "bg-red-100 text-red-800"
                                                : "bg-gray-100 text-gray-800"
                                        }
                                      >
                                        {getProposalStatusLabel(
                                          String(p.status ?? ""),
                                        )}
                                      </Badge>

                                      <span className="text-sm text-gray-500">
                                        {p.submittedAt &&
                                        !isNaN(
                                          new Date(p.submittedAt).getTime(),
                                        )
                                          ? new Date(
                                              p.submittedAt,
                                            ).toLocaleDateString()
                                          : t(
                                              "customer.projects.detail.milestone.emDash",
                                            )}
                                      </span>
                                    </div>

                                    {/* Bid / timeline */}
                                    <div className="flex justify-between items-center">
                                      <div>
                                        <p className="text-sm text-gray-600">
                                          {t(
                                            "customer.projects.detail.bids.bidAmount",
                                          )}
                                        </p>
                                        <p className="font-semibold text-lg">
                                          {currency}{" "}
                                          {Number(
                                            p.bidAmount ?? 0,
                                          ).toLocaleString()}
                                        </p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-gray-600">
                                          {t(
                                            "customer.projects.detail.label.timeline",
                                          )}
                                        </p>
                                        <p className="font-medium">
                                          {p.proposedTimeline ||
                                            t(
                                              "customer.projects.detail.milestone.emDash",
                                            )}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Mini milestones preview */}
                                    {!!p.milestones?.length && (
                                      <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                                        <div className="font-medium text-gray-900 mb-1">
                                          {t(
                                            "customer.projects.detail.bids.proposedMilestonesSection",
                                          )}
                                        </div>
                                        <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                          {p.milestones.map(
                                            (
                                              m: {
                                                title: string;
                                                amount: number;
                                                dueDate?: string;
                                                daysFromStart?: number;
                                                order: number;
                                                description?: string;
                                              },
                                              idx: number,
                                            ) => (
                                              <li
                                                key={idx}
                                                className="flex justify-between"
                                              >
                                                <span className="truncate">
                                                  {m.title ||
                                                    t(
                                                      "customer.projects.detail.bids.milestoneFallback",
                                                      { n: idx + 1 },
                                                    )}
                                                </span>
                                                <span>
                                                  {currency}{" "}
                                                  {Number(
                                                    m.amount || 0,
                                                  ).toLocaleString()}
                                                </span>
                                              </li>
                                            ),
                                          )}
                                        </ul>
                                      </div>
                                    )}

                                    {/* Actions - column layout, View details highlighted */}
                                    <div className="flex flex-col gap-2 pt-2">
                                      <Button
                                        size="sm"
                                        className="w-full min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                        onClick={() => {
                                          // sync the dialog state to match requests page structure:
                                          setSelectedProposalDetails({
                                            ...p, // Include all proposal data
                                            provider: {
                                              id: p.providerId,
                                              name: p.providerName,
                                              avatar: p.providerAvatar,
                                              rating: p.providerRating,
                                              location: p.providerLocation,
                                            },
                                            projectTitle:
                                              p.projectTitle ||
                                              (project.title as string) ||
                                              "",
                                            bidAmount: p.bidAmount,
                                            proposedTimeline:
                                              p.proposedTimeline,
                                            deliveryTime:
                                              p.proposedTimeline?.replace(
                                                " days",
                                                "",
                                              ) || p.proposedTimeline,
                                            coverLetter: p.coverLetter,
                                            createdAt: p.submittedAt,
                                            submittedAt: p.submittedAt,
                                            status: p.status,
                                            milestones: p.milestones.map(
                                              (m: {
                                                title: string;
                                                amount: number;
                                                dueDate?: string;
                                                daysFromStart?: number;
                                                order: number;
                                                description?: string;
                                              }) => ({
                                                title: m.title,
                                                amount: m.amount,
                                                dueDate: m.dueDate,
                                                daysFromStart: m.daysFromStart,
                                                sequence: m.order,
                                                order: m.order,
                                                description: m.description,
                                              }),
                                            ),
                                            attachmentUrls: p.attachments || [],
                                            attachments: p.attachments || [],
                                            skills: p.skills || [],
                                            portfolio: p.portfolio || [],
                                            experience:
                                              (
                                                p as ProviderRequest & {
                                                  experience?: string;
                                                }
                                              ).experience || "",
                                          });
                                          setProposalDetailsOpen(true);
                                        }}
                                      >
                                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 shrink-0" />
                                        <span className="truncate">
                                          {t(
                                            "customer.projects.detail.bids.showDetails",
                                          )}
                                        </span>
                                      </Button>
                                      <NextLink
                                        href={`/customer/providers/${p.providerId}`}
                                        className="w-full"
                                      >
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm justify-center border-gray-300 hover:bg-gray-50"
                                        >
                                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 shrink-0" />
                                          <span className="truncate">
                                            {t(
                                              "customer.projects.detail.viewProfile",
                                            )}
                                          </span>
                                        </Button>
                                      </NextLink>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>

                      {/* Right: AI summary panel (desktop hover only; small screens use in-card summary) */}
                      {/* Backdrop only when drawer is used (not when in-card summary on mobile) */}
                      {openExplanationId && !cardSummaryViewId && (
                        <div
                          className="fixed inset-0 z-40 bg-black/20 lg:hidden"
                          aria-hidden
                          onClick={() => {
                            setOpenExplanationId(null);
                            setCardSummaryViewId(null);
                          }}
                        />
                      )}
                      <div
                        ref={rightPanelColumnRef}
                        className={cn(
                          "transition-all duration-300 ease-out",
                          "hidden lg:block",
                          "lg:overflow-hidden lg:flex-shrink-0",
                          "fixed right-0 top-0 bottom-0 z-50 w-80 max-w-[85vw] lg:relative lg:top-auto lg:bottom-auto lg:right-auto lg:z-auto lg:max-w-none",
                          openExplanationId
                            ? "translate-x-0 lg:w-80"
                            : "translate-x-full lg:translate-x-0 lg:w-0",
                        )}
                        onMouseEnter={() => {
                          if (bidPanelLeaveTimeoutRef.current) {
                            clearTimeout(bidPanelLeaveTimeoutRef.current);
                            bidPanelLeaveTimeoutRef.current = null;
                          }
                        }}
                        onMouseLeave={() => setOpenExplanationId(null)}
                      >
                        {/* Spacer so panel aligns vertically with the hovered card */}
                        {openExplanationId && panelTopOffset > 0 && (
                          <div
                            className="hidden lg:block shrink-0"
                            style={{ height: panelTopOffset }}
                            aria-hidden
                          />
                        )}
                        <div
                          className={cn(
                            "h-full lg:h-auto w-80 max-w-[85vw] lg:max-w-none min-h-[140px] rounded-none lg:rounded-xl border-0 lg:border border-gray-200 bg-white shadow-xl lg:shadow-lg p-4 lg:ml-0",
                            openExplanationId
                              ? "translate-x-0 opacity-100"
                              : "translate-x-4 opacity-0 lg:translate-x-0",
                          )}
                          style={{
                            transition:
                              "opacity 0.3s ease-out, transform 0.3s ease-out",
                          }}
                        >
                          {openExplanationId && (
                            <>
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <div className="p-1.5 rounded-lg bg-blue-100 flex-shrink-0">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <span className="text-sm font-semibold text-gray-900 truncate">
                                    {proposals.find(
                                      (x) => x.id === openExplanationId,
                                    )?.providerName ||
                                      t(
                                        "customer.projects.detail.common.providerNameFallback",
                                      )}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setOpenExplanationId(null)}
                                  className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none flex-shrink-0"
                                  aria-label={t(
                                    "customer.projects.detail.bids.closeAria",
                                  )}
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                                {t("customer.projects.detail.bids.whyFits")}
                              </p>
                              {!proposals.find(
                                (x) => x.id === openExplanationId,
                              )?.aiFitExplanation &&
                              explanationLoading[openExplanationId] ? (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                                  <span>
                                    {t("customer.projects.detail.bids.loading")}
                                  </span>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {getBidSummary(
                                    openExplanationId,
                                    proposals.find(
                                      (x) => x.id === openExplanationId,
                                    )?.aiFitExplanation,
                                    explanationCache[openExplanationId],
                                  )}
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    {(() => {
                      const bidsServiceRequestId =
                        project?.type === "ServiceRequest"
                          ? project?.id
                          : ((project as Record<string, unknown>)
                              ?.serviceRequestId as string | undefined);
                      return bidsServiceRequestId ? (
                        <div className="flex justify-center pt-4 mt-4 border-t border-gray-100">
                          <NextLink
                            href={`/customer/requests?project=${encodeURIComponent(bidsServiceRequestId)}`}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs sm:text-sm"
                            >
                              {t(
                                "customer.projects.detail.bids.showAllProposals",
                              )}
                            </Button>
                          </NextLink>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4 sm:space-y-6">
            {/* Proposal Attachments Section */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  {t("customer.projects.detail.files.proposalAttachments")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t("customer.projects.detail.files.proposalAttachmentsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {(() => {
                  // Get attachments from accepted proposals only
                  const acceptedProposals = proposals.filter(
                    (p) => p.status === "accepted",
                  );
                  const proposalAttachments: Array<{
                    url: string;
                    proposalName: string;
                    proposalId: string;
                  }> = [];

                  acceptedProposals.forEach((proposal) => {
                    if (
                      Array.isArray(proposal.attachments) &&
                      proposal.attachments.length > 0
                    ) {
                      proposal.attachments.forEach((url: string) => {
                        proposalAttachments.push({
                          url,
                          proposalName: proposal.providerName || "Provider",
                          proposalId: proposal.id,
                        });
                      });
                    }
                  });

                  if (proposalAttachments.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-8">
                        {t(
                          "customer.projects.detail.files.noProposalAttachments",
                        )}
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {proposalAttachments.map((attachment, idx) => {
                        const normalized = attachment.url.replace(/\\/g, "/");
                        const fileName =
                          normalized.split("/").pop() || `file-${idx + 1}`;
                        const attachmentUrl = getAttachmentUrl(attachment.url);
                        const isR2Key =
                          attachmentUrl === "#" ||
                          (!attachmentUrl.startsWith("http") &&
                            !attachmentUrl.startsWith("/uploads/") &&
                            !attachmentUrl.includes(
                              process.env.NEXT_PUBLIC_API_URL || "localhost",
                            ));

                        return (
                          <a
                            key={idx}
                            href={
                              attachmentUrl === "#" ? undefined : attachmentUrl
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
                                        await getR2DownloadUrl(attachment.url); // Use original URL/key
                                      window.open(
                                        downloadUrl.downloadUrl,
                                        "_blank",
                                      );
                                    } catch (error) {
                                      toastHook({
                                        title: t("customer.projects.detail.toast.errorTitle"),
                                        description:
                                          getUserFriendlyErrorMessage(
                                            error,
                                            "customer project attachment download",
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
                              PDF
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                {fileName}
                              </span>
                              <span className="text-xs text-gray-500 leading-snug">
                                {t(
                                  "customer.projects.detail.files.fromClickHint",
                                  { name: attachment.proposalName },
                                )}
                              </span>
                            </div>
                            <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                              <Download className="w-4 h-4" />
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
              <CardHeader>
                <CardTitle>
                  {t("customer.projects.detail.files.milestoneAttachments")}
                </CardTitle>
                <CardDescription>
                  {t("customer.projects.detail.files.milestoneAttachmentsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
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
                      (milestone.submissionHistory as unknown[]).forEach(
                        (history: unknown) => {
                          const historyRecord = history as Record<
                            string,
                            unknown
                          >;
                          if (
                            historyRecord.submissionAttachmentUrl &&
                            typeof historyRecord.submissionAttachmentUrl ===
                              "string" &&
                            milestone.id
                          ) {
                            milestoneAttachments.push({
                              url: historyRecord.submissionAttachmentUrl,
                              milestoneTitle: t(
                                "customer.projects.detail.files.revisionLabel",
                                {
                                  title: String(milestone.title ?? ""),
                                  rev:
                                    typeof historyRecord.revisionNumber ===
                                    "number"
                                      ? String(historyRecord.revisionNumber)
                                      : t(
                                          "customer.projects.detail.files.revisionNA",
                                        ),
                                },
                              ),
                              milestoneId: milestone.id,
                              submittedAt:
                                typeof historyRecord.submittedAt === "string"
                                  ? historyRecord.submittedAt
                                  : undefined,
                            });
                          }
                        },
                      );
                    }
                  });

                  if (milestoneAttachments.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-8">
                        {t(
                          "customer.projects.detail.files.noMilestoneAttachments",
                        )}
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {milestoneAttachments.map((attachment, idx) => {
                        const normalized = attachment.url.replace(/\\/g, "/");
                        const fileName =
                          normalized.split("/").pop() || `file-${idx + 1}`;
                        const attachmentUrl = getAttachmentUrl(attachment.url);
                        const isR2Key =
                          attachmentUrl === "#" ||
                          (!attachmentUrl.startsWith("http") &&
                            !attachmentUrl.startsWith("/uploads/") &&
                            !attachmentUrl.includes(
                              process.env.NEXT_PUBLIC_API_URL || "localhost",
                            ));

                        return (
                          <a
                            key={idx}
                            href={
                              attachmentUrl === "#" ? undefined : attachmentUrl
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
                                        await getR2DownloadUrl(attachment.url); // Use original URL/key
                                      window.open(
                                        downloadUrl.downloadUrl,
                                        "_blank",
                                      );
                                    } catch (error) {
                                      toastHook({
                                        title: t("customer.projects.detail.toast.errorTitle"),
                                        description:
                                          getUserFriendlyErrorMessage(
                                            error,
                                            "customer project attachment download",
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
                              PDF
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                {fileName}
                              </span>
                              <span className="text-xs text-gray-500 leading-snug">
                                {t("customer.projects.detail.files.fromNameLine", {
                                  name: attachment.milestoneTitle,
                                })}
                                {attachment.submittedAt &&
                                !isNaN(
                                  new Date(attachment.submittedAt).getTime(),
                                )
                                  ? t(
                                      "customer.projects.detail.files.submittedPart",
                                      {
                                        date: new Date(
                                          attachment.submittedAt,
                                        ).toLocaleDateString(),
                                      },
                                    )
                                  : ""}
                                <span className="block mt-0.5">
                                  {t(
                                    "customer.projects.detail.milestone.clickPreviewDownload",
                                  )}
                                </span>
                              </span>
                            </div>
                            <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                              <Download className="w-4 h-4" />
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
              <CardHeader>
                <CardTitle>
                  {t("customer.projects.detail.files.messageAttachments")}
                </CardTitle>
                <CardDescription>
                  {t("customer.projects.detail.files.messageAttachmentsDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const messageAttachments = projectFiles.flatMap(
                    (message: Record<string, unknown>) =>
                      Array.isArray(message.attachments)
                        ? message.attachments.map((url: string) => ({
                            url,
                            senderName:
                              ((message.sender as Record<string, unknown>)
                                ?.name as string) ||
                              (message.senderName as string) ||
                              t("customer.projects.detail.messages.senderUser"),
                            messageId: message.id as string,
                            timestamp:
                              (message.createdAt as string) ||
                              (message.timestamp as string),
                          }))
                        : [],
                  );
                  if (messageAttachments.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-8">
                        {t(
                          "customer.projects.detail.files.noMessageAttachments",
                        )}
                      </p>
                    );
                  }
                  return (
                    <div className="space-y-2">
                      {messageAttachments.map((attachment, idx) => {
                        const normalized = attachment.url.replace(/\\/g, "/");
                        const fileName =
                          normalized.split("/").pop() || `file-${idx + 1}`;

                        // Use getAttachmentUrl helper for consistent URL handling
                        const attachmentUrl = getAttachmentUrl(attachment.url);
                        const isR2Key =
                          attachmentUrl === "#" ||
                          (!attachmentUrl.startsWith("http") &&
                            !attachmentUrl.startsWith("/uploads/") &&
                            !attachmentUrl.includes(
                              process.env.NEXT_PUBLIC_API_URL || "localhost",
                            ));

                        return (
                          <a
                            key={idx}
                            href={
                              attachmentUrl === "#" ? undefined : attachmentUrl
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
                                        await getR2DownloadUrl(attachment.url); // Use original URL/key
                                      window.open(
                                        downloadUrl.downloadUrl,
                                        "_blank",
                                      );
                                    } catch (error) {
                                      toastHook({
                                        title: t("customer.projects.detail.toast.errorTitle"),
                                        description:
                                          getUserFriendlyErrorMessage(
                                            error,
                                            "customer project attachment download",
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
                              PDF
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                {fileName}
                              </span>
                              <span className="text-xs text-gray-500 leading-snug">
                                {t(
                                  "customer.projects.detail.files.fromSenderHint",
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
                <CardTitle className="text-base sm:text-lg">
                  {t("customer.projects.detail.messages.sectionTitle")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t("customer.projects.detail.messages.sectionDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                  {msgsToRender.map((message: Record<string, unknown>) => {
                    const messageSender = message.sender as
                      | Record<string, unknown>
                      | undefined;
                    const isCurrentUser =
                      String(message.senderId || messageSender?.id) ===
                      String(currentUserId);
                    const text =
                      (message.content as string) ??
                      (message.message as string) ??
                      "";
                    const ts =
                      (message.createdAt as string) ??
                      (message.timestamp as string) ??
                      "";
                    const senderName =
                      (messageSender?.name as string) ||
                      (message.senderName as string) ||
                      (isCurrentUser
                        ? t("customer.projects.detail.messages.senderYou")
                        : t("customer.projects.detail.messages.senderUser"));
                    const avatarChar = senderName?.charAt?.(0) || "U";
                    const messageId = message.id as string | number | undefined;
                    const messageKey =
                      messageId !== undefined
                        ? String(messageId)
                        : `msg-${Math.random()}`;

                    return (
                      <div
                        key={messageKey}
                        className={`flex gap-3 ${
                          isCurrentUser ? "flex-row-reverse" : ""
                        }`}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>{avatarChar}</AvatarFallback>
                        </Avatar>
                        <div
                          className={`flex-1 max-w-[14rem] ${
                            isCurrentUser ? "text-right" : ""
                          }`}
                        >
                          <div
                            className={`p-3 rounded-lg ${
                              isCurrentUser
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100"
                            }`}
                          >
                            <p className="text-sm">{text}</p>
                            {message.attachments &&
                            Array.isArray(message.attachments) &&
                            message.attachments.length > 0 ? (
                              <div className="mt-2 pt-2 border-t border-opacity-20 space-y-2">
                                {(message.attachments as unknown[]).map(
                                  (attachment: unknown, index: number) => {
                                    const attachmentStr =
                                      typeof attachment === "string"
                                        ? attachment
                                        : String(attachment);
                                    const url = getFullUrl(attachmentStr);
                                    const name =
                                      url.split("/").pop() || `file-${index}`;

                                    return (
                                      <div key={index} className="text-xs">
                                        {isImage(url) ? (
                                          <div className="relative w-32 h-auto rounded border cursor-pointer">
                                            <Image
                                              src={url}
                                              alt={name}
                                              width={128}
                                              height={128}
                                              className="w-32 h-auto rounded border"
                                              unoptimized
                                              onError={(e) => {
                                                const target =
                                                  e.target as HTMLImageElement;
                                                target.style.display = "none";
                                              }}
                                            />
                                          </div>
                                        ) : isPDF(url) ? (
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-500 underline"
                                          >
                                            📄 {name}
                                          </a>
                                        ) : (
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-500 underline"
                                          >
                                            📎 {name}
                                          </a>
                                        )}
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{ts}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(project.assignedProvider || project.provider) && (
                  <>
                    <Separator className="my-3 sm:my-4" />
                    <div className="flex justify-center gap-2">
                      <Button
                        className="w-full sm:w-auto text-xs sm:text-sm"
                        onClick={() =>
                          handleContact(
                            project.provider?.id,
                            project.provider?.name,
                            (
                              project.provider as
                                | {
                                    providerProfile?: {
                                      profileImageUrl?: string;
                                    };
                                  }
                                | undefined
                            )?.providerProfile?.profileImageUrl ||
                              project.assignedProvider?.providerProfile
                                ?.profileImageUrl,
                          )
                        }
                      >
                        {t("customer.projects.detail.contact")}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {t("customer.projects.detail.editDialog.title")}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div>
              <Label className="text-sm sm:text-base">
                {t("customer.projects.detail.editDialog.labelTitle")}
              </Label>
              <Input
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                className="mt-1.5 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label className="text-sm sm:text-base">
                {t("customer.projects.detail.editDialog.labelDescription")}
              </Label>
              <Textarea
                rows={4}
                value={edit.description}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
                className="mt-1.5 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm sm:text-base">
                  {t("customer.projects.detail.editDialog.labelCategory")}
                </Label>
                <Input
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({ ...edit, category: e.target.value })
                  }
                  className="mt-1.5 text-sm sm:text-base"
                />
              </div>
              <div>
                <Label className="text-sm sm:text-base">
                  {t("customer.projects.detail.editDialog.labelPriority")}
                </Label>
                <Input
                  value={edit.priority}
                  onChange={(e) =>
                    setEdit({ ...edit, priority: e.target.value })
                  }
                  className="mt-1.5 text-sm sm:text-base"
                />
              </div>
              <div>
                <Label className="text-sm sm:text-base">
                  {t("customer.projects.detail.editDialog.labelTimeline")}
                </Label>
                <Input
                  value={edit.timeline}
                  onChange={(e) =>
                    setEdit({ ...edit, timeline: e.target.value })
                  }
                  className="mt-1.5 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm sm:text-base">
                  {t("customer.projects.detail.editDialog.labelBudgetMin")}
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={edit.budgetMin}
                  onChange={(e) =>
                    setEdit({ ...edit, budgetMin: e.target.value })
                  }
                  className="mt-1.5 text-sm sm:text-base"
                />
              </div>
              <div>
                <Label className="text-sm sm:text-base">
                  {t("customer.projects.detail.editDialog.labelBudgetMax")}
                </Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={edit.budgetMax}
                  onChange={(e) =>
                    setEdit({ ...edit, budgetMax: e.target.value })
                  }
                  className="mt-1.5 text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm sm:text-base">
                {t("customer.projects.detail.editDialog.labelSkills")}
              </Label>
              <Textarea
                rows={2}
                placeholder={t(
                  "customer.projects.detail.editDialog.skillsPlaceholder",
                )}
                value={edit.skills}
                onChange={(e) => setEdit({ ...edit, skills: e.target.value })}
                className="mt-1.5 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm sm:text-base">
                  {t("customer.projects.detail.editDialog.labelRequirements")}
                </Label>
                <div className="mt-1.5">
                  <RichEditor
                    content={edit.requirements}
                    onChange={(value) =>
                      setEdit({ ...edit, requirements: value })
                    }
                    placeholder={t(
                      "customer.projects.detail.editDialog.requirementsPlaceholder",
                    )}
                    initialHeight={200}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm sm:text-base">
                  {t("customer.projects.detail.editDialog.labelDeliverables")}
                </Label>
                <div className="mt-1.5">
                  <RichEditor
                    content={edit.deliverables}
                    onChange={(value) =>
                      setEdit({ ...edit, deliverables: value })
                    }
                    placeholder={t(
                      "customer.projects.detail.editDialog.deliverablesPlaceholder",
                    )}
                    initialHeight={200}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              {t("customer.projects.detail.common.cancel")}
            </Button>
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
              {t("customer.projects.detail.editDialog.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      {/* <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Milestone Payment</DialogTitle>
            <DialogDescription>
              Confirm payment for the milestone work
            </DialogDescription>
          </DialogHeader>

          {selectedMilestoneForPayment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">
                  {selectedMilestoneForPayment.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedMilestoneForPayment.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Amount to pay:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {currency} {selectedMilestoneForPayment.amount}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Payment Method
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  This is a temporary payment dialog. In production, this would
                  integrate with payment gateways like Stripe, FPX, or other
                  payment methods.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={processingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={processingPayment}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-3xl w-full">
          <MilestonePayment
            milestone={{
              id: selectedMilestoneForPayment?.id || "",
              title: selectedMilestoneForPayment?.title || "",
              amount: selectedMilestoneForPayment?.amount || 0,
              projectId: project?.id || "",
              currency:
                typeof project?.currencyCode === "string"
                  ? project.currencyCode
                  : "MYR",
            }}
            type={"customer"}
            onSuccess={() => {
              setPaymentDialogOpen(false);
              refreshProjectData();
              toast({
                title: t("customer.projects.detail.toast.paymentSuccessTitle"),
                description: t("customer.projects.detail.toast.paymentSuccessDesc"),
              });
            }}
          />
          {/* <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              You are about to process payment for milestone:{" "}
              <strong>{selectedMilestoneForPayment?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedMilestoneForPayment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">
                  {selectedMilestoneForPayment.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedMilestoneForPayment.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Amount to pay:</span>
                  <span className="text-lg font-semibold text-green-600">
                    {currency} {selectedMilestoneForPayment.amount}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm mb-2">Enter card details</p>
                <div className="p-3 border rounded">
                  <CardElement
                    options={{
                      style: {
                        base: { fontSize: "16px", color: "#111827" },
                        invalid: { color: "#ef4444" },
                      },
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use Stripe test card <code>4242 4242 4242 4242</code> with any
                  future expiry & CVC to simulate a successful payment.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={processingPayment}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleProcessPayment}
              disabled={processingPayment}
            >
              {processingPayment ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter> */}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="p-5 sm:p-6 max-w-xl">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
              {t("customer.projects.detail.rejectDialog.title")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 leading-relaxed">
              {t("customer.projects.detail.rejectDialog.desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-1">
            <div className="space-y-2">
              <Label
                htmlFor="rejectReason"
                className="text-sm font-semibold text-gray-900 tracking-tight"
              >
                {t("customer.projects.detail.rejectDialog.reasonLabel")}
              </Label>
              <Textarea
                id="rejectReason"
                placeholder={t(
                  "customer.projects.detail.rejectDialog.placeholder",
                )}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="text-sm resize-none"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
              className="w-full sm:w-auto text-sm"
            >
              {t("customer.projects.detail.common.cancel")}
            </Button>
            <Button
              onClick={() =>
                selectedProposalForAction && handleConfirmRejectProposal()
              }
              className="w-full sm:w-auto text-sm bg-red-600 hover:bg-red-700"
              disabled={
                !rejectReason.trim() ||
                processingId === selectedProposalForAction?.id
              }
            >
              {processingId === selectedProposalForAction?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("customer.projects.detail.rejectDialog.rejecting")}
                </>
              ) : (
                t("customer.projects.detail.rejectDialog.submit")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proposal Details Dialog (View Details) */}
      <Dialog
        open={proposalDetailsOpen}
        onOpenChange={(open) => {
          setProposalDetailsOpen(open);
          if (!open) {
            setSelectedProposalDetails(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 text-base">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
              {t("customer.projects.detail.proposalDetails.title")}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              {t("customer.projects.detail.proposalDetails.desc", {
                name:
                  selectedProposalDetails?.provider?.name ||
                  selectedProposalDetails?.providerName ||
                  t("customer.projects.detail.common.providerNameFallback"),
              })}
            </DialogDescription>
          </DialogHeader>

          {selectedProposalDetails && (
            <div className="space-y-6 pt-1">
              {/* Provider Info */}
              <div className="flex items-start gap-4">
                <Avatar className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0">
                  <AvatarImage
                    src={getProfileImageUrl(
                      selectedProposalDetails.providerAvatar ||
                        selectedProposalDetails.provider?.providerProfile
                          ?.profileImageUrl,
                    )}
                  />
                  <AvatarFallback>
                    {String(
                      selectedProposalDetails.provider?.name ||
                        selectedProposalDetails.providerName ||
                        "P",
                    )
                      .split(" ")
                      .filter(Boolean)
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  {/* Name + rating */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight">
                        {selectedProposalDetails.provider?.name ||
                          selectedProposalDetails.providerName ||
                          t(
                            "customer.projects.detail.common.providerNameFallback",
                          )}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1.5">
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />
                          <span>
                            {selectedProposalDetails.provider?.rating ||
                              selectedProposalDetails.providerRating ||
                              0}{" "}
                            {t(
                              "customer.projects.detail.proposalDetails.ratingSuffix",
                            )}
                          </span>
                        </div>
                      </div>

                      {selectedProposalDetails.experience && (
                        <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                          {selectedProposalDetails.experience}{" "}
                          {t(
                            "customer.projects.detail.proposalDetails.experienceSuffix",
                          )}
                        </p>
                      )}

                      {/* Skills inline preview */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {asArray<string>(selectedProposalDetails.skills || [])
                          .slice(0, 4)
                          .map((skill: string) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs leading-tight"
                            >
                              {skill}
                            </Badge>
                          ))}
                        {asArray<string>(selectedProposalDetails.skills || [])
                          .length > 4 && (
                          <Badge
                            variant="secondary"
                            className="text-xs leading-tight"
                          >
                            {t("customer.projects.detail.bids.moreSkills", {
                              n:
                                asArray<string>(
                                  selectedProposalDetails.skills || [],
                                ).length - 4,
                            })}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* View profile button */}
                    <NextLink
                      href={`/customer/providers/${
                        selectedProposalDetails.provider?.id ||
                        selectedProposalDetails.providerId
                      }`}
                      className="sm:flex-shrink-0"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center text-sm"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        {t("customer.projects.detail.viewProfile")}
                      </Button>
                    </NextLink>
                  </div>
                </div>
              </div>

              <Separator className="my-1" />

              {/* Project & Bid Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                    {t("customer.projects.detail.proposalDetails.projectHeading")}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {selectedProposalDetails.projectTitle || project.title}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                    {t(
                      "customer.projects.detail.proposalDetails.bidAmountHeading",
                    )}
                  </h4>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {currency}
                    {fmt(selectedProposalDetails.bidAmount || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                    {t(
                      "customer.projects.detail.proposalDetails.proposedTimelineHeading",
                    )}
                  </h4>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {formatTimeline(selectedProposalDetails.proposedTimeline) ||
                      (selectedProposalDetails.deliveryTime
                        ? formatTimeline(
                            selectedProposalDetails.deliveryTime,
                            "day",
                          )
                        : null) ||
                      t("customer.projects.detail.milestone.emDash")}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                    {t("customer.projects.detail.proposalDetails.statusHeading")}
                  </h4>
                  <Badge
                    className={getStatusColor(
                      selectedProposalDetails.status || "pending",
                    )}
                  >
                    {getProposalStatusLabel(
                      selectedProposalDetails.status || "pending",
                    )}
                  </Badge>
                </div>
              </div>

              <Separator className="my-1" />

              {/* Cover Letter */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                  {t("customer.projects.detail.proposalDetails.coverLetter")}
                </h4>
                <div className="bg-gray-50/80 p-4 rounded-lg border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {selectedProposalDetails.coverLetter}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                  {t("customer.projects.detail.proposalDetails.skillsHeading")}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {asArray<string>(selectedProposalDetails.skills || []).map(
                    (skill: string) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-xs"
                      >
                        {skill}
                      </Badge>
                    ),
                  )}
                </div>
              </div>

              {/* Portfolio */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                  {t("customer.projects.detail.proposalDetails.portfolioHeading")}
                </h4>
                <div className="space-y-1.5">
                  {asArray<string>(selectedProposalDetails.portfolio || []).map(
                    (link: string, index: number) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        {link}
                      </a>
                    ),
                  )}
                  {asArray<string>(selectedProposalDetails.portfolio || [])
                    .length === 0 && (
                    <p className="text-sm text-gray-500">
                      {t(
                        "customer.projects.detail.proposalDetails.portfolioEmpty",
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Proposed Milestones */}
              {selectedProposalDetails.milestones &&
                selectedProposalDetails.milestones.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                      {t(
                        "customer.projects.detail.proposalDetails.proposedMilestonesHeading",
                      )}
                    </h4>

                    <div className="space-y-3">
                      {(() => {
                        const sorted = [
                          ...selectedProposalDetails.milestones,
                        ].sort(
                          (
                            a: { order?: number; sequence?: number },
                            b: { order?: number; sequence?: number },
                          ) =>
                            (a.order || a.sequence || 0) -
                            (b.order || b.sequence || 0),
                        );
                        return sorted.map(
                          (
                            m: {
                              title?: string;
                              amount?: number;
                              dueDate?: string;
                              order?: number;
                              sequence?: number;
                              description?: string;
                              daysFromStart?: number;
                            },
                            idx: number,
                          ) => {
                            const prev = sorted[idx - 1] as
                              | { daysFromStart?: number | string }
                              | undefined;
                            const currDays = Number(m.daysFromStart ?? 0);
                            const prevDays = Number(prev?.daysFromStart ?? 0);
                            const durationDays = currDays - prevDays;
                            const durationStr =
                              durationDays > 0
                                ? t(
                                    "customer.projects.detail.proposalDetails.durationLine",
                                    {
                                      duration:
                                        formatDurationDays(durationDays),
                                    },
                                  )
                                : "";
                            const byDayStr =
                              currDays > 0
                                ? t(
                                    "customer.projects.detail.proposalDetails.byDayFromStart",
                                    { n: currDays },
                                  )
                                : "";
                            const dueStr = m.dueDate
                              ? t(
                                  "customer.projects.detail.proposalDetails.dueLine",
                                  {
                                    date: new Date(
                                      m.dueDate,
                                    ).toLocaleDateString(),
                                  },
                                )
                              : "";
                            const displayText =
                              durationStr ||
                              byDayStr ||
                              dueStr ||
                              t("customer.projects.detail.milestone.emDash");
                            return (
                              <Card
                                key={idx}
                                className="border border-gray-200"
                              >
                                <CardContent className="p-4 space-y-2">
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <Badge
                                        variant="secondary"
                                        className="text-xs flex-shrink-0"
                                      >
                                        #{m.order || m.sequence || idx + 1}
                                      </Badge>
                                      <span className="font-medium text-sm text-gray-900 break-words">
                                        {m.title ||
                                          t(
                                            "customer.projects.detail.proposalDetails.untitledMilestone",
                                          )}
                                      </span>
                                    </div>
                                    <div className="text-left sm:text-right flex-shrink-0">
                                      <span className="text-xs text-gray-500 block">
                                        {t(
                                          "customer.projects.detail.proposalDetails.amountLabel",
                                        )}
                                      </span>
                                      <span className="text-base font-semibold text-gray-900">
                                        {currency}{" "}
                                        {Number(m.amount || 0).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                  {m.description &&
                                    m.description.trim() !== "" && (
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                        {m.description}
                                      </p>
                                    )}
                                  <div className="text-sm text-gray-600 flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 flex-shrink-0" />
                                    <span>{displayText}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          },
                        );
                      })()}
                    </div>
                  </div>
                )}

              {/* Attachments */}
              {Array.isArray(selectedProposalDetails.attachments) &&
                selectedProposalDetails.attachments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                      {t(
                        "customer.projects.detail.proposalDetails.attachmentsHeading",
                      )}
                    </h4>

                    <div className="space-y-2">
                      {selectedProposalDetails.attachments.map(
                        (rawUrl: string, idx: number) => {
                          // rawUrl can look like: "uploads\proposals\1761857633365_Screenshots.pdf" or R2 key
                          // We normalize slashes and extract filename.
                          const normalized = rawUrl.replace(/\\/g, "/"); // -> "uploads/proposals/..." or R2 key
                          const fileName =
                            normalized.split("/").pop() || `file-${idx + 1}`;

                          // Use getAttachmentUrl helper for consistent URL handling
                          const attachmentUrl = getAttachmentUrl(rawUrl);
                          const isR2Key =
                            attachmentUrl === "#" ||
                            (!attachmentUrl.startsWith("http") &&
                              !attachmentUrl.startsWith("/uploads/") &&
                              !attachmentUrl.includes(
                                process.env.NEXT_PUBLIC_API_URL || "localhost",
                              ));

                          return (
                            <a
                              key={idx}
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
                                          await getR2DownloadUrl(rawUrl); // Use original URL/key
                                        window.open(
                                          downloadUrl.downloadUrl,
                                          "_blank",
                                        );
                                      } catch (error) {
                                        toastHook({
                                          title: t("customer.projects.detail.toast.errorTitle"),
                                          description:
                                            getUserFriendlyErrorMessage(
                                              error,
                                              "customer project attachment download",
                                            ),
                                          variant: "destructive",
                                        });
                                      }
                                    }
                                  : undefined
                              }
                              className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:bg-gray-50 hover:shadow-sm transition text-left"
                            >
                              {/* Icon circle */}
                              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                {t(
                                  "customer.projects.detail.proposalDetails.fileBadgePdf",
                                )}
                              </div>

                              {/* File info */}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                  {fileName}
                                </span>
                                <span className="text-xs text-gray-500 leading-snug">
                                  {t(
                                    "customer.projects.detail.milestone.clickPreviewDownload",
                                  )}
                                </span>
                              </div>

                              {/* Download icon on the far right */}
                              <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <path d="M7 10l5 5 5-5" />
                                  <path d="M12 15V3" />
                                </svg>
                              </div>
                            </a>
                          );
                        },
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 mt-2 border-t border-gray-100">
            {selectedProposalDetails?.status === "pending" && (
              <>
                <Button
                  onClick={() => {
                    if (!selectedProposalDetails) return;
                    setProposalDetailsOpen(false);
                    setAcceptingProposal(selectedProposalDetails);
                    setAcceptConfirmOpen(true);
                  }}
                  disabled={processingId === selectedProposalDetails?.id}
                  className="w-full sm:w-auto text-sm"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t("customer.projects.detail.proposalDetails.accept")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectDialogOpen(true);
                    setProposalDetailsOpen(false);
                    setSelectedProposalForAction(selectedProposalDetails);
                  }}
                  className="w-full sm:w-auto text-sm text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("customer.projects.detail.proposalDetails.reject")}
                </Button>
              </>
            )}
            {selectedProposalDetails?.status !== "pending" && (
              <Button
                variant="outline"
                onClick={() => {
                  setProposalDetailsOpen(false);
                  setSelectedProposalDetails(null);
                }}
                className="w-full sm:w-auto text-sm"
              >
                {t("customer.projects.detail.common.close")}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={acceptConfirmOpen}
        onOpenChange={(open) => {
          setAcceptConfirmOpen(open);
          if (!open) setAcceptingProposal(null);
        }}
      >
        <DialogContent className="max-w-xl sm:max-w-2xl p-5 sm:p-6">
          <DialogHeader className="space-y-1.5 text-left">
            <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
              {t("customer.projects.detail.acceptFreelancer.title")}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-gray-600">
              {t("customer.projects.detail.acceptFreelancer.desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-md border border-gray-200 bg-gray-50 p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                    {acceptingProposal?.provider?.name ||
                      acceptingProposal?.providerName ||
                      t(
                        "customer.projects.detail.acceptFreelancer.selectedProvider",
                      )}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    {acceptingProposal?.providerLocation ||
                      t(
                        "customer.projects.detail.acceptFreelancer.locationUnknown",
                      )}
                  </p>
                </div>
                <div className="shrink-0 rounded-md bg-blue-100 text-blue-800 px-2 py-1 text-xs sm:text-sm font-semibold">
                  {t("customer.projects.detail.acceptFreelancer.aiMatch")}{" "}
                  {Math.round(acceptingProposal?.matchScore ?? 0)}%
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700">
                <p>
                  <span className="font-medium">
                    {t("customer.projects.detail.acceptFreelancer.bidLabel")}
                  </span>{" "}
                  {currency.toUpperCase()}{" "}
                  {fmt(acceptingProposal?.bidAmount ?? 0)}
                </p>
                <p>
                  <span className="font-medium">
                    {t(
                      "customer.projects.detail.acceptFreelancer.timelineLabel",
                    )}
                  </span>{" "}
                  {acceptingProposal?.proposedTimeline ||
                    t("customer.projects.detail.milestone.emDash")}
                </p>
              </div>
            </div>

            <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3 sm:p-4">
              <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                {t("customer.projects.detail.acceptFreelancer.aiInsight")}
              </p>
              <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">
                {getBidSummary(
                  acceptingProposal?.id || "",
                  acceptingProposal?.aiFitExplanation,
                  acceptingProposal
                    ? explanationCache[acceptingProposal.id]
                    : undefined,
                )}
              </p>
            </div>
          </div>
          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 mt-2 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setAcceptConfirmOpen(false);
                setAcceptingProposal(null);
              }}
              disabled={
                !!acceptingProposal && processingId === acceptingProposal.id
              }
              className="w-full sm:w-auto text-sm"
            >
              {t("customer.projects.detail.acceptFreelancer.no")}
            </Button>
            <Button
              onClick={async () => {
                if (!acceptingProposal) return;
                setAcceptConfirmOpen(false);
                await handleAcceptProposal(acceptingProposal);
              }}
              disabled={
                !!acceptingProposal && processingId === acceptingProposal.id
              }
              className="w-full sm:w-auto text-sm"
            >
              {t("customer.projects.detail.acceptFreelancer.yes")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Milestones Dialog (after accepting proposal) */}
      <Dialog open={milestonesOpen} onOpenChange={setMilestonesOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>
              {t("customer.projects.detail.milestonesModal.title")}
            </DialogTitle>
            <DialogDescription>
              {t("customer.projects.detail.milestonesModal.statusLine", {
                company: milestoneApprovalStateModal.companyApproved
                  ? "✓"
                  : "✗",
                provider: milestoneApprovalStateModal.providerApproved
                  ? "✓"
                  : "✗",
                locked: milestoneApprovalStateModal.milestonesLocked
                  ? ` · ${t("customer.projects.detail.milestones.locked")}`
                  : "",
              })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-y-auto pr-1 max-h-[calc(90vh-9rem)]">
            {milestonesDraft.map((m, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="grid md:grid-cols-12 gap-3">
                    <div className="md:col-span-1">
                      <Label>
                        {t("customer.projects.detail.milestonesModal.seq")}
                      </Label>
                      <Input type="number" value={i + 1} disabled />
                    </div>
                    <div className="md:col-span-4">
                      <Label>
                        {t("customer.projects.detail.milestonesModal.titleLabel")}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={m.title}
                        onChange={(e) => {
                          const updated = [...milestonesDraft];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setMilestonesDraft(updated);
                          if (milestoneDraftErrors[i]?.title) {
                            setMilestoneDraftErrors((prev) => ({
                              ...prev,
                              [i]: { ...prev[i], title: undefined },
                            }));
                          }
                        }}
                        className={
                          milestoneDraftErrors[i]?.title
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }
                      />
                      {milestoneDraftErrors[i]?.title && (
                        <p className="text-xs text-red-600 mt-1">
                          {milestoneDraftErrors[i].title}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <Label>
                        {t("customer.projects.detail.milestonesModal.amount")}
                      </Label>
                      <Input
                        type="number"
                        value={String(m.amount ?? 0)}
                        onChange={(e) => {
                          const updated = [...milestonesDraft];
                          updated[i] = {
                            ...updated[i],
                            amount: Number(e.target.value),
                          };
                          setMilestonesDraft(updated);
                          // Clear sum error when amount changes
                          if (milestoneDraftErrors[-1]) {
                            setMilestoneDraftErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[-1];
                              return newErrors;
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Label>
                        {t(
                          "customer.projects.detail.milestonesModal.durationRequired",
                        )}{" "}
                        <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2 mt-1">
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
                            const updated = [...milestonesDraft];
                            updated[i] = {
                              ...updated[i],
                              durationAmount: e.target.value,
                              durationUnit:
                                (m as Milestone & { durationUnit?: string })
                                  .durationUnit || "",
                            } as (typeof milestonesDraft)[0];
                            setMilestonesDraft(updated);
                            if (
                              milestoneDraftErrors[i]?.durationAmount ||
                              milestoneDraftErrors[i]?.durationUnit
                            ) {
                              setMilestoneDraftErrors((prev) => ({
                                ...prev,
                                [i]: {
                                  ...prev[i],
                                  durationAmount: undefined,
                                  durationUnit: undefined,
                                },
                              }));
                            }
                            if (milestoneDraftErrors[-1]) {
                              setMilestoneDraftErrors((prev) => {
                                const next = { ...prev };
                                delete next[-1];
                                return next;
                              });
                            }
                          }}
                          className={`flex-1 ${milestoneDraftErrors[i]?.durationAmount ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                        />
                        <Select
                          value={
                            (m as Milestone & { durationUnit?: string })
                              .durationUnit || ""
                          }
                          onValueChange={(value: "day" | "week" | "month") => {
                            const updated = [...milestonesDraft];
                            updated[i] = {
                              ...updated[i],
                              durationAmount:
                                (m as Milestone & { durationAmount?: string })
                                  .durationAmount ?? "",
                              durationUnit: value,
                            } as (typeof milestonesDraft)[0];
                            setMilestonesDraft(updated);
                            if (milestoneDraftErrors[i]?.durationUnit) {
                              setMilestoneDraftErrors((prev) => ({
                                ...prev,
                                [i]: { ...prev[i], durationUnit: undefined },
                              }));
                            }
                            if (milestoneDraftErrors[-1]) {
                              setMilestoneDraftErrors((prev) => {
                                const next = { ...prev };
                                delete next[-1];
                                return next;
                              });
                            }
                          }}
                        >
                          <SelectTrigger
                            className={`w-[100px] ${milestoneDraftErrors[i]?.durationUnit ? "border-red-500 focus:ring-red-500" : ""}`}
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
                      {(milestoneDraftErrors[i]?.durationAmount ||
                        milestoneDraftErrors[i]?.durationUnit) && (
                        <p className="text-xs text-red-600 mt-1">
                          {milestoneDraftErrors[i].durationAmount ||
                            milestoneDraftErrors[i].durationUnit}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>
                      {t(
                        "customer.projects.detail.milestonesModal.description",
                      )}{" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      rows={2}
                      value={m.description || ""}
                      onChange={(e) => {
                        const updated = [...milestonesDraft];
                        updated[i] = {
                          ...updated[i],
                          description: e.target.value,
                        };
                        setMilestonesDraft(updated);
                        if (milestoneDraftErrors[i]?.description) {
                          setMilestoneDraftErrors((prev) => ({
                            ...prev,
                            [i]: { ...prev[i], description: undefined },
                          }));
                        }
                      }}
                      className={
                        milestoneDraftErrors[i]?.description
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {milestoneDraftErrors[i]?.description && (
                      <p className="text-xs text-red-600 mt-1">
                        {milestoneDraftErrors[i].description}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMilestonesDraft(
                          milestonesDraft.filter((_, idx) => idx !== i),
                        );
                      }}
                    >
                      {t("customer.projects.detail.milestonesModal.remove")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <p className="text-xs text-gray-600 pt-2 border-t border-gray-200 mt-2">
              {t("customer.projects.detail.milestonesModal.saveFirstHint")}
            </p>
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setMilestonesDraft([
                    ...milestonesDraft,
                    {
                      sequence: milestonesDraft.length + 1,
                      title: "",
                      description: "",
                      amount: 0,
                      durationAmount: "",
                      durationUnit: "" as "day" | "week" | "month" | "",
                    },
                  ] as typeof milestonesDraft);
                }}
              >
                {t("customer.projects.detail.milestonesModal.addMilestone")}
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveAcceptedMilestones}
                  disabled={savingMilestonesModal || approvingMilestonesModal}
                  className="inline-flex items-center justify-center gap-2"
                >
                  {savingMilestonesModal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                      {t("customer.projects.detail.milestonesModal.saving")}
                    </>
                  ) : (
                    t("customer.projects.detail.milestonesModal.saveChanges")
                  )}
                </Button>
                {!milestoneApprovalStateModal.companyApproved && (
                  <Button
                    onClick={handleApproveAcceptedMilestones}
                    disabled={
                      savingMilestonesModal ||
                      approvingMilestonesModal ||
                      JSON.stringify(
                        normalizeMilestoneSequences(milestonesDraft),
                      ) !==
                        JSON.stringify(
                          normalizeMilestoneSequences(originalMilestonesDraft),
                        )
                    }
                    className="inline-flex items-center justify-center gap-2"
                  >
                    {approvingMilestonesModal ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        {t(
                          "customer.projects.detail.milestonesModal.approving",
                        )}
                      </>
                    ) : (
                      t("customer.projects.detail.milestonesModal.approve")
                    )}
                  </Button>
                )}
              </div>
            </div>
            {milestoneDraftErrors[-1]?.title && (
              <div
                className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 font-medium"
                role="alert"
              >
                {milestoneDraftErrors[-1].title}
              </div>
            )}
          </div>

          <DialogFooter />
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
              {t("customer.projects.detail.milestonesFinalized.title")}
            </DialogTitle>
            <DialogDescription>
              {t("customer.projects.detail.milestonesFinalized.desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-gray-900">
                  {t(
                    "customer.projects.detail.milestonesFinalized.companyTitle",
                  )}
                </div>
                <div>
                  {milestoneApprovalStateModal.companyApproved
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
                className={`w-5 h-5 flex-shrink-0 ${
                  milestoneApprovalStateModal.providerApproved
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
                  {milestoneApprovalStateModal.providerApproved
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
                className={`w-5 h-5 flex-shrink-0 ${
                  milestoneApprovalStateModal.milestonesLocked
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
                  {milestoneApprovalStateModal.milestonesLocked
                    ? t(
                        "customer.projects.detail.milestonesFinalized.lockedYes",
                      )
                    : t(
                        "customer.projects.detail.milestonesFinalized.lockedNo",
                      )}
                </div>
                {milestoneApprovalStateModal.milestonesApprovedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    {t("customer.projects.detail.milestonesFinalized.lockedAt")}{" "}
                    {new Date(
                      milestoneApprovalStateModal.milestonesApprovedAt,
                    ).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button onClick={() => setMilestoneFinalizeOpen(false)}>
              {t("customer.projects.detail.milestonesFinalized.done")}
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
              {t("customer.projects.detail.disputeForm.title")}
            </DialogTitle>
            <DialogDescription>
              {t("customer.projects.detail.disputeForm.desc")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Milestone Selection (if applicable) */}
            {projectMilestones && projectMilestones.length > 0 && (
              <div className="space-y-3">
                {paidMilestonesForDispute.length > 0 ? (
                  <div>
                    <Label htmlFor="disputeMilestone">
                      {t(
                        "customer.projects.detail.dispute.relatedMilestoneLabel",
                      )}{" "}
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
                            "customer.projects.detail.dispute.placeholderSelectPaid",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {paidMilestonesForDispute.map((m: Milestone) => (
                          <SelectItem key={m.id} value={m.id || ""}>
                            {m.title} - {currency}
                            {(m.amount || 0).toLocaleString()} (
                            {getStatusText(m.status || "")})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      {t(
                        "customer.projects.detail.dispute.relatedMilestoneHint",
                      )}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                      {t(
                        "customer.projects.detail.dispute.noPaidMilestonesMessage",
                      )}
                    </div>
                    <div className="flex items-start gap-3 rounded-md border border-gray-200 bg-gray-50/80 p-3">
                      <Checkbox
                        id="customerProjectLevelDisputeAck"
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
                          htmlFor="customerProjectLevelDisputeAck"
                          className="text-sm font-medium leading-snug cursor-pointer"
                        >
                          {t(
                            "customer.projects.detail.dispute.projectLevelLabel",
                          )}{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-gray-600">
                          {t(
                            "customer.projects.detail.dispute.projectLevelHint",
                          )}
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
                {t("customer.projects.detail.disputeForm.reasonLabel")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Select value={disputeReason} onValueChange={setDisputeReason}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t(
                      "customer.projects.detail.disputeForm.reasonPlaceholder",
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
                    {t("customer.projects.detail.disputeReason.scopeChange")}
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
                {t("customer.projects.detail.disputeForm.descriptionLabel")}{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="disputeDescription"
                placeholder={t(
                  "customer.projects.detail.disputeForm.descriptionPlaceholder",
                )}
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                rows={6}
                required
              />
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm">
              <span className="text-gray-600">
                {t("customer.projects.detail.disputeForm.contestedAmount", {
                  currency,
                })}
              </span>
              <span className="font-semibold text-gray-900">
                {reportDisputeContestedAmount.toLocaleString()}
              </span>
              <p className="text-xs text-gray-500 mt-1.5">
                {t("customer.projects.detail.disputeForm.contestedHint", {
                  currency,
                })}
              </p>
            </div>

            {/* Suggested Resolution */}
            <div>
              <Label htmlFor="disputeSuggestedResolution">
                {t(
                  "customer.projects.detail.disputeForm.suggestedResolution",
                )}
              </Label>
              <Textarea
                id="disputeSuggestedResolution"
                placeholder={t(
                  "customer.projects.detail.disputeForm.suggestedPlaceholder",
                )}
                value={disputeSuggestedResolution}
                onChange={(e) => setDisputeSuggestedResolution(e.target.value)}
                rows={4}
              />
            </div>

            {/* Attachments */}
            <div>
              <Label htmlFor="disputeAttachments">
                {t(
                  "customer.projects.detail.disputeForm.attachmentsOptional",
                )}
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
                {t("customer.projects.detail.disputeForm.supportedTypes")}
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
              {t("customer.projects.detail.common.cancel")}
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
                  {t("customer.projects.detail.disputeForm.submitting")}
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-2" />
                  {t("customer.projects.detail.disputeForm.submit")}
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
              {t("customer.projects.detail.viewDispute.title")}
            </DialogTitle>
            <DialogDescription>
              {projectDisputes.length > 1
                ? t("customer.projects.detail.viewDisputesHint")
                : t("customer.projects.detail.viewDisputeDesc")}
            </DialogDescription>
          </DialogHeader>

          {projectDisputes.length > 1 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("customer.projects.detail.disputeRecordSelect")}
              </Label>
              <Select
                value={(currentDispute?.id as string) || ""}
                onValueChange={(id) => {
                  const d = projectDisputes.find((x) => x.id === id);
                  if (d) setCurrentDispute(d);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t(
                      "customer.projects.detail.disputeRecordSelect",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {projectDisputes.map((d, idx) => (
                    <SelectItem key={String(d.id)} value={String(d.id)}>
                      #{projectDisputes.length - idx} ·{" "}
                      {getDisputeStatusLabel(String(d.status || ""))} ·{" "}
                      {d.createdAt
                        ? new Date(
                            d.createdAt as string | number | Date,
                          ).toLocaleDateString()
                        : t("customer.projects.detail.viewDispute.unknown")}
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
                  className={getDisputeStatusColor(currentDispute.status || "")}
                >
                  {getDisputeStatusLabel(currentDispute.status || "")}
                </Badge>
                <div className="text-sm text-gray-500">
                  {t("customer.projects.detail.viewDispute.created")}{" "}
                  {currentDispute.createdAt
                    ? new Date(
                        currentDispute.createdAt as string | number | Date,
                      ).toLocaleDateString()
                    : t("customer.projects.detail.viewDispute.unknown")}
                  {currentDispute.updatedAt &&
                    currentDispute.updatedAt !== currentDispute.createdAt && (
                      <>
                        {" "}
                        • {t("customer.projects.detail.viewDispute.updated")}{" "}
                        {new Date(
                          currentDispute.updatedAt as string | number | Date,
                        ).toLocaleDateString()}
                      </>
                    )}
                </div>
              </div>

              {/* Dispute Information */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    {t("customer.projects.detail.viewDispute.infoTitle")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      {t("customer.projects.detail.viewDispute.reason")}
                    </Label>
                    <p className="mt-1">
                      {currentDispute.reason
                        ? translateDisputeReason(currentDispute.reason)
                        : t("customer.projects.detail.viewDispute.notApplicable")}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      {t(
                        "customer.projects.detail.viewDispute.descriptionUpdates",
                      )}
                    </Label>
                    <div className="mt-2 space-y-3">
                      {(() => {
                        // Parse description to show original and updates separately
                        const description =
                          (currentDispute.description as string) || "";
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
                                    {currentDispute.raisedBy?.name?.charAt(0) ||
                                      t(
                                        "customer.projects.detail.viewDispute.unknownUser",
                                      ).charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs font-semibold text-gray-900">
                                    {currentDispute.raisedBy?.name ||
                                      t(
                                        "customer.projects.detail.viewDispute.unknownUser",
                                      )}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {t(
                                      "customer.projects.detail.viewDispute.originalDisputeMeta",
                                    )}{" "}
                                    {currentDispute.createdAt
                                      ? new Date(
                                          currentDispute.createdAt as
                                            | string
                                            | number
                                            | Date,
                                        ).toLocaleString()
                                      : t(
                                          "customer.projects.detail.viewDispute.unknown",
                                        )}
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
                                [, userName, updateDate, updateContent] = match;
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
                                          "customer.projects.detail.viewDispute.roleCustomer",
                                        );
                                    } else if (
                                      project?.provider?.id === userIdOrName
                                    ) {
                                      userName =
                                        project?.provider?.name ||
                                        t(
                                          "customer.projects.detail.common.providerNameFallback",
                                        );
                                    } else if (
                                      currentDispute?.raisedBy?.id ===
                                      userIdOrName
                                    ) {
                                      userName =
                                        currentDispute?.raisedBy?.name ||
                                        t(
                                          "customer.projects.detail.viewDispute.unknownUser",
                                        );
                                    } else {
                                      userName = t(
                                        "customer.projects.detail.viewDispute.unknownUser",
                                      );
                                    }
                                    updateDate = t(
                                      "customer.projects.detail.viewDispute.unknownDate",
                                    );
                                    updateContent = content;
                                  } else {
                                    userName = userIdOrName;
                                    updateDate = t(
                                      "customer.projects.detail.viewDispute.unknownDate",
                                    );
                                    updateContent = content;
                                  }
                                } else {
                                  // Fallback: treat entire update as content
                                  updateContent = update;
                                  userName = t(
                                    "customer.projects.detail.viewDispute.unknownUser",
                                  );
                                  updateDate = t(
                                    "customer.projects.detail.viewDispute.unknownDate",
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
                                                "customer.projects.detail.viewDispute.roleCustomer",
                                              )
                                            : isProvider
                                              ? t(
                                                  "customer.projects.detail.viewDispute.roleProvider",
                                                )
                                              : t(
                                                  "customer.projects.detail.viewDispute.roleUser",
                                                )}
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {t(
                                          "customer.projects.detail.viewDispute.updateMetaLine",
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
                  {currentDispute.contestedAmount &&
                  typeof currentDispute.contestedAmount === "number" ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t(
                          "customer.projects.detail.viewDispute.contestedAmount",
                        )}
                      </Label>
                      <p className="mt-1 font-medium">
                        {currency}
                        {currentDispute.contestedAmount.toLocaleString()}
                      </p>
                    </div>
                  ) : null}
                  {currentDispute.suggestedResolution &&
                  typeof currentDispute.suggestedResolution === "string" ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t(
                          "customer.projects.detail.viewDispute.suggestedResolution",
                        )}
                      </Label>
                      <p className="mt-1 whitespace-pre-wrap">
                        {currentDispute.suggestedResolution}
                      </p>
                    </div>
                  ) : null}
                  {currentDispute.milestone &&
                  typeof currentDispute.milestone === "object" &&
                  currentDispute.milestone !== null ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        {t(
                          "customer.projects.detail.viewDispute.relatedMilestone",
                        )}
                      </Label>
                      <p className="mt-1">
                        {(
                          currentDispute.milestone as {
                            title?: string;
                            amount?: number;
                          }
                        ).title || t("customer.projects.detail.viewDispute.unknown")}{" "}
                        - {currency}
                        {typeof (
                          currentDispute.milestone as { amount?: number }
                        ).amount === "number"
                          ? (
                              currentDispute.milestone as { amount: number }
                            ).amount.toLocaleString()
                          : "0"}
                      </p>
                    </div>
                  ) : null}
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
                          "customer.projects.detail.viewDispute.adminNotesTitle",
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentDispute.resolutionNotes.map(
                        (
                          note: {
                            note?: string;
                            adminName?: string;
                            createdAt?: string | number | Date;
                          },
                          index: number,
                        ) => (
                          <div
                            key={index}
                            className="bg-white p-4 rounded-lg border-l-4 border-purple-500"
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback className="bg-purple-100 text-purple-700">
                                  {note.adminName?.charAt(0) ||
                                    t(
                                      "customer.projects.detail.viewDispute.adminFallback",
                                    ).charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {t(
                                    "customer.projects.detail.viewDispute.resolutionNoteN",
                                    { n: index + 1 },
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t(
                                    "customer.projects.detail.viewDispute.byAdmin",
                                  )}{" "}
                                  {note.adminName ||
                                    t(
                                      "customer.projects.detail.viewDispute.adminFallback",
                                    )}{" "}
                                  •{" "}
                                  {note.createdAt
                                    ? new Date(note.createdAt).toLocaleString()
                                    : t(
                                        "customer.projects.detail.viewDispute.unknown",
                                      )}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                              {note.note || ""}
                            </p>
                          </div>
                        ),
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
                          "customer.projects.detail.viewDispute.adminResolutionTitle",
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
                          "customer.projects.detail.viewDispute.attachmentsTitle",
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {(currentDispute.attachments as unknown[]).map(
                          (url: unknown, index: number) => {
                            const unknownUserLabel = t(
                              "customer.projects.detail.viewDispute.unknownUser",
                            );
                            const unknownDateLabel = t(
                              "customer.projects.detail.viewDispute.unknownDate",
                            );
                            const urlStr =
                              typeof url === "string" ? url : String(url);
                            // Extract filename from path
                            const normalized = urlStr.replace(/\\/g, "/");
                            const filename =
                              normalized.split("/").pop() ||
                              t(
                                "customer.projects.detail.viewDispute.attachmentFallback",
                                { n: index + 1 },
                              );
                            // Remove timestamp prefix if present (format: timestamp_filename.ext)
                            const cleanFilename = filename.replace(/^\d+_/, "");

                            // Try to find attachment metadata in description
                            const description =
                              (currentDispute.description as string) || "";
                            const attachmentMetadataMatch = description.match(
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
                              Array.isArray(currentDispute.attachments) &&
                              currentDispute.attachments.length === 1
                            ) {
                              uploadedBy =
                                (currentDispute.raisedBy?.name as string) ||
                                unknownUserLabel;
                              uploadedAt = currentDispute.createdAt
                                ? new Date(
                                    currentDispute.createdAt as
                                      | string
                                      | number
                                      | Date,
                                  ).toLocaleString()
                                : unknownDateLabel;
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
                                        "customer.projects.detail.viewDispute.uploadedByLine",
                                        {
                                          name: uploadedBy,
                                          date: uploadedAt,
                                        },
                                      )}
                                    </p>
                                  </div>
                                </div>
                                {(() => {
                                  const attachmentUrl =
                                    getAttachmentUrl(urlStr);
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
                                                  await getR2DownloadUrl(
                                                    urlStr,
                                                  ); // Use original URL/key
                                                window.open(
                                                  downloadUrl.downloadUrl,
                                                  "_blank",
                                                );
                                              } catch (error) {
                                                toastHook({
                                                  title: t("customer.projects.detail.toast.errorTitle"),
                                                  description:
                                                    getUserFriendlyErrorMessage(
                                                      error,
                                                      "customer project attachment download",
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
                                          "customer.projects.detail.viewDispute.download",
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

              {activeDispute &&
                currentDispute.id === activeDispute.id &&
                currentDispute.status !== "CLOSED" &&
                currentDispute.status !== "RESOLVED" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        {t(
                          "customer.projects.detail.viewDispute.addUpdateTitle",
                        )}
                      </CardTitle>
                      <CardDescription>
                        {t(
                          "customer.projects.detail.viewDispute.addUpdateDesc",
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label htmlFor="disputeAdditionalNotes">
                          {t(
                            "customer.projects.detail.viewDispute.additionalNotes",
                          )}
                        </Label>
                        <Textarea
                          id="disputeAdditionalNotes"
                          placeholder={t(
                            "customer.projects.detail.viewDispute.additionalNotesPlaceholder",
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
                            "customer.projects.detail.viewDispute.additionalAttachments",
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
                              "customer.projects.detail.viewDispute.updating",
                            )}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 mr-2" />
                            {t(
                              "customer.projects.detail.viewDispute.addUpdateButton",
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
                          ? t("customer.projects.detail.disputeClosedNotice")
                          : t("customer.projects.detail.disputeResolvedNotice")}
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
              {t("customer.projects.detail.common.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
