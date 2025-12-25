"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Check,
  X,
  Clock,
  Star,
  MapPin,
  MessageSquare,
  Eye,
  Download,
  RefreshCw,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { CustomerLayout } from "@/components/customer-layout";
import { useToast } from "@/hooks/use-toast";
import {
  getCompanyProjectRequests,
  acceptProjectRequest,
  rejectProjectRequest,
  getProjectRequestStats,
  exportCompanyProjectRequests,
  getProfileImageUrl,
  getAttachmentUrl,
  getR2DownloadUrl,
} from "@/lib/api";
import {
  getCompanyProjectMilestones,
  updateCompanyProjectMilestones,
  approveCompanyMilestones,
  type Milestone,
} from "@/lib/api";
import Link from "next/link";

interface ProviderRequest {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  providerRating: number;
  providerLocation: string;
  providerResponseTime: string;
  projectId: string;
  projectTitle: string;
  bidAmount: number;
  proposedTimeline: string;
  coverLetter: string;
  status: "pending" | "accepted" | "rejected";
  submittedAt: string;
  skills: string[];
  portfolio: string[];
  experience: string;
  attachments: string[];
  milestones: Array<{
    title: string;
    description?: string; // backend may not send, so optional
    amount: number;
    dueDate: string;
    order: number;
  }>;
}

interface ApiProposal {
  id: string;
  serviceRequest: {
    id: string;
    title: string;
  };
  provider: {
    id: string;
    name: string;
    avatarUrl?: string;
    rating: number;
    location: string;
    responseTime: string;
    portfolio: string[];
    experience: string;
    skills: string[];
  };
  bidAmount: number;
  deliveryTime: number;
  coverLetter: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  submittedAt?: string;
  createdAt?: string;
  milestones: Array<{
    title: string;
    amount: number;
    dueDate: string;
    order: number;
  }>;
  attachmentUrls?: string[];
}

