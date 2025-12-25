"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast, useToast } from "@/components/ui/use-toast";
import {
  MessageSquare,
  DollarSign,
  User,
  MapPin,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Paperclip,
  Download,
  FileText,
  Eye,
  X,
} from "lucide-react";
import { ProviderLayout } from "@/components/provider-layout";
import {
  getProviderProjectById,
  updateProviderMilestoneStatus,
  getProviderProjectMilestones,
  updateProviderProjectMilestones,
  approveProviderMilestones,
  createDispute,
  getDisputeByProject,
  updateDispute,
  getProfileImageUrl,
  getAttachmentUrl,
  getR2DownloadUrl,
  type Milestone,
} from "@/lib/api";
import { formatTimeline } from "@/lib/timeline-utils";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import { Separator } from "@/components/separator";

type ProjectCustomer = {
  id: string;
  name: string;
  email?: string;
  customerProfile?: {
    profileImageUrl?: string;
    industry?: string;
    location?: string;
    website?: string;
  };
};

type ProjectProposal = {
  id: string;
  attachmentUrls?: string[];
  createdAt?: string;
  submittedAt?: string;
  deliveryTime?: number;
};

type ProjectData = {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  approvedPrice?: number;
  progress?: number;
  completedMilestones?: number;
  totalMilestones?: number;
  skills?: string[];
  requirements?: string | string[];
  deliverables?: string | string[];
  milestones?: Milestone[];
  bids?: unknown[];
  files?: unknown[];
  messages?: unknown[];
  customer?: ProjectCustomer;
  customerId?: string;
  provider?: { id: string; name: string };
  providerId?: string;
  createdAt: string;
  originalTimeline?: string | null;
  providerProposedTimeline?: number | null;
  proposal?: ProjectProposal;
  Proposal?: ProjectProposal;
};

type DisputeData = {
  id: string;
  status: string;
  reason: string;
  description: string;
  contestedAmount?: number;
  suggestedResolution?: string;
  attachments?: string[];
  milestone?: { title: string; amount: number };
  raisedBy?: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  resolution?: string;
  resolutionNotes?: Array<{
    note: string;
    adminName?: string;
    createdAt: string;
  }>;
};

type UserData = {
  id: string;
  name?: string;
  email?: string;
};

type MessageData = {
  id: string;
  content?: string;
  message?: string;
  senderId?: string;
  sender?: { id: string; name: string };
  senderName?: string;
  createdAt?: string;
  timestamp?: string;
  attachments?: string[];
};

