"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Briefcase,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"
import { useToast } from "@/hooks/use-toast"
import { getAdminProjects, getAdminProjectStats } from "@/lib/api"
import Link from "next/link"

export default function AdminProjectsPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Array<Record<string, unknown>>>([])
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getAdminProjects({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      })
      if (response.success) {
        setProjects((response.data || []) as Array<Record<string, unknown>>)
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load projects",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [statusFilter, searchQuery, toast])

  const loadStats = async () => {
    try {
      const response = await getAdminProjectStats()
      if (response.success) {
        setStats(response.data as Record<string, unknown>)
      }
    } catch (error: unknown) {
      console.error("Failed to load stats:", error)
    }
  }

  useEffect(() => {
    loadProjects()
    loadStats()
  }, [loadProjects])


  const getStatusText = (status: string, type?: string) => {
    // ServiceRequests are always "OPEN" (unmatched opportunities)
    if (type === "serviceRequest") {
      return "Open Opportunity"
    }
    
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "Completed"
      case "IN_PROGRESS":
        return "In Progress"
      case "DISPUTED":
        return "Disputed"
      case "OPEN":
        return "Open Opportunity"
      default:
        return status?.replace("_", " ") || status
    }
  }

  const getStatusColor = (status: string, type?: string) => {
    // ServiceRequests (unmatched opportunities)
    if (type === "serviceRequest") {
      return "bg-yellow-100 text-yellow-800"
    }
    
    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800"
      case "DISPUTED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const calculateProgress = (project: Record<string, unknown>) => {
    // ServiceRequests don't have progress yet
    if (project.type === "serviceRequest") return 0
    
    const milestones = Array.isArray(project.milestones) ? project.milestones : []
    if (milestones.length === 0) return 0
    const completed = milestones.filter(
      (m: Record<string, unknown>) => m.status === "APPROVED" || m.status === "PAID"
    ).length
    return Math.round((completed / milestones.length) * 100)
  }

  const filteredProjects = projects.filter((project) => {
    const searchLower = searchQuery.toLowerCase()
    const title = typeof project.title === "string" ? project.title.toLowerCase() : ""
    const customerName = typeof project.customer === "object" && project.customer !== null && typeof (project.customer as Record<string, unknown>).name === "string"
      ? ((project.customer as Record<string, unknown>).name as string).toLowerCase()
      : ""
    const providerName = typeof project.provider === "object" && project.provider !== null && typeof (project.provider as Record<string, unknown>).name === "string"
      ? ((project.provider as Record<string, unknown>).name as string).toLowerCase()
      : ""
    const category = typeof project.category === "string" ? project.category.toLowerCase() : ""
    
    const matchesSearch =
      title.includes(searchLower) ||
      customerName.includes(searchLower) ||
      (providerName.includes(searchLower) && project.type !== "serviceRequest")
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "OPEN" && project.type === "serviceRequest") ||
      (statusFilter !== "OPEN" && project.status === statusFilter && project.type === "project")
    const matchesCategory =
      categoryFilter === "all" || category.includes(categoryFilter.toLowerCase())
    return matchesSearch && matchesStatus && matchesCategory
  })

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Project Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Monitor and manage all platform projects</p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Projects</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{typeof stats.totalProjects === "number" ? stats.totalProjects : 0}</p>
                    {typeof stats.openOpportunities === "number" && stats.openOpportunities > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.openOpportunities} open opportunities
                      </p>
                    )}
                </div>
                <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600 truncate">{typeof stats.activeProjects === "number" ? stats.activeProjects : 0}</p>
                </div>
                <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">{typeof stats.completedProjects === "number" ? stats.completedProjects : 0}</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Disputed</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600 truncate">{typeof stats.disputedProjects === "number" ? stats.disputedProjects : 0}</p>
                </div>
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Value</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-600 truncate">
                      RM{((typeof stats.totalValue === "number" ? stats.totalValue : 0) / 1000).toFixed(0)}K
                    </p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <Input
                    placeholder="Search projects, customers, or providers..."
                    className="pl-9 sm:pl-10 text-sm sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        loadProjects()
                      }
                    }}
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="web">Web Development</SelectItem>
                  <SelectItem value="mobile">Mobile Development</SelectItem>
                  <SelectItem value="cloud">Cloud Services</SelectItem>
                  <SelectItem value="iot">IoT Solutions</SelectItem>
                  <SelectItem value="data">Data Analytics</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open Opportunities</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="DISPUTED">Disputed</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadProjects} className="w-full sm:w-auto text-xs sm:text-sm">
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Projects Table */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Projects ({filteredProjects.length})</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Monitor project progress and resolve issues</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-0">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
              </div>
            ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">Project</TableHead>
                  <TableHead className="text-xs sm:text-sm">Participants</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                  <TableHead className="text-xs sm:text-sm">Progress</TableHead>
                  <TableHead className="text-xs sm:text-sm">Budget</TableHead>
                  <TableHead className="text-xs sm:text-sm">Timeline</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {filteredProjects.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 sm:py-12 text-sm sm:text-base text-gray-500">
                        No projects found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredProjects.map((project) => {
                      const projectId = typeof project.id === "string" || typeof project.id === "number" ? String(project.id) : ""
                      const isServiceRequest = project.type === "serviceRequest"
                      const progress = calculateProgress(project)
                      
                      // Safely get disputes count
                      const disputesArray = Array.isArray(project.Dispute) ? project.Dispute : []
                      const disputesCount = disputesArray.length
                      
                      const milestonesArray = Array.isArray(project.milestones) ? project.milestones : []
                      const completedMilestones =
                        milestonesArray.filter((m: Record<string, unknown>) => m.status === "APPROVED" || m.status === "PAID")
                          .length || 0
                      const totalMilestones = milestonesArray.length || 0
                      
                      // Safely get proposals count
                      const proposalsArray = Array.isArray(project.proposals) ? project.proposals : []
                      const proposalsCount = typeof project.proposalsCount === "number" ? project.proposalsCount : proposalsArray.length
                      
                      // Safely get project title
                      const projectTitle = typeof project.title === "string" ? project.title : "Untitled Project"
                      
                      // Safely get category
                      const projectCategory = typeof project.category === "string" ? project.category : ""
                      
                      // Safely get customer name
                      const customerObj = project.customer && typeof project.customer === "object" && project.customer !== null
                        ? project.customer as Record<string, unknown>
                        : null
                      const customerName = customerObj && typeof customerObj.name === "string" ? customerObj.name : "N/A"
                      const customerInitial = customerName !== "N/A" ? customerName.charAt(0).toUpperCase() : "C"
                      
                      // Safely get provider name
                      const providerObj = project.provider && typeof project.provider === "object" && project.provider !== null
                        ? project.provider as Record<string, unknown>
                        : null
                      const providerName = providerObj && typeof providerObj.name === "string" ? providerObj.name : "N/A"
                      const providerInitial = providerName !== "N/A" ? providerName.charAt(0).toUpperCase() : "P"
                      
                      // Safely get status and type
                      const projectStatus = typeof project.status === "string" ? project.status : ""
                      const projectType = typeof project.type === "string" ? project.type : ""
                      
                      // Safely get budget
                      const budgetMin = typeof project.budgetMin === "number" ? project.budgetMin : 0
                      const budgetMax = typeof project.budgetMax === "number" ? project.budgetMax : 0
                      
                      // Safely get timeline
                      const projectTimeline = typeof project.timeline === "string" ? project.timeline : "—"
                      
                      // Safely get created date
                      let createdDateStr = "—"
                      if (project.createdAt) {
                        if (typeof project.createdAt === "string") {
                          const date = new Date(project.createdAt)
                          if (!isNaN(date.getTime())) {
                            createdDateStr = date.toLocaleDateString()
                          }
                        } else if (typeof project.createdAt === "number") {
                          const date = new Date(project.createdAt)
                          if (!isNaN(date.getTime())) {
                            createdDateStr = date.toLocaleDateString()
                          }
                        }
                      }

                      return (
                  <TableRow key={projectId}>
                    <TableCell className="p-3 sm:p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm sm:text-base break-words">{projectTitle}</p>
                          {isServiceRequest && (
                            <Badge className="bg-yellow-100 text-yellow-800 text-xs flex-shrink-0">
                              Opportunity
                            </Badge>
                          )}
                        </div>
                        {projectCategory && (
                          <p className="text-xs sm:text-sm text-gray-500 break-words">{projectCategory}</p>
                        )}
                              {disputesCount > 0 && !isServiceRequest && (
                          <Badge className="bg-red-100 text-red-800 mt-1 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                                  {disputesCount} dispute(s)
                          </Badge>
                        )}
                        {isServiceRequest && proposalsCount > 0 && (
                          <Badge className="bg-blue-100 text-blue-800 mt-1 text-xs">
                            {proposalsCount} {proposalsCount === 1 ? "proposal" : "proposals"}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Avatar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                                  <AvatarFallback className="text-xs">
                                    {customerInitial}
                                  </AvatarFallback>
                          </Avatar>
                                <span className="text-xs sm:text-sm break-words">{customerName}</span>
                        </div>
                        {!isServiceRequest && (
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0">
                                    <AvatarFallback className="text-xs">
                                      {providerInitial}
                                    </AvatarFallback>
                            </Avatar>
                                  <span className="text-xs sm:text-sm break-words">{providerName}</span>
                          </div>
                        )}
                        {isServiceRequest && (
                          <div className="text-xs text-gray-500 italic">
                            Awaiting provider match
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                            <Badge className={`${getStatusColor(projectStatus, projectType)} text-xs`}>
                              {getStatusText(projectStatus, projectType)}
                            </Badge>
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                      {isServiceRequest ? (
                        <div className="text-xs sm:text-sm text-gray-500">
                          N/A
                        </div>
                      ) : (
                        <div className="space-y-1 min-w-[80px]">
                          <div className="flex justify-between text-xs sm:text-sm">
                                  <span>{progress}%</span>
                            <span>
                                    {completedMilestones}/{totalMilestones}
                            </span>
                          </div>
                                <Progress value={progress} className="h-1.5 sm:h-2" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                      <div className="min-w-0">
                              <p className="font-medium text-xs sm:text-sm break-words">
                                RM{budgetMin.toLocaleString()} - RM{budgetMax.toLocaleString()}
                              </p>
                      </div>
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                      <div className="min-w-0">
                              <p className="text-xs sm:text-sm break-words">
                                {projectTimeline}
                              </p>
                              <p className="text-xs text-gray-500">
                                {createdDateStr}
                              </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right p-3 sm:p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                            <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs sm:text-sm">
                          <DropdownMenuLabel className="text-xs sm:text-sm">Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/projects/${projectId}`} className="text-xs sm:text-sm">
                            <Eye className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            View Details
                                  </Link>
                          </DropdownMenuItem>
                                {disputesCount > 0 && !isServiceRequest && (
                                  <>
                          <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                      <Link href={`/admin/disputes`} className="text-xs sm:text-sm">
                              <AlertTriangle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                        View Disputes ({disputesCount})
                                      </Link>
                            </DropdownMenuItem>
                                  </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                      )
                    })
                  )}
              </TableBody>
            </Table>
            </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}