export default function CustomerRequestsPage() {
  const { toast: toastHook } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedRequest, setSelectedRequest] =
    useState<ProviderRequest | null>(null);
  const [viewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // API state
  const [requests, setRequests] = useState<ProviderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProposals: 0,
    openRequests: 0,
    matchedRequests: 0,
    averageProposalsPerRequest: 0,
  });
  const [projectOptions, setProjectOptions] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);
  const fmt = (v: unknown, fallback = "0") => {
    if (v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : fallback;
  };

  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [milestoneApprovalState, setMilestoneApprovalState] = useState({
    milestonesLocked: false,
    companyApproved: false,
    providerApproved: false,
    milestonesApprovedAt: null as string | null,
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [savingMilestones, setSavingMilestones] = useState(false);
  const [milestoneFinalizeOpen, setMilestoneFinalizeOpen] = useState(false);
  const [milestoneErrors, setMilestoneErrors] = useState<Record<number, {
    title?: string;
    description?: string;
    dueDate?: string;
  }>>({});
  const [originalMilestones, setOriginalMilestones] = useState<Milestone[]>([]);

  const normalizeSequences = (items: Milestone[]) =>
    items
      .map((m, i) => ({ ...m, sequence: i + 1 }))
      .sort((a, b) => a.sequence - b.sequence);

  const addMilestone = () => {
    setMilestones((prev) =>
      normalizeSequences([
        ...prev,
        {
          sequence: prev.length + 1,
          title: "",
          description: "",
          amount: 0,
          dueDate: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
        },
      ])
    );
  };

  const updateMilestone = (i: number, patch: Partial<Milestone>) => {
    setMilestones((prev) =>
      normalizeSequences(
        prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m))
      )
    );
  };

  const removeMilestone = (i: number) => {
    setMilestones((prev) =>
      normalizeSequences(prev.filter((_, idx) => idx !== i))
    );
  };

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [proposalsResponse, statsResponse] = await Promise.all([
          getCompanyProjectRequests({
            page: 1,
            limit: 100,
            search: searchQuery,
            proposalStatus:
              statusFilter === "all" ? undefined : statusFilter.toUpperCase(),
            serviceRequestId:
              projectFilter === "all" ? undefined : projectFilter,
            sort: sortBy,
          }),
          getProjectRequestStats(),
        ]);

        // Ensure we have arrays from the API responses (backend may return proposals|data|items)
        const proposals = Array.isArray(proposalsResponse?.proposals)
          ? proposalsResponse.proposals
          : Array.isArray(proposalsResponse?.data)
          ? proposalsResponse.data
          : Array.isArray(proposalsResponse?.items)
          ? proposalsResponse.items
          : [];
        const mappedRequests: ProviderRequest[] = proposals.map(
          (proposal: ApiProposal) => {
            const provider = (proposal as ApiProposal & { provider?: Record<string, unknown> }).provider || {};
            const profile = (provider as Record<string, unknown>).providerProfile as Record<string, unknown> || {};
            return {
              id: proposal.id,
              providerId: provider.id,
              providerName: provider.name,
              providerAvatar: getProfileImageUrl(profile.profileImageUrl as string | null | undefined),
              providerRating: profile.rating ?? provider.rating ?? 0,
              providerLocation: profile.location ?? provider.location ?? "",
              providerResponseTime:
                profile.responseTime ?? provider.responseTime ?? "",
              projectId: proposal.serviceRequest.id,
              projectTitle: proposal.serviceRequest.title,
              bidAmount: proposal.bidAmount,
              proposedTimeline: `${proposal.deliveryTime} days`,
              coverLetter: proposal.coverLetter,
              status: proposal.status.toLowerCase() as
                | "pending"
                | "accepted"
                | "rejected",
              submittedAt: proposal.createdAt || proposal.submittedAt,
              skills: Array.isArray(profile.skills)
                ? profile.skills
                : Array.isArray(provider.skills)
                ? provider.skills
                : [],
              portfolio: Array.isArray(profile.portfolios)
                ? profile.portfolios
                : Array.isArray(provider.portfolio)
                ? provider.portfolio
                : [],
              experience: profile.experience ?? provider.experience ?? "",
              attachments: Array.isArray(proposal.attachmentUrls)
                ? proposal.attachmentUrls
                : [],
              milestones: Array.isArray(proposal.milestones)
                ? proposal.milestones
                : [],
            };
          }
        );
        setRequests(mappedRequests);
        setStats(
          statsResponse?.stats ??
            statsResponse?.data ?? {
              totalProposals: 0,
              openRequests: 0,
              matchedRequests: 0,
              averageProposalsPerRequest: 0,
            }
        );

        // Build project options from unique service requests using the safe proposals array
        const uniqueProjects = proposals.reduce(
          (
            acc: Array<{ id: string; title: string }>,
            proposal: ApiProposal
          ) => {
            const existing = acc.find(
              (p) => p.id === proposal.serviceRequest.id
            );
            if (!existing) {
              acc.push({
                id: proposal.serviceRequest.id,
                title: proposal.serviceRequest.title,
              });
            }
            return acc;
          },
          []
        );
        setProjectOptions(uniqueProjects);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, statusFilter, projectFilter, sortBy]);

  // Since we're filtering on the server side, we can use requests directly
  const filteredRequests = requests.sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()
        );
      case "highest-bid":
        return b.bidAmount - a.bidAmount;
      case "lowest-bid":
        return a.bidAmount - b.bidAmount;
      case "rating":
        return b.providerRating - a.providerRating;
      default:
        return 0;
    }
  });

  const handleAcceptRequest = async (proposalId: string) => {
    try {
      setProcessingId(proposalId);
      const response = await acceptProjectRequest(proposalId, true);

      // Get the created project ID from the response
      const projectId = response?.id || response?.project?.id;

      // Optimistic status update
      setRequests((prev) =>
        prev.map((req) =>
          req.id === proposalId ? { ...req, status: "accepted" as const } : req
        )
      );

      // Immediately load project milestones for edit
      if (projectId) {
        const milestoneData = await getCompanyProjectMilestones(projectId);
        const loadedMilestones = Array.isArray(milestoneData.milestones)
          ? milestoneData.milestones.map((m) => ({ ...m, sequence: m.order }))
          : [];
        setMilestones(loadedMilestones);
        setOriginalMilestones(JSON.parse(JSON.stringify(loadedMilestones))); // Deep copy
        setMilestoneApprovalState({
          milestonesLocked: milestoneData.milestonesLocked,
          companyApproved: milestoneData.companyApproved,
          providerApproved: milestoneData.providerApproved,
          milestonesApprovedAt: milestoneData.milestonesApprovedAt,
        });
        setActiveProjectId(projectId);
        setMilestonesOpen(true);
      }

      toastHook({
        title: "Request Accepted",
        description: "Edit milestones and confirm to finalize.",
      });
    } catch (err) {
      toastHook({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to accept request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleSaveMilestones = async () => {
    if (!activeProjectId) return;

    // Validate milestones
    const errors: Record<number, { title?: string; description?: string; dueDate?: string }> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let hasErrors = false;

    milestones.forEach((m, idx) => {
      const milestoneErrors: { title?: string; description?: string; dueDate?: string } = {};
      
      if (!m.title || !m.title.trim()) {
        milestoneErrors.title = "Title is required.";
        hasErrors = true;
      }
      
      if (!m.description || !m.description.trim()) {
        milestoneErrors.description = "Description is required.";
        hasErrors = true;
      }
      
      if (!m.dueDate) {
        milestoneErrors.dueDate = "Due date is required.";
        hasErrors = true;
      } else {
        const dueDate = new Date(m.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate < today) {
          milestoneErrors.dueDate = "Due date cannot be in the past. Please select today or a future date.";
          hasErrors = true;
        }
      }
      
      if (Object.keys(milestoneErrors).length > 0) {
        errors[idx] = milestoneErrors;
      }
    });

    // Validate milestone sum equals bid amount
    const bidAmount = selectedRequest?.bidAmount || 0;
    if (bidAmount > 0) {
      const sumMilestones = milestones.reduce(
        (sum: number, m: Milestone) => {
          const val = Number(m.amount);
          if (!isNaN(val)) return sum + val;
          return sum;
        },
        0
      );

      if (sumMilestones !== bidAmount) {
        const msg = `Total of milestones (RM ${sumMilestones.toLocaleString()}) must equal the bid amount (RM ${bidAmount.toLocaleString()}).`;
        errors[-1] = { title: msg }; // Use -1 as a special index for general error
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setMilestoneErrors(errors);
      toastHook({
        title: "Validation Error",
        description: "Please fill in all required milestone fields (title, description, due date) and ensure dates are not in the past. Also ensure milestone amounts sum equals the bid amount.",
        variant: "destructive",
      });
      return;
    }

    setMilestoneErrors({});

    try {
      setSavingMilestones(true);
      const payload = normalizeSequences(milestones).map((m) => ({
        ...m,
        amount: Number(m.amount),
        dueDate: new Date(m.dueDate).toISOString(),
      }));
      const res = await updateCompanyProjectMilestones(
        activeProjectId,
        payload
      );
      setMilestoneApprovalState({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });
      
      // Refresh milestones from API
      const milestoneData = await getCompanyProjectMilestones(activeProjectId);
      const refreshedMilestones = Array.isArray(milestoneData.milestones)
        ? milestoneData.milestones.map((m: Record<string, unknown>) => ({
            ...m,
            sequence: (m.order as number) ?? (m.sequence as number) ?? 0,
          } as Milestone))
        : [];
      
      // Update both current and original milestones with fresh data
      setMilestones(refreshedMilestones);
      setOriginalMilestones(JSON.parse(JSON.stringify(refreshedMilestones)));

      toastHook({
        title: "Milestones updated",
        description: "Milestone changes have been saved.",
      });
    } catch (e) {
      toastHook({
        title: "Save failed",
        description:
          e instanceof Error ? e.message : "Could not save milestones",
        variant: "destructive",
      });
    } finally {
      setSavingMilestones(false);
    }
  };

  const handleApproveAcceptedMilestones = async () => {
    if (!activeProjectId) return;

    try {
      const res = await approveCompanyMilestones(activeProjectId);

      setMilestoneApprovalState({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      // 1. Close the milestone editor dialog ALWAYS
      setMilestonesOpen(false);

      // 2. Toast feedback
      toastHook({
        title: "Milestones approved",
        description: res.milestonesLocked
          ? "Milestones are now locked. Work can start and payments will follow these milestones."
          : "Waiting for provider to approve.",
      });

      // 3. Open summary / receipt dialog
      setMilestoneFinalizeOpen(true);
    } catch (e) {
      toastHook({
        title: "Approval failed",
        description:
          e instanceof Error ? e.message : "Could not approve milestones",
        variant: "destructive",
      });
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      setProcessingId(requestId);
      await rejectProjectRequest(requestId, reason);

      // Update local state optimistically
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId ? { ...req, status: "rejected" as const } : req
        )
      );

      setRejectDialogOpen(false);
      setRejectReason("");

      toastHook({
        title: "Request Rejected",
        description: "The provider has been notified about the rejection.",
      });
    } catch (err) {
      toastHook({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleViewDetails = (request: ProviderRequest) => {
    setSelectedRequest(request);
    setViewDetailsOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const displayStats = {
    total: stats.totalProposals,
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  return (
    <CustomerLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Provider Requests
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Manage requests from providers for your projects
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const blob = await exportCompanyProjectRequests({
                    search: searchQuery,
                    proposalStatus: statusFilter !== "all" ? statusFilter.toUpperCase() : undefined,
                    serviceRequestId: projectFilter !== "all" ? projectFilter : undefined,
                  });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `provider-requests-${Date.now()}.pdf`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                  toastHook({
                    title: "Export successful",
                    description: "Requests exported as PDF",
                  });
                } catch (err) {
                  toastHook({
                    title: "Export failed",
                    description: err instanceof Error ? err.message : "Failed to export requests",
                    variant: "destructive",
                  });
                }
              }}
              className="text-xs sm:text-sm w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Export
            </Button>
            <Button variant="outline" className="text-xs sm:text-sm w-full sm:w-auto">
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">
                    Total Requests
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">
                    {displayStats.total}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                    {displayStats.pending}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Accepted</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600">
                    {displayStats.accepted}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600">
                    {displayStats.rejected}
                  </p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by provider name or project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40 text-sm sm:text-base">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projectOptions.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-40 text-sm sm:text-base">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                    <SelectItem value="highest-bid">Highest Bid</SelectItem>
                    <SelectItem value="lowest-bid">Lowest Bid</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests List */}
        <div className="space-y-3 sm:space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4 animate-spin" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Loading requests...
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Please wait while we fetch your provider requests.
                </p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <X className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  Error loading requests
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                  className="text-xs sm:text-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 sm:p-12 text-center">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1.5 sm:mb-2">
                  No requests found
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  No provider requests match your current filters.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredRequests.map((request) => (
              <Card
                key={request.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 sm:p-5 lg:p-6">
                  <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6">
                    {/* Provider Info */}
                    <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                      <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                        <AvatarImage
                          src={
                            request.providerAvatar && 
                            request.providerAvatar !== "/placeholder.svg?height=40&width=40" &&
                            !request.providerAvatar.includes("/placeholder.svg")
                              ? request.providerAvatar
                              : "/placeholder.svg"
                          }
                        />
                        <AvatarFallback className="text-xs sm:text-sm">
                          {String(request.providerName || "")
                            .split(" ")
                            .filter(Boolean)
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        {/* Name + rating */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900">
                            {request.providerName}
                          </h3>
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                            <span className="text-xs sm:text-sm text-gray-600">
                              {request.providerRating}
                            </span>
                          </div>
                        </div>

                        {/* Location + response time */}
                        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 mb-1.5 sm:mb-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="truncate">{request.providerLocation || "—"}</span>
                          </div>
                        </div>

                        {/* Project title */}
                        <p className="text-xs sm:text-sm font-medium text-gray-900 mb-1 break-words">
                          {request.projectTitle}
                        </p>

                        {/* Cover letter */}
                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-1.5 sm:mb-2">
                          {request.coverLetter}
                        </p>

                        {/* ⬅ NEW: skills preview */}
                        <div className="flex flex-wrap gap-1">
                          {asArray<string>(request.skills)
                            .slice(0, 3)
                            .map((skill) => (
                              <Badge
                                key={skill}
                                variant="secondary"
                                className="text-[10px] leading-tight"
                              >
                                {skill}
                              </Badge>
                            ))}
                          {asArray<string>(request.skills).length > 3 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] leading-tight"
                            >
                              +{asArray<string>(request.skills).length - 3} more
                            </Badge>
                          )}
                        </div>

                        {/* ⬅ NEW: short experience line */}
                        {request.experience && (
                          <p className="text-[11px] sm:text-[12px] text-gray-500 mt-1.5 sm:mt-2 line-clamp-1">
                            {request.experience} experience
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="lg:w-80 space-y-2.5 sm:space-y-3">
                      <div className="flex justify-between items-center">
                        <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </Badge>
                        <span className="text-xs sm:text-sm text-gray-500">
                          {request.submittedAt && !isNaN(new Date(request.submittedAt).getTime())
                            ? new Date(request.submittedAt).toLocaleDateString()
                            : "—"}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">Bid Amount</p>
                          <p className="font-semibold text-base sm:text-lg">
                            RM{fmt(request.bidAmount)}
                          </p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className="text-xs sm:text-sm text-gray-600">Timeline</p>
                          <p className="font-medium text-sm sm:text-base">
                            {request.proposedTimeline}
                          </p>
                        </div>
                      </div>



                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2">
                        {/* View profile - always visible */}
                        <Link
                          href={`/customer/providers/${request.providerId}`}
                          className="flex-1 min-w-[120px]"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs sm:text-sm"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>

                        {/* View details dialog (proposal info) */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(request)}
                          className="flex-1 min-w-[120px] text-xs sm:text-sm"
                        >
                          <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                          View Details
                        </Button>

                        {/* Accept / Reject if pending */}
                        {request.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRequest(request.id)}
                              className="bg-green-600 hover:bg-green-700 flex-1 min-w-[120px] text-xs sm:text-sm"
                              disabled={processingId === request.id}
                            >
                              {processingId === request.id ? (
                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                              )}
                              {processingId === request.id
                                ? "Accepting..."
                                : "Accept"}
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setRejectDialogOpen(true);
                              }}
                              className="text-red-600 hover:text-red-700 flex-1 min-w-[120px] text-xs sm:text-sm"
                              disabled={processingId === request.id}
                            >
                              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsOpen} onOpenChange={setViewDetailsOpen}>
          <DialogContent className="max-w-xl sm:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto">
            {selectedRequest && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-base sm:text-lg">Request Details</DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm">
                    Detailed information about {selectedRequest.providerName}&apos;s
                    request
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                  {/* Provider Info */}
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <Avatar className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex-shrink-0 mx-auto sm:mx-0">
                      <AvatarImage
                        src={
                          selectedRequest.providerAvatar && 
                          selectedRequest.providerAvatar !== "/placeholder.svg?height=40&width=40" &&
                          !selectedRequest.providerAvatar.includes("/placeholder.svg")
                            ? selectedRequest.providerAvatar
                            : "/placeholder.svg"
                        }
                      />
                      <AvatarFallback>
                        {String(selectedRequest.providerName || "")
                          .split(" ")
                          .filter(Boolean)
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
                      {/* Name + rating */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg lg:text-xl font-semibold break-words">
                            {selectedRequest.providerName}
                          </h3>

                          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                              <span>
                                {selectedRequest.providerRating} rating
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{selectedRequest.providerLocation || "—"}</span>
                            </div>

                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="truncate">{selectedRequest.providerResponseTime} response time</span>
                            </div>
                          </div>

                          {selectedRequest.experience && (
                            <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2 break-words">
                              {selectedRequest.experience} experience
                            </p>
                          )}

                          {/* ⬅ NEW: top skills inline preview */}
                          <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2 justify-center sm:justify-start">
                            {asArray<string>(selectedRequest.skills)
                              .slice(0, 4)
                              .map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-[10px] leading-tight"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            {asArray<string>(selectedRequest.skills).length >
                              4 && (
                              <Badge
                                variant="secondary"
                                className="text-[10px] leading-tight"
                              >
                                +
                                {asArray<string>(selectedRequest.skills)
                                  .length - 4}{" "}
                                more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* ⬅ NEW: View profile button */}
                        <Link
                          href={`/customer/providers/${selectedRequest.providerId}`}
                          className="self-center sm:self-start"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center text-xs sm:text-sm w-full sm:w-auto"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Project & Bid Info */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Project</h4>
                      <p className="text-xs sm:text-sm text-gray-900 break-words">
                        {selectedRequest.projectTitle}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Bid Amount</h4>
                      <p className="text-xl sm:text-2xl font-bold text-green-600">
                        RM{fmt(selectedRequest.bidAmount)}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Proposed Timeline</h4>
                      <p className="text-xs sm:text-sm text-gray-900">
                        {selectedRequest.proposedTimeline}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Status</h4>
                      <Badge className={`text-xs ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status.charAt(0).toUpperCase() +
                          selectedRequest.status.slice(1)}
                      </Badge>
                    </div>
                  </div>

                  <Separator />

                  {/* Cover Letter */}
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Cover Letter</h4>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {selectedRequest.coverLetter}
                      </p>
                    </div>
                  </div>

                  {/* Skills */}
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {asArray<string>(selectedRequest.skills).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-[10px] sm:text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Portfolio */}
                  {/* <div>
                    <h4 className="font-semibold mb-2">Portfolio</h4>
                    <div className="space-y-2">
                      {asArray<string>(selectedRequest.portfolio).map(
                        (link, index) => (
                          <a
                            key={index}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-blue-600 hover:text-blue-800 underline"
                          >
                            {link}
                          </a>
                        )
                      )}
                    </div>
                  </div> */}
                  {/* Proposed Milestones */}
                  {selectedRequest.milestones &&
                    selectedRequest.milestones.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-sm sm:text-base mb-2">
                          Proposed Milestones
                        </h4>

                        <div className="space-y-3 sm:space-y-4">
                          {selectedRequest.milestones
                            .sort((a, b) => a.order - b.order)
                            .map((m, idx) => (
                              <Card
                                key={idx}
                                className="border border-gray-200"
                              >
                                <CardContent className="p-3 sm:p-4 space-y-2">
                                  {/* Top row: title + amount */}
                                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Badge variant="secondary" className="text-[10px] sm:text-xs flex-shrink-0">
                                        #{m.order || idx + 1}
                                      </Badge>
                                      <span className="font-medium text-xs sm:text-sm text-gray-900 break-words">
                                        {m.title || "Untitled milestone"}
                                      </span>
                                    </div>

                                    <div className="text-left sm:text-right">
                                      <span className="text-xs sm:text-sm text-gray-500 block">
                                        Amount
                                      </span>
                                      <span className="text-base sm:text-lg font-semibold text-gray-900">
                                        RM{" "}
                                        {Number(m.amount || 0).toLocaleString()}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Description */}
                                  {m.description &&
                                    m.description.trim() !== "" && (
                                      <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words">
                                        {m.description}
                                      </p>
                                    )}

                                  {/* Dates */}
                                  <div className="text-xs sm:text-sm text-gray-600 flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1">
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                      <span>
                                        Due:{" "}
                                        {m.dueDate
                                          ? new Date(
                                              m.dueDate
                                            ).toLocaleDateString()
                                          : "—"}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Attachments */}
                  {Array.isArray(selectedRequest.attachments) &&
                    selectedRequest.attachments.length > 0 && (
                      <div className="mt-4 sm:mt-5 lg:mt-6">
                        <h4 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3 flex items-center text-gray-900">
                          Attachments
                        </h4>

                        <div className="space-y-2">
                          {selectedRequest.attachments.map((rawUrl, idx) => {
                            // rawUrl can look like: "uploads\proposals\1761857633365_Screenshots.pdf" or R2 key
                            // We normalize slashes and extract filename.
                            const normalized = rawUrl.replace(/\\/g, "/"); // -> "uploads/proposals/..." or R2 key
                            const fileName =
                              normalized.split("/").pop() || `file-${idx + 1}`;

                            // Use getAttachmentUrl helper for consistent URL handling
                            const attachmentUrl = getAttachmentUrl(rawUrl);
                            const isR2Key = attachmentUrl === "#" || (!attachmentUrl.startsWith("http") && !attachmentUrl.startsWith("/uploads/") && !attachmentUrl.includes(process.env.NEXT_PUBLIC_API_URL || "localhost"));

                            return (
                              <a
                                key={idx}
                                href={attachmentUrl === "#" ? undefined : attachmentUrl}
                                download={fileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={isR2Key ? async (e) => {
                                  e.preventDefault();
                                  try {
                                    const downloadUrl = await getR2DownloadUrl(rawUrl); // Use original URL/key
                                    window.open(downloadUrl.downloadUrl, "_blank");
                                  } catch (error) {
                                    console.error("Failed to get download URL:", error);
                                    toastHook({
                                      title: "Error",
                                      description: "Failed to download attachment",
                                      variant: "destructive",
                                    });
                                  }
                                } : undefined}
                                className="flex items-start gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-2.5 sm:px-3 py-2 hover:bg-gray-50 hover:shadow-sm transition"
                              >
                                {/* Icon circle */}
                                <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-[10px] sm:text-xs font-medium">
                                  {/* If you want, you can make this dynamic based on extension */}
                                  PDF
                                </div>

                                {/* File info */}
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-xs sm:text-sm font-medium text-gray-900 break-all leading-snug">
                                    {fileName}
                                  </span>
                                  <span className="text-[10px] sm:text-xs text-gray-500 leading-snug">
                                    Click to preview / download
                                  </span>
                                </div>

                                {/* Download icon on the far right */}
                                <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700 flex-shrink-0">
                                  <svg
                                    className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <path d="M7 10l5 5 5-5" />
                                    <path d="M12 15V3" />
                                  </svg>
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  {selectedRequest.status === "pending" && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setRejectDialogOpen(true);
                          setViewDetailsOpen(false);
                        }}
                        className="text-red-600 hover:text-red-700 text-xs sm:text-sm w-full sm:w-auto"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Reject
                      </Button>
                      <Button
                        onClick={() => {
                          handleAcceptRequest(selectedRequest.id);
                          setViewDetailsOpen(false);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm w-full sm:w-auto"
                        disabled={processingId === selectedRequest.id}
                      >
                        {processingId === selectedRequest.id ? (
                          <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                        ) : (
                          <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        )}
                        {processingId === selectedRequest.id
                          ? "Accepting..."
                          : "Accept Request"}
                      </Button>
                    </div>
                  )}
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
          <DialogContent className="max-w-xl sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">Reject Request</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Please provide a reason for rejecting this request. This will
                help the provider improve their future proposals.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 sm:space-y-4">
              <div>
                <Label htmlFor="rejectReason" className="text-sm sm:text-base">Reason for rejection</Label>
                <Textarea
                  id="rejectReason"
                  placeholder="Please explain why you're rejecting this request..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="text-sm sm:text-base mt-1.5"
                />
              </div>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setRejectDialogOpen(false)}
                className="text-xs sm:text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  selectedRequest &&
                  handleRejectRequest(selectedRequest.id, rejectReason)
                }
                className="bg-red-600 hover:bg-red-700 text-xs sm:text-sm w-full sm:w-auto"
                disabled={
                  !rejectReason.trim() || processingId === selectedRequest?.id
                }
              >
                {processingId === selectedRequest?.id ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Request"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={milestonesOpen} onOpenChange={setMilestonesOpen}>
        <DialogContent className="max-w-xl sm:max-w-2xl lg:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Edit Milestones</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Company {milestoneApprovalState.companyApproved ? "✓" : "✗"} ·
              Provider {milestoneApprovalState.providerApproved ? "✓" : "✗"}
              {milestoneApprovalState.milestonesLocked && " · LOCKED"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {milestoneErrors[-1]?.title && (
              <div className="p-2.5 sm:p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-xs sm:text-sm text-red-600 font-medium">
                  {milestoneErrors[-1].title}
                </p>
              </div>
            )}
            {milestones.map((m, i) => (
              <Card key={i}>
                <CardContent className="p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3">
                    <div className="sm:col-span-1">
                      <Label className="text-xs sm:text-sm">Seq</Label>
                      <Input type="number" value={i + 1} disabled className="text-xs sm:text-sm" />
                    </div>
                    <div className="sm:col-span-4">
                      <Label className="text-xs sm:text-sm">
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={m.title}
                        onChange={(e) => {
                          updateMilestone(i, { title: e.target.value });
                          if (milestoneErrors[i]?.title) {
                            setMilestoneErrors(prev => ({
                              ...prev,
                              [i]: { ...prev[i], title: undefined },
                            }));
                          }
                        }}
                        className={`text-xs sm:text-sm ${
                          milestoneErrors[i]?.title
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                      />
                      {milestoneErrors[i]?.title && (
                        <p className="text-xs text-red-600 mt-1">
                          {milestoneErrors[i].title}
                        </p>
                      )}
                    </div>
                    <div className="sm:col-span-3">
                      <Label className="text-xs sm:text-sm">Amount</Label>
                      <Input
                        type="number"
                        value={String(m.amount ?? 0)}
                        onChange={(e) => {
                          updateMilestone(i, { amount: Number(e.target.value) });
                          // Clear sum error when amount changes
                          if (milestoneErrors[-1]) {
                            setMilestoneErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors[-1];
                              return newErrors;
                            });
                          }
                        }}
                        className="text-xs sm:text-sm"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <Label className="text-xs sm:text-sm">
                        Due Date <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={(m.dueDate || "").slice(0, 10)}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          const today = new Date().toISOString().split("T")[0];
                          if (selectedDate < today) {
                            toastHook({
                              title: "Invalid Date",
                              description:
                                "Due date cannot be in the past. Please select today or a future date.",
                              variant: "destructive",
                            });
                            return;
                          }
                          updateMilestone(i, { dueDate: selectedDate });
                          if (milestoneErrors[i]?.dueDate) {
                            setMilestoneErrors(prev => ({
                              ...prev,
                              [i]: { ...prev[i], dueDate: undefined },
                            }));
                          }
                        }}
                        className={`text-xs sm:text-sm ${
                          milestoneErrors[i]?.dueDate
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }`}
                      />
                      {milestoneErrors[i]?.dueDate && (
                        <p className="text-xs text-red-600 mt-1">
                          {milestoneErrors[i].dueDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      rows={2}
                      value={m.description || ""}
                      onChange={(e) => {
                        updateMilestone(i, { description: e.target.value });
                        if (milestoneErrors[i]?.description) {
                          setMilestoneErrors(prev => ({
                            ...prev,
                            [i]: { ...prev[i], description: undefined },
                          }));
                        }
                      }}
                      className={`text-xs sm:text-sm ${
                        milestoneErrors[i]?.description
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }`}
                    />
                    {milestoneErrors[i]?.description && (
                      <p className="text-xs text-red-600 mt-1">
                        {milestoneErrors[i].description}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => removeMilestone(i)}
                      className="text-xs sm:text-sm"
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
              <Button variant="outline" onClick={addMilestone} className="text-xs sm:text-sm w-full sm:w-auto">
                + Add Milestone
              </Button>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveMilestones}
                  disabled={savingMilestones}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  {savingMilestones ? "Saving..." : "Save Changes"}
                </Button>
                <Button 
                  onClick={handleApproveAcceptedMilestones}
                  disabled={
                    JSON.stringify(normalizeSequences(milestones)) !== 
                    JSON.stringify(normalizeSequences(originalMilestones))
                  }
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  Approve
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>
      <Dialog
        open={milestoneFinalizeOpen}
        onOpenChange={setMilestoneFinalizeOpen}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg lg:text-xl">Milestones Submitted</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              These milestones are now awaiting final confirmation, or have been
              locked if both sides approved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm text-gray-700">
            <div className="flex items-start gap-2.5 sm:gap-3">
              <CheckCircle
                className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${
                  milestoneApprovalState.companyApproved
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">
                  Company Approved
                </div>
                <div className="break-words">
                  {milestoneApprovalState.companyApproved
                    ? "You have approved the milestone plan."
                    : "You haven't approved yet."}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3">
              <CheckCircle
                className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${
                  milestoneApprovalState.providerApproved
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">
                  Provider Approved
                </div>
                <div className="break-words">
                  {milestoneApprovalState.providerApproved
                    ? "The provider approved the milestone plan."
                    : "Waiting for provider approval."}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3">
              <CheckCircle
                className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5 ${
                  milestoneApprovalState.milestonesLocked
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900">
                  Locked & Ready
                </div>
                <div className="break-words">
                  {milestoneApprovalState.milestonesLocked
                    ? "Milestones are locked. Work can start and payments follow these milestones."
                    : "Milestones are not locked yet."}
                </div>
                {milestoneApprovalState.milestonesApprovedAt && (
                  <div className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    Locked at{" "}
                    {new Date(
                      milestoneApprovalState.milestonesApprovedAt
                    ).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-3 sm:pt-4">
            <Button onClick={() => setMilestoneFinalizeOpen(false)} className="text-xs sm:text-sm w-full sm:w-auto">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CustomerLayout>
  );
}
