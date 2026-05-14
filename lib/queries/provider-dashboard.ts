import {
  getProviderPerformanceMetrics,
  getProviderProjects,
  getProviderProjectStats,
  getProviderRecommendedOpportunities,
} from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import type { FxRatesMap } from "@/lib/fx-snapshot";

export type ProviderProjectCustomer = {
  id?: string;
  name?: string;
  email?: string;
  customerProfile?: {
    profileImageUrl?: string;
    industry?: string;
    location?: string;
    website?: string;
  };
  profileImageUrl?: string;
};

export type NextMilestone = {
  title?: string;
  description?: string;
};

export type ProviderDashboardProject = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  approvedPrice?: number;
  currencyCode?: string;
  fxSnapshotRatesJson?: FxRatesMap | null;
  progress?: number;
  completedMilestones?: number;
  totalMilestones?: number;
  timeline?: string;
  createdAt?: string;
  customer?: ProviderProjectCustomer;
  nextMilestone?: NextMilestone;
};

export type OpportunityCustomer = {
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

export type RecommendedOpportunity = {
  id: string;
  title: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  currencyCode?: string;
  fxSnapshotRatesJson?: FxRatesMap | null;
  timeline?: string;
  skills?: string[];
  category?: string;
  proposalCount?: number;
  matchScore?: number | null;
  aiExplanation?: string | null;
  customer?: OpportunityCustomer;
};

export type ProviderDashboardData = {
  stats: {
    activeProjects: number;
    completedProjects: number;
    totalEarnings: number;
    rating: string;
    responseRate: number;
  };
  earningsCurrency: string;
  activeProjects: ProviderDashboardProject[];
  recommendedOpportunities: RecommendedOpportunity[];
  recommendationsCacheInfo: {
    cachedAt: number | null;
    nextRefreshAt: number | null;
  };
  recommendationsError: string | null;
  performance: {
    totalProjects: number;
    completionRate: number;
    onTimeDelivery: number;
    repeatClients: number;
    responseRate: string;
  };
};

async function fetchEarningsOverview(): Promise<Record<string, unknown> | null> {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base) return null;
  const res = await fetch(`${base}/provider/earnings/overview`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) return null;
  return res.json() as Promise<Record<string, unknown>>;
}

/**
 * Single bundle for the provider dashboard — shared by `useQuery` and hover prefetch.
 */
export async function fetchProviderDashboardData(
  locale = "en",
): Promise<ProviderDashboardData> {
  const [statsResponse, earningsResponse] = await Promise.all([
    getProviderProjectStats(),
    fetchEarningsOverview(),
  ]);

  const earningsData = earningsResponse?.earningsData as
    | Record<string, unknown>
    | undefined;
  const preferred = String(earningsData?.preferredCurrency || "MYR")
    .trim()
    .toUpperCase();
  const earningsCurrency = /^[A-Z]{3}$/.test(preferred) ? preferred : "MYR";

  let stats: ProviderDashboardData["stats"] = {
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    rating: "0",
    responseRate: 85,
  };

  if (statsResponse.success && statsResponse.stats) {
    stats = {
      activeProjects: statsResponse.stats.activeProjects || 0,
      completedProjects: statsResponse.stats.completedProjects || 0,
      totalEarnings:
        Number(earningsData?.totalEarnings) ||
        statsResponse.stats.totalEarnings ||
        0,
      rating: statsResponse.stats.averageRating?.toString() || "0",
      responseRate: 85,
    };
  }

  const projectsResponse = await getProviderProjects({
    page: 1,
    limit: 5,
    status: "IN_PROGRESS",
  });
  const activeProjects: ProviderDashboardProject[] = projectsResponse.success
    ? (projectsResponse.projects as ProviderDashboardProject[]) || []
    : [];

  let recommendedOpportunities: RecommendedOpportunity[] = [];
  let recommendationsCacheInfo: ProviderDashboardData["recommendationsCacheInfo"] =
    { cachedAt: null, nextRefreshAt: null };
  let recommendationsError: string | null = null;

  try {
    const recommendationsResponse =
      await getProviderRecommendedOpportunities(locale);
    if (recommendationsResponse.success) {
      recommendedOpportunities =
        (recommendationsResponse.recommendations as RecommendedOpportunity[]) ||
        [];
      recommendationsCacheInfo = {
        cachedAt: recommendationsResponse.cachedAt ?? null,
        nextRefreshAt: recommendationsResponse.nextRefreshAt ?? null,
      };
    }
  } catch (error) {
    recommendationsError = getUserFriendlyErrorMessage(
      error,
      "provider dashboard recommendations",
    );
  }

  const performanceResponse = await getProviderPerformanceMetrics();
  let performance: ProviderDashboardData["performance"];
  if (performanceResponse.success) {
    performance = {
      totalProjects: statsResponse.stats?.totalProjects || 0,
      completionRate: performanceResponse.metrics?.completionRate || 0,
      onTimeDelivery: performanceResponse.metrics?.onTimeDelivery || 0,
      repeatClients: performanceResponse.metrics?.repeatClients || 0,
      responseRate: "85%",
    };
  } else {
    performance = {
      totalProjects: statsResponse.stats?.totalProjects || 0,
      completionRate: 0,
      onTimeDelivery: 0,
      repeatClients: 0,
      responseRate: "85%",
    };
  }

  return {
    stats,
    earningsCurrency,
    activeProjects,
    recommendedOpportunities,
    recommendationsCacheInfo,
    recommendationsError,
    performance,
  };
}
