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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import {
  Plus,
  Search,
  Eye,
  MessageSquare,
  Calendar,
  Clock,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { CustomerLayout } from "@/components/customer-layout";
import { useRouter } from "next/navigation";
import {
  getCompanyProjects,
  updateCompanyProject,
  exportCompanyProjects,
  getProfileImageUrl,
} from "@/lib/api";
import { Download } from "lucide-react";

type ProjectProvider = {
  id?: string;
  name?: string;
  providerProfile?: {
    profileImageUrl?: string;
  };
};

type CustomerProject = {
  id: string;
  title: string;
  description: string;
  status: string;
  type: string;
  category: string;
  priority?: string;
  timeline?: string;
  budgetMin?: number;
  budgetMax?: number;
  approvedPrice?: number;
  progress?: number;
  completedMilestones?: number;
  totalMilestones?: number;
  createdAt: string;
  provider?: ProjectProvider;
  budget?: number;
  deadline?: string;
  isUrgent?: boolean;
};

export default function CustomerProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<CustomerProject | null>(
    null
  );
  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch projects on component mount
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getCompanyProjects({
          page: 1,
          limit: 100, // Get all projects for now
        });

        if (response.success) {
          setProjects((response.items || []) as CustomerProject[]);
        } else {
          setError("Failed to fetch projects");
        }
      } catch (err) {
        console.error("Error fetching projects:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch projects"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);
  const handleContact = (
    providerId?: string,
    providerName?: string,
    providerAvatar?: string
  ) => {
    if (!providerId || !providerName) return;
    router.push(
      `/customer/messages?userId=${providerId}&name=${encodeURIComponent(
        providerName
      )}&avatar=${encodeURIComponent(providerAvatar || "")}`
    );
  };
  const getStatusColor = (status: string, type: string) => {
    // ServiceRequest statuses
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

    // Project statuses
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

  const getStatusText = (status: string, type: string) => {
    // ServiceRequest statuses
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

    // Project statuses
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

  const getPriorityColor = (priority?: string) => {
    if (!priority) return "bg-gray-100 text-gray-800";
    const normalizedPriority = priority.toLowerCase();
    switch (normalizedPriority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.provider?.name &&
        project.provider.name
          .toLowerCase()
          .includes(searchQuery.toLowerCase())) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase());

    // Map status filter to actual statuses
    let matchesStatus = true;
    if (statusFilter !== "all") {
      if (statusFilter === "pending") {
        matchesStatus = project.status === "OPEN";
      } else if (statusFilter === "in_progress") {
        matchesStatus = project.status === "IN_PROGRESS";
      } else if (statusFilter === "completed") {
        matchesStatus = project.status === "COMPLETED";
      } else if (statusFilter === "disputed") {
        matchesStatus = project.status === "DISPUTED";
      } else {
        matchesStatus = project.status === statusFilter;
      }
    }

    return matchesSearch && matchesStatus;
  });

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "budget-high":
        return (b.budgetMax ?? 0) - (a.budgetMax ?? 0);
      case "budget-low":
        return (a.budgetMin ?? 0) - (b.budgetMin ?? 0);
      case "deadline":
        // For projects with timeline, sort by timeline length
        if (a.timeline && b.timeline) {
          return a.timeline.localeCompare(b.timeline);
        }
        return 0;
      case "progress":
        // For projects, use the progress field (already calculated by backend)
        const aProgress = a.type === "Project" ? a.progress || 0 : 0;
        const bProgress = b.type === "Project" ? b.progress || 0 : 0;
        return bProgress - aProgress;
      default:
        return 0;
    }
  });

  const handleSaveProject = async () => {
    if (!editingProject) return;
    try {
      // Prepare a minimal, safe payload: only send fields the user just edited.
      const payload: Record<string, unknown> = {
        title: editingProject.title,
        description: editingProject.description,
        category: editingProject.category,
        priority: editingProject.priority
          ? editingProject.priority.toLowerCase()
          : editingProject.priority,
      };

      // If you show separate min/max in your dialog later, include them here:
      if (
        Number.isFinite(editingProject.budgetMin) &&
        Number.isFinite(editingProject.budgetMax)
      ) {
        payload.budgetMin = Number(editingProject.budgetMin);
        payload.budgetMax = Number(editingProject.budgetMax);
      }

      if (editingProject.timeline) payload.timeline = editingProject.timeline;

      // If you add Requirements/Deliverables fields in the dialog later, send arrays:
      // payload.requirements = toLines(editingRequirementsText);
      // payload.deliverables = toLines(editingDeliverablesText);

      const { project: updated } = await updateCompanyProject(
        editingProject.id,
        payload
      );

      // Update local list
      setProjects((prev) =>
        prev.map((p) => (p.id === editingProject.id ? { ...p, ...updated } : p))
      );

      toast({
        title: "Project Updated",
        description: "Changes saved successfully.",
      });
      setIsEditDialogOpen(false);
      setEditingProject(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "Update failed",
        description:
          err instanceof Error ? err.message : "Could not update project",
        variant: "destructive",
      });
    }
  };

  const stats = {
    total: projects.length,
    active: projects.filter((p) => p.status === "IN_PROGRESS").length,
    completed: projects.filter((p) => p.status === "COMPLETED").length,
    pending: projects.filter((p) => p.status === "OPEN").length,
    disputed: projects.filter((p) => p.status === "DISPUTED").length,
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
              <span className="text-sm sm:text-base">Loading projects...</span>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error) {
    return (
      <CustomerLayout>
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
          <div className="flex items-center justify-center py-8 sm:py-12">
            <div className="text-center px-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                Error loading projects
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                size="sm"
                className="sm:size-default"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Projects
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage and track all your ICT projects
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const blob = await exportCompanyProjects({
                    search: searchQuery,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `customer-projects-${Date.now()}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  toast({
                    title: "Export successful",
                    description: "Projects exported as PDF",
                  });
                } catch (err) {
                  toast({
                    title: "Export failed",
                    description:
                      err instanceof Error
                        ? err.message
                        : "Failed to export projects",
                    variant: "destructive",
                  });
                }
              }}
              className="w-full sm:w-auto"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Link href="/customer/projects/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Total Projects
                  </p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Active</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 mt-1">
                    {stats.active}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Completed</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 mt-1">
                    {stats.completed}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600 mt-1">
                    {stats.pending}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Disputed</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600 mt-1">
                    {stats.disputed}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search projects..."
                    className="pl-10 text-sm sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="disputed">Disputed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="budget-high">
                    Budget: High to Low
                  </SelectItem>
                  <SelectItem value="budget-low">
                    Budget: Low to High
                  </SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="progress">Progress</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-end mt-3 sm:mt-4">
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="text-xs sm:text-sm"
                >
                  Grid
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="text-xs sm:text-sm"
                >
                  List
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Tabs
          value={viewMode}
          onValueChange={setViewMode}
          className="space-y-6"
        >
          <TabsContent value="grid">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {sortedProjects.map((project) => (
                <Card
                  key={project.id}
                  className="hover:shadow-lg transition-shadow flex flex-col h-full"
                >
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <CardTitle className="text-base sm:text-lg truncate">
                              {project.title}
                            </CardTitle>
                            <Badge
                              className={`${getStatusColor(
                                project.status,
                                project.type
                              )} text-xs`}
                            >
                              {getStatusText(project.status, project.type)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {project.type}
                            </Badge>
                            <Badge
                              className={`${getPriorityColor(
                                project.priority
                              )} text-xs`}
                              variant="outline"
                            >
                              {project.priority}
                            </Badge>
                            {(project.priority === "High" ||
                              project.priority === "high") && (
                              <Badge variant="destructive" className="text-xs">
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <CardDescription className="mt-1 line-clamp-3 text-xs sm:text-sm">
                            {project.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4 flex-1 flex flex-col p-4 sm:p-6 pt-0">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                        <AvatarImage
                          src={getProfileImageUrl(
                            project.provider?.providerProfile?.profileImageUrl
                          )}
                        />
                        <AvatarFallback>
                          {project.provider?.name
                            ? project.provider.name.charAt(0)
                            : project.type.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        {project.provider?.id && project.provider?.name ? (
                          <Link
                            href={`/customer/providers/${project.provider.id}`}
                            className="text-xs sm:text-sm font-medium hover:text-blue-600 hover:underline transition-colors truncate block"
                          >
                            {project.provider.name}
                          </Link>
                        ) : (
                          <p className="text-xs sm:text-sm font-medium truncate">
                            {project.provider?.name || "No Provider Assigned"}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 truncate">
                          {project.category}
                        </p>
                      </div>
                    </div>

                    {project.type === "Project" &&
                      project.status === "IN_PROGRESS" && (
                        <div>
                          <div className="flex justify-between text-xs sm:text-sm mb-1 flex-wrap gap-1">
                            <span>Progress: {project.progress || 0}%</span>
                            <span className="text-xs">
                              {project.completedMilestones || 0}/
                              {project.totalMilestones || 0} milestones
                            </span>
                          </div>
                          <Progress
                            value={project.progress || 0}
                            className="h-2"
                          />
                        </div>
                      )}

                    <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                      <div className="min-w-0">
                        <p className="text-gray-500 truncate">
                          {project.type === "Project" &&
                          (project.status === "IN_PROGRESS" ||
                            project.status === "COMPLETED") &&
                          project.approvedPrice
                            ? "Approved Price"
                            : "Budget"}
                        </p>
                        <p className="font-semibold truncate">
                          {project.type === "Project" &&
                          (project.status === "IN_PROGRESS" ||
                            project.status === "COMPLETED") &&
                          project.approvedPrice
                            ? `RM${project.approvedPrice.toLocaleString()}`
                            : `RM${
                                project.budgetMin?.toLocaleString() || 0
                              } - RM${
                                project.budgetMax?.toLocaleString() || 0
                              }`}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-gray-500 truncate">Timeline</p>
                        <p className="font-semibold truncate">
                          {project.timeline || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 flex-wrap gap-1">
                      <div className="flex items-center">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">
                          Created:{" "}
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {project.type === "Project" && (
                        <span className="text-xs">
                          {project.completedMilestones || 0}/
                          {project.totalMilestones || 0} milestones
                        </span>
                      )}
                    </div>

                    {project.type === "Project" &&
                      project.status === "COMPLETED" && (
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs sm:text-sm text-gray-500">
                            Status:
                          </span>
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Completed
                          </Badge>
                        </div>
                      )}

                    <div className="flex gap-2 mt-auto">
                      <Button
                        size="sm"
                        className="flex-1 text-xs sm:text-sm"
                        onClick={() =>
                          router.push(`/customer/projects/${project.id}`)
                        }
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs sm:text-sm"
                        onClick={() =>
                          handleContact(
                            project.provider?.id,
                            project.provider?.name,
                            project.provider?.providerProfile?.profileImageUrl
                          )
                        }
                      >
                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <Card>
              <CardContent className="p-0">
                <div className="divide-y">
                  {sortedProjects.map((project) => (
                    <div
                      key={project.id}
                      className="p-4 sm:p-5 lg:p-6 hover:bg-gray-50 transition-colors min-h-[200px] flex items-center"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full gap-4 sm:gap-6">
                        <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0 w-full sm:w-auto">
                          <Avatar className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12">
                            <AvatarImage
                              src={getProfileImageUrl(
                                project.provider?.providerProfile
                                  ?.profileImageUrl
                              )}
                            />
                            <AvatarFallback>
                              {project.provider?.name
                                ? project.provider.name.charAt(0)
                                : project.type.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-1 flex-wrap">
                              <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {project.title}
                              </h3>
                              <Badge
                                className={`${getStatusColor(
                                  project.status,
                                  project.type
                                )} text-xs`}
                              >
                                {getStatusText(project.status, project.type)}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {project.type}
                              </Badge>
                              <Badge
                                className={`${getPriorityColor(
                                  project.priority
                                )} text-xs`}
                                variant="outline"
                              >
                                {project.priority}
                              </Badge>
                              {(project.priority === "High" ||
                                project.priority === "high") && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  Urgent
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-2 sm:line-clamp-3">
                              {project.description}
                            </p>
                            <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 flex-wrap">
                              {project.provider?.id &&
                              project.provider?.name ? (
                                <Link
                                  href={`/customer/providers/${project.provider.id}`}
                                  className="hover:text-blue-600 hover:underline transition-colors truncate"
                                >
                                  {project.provider.name}
                                </Link>
                              ) : (
                                <span className="truncate">
                                  {project.provider?.name || "No Provider"}
                                </span>
                              )}
                              <span className="hidden sm:inline">•</span>
                              <span className="truncate">
                                {project.category}
                              </span>
                              <span className="hidden sm:inline">•</span>
                              <span className="truncate">
                                Created:{" "}
                                {new Date(
                                  project.createdAt
                                ).toLocaleDateString()}
                              </span>
                              {project.timeline && (
                                <>
                                  <span className="hidden sm:inline">•</span>
                                  <span className="truncate">
                                    Timeline: {project.timeline}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-6 flex-shrink-0 w-full sm:w-auto">
                          <div className="text-left sm:text-right w-full sm:w-auto">
                            <p className="text-xs sm:text-sm text-gray-500">
                              {project.type === "Project" &&
                              (project.status === "IN_PROGRESS" ||
                                project.status === "COMPLETED") &&
                              project.approvedPrice
                                ? "Approved Price"
                                : "Budget"}
                            </p>
                            <p className="font-semibold text-sm sm:text-base">
                              {project.type === "Project" &&
                              (project.status === "IN_PROGRESS" ||
                                project.status === "COMPLETED") &&
                              project.approvedPrice
                                ? `RM${project.approvedPrice.toLocaleString()}`
                                : `RM${
                                    project.budgetMin?.toLocaleString() || 0
                                  } - RM${
                                    project.budgetMax?.toLocaleString() || 0
                                  }`}
                            </p>
                          </div>
                          {project.type === "Project" &&
                            project.status === "IN_PROGRESS" && (
                              <div className="w-full sm:w-24">
                                <div className="flex justify-between text-xs mb-1 flex-wrap gap-1">
                                  <span>
                                    Progress: {project.progress || 0}%
                                  </span>
                                  <span>
                                    {project.completedMilestones || 0}/
                                    {project.totalMilestones || 0}
                                  </span>
                                </div>
                                <Progress
                                  value={project.progress || 0}
                                  className="h-2"
                                />
                              </div>
                            )}
                          <div className="flex gap-2 w-full sm:w-auto">
                            <Button
                              size="sm"
                              className="flex-1 sm:flex-initial text-xs sm:text-sm"
                              onClick={() =>
                                router.push(`/customer/projects/${project.id}`)
                              }
                            >
                              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-xs sm:text-sm"
                              onClick={(e) => {
                                e.preventDefault(); // prevents Link from triggering navigation
                                handleContact(
                                  project.provider?.id,
                                  project.provider?.name,
                                  project.provider?.providerProfile
                                    ?.profileImageUrl
                                );
                              }}
                            >
                              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Project Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Edit Project
              </DialogTitle>
              <DialogDescription className="text-sm sm:text-base">
                Update your project details
              </DialogDescription>
            </DialogHeader>
            {editingProject && (
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="edit-title" className="text-sm sm:text-base">
                    Project Title
                  </Label>
                  <Input
                    id="edit-title"
                    value={editingProject.title}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        title: e.target.value,
                      })
                    }
                    className="mt-1.5 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <Label
                    htmlFor="edit-description"
                    className="text-sm sm:text-base"
                  >
                    Description
                  </Label>
                  <Textarea
                    id="edit-description"
                    value={editingProject.description}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        description: e.target.value,
                      })
                    }
                    rows={3}
                    className="mt-1.5 text-sm sm:text-base"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label
                      htmlFor="edit-budget"
                      className="text-sm sm:text-base"
                    >
                      Budget (RM)
                    </Label>
                    <Input
                      id="edit-budget"
                      type="number"
                      value={editingProject.budget ?? ""}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          budget: e.target.value
                            ? Number.parseInt(e.target.value)
                            : undefined,
                        })
                      }
                      className="mt-1.5 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-deadline"
                      className="text-sm sm:text-base"
                    >
                      Deadline
                    </Label>
                    <Input
                      id="edit-deadline"
                      type="date"
                      value={editingProject.deadline ?? ""}
                      onChange={(e) =>
                        setEditingProject({
                          ...editingProject,
                          deadline: e.target.value,
                        })
                      }
                      className="mt-1.5 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label
                      htmlFor="edit-priority"
                      className="text-sm sm:text-base"
                    >
                      Priority
                    </Label>
                    <Select
                      value={editingProject.priority ?? ""}
                      onValueChange={(value) =>
                        setEditingProject({
                          ...editingProject,
                          priority: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1.5 text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label
                      htmlFor="edit-category"
                      className="text-sm sm:text-base"
                    >
                      Category
                    </Label>
                    <Select
                      value={editingProject.category ?? ""}
                      onValueChange={(value) =>
                        setEditingProject({
                          ...editingProject,
                          category: value,
                        })
                      }
                    >
                      <SelectTrigger className="mt-1.5 text-sm sm:text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="WEB_DEVELOPMENT">
                          Web Development
                        </SelectItem>
                        <SelectItem value="MOBILE_APP_DEVELOPMENT">
                          Mobile Development
                        </SelectItem>
                        <SelectItem value="DATA_ANALYTICS">
                          Data Analytics
                        </SelectItem>
                        <SelectItem value="CLOUD_SERVICES">
                          Cloud Services
                        </SelectItem>
                        <SelectItem value="UI_UX_DESIGN">
                          UI/UX Design
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-urgent"
                    checked={editingProject.isUrgent ?? false}
                    onChange={(e) =>
                      setEditingProject({
                        ...editingProject,
                        isUrgent: e.target.checked,
                      })
                    }
                    className="rounded"
                  />
                  <Label htmlFor="edit-urgent" className="text-sm sm:text-base">
                    Mark as urgent
                  </Label>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 pt-3 sm:pt-4">
                  <Button
                    onClick={handleSaveProject}
                    className="flex-1 sm:flex-initial text-sm sm:text-base"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                    className="text-sm sm:text-base"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Empty State */}
        {sortedProjects.length === 0 && (
          <Card>
            <CardContent className="p-8 sm:p-10 lg:p-12 text-center">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "You haven't created any projects yet."}
              </p>

              {!searchQuery && statusFilter === "all" && (
                <Link href="/customer/projects/new">
                  <Button className="text-sm sm:text-base">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </CustomerLayout>
  );
}
