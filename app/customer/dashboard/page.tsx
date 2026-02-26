"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Plus,
  CheckCircle,
  DollarSign,
  Briefcase,
  TrendingUp,
  Star,
} from "lucide-react";
import Link from "next/link";
import { CustomerLayout } from "@/components/customer-layout";
import {
  getCompanyProjects,
  getCompanyProjectStats,
  getProfileImageUrl,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useRecommendedProviders } from "@/hooks/useRecommendedProviders";
import { RecommendedProvidersList } from "@/components/customer/RecommendedProvidersList";
import type { RecommendedProvider } from "@/hooks/useRecommendedProviders";

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

/** Fetches and shows recommended providers for a single opportunity (used in hover card). */
function RecommendationsForProjectPopover({ serviceRequestId }: { serviceRequestId: string }) {
  const { providers, loading, error } = useRecommendedProviders(serviceRequestId);
  const router = useRouter();
  const handleContact = (provider: RecommendedProvider) => {
    router.push(
      `/customer/messages?userId=${provider.id}&name=${encodeURIComponent(provider.name)}&avatar=${encodeURIComponent(provider.avatar)}`
    );
  };
  return (
    <div className="w-full">
      <p className="text-xs font-semibold text-gray-700 mb-2">Recommended for this project</p>
      <RecommendedProvidersList
        providers={providers}
        loading={loading}
        error={error}
        compact
        onContact={handleContact}
        emptyMessage="No recommendations for this project."
      />
    </div>
  );
}

export default function CustomerDashboard() {
  const { toast } = useToast();
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);

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
          // Set default stats if API call fails or returns no data
          setStats({
            activeProjects: 0,
            completedProjects: 0,
            totalSpent: 0,
            rating: null,
            reviewCount: 0,
          });
        }

        // Fetch recent projects
        const projectsResponse = await getCompanyProjects({
          page: 1,
          limit: 3,
        });
        if (projectsResponse.success && projectsResponse.items) {
          // Map projects to expected structure
          const mappedProjects = projectsResponse.items.map((project: Record<string, unknown>) => {
            const provider = project.provider as Record<string, unknown> | undefined;
            return {
              id: project.id,
              title: project.title,
              provider: provider?.name as string | undefined,
              providerName: provider?.name as string | undefined,
              status: (project.status as string)?.toLowerCase() || "pending",
              progress: project.progress || 0,
              budget: project.budgetMax,
              deadline: project.timeline,
              avatar: getProfileImageUrl((provider?.providerProfile as Record<string, unknown> | undefined)?.profileImageUrl as string | undefined),
              createdAt: project.createdAt,
              category: project.category,
              description: project.description,
              type: project.type, // ServiceRequest or Project
            };
          });
          setRecentProjects(mappedProjects);
        } else {
          // Set empty projects if API call fails or returns no data
          setRecentProjects([]);
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data"
        );
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setProjectsLoading(false);
      }
    };

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
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Welcome back! Here&apos;s what&apos;s happening with your projects.
            </p>
          </div>
          <Link href="/customer/projects/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
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
          <div className="lg:col-span-2">
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
                    <div className="text-center text-red-500 py-6 sm:py-8 text-sm sm:text-base">
                      {error}
                    </div>
                  ) : recentProjects.length === 0 ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
                      No recent projects found.
                    </div>
                  ) : (
                    recentProjects.map((project) => {
                      const row = (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer gap-3 sm:gap-4">
                          <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarImage
                                src={project.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {(project.provider as string | undefined)?.charAt(0) ||
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
                                    project.type as string | undefined
                                  )} text-xs`}
                                >
                                  {getStatusText(project.status, project.type as string | undefined)}
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
                          {project.type === "ServiceRequest" ? (
                            <HoverCard openDelay={400} closeDelay={100}>
                              <HoverCardTrigger asChild>
                                {row}
                              </HoverCardTrigger>
                              <HoverCardContent
                                className="w-[min(24rem,90vw)] max-h-[70vh] overflow-y-auto p-3"
                                side="right"
                                align="start"
                              >
                                <RecommendationsForProjectPopover serviceRequestId={project.id} />
                              </HoverCardContent>
                            </HoverCard>
                          ) : (
                            row
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
