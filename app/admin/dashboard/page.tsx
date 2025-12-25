"use client"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
} from "lucide-react"
import Link from "next/link"
import { AdminLayout } from "@/components/admin-layout"
import { useToast } from "@/hooks/use-toast"
import {
  getAdminDashboardStats,
  getAdminRecentActivity,
  getAdminPendingVerifications,
  getAdminTopProviders,
} from "@/lib/api"

export default function AdminDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeProjects: 0,
    totalRevenue: 0,
    platformGrowth: 0,
    pendingVerifications: 0,
    openDisputes: 0,
    underReviewDisputes: 0,
  })
  const [recentActivity, setRecentActivity] = useState<Array<Record<string, unknown>>>([])
  const [pendingVerifications, setPendingVerifications] = useState<Array<Record<string, unknown>>>([])
  const [topProviders, setTopProviders] = useState<Array<Record<string, unknown>>>([])

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Load all data in parallel
      const [statsRes, activityRes, verificationsRes, providersRes] = await Promise.all([
        getAdminDashboardStats(),
        getAdminRecentActivity(10),
        getAdminPendingVerifications(5),
        getAdminTopProviders(5),
      ])

      if (statsRes.success) {
        setStats(statsRes.data)
      }

      if (activityRes.success) {
        setRecentActivity(activityRes.data || [])
      }

      if (verificationsRes.success) {
        setPendingVerifications(verificationsRes.data || [])
      }

      if (providersRes.success) {
        setTopProviders(providersRes.data || [])
      }
    } catch (error: unknown) {
      console.error("Error loading dashboard data:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
    return date.toLocaleDateString()
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "user_registration":
        return <Users className="w-4 h-4" />
      case "project_completion":
        return <CheckCircle className="w-4 h-4" />
      case "dispute":
        return <AlertTriangle className="w-4 h-4" />
      case "payment":
        return <DollarSign className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const getActivityColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100"
      case "pending":
        return "text-yellow-600 bg-yellow-100"
      case "urgent":
        return "text-red-600 bg-red-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const totalDisputes = (stats.openDisputes || 0) + (stats.underReviewDisputes || 0)

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading dashboard...</span>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Platform overview and management tools</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin/reports">
              <Button variant="outline">
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports
              </Button>
            </Link>
            <Link href="/admin/settings">
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Button variant="outline" onClick={loadDashboardData} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
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
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeProjects}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    RM{((stats.totalRevenue || 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                  <p className="text-2xl font-bold text-gray-900">+{stats.platformGrowth.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alert Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                <CardTitle className="text-yellow-900">Pending Verifications</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-yellow-800">
                  {stats.pendingVerifications} {stats.pendingVerifications === 1 ? "user" : "users"} awaiting verification
                </p>
                <Link href="/admin/verifications">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 bg-transparent"
                  >
                    Review
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <CardTitle className="text-red-900">Active Disputes</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-red-800">
                  {totalDisputes} {totalDisputes === 1 ? "dispute" : "disputes"} require attention
                </p>
                <Link href="/admin/disputes">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-100 bg-transparent"
                  >
                    Resolve
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest platform activities and user actions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No recent activity</div>
                  ) : (
                    recentActivity.map((activity, index) => (
                    <div
                      key={activity.id ? String(activity.id) : `activity-${index}`}
                      className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${getActivityColor(String(activity.status || ""))}`}
                      >
                        {getActivityIcon(String(activity.type || ""))}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{String(activity.user || "")}</p>
                        <p className="text-sm text-gray-600">{String(activity.action || "")}</p>
                          <p className="text-xs text-gray-500">{formatTimeAgo(String(activity.time || ""))}</p>
                      </div>
                      <Badge className={getActivityColor(String(activity.status || ""))}>{String(activity.status || "")}</Badge>
                    </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pending Verifications */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pending Verifications</CardTitle>
                  <Link href="/admin/verifications">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingVerifications.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No pending verifications</div>
                  ) : (
                    pendingVerifications.map((verification, index) => {
                      const avatarUrl = verification.avatar
                        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}${String(verification.avatar).startsWith("/") ? "" : "/"}${String(verification.avatar)}`
                        : "/placeholder.svg"
                      
                      const verificationName = String(verification.name || "")
                      return (
                        <Link key={verification.id ? String(verification.id) : `verification-${index}`} href={`/admin/verifications`}>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <Avatar>
                              <AvatarImage src={avatarUrl} />
                        <AvatarFallback>{verificationName.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{verificationName}</p>
                        <p className="text-sm text-gray-600">{String(verification.type || "")}</p>
                              <p className="text-xs text-gray-500">
                                Submitted: {new Date(String(verification.submitted || "")).toLocaleDateString()}
                              </p>
                              {(() => {
                                const docs = verification.documents
                                const docCount = Array.isArray(docs) ? docs.length : 0
                                return docCount > 0 ? (
                                  <p className="text-xs text-gray-400 mt-1">
                                    {docCount} {docCount === 1 ? "document" : "documents"}
                                  </p>
                                ) : null
                              })()}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" className="text-xs">
                          Review
                        </Button>
                      </div>
                    </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Providers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Providers</CardTitle>
                <CardDescription>Highest performing service providers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topProviders.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No providers found</div>
                  ) : (
                    topProviders.map((provider, index) => {
                      const avatarUrl = provider.avatar
                        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}${String(provider.avatar).startsWith("/") ? "" : "/"}${String(provider.avatar)}`
                        : "/placeholder.svg"
                      
                      const providerId = provider.id ? String(provider.id) : `provider-${index}`
                      const providerName = String(provider.name || "")
                      const providerRating = typeof provider.rating === "number" ? provider.rating : 0
                      const providerCompletedJobs = typeof provider.completedJobs === "number" ? provider.completedJobs : 0
                      const providerEarnings = typeof provider.earnings === "number" ? provider.earnings : 0
                      
                      return (
                        <Link key={providerId} href={`/admin/users/${providerId}`}>
                          <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <Avatar>
                              <AvatarImage src={avatarUrl} />
                        <AvatarFallback>{providerName.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{providerName}</p>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                <span className="text-sm">{providerRating.toFixed(1)}</span>
                                <span className="text-xs text-gray-500">({providerCompletedJobs} {providerCompletedJobs === 1 ? "job" : "jobs"})</span>
                        </div>
                        <p className="text-xs text-gray-600">RM{providerEarnings.toLocaleString()} earned</p>
                      </div>
                    </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/admin/users">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Users className="w-4 h-4 mr-2" />
                    Manage Users
                  </Button>
                </Link>
                <Link href="/admin/projects">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Monitor Projects
                  </Button>
                </Link>
                <Link href="/admin/payments">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Payment Management
                  </Button>
                </Link>
                <Link href="/admin/reports">
                  <Button variant="outline" className="w-full justify-start bg-transparent">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Reports
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
