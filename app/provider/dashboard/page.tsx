"use client";
import { useState, useEffect } from "react";
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
import { ProviderLayout } from "@/components/provider-layout";
import {
  getProviderProjectStats,
  getProviderProjects,
  getProviderRecommendedOpportunities,
  getProviderPerformanceMetrics,
  getProfileImageUrl,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type ProjectCustomer = {
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

type NextMilestone = {
  title?: string;
  description?: string;
};

type ProviderProject = {
  id: string;
  title: string;
  description?: string;
  status?: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  approvedPrice?: number;
  progress?: number;
  completedMilestones?: number;
  totalMilestones?: number;
  timeline?: string;
  createdAt?: string;
  customer?: ProjectCustomer;
  nextMilestone?: NextMilestone;
};

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

type RecommendedOpportunity = {
  id: string;
  title: string;
  description?: string;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  skills?: string[];
  category?: string;
  proposalCount?: number;
  matchScore?: number | null;
  aiExplanation?: string | null;
  customer?: OpportunityCustomer;
};

export default function ProviderDashboard() {
  const { toast } = useToast();

  // Stats state
  const [stats, setStats] = useState({
    activeProjects: 0,
    completedProjects: 0,
    totalEarnings: 0,
    rating: "0",
    responseRate: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Performance state
  const [performance, setPerformance] = useState({
    totalProjects: 0,
    completionRate: 0,
    onTimeDelivery: 0,
    repeatClients: 0,
    responseRate: "0%",
  });
  const [performanceLoading, setPerformanceLoading] = useState(true);

  // Active projects state
  const [activeProjects, setActiveProjects] = useState<ProviderProject[]>([]);
  const [activeProjectsLoading, setActiveProjectsLoading] = useState(true);

  const [recommendedOpportunities, setRecommendedOpportunities] = useState<
    RecommendedOpportunity[]
  >([]);
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const [errorOpportunities, setErrorOpportunities] = useState<string | null>(
    null
  );
  const [recommendationsCacheInfo, setRecommendationsCacheInfo] = useState<{
    cachedAt: number | null;
    nextRefreshAt: number | null;
  }>({ cachedAt: null, nextRefreshAt: null });
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<
    string | null
  >(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch provider project stats
        const statsResponse = await getProviderProjectStats();
        if (statsResponse.success) {
          setStats({
            activeProjects: statsResponse.stats.activeProjects || 0,
            completedProjects: statsResponse.stats.completedProjects || 0,
            totalEarnings: statsResponse.stats.totalEarnings || 0,
            rating: statsResponse.stats.averageRating?.toString() || "0",
            responseRate: 85, // Default value since not available in API
          });
        }

        // Fetch active projects
        const projectsResponse = await getProviderProjects({
          page: 1,
          limit: 5,
          status: "IN_PROGRESS",
        });
        if (projectsResponse.success) {
          setActiveProjects(projectsResponse.projects || []);
        }

        // Fetch recommended opportunities
        try {
          const recommendationsResponse =
            await getProviderRecommendedOpportunities();
          if (recommendationsResponse.success) {
            setRecommendedOpportunities(
              recommendationsResponse.recommendations || []
            );
            setRecommendationsCacheInfo({
              cachedAt: recommendationsResponse.cachedAt,
              nextRefreshAt: recommendationsResponse.nextRefreshAt,
            });
          }
        } catch (error) {
          console.error("Error fetching recommended opportunities:", error);
          setErrorOpportunities("Failed to load recommended opportunities");
        }

        // Fetch performance metrics
        const performanceResponse = await getProviderPerformanceMetrics();
        if (performanceResponse.success) {
          setPerformance({
            totalProjects: statsResponse.stats?.totalProjects || 0,
            completionRate: performanceResponse.metrics?.completionRate || 0,
            onTimeDelivery: performanceResponse.metrics?.onTimeDelivery || 0,
            repeatClients: performanceResponse.metrics?.repeatClients || 0,
            responseRate: "85%", // Default value (not calculated yet)
          });
        } else {
          // Fallback to defaults if API fails
          setPerformance({
            totalProjects: statsResponse.stats?.totalProjects || 0,
            completionRate: 0,
            onTimeDelivery: 0,
            repeatClients: 0,
            responseRate: "85%",
          });
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setStatsLoading(false);
        setPerformanceLoading(false);
        setActiveProjectsLoading(false);
        setLoadingOpportunities(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  return (
    <ProviderLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">
              Welcome back! Here&apos;s your business overview.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/provider/profile">
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            </Link>
            <Link href="/provider/opportunities">
              <Button>
                <Target className="w-4 h-4 mr-2" />
                Browse Jobs
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Active Projects
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.activeProjects
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
                    ) : (
                      `RM${stats.totalEarnings.toLocaleString()}`
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rating</p>
                  <div className="flex items-center gap-1">
                    <p className="text-2xl font-bold text-gray-900">
                      {statsLoading ? (
                        <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                      ) : (
                        stats.rating
                      )}
                    </p>
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Completed Projects
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.completedProjects
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Active Projects */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Projects</CardTitle>
                  <Link href="/provider/projects">
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
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
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage
                                src={getProfileImageUrl(
                                  project.customer?.customerProfile
                                    ?.profileImageUrl
                                )}
                              />
                              <AvatarFallback>
                                {project.customer?.name?.charAt(0) || "C"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {project.title}
                              </h4>
                              <Link
                                href={`/provider/companies/${
                                  project.customer?.id || ""
                                }`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {project.customer?.name || "Unknown Client"}
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className="bg-blue-100 text-blue-800">
                                  In Progress
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  Timeline:{" "}
                                  {project.timeline || "Not specified"}
                                </span>
                              </div>
                              {project.nextMilestone && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Next: {project.nextMilestone.title || ""}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {project.approvedPrice
                                ? `RM${project.approvedPrice.toLocaleString()}`
                                : `RM${
                                    project.budgetMin?.toLocaleString() || "0"
                                  } - RM${
                                    project.budgetMax?.toLocaleString() || "0"
                                  }`}
                            </p>
                            <div className="mt-2 w-24">
                              <Progress
                                value={project.progress || 0}
                                className="h-2"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                {project.progress || 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No active projects found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Recommended Opportunities */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg sm:text-xl">
                      Recommended Opportunities
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      AI-matched projects based on your skills and preferences
                    </CardDescription>
                  </div>
                  <Link
                    href="/provider/opportunities"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      Browse All
                    </Button>
                  </Link>
                </div>
                {recommendationsCacheInfo.cachedAt &&
                  recommendationsCacheInfo.nextRefreshAt && (
                    <div className="text-xs text-gray-500 mt-2 sm:mt-3">
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
                  {loadingOpportunities ? (
                    <div className="text-center py-6 text-gray-500 text-sm sm:text-base">
                      Loading opportunities...
                    </div>
                  ) : errorOpportunities ? (
                    <div className="text-center py-6 text-red-500 text-sm sm:text-base">
                      {errorOpportunities}
                    </div>
                  ) : recommendedOpportunities.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm sm:text-base">
                      No recommended opportunities found. Check back later!
                    </div>
                  ) : (
                    recommendedOpportunities.map((opportunity) => {
                      const isExpanded =
                        expandedOpportunityId === opportunity.id;
                      return (
                        <div
                          key={opportunity.id}
                          className="group relative p-3 sm:p-4 md:p-5 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 bg-white"
                        >
                          {/* AI Badge Indicator - Desktop hover only */}
                          {opportunity.aiExplanation && (
                            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                              <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-medium shadow-md">
                                <Sparkles className="w-3 h-3" />
                                <span className="hidden sm:inline">
                                  AI Insights
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 mb-3 pr-0 sm:pr-20">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 flex-wrap">
                                <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-base sm:text-lg break-words">
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
                                      {opportunity.matchScore}% match
                                    </Badge>
                                  )}
                              </div>
                              <p className="text-xs sm:text-sm font-medium text-gray-700 mt-1">
                                RM{" "}
                                {opportunity.budgetMin?.toLocaleString() || "0"}{" "}
                                - RM{" "}
                                {opportunity.budgetMax?.toLocaleString() || "0"}
                              </p>
                              {opportunity.customer?.name && (
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <p className="text-xs text-gray-600">
                                    {opportunity.customer.name}
                                  </p>
                                  {opportunity.customer.isVerified && (
                                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium shrink-0">
                                      ✓ Verified
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
                                      isExpanded ? null : opportunity.id
                                    )
                                  }
                                  className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium touch-manipulation"
                                >
                                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                  <span className="hidden sm:inline">
                                    Hover to see AI insights
                                  </span>
                                  <span className="sm:hidden">
                                    Tap to see AI insights
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
                                      Why this is recommended for you:
                                    </p>
                                    {/* Close button for mobile */}
                                    <button
                                      onClick={() =>
                                        setExpandedOpportunityId(null)
                                      }
                                      className="ml-auto lg:hidden text-blue-600 hover:text-blue-800 p-1"
                                      aria-label="Close insights"
                                    >
                                      <span className="text-lg">×</span>
                                    </button>
                                  </div>
                                  <div className="text-xs sm:text-sm text-blue-800 space-y-1.5 sm:space-y-2">
                                    {opportunity.aiExplanation
                                      .split("\n")
                                      .filter((line: string) => line.trim())
                                      .map((line: string, index: number) => {
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
                                      })}
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
                                  className="text-xs group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors border"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            {(opportunity.skills || []).length > 6 && (
                              <Badge
                                variant="secondary"
                                className="text-xs border"
                              >
                                +{(opportunity.skills || []).length - 6} more
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-gray-200 group-hover:border-blue-200 transition-colors">
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
                              {opportunity.proposalCount !== undefined && (
                                <span className="whitespace-nowrap">
                                  {opportunity.proposalCount} proposal
                                  {opportunity.proposalCount !== 1 ? "s" : ""}
                                </span>
                              )}
                            </div>
                            <Link
                              href={`/provider/opportunities/${opportunity.id}`}
                              className="w-full sm:w-auto"
                            >
                              <Button
                                size="sm"
                                className="w-full sm:w-auto group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-md"
                              >
                                <span>View Details</span>
                                <ChevronRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
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
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Total Projects</span>
                  <span className="font-semibold">
                    {performanceLoading ? (
                      <div className="animate-pulse bg-gray-200 h-4 w-8 rounded"></div>
                    ) : (
                      performance.totalProjects
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Completion Rate</span>
                  <span className="font-semibold">
                    {performanceLoading ? (
                      <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                    ) : (
                      `${performance.completionRate}%`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Repeat Clients</span>
                  <span className="font-semibold">
                    {performanceLoading ? (
                      <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
                    ) : (
                      `${performance.repeatClients}%`
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    On-time Delivery
                  </span>
                  <span className="font-semibold">
                    {performanceLoading ? (
                      <div className="animate-pulse bg-gray-200 h-4 w-12 rounded"></div>
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
      </div>
    </ProviderLayout>
  );
}
