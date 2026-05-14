"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Check,
  X,
  Clock,
  Star,
  MapPin,
  MessageSquare,
  Eye,
  Download,
  RefreshCw,
  Loader2,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { CustomerRequestsTour } from "@/components/customer/CustomerRequestsTour";
import { CustomerRequestsListSkeleton } from "@/components/customer/CustomerPageSkeletons";
import { useToast } from "@/hooks/use-toast";
import { formatDurationDays } from "@/lib/timeline-utils";
import {
  getCompanyProjectRequests,
  getBidExplanation,
  acceptProjectRequest,
  rejectProjectRequest,
  getProjectRequestStats,
  exportCompanyProjectRequests,
  getProfileImageUrl,
  getAttachmentUrl,
  getR2DownloadUrl,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { FriendlyErrorState } from "@/components/FriendlyErrorState";
import { useI18n } from "@/contexts/I18nProvider";

interface ProviderRequest {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  providerRating: number;
  providerLocation: string;
  providerResponseTime: string;
  projectId: string;
  projectTitle: string;
  bidAmount: number;
  bidAmountOriginal?: number;
  bidCurrencyCode?: string;
  bidConversionDate?: string;
  currencyCode?: string;
  proposedTimeline: string;
  deliveryTime?: number; // days, for milestone duration validation
  coverLetter: string;
  status: "pending" | "accepted" | "rejected";
  submittedAt: string;
  skills: string[];
  portfolio: string[];
  experience: string;
  attachments: string[];
  milestones: Array<{
    title: string;
    description?: string;
    amount: number;
    dueDate?: string;
    order: number;
    daysFromStart?: number;
  }>;
  aiFitExplanation?: string | Record<string, string> | null;
  matchScore?: number | null;
  rank?: number | null;
  isTopFive?: boolean;
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

interface ApiProposal {
  id: string;
  serviceRequest: {
    id: string;
    title: string;
    currencyCode?: string;
  };
  provider: {
    id: string;
    name: string;
    avatarUrl?: string;
    rating: number;
    location: string;
    responseTime: string;
    portfolio: string[];
    experience: string;
    skills: string[];
  };
  bidAmount: number;
  bidAmountOriginal?: number;
  bidCurrencyCode?: string;
  bidConversionDate?: string;
  deliveryTime: number;
  coverLetter: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  submittedAt?: string;
  createdAt?: string;
  milestones: Array<{
    title: string;
    amount: number;
    dueDate?: string;
    order: number;
    daysFromStart?: number;
    description?: string;
  }>;
  attachmentUrls?: string[];
}

function pickFiniteNumber(v: unknown): number | undefined {
  if (v == null || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Map API / Prisma milestone records to a stable shape for UI (camelCase + numeric amount). */
function normalizeProposalMilestoneFromApi(
  raw: unknown,
  index: number,
): ProviderRequest["milestones"][number] {
  const m =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const order = pickFiniteNumber(m.order ?? m.Order) ?? index + 1;
  const amount = pickFiniteNumber(m.amount ?? m.Amount) ?? 0;
  const daysFromStart = pickFiniteNumber(
    m.daysFromStart ?? m.days_from_start ?? m.DaysFromStart,
  );
  const title = String(m.title ?? m.Title ?? "").trim();
  const descVal = m.description ?? m.Description;
  const description =
    typeof descVal === "string"
      ? descVal
      : descVal != null && String(descVal).trim() !== ""
        ? String(descVal)
        : undefined;
  const dueVal = m.dueDate ?? m.due_date ?? m.DueDate;
  let dueDate: string | undefined;
  if (dueVal instanceof Date && !isNaN(dueVal.getTime())) {
    dueDate = dueVal.toISOString();
  } else if (typeof dueVal === "string" && dueVal.trim()) {
    dueDate = dueVal.trim();
  }
  const out: ProviderRequest["milestones"][number] = {
    title,
    amount,
    order,
  };
  if (description !== undefined) out.description = description;
  if (dueDate !== undefined) out.dueDate = dueDate;
  if (daysFromStart !== undefined) out.daysFromStart = daysFromStart;
  return out;
}

type MilestoneForDuration = {
  daysFromStart?: number;
  dueDate?: string;
};

/** Segment length in days for one milestone (for display). */
function getMilestoneSegmentDays(
  sorted: MilestoneForDuration[],
  idx: number,
  proposalDeliveryDays: number | undefined,
): number {
  const m = sorted[idx];
  const prev = idx > 0 ? sorted[idx - 1] : undefined;
  const prevDays = idx > 0 ? (prev?.daysFromStart ?? 0) : 0;
  const currDays = m.daysFromStart ?? 0;
  let segment = currDays > 0 ? currDays - prevDays : 0;

  if (segment <= 0 && idx > 0 && m.dueDate && prev?.dueDate) {
    const d0 = new Date(prev.dueDate).getTime();
    const d1 = new Date(m.dueDate).getTime();
    if (!isNaN(d0) && !isNaN(d1) && d1 >= d0) {
      segment = Math.round((d1 - d0) / 86400000);
    }
  }

  const noDaysFromStart = sorted.every(
    (x) => x.daysFromStart == null || x.daysFromStart === 0,
  );
  if (
    segment <= 0 &&
    noDaysFromStart &&
    proposalDeliveryDays != null &&
    proposalDeliveryDays > 0
  ) {
    const n = sorted.length;
    segment =
      n === 1
        ? proposalDeliveryDays
        : Math.max(1, Math.round(proposalDeliveryDays / n));
  }

  return segment;
}

export default function CustomerRequestsPage() {
  const { t, locale } = useI18n();
  const { toast: toastHook } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Apply ?project= serviceRequestId from URL (e.g. from "Show all proposals" on project page)
  useEffect(() => {
    const projectId = searchParams.get("project");
    if (projectId && projectId.trim()) {
      setProjectFilter(projectId.trim());
    }
  }, [searchParams]);
  const [selectedRequest, setSelectedRequest] =
    useState<ProviderRequest | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [acceptingRequest, setAcceptingRequest] = useState<ProviderRequest | null>(
    null,
  );

  // API state
  const [requests, setRequests] = useState<ProviderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProposals: 0,
    openRequests: 0,
    matchedRequests: 0,
    averageProposalsPerRequest: 0,
  });
  const [projectOptions, setProjectOptions] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // AI summary panel (same design as customer project bids)
  const [openExplanationId, setOpenExplanationId] = useState<string | null>(null);
  const [explanationCache, setExplanationCache] = useState<Record<string, string>>({});
  const [explanationLoading, setExplanationLoading] = useState<Record<string, boolean>>({});
  const [cardSummaryViewId, setCardSummaryViewId] = useState<string | null>(null);
  const [panelTopOffset, setPanelTopOffset] = useState(0);
  const cardRefsMap = React.useRef<Record<string, HTMLDivElement | null>>({});
  const rightPanelColumnRef = React.useRef<HTMLDivElement | null>(null);
  const panelLeaveTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchedExplanationIds = React.useRef<Set<string>>(new Set());

  const getBidSummary = (
    stored: string | Record<string, string> | null | undefined,
    cached: string | undefined,
  ) => {
    const text = getLocalizedAiFitExplanation(stored, locale) || (cached && cached.trim());
    return text || t("customer.projects.detail.defaultBidSummary");
  };

  const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);
  const fmt = (v: unknown, fallback = "0") => {
    if (v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : fallback;
  };
  const formatMoney = (amount: number, currencyCode?: string) =>
    new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currencyCode || "MYR",
      maximumFractionDigits: 0,
    }).format(amount || 0);

  // Fetch data from API
  const fetchData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [proposalsResponse, statsResponse] = await Promise.all([
        getCompanyProjectRequests({
          page: 1,
          limit: 100,
          search: searchQuery,
          proposalStatus:
            statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
          serviceRequestId:
            projectFilter === "all" ? undefined : projectFilter,
          sort: sortBy,
        }),
        getProjectRequestStats(),
      ]);

      const proposals = Array.isArray(proposalsResponse?.proposals)
        ? proposalsResponse.proposals
        : Array.isArray(proposalsResponse?.data)
        ? proposalsResponse.data
        : Array.isArray(proposalsResponse?.items)
        ? proposalsResponse.items
        : [];
      const mappedRequests: ProviderRequest[] = proposals.map(
        (proposal: ApiProposal) => {
          const provider = (proposal as ApiProposal & { provider?: Record<string, unknown> }).provider || {};
          const profile = (provider as Record<string, unknown>).providerProfile as Record<string, unknown> || {};
          return {
            id: proposal.id,
            providerId: provider.id,
            providerName: provider.name,
            providerAvatar: getProfileImageUrl(profile.profileImageUrl as string | null | undefined),
            providerRating: profile.rating ?? provider.rating ?? 0,
            providerLocation: profile.location ?? provider.location ?? "",
            providerResponseTime:
              profile.responseTime ?? provider.responseTime ?? "",
            projectId: proposal.serviceRequest.id,
            projectTitle: proposal.serviceRequest.title,
            bidAmount: proposal.bidAmount,
            bidAmountOriginal: proposal.bidAmountOriginal,
            bidCurrencyCode: proposal.bidCurrencyCode,
            bidConversionDate: proposal.bidConversionDate,
            currencyCode: proposal.serviceRequest.currencyCode || "MYR",
            proposedTimeline: t("customer.requests.timelineDays", {
              n: String(proposal.deliveryTime),
            }),
            deliveryTime: typeof proposal.deliveryTime === "number" ? proposal.deliveryTime : undefined,
            coverLetter: proposal.coverLetter,
            status: proposal.status.toLowerCase() as
              | "pending"
              | "accepted"
              | "rejected",
            submittedAt: proposal.createdAt || proposal.submittedAt,
            skills: Array.isArray(profile.skills)
              ? profile.skills
              : Array.isArray(provider.skills)
              ? provider.skills
              : [],
            portfolio: Array.isArray(profile.portfolios)
              ? profile.portfolios
              : Array.isArray(provider.portfolio)
              ? provider.portfolio
              : [],
            experience: profile.experience ?? provider.experience ?? "",
            attachments: Array.isArray(proposal.attachmentUrls)
              ? proposal.attachmentUrls
              : [],
            milestones: Array.isArray(proposal.milestones)
              ? proposal.milestones.map((raw, i) =>
                  normalizeProposalMilestoneFromApi(raw, i),
                )
              : [],
            aiFitExplanation:
              ((proposal as unknown as Record<string, unknown>).aiFitExplanation as
                | string
                | Record<string, string>
                | undefined) ?? null,
            matchScore: (proposal as unknown as Record<string, unknown>).matchScore as number | undefined ?? null,
            rank: (proposal as unknown as Record<string, unknown>).rank as number | undefined ?? null,
            isTopFive: (proposal as unknown as Record<string, unknown>).isTopFive as boolean | undefined,
          };
        }
      );
      setRequests(mappedRequests);
      setStats(
        statsResponse?.stats ??
          statsResponse?.data ?? {
            totalProposals: 0,
            openRequests: 0,
            matchedRequests: 0,
            averageProposalsPerRequest: 0,
          }
      );

      const uniqueProjects = proposals.reduce(
        (
          acc: Array<{ id: string; title: string }>,
          proposal: ApiProposal
        ) => {
          const existing = acc.find(
            (p) => p.id === proposal.serviceRequest.id
          );
          if (!existing) {
            acc.push({
              id: proposal.serviceRequest.id,
              title: proposal.serviceRequest.title,
            });
          }
          return acc;
        },
        []
      );
      setProjectOptions((prev) => {
        const merged = [...prev];
        for (const p of uniqueProjects) {
          if (!merged.some((m) => m.id === p.id)) merged.push(p);
        }
        return merged;
      });
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err, "customer requests fetch"));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, projectFilter, sortBy, t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Align right panel with hovered card (desktop)
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

  // Fetch AI explanation for proposals without stored aiFitExplanation
  useEffect(() => {
    if (!openExplanationId) return;
    const hasStoredForLocale = hasAiFitExplanationForLocale(
      requests.find((r) => r.id === openExplanationId)?.aiFitExplanation,
      locale,
    );
    if (hasStoredForLocale) return;
    if (fetchedExplanationIds.current.has(openExplanationId)) return;
    fetchedExplanationIds.current.add(openExplanationId);
    setExplanationLoading((prev) => ({ ...prev, [openExplanationId]: true }));
    getBidExplanation(openExplanationId, locale)
      .then((r) => {
        if (r.success && r.explanation)
          setExplanationCache((prev) => ({ ...prev, [openExplanationId]: r.explanation! }));
      })
      .catch(() => {})
      .finally(() =>
        setExplanationLoading((prev) => ({ ...prev, [openExplanationId]: false }))
      );
  }, [locale, openExplanationId, requests]);

  useEffect(() => {
    fetchedExplanationIds.current.clear();
    setExplanationCache({});
    setExplanationLoading({});
  }, [locale]);

  // Since we're filtering on the server side, we can use requests directly
  const filteredRequests = requests.sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
        );
      case "highest-bid":
        return b.bidAmount - a.bidAmount;
      case "lowest-bid":
        return a.bidAmount - b.bidAmount;
      case "rating":
        return b.providerRating - a.providerRating;
      case "highest-match":
        return (b.matchScore ?? 0) - (a.matchScore ?? 0);
      default:
        return 0;
    }
  });

  const handleAcceptRequest = async (proposalId: string) => {
    try {
      setProcessingId(proposalId);
      const response = await acceptProjectRequest(proposalId, true);

      // Get the created project ID from the response
      const projectId = response?.id || response?.project?.id;

      // Optimistic status update
      setRequests((prev) =>
        prev.map((req) =>
          req.id === proposalId ? { ...req, status: "accepted" as const } : req
        )
      );

      toastHook({
        title: t("customer.requests.toast.acceptTitle"),
        description: t("customer.requests.toast.acceptDesc"),
      });

      if (projectId) {
        router.push(`/customer/projects/${projectId}/milestones`);
      }
    } catch (err) {
      toastHook({
        title: t("customer.requests.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          err,
          "customer requests accept",
        ),
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      setProcessingId(requestId);
      await rejectProjectRequest(requestId, reason);

      // Update local state optimistically
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "rejected" as const } : req
        )
      );

      setRejectDialogOpen(false);
      setRejectReason("");

      toastHook({
        title: t("customer.requests.toast.rejectTitle"),
        description: t("customer.requests.toast.rejectDesc"),
      });
    } catch (err) {
      toastHook({
        title: t("customer.requests.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          err,
          "customer requests reject",
        ),
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (request: ProviderRequest) => {
    setSelectedRequest(request);
    setViewDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === "pending") return t("customer.requests.status.pending");
    if (status === "accepted") return t("customer.requests.status.accepted");
    if (status === "rejected") return t("customer.requests.status.rejected");
    return status;
  };

  const dateLocale =
    locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en";

  const displayStats = {
    total: stats.totalProposals,
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <>
      <CustomerRequestsTour />
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
          data-tour-step="0"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("customer.requests.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t("customer.requests.subtitle")}
            </p>
          </div>
          <div
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto"
            data-tour-step="1"
          >
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const blob = await exportCompanyProjectRequests({
                    search: searchQuery,
                    proposalStatus: statusFilter !== "all" ? statusFilter.toUpperCase() : undefined,
                    serviceRequestId: projectFilter !== "all" ? projectFilter : undefined,
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `provider-requests-${Date.now()}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  toastHook({
                    title: t("customer.requests.exportSuccessTitle"),
                    description: t("customer.requests.exportSuccessDesc"),
                  });
                } catch (err) {
                  toastHook({
                    title: t("customer.requests.exportFailedTitle"),
                    description: getUserFriendlyErrorMessage(
                      err,
                      "customer requests export",
                    ),
                    variant: "destructive",
                  });
                }
              }}
              className="w-full sm:w-auto border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200"
            >
              <Download className="w-4 h-4 mr-2" />
              {t("customer.requests.export")}
            </Button>
            <Button 
              variant="outline" 
              className="w-full sm:w-auto border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("customer.requests.refresh")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
          data-tour-step="2"
        >
          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    {t("customer.requests.stats.total")}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {displayStats.total}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    {t("customer.requests.stats.pending")}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                    {displayStats.pending}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    {t("customer.requests.stats.accepted")}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {displayStats.accepted}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    {t("customer.requests.stats.rejected")}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {displayStats.rejected}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card data-tour-step="3">
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder={t("customer.requests.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 text-sm sm:text-base">
                    <SelectValue placeholder={t("customer.requests.statusPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("customer.requests.filter.status.all")}</SelectItem>
                    <SelectItem value="pending">{t("customer.requests.filter.status.pending")}</SelectItem>
                    <SelectItem value="accepted">{t("customer.requests.filter.status.accepted")}</SelectItem>
                    <SelectItem value="rejected">{t("customer.requests.filter.status.rejected")}</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                    <SelectValue placeholder={t("customer.requests.projectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("customer.requests.filter.project.all")}</SelectItem>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40 text-sm sm:text-base">
                    <SelectValue placeholder={t("customer.requests.sortPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("customer.requests.sort.newest")}</SelectItem>
                    <SelectItem value="oldest">{t("customer.requests.sort.oldest")}</SelectItem>
                    <SelectItem value="highest-match">{t("customer.requests.sort.highestMatch")}</SelectItem>
                    <SelectItem value="highest-bid">{t("customer.requests.sort.highestBid")}</SelectItem>
                    <SelectItem value="lowest-bid">{t("customer.requests.sort.lowestBid")}</SelectItem>
                    <SelectItem value="rating">{t("customer.requests.sort.rating")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List + AI summary panel (same design as project Bids tab) */}
        <div className="space-y-3 sm:space-y-4" data-tour-step="4">
          {loading ? (
            <CustomerRequestsListSkeleton
              loadingLabel={`${t("customer.requests.loading.title")}. ${t("customer.requests.loading.hint")}`}
            />
          ) : error ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <FriendlyErrorState
                  message={error}
                  onRetry={fetchData}
                  variant="block"
                />
              </CardContent>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  {t("customer.requests.empty.title")}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {t("customer.requests.empty.body")}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex gap-0 lg:gap-4 relative">
              {/* Left: list of request cards */}
              <div
                className="flex-1 min-w-0 space-y-3 sm:space-y-4"
                onMouseLeave={() => {
                  if (panelLeaveTimeoutRef.current) clearTimeout(panelLeaveTimeoutRef.current);
                  panelLeaveTimeoutRef.current = setTimeout(() => setOpenExplanationId(null), 200);
                }}
              >
                {filteredRequests.map((request) => (
                  <div
                    key={request.id}
                    ref={(el) => {
                      cardRefsMap.current[request.id] = el;
                    }}
                    data-request-id={request.id}
                    className="w-full"
                  >
                    <Card
                      className="hover:shadow-md transition-shadow"
                      onMouseEnter={() => {
                        if (panelLeaveTimeoutRef.current) {
                          clearTimeout(panelLeaveTimeoutRef.current);
                          panelLeaveTimeoutRef.current = null;
                        }
                        setOpenExplanationId(request.id);
                      }}
                    >
                      <CardContent className="p-4 sm:p-5 lg:p-6">
                        {/* Small screens: in-card AI summary when this card is expanded */}
                        {cardSummaryViewId === request.id && (
                          <div className="lg:hidden rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="p-1.5 rounded-lg bg-blue-100 flex-shrink-0">
                                  <Sparkles className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-sm font-semibold text-gray-900 truncate">
                                  {request.providerName || t("customer.requests.providerFallback")}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setCardSummaryViewId(null);
                                  setOpenExplanationId(null);
                                }}
                                className="shrink-0 p-1.5 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                aria-label={t("customer.requests.closeAria")}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              {t("customer.requests.whyBidFits")}
                            </p>
                            {!request.aiFitExplanation && explanationLoading[request.id] ? (
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                                <span>{t("customer.requests.loadingShort")}</span>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {getBidSummary(request.aiFitExplanation, explanationCache[request.id])}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Normal card content (hidden on small when this card is showing summary) */}
                        <div
                          className={cn(
                            "flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6",
                            cardSummaryViewId === request.id && "hidden lg:flex"
                          )}
                        >
                          {/* Provider Info */}
                          <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarImage
                                src={
                                  request.providerAvatar &&
                                  request.providerAvatar !== "/placeholder.svg?height=40&width=40" &&
                                  !request.providerAvatar.includes("/placeholder.svg")
                                    ? request.providerAvatar
                                    : "/placeholder.svg"
                                }
                              />
                              <AvatarFallback className="text-xs sm:text-sm">
                                {String(request.providerName || "")
                                  .split(" ")
                                  .filter(Boolean)
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                                  {request.providerName}
                                </h3>
                                {request.matchScore != null && request.matchScore > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {t("customer.requests.matchPercent", {
                                      score: String(request.matchScore),
                                    })}
                                  </span>
                                )}
                                <div className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {request.providerRating}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOpenExplanationId((prev) => (prev === request.id ? null : request.id));
                                    setCardSummaryViewId((prev) => (prev === request.id ? null : request.id));
                                  }}
                                  className="lg:hidden inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                                  aria-label={t("customer.requests.tapToSeeAria")}
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                  {t("customer.requests.tapToSee")}
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="truncate">{request.providerLocation || "—"}</span>
                                </div>
                              </div>

                              <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1 break-words">
                                {request.projectTitle}
                              </p>

                              <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-1.5 sm:mb-2">
                                {request.coverLetter}
                              </p>

                              <div className="flex flex-wrap gap-1">
                                {asArray<string>(request.skills)
                                  .slice(0, 3)
                                  .map((skill) => (
                                    <Badge
                                      key={skill}
                                      variant="secondary"
                                      className="text-[10px] leading-tight"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                {asArray<string>(request.skills).length > 3 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] leading-tight"
                                  >
                                    {t("customer.requests.skillsMore", {
                                      n: String(asArray<string>(request.skills).length - 3),
                                    })}
                                  </Badge>
                                )}
                              </div>

                              {request.experience && (
                                <p className="text-[11px] sm:text-[12px] text-gray-500 mt-1.5 sm:mt-2 line-clamp-1">
                                  {t("customer.requests.experienceSuffix", {
                                    text: request.experience,
                                  })}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Request Details */}
                          <div className="lg:w-80 min-w-0 space-y-2.5 sm:space-y-3">
                            <div className="flex justify-between items-center">
                              <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                                {getStatusLabel(request.status)}
                              </Badge>
                              <span className="text-xs sm:text-sm text-gray-500">
                                {request.submittedAt && !isNaN(new Date(request.submittedAt).getTime())
                                  ? new Date(request.submittedAt).toLocaleDateString(dateLocale)
                                  : "—"}
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                              <div>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {t("customer.requests.bidAmount")}
                                </p>
                                <p className="font-semibold text-base sm:text-lg">
                                  {formatMoney(
                                    request.bidAmount,
                                    request.currencyCode,
                                  )}
                                </p>
                                {request.bidAmountOriginal != null && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    {t("customer.requests.bidInProviderCurrency", {
                                      currency: request.bidCurrencyCode || "MYR",
                                      amount: formatMoney(
                                        request.bidAmountOriginal,
                                        request.bidCurrencyCode || "MYR",
                                      ),
                                    })}
                                    {request.bidConversionDate ? (
                                      <span className="text-gray-400">
                                        {" "}
                                        (
                                        {t(
                                          "customer.requests.bidFxSnapshotShort",
                                          {
                                            date: request.bidConversionDate,
                                          },
                                        )}
                                        )
                                      </span>
                                    ) : null}
                                  </p>
                                )}
                              </div>
                              <div className="text-left sm:text-right">
                                <p className="text-xs sm:text-sm text-gray-600">
                                  {t("customer.requests.timeline")}
                                </p>
                                <p className="font-medium text-sm sm:text-base">
                                  {request.proposedTimeline}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-3 border-t border-gray-100">
                              <Button
                                size="sm"
                                onClick={() => handleViewDetails(request)}
                                className="w-full min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm justify-center bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
                              >
                                <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                                <span className="truncate">{t("customer.requests.showDetails")}</span>
                              </Button>
                              <Link
                                href={`/customer/providers/${request.providerId}`}
                                className="w-full"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full min-h-[44px] sm:min-h-[40px] text-xs sm:text-sm justify-center border-gray-300 hover:bg-gray-50 font-medium"
                                >
                                  <Eye className="w-4 h-4 mr-2 shrink-0" />
                                  <span className="truncate">{t("customer.requests.viewProfile")}</span>
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>

              {/* Right: AI summary panel (desktop hover; small screens use in-card or tap overlay) */}
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
                  openExplanationId ? "translate-x-0 lg:w-80" : "translate-x-full lg:translate-x-0 lg:w-0"
                )}
                onMouseEnter={() => {
                  if (panelLeaveTimeoutRef.current) {
                    clearTimeout(panelLeaveTimeoutRef.current);
                    panelLeaveTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={() => setOpenExplanationId(null)}
              >
                {openExplanationId && panelTopOffset > 0 && (
                  <div className="hidden lg:block shrink-0" style={{ height: panelTopOffset }} aria-hidden />
                )}
                <div
                  className={cn(
                    "h-full lg:h-auto w-80 max-w-[85vw] lg:max-w-none min-h-[140px] rounded-none lg:rounded-xl border-0 lg:border border-gray-200 bg-white shadow-xl lg:shadow-lg p-4 lg:ml-0",
                    openExplanationId
                      ? "translate-x-0 opacity-100"
                      : "translate-x-4 opacity-0 lg:translate-x-0"
                  )}
                  style={{ transition: "opacity 0.3s ease-out, transform 0.3s ease-out" }}
                >
                  {openExplanationId && (
                    <>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="p-1.5 rounded-lg bg-blue-100 flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {filteredRequests.find((r) => r.id === openExplanationId)?.providerName ||
                              t("customer.requests.providerFallback")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOpenExplanationId(null)}
                          className="lg:hidden p-1.5 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none flex-shrink-0"
                          aria-label={t("customer.requests.closeAria")}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                        {t("customer.requests.whyBidFits")}
                      </p>
                      {!filteredRequests.find((r) => r.id === openExplanationId)?.aiFitExplanation &&
                      explanationLoading[openExplanationId] ? (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                          <span>{t("customer.requests.loadingShort")}</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {getBidSummary(
                            filteredRequests.find((r) => r.id === openExplanationId)?.aiFitExplanation,
                            explanationCache[openExplanationId]
                          )}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-xl sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 text-base">
            {selectedRequest && (
              <>
                <DialogHeader className="space-y-1.5 text-left">
                  <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                    {t("customer.requests.detail.title")}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600">
                    {t("customer.requests.detail.description", {
                      name: selectedRequest.providerName,
                    })}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 sm:space-y-6 pt-1">
                  {/* Provider Info */}
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <Avatar className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 mx-auto sm:mx-0">
                      <AvatarImage
                        src={
                          selectedRequest.providerAvatar && 
                          selectedRequest.providerAvatar !== "/placeholder.svg?height=40&width=40" &&
                          !selectedRequest.providerAvatar.includes("/placeholder.svg")
                            ? selectedRequest.providerAvatar
                            : "/placeholder.svg"
                        }
                      />
                      <AvatarFallback>
                        {String(selectedRequest.providerName || "")
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 tracking-tight break-words">
                            {selectedRequest.providerName}
                          </h3>

                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 sm:gap-x-4 gap-y-1 text-sm text-gray-600 mt-1.5">
                            <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 text-yellow-400 fill-current flex-shrink-0" />
                              <span>
                                {t("customer.requests.ratingSuffix", {
                                  n: String(selectedRequest.providerRating),
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{selectedRequest.providerLocation || "—"}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">
                                {t("customer.requests.responseTimeSuffix", {
                                  text: selectedRequest.providerResponseTime,
                                })}
                              </span>
                            </div>
                          </div>

                          {selectedRequest.experience && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed break-words">
                              {t("customer.requests.experienceSuffix", {
                                text: selectedRequest.experience,
                              })}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-1.5 mt-2 justify-center sm:justify-start">
                            {asArray<string>(selectedRequest.skills)
                              .slice(0, 4)
                              .map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-xs leading-tight"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            {asArray<string>(selectedRequest.skills).length > 4 && (
                              <Badge variant="secondary" className="text-xs leading-tight">
                                {t("customer.requests.skillsMore", {
                                  n: String(asArray<string>(selectedRequest.skills).length - 4),
                                })}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Link
                          href={`/customer/providers/${selectedRequest.providerId}`}
                          className="sm:flex-shrink-0 self-center sm:self-start"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center text-sm"
                          >
                            <Eye className="w-4 h-4 mr-1.5" />
                            {t("customer.requests.viewProfile")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-1" />

                  {/* Project & Bid Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                        {t("customer.requests.detail.project")}
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed break-words">
                        {selectedRequest.projectTitle}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                        {t("customer.requests.detail.bidAmount")}
                      </h4>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        {formatMoney(
                          selectedRequest.bidAmount,
                          selectedRequest.currencyCode,
                        )}
                      </p>
                      {selectedRequest.bidAmountOriginal != null && (
                        <p className="text-xs text-gray-500">
                          {t("customer.requests.bidInProviderCurrency", {
                            currency:
                              selectedRequest.bidCurrencyCode || "MYR",
                            amount: formatMoney(
                              selectedRequest.bidAmountOriginal,
                              selectedRequest.bidCurrencyCode || "MYR",
                            ),
                          })}
                          {selectedRequest.bidConversionDate ? (
                            <span className="text-gray-400">
                              {" "}
                              (
                              {t("customer.requests.bidFxSnapshotShort", {
                                date: selectedRequest.bidConversionDate,
                              })}
                              )
                            </span>
                          ) : null}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                        {t("customer.requests.detail.proposedTimeline")}
                      </h4>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedRequest.proposedTimeline}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                        {t("customer.requests.detail.status")}
                      </h4>
                      <Badge className={`text-xs ${getStatusColor(selectedRequest.status)}`}>
                        {getStatusLabel(selectedRequest.status)}
                      </Badge>
                    </div>
                  </div>

                  <Separator className="my-1" />

                  {/* Cover Letter */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                      {t("customer.requests.detail.coverLetter")}
                    </h4>
                    <div className="bg-gray-50/80 p-4 rounded-lg border border-gray-100">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                        {selectedRequest.coverLetter}
                      </p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                      {t("customer.requests.detail.skills")}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {asArray<string>(selectedRequest.skills).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Portfolio */}
                  {/* <div>
                    <h4 className="font-semibold mb-2">Portfolio</h4>
                    <div className="space-y-2">
                      {asArray<string>(selectedRequest.portfolio).map(
                        (link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-600 hover:text-blue-800 underline"
                          >
                            {link}
                          </a>
                        )
                      )}
                    </div>
                  </div> */}
                  {/* Proposed Milestones */}
                  {selectedRequest.milestones &&
                    selectedRequest.milestones.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                          {t("customer.requests.detail.proposedMilestones")}
                        </h4>

                        <div className="space-y-3">
                          {(() => {
                            const sorted = [...selectedRequest.milestones].sort(
                              (a, b) => (a.order ?? 0) - (b.order ?? 0),
                            );
                            return sorted.map((m, idx) => {
                              const dueDateStr = m.dueDate
                                ? new Date(m.dueDate).toLocaleDateString(
                                    dateLocale,
                                  )
                                : "";
                              const segmentDays = getMilestoneSegmentDays(
                                sorted,
                                idx,
                                selectedRequest.deliveryTime,
                              );
                              const spanText =
                                segmentDays > 0
                                  ? t("customer.requests.detail.duration", {
                                      label: formatDurationDays(segmentDays),
                                    })
                                  : dueDateStr
                                    ? t("customer.requests.detail.due", {
                                        date: dueDateStr,
                                      })
                                    : "—";
                              const amountNum = Number(m.amount);
                              const amountLabel = Number.isFinite(amountNum)
                                ? formatMoney(
                                    amountNum,
                                    selectedRequest.currencyCode,
                                  )
                                : "—";
                              return (
                                <Card
                                  key={`${m.order ?? idx}-${idx}`}
                                  className="border border-gray-200"
                                >
                                  <CardContent className="p-4 space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <Badge variant="secondary" className="text-xs flex-shrink-0">
                                          #{m.order || idx + 1}
                                        </Badge>
                                        <span className="font-medium text-sm text-gray-900 break-words">
                                          {m.title || t("customer.requests.detail.untitledMilestone")}
                                        </span>
                                      </div>
                                      <div className="text-left sm:text-right flex-shrink-0">
                                        <span className="text-xs text-gray-500 block">
                                          {t("customer.requests.detail.amount")}
                                        </span>
                                        <span className="text-base font-semibold text-gray-900">
                                          {amountLabel}
                                        </span>
                                      </div>
                                    </div>
                                    {m.description && m.description.trim() !== "" && (
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words">
                                        {m.description}
                                      </p>
                                    )}
                                    <div className="text-sm text-gray-600 flex items-center gap-1.5">
                                      <Clock className="w-4 h-4 flex-shrink-0" />
                                      <span>{spanText}</span>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}

                  {/* Attachments */}
                  {Array.isArray(selectedRequest.attachments) &&
                    selectedRequest.attachments.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 tracking-tight">
                          {t("customer.requests.detail.attachments")}
                        </h4>

                        <div className="space-y-2">
                          {selectedRequest.attachments.map((rawUrl, idx) => {
                            // rawUrl can look like: "uploads\proposals\1761857633365_Screenshots.pdf" or R2 key
                            // We normalize slashes and extract filename.
                            const normalized = rawUrl.replace(/\\/g, "/"); // -> "uploads/proposals/..." or R2 key
                            const fileName =
                              normalized.split("/").pop() || `file-${idx + 1}`;

                            // Use getAttachmentUrl helper for consistent URL handling
                            const attachmentUrl = getAttachmentUrl(rawUrl);
                            const isR2Key = attachmentUrl === "#" || (!attachmentUrl.startsWith("http") && !attachmentUrl.startsWith("/uploads/") && !attachmentUrl.includes(process.env.NEXT_PUBLIC_API_URL || "localhost"));

                            return (
                              <a
                                key={idx}
                                href={attachmentUrl === "#" ? undefined : attachmentUrl}
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={isR2Key ? async (e) => {
                                  e.preventDefault();
                                  try {
                                    const downloadUrl = await getR2DownloadUrl(rawUrl); // Use original URL/key
                                    window.open(downloadUrl.downloadUrl, "_blank");
                                  } catch (error) {
                                    toastHook({
                                      title: t("customer.requests.toast.errorTitle"),
                                      description: getUserFriendlyErrorMessage(
                                        error,
                                        "customer requests attachment download",
                                      ),
                                      variant: "destructive",
                                    });
                                  }
                                } : undefined}
                                className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5 hover:bg-gray-50 hover:shadow-sm transition text-left"
                              >
                                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                  PDF
                                </div>

                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                    {fileName}
                                  </span>
                                  <span className="text-xs text-gray-500 leading-snug">
                                    {t("customer.requests.detail.attachmentHint")}
                                  </span>
                                </div>

                                {/* Download icon on the far right */}
                                <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700 flex-shrink-0">
                                  <svg
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
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
                          })}
                        </div>
                      </div>
                    )}
                </div>

                <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 mt-2 border-t border-gray-100">
                  {selectedRequest.status === "pending" ? (
                    <>
                      <Button
                        onClick={() => {
                          setAcceptingRequest(selectedRequest);
                          setAcceptConfirmOpen(true);
                          setViewDetailsOpen(false);
                        }}
                        disabled={processingId === selectedRequest.id}
                        className="w-full sm:w-auto text-sm"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {t("customer.requests.detail.accept")}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRejectDialogOpen(true);
                          setViewDetailsOpen(false);
                        }}
                        className="w-full sm:w-auto text-sm border-red-200 hover:border-red-300 bg-white hover:bg-red-50 text-red-600 hover:text-red-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {t("customer.requests.detail.reject")}
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setViewDetailsOpen(false)}
                      className="w-full sm:w-auto text-sm"
                    >
                      {t("customer.requests.detail.close")}
                    </Button>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <Dialog
          open={acceptConfirmOpen}
          onOpenChange={(open) => {
            setAcceptConfirmOpen(open);
            if (!open) setAcceptingRequest(null);
          }}
        >
          <DialogContent className="max-w-xl sm:max-w-2xl p-5 sm:p-6">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                Continue with the same freelancer?
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm text-gray-600">
                Do you want to continue with this freelancer for the next milestone?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4">
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3 sm:p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">
                      {acceptingRequest?.providerName || "Selected Provider"}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      {acceptingRequest?.providerLocation || "Location not specified"}
                    </p>
                  </div>
                  <div className="shrink-0 rounded-md bg-blue-100 text-blue-800 px-2 py-1 text-xs sm:text-sm font-semibold">
                    AI Match: {Math.round(acceptingRequest?.matchScore ?? 0)}%
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700">
                  <p>
                    <span className="font-medium">Bid:</span>{" "}
                    {formatMoney(
                      acceptingRequest?.bidAmount ?? 0,
                      acceptingRequest?.currencyCode,
                    )}
                  </p>
                  <p>
                    <span className="font-medium">Timeline:</span>{" "}
                    {acceptingRequest?.proposedTimeline || "—"}
                  </p>
                </div>
              </div>

              <div className="rounded-md border border-blue-100 bg-blue-50/60 p-3 sm:p-4">
                <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                  AI insight
                </p>
                <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap">
                  {getBidSummary(
                    acceptingRequest?.aiFitExplanation,
                    acceptingRequest ? explanationCache[acceptingRequest.id] : undefined,
                  )}
                </p>
              </div>
            </div>
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-4 mt-2 border-t border-gray-100">
              <Button
                variant="outline"
                onClick={() => {
                  setAcceptConfirmOpen(false);
                  setAcceptingRequest(null);
                }}
                disabled={
                  !!acceptingRequest && processingId === acceptingRequest.id
                }
                className="w-full sm:w-auto text-sm"
              >
                No
              </Button>
              <Button
                onClick={async () => {
                  if (!acceptingRequest) return;
                  const proposalId = acceptingRequest.id;
                  setAcceptConfirmOpen(false);
                  await handleAcceptRequest(proposalId);
                }}
                disabled={
                  !!acceptingRequest && processingId === acceptingRequest.id
                }
                className="w-full sm:w-auto text-sm"
              >
                Yes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6">
            <DialogHeader className="space-y-1.5 text-left">
              <DialogTitle className="text-lg sm:text-xl font-semibold tracking-tight">
                {t("customer.requests.reject.title")}
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600 leading-relaxed">
                {t("customer.requests.reject.description")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 pt-1">
              <div className="space-y-2">
                <Label htmlFor="rejectReason" className="text-sm font-semibold text-gray-900 tracking-tight">
                  {t("customer.requests.reject.reasonLabel")}
                </Label>
                <Textarea
                  id="rejectReason"
                  placeholder={t("customer.requests.reject.placeholder")}
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
                className="w-full sm:w-auto border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200"
              >
                {t("customer.requests.reject.cancel")}
              </Button>
              <Button
                onClick={() =>
                  selectedRequest &&
                  handleRejectRequest(selectedRequest.id, rejectReason)
                }
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-all duration-200"
                disabled={
                  !rejectReason.trim() || processingId === selectedRequest?.id
                }
              >
                {processingId === selectedRequest?.id ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("customer.requests.reject.rejecting")}
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    {t("customer.requests.reject.confirm")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
