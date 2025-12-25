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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Briefcase,
  Star,
  FileText,
  PieChart,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import {
  getAdminReports,
  exportAdminReport,
  getAdminCategoryDetails,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminReportsPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("last_30_days");
  const [reportType, setReportType] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Data state
  const [overviewStats, setOverviewStats] = useState({
    totalRevenue: 0,
    revenueGrowth: 0,
    totalUsers: 0,
    userGrowth: 0,
    totalProjects: 0,
    projectGrowth: 0,
    avgRating: 0,
    ratingChange: 0,
  });
  const [monthlyData, setMonthlyData] = useState<Array<Record<string, unknown>>>([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Array<Record<string, unknown>>>([]);
  const [topProviders, setTopProviders] = useState<Array<Record<string, unknown>>>([]);
  const [topCustomers, setTopCustomers] = useState<Array<Record<string, unknown>>>([]);

  // Category detail modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categoryDetails, setCategoryDetails] = useState<Record<string, unknown> | null>(null);
  const [loadingCategoryDetails, setLoadingCategoryDetails] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, unknown> = {
        dateRange: dateRange === "custom" ? undefined : dateRange,
      };

      if (dateRange === "custom" && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const response = await getAdminReports(params);

      if (response.success && response.data) {
        setOverviewStats((prev) => response.data.overviewStats || prev);
        setMonthlyData(response.data.monthlyData || []);
        setCategoryBreakdown(response.data.categoryBreakdown || []);

        // Ensure providers have IDs and validate data structure
        const providers = (response.data.topProviders || [])
          .filter((provider: Record<string, unknown>) => provider && provider.id) // Only include providers with valid IDs
          .map((provider: Record<string, unknown>) => ({
            id: provider.id,
            name: provider.name || "Unknown Provider",
            projects: provider.projects || 0,
            revenue: provider.revenue || 0,
            rating: provider.rating || 0,
          }));
        setTopProviders(providers);

        // Ensure customers have IDs and validate data structure
        const customers = (response.data.topCustomers || [])
          .filter((customer: Record<string, unknown>) => customer && customer.id) // Only include customers with valid IDs
          .map((customer: Record<string, unknown>) => ({
            id: customer.id,
            name: customer.name || "Unknown Customer",
            projects: customer.projects || 0,
            spent: customer.spent || 0,
          }));
        setTopCustomers(customers);
      } else {
        console.error("Reports API response error:", response);
        toast({
          title: "Warning",
          description: "Reports data may be incomplete. Please refresh.",
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load reports",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange, customStartDate, customEndDate, toast]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadReports();
  };

  const handleCategoryClick = async (category: string) => {
    setSelectedCategory(category);
    setCategoryModalOpen(true);
    setLoadingCategoryDetails(true);
    setCategoryDetails(null);

    try {
      const params: {
        category: string;
        dateRange?: string;
        startDate?: string;
        endDate?: string;
      } = {
        category,
        dateRange: dateRange === "custom" ? undefined : dateRange,
      };

      if (dateRange === "custom" && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const response = await getAdminCategoryDetails(params);
      if (response.success && response.data) {
        setCategoryDetails(response.data);
      } else {
        throw new Error("Failed to load category details");
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load category details",
        variant: "destructive",
      });
    } finally {
      setLoadingCategoryDetails(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const params: {
        reportType?: string;
        dateRange?: string;
        startDate?: string;
        endDate?: string;
        format?: string;
      } = {
        reportType,
        dateRange: dateRange === "custom" ? undefined : dateRange,
        format: "pdf",
      };

      if (dateRange === "custom" && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      // Use the API function
      const blob = await exportAdminReport(params);

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${reportType}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF report exported successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export report",
        variant: "destructive",
      });
    }
  };

  const handleQuickReport = async (type: string) => {
    try {
      const params: {
        reportType?: string;
        dateRange?: string;
        startDate?: string;
        endDate?: string;
        format?: string;
      } = {
        reportType: type,
        dateRange: dateRange === "custom" ? undefined : dateRange,
        format: "pdf",
      };

      if (dateRange === "custom" && customStartDate && customEndDate) {
        params.startDate = customStartDate;
        params.endDate = customEndDate;
      }

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : undefined;
      if (!token) throw new Error("Not authenticated");

      const searchParams = new URLSearchParams();
      if (params.reportType && typeof params.reportType === "string")
        searchParams.append("reportType", params.reportType);
      if (params.dateRange && typeof params.dateRange === "string")
        searchParams.append("dateRange", params.dateRange);
      if (params.startDate && typeof params.startDate === "string")
        searchParams.append("startDate", params.startDate);
      if (params.endDate && typeof params.endDate === "string")
        searchParams.append("endDate", params.endDate);
      if (params.format && typeof params.format === "string")
        searchParams.append("format", params.format);

      const API_BASE =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const res = await fetch(
        `${API_BASE}/admin/reports/export?${searchParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData?.error || "Failed to export report");
      }

      // Get PDF blob
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-${type}-${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: `${type} report exported successfully as PDF`,
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to export report",
        variant: "destructive",
      });
    }
  };

  const handleCustomDateChange = () => {
    if (customStartDate && customEndDate) {
      setDateRange("custom");
      setShowCustomDatePicker(false);
    } else {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
    }
  };

  // Calculate max revenue for progress bars
  const maxMonthlyRevenue =
    monthlyData.length > 0
      ? Math.max(...monthlyData.map((m) => {
          const revenue = typeof m.revenue === "number" ? m.revenue : 0;
          return revenue;
        }))
      : 1;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Reports & Analytics
            </h1>
            <p className="text-gray-600">
              Comprehensive platform performance insights
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing || loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <BarChart3 className="w-4 h-4 mr-2" />
              Advanced Analytics
            </Button>
          </div>
        </div>

        {/* Report Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Report Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Platform Overview</SelectItem>
                  <SelectItem value="financial">Financial Report</SelectItem>
                  <SelectItem value="user_activity">User Activity</SelectItem>
                  <SelectItem value="project_performance">
                    Project Performance
                  </SelectItem>
                  <SelectItem value="provider_analytics">
                    Provider Analytics
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_3_months">Last 3 Months</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              {dateRange === "custom" && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={customStartDate || ""}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  />
                  <input
                    type="date"
                    value={customEndDate || ""}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  />
                  <Button onClick={handleCustomDateChange} size="sm">
                    Apply
                  </Button>
                </div>
              )}
              {dateRange !== "custom" && (
                <Button
                  variant="outline"
                  onClick={() => setShowCustomDatePicker(!showCustomDatePicker)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Custom Date
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        RM
                        {(overviewStats.totalRevenue / 1000000).toFixed(1)}M
                      </p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                        <span className="text-sm text-green-600">
                          {overviewStats.revenueGrowth >= 0 ? "+" : ""}
                          {overviewStats.revenueGrowth.toFixed(1)}%
                        </span>
                      </div>
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
                      <p className="text-sm font-medium text-gray-600">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overviewStats.totalUsers.toLocaleString()}
                      </p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-blue-600 mr-1" />
                        <span className="text-sm text-blue-600">
                          {overviewStats.userGrowth >= 0 ? "+" : ""}
                          {overviewStats.userGrowth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Active Projects
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overviewStats.totalProjects}
                      </p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-purple-600 mr-1" />
                        <span className="text-sm text-purple-600">
                          {overviewStats.projectGrowth >= 0 ? "+" : ""}
                          {overviewStats.projectGrowth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Avg Rating
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {overviewStats.avgRating.toFixed(1)}
                      </p>
                      <div className="flex items-center mt-1">
                        <TrendingUp className="w-4 h-4 text-yellow-600 mr-1" />
                        <span className="text-sm text-yellow-600">
                          {overviewStats.ratingChange >= 0 ? "+" : ""}
                          {overviewStats.ratingChange.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Star className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Monthly Performance */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Performance</CardTitle>
                    <CardDescription>
                      Revenue, projects, and user growth over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {monthlyData.length > 0 ? (
                      <div className="space-y-6">
                        {monthlyData.map((month, index) => {
                          const monthName = typeof month.month === "string" ? month.month : "Unknown";
                          const year = typeof month.year === "string" || typeof month.year === "number" ? String(month.year) : "Unknown";
                          const revenue = typeof month.revenue === "number" ? month.revenue : 0;
                          const projects = typeof month.projects === "number" ? month.projects : 0;
                          const users = typeof month.users === "number" ? month.users : 0;
                          
                          return (
                            <div
                              key={`${monthName}-${year}-${index}`}
                              className="space-y-2"
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-medium">
                                  {monthName} {year}
                                </span>
                                <span className="text-sm text-gray-500">
                                  RM{(revenue / 1000).toFixed(0)}K
                                </span>
                              </div>
                              <Progress
                                value={
                                  maxMonthlyRevenue > 0
                                    ? (revenue / maxMonthlyRevenue) * 100
                                    : 0
                                }
                                className="h-2"
                              />
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>{projects} projects</span>
                                <span>{users} new users</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No monthly data available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Category Breakdown */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue by Category</CardTitle>
                    <CardDescription>
                      Service category performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {categoryBreakdown.length > 0 ? (
                      <div className="space-y-4">
                        {categoryBreakdown.map((category) => {
                          const categoryName = typeof category.category === "string" ? category.category : "Unknown";
                          const percentage = typeof category.percentage === "number" ? category.percentage : 0;
                          const projects = typeof category.projects === "number" ? category.projects : 0;
                          const revenue = typeof category.revenue === "number" ? category.revenue : 0;
                          
                          return (
                            <div
                              key={categoryName}
                              onClick={() =>
                                handleCategoryClick(categoryName)
                              }
                              className="space-y-2 p-3 rounded-lg border cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium hover:text-blue-600 transition-colors">
                                  {categoryName}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                              <Progress
                                value={percentage}
                                className="h-2"
                              />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{projects} projects</span>
                                <span>
                                  RM{(revenue / 1000).toFixed(0)}K
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No category data available
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Top Providers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Providers</CardTitle>
                  <CardDescription>
                    Highest earning service providers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {topProviders.length > 0 ? (
                    <div className="space-y-4">
                      {topProviders.map((provider, index) => {
                        const providerId = typeof provider.id === "string" || typeof provider.id === "number" ? String(provider.id) : "";
                        const providerName = typeof provider.name === "string" ? provider.name : "Unknown Provider";
                        const providerProjects = typeof provider.projects === "number" ? provider.projects : 0;
                        const providerRating = typeof provider.rating === "number" ? provider.rating : 0;
                        const providerRevenue = typeof provider.revenue === "number" ? provider.revenue : 0;
                        
                        return (
                          <Link
                            key={providerId || providerName || index}
                            href={`/admin/users/${providerId}`}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">
                                  #{index + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium hover:text-blue-600 transition-colors">
                                  {providerName}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <span>{providerProjects} projects</span>
                                  {providerRating > 0 && (
                                    <div className="flex items-center">
                                      <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                                      <span>{providerRating.toFixed(1)}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                RM{(providerRevenue / 1000).toFixed(0)}K
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No provider data available
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Top Customers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Spending Customers</CardTitle>
                  <CardDescription>Highest value customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {topCustomers.length > 0 ? (
                    <div className="space-y-4">
                      {topCustomers.map((customer, index) => {
                        const customerId = typeof customer.id === "string" || typeof customer.id === "number" ? String(customer.id) : "";
                        const customerName = typeof customer.name === "string" ? customer.name : "Unknown Customer";
                        const customerProjects = typeof customer.projects === "number" ? customer.projects : 0;
                        const customerSpent = typeof customer.spent === "number" ? customer.spent : 0;
                        
                        return (
                          <Link
                            key={customerId || customerName || index}
                            href={`/admin/users/${customerId}`}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-purple-600">
                                  #{index + 1}
                                </span>
                              </div>
                              <div className="flex-1">
                                <p className="font-medium hover:text-purple-600 transition-colors">
                                  {customerName}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {customerProjects} projects
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                RM{(customerSpent / 1000).toFixed(0)}K
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">
                      No customer data available
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Reports */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Report Generation</CardTitle>
                <CardDescription>
                  Generate specific reports for different stakeholders
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => handleQuickReport("financial")}
                  >
                    <FileText className="w-6 h-6" />
                    <span>Financial Summary</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => handleQuickReport("user_activity")}
                  >
                    <Users className="w-6 h-6" />
                    <span>User Analytics</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => handleQuickReport("project_performance")}
                  >
                    <Briefcase className="w-6 h-6" />
                    <span>Project Report</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-20 flex-col gap-2 bg-transparent"
                    onClick={() => handleQuickReport("provider_analytics")}
                  >
                    <PieChart className="w-6 h-6" />
                    <span>Performance Metrics</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Category Detail Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedCategory} - Category Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive analytics and project information for this category
            </DialogDescription>
          </DialogHeader>

          {loadingCategoryDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading category details...</span>
            </div>
          ) : categoryDetails ? (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="projects">Projects</TabsTrigger>
                <TabsTrigger value="providers">Providers</TabsTrigger>
                <TabsTrigger value="customers">Customers</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Total Revenue
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            RM{((typeof categoryDetails.totalRevenue === "number" ? categoryDetails.totalRevenue : 0) / 1000).toFixed(0)}
                            K
                          </p>
                        </div>
                        <DollarSign className="w-8 h-8 text-green-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Projects
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {typeof categoryDetails.projectCount === "number" ? categoryDetails.projectCount : 0}
                          </p>
                        </div>
                        <Briefcase className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Avg Project Value
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            RM
                            {(
                              (typeof categoryDetails.averageProjectValue === "number" ? categoryDetails.averageProjectValue : 0) / 1000
                            ).toFixed(0)}
                            K
                          </p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Providers
                          </p>
                          <p className="text-2xl font-bold mt-1">
                            {Array.isArray(categoryDetails.providers) ? categoryDetails.providers.length : 0}
                          </p>
                        </div>
                        <Users className="w-8 h-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Trends */}
                {Array.isArray(categoryDetails.monthlyTrends) &&
                  categoryDetails.monthlyTrends.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Monthly Performance Trends</CardTitle>
                        <CardDescription>
                          Revenue and project count over time
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {(() => {
                            const trends = categoryDetails.monthlyTrends as Array<Record<string, unknown>>;
                            const maxRevenue = Math.max(...trends.map((m) => {
                              const rev = typeof m.revenue === "number" ? m.revenue : 0;
                              return rev;
                            }));
                            
                            return trends.map((month: Record<string, unknown>, index: number) => {
                              const monthName = typeof month.month === "string" ? month.month : "Unknown";
                              const year = typeof month.year === "string" || typeof month.year === "number" ? String(month.year) : "Unknown";
                              const revenue = typeof month.revenue === "number" ? month.revenue : 0;
                              const projects = typeof month.projects === "number" ? month.projects : 0;
                              
                              return (
                                <div key={index} className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium">
                                      {monthName} {year}
                                    </span>
                                    <span className="text-sm text-gray-500">
                                      RM{(revenue / 1000).toFixed(0)}K
                                    </span>
                                  </div>
                                  <Progress
                                    value={
                                      maxRevenue > 0
                                        ? (revenue / maxRevenue) * 100
                                        : 0
                                    }
                                    className="h-2"
                                  />
                                  <div className="flex justify-between text-xs text-gray-500">
                                    <span>{projects} projects</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>

              <TabsContent value="projects" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      All Projects ({Array.isArray(categoryDetails.projects) ? categoryDetails.projects.length : 0})
                    </CardTitle>
                    <CardDescription>Projects in this category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(categoryDetails.projects) &&
                    categoryDetails.projects.length > 0 ? (
                      <div className="space-y-3">
                        {(categoryDetails.projects as Array<Record<string, unknown>>).map((project: Record<string, unknown>) => {
                          const projectId = typeof project.id === "string" || typeof project.id === "number" ? String(project.id) : "";
                          const projectTitle = typeof project.title === "string" ? project.title : "Untitled Project";
                          const projectStatus = typeof project.status === "string" ? project.status : "UNKNOWN";
                          const projectRevenue = typeof project.revenue === "number" ? project.revenue : 0;
                          
                          const providerObj = project.provider && typeof project.provider === "object" && project.provider !== null
                            ? project.provider as Record<string, unknown>
                            : null;
                          const providerName = providerObj && typeof providerObj.name === "string" ? providerObj.name : null;
                          
                          const customerObj = project.customer && typeof project.customer === "object" && project.customer !== null
                            ? project.customer as Record<string, unknown>
                            : null;
                          const customerName = customerObj && typeof customerObj.name === "string" ? customerObj.name : null;
                          
                          let createdDateStr = "—";
                          if (project.createdAt) {
                            if (typeof project.createdAt === "string") {
                              const date = new Date(project.createdAt);
                              if (!isNaN(date.getTime())) {
                                createdDateStr = date.toLocaleDateString();
                              }
                            } else if (typeof project.createdAt === "number") {
                              const date = new Date(project.createdAt);
                              if (!isNaN(date.getTime())) {
                                createdDateStr = date.toLocaleDateString();
                              }
                            }
                          }
                          
                          return (
                            <Link
                              key={projectId}
                              href={`/admin/projects/${projectId}`}
                              className="block p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <p className="font-medium">{projectTitle}</p>
                                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    {providerName && (
                                      <span>
                                        Provider: {providerName}
                                      </span>
                                    )}
                                    {customerName && (
                                      <span>
                                        Customer: {customerName}
                                      </span>
                                    )}
                                    <span>{createdDateStr}</span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge
                                    variant={
                                      projectStatus === "COMPLETED"
                                        ? "default"
                                        : projectStatus === "IN_PROGRESS"
                                        ? "secondary"
                                        : "outline"
                                    }
                                    className="mb-2"
                                  >
                                    {projectStatus}
                                  </Badge>
                                  <p className="font-medium">
                                    RM{(projectRevenue / 1000).toFixed(0)}K
                                  </p>
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No projects found in this category
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="providers" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Providers ({Array.isArray(categoryDetails.providers) ? categoryDetails.providers.length : 0})
                    </CardTitle>
                    <CardDescription>
                      Service providers working in this category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(categoryDetails.providers) &&
                    categoryDetails.providers.length > 0 ? (
                      <div className="space-y-3">
                        {(categoryDetails.providers as Array<Record<string, unknown>>).map((provider: Record<string, unknown>) => {
                          const providerId = typeof provider.id === "string" || typeof provider.id === "number" ? String(provider.id) : "";
                          const providerName = typeof provider.name === "string" ? provider.name : "Unknown Provider";
                          const providerEmail = typeof provider.email === "string" ? provider.email : "";
                          const providerLocation = typeof provider.location === "string" ? provider.location : null;
                          const providerRating = typeof provider.rating === "number" ? provider.rating : (typeof provider.rating === "string" ? Number(provider.rating) : 0);
                          
                          return (
                            <Link
                              key={providerId}
                              href={`/admin/users/${providerId}`}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Users className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{providerName}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    {providerRating > 0 && (
                                      <div className="flex items-center">
                                        <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                                        <span>
                                          {providerRating.toFixed(1)}
                                        </span>
                                      </div>
                                    )}
                                    {providerLocation && (
                                      <span>• {providerLocation}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">
                                  {providerEmail}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No providers found in this category
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="customers" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>
                      Customers ({Array.isArray(categoryDetails.customers) ? categoryDetails.customers.length : 0})
                    </CardTitle>
                    <CardDescription>
                      Companies using this category
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(categoryDetails.customers) &&
                    categoryDetails.customers.length > 0 ? (
                      <div className="space-y-3">
                        {(categoryDetails.customers as Array<Record<string, unknown>>).map((customer: Record<string, unknown>) => {
                          const customerId = typeof customer.id === "string" || typeof customer.id === "number" ? String(customer.id) : "";
                          const customerName = typeof customer.name === "string" ? customer.name : "Unknown Customer";
                          const customerEmail = typeof customer.email === "string" ? customer.email : "";
                          const customerIndustry = typeof customer.industry === "string" ? customer.industry : null;
                          const customerCompanySize = typeof customer.companySize === "string" ? customer.companySize : null;
                          
                          return (
                            <Link
                              key={customerId}
                              href={`/admin/users/${customerId}`}
                              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                                  <Users className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                  <p className="font-medium">{customerName}</p>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    {customerIndustry && (
                                      <span>{customerIndustry}</span>
                                    )}
                                    {customerCompanySize && (
                                      <span>• {customerCompanySize}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-500">
                                  {customerEmail}
                                </p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No customers found in this category
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No category details available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
