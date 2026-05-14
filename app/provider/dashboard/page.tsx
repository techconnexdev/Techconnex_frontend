"use client";
import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ProviderOnboardingPromptDialog,
  getOnboardingDismissed,
  getOnboardingCompleted,
} from "@/components/provider/ProviderOnboardingPromptDialog";
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
import {
  DollarSign,
  Star,
  Briefcase,
  CheckCircle,
  Eye,
  Calendar,
  Award,
  Target,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProviderDashboardTour } from "@/components/provider/ProviderDashboardTour";
import { getProfileImageUrl, getProviderProfileCompletion } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { FriendlyErrorState } from "@/components/FriendlyErrorState";
import { useI18n } from "@/contexts/I18nProvider";
import { convertWithSnapshot, type FxRatesMap } from "@/lib/fx-snapshot";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchProviderDashboardData,
  type ProviderDashboardProject as ProviderProject,
  type RecommendedOpportunity,
} from "@/lib/queries/provider-dashboard";

export default function ProviderDashboard() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const {
    data: dash,
    isPending,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: [...queryKeys.provider.dashboard, locale],
    queryFn: () => fetchProviderDashboardData(locale),
  });

  const stats = dash?.stats ?? {
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    rating: "0",
    responseRate: 0,
  };
  const earningsCurrency = dash?.earningsCurrency ?? "MYR";
  const activeProjects = dash?.activeProjects ?? [];
  const recommendedOpportunities = dash?.recommendedOpportunities ?? [];
  const recommendationsCacheInfo = dash?.recommendationsCacheInfo ?? {
    cachedAt: null,
    nextRefreshAt: null,
  };
  const errorOpportunities = dash?.recommendationsError ?? null;
  const performance = dash?.performance ?? {
    totalProjects: 0,
    completionRate: 0,
    onTimeDelivery: 0,
    repeatClients: 0,
    responseRate: "85%",
  };

  const dashboardLoadError = dashboardError
    ? getUserFriendlyErrorMessage(dashboardError, "provider dashboard")
    : null;

  const statsLoading = isPending && !dash;
  const activeProjectsLoading = isPending && !dash;
  const performanceLoading = isPending && !dash;
  const loadingOpportunities = isPending && !dash;

  const [expandedOpportunityId, setExpandedOpportunityId] = useState<
    string | null
  >(null);

  const [onboardingCompletion, setOnboardingCompletion] = useState<
    number | null
  >(null);
  const [onboardingCompletionLoading, setOnboardingCompletionLoading] =
    useState(true);
  const [onboardingDialogOpen, setOnboardingDialogOpen] = useState(false);
  const [tourAllowed, setTourAllowed] = useState(false);

  const ONBOARDING_MAX_COMPLETION = 50; // Don't show dialog if profile is already > 50% complete

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

  // Fetch completion on this page for onboarding dialog only
  useEffect(() => {
    let cancelled = false;
    setOnboardingCompletionLoading(true);
    getProviderProfileCompletion()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? res;
        const comp = typeof data?.completion === "number" ? data.completion : 0;
        setOnboardingCompletion(comp);
      })
      .catch(() => {
        if (!cancelled) setOnboardingCompletion(0);
      })
      .finally(() => {
        if (!cancelled) setOnboardingCompletionLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Once completion has loaded: show dialog only if completion ≤ 50% and not dismissed/completed
  useEffect(() => {
    if (onboardingCompletionLoading || onboardingCompletion === null) return;
    if (getOnboardingDismissed() || getOnboardingCompleted()) return;
    if (onboardingCompletion > ONBOARDING_MAX_COMPLETION) return;
    const t = setTimeout(() => {
      if (getOnboardingDismissed() || getOnboardingCompleted()) return;
      setOnboardingDialogOpen(true);
    }, 150);
    return () => clearTimeout(t);
  }, [onboardingCompletionLoading, onboardingCompletion]);

  // Hide dialog when profile is > 50% complete
  useEffect(() => {
    if (
      !onboardingCompletionLoading &&
      onboardingCompletion !== null &&
      onboardingCompletion > ONBOARDING_MAX_COMPLETION
    ) {
      setOnboardingDialogOpen(false);
    }
  }, [onboardingCompletionLoading, onboardingCompletion]);

  // Delay tour until after we've had time to show the onboarding dialog (avoids tour showing first)
  useEffect(() => {
    const t = setTimeout(() => setTourAllowed(true), 900);
    return () => clearTimeout(t);
  }, []);

  const formatMoney = useCallback(
    (amount: number, currency = "MYR") => {
      const localeTag =
        locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US";
      const code = String(currency || "MYR").toUpperCase();
      try {
        return new Intl.NumberFormat(localeTag, {
          style: "currency",
          currency: code,
        }).format(Number(amount || 0));
      } catch {
        return `${code} ${Number(amount || 0).toLocaleString()}`;
      }
    },
    [locale],
  );

  const formatProjectAmountInPreferredCurrency = useCallback(
    (amount: number | undefined, project: ProviderProject) => {
      const rawAmount = Number(amount || 0);
      const fromCurrency = String(project.currencyCode || "MYR").toUpperCase();
      const toCurrency = String(earningsCurrency || "MYR").toUpperCase();
      if (rawAmount <= 0) return formatMoney(0, toCurrency);
      if (fromCurrency === toCurrency) return formatMoney(rawAmount, toCurrency);
      const converted = convertWithSnapshot({
        amount: rawAmount,
        fromCurrencyCode: fromCurrency,
        toCurrencyCode: toCurrency,
        ratesMap: project.fxSnapshotRatesJson ?? null,
      });
      if (converted == null) {
        // Keep amount truthful when conversion rate is unavailable.
        return formatMoney(rawAmount, fromCurrency);
      }
      return formatMoney(converted, toCurrency);
    },
    [earningsCurrency, formatMoney],
  );

  const formatOpportunityAmountInPreferredCurrency = useCallback(
    (amount: number | undefined, opportunity: RecommendedOpportunity) => {
      const rawAmount = Number(amount || 0);
      const fromCurrency = String(opportunity.currencyCode || "MYR").toUpperCase();
      const toCurrency = String(earningsCurrency || "MYR").toUpperCase();
      if (rawAmount <= 0) return formatMoney(0, toCurrency);
      if (fromCurrency === toCurrency) return formatMoney(rawAmount, toCurrency);
      const converted = convertWithSnapshot({
        amount: rawAmount,
        fromCurrencyCode: fromCurrency,
        toCurrencyCode: toCurrency,
        ratesMap: opportunity.fxSnapshotRatesJson ?? null,
      });
      if (converted == null) {
        return formatMoney(rawAmount, fromCurrency);
      }
      return formatMoney(converted, toCurrency);
    },
    [earningsCurrency, formatMoney],
  );

  const retryRecommendations = () => {
    void refetchDashboard();
  };

  return (
    <>
      <ProviderOnboardingPromptDialog
        open={onboardingDialogOpen}
        onOpenChange={setOnboardingDialogOpen}
      />
      {/* Show dashboard tour only after dialog chance has passed and dialog is closed */}
      {!onboardingDialogOpen && tourAllowed && <ProviderDashboardTour />}
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
          data-tour-step="0"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("provider.dashboard.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {t("provider.dashboard.heroSubtitle")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href="/provider/profile" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {t("provider.dashboard.viewProfile")}
              </Button>
            </Link>
            <Link
              href="/provider/opportunities"
              className="w-full sm:w-auto"
              data-tour-step="1"
            >
              <Button className="w-full sm:w-auto text-xs sm:text-sm">
                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {t("provider.dashboard.browseJobs")}
              </Button>
            </Link>
          </div>
        </div>

        {dashboardLoadError ? (
          <FriendlyErrorState
            variant="block"
            message={dashboardLoadError}
            onRetry={() => {
              void refetchDashboard();
            }}
          />
        ) : (
          <>
            {/* Stats Cards */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
              data-tour-step="2"
            >
              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">
                        {t("provider.dashboard.stats.activeProjects")}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {statsLoading ? (
                          <span className="inline-block animate-pulse bg-gray-200 h-6 sm:h-8 w-12 sm:w-16 rounded" />
                        ) : (
                          stats.activeProjects
                        )}
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                      <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">
                        {t("provider.dashboard.stats.totalEarnings")}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                        {statsLoading ? (
                          <span className="inline-block animate-pulse bg-gray-200 h-6 sm:h-8 w-20 sm:w-24 rounded" />
                        ) : (
                          formatMoney(stats.totalEarnings, earningsCurrency)
                        )}
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">
                        {t("provider.dashboard.stats.rating")}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <p className="text-xl sm:text-2xl font-bold text-gray-900">
                          {statsLoading ? (
                            <span className="inline-block animate-pulse bg-gray-200 h-6 sm:h-8 w-10 sm:w-12 rounded" />
                          ) : (
                            stats.rating
                          )}
                        </p>
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current flex-shrink-0" />
                      </div>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                      <Award className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-600">
                        {t("provider.dashboard.stats.completedProjects")}
                      </p>
                      <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                        {statsLoading ? (
                          <span className="inline-block animate-pulse bg-gray-200 h-6 sm:h-8 w-12 sm:w-16 rounded" />
                        ) : (
                          stats.completedProjects
                        )}
                      </p>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                      <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                {/* Active Projects */}
                <Card data-tour-step="3">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <CardTitle className="text-lg sm:text-xl">
                        {t("provider.dashboard.activeSection.title")}
                      </CardTitle>
                      <Link
                        href="/provider/projects"
                        className="w-full sm:w-auto"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          {t("provider.dashboard.viewAll")}
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {activeProjectsLoading ? (
                        // Loading skeletons
                        Array.from({ length: 2 }).map((_, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                              <div>
                                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-32 animate-pulse mb-2" />
                                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse" />
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-2" />
                              <div className="h-2 bg-gray-200 rounded w-24 animate-pulse" />
                            </div>
                          </div>
                        ))
                      ) : activeProjects.length > 0 ? (
                        activeProjects.map((project) => (
                          <Link
                            key={project.id}
                            href={`/provider/projects/${project.id}`}
                            className="block"
                          >
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg active:bg-gray-50 sm:hover:bg-gray-50 transition-colors cursor-pointer">
                              <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                  <AvatarImage
                                    src={getProfileImageUrl(
                                      project.customer?.customerProfile
                                        ?.profileImageUrl,
                                    )}
                                  />
                                  <AvatarFallback>
                                    {project.customer?.name?.charAt(0) ||
                                      t("provider.dashboard.avatarFallbackClient")}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 break-words">
                                    {project.title}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (project.customer?.id) {
                                        router.push(
                                          `/provider/companies/${project.customer.id}`,
                                        );
                                      }
                                    }}
                                    className="text-xs sm:text-sm text-blue-600 active:text-blue-800 sm:hover:text-blue-800 sm:hover:underline"
                                  >
                                    {project.customer?.name ||
                                      t("provider.dashboard.unknownClient")}
                                  </button>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <Badge className="bg-blue-100 text-blue-800 text-xs">
                                      {t("customer.dashboard.status.inProgress")}
                                    </Badge>
                                    <span className="text-xs text-gray-500">
                                      {t("provider.dashboard.timelinePrefix")}{" "}
                                      {project.timeline ||
                                        t(
                                          "customer.dashboard.timelineNotSpecified",
                                        )}
                                    </span>
                                  </div>
                                  {project.nextMilestone && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      {t("provider.dashboard.nextMilestone", {
                                        title:
                                          project.nextMilestone.title || "",
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-left sm:text-right w-full sm:w-auto flex sm:block items-center sm:items-end justify-between sm:justify-end gap-3">
                                <div>
                                  <p className="font-semibold text-sm sm:text-base text-gray-900">
                                    {project.approvedPrice
                                      ? formatProjectAmountInPreferredCurrency(
                                          project.approvedPrice,
                                          project,
                                        )
                                      : `${formatProjectAmountInPreferredCurrency(
                                          project.budgetMin,
                                          project,
                                        )} - ${formatProjectAmountInPreferredCurrency(
                                          project.budgetMax,
                                          project,
                                        )}`}
                                  </p>
                                </div>
                                <div className="w-20 sm:w-24">
                                  <Progress
                                    value={project.progress || 0}
                                    className="h-2"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    {t("provider.dashboard.progressPercent", {
                                      n: project.progress || 0,
                                    })}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          {t("provider.dashboard.noActiveProjects")}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommended Opportunities - top 5 on dashboard; full list on Find Opportunities */}
                <Card data-tour-step="4">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                      <div className="flex-1">
                        <CardTitle className="text-lg sm:text-xl">
                          {t("provider.dashboard.reco.title")}
                        </CardTitle>
                        <CardDescription className="text-xs sm:text-sm mt-1">
                          {t("provider.dashboard.reco.desc")}
                        </CardDescription>
                      </div>
                      <Link
                        href="/provider/opportunities?tab=recommended"
                        className="w-full sm:w-auto"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto"
                        >
                          {t("provider.dashboard.viewAll")}
                        </Button>
                      </Link>
                    </div>
                    {recommendationsCacheInfo.cachedAt &&
                      recommendationsCacheInfo.nextRefreshAt && (
                        <div className="text-xs text-gray-500 mt-2 sm:mt-3">
                          {formatRecommendationsCacheLine(
                            recommendationsCacheInfo.cachedAt,
                            recommendationsCacheInfo.nextRefreshAt,
                          )}
                        </div>
                      )}
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {loadingOpportunities ? (
                        <div className="text-center py-6 text-gray-500 text-sm sm:text-base">
                          {t("provider.dashboard.reco.loading")}
                        </div>
                      ) : errorOpportunities ? (
                        <FriendlyErrorState
                          variant="inline"
                          message={errorOpportunities}
                          onRetry={retryRecommendations}
                        />
                      ) : recommendedOpportunities.length === 0 ? (
                        <div className="text-center py-6 text-gray-500 text-sm sm:text-base">
                          {t("provider.dashboard.reco.empty")}
                        </div>
                      ) : (
                        recommendedOpportunities
                          .slice(0, 5)
                          .map((opportunity) => {
                            const isExpanded =
                              expandedOpportunityId === opportunity.id;
                            return (
                              <div
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

                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3 pr-0 sm:pr-20">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 flex-wrap">
                                      <h4 className="font-semibold text-gray-900 sm:group-hover:text-blue-700 transition-colors text-base sm:text-lg break-words">
                                        {opportunity.title}
                                      </h4>
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
                                    </div>
                                    <p className="text-xs sm:text-sm font-medium text-gray-700 mt-1">
                                      {`${formatOpportunityAmountInPreferredCurrency(
                                        opportunity.budgetMin,
                                        opportunity,
                                      )} - ${formatOpportunityAmountInPreferredCurrency(
                                        opportunity.budgetMax,
                                        opportunity,
                                      )}`}
                                    </p>
                                    {opportunity.customer?.name && (
                                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                                        <p className="text-xs text-gray-600">
                                          {opportunity.customer.name}
                                        </p>
                                        {opportunity.customer.isVerified && (
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
                                        className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium touch-manipulation"
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
                                            className="ml-auto lg:hidden text-blue-600 hover:text-blue-800 p-1"
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
                                            .filter((line: string) =>
                                              line.trim(),
                                            )
                                            .map(
                                              (line: string, index: number) => {
                                                // Remove bullet point markers if present and format as list item
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

                                <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4">
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
                                            (opportunity.skills || []).length -
                                            6,
                                        },
                                      )}
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-gray-200 sm:group-hover:border-blue-200 transition-colors">
                                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-gray-600 w-full sm:w-auto">
                                    <span className="capitalize font-medium">
                                      {opportunity.category || ""}
                                    </span>
                                    {opportunity.timeline && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 shrink-0" />
                                        <span className="break-words">
                                          {opportunity.timeline}
                                        </span>
                                      </span>
                                    )}
                                    {opportunity.proposalCount !==
                                      undefined && (
                                      <span className="whitespace-nowrap">
                                        {opportunity.proposalCount === 1
                                          ? t(
                                              "provider.dashboard.opportunity.proposalOne",
                                            )
                                          : t(
                                              "provider.dashboard.opportunity.proposalsN",
                                              {
                                                n: opportunity.proposalCount,
                                              },
                                            )}
                                      </span>
                                    )}
                                  </div>
                                  <Link
                                    href={`/provider/opportunities/${opportunity.id}`}
                                    className="w-full sm:w-auto"
                                  >
                                    <Button
                                      size="sm"
                                      className="w-full sm:w-auto sm:group-hover:bg-blue-600 sm:group-hover:text-white transition-all duration-300 shadow-sm sm:group-hover:shadow-md"
                                    >
                                      <span>
                                        {t(
                                          "provider.dashboard.opportunity.viewDetails",
                                        )}
                                      </span>
                                      <ChevronRight className="w-4 h-4 ml-1.5 sm:group-hover:translate-x-1 transition-transform" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-6">
                {/* Quick Stats */}
                <Card data-tour-step="5">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">
                      {t("provider.dashboard.performance.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {t("provider.dashboard.performance.totalProjects")}
                      </span>
                      <span className="font-semibold">
                        {performanceLoading ? (
                          <span className="inline-block animate-pulse bg-gray-200 h-4 w-8 rounded" />
                        ) : (
                          performance.totalProjects
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {t("provider.dashboard.performance.completionRate")}
                      </span>
                      <span className="font-semibold">
                        {performanceLoading ? (
                          <span className="inline-block animate-pulse bg-gray-200 h-4 w-12 rounded" />
                        ) : (
                          `${performance.completionRate}%`
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {t("provider.dashboard.performance.repeatClients")}
                      </span>
                      <span className="font-semibold">
                        {performanceLoading ? (
                          <span className="inline-block animate-pulse bg-gray-200 h-4 w-12 rounded" />
                        ) : (
                          `${performance.repeatClients}%`
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {t("provider.dashboard.performance.onTimeDelivery")}
                      </span>
                      <span className="font-semibold">
                        {performanceLoading ? (
                          <span className="inline-block animate-pulse bg-gray-200 h-4 w-12 rounded" />
                        ) : (
                          `${performance.onTimeDelivery}%`
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Messages */}
                {/* <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Messages</CardTitle>
                  <Link href="/provider/messages">
                    <Button variant="ghost" size="sm">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentMessages.map((message) => (
                    <div
                      key={message.id}
                      className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={message.avatar || "/placeholder.svg"}
                        />
                        <AvatarFallback>
                          {message.client.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {message.client}
                          </p>
                          {message.unread && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {message.project}
                        </p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {message.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card> */}

                {/* Quick Actions */}
                {/* <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/provider/profile/edit">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Update Profile
                  </Button>
                </Link>
                <Link href="/provider/portfolio">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Manage Portfolio
                  </Button>
                </Link>
                <Link href="/provider/availability">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Set Availability
                  </Button>
                </Link>
                <Link href="/provider/earnings">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <DollarSign className="w-4 h-4 mr-2" />
                    View Earnings
                  </Button>
                </Link>
              </CardContent>
            </Card> */}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
