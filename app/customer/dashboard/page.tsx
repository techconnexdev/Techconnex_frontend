"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  CheckCircle,
  DollarSign,
  Briefcase,
  TrendingUp,
  Star,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { API_BASE_URL, getProfileImageUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useRecommendedProviders } from "@/hooks/useRecommendedProviders";
import { RecommendedProvidersList } from "@/components/customer/RecommendedProvidersList";
import { CustomerDashboardHomeTour } from "@/components/customer/CustomerDashboardTour";
import type { RecommendedProvider } from "@/hooks/useRecommendedProviders";
import { POST_PROJECT_REQUIRED } from "@/contexts/CustomerCompletionContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { FriendlyErrorState } from "@/components/FriendlyErrorState";
import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import { queryKeys } from "@/lib/query-keys";
import {
  fetchCustomerDashboardData,
  type CustomerDashboardProject as Project,
} from "@/lib/queries/customer-dashboard";
import {
  CustomerStatsCardsSkeleton,
  CustomerDashboardRecentProjectsSkeleton,
} from "@/components/customer/CustomerPageSkeletons";

export type { Project };

/** Right-panel content: recommended providers for a hovered project + View more link. */
function RecommendationsPanel({ project }: { project: Project }) {
  const { t } = useI18n();
  const { providers, loading, error } = useRecommendedProviders(project.id);
  const maxVisibleProviders = 2;
  const remainingProviders = Math.max(providers.length - maxVisibleProviders, 0);
  const router = useRouter();
  const handleContact = (provider: RecommendedProvider) => {
    router.push(
      `/customer/messages?userId=${provider.id}&name=${encodeURIComponent(provider.name)}&avatar=${encodeURIComponent(provider.avatar)}`,
    );
  };
  return (
    <div className="flex h-full flex-col">
      <p
        className="text-sm font-semibold text-gray-900 mb-2 truncate"
        title={project.title}
      >
        {t("customer.dashboard.recommendedFor", { title: project.title })}
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <p className="mb-2 text-xs text-gray-500">
          {t("customer.dashboard.topMatchesHint", {
            n: maxVisibleProviders,
          })}
        </p>
        <RecommendedProvidersList
          providers={providers.slice(0, maxVisibleProviders)}
          loading={loading}
          error={error}
          compact
          onContact={handleContact}
          emptyMessage={t("customer.dashboard.noRecommendations")}
        />
      </div>
      <div className="mt-4 flex-shrink-0 border-t border-gray-100 pt-3">
        {!loading && !error && remainingProviders > 0 ? (
          <Link
            href={`/customer/projects/${project.id}?focus=recommended-providers&from=dashboard`}
            className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors"
          >
            <span>
              {t("customer.dashboard.moreProviders", {
                n: remainingProviders,
              })}
            </span>
            <span className="inline-flex items-center gap-1">
              {t("customer.dashboard.viewMore")}
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        ) : (
          <Link
            href={`/customer/projects/${project.id}?focus=recommended-providers&from=dashboard`}
            className="flex items-center justify-center gap-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors"
          >
            {t("customer.dashboard.viewMore")}
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function CustomerDashboard() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [newProjectChecking, setNewProjectChecking] = useState(false);
  const {
    data: dash,
    isPending: projectsLoading,
    error: dashboardQueryError,
    refetch: refetchDashboard,
  } = useQuery({
    queryKey: queryKeys.customer.dashboard,
    queryFn: fetchCustomerDashboardData,
  });

  const stats = dash?.stats ?? {
    activeProjects: 0,
    completedProjects: 0,
    totalSpent: 0,
    rating: null,
    reviewCount: 0,
  };
  const preferredCurrency = dash?.preferredCurrency ?? "MYR";
  const recentProjects = dash?.recentProjects ?? [];
  const error = dashboardQueryError
    ? getUserFriendlyErrorMessage(dashboardQueryError, "customer dashboard")
    : null;

  /** Project currently hovered (for showing recommended providers in right panel). */
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);

  const lastToastError = useRef<string | null>(null);
  useEffect(() => {
    if (!dashboardQueryError) {
      lastToastError.current = null;
      return;
    }
    const message = getUserFriendlyErrorMessage(
      dashboardQueryError,
      "customer dashboard",
    );
    if (lastToastError.current === message) return;
    lastToastError.current = message;
    toast({
      title: t("customer.dashboard.errorToastTitle"),
      description: message,
      variant: "destructive",
    });
  }, [dashboardQueryError, t, toast]);

  const getStatusColor = (status: string, type?: string) => {
    // Handle ServiceRequest statuses
    if (type === "ServiceRequest") {
      switch (status) {
        case "OPEN":
          return "bg-blue-100 text-blue-800";
        case "CLOSED":
          return "bg-gray-100 text-gray-800";
        default:
          return "bg-gray-100 text-gray-800";
      }
    }

    // Handle Project statuses
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "DISPUTED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string, type?: string) => {
    if (type === "ServiceRequest") {
      if (status === "OPEN") return t("customer.dashboard.status.open");
      if (status === "CLOSED") return t("customer.dashboard.status.closed");
      return status;
    }
    const projectMap: Record<string, MessageKey> = {
      COMPLETED: "customer.dashboard.status.completed",
      IN_PROGRESS: "customer.dashboard.status.inProgress",
      DISPUTED: "customer.dashboard.status.disputed",
      CANCELLED: "customer.dashboard.status.cancelled",
    };
    const key = projectMap[status];
    return key ? t(key) : status;
  };

  const formatCurrency = (amount: number, currencyCode = "MYR") => {
    const intlLocale =
      locale === "ar" ? "ar" : locale === "id" ? "id-ID" : "en-MY";
    try {
      return new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: String(currencyCode || "MYR").toUpperCase(),
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);
    } catch {
      return `${String(currencyCode || "MYR").toUpperCase()} ${Number(
        amount || 0,
      ).toLocaleString()}`;
    }
  };

  return (
    <>
      <CustomerDashboardHomeTour />
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
          data-tour-step="0"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("customer.dashboard.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t("customer.dashboard.heroSubtitle")}
            </p>
          </div>
          <Button
            className="w-full sm:w-auto"
            data-tour-step="1"
            disabled={newProjectChecking}
            onClick={async () => {
              setNewProjectChecking(true);
              try {
                const token =
                  typeof window !== "undefined"
                    ? localStorage.getItem("token")
                    : null;
                if (!token) {
                  setGateModalOpen(true);
                  return;
                }
                const res = await fetch(
                  `${API_BASE_URL}/company/profile/completion`,
                  { headers: { Authorization: `Bearer ${token}` } },
                );
                const json = await res.json();
                const data = json.data ?? json;
                const completion =
                  typeof data?.completion === "number" ? data.completion : 0;
                if (completion >= POST_PROJECT_REQUIRED) {
                  router.push("/customer/projects/new");
                } else {
                  setGateModalOpen(true);
                }
              } catch (err) {
                getUserFriendlyErrorMessage(
                  err,
                  "customer dashboard profile completion",
                );
                setGateModalOpen(true);
              } finally {
                setNewProjectChecking(false);
              }
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            {newProjectChecking
              ? t("customer.dashboard.checking")
              : t("customer.dashboard.newProject")}
          </Button>
        </div>

        {/* Stats Cards */}
        {projectsLoading ? (
          <div data-tour-step="2">
            <CustomerStatsCardsSkeleton count={4} />
          </div>
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
            data-tour-step="2"
          >
            <Card>
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      {t("customer.dashboard.stats.activeProjects")}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                      {stats.activeProjects}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                    <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      {t("customer.dashboard.stats.completed")}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">
                      {stats.completedProjects}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                    <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      {t("customer.dashboard.stats.totalSpent")}
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                      {formatCurrency(stats.totalSpent ?? 0, preferredCurrency)}
                    </p>
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-5 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-gray-600">
                      {t("customer.dashboard.stats.avgRating")}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <p className="text-xl sm:text-2xl font-bold text-gray-900">
                        {stats.rating !== null && stats.rating !== undefined
                          ? stats.rating.toFixed(1)
                          : stats.reviewCount > 0
                            ? "0.0"
                            : "-"}
                      </p>
                      <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 fill-current flex-shrink-0" />
                    </div>
                    {stats.reviewCount > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ({stats.reviewCount}{" "}
                        {stats.reviewCount === 1
                          ? t("customer.dashboard.stats.review")
                          : t("customer.dashboard.stats.reviews")}
                        )
                      </p>
                    )}
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2" data-tour-step="3">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <CardTitle className="text-lg sm:text-xl">
                    {t("customer.dashboard.recentProjects")}
                  </CardTitle>
                  <Link href="/customer/projects" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      {t("customer.dashboard.viewAll")}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {projectsLoading ? (
                    <CustomerDashboardRecentProjectsSkeleton
                      loadingLabel={t("customer.dashboard.loadingProjects")}
                      rowCount={4}
                    />
                  ) : error ? (
                    <FriendlyErrorState
                      message={error}
                      onRetry={() => {
                        void refetchDashboard();
                      }}
                      variant="block"
                    />
                  ) : recentProjects.length === 0 ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
                      {t("customer.dashboard.noProjects")}
                    </div>
                  ) : (
                    recentProjects.map((project) => {
                      const row = (
                        <div
                          className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg transition-colors cursor-pointer gap-3 sm:gap-4 ${
                            project.type === "ServiceRequest"
                              ? "hover:bg-blue-50 hover:border-blue-200"
                              : "hover:bg-gray-50"
                          } ${hoveredProject?.id === project.id ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200" : ""}`}
                          onMouseEnter={() =>
                            project.type === "ServiceRequest" &&
                            setHoveredProject(project)
                          }
                        >
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarImage
                                src={project.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {(
                                  project.provider as string | undefined
                                )?.charAt(0) ||
                                  project.title?.charAt(0) ||
                                  "P"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {project.title}
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {project.provider ||
                                  project.providerName ||
                                  "-"}
                              </p>
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-1">
                                <Badge
                                  className={`${getStatusColor(
                                    project.status,
                                    project.type as string | undefined,
                                  )} text-xs`}
                                >
                                  {getStatusText(
                                    project.status,
                                    project.type as string | undefined,
                                  )}
                                </Badge>
                                {project.type ? (
                                  <Badge variant="outline" className="text-xs">
                                    {String(project.type)}
                                  </Badge>
                                ) : null}
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                  {t("customer.dashboard.timeline")}:{" "}
                                  {project.deadline ||
                                    t("customer.dashboard.timelineNotSpecified")}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:gap-0">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">
                              {project.budget
                                ? formatCurrency(
                                    project.budget,
                                    project.currencyCode || "MYR",
                                  )
                                : "-"}
                            </p>
                            {project.status === "IN_PROGRESS" && (
                              <div className="mt-1 sm:mt-2 w-full sm:w-24">
                                <Progress
                                  value={project.progress || 0}
                                  className="h-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {project.progress || 0}%
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                      return (
                        <Link
                          key={project.id}
                          href={`/customer/projects/${project.id}`}
                        >
                          {row}
                        </Link>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right panel: recommended providers for hovered project */}
          <div
            className="hidden lg:block lg:self-start lg:sticky lg:top-10"
            data-tour-step="4"
          >
            <Card className="w-full h-[calc(100vh-2rem)] max-h-[860px] min-h-[420px]">
              <CardHeader className="p-4 sm:p-5">
                <CardTitle className="text-base">
                  {t("customer.dashboard.recommendedProvidersTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0 h-[calc(100%-4.5rem)] overflow-hidden">
                {hoveredProject ? (
                  <RecommendationsPanel project={hoveredProject} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-gray-500 text-sm min-h-[120px]">
                    <Briefcase className="w-10 h-10 text-gray-300 mb-3" />
                    <p>{t("customer.dashboard.hoverHint")}</p>
                    {recentProjects.some(
                      (p) => p.type === "ServiceRequest",
                    ) ? null : (
                      <p className="mt-2 text-xs">
                        {t("customer.dashboard.onlyServiceRequests")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Profile completion gate: must be 60%+ to create projects */}
      <Dialog open={gateModalOpen} onOpenChange={setGateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("customer.dashboard.gate.title")}</DialogTitle>
            <DialogDescription>
              {t("customer.dashboard.gate.description", {
                percent: String(POST_PROJECT_REQUIRED),
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setGateModalOpen(false)}>
              {t("customer.dashboard.gate.cancel")}
            </Button>
            <Button
              onClick={() => {
                setGateModalOpen(false);
                router.push("/customer/onboarding");
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t("customer.dashboard.gate.completeNow")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
