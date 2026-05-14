"use client";

import type React from "react";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Search,
  ThumbsUp,
  Eye,
  Clock,
  Users,
  MapPin,
  Star,
  CheckCircle,
  Loader2,
  Sparkles,
  ChevronRight,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import { PROPOSAL_REQUIRED } from "@/contexts/ProviderCompletionContext";
import { ProfileCompletionGateModal } from "@/components/provider/ProfileCompletionGateModal";
import { ProviderOpportunitiesTour } from "@/components/provider/ProviderOpportunitiesTour";
import { ProviderPreferredCurrencyDialog } from "@/components/provider/ProviderPreferredCurrencyDialog";
import {
  getProviderOpportunities,
  getProviderRecommendedOpportunities,
  getProviderProfile,
  getProviderProfileCompletion,
  getServiceRequestAiDrafts,
  getProfileImageUrl,
} from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { FriendlyErrorState } from "@/components/FriendlyErrorState";
import { formatTimeline, timelineToDays } from "@/lib/timeline-utils";
import Link from "next/link";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import { useI18n } from "@/contexts/I18nProvider";
import { Skeleton } from "@/components/ui/skeleton";

type OpportunityCustomer = {
  id?: string;
  name?: string;
  email?: string;
  isVerified?: boolean;
  createdAt?: string;
  customerProfile?: {
    profileImageUrl?: string;
    location?: string;
    companySize?: string;
    industry?: string;
    projectsPosted?: number;
    totalSpend?: number | string;
  };
};

type OpportunityData = {
  id: string;
  title: string;
  description?: string;
  fullDescription?: string;
  client: string;
  clientId: string | null;
  budget: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: string;
  currencyCode?: string;
  timeline: string;
  originalTimeline: string | null;
  originalTimelineInDays: number;
  skills: string[];
  postedTime: string;
  matchScore?: number;
  proposals: number;
  category?: string;
  location: string;
  clientRating: number;
  projectsPosted: number;
  avatar: string;
  urgent: boolean;
  verified: boolean;
  hasSubmitted: boolean;
  requirements: string;
  deliverables: string;
  clientInfo: {
    companySize: string;
    industry: string;
    memberSince: string;
    totalSpent: string;
    avgRating: number;
  };
  originalData: Record<string, unknown>;
  aiExplanation?: string | null;
  serviceRequestId: string;
};

type AiDraft = {
  referenceId: string;
  summary?: string;
};

const OPPORTUNITIES_URL_KEYS = {
  search: "q",
  status: "status",
  tags: "tags",
  useProfileTags: "profileTags",
  sort: "sort",
} as const;

const formatCurrencyAmount = (amount: number, currencyCode: string = "MYR") =>
  new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount || 0);

