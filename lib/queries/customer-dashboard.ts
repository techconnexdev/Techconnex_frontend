import {
  apiFetch,
  getCompanyProjects,
  getCompanyProjectStats,
  getProfileImageUrl,
} from "@/lib/api";
import { convertWithSnapshot, type FxRatesMap } from "@/lib/fx-snapshot";

export type CustomerDashboardProject = {
  id: string;
  title: string;
  provider?: string;
  providerName?: string;
  status: string;
  progress?: number;
  budget?: number;
  currencyCode?: string;
  deadline?: string;
  avatar?: string;
  createdAt?: string;
  category?: unknown;
  description?: unknown;
  type?: unknown;
  [key: string]: unknown;
};

export type CustomerDashboardData = {
  preferredCurrency: string;
  stats: {
    activeProjects: number;
    completedProjects: number;
    totalSpent: number;
    rating: number | null;
    reviewCount: number;
  };
  recentProjects: CustomerDashboardProject[];
};

function readPreferredCurrencyFromUser(): string {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return "MYR";
    const parsed = JSON.parse(raw) as {
      settings?: { preferredCurrency?: string };
    };
    const code = String(parsed?.settings?.preferredCurrency || "")
      .trim()
      .toUpperCase();
    if (/^[A-Z]{3}$/.test(code)) return code;
  } catch {
    // ignore
  }
  return "MYR";
}

/**
 * Single bundle for the customer dashboard — shared by `useQuery` and hover prefetch.
 */
export async function fetchCustomerDashboardData(): Promise<CustomerDashboardData> {
  const preferredCode = readPreferredCurrencyFromUser();

  const [statsResponse, transactionsResponse] = await Promise.all([
    getCompanyProjectStats(),
    apiFetch("/company/billing/transactions"),
  ]);

  const transactionItems = (
    (transactionsResponse?.transactions as Array<Record<string, unknown>>) || []
  ).filter((txn) => {
    const status = String(txn?.status || "").toLowerCase();
    return (
      status === "transferred" || status === "escrow" || status === "escrowed"
    );
  });

  const totalSpentPreferred = transactionItems.reduce((sum, txn) => {
    const amount = Number(txn?.amount || 0);
    const fromCurrency = String(
      ((txn?.project as Record<string, unknown>)?.currencyCode as string) ||
        "MYR",
    ).toUpperCase();
    if (fromCurrency === preferredCode) return sum + amount;
    const converted = convertWithSnapshot({
      amount,
      fromCurrencyCode: fromCurrency,
      toCurrencyCode: preferredCode,
      ratesMap:
        (((txn?.project as Record<string, unknown>)
          ?.fxSnapshotRatesJson as FxRatesMap | null) ?? null),
    });
    return sum + (converted == null ? amount : converted);
  }, 0);

  let stats: CustomerDashboardData["stats"] = {
    activeProjects: 0,
    completedProjects: 0,
    totalSpent: 0,
    rating: null,
    reviewCount: 0,
  };

  if (statsResponse.success && statsResponse.stats) {
    stats = {
      activeProjects: statsResponse.stats.activeProjects || 0,
      completedProjects: statsResponse.stats.completedProjects || 0,
      totalSpent: Number(totalSpentPreferred.toFixed(2)),
      rating: statsResponse.stats.averageRating ?? null,
      reviewCount: statsResponse.stats.reviewCount || 0,
    };
  }

  const projectsResponse = await getCompanyProjects({
    page: 1,
    limit: 3,
  });

  let recentProjects: CustomerDashboardProject[] = [];
  if (projectsResponse.success && projectsResponse.items) {
    recentProjects = projectsResponse.items.map(
      (project: Record<string, unknown>) => {
        const provider = project.provider as
          | Record<string, unknown>
          | undefined;
        return {
          id: project.id as string,
          title: project.title as string,
          provider: provider?.name as string | undefined,
          providerName: provider?.name as string | undefined,
          status: (project.status as string)?.toLowerCase() || "pending",
          progress: project.progress || 0,
          budget: project.budgetMax as number | undefined,
          currencyCode: (project.currencyCode as string) || "MYR",
          deadline: project.timeline as string | undefined,
          avatar: getProfileImageUrl(
            (
              provider?.providerProfile as
                | Record<string, unknown>
                | undefined
            )?.profileImageUrl as string | undefined,
          ),
          createdAt: project.createdAt as string | undefined,
          category: project.category,
          description: project.description,
          type: project.type,
        };
      },
    );
  }

  return {
    preferredCurrency: preferredCode,
    stats,
    recentProjects,
  };
}
