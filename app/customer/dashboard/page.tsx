"use client";

import { useEffect, useState } from "react";
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
import {
  Plus,
  CheckCircle,
  DollarSign,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Star,
  MapPin,
  Sparkles,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { CustomerLayout } from "@/components/customer-layout";
import {
  getCompanyProjects,
  getCompanyProjectStats,
  getRecommendedProviders,
  getProfileImageUrl,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

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

export default function CustomerDashboard() {
  const { toast } = useToast();
  const router = useRouter();
  const handleContact = (provider: Record<string, unknown>) => {
    router.push(
      `/customer/messages?userId=${provider.id}&name=${encodeURIComponent(
        (provider.name as string) || ""
      )}&avatar=${encodeURIComponent((provider.avatar as string) || "")}`
    );
  };
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
  const [recommendedProviders, setRecommendedProviders] = useState<Array<Record<string, unknown>>>([]);
  const [recommendedLoading, setRecommendedLoading] = useState(true);
  const [recommendationsCacheInfo, setRecommendationsCacheInfo] = useState<{
    cachedAt: number | null;
    nextRefreshAt: number | null;
  }>({ cachedAt: null, nextRefreshAt: null });
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
            rating: statsResponse.stats.averageRating || null,
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

        // Fetch recommended providers based on ServiceRequests
        // Note: Dashboard uses AI-generated recommendation insights (not AI drafts)
        try {
          const recommendationsResponse = await getRecommendedProviders();
          if (recommendationsResponse.success) {
            const mappedProviders = (
              recommendationsResponse.recommendations || []
            ).map((provider: Record<string, unknown>) => ({
              id: provider.id,
              name: provider.name,
              specialty: provider.major || "ICT Professional",
              rating: provider.rating || 0,
              reviewCount: provider.reviewCount || 0,
              completedJobs: provider.completedJobs || 0,
              hourlyRate: provider.hourlyRate || 0,
              location: provider.location || "Malaysia",
              avatar:
                provider.avatar && provider.avatar !== "/placeholder.svg"
                  ? `${
                      process.env.NEXT_PUBLIC_API_BASE_URL ||
                      "http://localhost:4000"
                    }${(provider.avatar as string)?.startsWith("/") ? "" : "/"}${
                      provider.avatar as string
                    }`
                  : "/placeholder.svg?height=60&width=60",
              skills: provider.skills || [],
              verified: provider.isVerified || false,
              matchScore: provider.matchScore,
              recommendedFor: provider.recommendedForServiceRequest,
              // Use AI-generated recommendation insights from the API (not AI drafts)
              aiExplanation: provider.aiExplanation || null,
              yearsExperience: provider.yearsExperience,
              successRate: provider.successRate,
              responseTime: provider.responseTime,
            }));
            setRecommendedProviders(mappedProviders);
            setRecommendationsCacheInfo({
              cachedAt: recommendationsResponse.cachedAt,
              nextRefreshAt: recommendationsResponse.nextRefreshAt,
            });
          } else {
            setRecommendedProviders([]);
          }
        } catch (providerError) {
          console.warn("Failed to fetch recommended providers:", providerError);
          setRecommendedProviders([]);
        }
        setRecommendedLoading(false);
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
                      {stats.rating !== null ? stats.rating.toFixed(1) : "-"}
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
                    recentProjects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/customer/projects/${project.id}`}
                      >
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
                      </Link>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommended Providers */}
          <div>
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Recommended Providers
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  AI-matched providers based on your open projects
                </CardDescription>
                {recommendationsCacheInfo.cachedAt &&
                  recommendationsCacheInfo.nextRefreshAt && (
                    <div className="text-xs text-gray-500 mt-2">
                      {(() => {
                        const now = Date.now();
                        const cachedAt = recommendationsCacheInfo.cachedAt;
                        const nextRefreshAt =
                          recommendationsCacheInfo.nextRefreshAt;
                        const ageMs = now - cachedAt;
                        const remainingMs = nextRefreshAt - now;

                        const ageMinutes = Math.floor(ageMs / 60000);
                        const remainingMinutes = Math.floor(
                          remainingMs / 60000
                        );
                        const remainingHours = Math.floor(
                          remainingMinutes / 60
                        );
                        const remainingMins = remainingMinutes % 60;

                        return (
                          <>
                            <span>
                              Updated: {ageMinutes} minute
                              {ageMinutes !== 1 ? "s" : ""} ago
                            </span>
                            {remainingMs > 0 && (
                              <>
                                {" • "}
                                <span>
                                  Next refresh: in{" "}
                                  {remainingHours > 0
                                    ? `${remainingHours} hour${
                                        remainingHours !== 1 ? "s" : ""
                                      } `
                                    : ""}
                                  {remainingMins} minute
                                  {remainingMins !== 1 ? "s" : ""}
                                </span>
                              </>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {recommendedLoading ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
                      Loading providers...
                    </div>
                  ) : recommendedProviders.length === 0 ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
                      No recommended providers found. Create a project request
                      to get recommendations!
                    </div>
                  ) : (
                    recommendedProviders.map((provider) => (
                      <div
                        key={String(provider.id || Math.random())}
                        className="group relative p-4 sm:p-5 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 bg-white"
                      >
                        {/* AI Badge Indicator */}
                        {Boolean(provider.aiExplanation) && (
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-medium shadow-md">
                              <Sparkles className="w-3 h-3" />
                              <span>AI Insights</span>
                            </div>
                          </div>
                        )}

                        <div className="flex items-start space-x-2 sm:space-x-3 pr-20">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                            <AvatarImage
                              src={(typeof provider.avatar === "string" ? provider.avatar : "/placeholder.svg")}
                            />
                            <AvatarFallback>
                              {(provider.name as string)?.charAt(0) || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base">
                                {provider.name as string}
                              </h4>
                              {typeof provider.matchScore === "number" && provider.matchScore !== undefined && (
                                <Badge
                                  className={`text-xs font-semibold ${
                                    provider.matchScore >= 80
                                      ? "bg-green-100 text-green-700 border-green-300"
                                      : provider.matchScore >= 60
                                      ? "bg-blue-100 text-blue-700 border-blue-300"
                                      : "bg-yellow-100 text-yellow-700 border-yellow-300"
                                  }`}
                                >
                                  {provider.matchScore}% match
                                </Badge>
                              )}
                              {!provider.verified && (
                                <Badge className="text-xs bg-red-100 text-red-700 border-red-300">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Not Verified
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 truncate">
                              {provider.specialty as string}
                            </p>
                            {Boolean(provider.recommendedFor) && (
                              <p className="text-xs text-blue-600 mt-1 font-medium">
                                Recommended for: {(provider.recommendedFor as { title?: string })?.title}
                              </p>
                            )}
                            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-medium">
                                {typeof provider.rating === "number" ? provider.rating.toFixed(1) : "0.0"}
                              </span>
                              {typeof provider.reviewCount === "number" && provider.reviewCount > 0 && (
                                <span className="text-xs sm:text-sm text-gray-500">
                                  ({provider.reviewCount}{" "}
                                  {provider.reviewCount === 1
                                    ? "review"
                                    : "reviews"}
                                  )
                                </span>
                              )}
                              <span className="text-xs sm:text-sm text-gray-500">
                                • {typeof provider.completedJobs === "number" ? provider.completedJobs : 0} jobs
                              </span>
                              {typeof provider.yearsExperience === "number" && provider.yearsExperience > 0 && (
                                <span className="text-xs text-gray-500">
                                  • {provider.yearsExperience} years exp.
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                              <span className="text-xs text-gray-500 truncate">
                                {provider.location as string}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                              {Array.isArray(provider.skills) && (provider.skills as string[])
                                .slice(0, 2)
                                .map((skill: string) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="text-xs group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors border"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              {Array.isArray(provider.skills) && provider.skills.length > 2 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{provider.skills.length - 2}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm font-medium text-blue-600 mt-1.5 sm:mt-2">
                              RM{typeof provider.hourlyRate === "number" ? provider.hourlyRate : 0}/hour
                            </p>
                          </div>
                        </div>

                        {/* AI Explanation - Expandable on Hover */}
                        {Boolean(provider.aiExplanation) && typeof provider.aiExplanation === "string" && (
                          <div className="mt-4 overflow-hidden">
                            {/* Collapsed State - Always Visible */}
                            <div className="group-hover:hidden transition-all duration-300">
                              <button className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 font-medium">
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Hover to see AI insights</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Expanded State - Shows on Hover */}
                            <div className="hidden group-hover:block animate-in fade-in slide-in-from-top-2 duration-300">
                              <div className="p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-200 shadow-md">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                  </div>
                                  <p className="text-sm font-semibold text-blue-900">
                                    Why this provider is recommended:
                                  </p>
                                </div>
                                <div className="text-sm text-blue-800 space-y-2">
                                  {(provider.aiExplanation as string)
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
                                          className={`flex items-start gap-3 ${
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
                                            className={`leading-relaxed ${
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

                        <div className="flex gap-2 mt-3 sm:mt-4 pt-3 border-t border-gray-200 group-hover:border-blue-200 transition-colors">
                          <Link
                            href={`/customer/providers/${provider.id}`}
                            className="flex-1"
                          >
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs sm:text-sm group-hover:border-blue-600 group-hover:text-blue-600 transition-colors"
                            >
                              View Profile
                              <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="flex-1 text-xs sm:text-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300"
                            onClick={(e) => {
                              e.preventDefault();
                              handleContact(provider);
                            }}
                          >
                            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link href="/customer/providers" className="block mt-3 sm:mt-4">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent text-xs sm:text-sm"
                  >
                    Browse All Providers
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