function OpportunityListSkeleton({
  count = 4,
  variant = "default",
  loadingLabel,
}: {
  count?: number;
  variant?: "default" | "recommended";
  loadingLabel: string;
}) {
  const cardClass =
    variant === "recommended"
      ? "group relative border-2 border-gray-200 rounded-lg sm:rounded-xl bg-white"
      : "group relative sm:hover:shadow-lg transition-shadow";

  return (
    <div
      className="space-y-4 sm:space-y-6"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">{loadingLabel}</span>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className={cardClass}>
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <Skeleton className="h-7 sm:h-8 w-[min(100%,20rem)] max-w-full" />
              <Skeleton className="h-5 w-14 sm:w-16 shrink-0 rounded-full" />
              <Skeleton className="h-5 w-16 sm:w-20 shrink-0 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full max-w-3xl" />
            <Skeleton className="h-4 w-full max-w-2xl mt-2" />
            <Skeleton className="h-4 w-2/3 max-w-xl mt-1 hidden sm:block" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0 w-full sm:w-auto">
                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-36 sm:w-44" />
                  <Skeleton className="h-3 w-52 sm:w-64 max-w-full" />
                </div>
              </div>
              <div className="text-left sm:text-right w-full sm:w-auto space-y-2 shrink-0">
                <Skeleton className="h-5 w-28 sm:ml-auto" />
                <Skeleton className="h-3 w-24 sm:ml-auto" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
              <Skeleton className="h-6 w-[4.5rem] rounded-full hidden sm:block" />
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
              <div className="space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-36 sm:w-44" />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Skeleton className="h-9 w-full sm:w-[7.5rem] rounded-md" />
                <Skeleton className="h-9 w-full sm:w-[9.5rem] rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProviderOpportunitiesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { t, locale } = useI18n();

  const formatRecommendationsCacheLine = useCallback(
    (cachedAt: number, nextRefreshAt: number) => {
      const now = Date.now();
      const ageMs = now - cachedAt;
      const remainingMs = nextRefreshAt - now;
      const ageMinutes = Math.floor(ageMs / 60000);

      const updated =
        ageMinutes < 1
          ? t("provider.dashboard.reco.updated.justNow")
          : ageMinutes === 1
            ? t("provider.dashboard.reco.updated.oneMinute")
            : t("provider.dashboard.reco.updated.nMinutes", { n: ageMinutes });

      if (remainingMs <= 0) return updated;

      const remainingMinutes = Math.floor(remainingMs / 60000);
      const remainingHours = Math.floor(remainingMinutes / 60);
      const remainingMins = remainingMinutes % 60;

      let nextPart: string;
      if (remainingHours > 0 && remainingMins > 0) {
        nextPart = t("provider.dashboard.reco.next.hoursMinutes", {
          h: remainingHours,
          m: remainingMins,
        });
      } else if (remainingHours > 0) {
        nextPart =
          remainingHours === 1
            ? t("provider.dashboard.reco.next.hourOne")
            : t("provider.dashboard.reco.next.hoursN", { n: remainingHours });
      } else if (remainingMins === 1) {
        nextPart = t("provider.dashboard.reco.next.minuteOne");
      } else {
        nextPart = t("provider.dashboard.reco.next.minutesN", {
          n: remainingMins,
        });
      }

      return `${updated} • ${nextPart}`;
    },
    [t],
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState("all");
  const [useProfileTags, setUseProfileTags] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"best-match" | "newest">("best-match");
  const [providerProfileTags, setProviderProfileTags] = useState<{
    skills: string[];
    major: string | null;
  }>({ skills: [], major: null });
  const hasPreselectedTags = useRef(false);
  /** True if the URL had no "tags" param when first read (e.g. refresh or clean link). Don't auto-add tags in that case. */
  const urlHadNoTagsOnLoad = useRef(true);

  const [proposalCompletionChecking, setProposalCompletionChecking] =
    useState(false);
  const [proposalGateOpen, setProposalGateOpen] = useState(false);
  const [selectedProject, setSelectedProject] =
    useState<OpportunityData | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // API state
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Recommended opportunities state
  const [recommendedOpportunities, setRecommendedOpportunities] = useState<
    OpportunityData[]
  >([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [errorRecommended, setErrorRecommended] = useState<string | null>(null);
  const [recommendationsCacheInfo, setRecommendationsCacheInfo] = useState<{
    cachedAt: number | null;
    nextRefreshAt: number | null;
    requiresSkills?: boolean;
  }>({ cachedAt: null, nextRefreshAt: null });
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<
    string | null
  >(null);

  // Helper function to map opportunity data
  // useRecommendationInsights: if true, use aiExplanation from opportunity (for recommended tab), if false, ignore it (for all tab - will use drafts)
  const mapOpportunityData = (
    opportunity: Record<string, unknown>,
    useRecommendationInsights: boolean = false,
  ): OpportunityData => ({
    id: String(opportunity.id || ""),
    title: String(opportunity.title || ""),
    description: opportunity.description
      ? String(opportunity.description)
      : undefined,
    fullDescription: opportunity.description
      ? String(opportunity.description)
      : undefined,
    client:
      (opportunity.customer as OpportunityCustomer)?.name ||
      t("provider.dashboard.unknownClient"),
    clientId: (opportunity.customer as OpportunityCustomer)?.id || null,
    budget: `${formatCurrencyAmount(
      Number(opportunity.displayBudgetMin ?? opportunity.budgetMin ?? 0),
      String(
        opportunity.displayCurrencyCode || opportunity.currencyCode || "MYR",
      ),
    )} - ${formatCurrencyAmount(
      Number(opportunity.displayBudgetMax ?? opportunity.budgetMax ?? 0),
      String(
        opportunity.displayCurrencyCode || opportunity.currencyCode || "MYR",
      ),
    )}`,
    budgetMin:
      Number(opportunity.displayBudgetMin ?? opportunity.budgetMin ?? 0) || 0,
    budgetMax:
      Number(opportunity.displayBudgetMax ?? opportunity.budgetMax ?? 0) || 0,
    budgetType: "fixed",
    currencyCode: String(
      opportunity.displayCurrencyCode || opportunity.currencyCode || "MYR",
    ),
    timeline:
      formatTimeline(opportunity.timeline as string) ||
      t("customer.dashboard.timelineNotSpecified"),
    originalTimeline: (opportunity.timeline as string) || null,
    originalTimelineInDays: (() => {
      if (!opportunity.timeline) return 0;
      const timelineStr = String(opportunity.timeline).toLowerCase().trim();
      const match = timelineStr.match(
        /^(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)$/,
      );
      if (match) {
        const amount = Number(match[1]);
        const unit = match[2].replace(/s$/, "");
        return timelineToDays(amount, unit);
      }
      return 0;
    })(),
    skills: Array.isArray(opportunity.skills)
      ? (opportunity.skills as string[])
      : [],
    postedTime: new Date(
      String(opportunity.createdAt || Date.now()),
    ).toLocaleDateString(),
    matchScore: opportunity.matchScore
      ? Number(opportunity.matchScore)
      : undefined,
    proposals:
      (opportunity._count as { proposals?: number })?.proposals ||
      (opportunity.proposalCount as number) ||
      0,
    category: opportunity.category ? String(opportunity.category) : undefined,
    location:
      (opportunity.customer as OpportunityCustomer)?.customerProfile
        ?.location || t("customer.dashboard.timelineNotSpecified"),
    clientRating: 4.5,
    projectsPosted:
      (opportunity.customer as OpportunityCustomer)?.customerProfile
        ?.projectsPosted || 0,
    avatar: getProfileImageUrl(
      (opportunity.customer as OpportunityCustomer)?.customerProfile
        ?.profileImageUrl,
    ),
    urgent: opportunity.priority === "High",
    verified:
      (opportunity.customer as OpportunityCustomer)?.isVerified || false,
    hasSubmitted: (opportunity.hasProposed as boolean) || false,
    requirements:
      typeof opportunity.requirements === "string"
        ? opportunity.requirements
        : Array.isArray(opportunity.requirements)
          ? (opportunity.requirements as unknown[])
              .map((r: unknown) => `- ${String(r)}`)
              .join("\n")
          : "",
    deliverables:
      typeof opportunity.deliverables === "string"
        ? opportunity.deliverables
        : Array.isArray(opportunity.deliverables)
          ? (opportunity.deliverables as unknown[])
              .map((d: unknown) => `- ${String(d)}`)
              .join("\n")
          : "",
    clientInfo: {
      companySize:
        (opportunity.customer as OpportunityCustomer)?.customerProfile
          ?.companySize || t("customer.dashboard.timelineNotSpecified"),
      industry:
        (opportunity.customer as OpportunityCustomer)?.customerProfile
          ?.industry || t("customer.dashboard.timelineNotSpecified"),
      memberSince: new Date(
        (opportunity.customer as OpportunityCustomer)?.createdAt || Date.now(),
      )
        .getFullYear()
        .toString(),
      totalSpent: (opportunity.customer as OpportunityCustomer)?.customerProfile
        ?.totalSpend
        ? formatCurrencyAmount(
            Number(
              (opportunity.customer as OpportunityCustomer).customerProfile
                ?.totalSpend,
            ),
            String(
              opportunity.displayCurrencyCode ||
                opportunity.currencyCode ||
                "MYR",
            ),
          )
        : formatCurrencyAmount(
            0,
            String(
              opportunity.displayCurrencyCode ||
                opportunity.currencyCode ||
                "MYR",
            ),
          ),
      avgRating: 4.5,
    },
    originalData: opportunity,
    // Only use aiExplanation from opportunity if useRecommendationInsights is true (for recommended tab)
    // For "All" tab, this will be null and we'll use drafts instead
    aiExplanation: useRecommendationInsights
      ? opportunity.aiExplanation
        ? String(opportunity.aiExplanation)
        : null
      : null,
    serviceRequestId: String(opportunity.id || ""), // ID for fetching AI drafts
  });

  // Read URL on mount and when searchParams change (e.g. back/forward)
  useEffect(() => {
    const q = searchParams.get(OPPORTUNITIES_URL_KEYS.search);
    const status = searchParams.get(OPPORTUNITIES_URL_KEYS.status);
    const tags = searchParams.get(OPPORTUNITIES_URL_KEYS.tags);
    const profileTags = searchParams.get(OPPORTUNITIES_URL_KEYS.useProfileTags);
    const sort = searchParams.get(OPPORTUNITIES_URL_KEYS.sort);
    const hadTagsParam = tags != null && tags !== "";
    urlHadNoTagsOnLoad.current = !hadTagsParam;
    if (q != null) setSearchQuery(q);
    if (
      status === "submitted" ||
      status === "not-submitted" ||
      status === "all"
    )
      setSubmissionFilter(status);
    if (profileTags === "0" || profileTags === "1")
      setUseProfileTags(profileTags === "1");
    if (hadTagsParam) {
      setSelectedTags(
        tags!
          .split(",")
          .filter(Boolean)
          .map((t) => t.trim()),
      );
      hasPreselectedTags.current = true;
    }
    if (sort === "best-match" || sort === "newest") setSortBy(sort);
  }, [searchParams]);

  // Persist filter state to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchQuery) params.set(OPPORTUNITIES_URL_KEYS.search, searchQuery);
    else params.delete(OPPORTUNITIES_URL_KEYS.search);
    if (submissionFilter !== "all")
      params.set(OPPORTUNITIES_URL_KEYS.status, submissionFilter);
    else params.delete(OPPORTUNITIES_URL_KEYS.status);
    if (selectedTags.length)
      params.set(OPPORTUNITIES_URL_KEYS.tags, selectedTags.join(","));
    else params.delete(OPPORTUNITIES_URL_KEYS.tags);
    params.set(
      OPPORTUNITIES_URL_KEYS.useProfileTags,
      useProfileTags ? "1" : "0",
    );
    params.set(OPPORTUNITIES_URL_KEYS.sort, sortBy);
    const next = params.toString();
    const current = searchParams.toString();
    if (next !== current) {
      router.replace(next ? `${pathname}?${next}` : (pathname ?? ""), {
        scroll: false,
      });
    }
  }, [
    searchQuery,
    submissionFilter,
    selectedTags,
    useProfileTags,
    sortBy,
    router,
    searchParams,
    pathname,
  ]);

  // Fetch provider profile for "Use my profile tags" (API returns { data } with skills/major at top level)
  useEffect(() => {
    getProviderProfile()
      .then((res: { success?: boolean; data?: Record<string, unknown> }) => {
        const profile = res?.data as Record<string, unknown> | undefined;
        if (!profile) return;
        const skills = Array.isArray(profile.skills)
          ? (profile.skills as string[])
          : [];
        const major = typeof profile.major === "string" ? profile.major : null;
        setProviderProfileTags({ skills, major });
      })
      .catch(() => {});
  }, []);

  // Fetch all opportunities from API
  const fetchOpportunities = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const response = await getProviderOpportunities({
        page: 1,
        limit: 100,
        search: searchQuery || undefined,
        sort: sortBy,
      });

      if (response.success) {
        // For "All" tab: Don't use recommendation insights, only use drafts
        let mappedOpportunities = (response.opportunities || []).map(
          (opp: Record<string, unknown>) => mapOpportunityData(opp, false), // false = don't use recommendation insights
        );

        // Fetch AiDraft summaries and merge into opportunities (this is the only source of AI insights for "All" tab)
        const serviceRequestIds = mappedOpportunities
          .map((opp: OpportunityData) => opp.serviceRequestId)
          .filter(Boolean);
        if (serviceRequestIds.length > 0) {
          try {
            const draftRes = await getServiceRequestAiDrafts(
              serviceRequestIds,
              locale,
            );
            if (draftRes?.success && Array.isArray(draftRes.drafts)) {
              const draftMap = new Map<string, string>(
                (draftRes.drafts as AiDraft[]).map((d: AiDraft) => [
                  d.referenceId,
                  d.summary || "",
                ]),
              );
              mappedOpportunities = mappedOpportunities.map(
                (opp: OpportunityData) => ({
                  ...opp,
                  // Only use draft summary for "All" tab
                  aiExplanation:
                    opp.serviceRequestId && draftMap.has(opp.serviceRequestId)
                      ? draftMap.get(opp.serviceRequestId) || null
                      : null,
                }),
              );
            }
          } catch (err) {
            console.warn("Failed to fetch AI drafts for opportunities", err);
          }
        }

        setOpportunities(mappedOpportunities);
      } else {
        setError(
          getUserFriendlyErrorMessage(undefined, "provider opportunities"),
        );
      }
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err, "provider opportunities"));
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy, t]);

  useEffect(() => {
    fetchOpportunities();
  }, [fetchOpportunities]); // submissionFilter and selectedTags are client-side

  // Fetch recommended opportunities (cached 2h on backend; auto-refresh when expired)
  const fetchRecommendedOpportunitiesRef = useRef<() => Promise<void>>(
    async () => {},
  );
  useEffect(() => {
    const fetchRecommendedOpportunities = async () => {
      try {
        setLoadingRecommended(true);
        setErrorRecommended(null);

        const response = await getProviderRecommendedOpportunities(locale);
        if (response.success) {
          const mappedRecommended = (response.recommendations || []).map(
            (opp: Record<string, unknown>) => {
              const mapped = mapOpportunityData(opp, true);
              return {
                ...mapped,
                aiExplanation: opp.aiExplanation
                  ? String(opp.aiExplanation)
                  : null,
              };
            },
          );
          setRecommendedOpportunities(mappedRecommended);
          setRecommendationsCacheInfo({
            cachedAt: response.cachedAt,
            nextRefreshAt: response.nextRefreshAt,
            requiresSkills: !!response.requiresSkills,
          });
        }
      } catch (err) {
        setErrorRecommended(
          getUserFriendlyErrorMessage(
            err,
            "provider opportunities recommended",
          ),
        );
      } finally {
        setLoadingRecommended(false);
      }
    };
    fetchRecommendedOpportunitiesRef.current = fetchRecommendedOpportunities;
    fetchRecommendedOpportunities();
  }, [locale, t]);

  // Auto-refresh when 2-hour cache expires
  useEffect(() => {
    const next = recommendationsCacheInfo.nextRefreshAt;
    if (next == null || typeof next !== "number") return;
    const now = Date.now();
    if (next <= now) {
      fetchRecommendedOpportunitiesRef.current();
      return;
    }
    const delay = next - now;
    const timeoutId = setTimeout(
      () => fetchRecommendedOpportunitiesRef.current(),
      delay,
    );
    return () => clearTimeout(timeoutId);
  }, [recommendationsCacheInfo.nextRefreshAt]);

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 80) return "text-blue-600 bg-blue-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };
  const globalTagList = useMemo(() => {
    const set = new Set<string>();
    opportunities.forEach((o) => {
      (o.skills || []).forEach((s: string) => set.add(s));
      if (o.category) set.add(o.category);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [opportunities]);

  const profileTagList = useMemo(() => {
    const list: string[] = [...(providerProfileTags.skills || [])];
    if (providerProfileTags.major) list.push(providerProfileTags.major);
    return [...new Set(list)]
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b));
  }, [providerProfileTags]);

  const tagOptions = useProfileTags ? profileTagList : globalTagList;

  // Pre-select most relevant profile tags only when URL already had a tags param (don't add tags on refresh/clean URL)
  useEffect(() => {
    if (urlHadNoTagsOnLoad.current) return;
    if (
      !useProfileTags ||
      profileTagList.length === 0 ||
      opportunities.length === 0 ||
      hasPreselectedTags.current
    )
      return;
    if (selectedTags.length > 0) return;
    const relevant = profileTagList.filter((t) =>
      opportunities.some(
        (o) => (o.skills || []).includes(t) || o.category === t,
      ),
    );
    if (relevant.length > 0) {
      hasPreselectedTags.current = true;
      setSelectedTags(relevant.slice(0, 15));
    }
  }, [useProfileTags, profileTagList, opportunities, selectedTags.length]);

  const filteredOpportunities = opportunities.filter((opportunity) => {
    const matchesSearch =
      opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.skills.some((skill: string) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase()),
      );

    let matchesSubmission = true;
    if (submissionFilter === "submitted") {
      matchesSubmission = opportunity.hasSubmitted;
    } else if (submissionFilter === "not-submitted") {
      matchesSubmission = !opportunity.hasSubmitted;
    }

    let matchesTags = true;
    if (selectedTags.length > 0) {
      matchesTags =
        (opportunity.skills || []).some((s: string) =>
          selectedTags.includes(s),
        ) ||
        (opportunity.category != null &&
          selectedTags.includes(opportunity.category));
    }

    return matchesSearch && matchesSubmission && matchesTags;
  });

  const handleSubmitProposal = async (opportunity: OpportunityData) => {
    setProposalCompletionChecking(true);
    try {
      const res = await getProviderProfileCompletion();
      const data = res?.data ?? res;
      const completion =
        typeof (data as { completion?: number })?.completion === "number"
          ? (data as { completion: number }).completion
          : 0;
      if (completion < PROPOSAL_REQUIRED) {
        setProposalGateOpen(true);
        return;
      }
      router.push(`/provider/opportunities/${opportunity.id}/proposal`);
    } catch {
      setProposalGateOpen(true);
    } finally {
      setProposalCompletionChecking(false);
    }
  };

  return (
    <>
      <ProviderPreferredCurrencyDialog
        tourStorageKeyPrefix="provider-opportunities-tour-done"
        onSaved={async () => {
          await Promise.all([
            fetchOpportunities(),
            fetchRecommendedOpportunitiesRef.current?.(),
          ]);
        }}
      />
      <ProviderOpportunitiesTour />
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
          data-tour-step="0"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("provider.opportunities.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t("provider.opportunities.subtitle")}
            </p>
          </div>
          {/* <div className="flex gap-3">
            <Button>
              <Zap className="w-4 h-4 mr-2" />
              AI Recommendations
            </Button>
          </div> */}
        </div>

        {/* Top filter bar (LinkedIn-style): search + status + sort + Filters panel */}
        <Card data-tour-step="1">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={t(
                        "provider.opportunities.searchPlaceholder",
                      )}
                      className="pl-10 text-sm sm:text-base"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <Select
                  value={submissionFilter}
                  onValueChange={setSubmissionFilter}
                >
                  <SelectTrigger className="w-full sm:w-44 text-sm sm:text-base">
                    <SelectValue
                      placeholder={t(
                        "provider.opportunities.statusPlaceholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("provider.opportunities.filter.all")}
                    </SelectItem>
                    <SelectItem value="not-submitted">
                      {t("provider.opportunities.filter.notSubmitted")}
                    </SelectItem>
                    <SelectItem value="submitted">
                      {t("provider.opportunities.filter.submitted")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as "best-match" | "newest")}
                >
                  <SelectTrigger className="w-full sm:w-44 text-sm sm:text-base">
                    <SelectValue
                      placeholder={t("provider.opportunities.sortPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="best-match">
                      {t("provider.opportunities.sort.bestMatch")}
                    </SelectItem>
                    <SelectItem value="newest">
                      {t("provider.opportunities.sort.newest")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="w-full sm:w-auto text-sm sm:text-base shrink-0"
                    >
                      <SlidersHorizontal className="w-4 h-4 mr-2" />
                      {t("provider.opportunities.filters")}
                      {selectedTags.length > 0 && (
                        <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium">
                          {selectedTags.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 sm:w-96 p-4" align="start">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <Label
                          htmlFor="use-profile-tags"
                          className="text-sm font-medium cursor-pointer"
                        >
                          {t("provider.opportunities.useProfileTags")}
                        </Label>
                        <Switch
                          id="use-profile-tags"
                          checked={useProfileTags}
                          onCheckedChange={setUseProfileTags}
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        {useProfileTags
                          ? t("provider.opportunities.tagsHelpOn")
                          : t("provider.opportunities.tagsHelpOff")}
                      </p>
                      <Separator />
                      <div>
                        <Label className="text-sm font-medium mb-2 block">
                          {t("provider.opportunities.tagsLabel")}
                        </Label>
                        <div className="max-h-48 overflow-y-auto rounded-md border border-gray-200 p-2 space-y-1.5">
                          {tagOptions.length === 0 ? (
                            <p className="text-xs text-gray-500 py-2">
                              {useProfileTags
                                ? t("provider.opportunities.tagsEmptyProfile")
                                : t("provider.opportunities.tagsEmptyAll")}
                            </p>
                          ) : (
                            tagOptions.map((tag) => (
                              <label
                                key={tag}
                                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-gray-50 cursor-pointer text-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedTags.includes(tag)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedTags((prev) =>
                                        [...prev, tag].sort((a, b) =>
                                          a.localeCompare(b),
                                        ),
                                      );
                                    } else {
                                      setSelectedTags((prev) =>
                                        prev.filter((t) => t !== tag),
                                      );
                                    }
                                  }}
                                  className="rounded border-gray-300"
                                />
                                <span className="truncate">{tag}</span>
                              </label>
                            ))
                          )}
                        </div>
                        {selectedTags.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-2 text-xs"
                            onClick={() => setSelectedTags([])}
                          >
                            {t("provider.opportunities.clearTags")}
                          </Button>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities */}
        {loading ? (
          <OpportunityListSkeleton
            loadingLabel={`${t("provider.opportunities.loading")}. ${t("provider.opportunities.loadingDesc")}`}
          />
        ) : error ? (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <FriendlyErrorState
                variant="block"
                message={error}
                onRetry={() => {
                  setError(null);
                  fetchOpportunities();
                }}
              />
            </CardContent>
          </Card>
        ) : (
          <Tabs
            defaultValue={
              searchParams.get("tab") === "recommended" ? "recommended" : "all"
            }
            className="space-y-4 sm:space-y-6"
            data-tour-step="2"
          >
            <TabsList className="grid w-full grid-cols-2 h-auto">
              <TabsTrigger
                value="all"
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                {t("provider.opportunities.tab.all")}
              </TabsTrigger>
              <TabsTrigger
                value="recommended"
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                {t("provider.opportunities.tab.recommended")}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4 sm:space-y-6">
              {filteredOpportunities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 sm:p-12 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      No opportunities found
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600">
                      {searchQuery || submissionFilter !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "There are no opportunities available at the moment."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredOpportunities.map((opportunity) => {
                  const isExpanded = expandedOpportunityId === opportunity.id;
                  return (
                    <Card
                      key={opportunity.id}
                      className="group relative sm:hover:shadow-lg transition-shadow"
                    >
                      {/* AI Badge Indicator */}
                      {opportunity.aiExplanation && (
                        <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-medium shadow-md">
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden sm:inline">
                              {t("provider.dashboard.opportunity.aiInsights")}
                            </span>
                          </div>
                        </div>
                      )}
                      <CardHeader className="p-4 sm:p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 pr-0 sm:pr-20">
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                              <CardTitle className="text-lg sm:text-xl break-words">
                                {opportunity.title}
                              </CardTitle>
                              {opportunity.matchScore !== undefined &&
                                opportunity.matchScore !== null && (
                                  <Badge
                                    className={`text-xs font-semibold shrink-0 ${
                                      opportunity.matchScore >= 80
                                        ? "bg-green-100 text-green-700 border-green-300"
                                        : opportunity.matchScore >= 60
                                          ? "bg-blue-100 text-blue-700 border-blue-300"
                                          : "bg-yellow-100 text-yellow-700 border-yellow-300"
                                    }`}
                                  >
                                    {t(
                                      "provider.dashboard.opportunity.matchPercent",
                                      {
                                        n: opportunity.matchScore,
                                      },
                                    )}
                                  </Badge>
                                )}
                              {opportunity.urgent && (
                                <Badge className="bg-red-100 text-red-800 text-xs shrink-0">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {t("provider.opportunities.urgent")}
                                </Badge>
                              )}
                              {opportunity.verified && (
                                <Badge className="bg-green-100 text-green-800 text-xs shrink-0">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {t("provider.opportunities.verifiedClient")}
                                </Badge>
                              )}
                              {opportunity.hasSubmitted && (
                                <Badge className="bg-green-100 text-green-800 text-xs shrink-0">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {t("provider.opportunities.submitted")}
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-sm sm:text-base line-clamp-2 sm:line-clamp-3 break-words">
                              {opportunity.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarImage
                                src={
                                  opportunity.avatar &&
                                  opportunity.avatar !==
                                    "/placeholder.svg?height=40&width=40" &&
                                  !opportunity.avatar.includes(
                                    "/placeholder.svg",
                                  )
                                    ? opportunity.avatar
                                    : "/placeholder.svg"
                                }
                              />
                              <AvatarFallback>
                                {opportunity.client.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              {opportunity.clientId ? (
                                <Link
                                  href={`/provider/companies/${opportunity.clientId}`}
                                  className="font-medium text-sm sm:text-base text-blue-600 active:text-blue-800 sm:hover:text-blue-800 sm:hover:underline break-words"
                                >
                                  {opportunity.client}
                                </Link>
                              ) : (
                                <p className="font-medium text-sm sm:text-base break-words">
                                  {opportunity.client}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500">
                                <div className="flex items-center">
                                  <span className="text-yellow-400">★</span>
                                  <span className="ml-1">
                                    {opportunity.clientRating}
                                  </span>
                                </div>
                                <span>•</span>
                                <span>
                                  {t("provider.opportunities.projectsPosted", {
                                    n: opportunity.projectsPosted,
                                  })}
                                </span>
                                <span>•</span>
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                                  <span className="break-words">
                                    {opportunity.location}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto">
                            <div className="flex items-center text-green-600 font-semibold text-sm sm:text-base">
                              <span className="break-words">
                                {opportunity.budget}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-gray-500">
                              {formatTimeline(opportunity.timeline)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {opportunity.skills.map((skill: string) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        {/* AI Explanation - Responsive: Hover on desktop, Click on mobile */}
                        {opportunity.aiExplanation && (
                          <div className="overflow-hidden">
                            {/* Collapsed State - Desktop hover, Mobile click */}
                            <div
                              className={`lg:group-hover:hidden ${
                                isExpanded ? "hidden" : "block"
                              } transition-all duration-300`}
                            >
                              <button
                                onClick={() =>
                                  setExpandedOpportunityId(
                                    isExpanded ? null : opportunity.id,
                                  )
                                }
                                className="flex items-center gap-2 text-xs text-blue-600 active:text-blue-800 sm:hover:text-blue-700 font-medium touch-manipulation"
                              >
                                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                <span className="hidden sm:inline">
                                  {t(
                                    "provider.dashboard.opportunity.hoverInsights",
                                  )}
                                </span>
                                <span className="sm:hidden">
                                  {t(
                                    "provider.dashboard.opportunity.tapInsights",
                                  )}
                                </span>
                                <ChevronRight
                                  className={`w-3 h-3 shrink-0 transition-transform ${
                                    isExpanded ? "rotate-90" : ""
                                  }`}
                                />
                              </button>
                            </div>

                            {/* Expanded State - Shows on hover (desktop) or click (mobile) */}
                            <div
                              className={`lg:group-hover:block ${
                                isExpanded ? "block" : "hidden"
                              } animate-in fade-in slide-in-from-top-2 duration-300`}
                            >
                              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-200 shadow-md">
                                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                  <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                  </div>
                                  <p className="text-xs sm:text-sm font-semibold text-blue-900">
                                    {t("provider.opportunities.aiAbout")}
                                  </p>
                                  {/* Close button for mobile */}
                                  <button
                                    onClick={() =>
                                      setExpandedOpportunityId(null)
                                    }
                                    className="ml-auto lg:hidden text-blue-600 active:text-blue-800 sm:hover:text-blue-800 p-1"
                                    aria-label={t(
                                      "provider.dashboard.opportunity.closeInsightsAria",
                                    )}
                                  >
                                    <span className="text-lg">×</span>
                                  </button>
                                </div>
                                <div className="text-xs sm:text-sm text-blue-800 space-y-1.5 sm:space-y-2">
                                  {opportunity.aiExplanation
                                    .split("\n")
                                    .filter((line: string) => line.trim())
                                    .map((line: string, index: number) => {
                                      const cleanLine = line
                                        .replace(/^[•\-\*]\s*/, "")
                                        .trim();
                                      const isWarning =
                                        cleanLine.includes("⚠️") ||
                                        cleanLine.includes("Warning");
                                      return cleanLine ? (
                                        <div
                                          key={index}
                                          className={`flex items-start gap-2 sm:gap-3 ${
                                            isWarning
                                              ? "bg-red-50 p-2 rounded border border-red-200"
                                              : ""
                                          }`}
                                        >
                                          <span
                                            className={`mt-0.5 font-bold flex-shrink-0 ${
                                              isWarning
                                                ? "text-red-600"
                                                : "text-blue-600"
                                            }`}
                                          >
                                            •
                                          </span>
                                          <span
                                            className={`leading-relaxed break-words ${
                                              isWarning
                                                ? "text-red-800 font-medium"
                                                : ""
                                            }`}
                                          >
                                            {cleanLine}
                                          </span>
                                        </div>
                                      ) : null;
                                    })}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                            <span>{opportunity.postedTime}</span>
                            <div className="flex items-center">
                              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                              {opportunity.proposals === 1
                                ? t(
                                    "provider.dashboard.opportunity.proposalOne",
                                  )
                                : t(
                                    "provider.dashboard.opportunity.proposalsN",
                                    {
                                      n: opportunity.proposals,
                                    },
                                  )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Link
                              href={`/provider/opportunities/${opportunity.id}`}
                              className="w-full sm:w-auto"
                            >
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto text-xs sm:text-sm"
                              >
                                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                {t(
                                  "provider.dashboard.opportunity.viewDetails",
                                )}
                              </Button>
                            </Link>
                            {opportunity.hasSubmitted ? (
                              <Button
                                size="sm"
                                disabled
                                className="w-full sm:w-auto text-xs sm:text-sm"
                              >
                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                {t("provider.opportunities.submitted")}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSubmitProposal(opportunity)
                                }
                                disabled={proposalCompletionChecking}
                                className="w-full sm:w-auto text-xs sm:text-sm"
                              >
                                {proposalCompletionChecking ? (
                                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                                ) : (
                                  <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                )}
                                {proposalCompletionChecking
                                  ? t("provider.opportunities.checking")
                                  : t("provider.opportunities.submitProposal")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="recommended" className="space-y-4 sm:space-y-6">
              {loadingRecommended ? (
                <OpportunityListSkeleton
                  variant="recommended"
                  loadingLabel={`${t("provider.opportunities.loadingRecommended")}. ${t("provider.opportunities.loadingRecommendedDesc")}`}
                />
              ) : errorRecommended ? (
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <FriendlyErrorState
                      variant="block"
                      message={errorRecommended}
                      onRetry={() => {
                        setErrorRecommended(null);
                        fetchRecommendedOpportunitiesRef.current?.();
                      }}
                    />
                  </CardContent>
                </Card>
              ) : recommendedOpportunities.length === 0 ? (
                <Card>
                  <CardContent className="p-8 sm:p-12 text-center">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {recommendationsCacheInfo.requiresSkills
                        ? t("provider.opportunities.reco.addSkillsTitle")
                        : t("provider.opportunities.reco.emptyTitle")}
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4">
                      {recommendationsCacheInfo.requiresSkills
                        ? t("provider.opportunities.reco.addSkillsBody")
                        : t("provider.opportunities.reco.emptyBody")}
                    </p>
                    {recommendationsCacheInfo.requiresSkills && (
                      <Link href="/provider/profile">
                        <Button
                          variant="default"
                          className="text-xs sm:text-sm"
                        >
                          {t("provider.opportunities.goToProfile")}
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <>
                  {recommendationsCacheInfo.cachedAt &&
                    recommendationsCacheInfo.nextRefreshAt && (
                      <div className="text-xs text-gray-500 mb-3 sm:mb-4">
                        {formatRecommendationsCacheLine(
                          recommendationsCacheInfo.cachedAt,
                          recommendationsCacheInfo.nextRefreshAt,
                        )}
                      </div>
                    )}
                  <div className="space-y-3 sm:space-y-4">
                    {recommendedOpportunities.map(
                      (opportunity: OpportunityData) => {
                        const isExpanded =
                          expandedOpportunityId === opportunity.id;
                        return (
                          <Card
                            key={opportunity.id}
                            className="group relative p-3 sm:p-4 md:p-5 border-2 border-gray-200 rounded-lg sm:rounded-xl active:border-blue-400 active:shadow-md sm:hover:border-blue-400 sm:hover:shadow-lg transition-all duration-300 bg-white"
                          >
                            {/* AI Badge Indicator - Desktop hover only */}
                            {opportunity.aiExplanation && (
                              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                                <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-medium shadow-md">
                                  <Sparkles className="w-3 h-3" />
                                  <span className="hidden sm:inline">
                                    {t(
                                      "provider.dashboard.opportunity.aiInsights",
                                    )}
                                  </span>
                                </div>
                              </div>
                            )}

                            <CardHeader className="p-0 pb-3 sm:pb-4">
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 pr-0 sm:pr-20">
                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 flex-wrap">
                                    <CardTitle className="font-semibold text-gray-900 sm:group-hover:text-blue-700 transition-colors text-base sm:text-lg break-words">
                                      {opportunity.title}
                                    </CardTitle>
                                    {opportunity.matchScore !== undefined && (
                                      <Badge
                                        className={`text-xs font-semibold shrink-0 ${
                                          opportunity.matchScore >= 80
                                            ? "bg-green-100 text-green-700 border-green-300"
                                            : opportunity.matchScore >= 60
                                              ? "bg-blue-100 text-blue-700 border-blue-300"
                                              : "bg-yellow-100 text-yellow-700 border-yellow-300"
                                        }`}
                                      >
                                        {t(
                                          "provider.dashboard.opportunity.matchPercent",
                                          { n: opportunity.matchScore },
                                        )}
                                      </Badge>
                                    )}
                                  </div>
                                  <CardDescription className="text-xs sm:text-sm font-medium text-gray-700 mt-1 break-words">
                                    {opportunity.budget}
                                  </CardDescription>
                                  {opportunity.client && (
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      <p className="text-xs text-gray-600 break-words">
                                        {opportunity.client}
                                      </p>
                                      {opportunity.verified && (
                                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium shrink-0">
                                          {t(
                                            "provider.dashboard.opportunity.verified",
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* AI Explanation - Responsive: Hover on desktop, Click on mobile */}
                              {opportunity.aiExplanation && (
                                <div className="mb-3 sm:mb-4 overflow-hidden">
                                  {/* Collapsed State - Desktop hover, Mobile click */}
                                  <div
                                    className={`lg:group-hover:hidden ${
                                      isExpanded ? "hidden" : "block"
                                    } transition-all duration-300`}
                                  >
                                    <button
                                      onClick={() =>
                                        setExpandedOpportunityId(
                                          isExpanded ? null : opportunity.id,
                                        )
                                      }
                                      className="flex items-center gap-2 text-xs text-blue-600 active:text-blue-800 sm:hover:text-blue-700 font-medium touch-manipulation"
                                    >
                                      <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                      <span className="hidden sm:inline">
                                        {t(
                                          "provider.dashboard.opportunity.hoverInsights",
                                        )}
                                      </span>
                                      <span className="sm:hidden">
                                        {t(
                                          "provider.dashboard.opportunity.tapInsights",
                                        )}
                                      </span>
                                      <ChevronRight
                                        className={`w-3 h-3 shrink-0 transition-transform ${
                                          isExpanded ? "rotate-90" : ""
                                        }`}
                                      />
                                    </button>
                                  </div>

                                  {/* Expanded State - Shows on hover (desktop) or click (mobile) */}
                                  <div
                                    className={`lg:group-hover:block ${
                                      isExpanded ? "block" : "hidden"
                                    } animate-in fade-in slide-in-from-top-2 duration-300`}
                                  >
                                    <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-200 shadow-md">
                                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                        <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                                          <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                        </div>
                                        <p className="text-xs sm:text-sm font-semibold text-blue-900">
                                          {t(
                                            "provider.dashboard.opportunity.whyRecommended",
                                          )}
                                        </p>
                                        {/* Close button for mobile */}
                                        <button
                                          onClick={() =>
                                            setExpandedOpportunityId(null)
                                          }
                                          className="ml-auto lg:hidden text-blue-600 active:text-blue-800 sm:hover:text-blue-800 p-1"
                                          aria-label={t(
                                            "provider.dashboard.opportunity.closeInsightsAria",
                                          )}
                                        >
                                          <span className="text-lg">×</span>
                                        </button>
                                      </div>
                                      <div className="text-xs sm:text-sm text-blue-800 space-y-1.5 sm:space-y-2">
                                        {opportunity.aiExplanation
                                          .split("\n")
                                          .filter((line: string) => line.trim())
                                          .map(
                                            (line: string, index: number) => {
                                              const cleanLine = line
                                                .replace(/^[•\-\*]\s*/, "")
                                                .trim();
                                              return cleanLine ? (
                                                <div
                                                  key={index}
                                                  className="flex items-start gap-2 sm:gap-3"
                                                >
                                                  <span className="text-blue-600 mt-0.5 font-bold flex-shrink-0">
                                                    •
                                                  </span>
                                                  <span className="leading-relaxed break-words">
                                                    {cleanLine}
                                                  </span>
                                                </div>
                                              ) : null;
                                            },
                                          )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </CardHeader>

                            <CardContent className="p-0 space-y-3 sm:space-y-4">
                              <div className="flex flex-wrap gap-1.5">
                                {(opportunity.skills || [])
                                  .slice(0, 6)
                                  .map((skill: string) => (
                                    <Badge
                                      key={skill}
                                      variant="secondary"
                                      className="text-xs sm:group-hover:bg-blue-100 sm:group-hover:text-blue-700 transition-colors border"
                                    >
                                      {skill}
                                    </Badge>
                                  ))}
                                {(opportunity.skills || []).length > 6 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs border"
                                  >
                                    {t(
                                      "provider.dashboard.opportunity.moreSkills",
                                      {
                                        n:
                                          (opportunity.skills || []).length - 6,
                                      },
                                    )}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-gray-200 sm:group-hover:border-blue-200 transition-colors">
                                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600 w-full sm:w-auto">
                                  <span className="capitalize font-medium">
                                    {opportunity.category}
                                  </span>
                                  {opportunity.timeline && (
                                    <span className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3 shrink-0" />
                                      <span className="break-words">
                                        {opportunity.timeline}
                                      </span>
                                    </span>
                                  )}
                                  {opportunity.proposals !== undefined && (
                                    <span className="whitespace-nowrap">
                                      {opportunity.proposals === 1
                                        ? t(
                                            "provider.dashboard.opportunity.proposalOne",
                                          )
                                        : t(
                                            "provider.dashboard.opportunity.proposalsN",
                                            { n: opportunity.proposals },
                                          )}
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                                  <Link
                                    href={`/provider/opportunities/${opportunity.id}`}
                                    className="w-full sm:w-auto"
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="w-full sm:w-auto text-xs sm:text-sm"
                                    >
                                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                      {t(
                                        "provider.dashboard.opportunity.viewDetails",
                                      )}
                                    </Button>
                                  </Link>
                                  {opportunity.hasSubmitted ? (
                                    <Button
                                      size="sm"
                                      disabled
                                      className="w-full sm:w-auto text-xs sm:text-sm"
                                    >
                                      <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                      {t("provider.opportunities.submitted")}
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleSubmitProposal(opportunity)
                                      }
                                      disabled={proposalCompletionChecking}
                                      className="w-full sm:w-auto sm:group-hover:bg-blue-600 sm:group-hover:text-white transition-all duration-300 text-xs sm:text-sm"
                                    >
                                      {proposalCompletionChecking ? (
                                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                                      ) : (
                                        <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                      )}
                                      {proposalCompletionChecking
                                        ? t("provider.opportunities.checking")
                                        : t(
                                            "provider.opportunities.submitProposal",
                                          )}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      },
                    )}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Project Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedProject?.title}
              </DialogTitle>
              <DialogDescription className="text-base">
                {t("provider.opportunities.details.postedBy", {
                  client: selectedProject?.client ?? "",
                  time: selectedProject?.postedTime ?? "",
                })}
              </DialogDescription>
            </DialogHeader>

            {selectedProject && (
              <div className="space-y-6">
                {/* Project Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        {t("provider.opportunities.details.projectDescription")}
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedProject.fullDescription}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        {t("provider.opportunities.details.requirements")}
                      </h3>
                      <MarkdownViewer
                        content={selectedProject.requirements}
                        emptyMessage={t(
                          "provider.opportunities.details.noRequirements",
                        )}
                        className="text-gray-700"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        {t("provider.opportunities.details.deliverables")}
                      </h3>
                      <MarkdownViewer
                        content={selectedProject.deliverables}
                        emptyMessage={t(
                          "provider.opportunities.details.noDeliverables",
                        )}
                        className="text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {t("provider.opportunities.details.projectDetails")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {t("provider.opportunities.details.budget")}
                          </span>
                          <span className="font-semibold text-green-600">
                            {selectedProject.budget}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {t("provider.opportunities.details.timeline")}
                          </span>
                          <span className="font-semibold">
                            {formatTimeline(selectedProject?.timeline)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {t("provider.opportunities.details.proposals")}
                          </span>
                          <span className="font-semibold">
                            {selectedProject.proposals}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {t("provider.opportunities.details.location")}
                          </span>
                          <span className="font-semibold">
                            {selectedProject.location}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {t("provider.opportunities.details.matchScore")}
                          </span>
                          <Badge
                            className={getMatchScoreColor(
                              selectedProject.matchScore || 0,
                            )}
                          >
                            {t("provider.opportunities.details.matchPercent", {
                              n: selectedProject.matchScore || 0,
                            })}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {t("provider.opportunities.details.clientInfo")}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                selectedProject.avatar &&
                                selectedProject.avatar !==
                                  "/placeholder.svg?height=40&width=40" &&
                                !selectedProject.avatar.includes(
                                  "/placeholder.svg",
                                )
                                  ? selectedProject.avatar
                                  : "/placeholder.svg"
                              }
                            />
                            <AvatarFallback>
                              {selectedProject.client.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {selectedProject.client}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Star className="w-3 h-3 text-yellow-400 mr-1" />
                              {t(
                                "provider.opportunities.details.clientRatingProjects",
                                {
                                  rating: selectedProject.clientRating,
                                  n: selectedProject.projectsPosted,
                                },
                              )}
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              {t("provider.opportunities.details.companySize")}
                            </span>
                            <span>
                              {selectedProject.clientInfo?.companySize}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              {t("provider.opportunities.details.industry")}
                            </span>
                            <span>{selectedProject.clientInfo?.industry}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              {t("provider.opportunities.details.memberSince")}
                            </span>
                            <span>
                              {selectedProject.clientInfo?.memberSince}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              {t("provider.opportunities.details.totalSpent")}
                            </span>
                            <span className="text-green-600 font-semibold">
                              {selectedProject.clientInfo?.totalSpent ||
                                formatCurrencyAmount(
                                  0,
                                  selectedProject?.currencyCode || "MYR",
                                )}
                            </span>
                          </div>
                        </div>
                        {selectedProject.clientId && (
                          <div className="pt-2">
                            <Link
                              href={`/provider/companies/${selectedProject.clientId}`}
                            >
                              <Button variant="outline" className="w-full">
                                <Eye className="w-4 h-4 mr-2" />
                                {t(
                                  "provider.opportunities.details.viewCompany",
                                )}
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Skills Required */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    {t("provider.opportunities.details.skillsRequired")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.skills.map((skill: string) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-sm px-3 py-1"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                {t("provider.opportunities.details.close")}
              </Button>
              <Button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  if (selectedProject) {
                    void handleSubmitProposal(selectedProject);
                  }
                }}
                disabled={
                  selectedProject?.hasSubmitted || proposalCompletionChecking
                }
              >
                {selectedProject?.hasSubmitted
                  ? t("provider.opportunities.details.alreadySubmitted")
                  : proposalCompletionChecking
                    ? t("provider.opportunities.checking")
                    : t("provider.opportunities.submitProposal")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
