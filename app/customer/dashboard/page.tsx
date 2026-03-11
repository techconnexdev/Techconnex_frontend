"use client";

import { useEffect, useState } from "react";
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
import { CustomerLayout } from "@/components/customer-layout";
import {
  API_BASE_URL,
  getCompanyProjects,
  getCompanyProjectStats,
  getProfileImageUrl,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useRecommendedProviders } from "@/hooks/useRecommendedProviders";
import { RecommendedProvidersList } from "@/components/customer/RecommendedProvidersList";
import { CustomerDashboardTour } from "@/components/customer/CustomerDashboardTour";
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

// Define Project type outside the component so it can be used in useState
export type Project = {
  id: string;
  title: string;
  provider?: string;
  providerName?: string;
  status: string;
  progress?: number;
  budget?: number;
  deadline?: string;
  avatar?: string;
  createdAt?: string;
  [key: string]: unknown; // for any extra fields
};

/** Right-panel content: recommended providers for a hovered project + View more link. */
function RecommendationsPanel({ project }: { project: Project }) {
  const { providers, loading, error } = useRecommendedProviders(project.id);
  const router = useRouter();
  const handleContact = (provider: RecommendedProvider) => {
    router.push(
      `/customer/messages?userId=${provider.id}&name=${encodeURIComponent(provider.name)}&avatar=${encodeURIComponent(provider.avatar)}`,
    );
  };
  return (
    <div className="flex flex-col">
      <p
        className="text-sm font-semibold text-gray-900 mb-2 truncate"
        title={project.title}
      >
        Recommended for: {project.title}
      </p>
      <div className="min-h-0">
        <RecommendedProvidersList
          providers={providers}
          loading={loading}
          error={error}
          compact
          onContact={handleContact}
          emptyMessage="No recommendations for this project."
        />
      </div>
      <Link
        href={`/customer/projects/${project.id}`}
        className="mt-4 flex items-center justify-center gap-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:border-gray-300 transition-colors flex-shrink-0"
      >
        View more
        <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}

export default function CustomerDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [newProjectChecking, setNewProjectChecking] = useState(false);
  const [stats, setStats] = useState<{
    activeProjects: number;
    completedProjects: number;
    totalSpent: number;
    rating: number | null;
    reviewCount: number;
  }>({
    activeProjects: 0,
    completedProjects: 0,
    totalSpent: 0,
    rating: null,
    reviewCount: 0,
  });
  // Use Project[] as the type for recentProjects
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Project currently hovered (for showing recommended providers in right panel). */
  const [hoveredProject, setHoveredProject] = useState<Project | null>(null);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setProjectsLoading(true);

      // Fetch project stats (inspired by provider dashboard)
      const statsResponse = await getCompanyProjectStats();
      if (statsResponse.success && statsResponse.stats) {
        setStats({
          activeProjects: statsResponse.stats.activeProjects || 0,
          completedProjects: statsResponse.stats.completedProjects || 0,
          totalSpent: statsResponse.stats.totalSpent || 0,
          rating: statsResponse.stats.averageRating ?? null,
          reviewCount: statsResponse.stats.reviewCount || 0,
        });
      } else {
        setStats({
          activeProjects: 0,
          completedProjects: 0,
          totalSpent: 0,
          rating: null,
          reviewCount: 0,
        });
      }

      const projectsResponse = await getCompanyProjects({
        page: 1,
        limit: 3,
      });
      if (projectsResponse.success && projectsResponse.items) {
        const mappedProjects = projectsResponse.items.map(
          (project: Record<string, unknown>) => {
            const provider = project.provider as
              | Record<string, unknown>
              | undefined;
            return {
              id: project.id,
              title: project.title,
              provider: provider?.name as string | undefined,
              providerName: provider?.name as string | undefined,
              status: (project.status as string)?.toLowerCase() || "pending",
              progress: project.progress || 0,
              budget: project.budgetMax,
              deadline: project.timeline,
              avatar: getProfileImageUrl(
                (
                  provider?.providerProfile as
                    | Record<string, unknown>
                    | undefined
                )?.profileImageUrl as string | undefined,
              ),
              createdAt: project.createdAt,
              category: project.category,
              description: project.description,
              type: project.type,
            };
          },
        );
        setRecentProjects(mappedProjects);
      } else {
        setRecentProjects([]);
      }
    } catch (error) {
      const message = getUserFriendlyErrorMessage(
        error,
        "customer dashboard",
      );
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProjectsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [toast]);

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
    // Handle ServiceRequest statuses
    if (type === "ServiceRequest") {
      switch (status) {
        case "OPEN":
          return "Open";
        case "CLOSED":
          return "Closed";
        default:
          return status;
      }
    }

    // Handle Project statuses
    switch (status) {
      case "COMPLETED":
        return "Completed";
      case "IN_PROGRESS":
        return "In Progress";
      case "DISPUTED":
        return "Disputed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <CustomerLayout>
      <CustomerDashboardTour />
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
          data-tour-step="0"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Welcome back! Here&apos;s what&apos;s happening with your
              projects.
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
                  { headers: { Authorization: `Bearer ${token}` } }
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
            {newProjectChecking ? "Checking…" : "New Project"}
          </Button>
        </div>

        {/* Stats Cards */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6"
          data-tour-step="2"
        >
          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Active Projects
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
                    Completed
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
                    Total Spent
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-1 break-words">
                    RM{stats.totalSpent?.toLocaleString?.() ?? 0}
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
                    Avg Rating
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
                      {stats.reviewCount === 1 ? "review" : "reviews"})
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Recent Projects */}
          <div className="lg:col-span-2" data-tour-step="3">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <CardTitle className="text-lg sm:text-xl">
                    Recent Projects
                  </CardTitle>
                  <Link href="/customer/projects" className="w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {projectsLoading ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
                      Loading projects...
                    </div>
                  ) : error ? (
                    <FriendlyErrorState
                      message={error}
                      onRetry={fetchDashboardData}
                      variant="block"
                    />
                  ) : recentProjects.length === 0 ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
                      No recent projects found.
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
                                  Timeline:{" "}
                                  {project.deadline || "Not specified"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-left sm:text-right w-full sm:w-auto flex sm:flex-col items-start sm:items-end justify-between sm:justify-start gap-2 sm:gap-0">
                            <p className="font-semibold text-gray-900 text-sm sm:text-base">
                              {project.budget
                                ? formatCurrency(project.budget)
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
          <div className="hidden lg:block lg:self-start" data-tour-step="4">
            <Card className="min-h-[200px] w-full">
              <CardHeader className="p-4 sm:p-5">
                <CardTitle className="text-base">
                  Recommended providers
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 pt-0">
                {hoveredProject ? (
                  <RecommendationsPanel project={hoveredProject} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 px-4 text-center text-gray-500 text-sm min-h-[120px]">
                    <Briefcase className="w-10 h-10 text-gray-300 mb-3" />
                    <p>
                      Hover over a project in the list to see recommended
                      providers here.
                    </p>
                    {recentProjects.some(
                      (p) => p.type === "ServiceRequest",
                    ) ? null : (
                      <p className="mt-2 text-xs">
                        Only service requests show recommendations.
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
            <DialogTitle>Complete your profile</DialogTitle>
            <DialogDescription>
              Complete your profile to at least {POST_PROJECT_REQUIRED}% to
              create projects.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setGateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setGateModalOpen(false);
                router.push("/customer/onboarding");
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              👉 Complete Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
