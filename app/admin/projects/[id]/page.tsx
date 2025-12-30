"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminLayout } from "@/components/admin-layout";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminProjectById,
  updateAdminProject,
  getDisputesByProject,
  getProfileImageUrl,
  getAttachmentUrl,
  getR2DownloadUrl,
  getAdminPayments,
} from "@/lib/api";
import {
  ArrowLeft,
  Edit,
  Save,
  X,
  Loader2,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Paperclip,
  Download,
  Globe,
  MapPin,
  Star,
  Eye,
  MessageSquare,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { formatTimeline } from "@/lib/timeline-utils";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

// Type definitions
interface CustomerProfile {
  profileImageUrl?: string;
  location?: string;
  website?: string;
  industry?: string;
  companySize?: string;
}

interface Customer {
  id?: string;
  name?: string;
  email?: string;
  customerProfile?: CustomerProfile;
}

interface ProviderProfile {
  profileImageUrl?: string;
  location?: string;
  website?: string;
  rating?: number;
  totalProjects?: number;
  skills?: string[];
  yearsExperience?: number;
  portfolios?: Array<{
    externalUrl?: string;
    title?: string;
  }>;
}

interface Provider {
  id?: string;
  name?: string;
  email?: string;
  providerProfile?: ProviderProfile;
}

interface Milestone {
  id?: string;
  title?: string;
  description?: string;
  amount?: number;
  status?: string;
  dueDate?: string;
  submittedAt?: string;
  completedAt?: string;
  progress?: number;
  submissionAttachmentUrl?: string;
  submissionNote?: string;
  startDeliverables?: unknown;
  submitDeliverables?: unknown;
  revisionNumber?: number;
  submissionHistory?: Array<{
    submissionAttachmentUrl?: string;
    revisionNumber?: number;
    submittedAt?: string;
    submissionNote?: string;
    submitDeliverables?: unknown;
    requestedChangesReason?: string;
    requestedChangesAt?: string;
  }>;
}

interface Proposal {
  id?: string;
  provider?: Provider;
  proposedBudget?: number;
  bidAmount?: number;
  proposedTimeline?: string;
  deliveryTime?: number | string;
  message?: string;
  coverLetter?: string;
  status?: string;
  createdAt?: string;
  attachments?: string[];
  attachmentUrls?: string[];
  milestones?: Array<{
    id?: string;
    title?: string;
    description?: string;
    amount?: number;
    dueDate?: string;
    order?: number;
  }>;
}

interface Dispute {
  id?: string;
  reason?: string;
  description?: string;
  status?: string;
  attachments?: string[];
  raisedBy?: {
    name?: string;
  };
}

interface Project {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  status?: string;
  type?: string;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  originalTimeline?: string;
  providerProposedTimeline?: string;
  priority?: string;
  skills?: string[];
  requirements?: string | string[];
  deliverables?: string | string[];
  customer?: Customer;
  provider?: Provider;
  milestones?: Milestone[];
  proposals?: Proposal[];
  proposalsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  priority: string;
  status: string;
  requirements: string;
  deliverables: string;
  skills: string;
}

export default function AdminProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;
  const { toast: toastHook } = useToast();

  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [proposalDetailsOpen, setProposalDetailsOpen] = useState(false);
  const [selectedProposalDetails, setSelectedProposalDetails] =
    useState<Proposal | null>(null);
  const [milestonePayments, setMilestonePayments] = useState<
    Map<string, string>
  >(new Map());
  const [messages, setMessages] = useState<Array<Record<string, unknown>>>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const loadProject = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminProjectById(projectId);
      if (response.success) {
        const projectData = response.data as Project;
        setProject(projectData);
        initializeFormData(projectData);
      }
    } catch (error: unknown) {
      toastHook({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load project",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toastHook]);

  const loadDisputes = useCallback(async () => {
    try {
      const response = await getDisputesByProject(projectId);
      if (response.success) {
        setDisputes((response.data || []) as Dispute[]);
      }
    } catch (error: unknown) {
      console.error("Failed to load disputes:", error);
    }
  }, [projectId]);

  const loadPayments = useCallback(async () => {
    try {
      // Fetch all payments and filter by projectId
      const response = await getAdminPayments({ limit: 1000 });
      if (response.success && response.data) {
        // response.data is already the payments array (not response.data.payments)
        const payments = (
          Array.isArray(response.data) ? response.data : []
        ) as Array<{
          id: string;
          milestoneId?: string;
          projectId?: string;
        }>;
        // Filter payments for this project and create milestoneId -> paymentId mapping
        const projectPayments = payments.filter(
          (p) => p.projectId === projectId
        );
        const milestonePaymentMap = new Map<string, string>();
        projectPayments.forEach((payment) => {
          if (payment.milestoneId) {
            milestonePaymentMap.set(payment.milestoneId, payment.id);
          }
        });
        setMilestonePayments(milestonePaymentMap);
        console.log(
          "Loaded payments for project:",
          projectId,
          "Mapped milestones:",
          Array.from(milestonePaymentMap.entries())
        );
      }
    } catch (error: unknown) {
      console.error("Failed to load payments:", error);
    }
  }, [projectId]);

  const loadMessages = useCallback(async () => {
    if (!projectId) return;
    try {
      setLoadingMessages(true);
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : undefined;
      if (!token) {
        console.error("No token found");
        return;
      }

      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        }/messages/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setMessages(data.data);
      } else {
        setMessages([]);
      }
    } catch (error: unknown) {
      console.error("Failed to load messages:", error);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
    loadDisputes();
    loadPayments();
  }, [loadProject, loadDisputes, loadPayments]);

  useEffect(() => {
    if (project?.id) {
      loadMessages();
    }
  }, [project?.id, loadMessages]);

  const initializeFormData = (projectData: Project) => {
    const requirements =
      typeof projectData.requirements === "string"
        ? projectData.requirements
        : Array.isArray(projectData.requirements)
        ? projectData.requirements.map((r) => `- ${String(r)}`).join("\n")
        : "";

    const deliverables =
      typeof projectData.deliverables === "string"
        ? projectData.deliverables
        : Array.isArray(projectData.deliverables)
        ? projectData.deliverables.map((d) => `- ${String(d)}`).join("\n")
        : "";

    setFormData({
      title: projectData.title || "",
      description: projectData.description || "",
      category: projectData.category || "",
      budgetMin: projectData.budgetMin || 0,
      budgetMax: projectData.budgetMax || 0,
      timeline: projectData.timeline || projectData.originalTimeline || "",
      priority: projectData.priority || "medium",
      status: projectData.status || "IN_PROGRESS",
      requirements: requirements,
      deliverables: deliverables,
      skills: Array.isArray(projectData.skills)
        ? projectData.skills.join(", ")
        : "",
    });
  };

  const handleFieldChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleSave = async () => {
    if (!formData || !project) return;

    try {
      setSaving(true);

      const isServiceRequest = project.type === "serviceRequest";

      const updateData: Record<string, unknown> = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        budgetMin: formData.budgetMin,
        budgetMax: formData.budgetMax,
        timeline: formData.timeline,
        priority: formData.priority,
      };

      if (!isServiceRequest && formData.status) {
        updateData.status = formData.status;
      }

      if (formData.skills) {
        const skillsArray = formData.skills
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        if (skillsArray.length > 0) {
          updateData.skills = skillsArray;
        }
      }

      if (
        formData.requirements !== undefined &&
        formData.requirements !== null
      ) {
        updateData.requirements = formData.requirements.trim() || null;
      }
      if (
        formData.deliverables !== undefined &&
        formData.deliverables !== null
      ) {
        updateData.deliverables = formData.deliverables.trim() || null;
      }

      const response = await updateAdminProject(projectId, updateData);
      if (response.success) {
        toastHook({
          title: "Success",
          description: "Project updated successfully",
        });
        setIsEditing(false);
        loadProject();
      }
    } catch (error: unknown) {
      toastHook({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update project",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (project) {
      initializeFormData(project);
      setIsEditing(false);
    }
  };

  const getStatusColor = (status: string, type?: string) => {
    if (type === "serviceRequest") {
      return "bg-yellow-100 text-yellow-800";
    }

    switch (status?.toUpperCase()) {
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "DISPUTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string, type?: string) => {
    if (type === "serviceRequest") {
      return "Open Opportunity";
    }
    return status?.replace("_", " ") || status;
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return "bg-green-100 text-green-800";
      case "APPROVED":
        return "bg-green-100 text-green-700";
      case "SUBMITTED":
        return "bg-yellow-100 text-yellow-800";
      case "IN_PROGRESS":
        return "bg-blue-100 text-blue-800";
      case "LOCKED":
        return "bg-purple-100 text-purple-800";
      case "PENDING":
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "DISPUTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMilestoneStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return "Paid";
      case "APPROVED":
        return "Approved";
      case "SUBMITTED":
        return "Submitted";
      case "IN_PROGRESS":
        return "In Progress";
      case "LOCKED":
        return "Locked";
      case "PENDING":
        return "Pending";
      case "DRAFT":
        return "Draft";
      case "DISPUTED":
        return "Disputed";
      default:
        return status;
    }
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PAID":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "APPROVED":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "SUBMITTED":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "IN_PROGRESS":
        return <Clock className="w-5 h-5 text-blue-600" />;
      case "LOCKED":
        return <CheckCircle className="w-5 h-5 text-purple-600" />;
      case "PENDING":
      case "DRAFT":
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
      case "DISPUTED":
        return <AlertTriangle className="w-5 h-5 text-red-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return `RM${amount.toLocaleString()}`;
  };

  // Helper functions for message attachments
  const isImage = (file: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file);
  const isPDF = (file: string) => /\.pdf$/i.test(file);
  const getFullUrl = (path: string) => {
    const normalized = path.replace(/\\/g, "/");
    return normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        }/${normalized.replace(/^\//, "")}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px] px-4 sm:px-6 lg:px-0">
          <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout>
        <div className="text-center py-8 sm:py-12 px-4 sm:px-6 lg:px-0">
          <p className="text-sm sm:text-base text-gray-500">
            Project not found
          </p>
          <Link href="/admin/projects">
            <Button className="mt-3 sm:mt-4 text-xs sm:text-sm">
              Back to Projects
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const isServiceRequest = project.type === "serviceRequest";
  const milestonesArray = project.milestones || [];
  const completedMilestones = milestonesArray.filter(
    (m) => m.status === "APPROVED" || m.status === "PAID"
  ).length;
  const totalMilestones = milestonesArray.length;
  const progress = isServiceRequest
    ? 0
    : totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;
  const approvedPrice = milestonesArray.reduce(
    (sum, m) => sum + (m.amount || 0),
    0
  );

  const requirements =
    typeof project.requirements === "string"
      ? project.requirements
      : Array.isArray(project.requirements)
      ? project.requirements.map((r) => `- ${String(r)}`).join("\n")
      : "";

  const deliverables =
    typeof project.deliverables === "string"
      ? project.deliverables
      : Array.isArray(project.deliverables)
      ? project.deliverables.map((d) => `- ${String(d)}`).join("\n")
      : "";

  const proposalsCount =
    project.proposalsCount || project.proposals?.length || 0;

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <Link href="/admin/projects">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                {project.title || ""}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 break-words">
                {project.category || ""}
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {isEditing ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={saving}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {isServiceRequest ? "Edit Opportunity" : "Edit Project"}
              </Button>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex flex-wrap gap-2 sm:gap-4">
          <Badge
            className={`${getStatusColor(
              project.status || "",
              project.type
            )} text-xs`}
          >
            {getStatusText(project.status || "", project.type)}
          </Badge>
          {isServiceRequest && (
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              Opportunity
            </Badge>
          )}
          {disputes.length > 0 && !isServiceRequest && (
            <Badge variant="destructive" className="text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {disputes.length} Dispute(s)
            </Badge>
          )}
          {isServiceRequest && proposalsCount > 0 && (
            <Badge className="bg-blue-100 text-blue-800 text-xs">
              {proposalsCount} {proposalsCount === 1 ? "proposal" : "proposals"}
            </Badge>
          )}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 h-auto">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              Overview
            </TabsTrigger>
            {isServiceRequest ? (
              <TabsTrigger
                value="proposals"
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                Proposals ({proposalsCount})
              </TabsTrigger>
            ) : (
              <>
                <TabsTrigger
                  value="milestones"
                  className="text-xs sm:text-sm px-2 sm:px-4"
                >
                  Milestones
                </TabsTrigger>
                <TabsTrigger
                  value="proposals"
                  className="text-xs sm:text-sm px-2 sm:px-4"
                >
                  Proposals ({proposalsCount})
                </TabsTrigger>
              </>
            )}
            <TabsTrigger
              value="files"
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              Files
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              Messages
            </TabsTrigger>
            {disputes.length > 0 && !isServiceRequest && (
              <TabsTrigger
                value="disputes"
                className="text-xs sm:text-sm px-2 sm:px-4"
              >
                Disputes ({disputes.length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      Category
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData?.category || ""}
                        onChange={(e) =>
                          handleFieldChange("category", e.target.value)
                        }
                        className="mt-1 text-sm sm:text-base"
                      />
                    ) : (
                      <p className="text-sm sm:text-base lg:text-lg mt-1 break-words">
                        {project.category || ""}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      Status
                    </Label>
                    <div className="mt-1">
                      {isEditing && !isServiceRequest ? (
                        <Select
                          value={formData?.status || "IN_PROGRESS"}
                          onValueChange={(value) =>
                            handleFieldChange("status", value)
                          }
                        >
                          <SelectTrigger className="text-sm sm:text-base">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="IN_PROGRESS">
                              In Progress
                            </SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="DISPUTED">Disputed</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge
                          className={`${getStatusColor(
                            project.status || "",
                            project.type
                          )} text-xs`}
                        >
                          {getStatusText(project.status || "", project.type)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      Budget Range
                    </Label>
                    {isEditing ? (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <Input
                          type="number"
                          value={formData?.budgetMin || 0}
                          onChange={(e) =>
                            handleFieldChange(
                              "budgetMin",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Min"
                          className="text-sm sm:text-base"
                        />
                        <Input
                          type="number"
                          value={formData?.budgetMax || 0}
                          onChange={(e) =>
                            handleFieldChange(
                              "budgetMax",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Max"
                          className="text-sm sm:text-base"
                        />
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base lg:text-lg mt-1 break-words">
                        {formatCurrency(project.budgetMin || 0)} -{" "}
                        {formatCurrency(project.budgetMax || 0)}
                      </p>
                    )}
                  </div>
                  {!isServiceRequest && approvedPrice > 0 && (
                    <div>
                      <Label className="text-xs sm:text-sm font-medium text-gray-500">
                        Approved Price
                      </Label>
                      <p className="text-sm sm:text-base lg:text-lg font-semibold text-green-600 mt-1">
                        {formatCurrency(approvedPrice)}
                      </p>
                    </div>
                  )}
                  <div className="sm:col-span-2">
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      Timeline
                    </Label>
                    <div className="space-y-2 mt-1">
                      {project.originalTimeline ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Original Timeline (Company):
                          </p>
                          {isEditing ? (
                            <Input
                              value={formData?.timeline || ""}
                              onChange={(e) =>
                                handleFieldChange("timeline", e.target.value)
                              }
                            />
                          ) : (
                            <p className="text-xs sm:text-sm text-gray-900 font-medium">
                              {formatTimeline(project.originalTimeline)}
                            </p>
                          )}
                        </div>
                      ) : null}
                      {project.providerProposedTimeline ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Provider&apos;s Proposed Timeline:
                          </p>
                          <p className="text-xs sm:text-sm text-gray-900 font-medium">
                            {formatTimeline(
                              project.providerProposedTimeline,
                              "day"
                            )}
                          </p>
                        </div>
                      ) : null}
                      {!project.originalTimeline &&
                        !project.providerProposedTimeline && (
                          <p className="text-xs sm:text-sm text-gray-600">
                            Not specified
                          </p>
                        )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      Priority
                    </Label>
                    {isEditing ? (
                      <Select
                        value={formData?.priority || "medium"}
                        onValueChange={(value) =>
                          handleFieldChange("priority", value)
                        }
                      >
                        <SelectTrigger className="mt-1 text-sm sm:text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <p className="text-sm sm:text-base lg:text-lg mt-1 capitalize break-words">
                        {project.priority || ""}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-500">
                    Description
                  </Label>
                  {isEditing ? (
                    <Textarea
                      value={formData?.description || ""}
                      onChange={(e) =>
                        handleFieldChange("description", e.target.value)
                      }
                      rows={6}
                      className="mt-1 text-sm sm:text-base"
                    />
                  ) : project.description ? (
                    <div className="mt-1">
                      <MarkdownViewer content={project.description} />
                    </div>
                  ) : (
                    <p className="text-sm sm:text-base text-gray-700 mt-1 break-words">
                      {project.description || ""}
                    </p>
                  )}
                </div>
                {requirements && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      Requirements
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={formData?.requirements || ""}
                        onChange={(e) =>
                          handleFieldChange("requirements", e.target.value)
                        }
                        rows={4}
                        className="mt-1 text-sm sm:text-base"
                      />
                    ) : (
                      <div className="mt-1">
                        <MarkdownViewer content={requirements} />
                      </div>
                    )}
                  </div>
                )}
                {deliverables && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      Deliverables
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={formData?.deliverables || ""}
                        onChange={(e) =>
                          handleFieldChange("deliverables", e.target.value)
                        }
                        rows={4}
                        className="mt-1 text-sm sm:text-base"
                      />
                    ) : (
                      <div className="mt-1">
                        <MarkdownViewer content={deliverables} />
                      </div>
                    )}
                  </div>
                )}
                {project.skills && project.skills.length > 0 && (
                  <div>
                    <Label className="text-xs sm:text-sm font-medium text-gray-500">
                      Skills Required
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData?.skills || ""}
                        onChange={(e) =>
                          handleFieldChange("skills", e.target.value)
                        }
                        placeholder="Comma-separated skills"
                        className="mt-1 text-sm sm:text-base"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {project.skills.map((skill, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Client Information */}
            {project.customer && (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                      <AvatarImage
                        src={getProfileImageUrl(
                          project.customer.customerProfile?.profileImageUrl
                        )}
                      />
                      <AvatarFallback className="text-xs sm:text-base">
                        {(project.customer.name || "C").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div>
                        <p className="font-semibold text-base sm:text-lg break-words">
                          {project.customer.name || "N/A"}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                          {project.customer.email || ""}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        {project.customer.customerProfile?.location &&
                        project.customer.customerProfile.location.trim() ? (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {project.customer.customerProfile.location}
                            </span>
                          </div>
                        ) : null}
                        {project.customer.customerProfile?.website &&
                        project.customer.customerProfile.website.trim() ? (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <a
                              href={
                                project.customer.customerProfile.website.startsWith(
                                  "http"
                                )
                                  ? project.customer.customerProfile.website
                                  : `https://${project.customer.customerProfile.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {project.customer.customerProfile.website}
                            </a>
                          </div>
                        ) : null}
                        {project.customer.customerProfile?.industry &&
                        project.customer.customerProfile.industry.trim() ? (
                          <div>
                            <span className="text-gray-500">Industry: </span>
                            <span className="text-gray-700">
                              {project.customer.customerProfile.industry}
                            </span>
                          </div>
                        ) : null}
                        {project.customer.customerProfile?.companySize &&
                        project.customer.customerProfile.companySize.trim() ? (
                          <div>
                            <span className="text-gray-500">
                              Company Size:{" "}
                            </span>
                            <span className="text-gray-700">
                              {project.customer.customerProfile.companySize}
                            </span>
                          </div>
                        ) : null}
                      </div>
                      {project.customer.id && (
                        <Link href={`/admin/users/${project.customer.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            View Full Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Provider Information */}
            {!isServiceRequest && project.provider && (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">
                    Provider Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                      <AvatarImage
                        src={getProfileImageUrl(
                          project.provider.providerProfile?.profileImageUrl
                        )}
                      />
                      <AvatarFallback className="text-xs sm:text-base">
                        {(project.provider.name || "P").charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2 min-w-0">
                      <div>
                        <p className="font-semibold text-base sm:text-lg break-words">
                          {project.provider.name || "N/A"}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 break-words">
                          {project.provider.email || ""}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                        {project.provider.providerProfile?.location && (
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {project.provider.providerProfile.location}
                            </span>
                          </div>
                        )}
                        {project.provider.providerProfile?.website && (
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            <a
                              href={
                                project.provider.providerProfile.website.startsWith(
                                  "http"
                                )
                                  ? project.provider.providerProfile.website
                                  : `https://${project.provider.providerProfile.website}`
                              }
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              {project.provider.providerProfile.website}
                            </a>
                          </div>
                        )}
                        {project.provider.providerProfile?.rating &&
                          typeof project.provider.providerProfile.rating ===
                            "number" && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-gray-700">
                                {Number(
                                  project.provider.providerProfile.rating
                                ).toFixed(1)}
                              </span>
                            </div>
                          )}
                        {project.provider.providerProfile?.totalProjects !==
                          undefined && (
                          <div>
                            <span className="text-gray-500">Projects: </span>
                            <span className="text-gray-700">
                              {project.provider.providerProfile.totalProjects}
                            </span>
                          </div>
                        )}
                      </div>
                      {project.provider.id && (
                        <Link href={`/admin/users/${project.provider.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            View Full Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {!isServiceRequest && (
            <TabsContent value="milestones" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">
                    Milestones
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    {totalMilestones > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <div className="w-24 sm:w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm text-gray-600">
                            {progress}%
                          </span>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {completedMilestones} of {totalMilestones} completed
                        </span>
                      </div>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {milestonesArray.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No milestones found
                    </p>
                  ) : (
                    <div className="space-y-4 sm:space-y-6">
                      {milestonesArray.map((milestone, idx) => (
                        <div
                          key={milestone.id || idx}
                          className="flex gap-2 sm:gap-4"
                        >
                          <div className="flex flex-col items-center flex-shrink-0">
                            <div className="w-5 h-5 sm:w-6 sm:h-6">
                              {getMilestoneStatusIcon(milestone.status || "")}
                            </div>
                            {idx < milestonesArray.length - 1 && (
                              <div className="w-px h-12 sm:h-16 bg-gray-200 mt-1 sm:mt-2" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0 pb-6 sm:pb-8">
                            <div className="flex flex-col gap-2 mb-2">
                              {/* Top Row */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <h3 className="font-semibold text-sm sm:text-base break-words">
                                  {milestone.title || `Milestone ${idx + 1}`}
                                </h3>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge
                                    className={`${getMilestoneStatusColor(
                                      milestone.status || ""
                                    )} text-xs`}
                                  >
                                    {getMilestoneStatusText(
                                      milestone.status || ""
                                    )}
                                  </Badge>
                                  <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                                    {formatCurrency(milestone.amount || 0)}
                                  </span>
                                  {milestone.id &&
                                    milestonePayments.has(milestone.id) && (
                                      <Link
                                        href={`/admin/payments/${milestonePayments.get(
                                          milestone.id
                                        )}`}
                                      >
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="text-xs sm:text-sm"
                                        >
                                          <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1" />
                                          View Payment
                                        </Button>
                                      </Link>
                                    )}
                                </div>
                              </div>

                              {/* Description Row */}
                              {milestone.description && (
                                <div className="mb-2 sm:mb-3">
                                  <p className="text-xs sm:text-sm text-gray-600 break-words">
                                    {milestone.description}
                                  </p>
                                </div>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                              {milestone.dueDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span>
                                    Due:{" "}
                                    {new Date(
                                      milestone.dueDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {milestone.completedAt && (
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span>
                                    Completed:{" "}
                                    {new Date(
                                      milestone.completedAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {milestone.status === "IN_PROGRESS" &&
                              milestone.progress && (
                                <div className="mt-2 sm:mt-3">
                                  <div className="flex justify-between text-xs sm:text-sm mb-1">
                                    <span>Progress</span>
                                    <span>{milestone.progress}%</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-blue-600 h-2 rounded-full transition-all"
                                      style={{
                                        width: `${milestone.progress}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}

                            {/* Show start deliverables if available */}
                            {milestone.startDeliverables != null && (
                              <div className="mt-3 p-2 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
                                <p className="text-xs sm:text-sm font-medium text-green-900 mb-1">
                                  📋 Plan / Deliverables (When Starting Work):
                                </p>
                                <p className="text-xs sm:text-sm text-green-800 whitespace-pre-wrap break-words">
                                  {typeof milestone.startDeliverables ===
                                    "object" &&
                                  milestone.startDeliverables !== null &&
                                  "description" in
                                    milestone.startDeliverables &&
                                  typeof (
                                    milestone.startDeliverables as {
                                      description?: unknown;
                                    }
                                  ).description === "string"
                                    ? (
                                        milestone.startDeliverables as {
                                          description: string;
                                        }
                                      ).description
                                    : String(
                                        JSON.stringify(
                                          milestone.startDeliverables
                                        )
                                      )}
                                </p>
                              </div>
                            )}

                            {/* Show submit deliverables if available */}
                            {milestone.submitDeliverables != null && (
                              <div className="mt-3 p-2 sm:p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                <p className="text-xs sm:text-sm font-medium text-purple-900 mb-1">
                                  ✅ Deliverables / Completion Notes (When
                                  Submitting):
                                </p>
                                <p className="text-xs sm:text-sm text-purple-800 whitespace-pre-wrap break-words">
                                  {typeof milestone.submitDeliverables ===
                                    "object" &&
                                  milestone.submitDeliverables !== null &&
                                  "description" in
                                    milestone.submitDeliverables &&
                                  typeof (
                                    milestone.submitDeliverables as {
                                      description?: unknown;
                                    }
                                  ).description === "string"
                                    ? (
                                        milestone.submitDeliverables as {
                                          description: string;
                                        }
                                      ).description
                                    : String(
                                        JSON.stringify(
                                          milestone.submitDeliverables
                                        )
                                      )}
                                </p>
                              </div>
                            )}

                            {/* Show submission note if available */}
                            {milestone.submissionNote && (
                              <div className="mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">
                                  📝 Submission Note:
                                </p>
                                <p className="text-xs sm:text-sm text-blue-800 whitespace-pre-wrap break-words">
                                  {milestone.submissionNote}
                                </p>
                              </div>
                            )}

                            {/* Show latest requested changes reason if available */}
                            {milestone.submissionHistory &&
                              Array.isArray(milestone.submissionHistory) &&
                              milestone.submissionHistory.length > 0 &&
                              (() => {
                                const latestRequest = milestone
                                  .submissionHistory[
                                  milestone.submissionHistory.length - 1
                                ] as Record<string, unknown> | undefined;
                                if (
                                  latestRequest &&
                                  typeof latestRequest === "object" &&
                                  "requestedChangesReason" in latestRequest &&
                                  typeof latestRequest.requestedChangesReason ===
                                    "string"
                                ) {
                                  return (
                                    <div className="mt-3 p-2 sm:p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                      <p className="text-xs sm:text-sm font-medium text-orange-900 mb-1">
                                        🔄 Latest Request for Changes (Revision
                                        #
                                        {typeof latestRequest.revisionNumber ===
                                        "number"
                                          ? latestRequest.revisionNumber
                                          : milestone.submissionHistory.length}
                                        ):
                                      </p>
                                      <p className="text-xs sm:text-sm text-orange-800 whitespace-pre-wrap break-words">
                                        {String(
                                          latestRequest.requestedChangesReason
                                        )}
                                      </p>
                                      {latestRequest.requestedChangesAt !=
                                        null &&
                                        typeof latestRequest.requestedChangesAt ===
                                          "string" && (
                                          <p className="text-xs text-orange-600 mt-2">
                                            Requested on:{" "}
                                            {new Date(
                                              latestRequest.requestedChangesAt
                                            ).toLocaleString()}
                                          </p>
                                        )}
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                            {/* Show attachment if available */}
                            {milestone.submissionAttachmentUrl && (
                              <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <Paperclip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 flex-shrink-0" />
                                  <span className="text-xs sm:text-sm font-medium text-gray-900">
                                    📎 Submission Attachment
                                  </span>
                                </div>
                                {((): React.ReactNode => {
                                  const normalized = (
                                    milestone.submissionAttachmentUrl as string
                                  ).replace(/\\/g, "/");
                                  const fileName =
                                    normalized.split("/").pop() || "attachment";
                                  const attachmentUrl = getAttachmentUrl(
                                    milestone.submissionAttachmentUrl as string
                                  );
                                  const isR2Key =
                                    attachmentUrl === "#" ||
                                    (!attachmentUrl.startsWith("http") &&
                                      !attachmentUrl.startsWith("/uploads/") &&
                                      !attachmentUrl.includes(
                                        process.env.NEXT_PUBLIC_API_URL ||
                                          "localhost"
                                      ));

                                  return (
                                    <a
                                      href={
                                        attachmentUrl === "#"
                                          ? undefined
                                          : attachmentUrl
                                      }
                                      download={fileName}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={
                                        isR2Key
                                          ? async (e) => {
                                              e.preventDefault();
                                              try {
                                                const downloadUrl =
                                                  await getR2DownloadUrl(
                                                    milestone.submissionAttachmentUrl as string
                                                  );
                                                window.open(
                                                  downloadUrl.downloadUrl,
                                                  "_blank"
                                                );
                                              } catch (error) {
                                                console.error(
                                                  "Failed to get download URL:",
                                                  error
                                                );
                                                toastHook({
                                                  title: "Error",
                                                  description:
                                                    "Failed to download attachment",
                                                  variant: "destructive",
                                                });
                                              }
                                            }
                                          : undefined
                                      }
                                      className="flex items-start gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 active:bg-gray-50 sm:hover:bg-gray-50 sm:hover:shadow-sm transition"
                                    >
                                      <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-[10px] sm:text-xs font-medium">
                                        PDF
                                      </div>
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <span className="text-xs sm:text-sm font-medium text-gray-900 break-all leading-snug">
                                          {fileName}
                                        </span>
                                        <span className="text-[10px] sm:text-xs text-gray-500 leading-snug">
                                          Click to preview / download
                                        </span>
                                      </div>
                                      <div className="ml-auto flex items-center text-gray-500 active:text-gray-700 sm:hover:text-gray-700">
                                        <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                      </div>
                                    </a>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Show submission history if available */}
                            {milestone.submissionHistory &&
                              Array.isArray(milestone.submissionHistory) &&
                              milestone.submissionHistory.length > 0 && (
                                <div className="mt-3 sm:mt-4 border-t pt-3 sm:pt-4">
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                                    📚 Previous Submission History:
                                  </p>
                                  <div className="space-y-2 sm:space-y-3">
                                    {(
                                      milestone.submissionHistory as unknown[]
                                    ).map(
                                      (
                                        history: unknown,
                                        historyIdx: number
                                      ) => {
                                        const historyRecord = history as Record<
                                          string,
                                          unknown
                                        >;
                                        const revisionNumber =
                                          typeof historyRecord.revisionNumber ===
                                          "number"
                                            ? historyRecord.revisionNumber
                                            : historyIdx + 1;

                                        return (
                                          <div
                                            key={historyIdx}
                                            className="p-2 sm:p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                          >
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0 mb-2">
                                              <p className="text-xs sm:text-sm font-medium text-gray-900">
                                                Revision #{revisionNumber}
                                              </p>
                                              {historyRecord.requestedChangesAt !=
                                                null &&
                                                typeof historyRecord.requestedChangesAt ===
                                                  "string" && (
                                                  <span className="text-xs text-gray-500">
                                                    Changes requested:{" "}
                                                    {new Date(
                                                      historyRecord.requestedChangesAt
                                                    ).toLocaleDateString()}
                                                  </span>
                                                )}
                                            </div>

                                            {historyRecord.requestedChangesReason !=
                                              null &&
                                              typeof historyRecord.requestedChangesReason ===
                                                "string" && (
                                                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                                  <p className="text-xs font-medium text-red-900 mb-1">
                                                    Reason for Changes:
                                                  </p>
                                                  <p className="text-xs text-red-800 whitespace-pre-wrap break-words">
                                                    {String(
                                                      historyRecord.requestedChangesReason
                                                    )}
                                                  </p>
                                                </div>
                                              )}

                                            {historyRecord.submitDeliverables !=
                                              null && (
                                              <div className="mb-2">
                                                <p className="text-xs font-medium text-gray-700 mb-1">
                                                  Deliverables:
                                                </p>
                                                <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                                                  {typeof historyRecord.submitDeliverables ===
                                                    "object" &&
                                                  historyRecord.submitDeliverables !==
                                                    null &&
                                                  "description" in
                                                    historyRecord.submitDeliverables &&
                                                  typeof (
                                                    historyRecord.submitDeliverables as {
                                                      description?: unknown;
                                                    }
                                                  ).description === "string"
                                                    ? (
                                                        historyRecord.submitDeliverables as {
                                                          description: string;
                                                        }
                                                      ).description
                                                    : String(
                                                        JSON.stringify(
                                                          historyRecord.submitDeliverables
                                                        )
                                                      )}
                                                </p>
                                              </div>
                                            )}

                                            {historyRecord.submissionNote !=
                                              null &&
                                              typeof historyRecord.submissionNote ===
                                                "string" && (
                                                <div className="mb-2">
                                                  <p className="text-xs font-medium text-gray-700 mb-1">
                                                    Note:
                                                  </p>
                                                  <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                                                    {String(
                                                      historyRecord.submissionNote
                                                    )}
                                                  </p>
                                                </div>
                                              )}

                                            {historyRecord.submissionAttachmentUrl !=
                                              null &&
                                              typeof historyRecord.submissionAttachmentUrl ===
                                                "string" && (
                                                <div>
                                                  <p className="text-xs font-medium text-gray-700 mb-1">
                                                    Attachment:
                                                  </p>
                                                  {((): React.ReactNode => {
                                                    const attachmentUrl =
                                                      getAttachmentUrl(
                                                        historyRecord.submissionAttachmentUrl
                                                      );
                                                    const isR2Key =
                                                      attachmentUrl === "#" ||
                                                      (!attachmentUrl.startsWith(
                                                        "http"
                                                      ) &&
                                                        !attachmentUrl.startsWith(
                                                          "/uploads/"
                                                        ) &&
                                                        !attachmentUrl.includes(
                                                          process.env
                                                            .NEXT_PUBLIC_API_URL ||
                                                            "localhost"
                                                        ));
                                                    const normalized =
                                                      historyRecord.submissionAttachmentUrl.replace(
                                                        /\\/g,
                                                        "/"
                                                      );
                                                    const fileName =
                                                      normalized
                                                        .split("/")
                                                        .pop() || "attachment";

                                                    return (
                                                      <a
                                                        href={
                                                          attachmentUrl === "#"
                                                            ? undefined
                                                            : attachmentUrl
                                                        }
                                                        download={fileName}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        onClick={
                                                          isR2Key
                                                            ? async (e) => {
                                                                e.preventDefault();
                                                                try {
                                                                  const downloadUrl =
                                                                    await getR2DownloadUrl(
                                                                      String(
                                                                        historyRecord.submissionAttachmentUrl
                                                                      )
                                                                    );
                                                                  window.open(
                                                                    downloadUrl.downloadUrl,
                                                                    "_blank"
                                                                  );
                                                                } catch (error) {
                                                                  console.error(
                                                                    "Failed to get download URL:",
                                                                    error
                                                                  );
                                                                  toastHook({
                                                                    title:
                                                                      "Error",
                                                                    description:
                                                                      "Failed to download attachment",
                                                                    variant:
                                                                      "destructive",
                                                                  });
                                                                }
                                                              }
                                                            : undefined
                                                        }
                                                        className="text-xs text-blue-600 active:text-blue-800 sm:hover:text-blue-800 underline break-all"
                                                      >
                                                        {fileName}
                                                      </a>
                                                    );
                                                  })()}
                                                </div>
                                              )}

                                            {historyRecord.submittedAt !=
                                              null &&
                                              typeof historyRecord.submittedAt ===
                                                "string" &&
                                              !isNaN(
                                                new Date(
                                                  historyRecord.submittedAt
                                                ).getTime()
                                              ) && (
                                                <p className="text-xs text-gray-500 mt-2">
                                                  Submitted:{" "}
                                                  {new Date(
                                                    historyRecord.submittedAt
                                                  ).toLocaleString()}
                                                </p>
                                              )}
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="proposals" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Proposals ({project.proposals?.length || 0})
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Review and manage proposals from providers
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {!project.proposals || project.proposals.length === 0 ? (
                  <p className="text-xs sm:text-sm text-gray-500 text-center py-6 sm:py-8">
                    No proposals found
                  </p>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {project.proposals.map((proposal, idx) => (
                      <Card
                        key={proposal.id || idx}
                        className="active:shadow-md sm:hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4 sm:p-5 lg:p-6">
                          <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6">
                            {/* Provider Info */}
                            <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                              <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                                <AvatarImage
                                  src={getProfileImageUrl(
                                    proposal.provider?.providerProfile
                                      ?.profileImageUrl
                                  )}
                                />
                                <AvatarFallback className="text-xs">
                                  {String(proposal.provider?.name || "P")
                                    .split(" ")
                                    .filter(Boolean)
                                    .map((n) => n[0])
                                    .join("")}
                                </AvatarFallback>
                              </Avatar>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base break-words">
                                    {proposal.provider?.name || "Provider"}
                                  </h3>
                                  {proposal.provider?.providerProfile?.rating &&
                                    typeof proposal.provider.providerProfile
                                      .rating === "number" && (
                                      <div className="flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                                        <span className="text-xs sm:text-sm text-gray-600">
                                          {proposal.provider.providerProfile.rating.toFixed(
                                            1
                                          )}
                                        </span>
                                      </div>
                                    )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 break-words">
                                  {proposal.provider?.email || ""}
                                </p>

                                {proposal.coverLetter && (
                                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 break-words mt-2">
                                    {proposal.coverLetter}
                                  </p>
                                )}

                                {proposal.provider?.providerProfile?.skills &&
                                  Array.isArray(
                                    proposal.provider.providerProfile.skills
                                  ) &&
                                  proposal.provider.providerProfile.skills
                                    .length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {proposal.provider.providerProfile.skills
                                        .slice(0, 3)
                                        .map((skill: string) => (
                                          <Badge
                                            key={skill}
                                            variant="secondary"
                                            className="text-[10px] leading-tight"
                                          >
                                            {skill}
                                          </Badge>
                                        ))}
                                      {proposal.provider.providerProfile.skills
                                        .length > 3 && (
                                        <Badge
                                          variant="secondary"
                                          className="text-[10px] leading-tight"
                                        >
                                          +
                                          {proposal.provider.providerProfile
                                            .skills.length - 3}{" "}
                                          more
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                              </div>
                            </div>

                            {/* Right column */}
                            <div className="lg:w-80 space-y-2 sm:space-y-3">
                              {/* Status + submitted date */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <Badge
                                  className={`${getStatusColor(
                                    proposal.status || "",
                                    ""
                                  )} text-xs`}
                                >
                                  {getStatusText(proposal.status || "", "")}
                                </Badge>
                                <span className="text-xs sm:text-sm text-gray-500">
                                  {proposal.createdAt &&
                                  !isNaN(new Date(proposal.createdAt).getTime())
                                    ? new Date(
                                        proposal.createdAt
                                      ).toLocaleDateString()
                                    : "—"}
                                </span>
                              </div>

                              {/* Bid / timeline */}
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
                                <div>
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    Bid Amount
                                  </p>
                                  <p className="font-semibold text-base sm:text-lg">
                                    RM{" "}
                                    {Number(
                                      proposal.bidAmount ||
                                        proposal.proposedBudget ||
                                        0
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-xs sm:text-sm text-gray-600">
                                    Timeline
                                  </p>
                                  <p className="font-medium text-xs sm:text-sm break-words">
                                    {proposal.deliveryTime
                                      ? formatTimeline(
                                          proposal.deliveryTime,
                                          "day"
                                        )
                                      : proposal.proposedTimeline
                                      ? formatTimeline(
                                          proposal.proposedTimeline
                                        )
                                      : "—"}
                                  </p>
                                </div>
                              </div>

                              {/* Mini milestones preview */}
                              {proposal.milestones &&
                                proposal.milestones.length > 0 && (
                                  <div className="text-xs text-gray-600 bg-gray-50 rounded p-2 sm:p-3">
                                    <div className="font-medium text-gray-900 mb-1">
                                      Proposed Milestones
                                    </div>
                                    <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                      {proposal.milestones.map((m, mIdx) => (
                                        <li
                                          key={m.id || mIdx}
                                          className="flex justify-between gap-2"
                                        >
                                          <span className="truncate text-xs">
                                            {m.title || `Milestone ${mIdx + 1}`}
                                          </span>
                                          <span className="text-xs flex-shrink-0">
                                            RM{" "}
                                            {Number(
                                              m.amount || 0
                                            ).toLocaleString()}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                              {/* Actions */}
                              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                                {/* View Profile */}
                                {proposal.provider?.id && (
                                  <Link
                                    href={`/admin/users/${proposal.provider.id}`}
                                    className="flex-1"
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
                                )}

                                {/* View Details */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs sm:text-sm"
                                  onClick={() => {
                                    setSelectedProposalDetails(proposal);
                                    setProposalDetailsOpen(true);
                                  }}
                                >
                                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="space-y-4 sm:space-y-6">
            {/* Proposal Attachments Section */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Proposal Attachments
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Files attached to proposals
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {(() => {
                  const proposalAttachments: Array<{
                    url: string;
                    proposalName: string;
                    proposalId?: string;
                  }> = [];

                  if (project.proposals && Array.isArray(project.proposals)) {
                    project.proposals.forEach((proposal) => {
                      const attachments =
                        proposal.attachments || proposal.attachmentUrls || [];
                      if (
                        Array.isArray(attachments) &&
                        attachments.length > 0
                      ) {
                        attachments.forEach((url: string) => {
                          proposalAttachments.push({
                            url,
                            proposalName: proposal.provider?.name || "Provider",
                            proposalId: proposal.id,
                          });
                        });
                      }
                    });
                  }

                  if (proposalAttachments.length === 0) {
                    return (
                      <p className="text-xs sm:text-sm text-gray-500 text-center py-6 sm:py-8">
                        No proposal attachments found
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {proposalAttachments.map((attachment, idx) => {
                        const normalized = attachment.url.replace(/\\/g, "/");
                        const fileName =
                          normalized.split("/").pop() || `file-${idx + 1}`;
                        const attachmentUrl = getAttachmentUrl(attachment.url);
                        const isR2Key =
                          attachmentUrl === "#" ||
                          (!attachmentUrl.startsWith("http") &&
                            !attachmentUrl.startsWith("/uploads/") &&
                            !attachmentUrl.includes(
                              process.env.NEXT_PUBLIC_API_URL || "localhost"
                            ));

                        return (
                          <a
                            key={idx}
                            href={
                              attachmentUrl === "#" ? undefined : attachmentUrl
                            }
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={
                              isR2Key
                                ? async (e) => {
                                    e.preventDefault();
                                    try {
                                      const downloadUrl =
                                        await getR2DownloadUrl(attachment.url);
                                      window.open(
                                        downloadUrl.downloadUrl,
                                        "_blank"
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Failed to get download URL:",
                                        error
                                      );
                                      toastHook({
                                        title: "Error",
                                        description:
                                          "Failed to download attachment",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                : undefined
                            }
                            className="flex items-start gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 active:bg-gray-50 sm:hover:bg-gray-50 sm:hover:shadow-sm transition"
                          >
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-[10px] sm:text-xs font-medium">
                              PDF
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-900 break-all leading-snug">
                                {fileName}
                              </span>
                              <span className="text-[10px] sm:text-xs text-gray-500 leading-snug">
                                From: {attachment.proposalName} • Click to
                                preview / download
                              </span>
                            </div>
                            <div className="ml-auto flex items-center text-gray-500 active:text-gray-700 sm:hover:text-gray-700">
                              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Milestone Attachments Section */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Milestone Attachments
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Files submitted with milestone completions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {(() => {
                  const milestoneAttachments: Array<{
                    url: string;
                    milestoneTitle: string;
                    milestoneId?: string;
                    submittedAt?: string;
                  }> = [];

                  milestonesArray.forEach((milestone) => {
                    if (milestone.submissionAttachmentUrl) {
                      milestoneAttachments.push({
                        url: milestone.submissionAttachmentUrl,
                        milestoneTitle: milestone.title || "Untitled Milestone",
                        milestoneId: milestone.id,
                        submittedAt: milestone.submittedAt,
                      });
                    }

                    if (
                      milestone.submissionHistory &&
                      Array.isArray(milestone.submissionHistory)
                    ) {
                      milestone.submissionHistory.forEach((history) => {
                        if (history.submissionAttachmentUrl) {
                          milestoneAttachments.push({
                            url: history.submissionAttachmentUrl,
                            milestoneTitle: `${
                              milestone.title || "Untitled Milestone"
                            } (Revision ${history.revisionNumber || "N/A"})`,
                            milestoneId: milestone.id,
                            submittedAt: history.submittedAt,
                          });
                        }
                      });
                    }
                  });

                  if (milestoneAttachments.length === 0) {
                    return (
                      <p className="text-xs sm:text-sm text-gray-500 text-center py-6 sm:py-8">
                        No milestone attachments found
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {milestoneAttachments.map((attachment, idx) => {
                        const normalized = attachment.url.replace(/\\/g, "/");
                        const fileName =
                          normalized.split("/").pop() || `file-${idx + 1}`;
                        const attachmentUrl = getAttachmentUrl(attachment.url);
                        const isR2Key =
                          attachmentUrl === "#" ||
                          (!attachmentUrl.startsWith("http") &&
                            !attachmentUrl.startsWith("/uploads/") &&
                            !attachmentUrl.includes(
                              process.env.NEXT_PUBLIC_API_URL || "localhost"
                            ));

                        return (
                          <a
                            key={idx}
                            href={
                              attachmentUrl === "#" ? undefined : attachmentUrl
                            }
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={
                              isR2Key
                                ? async (e) => {
                                    e.preventDefault();
                                    try {
                                      const downloadUrl =
                                        await getR2DownloadUrl(attachment.url);
                                      window.open(
                                        downloadUrl.downloadUrl,
                                        "_blank"
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Failed to get download URL:",
                                        error
                                      );
                                      toastHook({
                                        title: "Error",
                                        description:
                                          "Failed to download attachment",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                : undefined
                            }
                            className="flex items-start gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 active:bg-gray-50 sm:hover:bg-gray-50 sm:hover:shadow-sm transition"
                          >
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-[10px] sm:text-xs font-medium">
                              PDF
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-900 break-all leading-snug">
                                {fileName}
                              </span>
                              <span className="text-[10px] sm:text-xs text-gray-500 leading-snug">
                                From: {attachment.milestoneTitle}
                                {attachment.submittedAt &&
                                  ` • Submitted: ${new Date(
                                    attachment.submittedAt
                                  ).toLocaleDateString()}`}
                                <span className="block mt-0.5">
                                  Click to preview / download
                                </span>
                              </span>
                            </div>
                            <div className="ml-auto flex items-center text-gray-500 active:text-gray-700 sm:hover:text-gray-700">
                              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Message Attachments
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Files attached to project messages
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {(() => {
                  const messageAttachments: Array<{
                    url: string;
                    senderName: string;
                    messageId?: string;
                    sentAt?: string;
                  }> = [];

                  if (messages && Array.isArray(messages)) {
                    messages.forEach((message: Record<string, unknown>) => {
                      // Only include messages that are related to this project
                      const messageProjectId = message.projectId as
                        | string
                        | undefined;
                      if (String(messageProjectId) !== String(projectId)) {
                        return; // Skip messages not related to this project
                      }

                      const attachments = message.attachments;
                      if (
                        Array.isArray(attachments) &&
                        attachments.length > 0
                      ) {
                        const messageSender = message.sender as
                          | Record<string, unknown>
                          | undefined;
                        const senderName =
                          (messageSender?.name as string) ||
                          (message.senderName as string) ||
                          "Unknown";
                        const sentAt =
                          (message.createdAt as string) ||
                          (message.timestamp as string) ||
                          "";

                        attachments.forEach((url: unknown) => {
                          const urlStr =
                            typeof url === "string" ? url : String(url);
                          messageAttachments.push({
                            url: urlStr,
                            senderName: senderName,
                            messageId: message.id as string | undefined,
                            sentAt: sentAt,
                          });
                        });
                      }
                    });
                  }

                  if (messageAttachments.length === 0) {
                    return (
                      <p className="text-xs sm:text-sm text-gray-500 text-center py-6 sm:py-8">
                        No message attachments found
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-2">
                      {messageAttachments.map((attachment, idx) => {
                        const normalized = attachment.url.replace(/\\/g, "/");
                        const fileName =
                          normalized.split("/").pop() || `file-${idx + 1}`;
                        const attachmentUrl = getAttachmentUrl(attachment.url);
                        const isR2Key =
                          attachmentUrl === "#" ||
                          (!attachmentUrl.startsWith("http") &&
                            !attachmentUrl.startsWith("/uploads/") &&
                            !attachmentUrl.includes(
                              process.env.NEXT_PUBLIC_API_URL || "localhost"
                            ));

                        return (
                          <a
                            key={idx}
                            href={
                              attachmentUrl === "#" ? undefined : attachmentUrl
                            }
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={
                              isR2Key
                                ? async (e) => {
                                    e.preventDefault();
                                    try {
                                      const downloadUrl =
                                        await getR2DownloadUrl(attachment.url);
                                      window.open(
                                        downloadUrl.downloadUrl,
                                        "_blank"
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Failed to get download URL:",
                                        error
                                      );
                                      toastHook({
                                        title: "Error",
                                        description:
                                          "Failed to download attachment",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                : undefined
                            }
                            className="flex items-start gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 active:bg-gray-50 sm:hover:bg-gray-50 sm:hover:shadow-sm transition"
                          >
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-[10px] sm:text-xs font-medium">
                              PDF
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-900 break-all leading-snug">
                                {fileName}
                              </span>
                              <span className="text-[10px] sm:text-xs text-gray-500 leading-snug">
                                From: {attachment.senderName}
                                {attachment.sentAt &&
                                  ` • Sent: ${new Date(
                                    attachment.sentAt
                                  ).toLocaleDateString()}`}
                                <span className="block mt-0.5">
                                  Click to preview / download
                                </span>
                              </span>
                            </div>
                            <div className="ml-auto flex items-center text-gray-500 active:text-gray-700 sm:hover:text-gray-700">
                              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="messages" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Project Messages
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Communication between customer and provider
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {loadingMessages ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm text-gray-600">
                      Loading messages...
                    </span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">
                      No messages found for this project
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                    {messages.map((message: Record<string, unknown>) => {
                      const messageSender = message.sender as
                        | Record<string, unknown>
                        | undefined;
                      const text =
                        (message.content as string) ??
                        (message.message as string) ??
                        "";
                      const ts =
                        (message.createdAt as string) ??
                        (message.timestamp as string) ??
                        "";
                      const senderName =
                        (messageSender?.name as string) ||
                        (message.senderName as string) ||
                        "User";
                      const avatarChar = senderName?.charAt?.(0) || "U";
                      const messageId = message.id as
                        | string
                        | number
                        | undefined;
                      const messageKey =
                        messageId !== undefined
                          ? String(messageId)
                          : `msg-${Math.random()}`;
                      const senderId =
                        (message.senderId as string) ||
                        (messageSender?.id as string) ||
                        "";
                      const isCustomer =
                        String(senderId) === String(project.customer?.id);

                      return (
                        <div
                          key={messageKey}
                          className={`flex gap-3 ${
                            isCustomer ? "flex-row-reverse" : ""
                          }`}
                        >
                          <Avatar className="w-8 h-8 flex-shrink-0">
                            <AvatarImage
                              src={getProfileImageUrl(
                                isCustomer
                                  ? project.customer?.customerProfile
                                      ?.profileImageUrl
                                  : project.provider?.providerProfile
                                      ?.profileImageUrl
                              )}
                            />
                            <AvatarFallback className="text-xs">
                              {avatarChar}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`flex-1 max-w-[14rem] ${
                              isCustomer ? "text-right" : ""
                            }`}
                          >
                            <div
                              className={`p-3 rounded-lg ${
                                isCustomer
                                  ? "bg-blue-600 text-white"
                                  : "bg-gray-100"
                              }`}
                            >
                              <p className="text-xs sm:text-sm break-words">
                                {text}
                              </p>
                              {message.attachments &&
                              Array.isArray(message.attachments) &&
                              message.attachments.length > 0 ? (
                                <div className="mt-2 pt-2 border-t border-opacity-20 space-y-2">
                                  {(message.attachments as unknown[]).map(
                                    (attachment: unknown, index: number) => {
                                      const attachmentStr =
                                        typeof attachment === "string"
                                          ? attachment
                                          : String(attachment);
                                      const url = getFullUrl(attachmentStr);
                                      const attachmentUrl =
                                        getAttachmentUrl(attachmentStr);
                                      const name =
                                        url.split("/").pop() || `file-${index}`;
                                      const isR2Key =
                                        attachmentUrl === "#" ||
                                        (!attachmentUrl.startsWith("http") &&
                                          !attachmentUrl.startsWith(
                                            "/uploads/"
                                          ) &&
                                          !attachmentUrl.includes(
                                            process.env.NEXT_PUBLIC_API_URL ||
                                              "localhost"
                                          ));

                                      return (
                                        <div key={index} className="text-xs">
                                          {isImage(url) ? (
                                            <div className="relative w-32 h-auto rounded border cursor-pointer">
                                              <Image
                                                src={url}
                                                alt={name}
                                                width={128}
                                                height={128}
                                                className="w-32 h-auto rounded border"
                                                unoptimized
                                                onError={(e) => {
                                                  const target =
                                                    e.target as HTMLImageElement;
                                                  if (isR2Key) {
                                                    // Try to get R2 download URL
                                                    getR2DownloadUrl(
                                                      attachmentStr
                                                    )
                                                      .then((downloadUrl) => {
                                                        target.src =
                                                          downloadUrl.downloadUrl;
                                                      })
                                                      .catch((error) => {
                                                        console.error(
                                                          "Failed to get download URL:",
                                                          error
                                                        );
                                                        target.style.display =
                                                          "none";
                                                      });
                                                  } else {
                                                    target.style.display =
                                                      "none";
                                                  }
                                                }}
                                              />
                                            </div>
                                          ) : isPDF(url) ? (
                                            <a
                                              href={
                                                attachmentUrl !== "#"
                                                  ? attachmentUrl
                                                  : url
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={
                                                isR2Key
                                                  ? async (e) => {
                                                      e.preventDefault();
                                                      try {
                                                        const downloadUrl =
                                                          await getR2DownloadUrl(
                                                            attachmentStr
                                                          );
                                                        window.open(
                                                          downloadUrl.downloadUrl,
                                                          "_blank"
                                                        );
                                                      } catch (error) {
                                                        console.error(
                                                          "Failed to get download URL:",
                                                          error
                                                        );
                                                        toastHook({
                                                          title: "Error",
                                                          description:
                                                            "Failed to download attachment",
                                                          variant:
                                                            "destructive",
                                                        });
                                                      }
                                                    }
                                                  : undefined
                                              }
                                              className="flex items-center gap-2 text-blue-500 underline"
                                            >
                                              📄 {name}
                                            </a>
                                          ) : (
                                            <a
                                              href={
                                                attachmentUrl !== "#"
                                                  ? attachmentUrl
                                                  : url
                                              }
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              onClick={
                                                isR2Key
                                                  ? async (e) => {
                                                      e.preventDefault();
                                                      try {
                                                        const downloadUrl =
                                                          await getR2DownloadUrl(
                                                            attachmentStr
                                                          );
                                                        window.open(
                                                          downloadUrl.downloadUrl,
                                                          "_blank"
                                                        );
                                                      } catch (error) {
                                                        console.error(
                                                          "Failed to get download URL:",
                                                          error
                                                        );
                                                        toastHook({
                                                          title: "Error",
                                                          description:
                                                            "Failed to download attachment",
                                                          variant:
                                                            "destructive",
                                                        });
                                                      }
                                                    }
                                                  : undefined
                                              }
                                              className="flex items-center gap-2 text-blue-500 underline"
                                            >
                                              📎 {name}
                                            </a>
                                          )}
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              ) : null}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {ts
                                ? new Date(ts).toLocaleString()
                                : "No timestamp"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {disputes.length > 0 && (
            <TabsContent value="disputes" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">
                    Related Disputes
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    {disputes.map((dispute) => (
                      <div
                        key={dispute.id}
                        className="border rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-start gap-2 sm:gap-0 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm sm:text-base break-words">
                              {dispute.reason || "N/A"}
                            </p>
                            <div className="text-xs sm:text-sm text-gray-600 mt-2 whitespace-pre-wrap break-words">
                              {(() => {
                                // Parse description to convert attachment metadata to clickable links
                                const parseDescriptionWithAttachments = (
                                  text: string
                                ) => {
                                  if (!text) return null;

                                  // Pattern to match: [Attachment: filename uploaded by user on date]
                                  const attachmentPattern =
                                    /\[Attachment: (.+?) uploaded by (.+?) on (.+?)\]/g;
                                  const parts: (string | React.ReactElement)[] =
                                    [];
                                  let lastIndex = 0;
                                  let match;
                                  let keyIndex = 0;

                                  while (
                                    (match = attachmentPattern.exec(text)) !==
                                    null
                                  ) {
                                    // Add text before the match
                                    if (match.index > lastIndex) {
                                      parts.push(
                                        text.substring(lastIndex, match.index)
                                      );
                                    }

                                    const filename = match[1];
                                    const uploadedBy = match[2];
                                    const uploadedAt = match[3];

                                    // Find matching attachment URL
                                    const matchingAttachment =
                                      dispute.attachments?.find(
                                        (url: string) => {
                                          const normalized = url.replace(
                                            /\\/g,
                                            "/"
                                          );
                                          const urlFilename =
                                            normalized.split("/").pop() || "";
                                          return (
                                            urlFilename === filename ||
                                            urlFilename.includes(filename) ||
                                            filename.includes(urlFilename)
                                          );
                                        }
                                      );

                                    if (matchingAttachment) {
                                      const attachmentUrl =
                                        getAttachmentUrl(matchingAttachment);
                                      const isR2Key =
                                        attachmentUrl === "#" ||
                                        (!attachmentUrl.startsWith("http") &&
                                          !attachmentUrl.startsWith(
                                            "/uploads/"
                                          ) &&
                                          !attachmentUrl.includes(
                                            process.env.NEXT_PUBLIC_API_URL ||
                                              "localhost"
                                          ));

                                      parts.push(
                                        <span
                                          key={`attachment-${keyIndex++}`}
                                          className="inline-flex items-center gap-1"
                                        >
                                          <span className="text-blue-600">
                                            [Attachment:
                                          </span>
                                          <button
                                            onClick={async (e) => {
                                              e.preventDefault();
                                              try {
                                                let downloadUrl: string;
                                                if (isR2Key) {
                                                  const r2Response =
                                                    await getR2DownloadUrl(
                                                      matchingAttachment
                                                    );
                                                  downloadUrl =
                                                    r2Response.downloadUrl;
                                                } else {
                                                  downloadUrl = attachmentUrl;
                                                }
                                                window.open(
                                                  downloadUrl,
                                                  "_blank"
                                                );
                                              } catch (error) {
                                                console.error(
                                                  "Failed to download attachment:",
                                                  error
                                                );
                                                toastHook({
                                                  title: "Error",
                                                  description:
                                                    "Failed to download attachment",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                            className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                          >
                                            {filename}
                                          </button>
                                          <span className="text-gray-600">
                                            uploaded by {uploadedBy} on{" "}
                                            {uploadedAt}]
                                          </span>
                                        </span>
                                      );
                                    } else {
                                      // If no matching attachment found, show as text
                                      parts.push(match[0]);
                                    }

                                    lastIndex = match.index + match[0].length;
                                  }

                                  // Add remaining text
                                  if (lastIndex < text.length) {
                                    parts.push(text.substring(lastIndex));
                                  }

                                  return parts.length > 0 ? parts : text;
                                };

                                const parsedContent =
                                  parseDescriptionWithAttachments(
                                    dispute.description || ""
                                  );
                                return (
                                  parsedContent || dispute.description || ""
                                );
                              })()}
                            </div>
                          </div>
                          <Badge
                            className={`${getStatusColor(
                              dispute.status || ""
                            )} text-xs flex-shrink-0`}
                          >
                            {(dispute.status || "").replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mt-2">
                          <span className="text-xs sm:text-sm text-gray-600 break-words">
                            Raised by: {dispute.raisedBy?.name || "N/A"}
                          </span>
                          <Link href={`/admin/disputes/${dispute.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full sm:w-auto text-xs sm:text-sm"
                            >
                              View Dispute
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Proposal Details Dialog */}
        <Dialog
          open={proposalDetailsOpen}
          onOpenChange={(open) => {
            setProposalDetailsOpen(open);
            if (!open) {
              setSelectedProposalDetails(null);
            }
          }}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                Proposal Details
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Detailed information about{" "}
                {selectedProposalDetails?.provider?.name || "Provider"}&apos;s
                proposal
              </DialogDescription>
            </DialogHeader>

            {selectedProposalDetails && (
              <div className="space-y-4 sm:space-y-6">
                {/* Provider Info */}
                <div className="flex items-start space-x-3 sm:space-x-4">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                    <AvatarImage
                      src={getProfileImageUrl(
                        selectedProposalDetails.provider?.providerProfile
                          ?.profileImageUrl
                      )}
                    />
                    <AvatarFallback className="text-xs sm:text-base">
                      {String(selectedProposalDetails.provider?.name || "P")
                        .split(" ")
                        .filter(Boolean)
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-semibold break-words">
                          {selectedProposalDetails.provider?.name || "Provider"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 mt-1">
                          {selectedProposalDetails.provider?.providerProfile
                            ?.rating &&
                            typeof selectedProposalDetails.provider
                              .providerProfile.rating === "number" && (
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                                <span>
                                  {selectedProposalDetails.provider.providerProfile.rating.toFixed(
                                    1
                                  )}{" "}
                                  rating
                                </span>
                              </div>
                            )}
                          {selectedProposalDetails.provider?.providerProfile
                            ?.location && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span className="break-words">
                                {
                                  selectedProposalDetails.provider
                                    .providerProfile.location
                                }
                              </span>
                            </div>
                          )}
                        </div>
                        {selectedProposalDetails.provider?.email && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
                            {selectedProposalDetails.provider.email}
                          </p>
                        )}
                        {selectedProposalDetails.provider?.providerProfile
                          ?.yearsExperience && (
                          <p className="text-xs sm:text-sm text-gray-600 mt-1">
                            {
                              selectedProposalDetails.provider.providerProfile
                                .yearsExperience
                            }{" "}
                            years experience
                          </p>
                        )}

                        {/* Skills */}
                        {selectedProposalDetails.provider?.providerProfile
                          ?.skills &&
                          Array.isArray(
                            selectedProposalDetails.provider.providerProfile
                              .skills
                          ) &&
                          selectedProposalDetails.provider.providerProfile
                            .skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {selectedProposalDetails.provider.providerProfile.skills
                                .slice(0, 4)
                                .map((skill: string) => (
                                  <Badge
                                    key={skill}
                                    variant="secondary"
                                    className="text-[10px] leading-tight"
                                  >
                                    {skill}
                                  </Badge>
                                ))}
                              {selectedProposalDetails.provider.providerProfile
                                .skills.length > 4 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] leading-tight"
                                >
                                  +
                                  {selectedProposalDetails.provider
                                    .providerProfile.skills.length - 4}{" "}
                                  more
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>

                      {/* View profile button */}
                      {selectedProposalDetails.provider?.id && (
                        <Link
                          href={`/admin/users/${selectedProposalDetails.provider.id}`}
                          className="self-start"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center text-xs sm:text-sm"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                            View Profile
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Project & Bid Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">
                      Project
                    </h4>
                    <p className="text-sm sm:text-base text-gray-900 break-words">
                      {project.title || ""}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">
                      Bid Amount
                    </h4>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      RM
                      {Number(
                        selectedProposalDetails.bidAmount ||
                          selectedProposalDetails.proposedBudget ||
                          0
                      ).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">
                      Proposed Timeline
                    </h4>
                    <p className="text-sm sm:text-base text-gray-900 break-words">
                      {selectedProposalDetails.deliveryTime
                        ? formatTimeline(
                            selectedProposalDetails.deliveryTime,
                            "day"
                          )
                        : selectedProposalDetails.proposedTimeline
                        ? formatTimeline(
                            selectedProposalDetails.proposedTimeline
                          )
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">
                      Status
                    </h4>
                    <Badge
                      className={`${getStatusColor(
                        selectedProposalDetails.status || "",
                        ""
                      )} text-xs`}
                    >
                      {getStatusText(selectedProposalDetails.status || "", "")}
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Cover Letter */}
                {selectedProposalDetails.coverLetter && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">
                      Cover Letter
                    </h4>
                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                      <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words">
                        {selectedProposalDetails.coverLetter}
                      </p>
                    </div>
                  </div>
                )}

                {/* Skills */}
                {selectedProposalDetails.provider?.providerProfile?.skills &&
                  Array.isArray(
                    selectedProposalDetails.provider.providerProfile.skills
                  ) &&
                  selectedProposalDetails.provider.providerProfile.skills
                    .length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">
                        Skills
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedProposalDetails.provider.providerProfile.skills.map(
                          (skill: string) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Portfolio */}
                {selectedProposalDetails.provider?.providerProfile
                  ?.portfolios &&
                  Array.isArray(
                    selectedProposalDetails.provider.providerProfile.portfolios
                  ) &&
                  selectedProposalDetails.provider.providerProfile.portfolios
                    .length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">
                        Portfolio
                      </h4>
                      <div className="space-y-2">
                        {selectedProposalDetails.provider.providerProfile.portfolios.map(
                          (
                            portfolio: { externalUrl?: string; title?: string },
                            index: number
                          ) => (
                            <a
                              key={index}
                              href={portfolio.externalUrl || "#"}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-xs sm:text-sm text-blue-600 hover:text-blue-800 underline break-all"
                            >
                              {portfolio.title ||
                                portfolio.externalUrl ||
                                `Portfolio ${index + 1}`}
                            </a>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Proposed Milestones */}
                {selectedProposalDetails.milestones &&
                  selectedProposalDetails.milestones.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 text-sm sm:text-base">
                        Proposed Milestones
                      </h4>
                      <div className="space-y-3 sm:space-y-4">
                        {selectedProposalDetails.milestones
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((m, idx) => (
                            <Card
                              key={m.id || idx}
                              className="border border-gray-200"
                            >
                              <CardContent className="p-3 sm:p-4 space-y-2 text-xs sm:text-sm">
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      #{m.order || idx + 1}
                                    </Badge>
                                    <span className="font-medium text-gray-900 break-words">
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
                                {m.description &&
                                  m.description.trim() !== "" && (
                                    <p className="text-xs sm:text-sm text-gray-700 whitespace-pre-wrap break-words">
                                      {m.description}
                                    </p>
                                  )}
                                <div className="text-xs sm:text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                                  {m.dueDate && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                      <span>
                                        Due:{" "}
                                        {new Date(
                                          m.dueDate
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}

                {/* Attachments */}
                {((selectedProposalDetails.attachmentUrls &&
                  Array.isArray(selectedProposalDetails.attachmentUrls) &&
                  selectedProposalDetails.attachmentUrls.length > 0) ||
                  (selectedProposalDetails.attachments &&
                    Array.isArray(selectedProposalDetails.attachments) &&
                    selectedProposalDetails.attachments.length > 0)) && (
                  <div className="mt-4 sm:mt-6">
                    <h4 className="font-semibold mb-3 flex items-center text-gray-900 text-sm sm:text-base">
                      Attachments
                    </h4>
                    <div className="space-y-2">
                      {(
                        selectedProposalDetails.attachmentUrls ||
                        selectedProposalDetails.attachments ||
                        []
                      ).map((rawUrl: string, idx: number) => {
                        const normalized = rawUrl.replace(/\\/g, "/");
                        const fileName =
                          normalized.split("/").pop() || `file-${idx + 1}`;
                        const attachmentUrl = getAttachmentUrl(rawUrl);
                        const isR2Key =
                          attachmentUrl === "#" ||
                          (!attachmentUrl.startsWith("http") &&
                            !attachmentUrl.startsWith("/uploads/") &&
                            !attachmentUrl.includes(
                              process.env.NEXT_PUBLIC_API_URL || "localhost"
                            ));

                        return (
                          <a
                            key={idx}
                            href={
                              attachmentUrl === "#" ? undefined : attachmentUrl
                            }
                            download={fileName}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={
                              isR2Key
                                ? async (e) => {
                                    e.preventDefault();
                                    try {
                                      const downloadUrl =
                                        await getR2DownloadUrl(rawUrl);
                                      window.open(
                                        downloadUrl.downloadUrl,
                                        "_blank"
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Failed to get download URL:",
                                        error
                                      );
                                      toastHook({
                                        title: "Error",
                                        description:
                                          "Failed to download attachment",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                : undefined
                            }
                            className="flex items-start gap-2 sm:gap-3 rounded-lg border border-gray-200 bg-white px-2 sm:px-3 py-2 active:bg-gray-50 sm:hover:bg-gray-50 sm:hover:shadow-sm transition"
                          >
                            <div className="flex h-8 w-8 sm:h-9 sm:w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-[10px] sm:text-xs font-medium">
                              PDF
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="text-xs sm:text-sm font-medium text-gray-900 break-all leading-snug">
                                {fileName}
                              </span>
                              <span className="text-[10px] sm:text-xs text-gray-500 leading-snug">
                                Click to preview / download
                              </span>
                            </div>
                            <div className="ml-auto flex items-center text-gray-500 active:text-gray-700 sm:hover:text-gray-700">
                              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setProposalDetailsOpen(false);
                  setSelectedProposalDetails(null);
                }}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
