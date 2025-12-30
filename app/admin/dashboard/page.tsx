"use client";
import { useState, useEffect, useCallback } from "react";
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
import {
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  FileText,
  Star,
  Eye,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin-layout";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminDashboardStats,
  getAdminRecentActivity,
  getAdminPendingVerifications,
  getAdminTopProviders,
} from "@/lib/api";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    totalRevenue: 0,
    platformGrowth: 0,
    pendingVerifications: 0,
    openDisputes: 0,
    underReviewDisputes: 0,
  });
  const [recentActivity, setRecentActivity] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [pendingVerifications, setPendingVerifications] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [topProviders, setTopProviders] = useState<
    Array<Record<string, unknown>>
  >([]);

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Load all data in parallel
      const [statsRes, activityRes, verificationsRes, providersRes] =
        await Promise.all([
          getAdminDashboardStats(),
          getAdminRecentActivity(10),
          getAdminPendingVerifications(5),
          getAdminTopProviders(5),
        ]);

      if (statsRes.success) {
        setStats(statsRes.data);
      }

      if (activityRes.success) {
        setRecentActivity(activityRes.data || []);
      }

      if (verificationsRes.success) {
        setPendingVerifications(verificationsRes.data || []);
      }

      if (providersRes.success) {
        setTopProviders(providersRes.data || []);
      }
    } catch (error: unknown) {
      console.error("Error loading dashboard data:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  const formatRevenue = (amount: number) => {
    if (amount >= 1000000) {
      return `RM${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `RM${(amount / 1000).toFixed(1)}K`;
    } else {
      return `RM${amount.toLocaleString()}`;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_registration":
        return <Users className="w-4 h-4" />;
      case "project_completion":
        return <CheckCircle className="w-4 h-4" />;
      case "dispute":
        return <AlertTriangle className="w-4 h-4" />;
      case "payment":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      case "urgent":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const totalDisputes =
    (stats.openDisputes || 0) + (stats.underReviewDisputes || 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-0">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
          <span className="ml-2 text-sm sm:text-base">
            Loading dashboard...
          </span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Platform overview and management tools
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link href="/admin/reports" className="w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Reports
              </Button>
            </Link>
            <Link href="/admin/settings" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto text-xs sm:text-sm">
                <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Settings
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={loadDashboardData}
              disabled={loading}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Users
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {stats.totalUsers.toLocaleString()}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Active Projects
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {stats.activeProjects}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {formatRevenue(stats.totalRevenue || 0)}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Growth Rate
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                    {stats.platformGrowth >= 0 ? "+" : ""}
                    {stats.platformGrowth.toFixed(1)}%
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                <CardTitle className="text-base sm:text-lg text-yellow-900">
                  Pending Verifications
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <p className="text-sm sm:text-base text-yellow-800 break-words">
                  {stats.pendingVerifications}{" "}
                  {stats.pendingVerifications === 1 ? "user" : "users"} awaiting
                  verification
                </p>
                <Link href="/admin/verifications" className="w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-300 text-yellow-700 active:bg-yellow-100 sm:hover:bg-yellow-100 bg-transparent w-full sm:w-auto text-xs sm:text-sm"
                  >
                    Review
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                <CardTitle className="text-base sm:text-lg text-red-900">
                  Active Disputes
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <p className="text-sm sm:text-base text-red-800 break-words">
                  {totalDisputes} {totalDisputes === 1 ? "dispute" : "disputes"}{" "}
                  require attention
                </p>
                <Link href="/admin/disputes" className="w-full sm:w-auto">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 active:bg-red-100 sm:hover:bg-red-100 bg-transparent w-full sm:w-auto text-xs sm:text-sm"
                  >
                    Resolve
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Recent Activity
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Latest platform activities and user actions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center text-sm sm:text-base text-gray-500 py-6 sm:py-8">
                      No recent activity
                    </div>
                  ) : (
                    recentActivity.map((activity, index) => (
                      <div
                        key={
                          activity.id
                            ? String(activity.id)
                            : `activity-${index}`
                        }
                        className="flex items-center space-x-3 sm:space-x-4 p-3 rounded-lg active:bg-gray-50 sm:hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActivityColor(
                            String(activity.status || "")
                          )}`}
                        >
                          {getActivityIcon(String(activity.type || ""))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm sm:text-base text-gray-900 break-words">
                            {String(activity.user || "")}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 break-words">
                            {String(activity.action || "")}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(String(activity.time || ""))}
                          </p>
                        </div>
                        <Badge
                          className={`${getActivityColor(
                            String(activity.status || "")
                          )} text-xs flex-shrink-0`}
                        >
                          {String(activity.status || "")}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Pending Verifications */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base sm:text-lg">
                    Pending Verifications
                  </CardTitle>
                  <Link href="/admin/verifications">
                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                      <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {pendingVerifications.length === 0 ? (
                    <div className="text-center text-sm sm:text-base text-gray-500 py-6 sm:py-8">
                      No pending verifications
                    </div>
                  ) : (
                    pendingVerifications.map((verification, index) => {
                      const avatarUrl = verification.avatar
                        ? `${
                            process.env.NEXT_PUBLIC_API_BASE_URL ||
                            "http://localhost:4000"
                          }${
                            String(verification.avatar).startsWith("/")
                              ? ""
                              : "/"
                          }${String(verification.avatar)}`
                        : "/placeholder.svg";

                      const verificationName = String(verification.name || "");
                      return (
                        <Link
                          key={
                            verification.id
                              ? String(verification.id)
                              : `verification-${index}`
                          }
                          href={`/admin/verifications`}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg active:bg-gray-50 sm:hover:bg-gray-50 transition-colors cursor-pointer">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback className="text-xs sm:text-sm">
                                {verificationName.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                                {verificationName}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-600 truncate">
                                {String(verification.type || "")}
                              </p>
                              <p className="text-xs text-gray-500">
                                Submitted:{" "}
                                {new Date(
                                  String(verification.submitted || "")
                                ).toLocaleDateString()}
                              </p>
                              {(() => {
                                const docs = verification.documents;
                                const docCount = Array.isArray(docs)
                                  ? docs.length
                                  : 0;
                                return docCount > 0 ? (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {docCount}{" "}
                                    {docCount === 1 ? "document" : "documents"}
                                  </p>
                                ) : null;
                              })()}
                            </div>
                            <div className="flex flex-col gap-1 flex-shrink-0">
                              <Button size="sm" className="text-xs">
                                Review
                              </Button>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Providers */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Top Providers
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Highest performing service providers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {topProviders.length === 0 ? (
                    <div className="text-center text-sm sm:text-base text-gray-500 py-6 sm:py-8">
                      No providers found
                    </div>
                  ) : (
                    topProviders.map((provider, index) => {
                      const avatarUrl = provider.avatar
                        ? `${
                            process.env.NEXT_PUBLIC_API_BASE_URL ||
                            "http://localhost:4000"
                          }${
                            String(provider.avatar).startsWith("/") ? "" : "/"
                          }${String(provider.avatar)}`
                        : "/placeholder.svg";

                      const providerId = provider.id
                        ? String(provider.id)
                        : `provider-${index}`;
                      const providerName = String(provider.name || "");
                      const providerRating =
                        typeof provider.rating === "number"
                          ? provider.rating
                          : 0;
                      const providerCompletedJobs =
                        typeof provider.completedJobs === "number"
                          ? provider.completedJobs
                          : 0;
                      const providerEarnings =
                        typeof provider.earnings === "number"
                          ? provider.earnings
                          : 0;

                      return (
                        <Link
                          key={providerId}
                          href={`/admin/users/${providerId}`}
                        >
                          <div className="flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 border rounded-lg active:bg-gray-50 sm:hover:bg-gray-50 transition-colors cursor-pointer">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback className="text-xs sm:text-sm">
                                {providerName.charAt(0) || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base text-gray-900 truncate">
                                {providerName}
                              </p>
                              <div className="flex items-center gap-1 flex-wrap">
                                <Star className="w-3 h-3 text-yellow-400 fill-current flex-shrink-0" />
                                <span className="text-xs sm:text-sm">
                                  {providerRating.toFixed(1)}
                                </span>
                                <span className="text-xs text-gray-500">
                                  ({providerCompletedJobs}{" "}
                                  {providerCompletedJobs === 1 ? "job" : "jobs"}
                                  )
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">
                                RM{providerEarnings.toLocaleString()} earned
                              </p>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
                <Link href="/admin/users">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent text-xs sm:text-sm"
                  >
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/admin/projects">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent text-xs sm:text-sm"
                  >
                    <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Monitor Projects
                  </Button>
                </Link>
                <Link href="/admin/payments">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent text-xs sm:text-sm"
                  >
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Payment Management
                  </Button>
                </Link>
                <Link href="/admin/reports">
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent text-xs sm:text-sm"
                  >
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Generate Reports
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