export default function ProviderProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast: toastHook } = useToast();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(
    null
  );
  const [milestoneDeliverables, setMilestoneDeliverables] = useState("");
  const [submitDeliverables, setSubmitDeliverables] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [submissionAttachment, setSubmissionAttachment] = useState<File | null>(
    null
  );
  const [updating, setUpdating] = useState(false);

  // Project milestone management
  const [milestoneEditorOpen, setMilestoneEditorOpen] = useState(false);
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]);
  const [savingMilestones, setSavingMilestones] = useState(false);
  const [milestoneApprovalState, setMilestoneApprovalState] = useState({
    milestonesLocked: false,
    companyApproved: false,
    providerApproved: false,
    milestonesApprovedAt: null as string | null,
  });
  const [milestoneErrors, setMilestoneErrors] = useState<
    Record<
      number,
      {
        title?: string;
        description?: string;
        dueDate?: string;
      }
    >
  >({});
  const [originalProjectMilestones, setOriginalProjectMilestones] = useState<
    Milestone[]
  >([]);
  const [milestoneFinalizeOpen, setMilestoneFinalizeOpen] = useState(false);

  // Dispute creation state
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [viewDisputeDialogOpen, setViewDisputeDialogOpen] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<DisputeData | null>(
    null
  );
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeContestedAmount, setDisputeContestedAmount] = useState("");
  const [disputeSuggestedResolution, setDisputeSuggestedResolution] =
    useState("");
  const [disputeAttachments, setDisputeAttachments] = useState<File[]>([]);
  const [selectedMilestoneForDispute, setSelectedMilestoneForDispute] =
    useState<string | null>(null);
  const [creatingDispute, setCreatingDispute] = useState(false);
  const [updatingDispute, setUpdatingDispute] = useState(false);
  const [disputeAdditionalNotes, setDisputeAdditionalNotes] = useState("");
  const [disputeUpdateAttachments, setDisputeUpdateAttachments] = useState<
    File[]
  >([]);
  const [projectMessages, setProjectMessages] = useState<MessageData[]>([]);
  const [token, setToken] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Load auth from localStorage on mount
  useEffect(() => {
    setToken(localStorage.getItem("token") || "");
    const user = localStorage.getItem("user");
    if (user) {
      try {
        setCurrentUser(JSON.parse(user));
      } catch (err) {
        console.error("Failed to parse user from localStorage", err);
      }
    }
  }, []);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProviderProjectById(params.id as string);

        if (response.success) {
          setProject(response.project);

          // Fetch dispute for this project
          try {
            const disputeRes = await getDisputeByProject(response.project.id);
            if (disputeRes.success && disputeRes.data) {
              setCurrentDispute(disputeRes.data);
            }
          } catch {
            // No dispute exists yet, which is fine
            console.log("No dispute found for project");
          }
        } else {
          setError("Failed to fetch project details");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch project"
        );
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchProject();
    }
  }, [params.id]);

  // Load project milestones
  useEffect(() => {
    (async () => {
      if (!project?.id) return;
      try {
        const milestoneData = await getProviderProjectMilestones(project.id);
        setProjectMilestones(
          Array.isArray(milestoneData.milestones)
            ? milestoneData.milestones.map(
                (m) =>
                  ({
                    ...m,
                    sequence:
                      (m as Milestone & { order?: number }).order ??
                      (m as Milestone).sequence ??
                      0,
                    // Ensure all milestone fields are included
                    submissionAttachmentUrl: (m as Milestone)
                      .submissionAttachmentUrl,
                    submissionNote: (m as Milestone).submissionNote,
                    submittedAt: (m as Milestone).submittedAt,
                    startDeliverables: (m as Milestone).startDeliverables,
                    submitDeliverables: (m as Milestone).submitDeliverables,
                    revisionNumber: (m as Milestone).revisionNumber,
                    submissionHistory: (m as Milestone).submissionHistory,
                  } as Milestone)
              )
            : []
        );
        setMilestoneApprovalState({
          milestonesLocked: milestoneData.milestonesLocked,
          companyApproved: milestoneData.companyApproved,
          providerApproved: milestoneData.providerApproved,
          milestonesApprovedAt: milestoneData.milestonesApprovedAt,
        });
      } catch (e) {
        console.warn("Failed to load project milestones:", e);
      }
    })();
  }, [project?.id]);

  // Helpers for project milestone editor
  const normalizeMilestoneSequences = (items: Milestone[]) =>
    items
      .map((m, i) => ({ ...m, sequence: i + 1 }))
      .sort((a, b) => a.sequence - b.sequence);

  const addProjectMilestone = () => {
    setProjectMilestones((prev) =>
      normalizeMilestoneSequences([
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

  // Fetch messages between the two project participants when Messages tab is opened
  const fetchProjectMessages = async () => {
    if (!token || !project) return;
    try {
      const currentUserId = currentUser?.id;
      const providerId = project.providerId || project.provider?.id;
      const customerId = project.customerId || project.customer?.id;
      const otherUserId =
        String(currentUserId) === String(providerId) ? customerId : providerId;
      if (!otherUserId) return;

      const url = `${
        process.env.NEXT_PUBLIC_API_URL || ""
      }/messages?otherUserId=${otherUserId}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data?.success) {
        setProjectMessages(Array.isArray(data.data) ? data.data : []);
      } else {
        console.warn("No project messages fetched:", data?.message);
        setProjectMessages([]);
      }
    } catch (err) {
      console.error("Error fetching project messages:", err);
      setProjectMessages([]);
    }
  };

  useEffect(() => {
    if (activeTab === "messages") {
      fetchProjectMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token, project]);

  const updateProjectMilestone = (i: number, patch: Partial<Milestone>) => {
    setProjectMilestones((prev) =>
      normalizeMilestoneSequences(
        prev.map((m, idx) => (idx === i ? { ...m, ...patch } : m))
      )
    );
  };

  const removeProjectMilestone = (i: number) => {
    setProjectMilestones((prev) =>
      normalizeMilestoneSequences(prev.filter((_, idx) => idx !== i))
    );
  };

  // Save project milestones
  const handleSaveProjectMilestones = async () => {
    if (!project?.id) return;

    // Validate milestones
    const errors: Record<
      number,
      { title?: string; description?: string; dueDate?: string }
    > = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let hasErrors = false;

    projectMilestones.forEach((m, idx) => {
      const milestoneErrors: {
        title?: string;
        description?: string;
        dueDate?: string;
      } = {};

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
          milestoneErrors.dueDate =
            "Due date cannot be in the past. Please select today or a future date.";
          hasErrors = true;
        }
      }

      if (Object.keys(milestoneErrors).length > 0) {
        errors[idx] = milestoneErrors;
      }
    });

    // Validate milestone sum equals bid amount
    const bidAmount = project?.approvedPrice || 0;
    if (bidAmount > 0) {
      const sumMilestones = projectMilestones.reduce(
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
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required milestone fields (title, description, due date) and ensure dates are not in the past. Also ensure milestone amounts sum equals the bid amount.",
        variant: "destructive",
      });
      return;
    }

    setMilestoneErrors({});

    try {
      setSavingMilestones(true);
      const payload = normalizeMilestoneSequences(projectMilestones).map(
        (m) => ({
          ...m,
          amount: Number(m.amount),
          dueDate: new Date(m.dueDate).toISOString(), // ensure ISO
        })
      );
      const res = await updateProviderProjectMilestones(project.id, payload);
      setMilestoneApprovalState({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      // Refresh milestones from API
      const milestoneData = await getProviderProjectMilestones(project.id);
      const refreshedMilestones = Array.isArray(milestoneData.milestones)
        ? milestoneData.milestones.map(
            (m) =>
              ({
                ...m,
                sequence:
                  (m as Milestone & { order?: number }).order ??
                  (m as Milestone).sequence ??
                  0,
                submissionAttachmentUrl: (m as Milestone)
                  .submissionAttachmentUrl,
                submissionNote: (m as Milestone).submissionNote,
                submittedAt: (m as Milestone).submittedAt,
                startDeliverables: (m as Milestone).startDeliverables,
                submitDeliverables: (m as Milestone).submitDeliverables,
                revisionNumber: (m as Milestone).revisionNumber,
                submissionHistory: (m as Milestone).submissionHistory,
              } as Milestone)
          )
        : [];

      // Update both current and original milestones with fresh data
      setProjectMilestones(refreshedMilestones);
      setOriginalProjectMilestones(
        JSON.parse(JSON.stringify(refreshedMilestones))
      );

      // Refresh project data to get updated milestones
      await refreshProjectData();

      toast({
        title: "Milestones updated",
        description: "Milestone changes have been saved.",
      });
    } catch (e) {
      toast({
        title: "Save failed",
        description:
          e instanceof Error ? e.message : "Could not save milestones",
        variant: "destructive",
      });
    } finally {
      setSavingMilestones(false);
    }
  };

  // Approve project milestones
  const handleApproveProjectMilestones = async () => {
    if (!project?.id) return;
    try {
      const res = await approveProviderMilestones(project.id);
      setMilestoneApprovalState({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      // Refresh project data to get updated milestones
      await refreshProjectData();

      // Always close the milestone editor dialog
      setMilestoneEditorOpen(false);

      // Toast feedback
      toast({
        title: "Milestones approved",
        description: res.milestonesLocked
          ? "Milestones are now locked. Work can start."
          : "Waiting for company to approve.",
      });

      // Open the finalize/summary dialog
      setMilestoneFinalizeOpen(true);
    } catch (e) {
      toast({
        title: "Approval failed",
        description:
          e instanceof Error ? e.message : "Could not approve milestones",
        variant: "destructive",
      });
    }
  };

  // Function to refresh all project data
  const refreshProjectData = async () => {
    if (!params.id) return;
    try {
      // Refresh project data
      const projectResponse = await getProviderProjectById(params.id as string);
      if (projectResponse.success) {
        setProject(projectResponse.project);
      }

      // Refresh milestones
      const milestoneData = await getProviderProjectMilestones(
        params.id as string
      );
      if (milestoneData.milestones) {
        const loadedMilestones = Array.isArray(milestoneData.milestones)
          ? milestoneData.milestones.map(
              (m) =>
                ({
                  ...m,
                  sequence:
                    (m as Milestone & { order?: number }).order ??
                    (m as Milestone).sequence ??
                    0,
                  submissionAttachmentUrl: (m as Milestone)
                    .submissionAttachmentUrl,
                  submissionNote: (m as Milestone).submissionNote,
                  submittedAt: (m as Milestone).submittedAt,
                  startDeliverables: (m as Milestone).startDeliverables,
                  submitDeliverables: (m as Milestone).submitDeliverables,
                  revisionNumber: (m as Milestone).revisionNumber,
                  submissionHistory: (m as Milestone).submissionHistory,
                } as Milestone)
            )
          : [];
        setProjectMilestones(loadedMilestones);
        setOriginalProjectMilestones(
          JSON.parse(JSON.stringify(loadedMilestones))
        ); // Deep copy
        setMilestoneApprovalState({
          milestonesLocked: milestoneData.milestonesLocked,
          companyApproved: milestoneData.companyApproved,
          providerApproved: milestoneData.providerApproved,
          milestonesApprovedAt: milestoneData.milestonesApprovedAt,
        });
      }

      // Refresh dispute if exists
      try {
        const disputeRes = await getDisputeByProject(params.id as string);
        if (disputeRes.success && disputeRes.data) {
          setCurrentDispute(disputeRes.data);
        }
      } catch {
        // No dispute exists, which is fine
      }
    } catch (err) {
      console.error("Error refreshing project data:", err);
    }
  };
  // Ensure a value is an array before mapping
  const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);

  const handleMilestoneUpdate = async (status: string) => {
    try {
      setUpdating(true);
      // Determine which deliverables to use based on status transition
      let deliverables = undefined;
      if (status === "IN_PROGRESS" && selectedMilestone?.status === "LOCKED") {
        // Starting work - use milestoneDeliverables (start deliverables)
        deliverables = milestoneDeliverables
          ? { description: milestoneDeliverables }
          : undefined;
      } else if (
        status === "SUBMITTED" &&
        selectedMilestone?.status === "IN_PROGRESS"
      ) {
        // Submitting work - use submitDeliverables
        deliverables = submitDeliverables
          ? { description: submitDeliverables }
          : undefined;
      } else {
        // Fallback to milestoneDeliverables for other cases
        deliverables = milestoneDeliverables
          ? { description: milestoneDeliverables }
          : undefined;
      }

      if (!selectedMilestone?.id) {
        toast({
          title: "Error",
          description: "Selected milestone is missing",
          variant: "destructive",
        });
        return;
      }

      const response = await updateProviderMilestoneStatus(
        selectedMilestone.id,
        status,
        deliverables,
        submissionNote || undefined,
        submissionAttachment || undefined
      );

      if (response.success) {
        // Refresh all project data including milestones
        await refreshProjectData();

        toast({
          title: "Success",
          description: "Milestone updated successfully",
        });
        setIsMilestoneDialogOpen(false);
        setSelectedMilestone(null);
        setMilestoneDeliverables("");
        setSubmitDeliverables("");
        setSubmissionNote("");
        setSubmissionAttachment(null);
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update milestone",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  // Handle dispute creation/update
  const handleCreateDispute = async () => {
    if (!disputeReason.trim() || !disputeDescription.trim()) {
      toast({
        title: "Validation Error",
        description: "Reason and description are required fields",
        variant: "destructive",
      });
      return;
    }

    if (!project?.id) {
      toast({
        title: "Error",
        description: "Project ID is missing",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingDispute(true);
      await createDispute({
        projectId: project.id,
        milestoneId: selectedMilestoneForDispute || undefined,
        reason: disputeReason.trim(),
        description: disputeDescription.trim(),
        contestedAmount: disputeContestedAmount
          ? parseFloat(disputeContestedAmount)
          : undefined,
        suggestedResolution: disputeSuggestedResolution.trim() || undefined,
        attachments:
          disputeAttachments.length > 0 ? disputeAttachments : undefined,
      });

      toast({
        title: currentDispute ? "Dispute Updated" : "Dispute Created",
        description: currentDispute
          ? "Your dispute has been updated successfully."
          : "Your dispute has been submitted successfully. The milestone has been frozen.",
      });

      // Refresh all project data including dispute and milestones
      await refreshProjectData();

      // Reset form
      setDisputeDialogOpen(false);
      setDisputeReason("");
      setDisputeDescription("");
      setDisputeContestedAmount("");
      setDisputeSuggestedResolution("");
      setDisputeAttachments([]);
      setSelectedMilestoneForDispute(null);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create/update dispute";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setCreatingDispute(false);
    }
  };

  const handleViewDispute = async () => {
    if (!project?.id) return;
    try {
      const disputeRes = await getDisputeByProject(project.id);
      if (disputeRes.success && disputeRes.data) {
        setCurrentDispute(disputeRes.data);
        setViewDisputeDialogOpen(true);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load dispute";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleUpdateDispute = async () => {
    if (!currentDispute?.id) return;
    if (
      !disputeAdditionalNotes.trim() &&
      disputeUpdateAttachments.length === 0
    ) {
      toast({
        title: "Validation Error",
        description: "Please add notes or attachments to update the dispute",
        variant: "destructive",
      });
      return;
    }

    try {
      setUpdatingDispute(true);
      await updateDispute(currentDispute.id, {
        additionalNotes: disputeAdditionalNotes.trim() || undefined,
        attachments:
          disputeUpdateAttachments.length > 0
            ? disputeUpdateAttachments
            : undefined,
        projectId: project?.id,
      });

      toast({
        title: "Dispute Updated",
        description: "Your update has been added to the dispute.",
      });

      // Refresh all project data including dispute
      await refreshProjectData();

      // Reset form
      setDisputeAdditionalNotes("");
      setDisputeUpdateAttachments([]);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update dispute";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUpdatingDispute(false);
    }
  };

  const handleDisputeAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setDisputeAttachments((prev) => [...prev, ...fileArray]);
    }
  };

  const handleDisputeUpdateAttachmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setDisputeUpdateAttachments((prev) => [...prev, ...fileArray]);
    }
  };

  const removeDisputeAttachment = (index: number) => {
    setDisputeAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDisputeUpdateAttachment = (index: number) => {
    setDisputeUpdateAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getDisputeStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "REJECTED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const getStatusText = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "Completed";
      case "IN_PROGRESS":
        return "In Progress";
      case "DISPUTED":
        return "Disputed";
      default:
        return status;
    }
  };

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
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
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getMilestoneStatusText = (status: string) => {
    switch (status) {
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
      case "REJECTED":
        return "Rejected";
      default:
        return status;
    }
  };

  // Check if any milestone is not locked (to show dispute button)
  const hasUnlockedMilestone = () => {
    if (!projectMilestones || projectMilestones.length === 0) {
      return true; // Show button if no milestones (edge case)
    }
    return projectMilestones.some(
      (milestone: Milestone) => milestone.status !== "LOCKED"
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: "MYR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-MY", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading project...
            </h3>
            <p className="text-gray-600">
              Please wait while we fetch the project details.
            </p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  if (error || !project) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error loading project
            </h3>
            <p className="text-gray-600 mb-4">{error || "Project not found"}</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  // Normalize project data to safe arrays to avoid runtime errors
  const safeProject = project ?? ({} as ProjectData);
  const messages = asArray<MessageData>(safeProject.messages);
  const currentUserId = currentUser?.id;
  const msgsToRender =
    projectMessages && projectMessages.length > 0 ? projectMessages : messages;

  const provider = project?.customer;

  const handleContact = () => {
    if (!provider || !provider.id) return;

    const profileImageUrl = provider.customerProfile?.profileImageUrl;
    const avatarUrl =
      profileImageUrl &&
      profileImageUrl !== "/placeholder.svg" &&
      !profileImageUrl.includes("/placeholder.svg")
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}${
            profileImageUrl.startsWith("/") ? "" : "/"
          }${profileImageUrl}`
        : "";

    router.push(
      `/provider/messages?userId=${provider.id}&name=${encodeURIComponent(
        provider.name || ""
      )}&avatar=${encodeURIComponent(avatarUrl)}`
    );
  };

  return (
    <ProviderLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">
              {project.title}
            </h1>
            <p className="text-gray-600">{project.description}</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <MessageSquare className="w-4 h-4 mr-2" />
              Message Client
            </Button>
            {currentDispute ? (
              <Button
                variant="outline"
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                onClick={handleViewDispute}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Dispute
              </Button>
            ) : (
              project.status !== "COMPLETED" &&
              hasUnlockedMilestone() && (
                <Button
                  onClick={() => setDisputeDialogOpen(true)}
                  disabled={
                    creatingDispute ||
                    Boolean(
                      project?.status === "DISPUTED" &&
                        currentDispute &&
                        (currentDispute as DisputeData).status === "CLOSED"
                    )
                  }
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {creatingDispute ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mr-2" />
                  )}
                  Report Dispute
                </Button>
              )
            )}
          </div>
        </div>

        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="milestones">Milestones</TabsTrigger>
                <TabsTrigger value="files">Files</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* Project Details */}
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Category
                        </Label>
                        <p className="text-lg">{project.category}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Status
                        </Label>
                        <Badge className={getStatusColor(project.status)}>
                          {getStatusText(project.status)}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Budget Range
                        </Label>
                        <p className="text-lg">
                          {formatCurrency(project.budgetMin)} -{" "}
                          {formatCurrency(project.budgetMax)}
                        </p>
                      </div>
                      {project.approvedPrice && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">
                            Approved Price
                          </Label>
                          <p className="text-lg font-semibold text-green-600">
                            {formatCurrency(project.approvedPrice)}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Timeline
                        </Label>
                        <div className="space-y-2">
                          {project.originalTimeline && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Original Timeline (Company):
                              </p>
                              <p className="text-sm text-gray-900 font-medium">
                                {formatTimeline(project.originalTimeline)}
                              </p>
                            </div>
                          )}
                          {project.providerProposedTimeline && (
                            <div>
                              <p className="text-xs text-gray-500 mb-1">
                                Your Proposed Timeline:
                              </p>
                              <p className="text-sm text-gray-900 font-medium">
                                {formatTimeline(
                                  project.providerProposedTimeline,
                                  "day"
                                )}
                              </p>
                            </div>
                          )}
                          {!project.originalTimeline &&
                            !project.providerProposedTimeline && (
                              <p className="text-sm text-gray-600">
                                Not specified
                              </p>
                            )}
                        </div>
                      </div>
                    </div>

                    {project.skills && project.skills.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Required Skills
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {project.skills.map(
                            (skill: string, index: number) => (
                              <Badge key={index} variant="secondary">
                                {skill}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {project.requirements && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Requirements
                        </Label>
                        <div className="mt-2 space-y-3">
                          {Array.isArray(project.requirements) ? (
                            project.requirements.map(
                              (req: string | unknown, index: number) => (
                                <div key={index} className="text-gray-700">
                                  <MarkdownViewer
                                    content={
                                      typeof req === "string"
                                        ? req
                                        : String(req)
                                    }
                                    className="prose max-w-none text-gray-700"
                                    emptyMessage={""}
                                  />
                                </div>
                              )
                            )
                          ) : (
                            <div className="text-gray-700">
                              <MarkdownViewer
                                content={String(project.requirements)}
                                className="prose max-w-none text-gray-700"
                                emptyMessage={""}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {project.deliverables && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Deliverables
                        </Label>
                        <div className="mt-2 space-y-3">
                          {Array.isArray(project.deliverables) ? (
                            project.deliverables.map(
                              (del: string | unknown, index: number) => (
                                <div key={index} className="text-gray-700">
                                  <MarkdownViewer
                                    content={
                                      typeof del === "string"
                                        ? del
                                        : String(del)
                                    }
                                    className="prose max-w-none text-gray-700"
                                    emptyMessage={""}
                                  />
                                </div>
                              )
                            )
                          ) : (
                            <div className="text-gray-700">
                              <MarkdownViewer
                                content={String(project.deliverables)}
                                className="prose max-w-none text-gray-700"
                                emptyMessage={""}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Progress */}
                {project.status === "IN_PROGRESS" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span>Overall Progress</span>
                          <span>{project.progress || 0}%</span>
                        </div>
                        <Progress
                          value={project.progress || 0}
                          className="h-3"
                        />
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>
                            {project.completedMilestones || 0} of{" "}
                            {project.totalMilestones || 0} milestones completed
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="milestones" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Milestones</CardTitle>
                    <CardDescription>
                      Track and manage project milestones
                    </CardDescription>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <Badge variant="outline">
                        Company{" "}
                        {milestoneApprovalState.companyApproved ? "✓" : "✗"} ·
                        Provider{" "}
                        {milestoneApprovalState.providerApproved ? "✓" : "✗"}
                        {milestoneApprovalState.milestonesLocked && " · LOCKED"}
                      </Badge>
                      {!milestoneApprovalState.milestonesLocked && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Store original milestones when opening editor
                              setOriginalProjectMilestones(
                                JSON.parse(JSON.stringify(projectMilestones))
                              );
                              setMilestoneEditorOpen(true);
                            }}
                          >
                            Edit Milestones
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleApproveProjectMilestones}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {projectMilestones && projectMilestones.length > 0 ? (
                        projectMilestones.map(
                          (milestone: Milestone, index: number) => {
                            return (
                              <div
                                key={milestone.id}
                                className="border rounded-lg p-4"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                                      {milestone.order}
                                    </div>
                                    <div>
                                      <h4 className="font-medium">
                                        {milestone.title}
                                      </h4>
                                      <p className="text-sm text-gray-600">
                                        {milestone.description}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <Badge
                                      className={getMilestoneStatusColor(
                                        milestone.status || ""
                                      )}
                                    >
                                      {getMilestoneStatusText(
                                        milestone.status || ""
                                      )}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                      {formatCurrency(milestone.amount)}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                  <span>
                                    Due: {formatDate(milestone.dueDate)}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    {milestone.status === "PAID" && (
                                      <div className="flex items-center gap-1 text-green-600">
                                        <DollarSign className="w-4 h-4" />
                                        <span className="text-sm font-medium">
                                          Paid
                                        </span>
                                      </div>
                                    )}
                                    {milestone.status === "LOCKED" &&
                                      project.status === "IN_PROGRESS" && (
                                        <div>
                                          <Button size="sm" disabled={true}>
                                            Start Work
                                          </Button>
                                        </div>
                                      )}
                                    {milestone.status === "LOCKED" &&
                                      project?.status === "IN_PROGRESS" &&
                                      projectMilestones.findIndex(
                                        (m: Milestone) =>
                                          m.status === "LOCKED" &&
                                          project?.status === "IN_PROGRESS"
                                      ) === index && (
                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                      )}
                                    {milestone.status === "IN_PROGRESS" &&
                                      project.status === "ESCROWED" && (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            setSelectedMilestone(milestone);
                                            setIsMilestoneDialogOpen(true);
                                          }}
                                        >
                                          Start Work
                                        </Button>
                                      )}
                                    {milestone.status === "IN_PROGRESS" && (
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          setSelectedMilestone(milestone);
                                          setIsMilestoneDialogOpen(true);
                                        }}
                                      >
                                        Submit
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {/* Show warning for first locked milestone that complies */}
                                {milestone.status === "LOCKED" &&
                                project?.status === "IN_PROGRESS" &&
                                projectMilestones.findIndex(
                                  (m: Milestone) =>
                                    m.status === "LOCKED" &&
                                    project?.status === "IN_PROGRESS"
                                ) === index ? (
                                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-amber-800">
                                      {index > 0 &&
                                      projectMilestones[index - 1].status !==
                                        "APPROVED"
                                        ? "You can't start this milestone until the previous milestone is approved by the client."
                                        : "You can't start work until the client has paid."}
                                    </p>
                                  </div>
                                ) : null}

                                {/* FIX 1: Start Deliverables */}
                                {/* Added explicit return type to IIFE */}
                                {((): React.ReactNode => {
                                  if (!milestone.startDeliverables) return null;

                                  const sd = milestone.startDeliverables;
                                  let displayText: string = "";

                                  if (typeof sd === "string") {
                                    displayText = sd;
                                  } else if (
                                    typeof sd === "object" &&
                                    sd !== null
                                  ) {
                                    const desc = (sd as Record<string, unknown>)
                                      .description;
                                    displayText =
                                      typeof desc === "string"
                                        ? desc
                                        : String(desc || "");
                                  } else {
                                    displayText = String(sd);
                                  }

                                  if (!displayText) return null;

                                  return (
                                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                      <p className="text-sm font-medium text-green-900 mb-1">
                                        📋 Plan / Deliverables (When Starting
                                        Work):
                                      </p>
                                      <p className="text-sm text-green-800 whitespace-pre-wrap">
                                        {displayText}
                                      </p>
                                    </div>
                                  );
                                })()}

                                {/* FIX 2: Submit Deliverables (Main Loop) */}
                                {/* Added !! to force boolean check to avoid returning 'unknown' */}
                                {!!milestone.submitDeliverables && (
                                  <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                    <p className="text-sm font-medium text-purple-900 mb-1">
                                      ✅ Deliverables / Completion Notes (When
                                      Submitting):
                                    </p>
                                    <p className="text-sm text-purple-800 whitespace-pre-wrap">
                                      {((): React.ReactNode => {
                                        const sd = milestone.submitDeliverables;
                                        let text: string = "";
                                        if (typeof sd === "string") {
                                          text = sd;
                                        } else if (
                                          typeof sd === "object" &&
                                          sd !== null &&
                                          "description" in sd
                                        ) {
                                          const desc = (
                                            sd as Record<string, unknown>
                                          ).description;
                                          text =
                                            typeof desc === "string"
                                              ? desc
                                              : String(desc || "");
                                        } else {
                                          text = String(sd || "");
                                        }
                                        return text;
                                      })()}
                                    </p>
                                  </div>
                                )}

                                {/* Show submission note if available */}
                                {/* Added !! to force boolean check */}
                                {!!milestone.submissionNote && (
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm font-medium text-blue-900 mb-1">
                                      📝 Submission Note:
                                    </p>
                                    <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                      {milestone.submissionNote}
                                    </p>
                                  </div>
                                )}

                                {/* Show latest requested changes reason if available */}
                                {milestone.submissionHistory &&
                                  Array.isArray(milestone.submissionHistory) &&
                                  milestone.submissionHistory.length > 0 &&
                                  ((): React.ReactNode => {
                                    const latestRequest = milestone
                                      .submissionHistory[
                                      milestone.submissionHistory.length - 1
                                    ] as Record<string, unknown>;
                                    if (
                                      latestRequest &&
                                      typeof latestRequest === "object" &&
                                      "requestedChangesReason" in
                                        latestRequest &&
                                      typeof latestRequest.requestedChangesReason ===
                                        "string"
                                    ) {
                                      return (
                                        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                          <p className="text-sm font-medium text-orange-900 mb-1">
                                            🔄 Latest Request for Changes
                                            (Revision #
                                            {typeof latestRequest.revisionNumber ===
                                            "number"
                                              ? latestRequest.revisionNumber
                                              : milestone.submissionHistory
                                                  .length}
                                            ):
                                          </p>
                                          <p className="text-sm text-orange-800 whitespace-pre-wrap">
                                            {typeof latestRequest.requestedChangesReason ===
                                            "string"
                                              ? latestRequest.requestedChangesReason
                                              : ""}
                                          </p>
                                          {latestRequest.requestedChangesAt &&
                                          typeof latestRequest.requestedChangesAt ===
                                            "string" ? (
                                            <p className="text-xs text-orange-600 mt-2">
                                              Requested on:{" "}
                                              {new Date(
                                                latestRequest.requestedChangesAt as string
                                              ).toLocaleString()}
                                            </p>
                                          ) : null}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}

                                {/* Show attachment if available */}
                                {/* Added !! to force boolean check */}
                                {!!milestone.submissionAttachmentUrl && (
                                  <div className="mt-3">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Paperclip className="w-4 h-4 text-gray-600" />
                                      <span className="text-sm font-medium text-gray-900">
                                        📎 Submission Attachment
                                      </span>
                                    </div>
                                    {((): React.ReactNode => {
                                      const normalized =
                                        milestone.submissionAttachmentUrl!.replace(
                                          /\\/g,
                                          "/"
                                        );
                                      const fileName =
                                        normalized.split("/").pop() ||
                                        "attachment";
                                      const attachmentUrl = getAttachmentUrl(
                                        milestone.submissionAttachmentUrl
                                      );
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
                                        <a
                                          href={attachmentUrl}
                                          download={fileName}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          onClick={
                                            isR2Key &&
                                            milestone.submissionAttachmentUrl
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
                                          className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 hover:shadow-sm transition"
                                        >
                                          <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                            PDF
                                          </div>
                                          <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                              {fileName}
                                            </span>
                                            <span className="text-xs text-gray-500 leading-snug">
                                              Click to preview / download
                                            </span>
                                          </div>
                                          <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                                            <Download className="w-4 h-4" />
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
                                    <div className="mt-4 border-t pt-4">
                                      <p className="text-sm font-semibold text-gray-900 mb-3">
                                        📚 Previous Submission History:
                                      </p>
                                      <div className="space-y-3">
                                        {(
                                          milestone.submissionHistory as Array<
                                            Record<string, unknown>
                                          >
                                        ).map(
                                          (
                                            history: Record<string, unknown>,
                                            idx: number
                                          ) => {
                                            const revisionNumberValue =
                                              history.revisionNumber;
                                            const revisionNumber: number =
                                              typeof revisionNumberValue ===
                                                "number" &&
                                              revisionNumberValue !== null &&
                                              revisionNumberValue !== undefined
                                                ? revisionNumberValue
                                                : idx + 1;

                                            const requestedChangesAt =
                                              history.requestedChangesAt;
                                            const requestedChangesReason =
                                              history.requestedChangesReason;
                                            const submitDeliverables =
                                              history.submitDeliverables;
                                            const submissionNote =
                                              history.submissionNote;
                                            const submissionAttachmentUrl =
                                              history.submissionAttachmentUrl;
                                            const submittedAt =
                                              history.submittedAt;

                                            return (
                                              <div
                                                key={idx}
                                                className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                              >
                                                <div className="flex items-center justify-between mb-2">
                                                  <p className="text-sm font-medium text-gray-900">
                                                    Revision #{revisionNumber}
                                                  </p>
                                                  {requestedChangesAt &&
                                                  typeof requestedChangesAt ===
                                                    "string" ? (
                                                    <span className="text-xs text-gray-500">
                                                      Changes requested:{" "}
                                                      {new Date(
                                                        requestedChangesAt
                                                      ).toLocaleDateString()}
                                                    </span>
                                                  ) : null}
                                                </div>

                                                {requestedChangesReason &&
                                                typeof requestedChangesReason ===
                                                  "string" ? (
                                                  <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                                    <p className="text-xs font-medium text-red-900 mb-1">
                                                      Reason for Changes:
                                                    </p>
                                                    <p className="text-xs text-red-800">
                                                      {requestedChangesReason}
                                                    </p>
                                                  </div>
                                                ) : null}

                                                {/* FIX 3: History Submit Deliverables */}
                                                {/* Added boolean cast check */}
                                                {!!submitDeliverables ? (
                                                  <div className="mb-2">
                                                    <p className="text-xs font-medium text-gray-700 mb-1">
                                                      Deliverables:
                                                    </p>
                                                    <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                                      {((): React.ReactNode => {
                                                        let text: string = "";
                                                        if (
                                                          typeof submitDeliverables ===
                                                          "string"
                                                        ) {
                                                          text =
                                                            submitDeliverables;
                                                        } else if (
                                                          typeof submitDeliverables ===
                                                            "object" &&
                                                          submitDeliverables !==
                                                            null &&
                                                          "description" in
                                                            submitDeliverables
                                                        ) {
                                                          const desc = (
                                                            submitDeliverables as Record<
                                                              string,
                                                              unknown
                                                            >
                                                          ).description;
                                                          text =
                                                            typeof desc ===
                                                            "string"
                                                              ? desc
                                                              : String(
                                                                  desc || ""
                                                                );
                                                        } else {
                                                          text = String(
                                                            submitDeliverables ||
                                                              ""
                                                          );
                                                        }
                                                        return text;
                                                      })()}
                                                    </p>
                                                  </div>
                                                ) : null}

                                                {submissionNote &&
                                                typeof submissionNote ===
                                                  "string" ? (
                                                  <div className="mb-2">
                                                    <p className="text-xs font-medium text-gray-700 mb-1">
                                                      Note:
                                                    </p>
                                                    <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                                      {submissionNote}
                                                    </p>
                                                  </div>
                                                ) : null}

                                                {submissionAttachmentUrl &&
                                                typeof submissionAttachmentUrl ===
                                                  "string" ? (
                                                  <div>
                                                    <p className="text-xs font-medium text-gray-700 mb-1">
                                                      Attachment:
                                                    </p>
                                                    {((): React.ReactNode => {
                                                      const attachmentUrl =
                                                        getAttachmentUrl(
                                                          submissionAttachmentUrl
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
                                                      const fileName =
                                                        submissionAttachmentUrl
                                                          .replace(/\\/g, "/")
                                                          .split("/")
                                                          .pop() ||
                                                        "attachment";

                                                      return (
                                                        <a
                                                          href={attachmentUrl}
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
                                                                        submissionAttachmentUrl
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
                                                          className="text-xs text-blue-600 hover:text-blue-800 underline"
                                                        >
                                                          {fileName}
                                                        </a>
                                                      );
                                                    })()}
                                                  </div>
                                                ) : null}

                                                {submittedAt &&
                                                typeof submittedAt ===
                                                  "string" ? (
                                                  <p className="text-xs text-gray-500 mt-2">
                                                    Submitted:{" "}
                                                    {new Date(
                                                      submittedAt
                                                    ).toLocaleString()}
                                                  </p>
                                                ) : null}
                                              </div>
                                            );
                                          }
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            );
                          }
                        )
                      ) : (
                        <p className="text-gray-600 text-center py-8">
                          No milestones found
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="files" className="space-y-6">
                {/* Proposal Attachments Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Proposal Attachments</CardTitle>
                    <CardDescription>
                      Files attached to your accepted proposal
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Get attachments from the provider's proposal
                      const proposalAttachments: string[] = [];

                      // Get attachments from project.proposal or project.Proposal (backend returns it as proposal)
                      if (
                        project?.proposal?.attachmentUrls &&
                        Array.isArray(project.proposal.attachmentUrls)
                      ) {
                        proposalAttachments.push(
                          ...project.proposal.attachmentUrls
                        );
                      } else if (
                        project?.Proposal?.attachmentUrls &&
                        Array.isArray(project.Proposal.attachmentUrls)
                      ) {
                        proposalAttachments.push(
                          ...project.Proposal.attachmentUrls
                        );
                      }

                      if (proposalAttachments.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 text-center py-8">
                            No proposal attachments found
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {proposalAttachments.map((url, idx) => {
                            const normalized = url.replace(/\\/g, "/");
                            const fileName =
                              normalized.split("/").pop() || `file-${idx + 1}`;
                            const attachmentUrl = getAttachmentUrl(url);
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
                                            await getR2DownloadUrl(url); // Use original URL/key
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
                                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 hover:shadow-sm transition"
                              >
                                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                  PDF
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                    {fileName}
                                  </span>
                                  <span className="text-xs text-gray-500 leading-snug">
                                    From your proposal
                                    {project?.proposal?.createdAt &&
                                      ` • Submitted: ${new Date(
                                        project.proposal.createdAt
                                      ).toLocaleDateString()}`}
                                    {project?.proposal?.submittedAt &&
                                      ` • Submitted: ${new Date(
                                        project.proposal.submittedAt
                                      ).toLocaleDateString()}`}
                                    <span className="block mt-0.5">
                                      Click to preview / download
                                    </span>
                                  </span>
                                </div>
                                <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                                  <Download className="w-4 h-4" />
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
                  <CardHeader>
                    <CardTitle>Milestone Attachments</CardTitle>
                    <CardDescription>
                      Files attached to milestone submissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      // Get attachments from milestones
                      const milestoneAttachments: Array<{
                        url: string;
                        milestoneTitle: string;
                        milestoneId: string;
                        submittedAt?: string;
                      }> = [];

                      projectMilestones.forEach((milestone) => {
                        // Current submission attachment
                        if (milestone.submissionAttachmentUrl && milestone.id) {
                          milestoneAttachments.push({
                            url: milestone.submissionAttachmentUrl,
                            milestoneTitle: milestone.title,
                            milestoneId: milestone.id,
                            submittedAt: milestone.submittedAt,
                          });
                        }

                        // History submission attachments
                        if (
                          milestone.submissionHistory &&
                          Array.isArray(milestone.submissionHistory) &&
                          milestone.id
                        ) {
                          const milestoneId = milestone.id; // Store in const for type narrowing
                          (
                            milestone.submissionHistory as Array<
                              Record<string, unknown>
                            >
                          ).forEach((history: Record<string, unknown>) => {
                            const submissionAttachmentUrl =
                              history.submissionAttachmentUrl;
                            if (
                              submissionAttachmentUrl &&
                              typeof submissionAttachmentUrl === "string"
                            ) {
                              const revisionNumber = history.revisionNumber;
                              const submittedAt = history.submittedAt;
                              milestoneAttachments.push({
                                url: submissionAttachmentUrl,
                                milestoneTitle: `${milestone.title} (Revision ${
                                  typeof revisionNumber === "number"
                                    ? revisionNumber
                                    : revisionNumber !== undefined &&
                                      revisionNumber !== null
                                    ? String(revisionNumber)
                                    : "N/A"
                                })`,
                                milestoneId: milestoneId,
                                submittedAt:
                                  typeof submittedAt === "string"
                                    ? submittedAt
                                    : undefined,
                              });
                            }
                          });
                        }
                      });

                      if (milestoneAttachments.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 text-center py-8">
                            No milestone attachments found
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {milestoneAttachments.map((attachment, idx) => {
                            const normalized = attachment.url.replace(
                              /\\/g,
                              "/"
                            );
                            const fileName =
                              normalized.split("/").pop() || `file-${idx + 1}`;
                            const attachmentUrl = getAttachmentUrl(
                              attachment.url
                            );
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
                                              attachment.url
                                            ); // Use original URL/key
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
                                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 hover:shadow-sm transition"
                              >
                                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                  PDF
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                    {fileName}
                                  </span>
                                  <span className="text-xs text-gray-500 leading-snug">
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
                                <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                                  <Download className="w-4 h-4" />
                                </div>
                              </a>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Message Attachments Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Message Attachments</CardTitle>
                    <CardDescription>
                      Files attached to project messages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 text-center py-8">
                      Message attachments will be available here once
                      implemented
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Project Messages</CardTitle>
                    <CardDescription>
                      Communication with your assigned provider
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {msgsToRender.map((message: MessageData) => {
                        const isCurrentUser =
                          String(message.senderId || message.sender?.id) ===
                          String(currentUserId);
                        const text = message.content ?? message.message ?? "";
                        const ts = message.createdAt ?? message.timestamp ?? "";
                        const avatarChar =
                          (
                            message.sender?.name ||
                            message.senderName ||
                            (isCurrentUser ? "You" : "User")
                          )?.charAt?.(0) || "U";

                        return (
                          <div
                            key={message.id}
                            className={`flex gap-3 ${
                              isCurrentUser ? "flex-row-reverse" : ""
                            }`}
                          >
                            <Avatar className="w-8 h-8">
                              <AvatarFallback>{avatarChar}</AvatarFallback>
                            </Avatar>
                            <div
                              className={`flex-1 max-w-[14rem] ${
                                isCurrentUser ? "text-right" : ""
                              }`}
                            >
                              <div
                                className={`p-3 rounded-lg ${
                                  isCurrentUser
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100"
                                }`}
                              >
                                <p className="text-sm">{text}</p>
                                {message.attachments &&
                                  message.attachments.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-opacity-20">
                                      {asArray<string>(message.attachments).map(
                                        (attachment, index) => (
                                          <div
                                            key={index}
                                            className="text-xs opacity-75"
                                          >
                                            📎 {attachment}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{ts}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-center gap-2">
                      <Button onClick={handleContact}>Contact</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={getProfileImageUrl(
                        project.customer?.customerProfile?.profileImageUrl
                      )}
                    />
                    <AvatarFallback>
                      {project.customer?.name?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    {project.customer?.id ? (
                      <Link
                        href={`/provider/companies/${project.customer.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 hover:underline block"
                      >
                        {project.customer?.name}
                      </Link>
                    ) : (
                      <p className="font-medium">{project.customer?.name}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      {project.customer?.email}
                    </p>
                  </div>
                </div>

                {project.customer?.customerProfile && (
                  <div className="space-y-2 text-sm">
                    {project.customer.customerProfile.industry && (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{project.customer.customerProfile.industry}</span>
                      </div>
                    )}
                    {project.customer.customerProfile.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span>{project.customer.customerProfile.location}</span>
                      </div>
                    )}
                    {project.customer.customerProfile.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a
                          href={project.customer.customerProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">
                    Total Milestones
                  </span>
                  <span className="font-medium">
                    {project.totalMilestones || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="font-medium text-green-600">
                    {project.completedMilestones || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Progress</span>
                  <span className="font-medium">{project.progress || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Created</span>
                  <span className="font-medium">
                    {formatDate(project.createdAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Milestone Update Dialog */}
        <Dialog
          open={isMilestoneDialogOpen}
          onOpenChange={setIsMilestoneDialogOpen}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedMilestone?.status === "LOCKED"
                  ? "Start Milestone Work"
                  : "Submit Milestone"}
              </DialogTitle>
              <DialogDescription>
                {selectedMilestone?.status === "LOCKED"
                  ? "Start working on this milestone"
                  : "Submit your work for this milestone"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedMilestone?.status === "LOCKED" && (
                <div>
                  <Label htmlFor="startDeliverables">
                    Deliverables / Plan (When Starting Work)
                  </Label>
                  <Textarea
                    id="startDeliverables"
                    placeholder="Describe your plan and deliverables when starting this milestone..."
                    value={milestoneDeliverables}
                    onChange={(e) => setMilestoneDeliverables(e.target.value)}
                    rows={4}
                  />
                </div>
              )}

              {selectedMilestone?.status === "IN_PROGRESS" && (
                <>
                  <div>
                    <Label htmlFor="submitDeliverables">
                      Deliverables / Notes (When Submitting)
                    </Label>
                    <Textarea
                      id="submitDeliverables"
                      placeholder="Describe what you've completed and your deliverables when submitting..."
                      value={submitDeliverables}
                      onChange={(e) => setSubmitDeliverables(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="submissionNote">
                      Submission Note (Optional)
                    </Label>
                    <Textarea
                      id="submissionNote"
                      placeholder="Add any additional notes about your submission..."
                      value={submissionNote}
                      onChange={(e) => setSubmissionNote(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="attachment">Attachment (Optional)</Label>
                    <Input
                      id="attachment"
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSubmissionAttachment(file);
                        }
                      }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.jpg,.jpeg,.png"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: PDF, DOC, DOCX, XLS, XLSX, ZIP, TXT, JPG, PNG
                      (Max 10MB)
                    </p>
                    {submissionAttachment && (
                      <div className="mt-2 text-sm text-gray-600">
                        Selected: {submissionAttachment.name}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsMilestoneDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() =>
                  handleMilestoneUpdate(
                    selectedMilestone?.status === "LOCKED"
                      ? "IN_PROGRESS"
                      : "SUBMITTED"
                  )
                }
                disabled={updating}
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {selectedMilestone?.status === "LOCKED"
                  ? "Start Work"
                  : "Submit"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Milestone Editor Dialog */}
        <Dialog
          open={milestoneEditorOpen}
          onOpenChange={setMilestoneEditorOpen}
        >
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Milestones</DialogTitle>
              <DialogDescription>
                Company {milestoneApprovalState.companyApproved ? "✓" : "✗"} ·
                Provider {milestoneApprovalState.providerApproved ? "✓" : "✗"}
                {milestoneApprovalState.milestonesLocked && " · LOCKED"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {milestoneErrors[-1]?.title && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600 font-medium">
                    {milestoneErrors[-1].title}
                  </p>
                </div>
              )}
              {projectMilestones.map((m, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid md:grid-cols-12 gap-3">
                      <div className="md:col-span-1">
                        <Label className="text-sm font-medium">Seq</Label>
                        <Input type="number" value={i + 1} disabled />
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-sm font-medium">
                          Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={m.title}
                          onChange={(e) => {
                            updateProjectMilestone(i, {
                              title: e.target.value,
                            });
                            if (milestoneErrors[i]?.title) {
                              setMilestoneErrors((prev) => ({
                                ...prev,
                                [i]: { ...prev[i], title: undefined },
                              }));
                            }
                          }}
                          className={
                            milestoneErrors[i]?.title
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                        {milestoneErrors[i]?.title && (
                          <p className="text-xs text-red-600 mt-1">
                            {milestoneErrors[i].title}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-sm font-medium">Amount</Label>
                        <Input
                          type="number"
                          value={String(m.amount ?? 0)}
                          onChange={(e) => {
                            updateProjectMilestone(i, {
                              amount: Number(e.target.value),
                            });
                            // Clear sum error when amount changes
                            if (milestoneErrors[-1]) {
                              setMilestoneErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors[-1];
                                return newErrors;
                              });
                            }
                          }}
                        />
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-sm font-medium">
                          Due Date <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          type="date"
                          min={new Date().toISOString().split("T")[0]}
                          value={(m.dueDate || "").slice(0, 10)}
                          onChange={(e) => {
                            const selectedDate = e.target.value;
                            const today = new Date()
                              .toISOString()
                              .split("T")[0];
                            if (selectedDate < today) {
                              toast({
                                title: "Invalid Date",
                                description:
                                  "Due date cannot be in the past. Please select today or a future date.",
                                variant: "destructive",
                              });
                              return;
                            }
                            updateProjectMilestone(i, {
                              dueDate: selectedDate,
                            });
                            if (milestoneErrors[i]?.dueDate) {
                              setMilestoneErrors((prev) => ({
                                ...prev,
                                [i]: { ...prev[i], dueDate: undefined },
                              }));
                            }
                          }}
                          className={
                            milestoneErrors[i]?.dueDate
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                        {milestoneErrors[i]?.dueDate && (
                          <p className="text-xs text-red-600 mt-1">
                            {milestoneErrors[i].dueDate}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">
                        Description <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        rows={2}
                        value={m.description || ""}
                        onChange={(e) => {
                          updateProjectMilestone(i, {
                            description: e.target.value,
                          });
                          if (milestoneErrors[i]?.description) {
                            setMilestoneErrors((prev) => ({
                              ...prev,
                              [i]: { ...prev[i], description: undefined },
                            }));
                          }
                        }}
                        className={
                          milestoneErrors[i]?.description
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }
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
                        onClick={() => removeProjectMilestone(i)}
                      >
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-between">
                <Button variant="outline" onClick={addProjectMilestone}>
                  + Add Milestone
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleSaveProjectMilestones}
                    disabled={savingMilestones}
                  >
                    {savingMilestones ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    onClick={handleApproveProjectMilestones}
                    disabled={
                      JSON.stringify(
                        normalizeMilestoneSequences(projectMilestones)
                      ) !==
                      JSON.stringify(
                        normalizeMilestoneSequences(originalProjectMilestones)
                      )
                    }
                  >
                    Approve
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter />
          </DialogContent>
        </Dialog>

        {/* Milestones Finalized Dialog */}
        <Dialog
          open={milestoneFinalizeOpen}
          onOpenChange={setMilestoneFinalizeOpen}
        >
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Milestones Submitted
              </DialogTitle>
              <DialogDescription>
                These milestones are now awaiting final confirmation, or have
                been locked if both sides approved.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 text-sm text-gray-700">
              <div className="flex items-start gap-3">
                <CheckCircle
                  className={`w-5 h-5 flex-shrink-0 ${
                    milestoneApprovalState.companyApproved
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    Company Approved
                  </div>
                  <div>
                    {milestoneApprovalState.companyApproved
                      ? "The company approved the milestone plan."
                      : "Waiting for company approval."}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-gray-900">
                    Provider Approved
                  </div>
                  <div>
                    {milestoneApprovalState.providerApproved
                      ? "You have approved the milestone plan."
                      : "You haven't approved yet."}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle
                  className={`w-5 h-5 flex-shrink-0 ${
                    milestoneApprovalState.milestonesLocked
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                />
                <div>
                  <div className="font-semibold text-gray-900">
                    Locked & Ready
                  </div>
                  <div>
                    {milestoneApprovalState.milestonesLocked
                      ? "Milestones are locked. Work can start and payments will follow these milestones."
                      : "Milestones are not locked yet."}
                  </div>
                  {milestoneApprovalState.milestonesApprovedAt && (
                    <div className="text-xs text-gray-500 mt-1">
                      Locked at{" "}
                      {new Date(
                        milestoneApprovalState.milestonesApprovedAt
                      ).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setMilestoneFinalizeOpen(false)}>
                Done
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dispute Creation Dialog */}
        <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Report Dispute</DialogTitle>
              <DialogDescription>
                Report a dispute related to this project. The associated
                milestone will be frozen until the dispute is resolved.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Milestone Selection (if applicable) */}
              {projectMilestones && projectMilestones.length > 0 && (
                <div>
                  <Label htmlFor="disputeMilestone">
                    Related Milestone (Optional)
                  </Label>
                  <Select
                    value={selectedMilestoneForDispute || undefined}
                    onValueChange={(value) =>
                      setSelectedMilestoneForDispute(value || null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a milestone (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectMilestones.map((m: Milestone) => (
                        <SelectItem key={m.id || ""} value={m.id || ""}>
                          {m.title} - RM{m.amount?.toLocaleString() || 0}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    If selected, this milestone will be frozen until the dispute
                    is resolved.
                  </p>
                </div>
              )}

              {/* Reason */}
              <div>
                <Label htmlFor="disputeReason">
                  Reason for Dispute <span className="text-red-500">*</span>
                </Label>
                <Select value={disputeReason} onValueChange={setDisputeReason}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a reason" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Missed deadline">
                      Missed deadline
                    </SelectItem>
                    <SelectItem value="Low quality">Low quality</SelectItem>
                    <SelectItem value="Payment not released">
                      Payment not released
                    </SelectItem>
                    <SelectItem value="Work not completed">
                      Work not completed
                    </SelectItem>
                    <SelectItem value="Communication issues">
                      Communication issues
                    </SelectItem>
                    <SelectItem value="Scope change">Scope change</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="disputeDescription">
                  Detailed Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="disputeDescription"
                  placeholder="Please provide a detailed description of the dispute..."
                  value={disputeDescription}
                  onChange={(e) => setDisputeDescription(e.target.value)}
                  rows={6}
                  required
                />
              </div>

              {/* Contested Amount */}
              <div>
                <Label htmlFor="disputeContestedAmount">
                  Contested Amount (RM)
                </Label>
                <Input
                  id="disputeContestedAmount"
                  type="number"
                  placeholder="0.00"
                  value={disputeContestedAmount}
                  onChange={(e) => setDisputeContestedAmount(e.target.value)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional: Specify the amount in dispute if applicable.
                </p>
              </div>

              {/* Suggested Resolution */}
              <div>
                <Label htmlFor="disputeSuggestedResolution">
                  Suggested Resolution
                </Label>
                <Textarea
                  id="disputeSuggestedResolution"
                  placeholder="What resolution would you like to see? (Optional)"
                  value={disputeSuggestedResolution}
                  onChange={(e) =>
                    setDisputeSuggestedResolution(e.target.value)
                  }
                  rows={4}
                />
              </div>

              {/* Attachments */}
              <div>
                <Label htmlFor="disputeAttachments">
                  Attachments (Optional)
                </Label>
                <Input
                  id="disputeAttachments"
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.jpg,.jpeg,.png"
                  onChange={handleDisputeAttachmentChange}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Supported: PDF, DOC, DOCX, XLS, XLSX, ZIP, TXT, JPG, PNG (Max
                  10MB per file)
                </p>
                {disputeAttachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {disputeAttachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                      >
                        <span className="text-sm text-gray-700 truncate flex-1">
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDisputeAttachment(index)}
                          className="ml-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDisputeDialogOpen(false);
                  setDisputeReason("");
                  setDisputeDescription("");
                  setDisputeContestedAmount("");
                  setDisputeSuggestedResolution("");
                  setDisputeAttachments([]);
                  setSelectedMilestoneForDispute(null);
                }}
                disabled={creatingDispute}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateDispute}
                disabled={
                  creatingDispute ||
                  !disputeReason.trim() ||
                  !disputeDescription.trim()
                }
                className="bg-red-600 hover:bg-red-700"
              >
                {creatingDispute ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Submit Dispute
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Dispute Dialog */}
        <Dialog
          open={viewDisputeDialogOpen}
          onOpenChange={setViewDisputeDialogOpen}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dispute Details</DialogTitle>
              <DialogDescription>
                View dispute information and status
              </DialogDescription>
            </DialogHeader>

            {currentDispute && (
              <div className="space-y-6">
                {/* Dispute Status */}
                <div className="flex items-center justify-between">
                  <Badge
                    className={getDisputeStatusColor(currentDispute.status)}
                  >
                    {currentDispute.status?.replace("_", " ")}
                  </Badge>
                  <div className="text-sm text-gray-500">
                    Created:{" "}
                    {new Date(currentDispute.createdAt).toLocaleDateString()}
                    {currentDispute.updatedAt !== currentDispute.createdAt && (
                      <>
                        {" "}
                        • Updated:{" "}
                        {new Date(
                          currentDispute.updatedAt
                        ).toLocaleDateString()}
                      </>
                    )}
                  </div>
                </div>

                {/* Dispute Information */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dispute Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Reason
                      </Label>
                      <p className="mt-1">{currentDispute.reason}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Description & Updates
                      </Label>
                      <div className="mt-2 space-y-3">
                        {(() => {
                          // Parse description to show original and updates separately
                          const description = currentDispute.description || "";
                          const parts = description.split(/\n---\n/);
                          const originalDescription = parts[0]?.trim() || "";
                          const updates = parts.slice(1);

                          return (
                            <>
                              {/* Original Description */}
                              <div className="bg-gray-50 p-3 rounded-lg border-l-4 border-blue-500">
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback>
                                      {currentDispute.raisedBy?.name?.charAt(
                                        0
                                      ) || "U"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-900">
                                      {currentDispute.raisedBy?.name ||
                                        "Unknown User"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      Original dispute •{" "}
                                      {new Date(
                                        currentDispute.createdAt
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                                  {originalDescription}
                                </p>
                              </div>

                              {/* Updates */}
                              {updates.map((update: string, idx: number) => {
                                // Parse update format: [Update by Name on Date]: content
                                // Also handle old format: [Update by userId]: content
                                const match = update.match(
                                  /^\[Update by (.+?) on (.+?)\]:\s*([\s\S]+)$/
                                );
                                let userName = "";
                                let updateDate = "";
                                let updateContent = "";

                                if (match) {
                                  [, userName, updateDate, updateContent] =
                                    match;
                                } else {
                                  // Try old format: [Update by userId]: content
                                  const oldMatch = update.match(
                                    /^\[Update by (.+?)\]:\s*([\s\S]+)$/
                                  );
                                  if (oldMatch) {
                                    const [, userIdOrName, content] = oldMatch;
                                    // Check if it's a UUID (old format)
                                    const uuidRegex =
                                      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                                    if (uuidRegex.test(userIdOrName)) {
                                      // It's a UUID, try to match with customer or provider
                                      if (
                                        project?.customer?.id === userIdOrName
                                      ) {
                                        userName =
                                          project?.customer?.name || "Customer";
                                      } else if (
                                        project?.provider?.id === userIdOrName
                                      ) {
                                        userName =
                                          project?.provider?.name || "Provider";
                                      } else if (
                                        currentDispute?.raisedBy?.id ===
                                        userIdOrName
                                      ) {
                                        userName =
                                          currentDispute?.raisedBy?.name ||
                                          "Unknown User";
                                      } else {
                                        userName = "Unknown User";
                                      }
                                      updateDate = "Unknown Date";
                                      updateContent = content;
                                    } else {
                                      userName = userIdOrName;
                                      updateDate = "Unknown Date";
                                      updateContent = content;
                                    }
                                  } else {
                                    // Fallback: treat entire update as content
                                    updateContent = update;
                                    userName = "Unknown User";
                                    updateDate = "Unknown Date";
                                  }
                                }

                                const isCustomer =
                                  project?.customer?.name === userName;
                                const isProvider =
                                  project?.provider?.name === userName;

                                return (
                                  <div
                                    key={idx}
                                    className={`p-3 rounded-lg border-l-4 ${
                                      isCustomer
                                        ? "bg-blue-50 border-blue-400"
                                        : isProvider
                                        ? "bg-green-50 border-green-400"
                                        : "bg-yellow-50 border-yellow-400"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <Avatar className="w-5 h-5">
                                        <AvatarFallback className="text-xs">
                                          {userName.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                          <p className="text-xs font-semibold text-gray-900">
                                            {userName}
                                          </p>
                                          <Badge
                                            variant="outline"
                                            className="text-[10px] px-1.5 py-0"
                                          >
                                            {isCustomer
                                              ? "Customer"
                                              : isProvider
                                              ? "Provider"
                                              : "User"}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                          Update #{idx + 1} • {updateDate}
                                        </p>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                                      {updateContent.trim()}
                                    </p>
                                  </div>
                                );
                              })}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                    {currentDispute.contestedAmount && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Contested Amount
                        </Label>
                        <p className="mt-1 font-medium">
                          RM{currentDispute.contestedAmount.toLocaleString()}
                        </p>
                      </div>
                    )}
                    {currentDispute.suggestedResolution && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Suggested Resolution
                        </Label>
                        <p className="mt-1 whitespace-pre-wrap">
                          {currentDispute.suggestedResolution}
                        </p>
                      </div>
                    )}
                    {currentDispute.milestone && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Related Milestone
                        </Label>
                        <p className="mt-1">
                          {currentDispute.milestone.title} - RM
                          {currentDispute.milestone.amount.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Admin Resolution Notes */}
                {currentDispute.resolutionNotes &&
                  Array.isArray(currentDispute.resolutionNotes) &&
                  currentDispute.resolutionNotes.length > 0 && (
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="text-purple-800">
                          Admin Resolution Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {currentDispute.resolutionNotes.map(
                          (
                            note: {
                              note?: string;
                              adminName?: string;
                              createdAt: string;
                            },
                            index: number
                          ) => {
                            // Check if note contains "--- Admin Note ---" separator
                            const noteParts =
                              note.note?.split(/\n--- Admin Note ---\n/) || [];
                            const hasAdminNote = noteParts.length > 1;
                            const resolutionResult = noteParts[0] || note.note;
                            const adminNote = noteParts[1];

                            return (
                              <div
                                key={index}
                                className="bg-white p-4 rounded-lg border-l-4 border-purple-500"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="bg-purple-100 text-purple-700">
                                      {note.adminName?.charAt(0) || "A"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      Resolution Note #{index + 1}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      By {note.adminName || "Admin"} •{" "}
                                      {new Date(
                                        note.createdAt
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-3 mt-2">
                                  {/* Resolution Result */}
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">
                                      Resolution Result:
                                    </p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                                      {resolutionResult}
                                    </p>
                                  </div>
                                  {/* Admin Note (if exists) */}
                                  {hasAdminNote && adminNote && (
                                    <div>
                                      <p className="text-xs font-semibold text-purple-600 mb-1">
                                        Admin Note:
                                      </p>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-purple-50 p-2 rounded border-l-2 border-purple-300">
                                        {adminNote}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </CardContent>
                    </Card>
                  )}

                {/* Legacy Resolution (for backward compatibility) */}
                {currentDispute.resolution &&
                  (!currentDispute.resolutionNotes ||
                    !Array.isArray(currentDispute.resolutionNotes) ||
                    currentDispute.resolutionNotes.length === 0) && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-green-800">
                          Admin Resolution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-green-700 whitespace-pre-wrap">
                          {currentDispute.resolution}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                {/* Attachments */}
                {currentDispute.attachments &&
                  Array.isArray(currentDispute.attachments) &&
                  currentDispute.attachments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Attachments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {currentDispute.attachments.map(
                            (url: string, index: number) => {
                              // Extract filename from path
                              const normalized = url.replace(/\\/g, "/");
                              const filename =
                                normalized.split("/").pop() ||
                                `Attachment ${index + 1}`;
                              // Remove timestamp prefix if present (format: timestamp_filename.ext)
                              const cleanFilename = filename.replace(
                                /^\d+_/,
                                ""
                              );

                              // Try to find attachment metadata in description
                              const attachmentMetadataMatch =
                                currentDispute.description?.match(
                                  new RegExp(
                                    `\\[Attachment: (.+?) uploaded by (.+?) on (.+?)\\]`,
                                    "g"
                                  )
                                );
                              let uploadedBy = "Unknown User";
                              let uploadedAt = "Unknown Date";

                              if (attachmentMetadataMatch) {
                                // Find matching metadata for this file
                                for (const meta of attachmentMetadataMatch) {
                                  const metaMatch = meta.match(
                                    /\[Attachment: (.+?) uploaded by (.+?) on (.+?)\]/
                                  );
                                  if (metaMatch && metaMatch[1] === filename) {
                                    uploadedBy = metaMatch[2];
                                    uploadedAt = metaMatch[3];
                                    break;
                                  }
                                }
                              }

                              // Also check if it's from the original dispute creator
                              if (
                                uploadedBy === "Unknown User" &&
                                index === 0 &&
                                currentDispute.attachments &&
                                currentDispute.attachments.length === 1
                              ) {
                                uploadedBy =
                                  currentDispute.raisedBy?.name ||
                                  "Unknown User";
                                uploadedAt = new Date(
                                  currentDispute.createdAt
                                ).toLocaleString();
                              }

                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 border rounded"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {cleanFilename}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Uploaded by {uploadedBy} • {uploadedAt}
                                      </p>
                                    </div>
                                  </div>
                                  {(() => {
                                    const attachmentUrl = getAttachmentUrl(url);
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
                                      <a
                                        href={
                                          attachmentUrl === "#"
                                            ? undefined
                                            : attachmentUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={
                                          isR2Key
                                            ? async (e) => {
                                                e.preventDefault();
                                                try {
                                                  const downloadUrl =
                                                    await getR2DownloadUrl(url); // Use original URL/key - url is from the map function
                                                  window.open(
                                                    downloadUrl.downloadUrl,
                                                    "_blank"
                                                  );
                                                } catch (error) {
                                                  console.error(
                                                    "Failed to get download URL:",
                                                    error
                                                  );
                                                  toast({
                                                    title: "Error",
                                                    description:
                                                      "Failed to download attachment",
                                                    variant: "destructive",
                                                  });
                                                }
                                              }
                                            : undefined
                                        }
                                      >
                                        <Button variant="outline" size="sm">
                                          <Download className="w-4 h-4 mr-2" />
                                          Download
                                        </Button>
                                      </a>
                                    );
                                  })()}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Update Dispute (if not CLOSED and not RESOLVED) */}
                {currentDispute.status !== "CLOSED" &&
                  currentDispute.status !== "RESOLVED" && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Add Update</CardTitle>
                        <CardDescription>
                          Add additional notes or evidence to your dispute
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="disputeAdditionalNotes">
                            Additional Notes
                          </Label>
                          <Textarea
                            id="disputeAdditionalNotes"
                            placeholder="Add any additional information or updates..."
                            value={disputeAdditionalNotes}
                            onChange={(e) =>
                              setDisputeAdditionalNotes(e.target.value)
                            }
                            rows={4}
                          />
                        </div>
                        <div>
                          <Label htmlFor="disputeUpdateAttachments">
                            Additional Attachments
                          </Label>
                          <Input
                            id="disputeUpdateAttachments"
                            type="file"
                            multiple
                            onChange={handleDisputeUpdateAttachmentChange}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt,.jpg,.png"
                          />
                          {disputeUpdateAttachments.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {disputeUpdateAttachments.map((file, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm"
                                >
                                  <span>{file.name}</span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      removeDisputeUpdateAttachment(index)
                                    }
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          onClick={handleUpdateDispute}
                          disabled={
                            updatingDispute ||
                            (!disputeAdditionalNotes.trim() &&
                              disputeUpdateAttachments.length === 0)
                          }
                          className="w-full"
                        >
                          {updatingDispute ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Add Update
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                {/* CLOSED or RESOLVED Dispute Notice */}
                {(currentDispute.status === "CLOSED" ||
                  currentDispute.status === "RESOLVED") && (
                  <Card className="border-red-200 bg-red-50">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-5 h-5" />
                        <p className="font-medium">
                          {currentDispute.status === "CLOSED"
                            ? "This dispute is closed. Project work has been frozen and no further updates are allowed."
                            : "This dispute has been resolved. Project completed peacefully. No further updates are allowed."}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setViewDisputeDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProviderLayout>
  );
}
