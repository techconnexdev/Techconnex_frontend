"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
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
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  DollarSign,
  Users,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Download,
  Edit,
  Eye,
  Send,
  Loader2,
  X,
  Check,
  Paperclip,
} from "lucide-react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";

import { CustomerLayout } from "@/components/customer-layout";
import {
  getProjectById,
  getCompanyProjectRequests,
  acceptProjectRequest,
  rejectProjectRequest,
  createDispute,
  getDisputeByProject,
  updateDispute,
  getProfileImageUrl,
  getAttachmentUrl,
  getR2DownloadUrl,
} from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { updateCompanyProject } from "@/lib/api";
// ADD with the other imports
import {
  getCompanyProjectMilestones,
  updateCompanyProjectMilestones,
  approveCompanyMilestones,
  approveIndividualMilestone,
  requestMilestoneChanges,
  type Milestone,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { formatTimeline } from "@/lib/timeline-utils";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import { RichEditor } from "@/components/markdown/RichTextEditor";
import MilestonePayment from "@/components/MilestonePayment";

// Project type definition
interface Project {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: string;
  timeline?: string;
  originalTimeline?: string | number;
  providerProposedTimeline?: string | number;
  budgetMin?: number | string;
  budgetMax?: number | string;
  progress?: number | string;
  status?: string;
  createdAt?: string | number | Date;
  startDate?: string | Date;
  endDate?: string | Date;
  isFeatured?: boolean;
  currency?: string;
  customer?: {
    id?: string;
    name?: string;
  };
  provider?: {
    id?: string;
    name?: string;
  };
  assignedProvider?: {
    id?: string;
    name?: string;
    avatar?: string;
    providerProfile?: {
      profileImageUrl?: string;
      rating?: number;
      completedJobs?: number;
    };
  };
  [key: string]: unknown; // Allow additional properties
}

// Dispute type definition
interface Dispute {
  id?: string;
  status?: string;
  reason?: string;
  description?: string;
  createdAt?: string | number | Date;
  updatedAt?: string | number | Date;
  contestedAmount?: number;
  suggestedResolution?: string;
  resolution?: string;
  milestone?: {
    title?: string;
    amount?: number;
  };
  raisedBy?: {
    id?: string;
    name?: string;
  };
  resolutionNotes?: Array<{
    note?: string;
    adminName?: string;
    createdAt?: string | number | Date;
  }>;
  attachments?: string[];
  [key: string]: unknown; // Allow additional properties
}

export default function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { toast: toastHook } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [requestChangesDialogOpen, setRequestChangesDialogOpen] =
    useState(false);
  const [requestChangesReason, setRequestChangesReason] = useState("");
  const [selectedMilestoneForReject, setSelectedMilestoneForReject] = useState<
    string | null
  >(null);
  const [selectedProposalForAction, setSelectedProposalForAction] =
    useState<ProviderRequest | null>(null);

  // for milestone editing after accepting
  const [milestonesOpen, setMilestonesOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [milestonesDraft, setMilestonesDraft] = useState<Milestone[]>([]);
  const [savingMilestonesModal, setSavingMilestonesModal] = useState(false);
  const [milestoneApprovalStateModal, setMilestoneApprovalStateModal] =
    useState({
      milestonesLocked: false,
      companyApproved: false,
      providerApproved: false,
      milestonesApprovedAt: null as string | null,
    });
  const [milestoneDraftErrors, setMilestoneDraftErrors] = useState<
    Record<
      number,
      {
        title?: string;
        description?: string;
        dueDate?: string;
      }
    >
  >({});
  const [originalMilestonesDraft, setOriginalMilestonesDraft] = useState<
    Milestone[]
  >([]);

  const [activeTab, setActiveTab] = useState("overview");
  const [project, setProject] = useState<Project | null>(null);
  const [token, setToken] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [projectMessages, setProjectMessages] = useState<
    Record<string, unknown>[]
  >([]);
  const [projectFiles, setProjectFiels] = useState<Record<string, unknown>[]>(
    []
  );

  // Extract id from params which may be a Promise in newer Next.js versions
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [edit, setEdit] = useState({
    title: "",
    description: "",
    category: "",
    priority: "",
    timeline: "",
    budgetMin: "",
    budgetMax: "",
    skills: "", // comma/newline separated
    requirements: "", // one per line
    deliverables: "", // one per line
  });

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

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedMilestoneForPayment, setSelectedMilestoneForPayment] =
    useState<Milestone | null>(null);

  // controls the proposal "View Details" dialog
  const [proposalDetailsOpen, setProposalDetailsOpen] = useState(false);
  const [selectedProposalDetails, setSelectedProposalDetails] =
    useState<ProviderRequest | null>(null);

  // controls the post-accept milestone review/approval dialog
  const [milestoneFinalizeOpen, setMilestoneFinalizeOpen] = useState(false);

  // Dispute creation state
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [viewDisputeDialogOpen, setViewDisputeDialogOpen] = useState(false);
  const [currentDispute, setCurrentDispute] = useState<Dispute | null>(null);
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
  interface ProviderRequest {
    id: string;
    providerId: string;
    providerName: string;
    providerAvatar: string;
    providerRating: number;
    providerLocation: string;
    providerResponseTime: string;
    projectId: string | undefined;
    projectTitle: string;
    bidAmount: number;
    proposedTimeline: string;
    deliveryTime?: string;
    coverLetter: string;
    status: "pending" | "accepted" | "rejected";
    submittedAt: string;
    createdAt?: string;
    skills: string[];
    portfolio: string[];
    experience: string;
    attachments: string[];
    attachmentUrls?: string[];
    milestones: Array<{
      title: string;
      description?: string;
      amount: number;
      dueDate: string;
      order: number;
    }>;
    provider?: {
      id: string;
      name: string;
      avatar?: string;
      rating?: number;
      location?: string;
      responseTime?: string;
      providerProfile?: {
        profileImageUrl?: string;
      };
    };
  }
  const isImage = (file: string) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file);

  const isPDF = (file: string) => /\.pdf$/i.test(file);

  const getFullUrl = (path: string) => {
    const normalized = path.replace(/\\/g, "/");
    return normalized.startsWith("http://") || normalized.startsWith("https://")
      ? normalized
      : `${process.env.NEXT_PUBLIC_API_URL}/${normalized.replace(/^\//, "")}`;
  };

  // this array drives the Bids tab UI
  const [proposals, setProposals] = useState<ProviderRequest[]>([]);

  // optional loading/error for bids section
  const [bidsLoading, setBidsLoading] = useState<boolean>(true);
  const [bidsError, setBidsError] = useState<string | null>(null);

  useEffect(() => {
    if (!project) return;
    // Convert requirements/deliverables: if array, convert to markdown; if string, use as-is
    const convertToMarkdown = (value: unknown): string => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (Array.isArray(value)) {
        const items = value.map(String).filter(Boolean);
        return items.length > 0
          ? items.map((item) => `- ${item}`).join("\n")
          : "";
      }
      return "";
    };

    setEdit({
      title: (typeof project.title === "string" ? project.title : "") ?? "",
      description:
        (typeof project.description === "string" ? project.description : "") ??
        "",
      category:
        (typeof project.category === "string" ? project.category : "") ?? "",
      priority:
        (typeof project.priority === "string" ? project.priority : "") ?? "",
      timeline:
        (typeof project.timeline === "string" ? project.timeline : "") ?? "",
      budgetMin:
        (typeof project.budgetMin === "number"
          ? project.budgetMin.toString()
          : typeof project.budgetMin === "string"
          ? project.budgetMin
          : "") ?? "",
      budgetMax:
        (typeof project.budgetMax === "number"
          ? project.budgetMax.toString()
          : typeof project.budgetMax === "string"
          ? project.budgetMax
          : "") ?? "",
      skills: (Array.isArray(project.skills) ? project.skills : []).join(", "),
      requirements: convertToMarkdown(project.requirements),
      deliverables: convertToMarkdown(project.deliverables),
    });
  }, [project]);

  const toLines = (s: string) =>
    s
      .split(/\r?\n|,/)
      .map((x) => x.trim())
      .filter(Boolean);

  useEffect(() => {
    let mounted = true;
    Promise.resolve(params)
      .then((p: { id?: string }) => {
        if (mounted) setResolvedId(p?.id ?? null);
      })
      .catch(() => {
        if (mounted) setResolvedId(null);
      });
    return () => {
      mounted = false;
    };
  }, [params]);

  // Load auth token and user from localStorage (client-side)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const t = localStorage.getItem("token") || "";
      const u = localStorage.getItem("user");
      setToken(t);
      setCurrentUser(u ? JSON.parse(u) : null);
    } catch (e) {
      console.error("Error loading auth info:", e);
    }
  }, []);

  // Fetch messages between the two project participants when Messages tab is opened
  const fetchProjectMessages = async () => {
    if (!token || !project) return;
    try {
      const currentUserId = (currentUser as { id?: string } | null)?.id;
      const providerId =
        (typeof project.providerId === "string"
          ? project.providerId
          : undefined) || (project.provider as { id?: string } | undefined)?.id;
      const customerId =
        (typeof project.customerId === "string"
          ? project.customerId
          : undefined) || (project.customer as { id?: string } | undefined)?.id;
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
        const filtered = Array.isArray(data.data)
          ? data.data.filter(
              (msg: Record<string, unknown>) =>
                String(msg.projectId) === String(resolvedId)
            )
          : [];

        setProjectMessages(Array.isArray(data.data) ? data.data : []);
        setProjectFiels(filtered);
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
    if (activeTab === "messages" || activeTab === "files") {
      fetchProjectMessages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token, project]);

  // Safe formatter for numbers - prevents calling toLocaleString on undefined
  const fmt = (v: unknown, fallback = "0"): string => {
    if (v === null || v === undefined) return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : fallback;
  };

  // Ensure a value is an array before mapping
  const asArray = <T,>(v: unknown): T[] => (Array.isArray(v) ? v : []);

  // Helper function to map API proposals to ProviderRequest format
  const mapProposalsToProviderRequests = useCallback(
    (rawProposals: Record<string, unknown>[]): ProviderRequest[] => {
      return rawProposals.map((p: Record<string, unknown>): ProviderRequest => {
        const provider = (p.provider as Record<string, unknown>) || {};
        const profile =
          (provider.providerProfile as Record<string, unknown>) || {};

        return {
          id: p.id as string,
          providerId: provider.id as string,
          providerName: provider.name as string,
          providerAvatar: getProfileImageUrl(
            profile.profileImageUrl as string | undefined
          ),
          providerRating:
            (profile.rating as number | undefined) ??
            (provider.rating as number | undefined) ??
            0,
          providerLocation:
            (profile.location as string | undefined) ??
            (provider.location as string | undefined) ??
            "",
          providerResponseTime:
            (profile.responseTime as string | undefined) ??
            (provider.responseTime as string | undefined) ??
            "",
          projectId: (p.serviceRequest as Record<string, unknown> | undefined)
            ?.id as string | undefined,
          projectTitle:
            ((p.serviceRequest as Record<string, unknown> | undefined)
              ?.title as string | undefined) ?? "",
          bidAmount: p.bidAmount as number,
          proposedTimeline:
            formatTimeline(
              p.deliveryTime as string | number | undefined,
              "day"
            ) || "",
          coverLetter: p.coverLetter as string,
          status: p.status
            ? (String(p.status).toLowerCase() as
                | "pending"
                | "accepted"
                | "rejected")
            : "pending",
          submittedAt:
            (p.createdAt as string | undefined) ||
            (p.submittedAt as string | undefined) ||
            "",
          skills: Array.isArray(profile.skills)
            ? (profile.skills as string[])
            : Array.isArray(provider.skills)
            ? (provider.skills as string[])
            : [],
          portfolio: Array.isArray(profile.portfolios)
            ? (profile.portfolios as string[])
            : Array.isArray(provider.portfolio)
            ? (provider.portfolio as string[])
            : [],
          experience:
            (profile.experience as string | undefined) ??
            (provider.experience as string | undefined) ??
            "",
          attachments: Array.isArray(p.attachmentUrls)
            ? (p.attachmentUrls as string[])
            : [],
          milestones: Array.isArray(p.milestones)
            ? p.milestones.map(
                (m: {
                  title: string;
                  description?: string;
                  amount: number;
                  dueDate: string;
                  order: number;
                }) => ({
                  title: m.title,
                  description: m.description,
                  amount: m.amount,
                  dueDate: m.dueDate,
                  order: m.order,
                })
              )
            : [],
        };
      });
    },
    []
  );

  // Fetch project data + proposals (bids)
  useEffect(() => {
    const fetchAll = async () => {
      if (!resolvedId) return;

      try {
        // page-level loading
        setLoading(true);
        setError(null);

        // bids-section loading
        setBidsLoading(true);
        setBidsError(null);

        // 1. load the project / service request
        const projectRes = await getProjectById(resolvedId);

        if (!projectRes?.success || !projectRes.project) {
          throw new Error("Failed to fetch project");
        }

        const loadedProject = projectRes.project;
        setProject(loadedProject);

        // Fetch dispute for this project
        try {
          const disputeRes = await getDisputeByProject(loadedProject.id);
          if (disputeRes.success && disputeRes.data) {
            setCurrentDispute(disputeRes.data);
          }
        } catch {
          // No dispute exists yet, which is fine
          console.log("No dispute found for project");
        }

        // figure out the "request id" to ask proposals for
        // For ServiceRequest: use the project id (which IS the serviceRequestId)
        // For Project: use serviceRequestId from the response (the original ServiceRequest that created this Project)
        let serviceRequestId: string | null = null;
        if (loadedProject.type === "ServiceRequest") {
          serviceRequestId = loadedProject.id;
        } else {
          // For Projects, use the serviceRequestId from backend (if available)
          const projectRecord = loadedProject as Record<string, unknown>;
          serviceRequestId =
            (projectRecord?.serviceRequestId as string | undefined) ||
            (projectRecord?.originalRequestId as string | undefined) ||
            null;
        }

        // 2. load proposals/bids the same way Requests page does (only if we have a valid serviceRequestId)
        if (serviceRequestId) {
          const proposalsResponse = await getCompanyProjectRequests({
            serviceRequestId,
            sort: "newest",
          });

          // 3. normalize proposalsResponse to an array
          const rawProposals = Array.isArray(proposalsResponse?.proposals)
            ? proposalsResponse.proposals
            : Array.isArray(proposalsResponse?.data)
            ? proposalsResponse.data
            : Array.isArray(proposalsResponse?.items)
            ? proposalsResponse.items
            : [];

          // 4. map raw proposals -> ProviderRequest[]
          const mappedProposals = mapProposalsToProviderRequests(rawProposals);
          setProposals(mappedProposals);
        } else {
          // No serviceRequestId means this Project wasn't created from a ServiceRequest (unlikely but handle gracefully)
          console.warn(
            "No serviceRequestId found for Project, cannot load proposals"
          );
          setProposals([]);
        }
      } catch (err: unknown) {
        console.error("Failed to load project/proposals:", err);

        const errorMessage =
          err instanceof Error ? err.message : "Failed to load project";
        setError(errorMessage);
        setBidsError(errorMessage);

        setProposals([]);
      } finally {
        setLoading(false);
        setBidsLoading(false);
      }
    };

    fetchAll();
  }, [resolvedId, mapProposalsToProviderRequests]);

  // Function to refresh all project data
  const refreshProjectData = async () => {
    if (!resolvedId) return;
    try {
      // Refresh project data
      const projectRes = await getProjectById(resolvedId);
      if (!projectRes?.success || !projectRes.project) {
        return;
      }

      const loadedProject = projectRes.project;
      setProject(loadedProject);

      // Refresh milestones
      const milestoneData = await getCompanyProjectMilestones(loadedProject.id);
      const loadedMilestones: Milestone[] = Array.isArray(
        milestoneData.milestones
      )
        ? milestoneData.milestones.map(
            (m: Milestone | Record<string, unknown>) =>
              ({
                ...(m as Milestone),
                sequence: ((m as Milestone).order ??
                  (m as Record<string, unknown>).order) as number,
                submissionAttachmentUrl: ((m as Milestone)
                  .submissionAttachmentUrl ??
                  (m as Record<string, unknown>).submissionAttachmentUrl) as
                  | string
                  | undefined,
                submissionNote: ((m as Milestone).submissionNote ??
                  (m as Record<string, unknown>).submissionNote) as
                  | string
                  | undefined,
                submittedAt: ((m as Milestone).submittedAt ??
                  (m as Record<string, unknown>).submittedAt) as
                  | string
                  | undefined,
                startDeliverables: ((m as Milestone).startDeliverables ??
                  (m as Record<string, unknown>).startDeliverables) as
                  | string
                  | undefined,
                submitDeliverables: ((m as Milestone).submitDeliverables ??
                  (m as Record<string, unknown>).submitDeliverables) as
                  | string
                  | undefined,
                revisionNumber: ((m as Milestone).revisionNumber ??
                  (m as Record<string, unknown>).revisionNumber) as
                  | number
                  | undefined,
                submissionHistory: ((m as Milestone).submissionHistory ??
                  (m as Record<string, unknown>).submissionHistory) as
                  | unknown[]
                  | undefined,
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

      // Refresh dispute if exists
      try {
        const disputeRes = await getDisputeByProject(loadedProject.id);
        if (disputeRes.success && disputeRes.data) {
          setCurrentDispute(disputeRes.data);
        }
      } catch {
        // No dispute exists, which is fine
      }

      // Refresh proposals/bids
      let serviceRequestId: string | null = null;
      if (loadedProject.type === "ServiceRequest") {
        serviceRequestId = loadedProject.id;
      } else {
        const projectRecord = loadedProject as Record<string, unknown>;
        serviceRequestId =
          (projectRecord?.serviceRequestId as string | undefined) ||
          (projectRecord?.originalRequestId as string | undefined) ||
          null;
      }

      if (serviceRequestId) {
        try {
          const proposalsResponse = await getCompanyProjectRequests({
            serviceRequestId,
            sort: "newest",
          });

          const rawProposals = Array.isArray(proposalsResponse?.proposals)
            ? proposalsResponse.proposals
            : Array.isArray(proposalsResponse?.data)
            ? proposalsResponse.data
            : Array.isArray(proposalsResponse?.items)
            ? proposalsResponse.items
            : [];

          const mappedProposals = mapProposalsToProviderRequests(rawProposals);
          setProposals(mappedProposals);
        } catch {
          console.warn("Failed to refresh proposals");
        }
      }
    } catch (err) {
      console.error("Error refreshing project data:", err);
    }
  };

  // Load project milestones
  useEffect(() => {
    (async () => {
      if (!project?.id) return;
      try {
        const milestoneData = await getCompanyProjectMilestones(
          project.id as string
        );
        const loadedMilestones: Milestone[] = Array.isArray(
          milestoneData.milestones
        )
          ? milestoneData.milestones.map(
              (m: Milestone | Record<string, unknown>) =>
                ({
                  ...(m as Milestone),
                  sequence: ((m as Milestone).order ??
                    (m as Record<string, unknown>).order) as number,
                  submissionAttachmentUrl: ((m as Milestone)
                    .submissionAttachmentUrl ??
                    (m as Record<string, unknown>).submissionAttachmentUrl) as
                    | string
                    | undefined,
                  submissionNote: ((m as Milestone).submissionNote ??
                    (m as Record<string, unknown>).submissionNote) as
                    | string
                    | undefined,
                  submittedAt: ((m as Milestone).submittedAt ??
                    (m as Record<string, unknown>).submittedAt) as
                    | string
                    | undefined,
                  startDeliverables: ((m as Milestone).startDeliverables ??
                    (m as Record<string, unknown>).startDeliverables) as
                    | string
                    | undefined,
                  submitDeliverables: ((m as Milestone).submitDeliverables ??
                    (m as Record<string, unknown>).submitDeliverables) as
                    | string
                    | undefined,
                  revisionNumber: ((m as Milestone).revisionNumber ??
                    (m as Record<string, unknown>).revisionNumber) as
                    | number
                    | undefined,
                  submissionHistory: ((m as Milestone).submissionHistory ??
                    (m as Record<string, unknown>).submissionHistory) as
                    | unknown[]
                    | undefined,
                } as Milestone)
            )
          : [];
        setProjectMilestones(loadedMilestones);
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

  if (loading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-8 sm:py-12 px-4">
          <div className="flex items-center space-x-2">
            <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
            <span className="text-sm sm:text-base">Loading project...</span>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !project) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center py-8 sm:py-12 px-4">
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Error loading project
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-4">
              {error || "Project not found"}
            </p>
            <Button
              onClick={() => window.location.reload()}
              size="sm"
              className="sm:size-default"
            >
              Try Again
            </Button>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  const norm = (s: unknown) => String(s || "").toUpperCase();

  const getStatusColor = (status: string) => {
    const S = norm(status);
    switch (S) {
      case "COMPLETED":
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
      case "OPEN":
      case "PENDING":
      case "DRAFT":
        return "bg-yellow-100 text-yellow-800";
      case "ON_HOLD":
      case "CANCELLED":
      case "REJECTED":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    const S = norm(status);
    switch (S) {
      case "COMPLETED":
        return "Completed";
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
      case "OPEN":
      case "PENDING":
        return "Pending";
      case "DRAFT":
        return "Draft";
      case "ON_HOLD":
        return "On Hold";
      case "CANCELLED":
        return "Cancelled";
      case "REJECTED":
        return "Rejected";
      default:
        return status;
    }
  };

  const getMilestoneStatusIcon = (status: string) => {
    switch (status) {
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
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      case "DRAFT":
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  // Helpers for project milestone editor
  const normalizeMilestoneSequences = (items: Milestone[]): Milestone[] =>
    items
      .map((m, i) => ({ ...m, sequence: i + 1 } as Milestone))
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

  // Normalize project data to safe arrays to avoid runtime errors
  const safeProject = project ?? {};
  const skills = asArray<string>(safeProject.skills);
  // Requirements and deliverables are now markdown strings
  const requirements =
    typeof safeProject.requirements === "string"
      ? safeProject.requirements
      : Array.isArray(safeProject.requirements)
      ? safeProject.requirements
          .map((r: unknown) => `- ${String(r)}`)
          .join("\n")
      : "";
  const deliverables =
    typeof safeProject.deliverables === "string"
      ? safeProject.deliverables
      : Array.isArray(safeProject.deliverables)
      ? safeProject.deliverables
          .map((d: unknown) => `- ${String(d)}`)
          .join("\n")
      : "";
  const messages = asArray<Record<string, unknown>>(safeProject.messages);
  const currentUserId = currentUser?.id;
  const msgsToRender =
    projectMessages && projectMessages.length > 0 ? projectMessages : messages;

  const provider =
    project?.provider ??
    ({
      id: project?.providerId,
      name:
        (typeof project?.providerName === "string"
          ? project.providerName
          : undefined) ??
        (project?.provider as { name?: string } | undefined)?.name,
      avatar:
        (project?.provider as { avatarUrl?: string } | undefined)?.avatarUrl ??
        project?.providerAvatar,
    } as Record<string, unknown>);

  const handleContact = () => {
    const providerId = (provider as { id?: string } | undefined)?.id;
    const providerAvatar = (provider as { avatar?: string } | undefined)
      ?.avatar;
    if (!provider || !providerId) return;

    const avatarUrl =
      providerAvatar &&
      providerAvatar !== "/placeholder.svg" &&
      !providerAvatar.includes("/placeholder.svg")
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}${
            providerAvatar.startsWith("/") ? "" : "/"
          }${providerAvatar}`
        : "";

    const providerName =
      (provider as { name?: string } | undefined)?.name || "";
    router.push(
      `/customer/messages?userId=${providerId}&name=${encodeURIComponent(
        providerName
      )}&avatar=${encodeURIComponent(avatarUrl)}`
    );
  };
  // ⬇️ ADD THIS just after you define `project` (and `proposals` if present)
  const currency: string =
    typeof project?.currency === "string" ? project.currency : "RM";
  const bidCount = Number(
    project?.bidCount ?? (Array.isArray(proposals) ? proposals.length : 0)
  );
  const startDate = project?.startDate
    ? new Date(project.startDate as string | number | Date)
    : null;
  const endDate = project?.endDate
    ? new Date(project.endDate as string | number | Date)
    : null;

  // Compute project stats values with proper typing
  const approvedPriceValue: number = project
    ? typeof project.approvedPrice === "number"
      ? project.approvedPrice
      : typeof project.approvedPrice === "string"
      ? Number(project.approvedPrice) || 0
      : 0
    : 0;

  const totalSpentValue: number = project
    ? typeof project.totalSpent === "number"
      ? project.totalSpent
      : typeof project.totalSpent === "string"
      ? Number(project.totalSpent) || 0
      : 0
    : 0;

  const progressValue: number = project
    ? typeof project.progress === "number"
      ? project.progress
      : typeof project.progress === "string"
      ? Number(project.progress) || 0
      : 0
    : 0;

  const daysLeftValue: number | null = (() => {
    if (
      !project ||
      project.daysLeft === null ||
      project.daysLeft === undefined
    ) {
      return null;
    }
    if (typeof project.daysLeft === "number") {
      return project.daysLeft;
    }
    if (typeof project.daysLeft === "string") {
      const parsed = Number(project.daysLeft);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  })();

  const handleSave = async () => {
    try {
      const payload: Record<string, unknown> = {
        title: edit.title,
        description: edit.description,
        category: edit.category,
        priority: edit.priority,
        timeline: edit.timeline,
      };

      if (edit.budgetMin) payload.budgetMin = Number(edit.budgetMin);
      if (edit.budgetMax) payload.budgetMax = Number(edit.budgetMax);

      const skillsArr = toLines(edit.skills);
      if (skillsArr.length) payload.skills = skillsArr;

      // Send markdown strings directly
      if (edit.requirements?.trim())
        payload.requirements = edit.requirements.trim();
      if (edit.deliverables?.trim())
        payload.deliverables = edit.deliverables.trim();

      const { project: updated } = await updateCompanyProject(
        project.id as string,
        payload
      );
      setProject(updated);
      toast({ title: "Saved", description: "Project updated successfully." });
      setIsEditOpen(false);
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

  // ADD - save draft
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
    const approvedPrice =
      typeof project?.approvedPrice === "number"
        ? project.approvedPrice
        : typeof project?.approvedPrice === "string"
        ? Number(project.approvedPrice)
        : 0;
    const bidAmountValue =
      typeof project?.bidAmount === "number"
        ? project.bidAmount
        : typeof project?.bidAmount === "string"
        ? Number(project.bidAmount)
        : 0;
    const bidAmount = approvedPrice || bidAmountValue || 0;
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
      const res = await updateCompanyProjectMilestones(
        project.id as string,
        payload
      );
      setMilestoneApprovalState({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      // Refresh milestones from API
      const milestoneData = await getCompanyProjectMilestones(
        project.id as string
      );
      const refreshedMilestones: Milestone[] = Array.isArray(
        milestoneData.milestones
      )
        ? milestoneData.milestones.map(
            (m: Milestone | Record<string, unknown>) =>
              ({
                ...(m as Milestone),
                sequence: ((m as Milestone).order ??
                  (m as Record<string, unknown>).order) as number,
                submissionAttachmentUrl: ((m as Milestone)
                  .submissionAttachmentUrl ??
                  (m as Record<string, unknown>).submissionAttachmentUrl) as
                  | string
                  | undefined,
                submissionNote: ((m as Milestone).submissionNote ??
                  (m as Record<string, unknown>).submissionNote) as
                  | string
                  | undefined,
                submittedAt: ((m as Milestone).submittedAt ??
                  (m as Record<string, unknown>).submittedAt) as
                  | string
                  | undefined,
                startDeliverables: ((m as Milestone).startDeliverables ??
                  (m as Record<string, unknown>).startDeliverables) as
                  | string
                  | undefined,
                submitDeliverables: ((m as Milestone).submitDeliverables ??
                  (m as Record<string, unknown>).submitDeliverables) as
                  | string
                  | undefined,
                revisionNumber: ((m as Milestone).revisionNumber ??
                  (m as Record<string, unknown>).revisionNumber) as
                  | number
                  | undefined,
                submissionHistory: ((m as Milestone).submissionHistory ??
                  (m as Record<string, unknown>).submissionHistory) as
                  | unknown[]
                  | undefined,
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

  // ADD - confirm
  const handleApproveProjectMilestones = async () => {
    if (!project?.id) return;
    try {
      const res = await approveCompanyMilestones(project.id as string);

      setMilestoneApprovalState({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      // Refresh project data to get updated milestones
      await refreshProjectData();

      // Always close the inline milestone editor
      setMilestoneEditorOpen(false);

      // Toast feedback
      toast({
        title: "Milestones approved",
        description: res.milestonesLocked
          ? "Milestones are now locked. Work can start."
          : "Waiting for provider to approve.",
      });

      // Pop the finalize/summary dialog
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

  // Approve individual milestone
  const handleApproveIndividualMilestone = async (milestoneId: string) => {
    try {
      await approveIndividualMilestone(milestoneId);

      // Refresh all project data including milestones
      await refreshProjectData();

      toast({
        title: "Milestone approved",
        description:
          "The milestone has been approved and is ready for payment.",
      });
    } catch (e) {
      toast({
        title: "Approval failed",
        description:
          e instanceof Error ? e.message : "Could not approve milestone",
        variant: "destructive",
      });
    }
  };

  // Open request changes dialog
  const handleRequestChangesClick = (milestoneId: string) => {
    setSelectedMilestoneForReject(milestoneId);
    setRequestChangesReason("");
    setRequestChangesDialogOpen(true);
  };

  // Reject milestone (request changes)
  const handleRejectMilestone = async () => {
    if (!selectedMilestoneForReject) return;

    if (!requestChangesReason.trim()) {
      toast({
        title: "Notes Required",
        description:
          "Please provide notes about the required changes so the provider knows what to fix.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Request changes - this will reset milestone to IN_PROGRESS and save to history
      await requestMilestoneChanges(
        selectedMilestoneForReject,
        requestChangesReason.trim()
      );

      // Refresh all project data including milestones
      await refreshProjectData();

      // Close dialog and reset
      setRequestChangesDialogOpen(false);
      setSelectedMilestoneForReject(null);
      setRequestChangesReason("");

      toast({
        title: "Changes Requested",
        description: "Milestone has been sent back to provider for revision.",
      });
    } catch (e) {
      toast({
        title: "Error",
        description:
          e instanceof Error ? e.message : "Could not request changes",
        variant: "destructive",
      });
    }
  };

  // Handle payment button click
  const handlePayMilestone = (milestoneId: string) => {
    const milestone = projectMilestones.find((m) => m.id === milestoneId);
    if (milestone) {
      setSelectedMilestoneForPayment(milestone);
      setPaymentDialogOpen(true);
    }
  };

  const handleAcceptProposal = async (proposal: ProviderRequest) => {
    try {
      const proposalId = proposal.id || (proposal as ProviderRequest)?.id;
      setProcessingId(proposalId);
      const response = await acceptProjectRequest(proposalId, true);

      // Get the created project ID from the response
      const projectId =
        ((response as Record<string, unknown>)?.id as string | undefined) ||
        ((
          (response as Record<string, unknown>)?.project as
            | Record<string, unknown>
            | undefined
        )?.id as string | undefined);

      // Optimistic status update
      setProposals((prev: ProviderRequest[]) =>
        prev.map((p) =>
          p.id === proposalId ? { ...p, status: "accepted" as const } : p
        )
      );

      // Immediately load project milestones for edit
      if (projectId) {
        const milestoneData = await getCompanyProjectMilestones(projectId);
        const loadedDraftMilestones: Milestone[] = Array.isArray(
          milestoneData.milestones
        )
          ? milestoneData.milestones.map(
              (m: Milestone | Record<string, unknown>) =>
                ({
                  ...(m as Milestone),
                  sequence: ((m as Milestone).order ??
                    (m as Record<string, unknown>).order) as number,
                } as Milestone)
            )
          : [];
        setMilestonesDraft(loadedDraftMilestones);
        setOriginalMilestonesDraft(
          JSON.parse(JSON.stringify(loadedDraftMilestones))
        ); // Deep copy
        setMilestoneApprovalStateModal({
          milestonesLocked: milestoneData.milestonesLocked,
          companyApproved: milestoneData.companyApproved,
          providerApproved: milestoneData.providerApproved,
          milestonesApprovedAt: milestoneData.milestonesApprovedAt,
        });
        setActiveProjectId(projectId);
        setMilestonesOpen(true);
      }

      toast({
        title: "Request Accepted",
        description: "Edit milestones and confirm to finalize.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to accept request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Save milestones after accept (inside modal)
  const handleSaveAcceptedMilestones = async () => {
    if (!activeProjectId) return;

    // Validate milestones
    const errors: Record<
      number,
      { title?: string; description?: string; dueDate?: string }
    > = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let hasErrors = false;

    milestonesDraft.forEach((m, idx) => {
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
    // Get bid amount from the project - we need to find it from the project data
    // For now, we'll get it from the project state if available
    const projectData = project || {};
    const approvedPrice =
      typeof projectData.approvedPrice === "number"
        ? projectData.approvedPrice
        : typeof projectData.approvedPrice === "string"
        ? Number(projectData.approvedPrice)
        : 0;
    const bidAmountValue =
      typeof projectData.bidAmount === "number"
        ? projectData.bidAmount
        : typeof projectData.bidAmount === "string"
        ? Number(projectData.bidAmount)
        : 0;
    const bidAmount = approvedPrice || bidAmountValue || 0;
    if (bidAmount > 0) {
      const sumMilestones = milestonesDraft.reduce(
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
      setMilestoneDraftErrors(errors);
      toast({
        title: "Validation Error",
        description:
          "Please fill in all required milestone fields (title, description, due date) and ensure dates are not in the past. Also ensure milestone amounts sum equals the bid amount.",
        variant: "destructive",
      });
      return;
    }

    setMilestoneDraftErrors({});

    try {
      setSavingMilestonesModal(true);

      const payload = milestonesDraft
        .map((m, i) => ({
          ...m,
          sequence: i + 1,
          amount: Number(m.amount),
          dueDate: new Date(m.dueDate).toISOString(),
        }))
        .sort((a, b) => a.sequence - b.sequence);

      const res = await updateCompanyProjectMilestones(
        activeProjectId,
        payload
      );

      setMilestoneApprovalStateModal({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      // Refresh milestones from API
      const milestoneData = await getCompanyProjectMilestones(activeProjectId);
      const refreshedMilestones: Milestone[] = Array.isArray(
        milestoneData.milestones
      )
        ? milestoneData.milestones.map(
            (m: Milestone | Record<string, unknown>) =>
              ({
                ...(m as Milestone),
                sequence: ((m as Milestone).order ??
                  (m as Record<string, unknown>).order) as number,
              } as Milestone)
          )
        : [];

      // Update both current and original milestones with fresh data
      setMilestonesDraft(refreshedMilestones);
      setOriginalMilestonesDraft(
        JSON.parse(JSON.stringify(refreshedMilestones))
      );

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
      setSavingMilestonesModal(false);
    }
  };

  // Approve milestones after editing (inside modal)
  const handleApproveAcceptedMilestones = async () => {
    if (!activeProjectId) return;

    try {
      const res = await approveCompanyMilestones(activeProjectId);

      // sync the approval state shown in the finalize dialog
      setMilestoneApprovalStateModal({
        milestonesLocked: res.milestonesLocked,
        companyApproved: res.companyApproved,
        providerApproved: res.providerApproved,
        milestonesApprovedAt: res.milestonesApprovedAt,
      });

      // 1. ALWAYS close the milestone editor dialog
      setMilestonesOpen(false);

      // 2. Show success toast
      toast({
        title: "Milestones approved",
        description: res.milestonesLocked
          ? "Milestones are now locked. Work can start."
          : "Waiting for provider approval.",
      });

      // 3. Open the summary/status dialog
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

  // Reject proposal flow
  const handleStartRejectProposal = (proposal: ProviderRequest) => {
    setSelectedProposalForAction(proposal);
    setRejectDialogOpen(true);
  };

  const handleConfirmRejectProposal = async () => {
    if (!selectedProposalForAction) return;
    try {
      setProcessingId(selectedProposalForAction.id);

      await rejectProjectRequest(selectedProposalForAction.id, rejectReason);

      // 🔁 Don't remove it. Just mark REJECTED (use lowercase to match ProviderRequest interface).
      setProposals((prev: ProviderRequest[]) =>
        prev.map((p) =>
          p.id === selectedProposalForAction.id
            ? { ...p, status: "rejected" }
            : p
        )
      );

      // Refresh proposals from server to ensure we have the latest status
      const projectRecord = project as Record<string, unknown>;
      const serviceRequestId =
        project?.type === "ServiceRequest"
          ? project.id
          : (projectRecord?.serviceRequestId as string | undefined) ||
            (projectRecord?.originalRequestId as string | undefined) ||
            resolvedId;

      if (serviceRequestId) {
        try {
          const proposalsResponse = await getCompanyProjectRequests({
            serviceRequestId: serviceRequestId as string,
            sort: "newest",
          });

          const rawProposals = Array.isArray(proposalsResponse?.proposals)
            ? proposalsResponse.proposals
            : Array.isArray(proposalsResponse?.data)
            ? proposalsResponse.data
            : Array.isArray(proposalsResponse?.items)
            ? proposalsResponse.items
            : [];

          const mappedProposals = mapProposalsToProviderRequests(rawProposals);
          setProposals(mappedProposals);
        } catch (err) {
          console.warn("Failed to refresh proposals after reject:", err);
        }
      }

      setRejectDialogOpen(false);
      setRejectReason("");
      setSelectedProposalForAction(null);

      toast({
        title: "Request Rejected",
        description: "The provider has been notified.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to reject request",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
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
        projectId: project.id as string,
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
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create/update dispute",
        variant: "destructive",
      });
    } finally {
      setCreatingDispute(false);
    }
  };

  const handleViewDispute = async () => {
    if (!project?.id) return;
    try {
      const disputeRes = await getDisputeByProject(project.id as string);
      if (disputeRes.success && disputeRes.data) {
        setCurrentDispute(disputeRes.data);
        setViewDisputeDialogOpen(true);
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load dispute",
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
      await updateDispute(currentDispute.id as string, {
        additionalNotes: disputeAdditionalNotes.trim() || undefined,
        attachments:
          disputeUpdateAttachments.length > 0
            ? disputeUpdateAttachments
            : undefined,
        projectId: project?.id as string | undefined,
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
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update dispute",
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

  // Check if any milestone is not locked (to show dispute button)
  const hasUnlockedMilestone = () => {
    if (!projectMilestones || projectMilestones.length === 0) {
      return false; // No milestones means no unlocked milestones
    }
    return projectMilestones.some(
      (milestone: Milestone) => milestone.status !== "LOCKED"
    );
  };

  return (
    <CustomerLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                {project.title as string}
              </h1>
              <Badge className={getStatusColor(project.status as string)}>
                {getStatusText(project.status as string)}
              </Badge>
              {(project.priority as string) === "high" && (
                <Badge variant="destructive" className="text-xs sm:text-sm">
                  High Priority
                </Badge>
              )}
              {Boolean(project.isFeatured) && (
                <Badge className="bg-purple-100 text-purple-800 text-xs sm:text-sm">
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 break-words">
              {project.description as string}
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>
                  Created:{" "}
                  {new Date(
                    project.createdAt as string | number | Date
                  ).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>{bidCount} bids</span>
              </div>
              {/* Date range only shown if startDate and endDate exist */}
              {Boolean(project.startDate) &&
              Boolean(project.endDate) &&
              startDate &&
              endDate &&
              !isNaN(startDate.getTime()) &&
              !isNaN(endDate.getTime()) ? (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">
                    {startDate.toLocaleDateString()} -{" "}
                    {endDate.toLocaleDateString()}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3 w-full lg:w-auto">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className="flex-1 sm:flex-initial text-xs sm:text-sm"
            >
              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Edit Project</span>
              <span className="sm:hidden">Edit</span>
            </Button>

            <Button
              variant="outline"
              className="flex-1 sm:flex-initial text-xs sm:text-sm"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Message Provider</span>
              <span className="sm:hidden">Message</span>
            </Button>
            {Boolean(currentDispute) ? (
              <Button
                variant="outline"
                className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300 flex-1 sm:flex-initial text-xs sm:text-sm"
                onClick={handleViewDispute}
              >
                <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">View Dispute</span>
                <span className="sm:hidden">Dispute</span>
              </Button>
            ) : (project?.status as string) !== "COMPLETED" &&
              hasUnlockedMilestone() ? (
              <Button
                className="bg-red-600 hover:bg-red-700 text-white flex-1 sm:flex-initial text-xs sm:text-sm"
                onClick={() => setDisputeDialogOpen(true)}
                disabled={
                  (project?.status as string) === "DISPUTED" &&
                  (currentDispute as { status?: string } | null)?.status ===
                    "CLOSED"
                }
              >
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Report Dispute</span>
                <span className="sm:hidden">Dispute</span>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Project Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Approved Price
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 break-words">
                    {currency} {fmt(approvedPriceValue || 0)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-green-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Total Spent
                  </p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 break-words">
                    {currency} {fmt(totalSpentValue || 0)}
                  </p>
                </div>
                <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Progress</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">
                    {progressValue || 0}%
                  </p>
                </div>
                <div className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex items-center justify-center flex-shrink-0 ml-2">
                  <div
                    className="w-full h-full rounded-full border-4 border-purple-600 border-t-transparent animate-spin"
                    style={{ animationDuration: "2s" }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          {daysLeftValue == null ? (
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Days Left
                    </p>
                    <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1">
                      —
                    </p>
                  </div>
                  <Calendar className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-3 sm:p-4 lg:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {daysLeftValue < 0 ? "Late" : "Days Left"}
                    </p>
                    <p
                      className={`text-lg sm:text-xl lg:text-2xl font-bold mt-1 ${
                        daysLeftValue < 0 ? "text-red-600" : ""
                      }`}
                    >
                      {daysLeftValue < 0
                        ? `Late ${Math.abs(daysLeftValue)} day${
                            Math.abs(daysLeftValue) !== 1 ? "s" : ""
                          }`
                        : daysLeftValue}
                    </p>
                  </div>
                  <Calendar
                    className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 flex-shrink-0 ml-2 ${
                      daysLeftValue < 0 ? "text-red-600" : "text-orange-600"
                    }`}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Progress Bar */}
        {(project.status as string) === "in_progress" && (
          <Card>
            <CardContent className="p-4 sm:p-5 lg:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
                <h3 className="font-semibold text-sm sm:text-base">
                  Overall Progress
                </h3>
                <span className="text-xs sm:text-sm text-gray-500">
                  {typeof project.progress === "number"
                    ? project.progress
                    : typeof project.progress === "string"
                    ? Number(project.progress) || 0
                    : 0}
                  % Complete
                </span>
              </div>
              <Progress
                value={
                  typeof project.progress === "number"
                    ? project.progress
                    : typeof project.progress === "string"
                    ? Number(project.progress) || 0
                    : 0
                }
                className="h-2 sm:h-3"
              />
            </CardContent>
          </Card>
        )}

        {/* Assigned Provider */}
        {project.assignedProvider && (
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                Assigned Provider
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    <AvatarImage
                      src={getProfileImageUrl(
                        project.assignedProvider?.providerProfile
                          ?.profileImageUrl || project.assignedProvider?.avatar
                      )}
                    />
                    <AvatarFallback>
                      {project.assignedProvider.name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base truncate">
                      {project.assignedProvider.name || "Unknown Provider"}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                        <span>
                          {project.assignedProvider.providerProfile?.rating ||
                            0}
                        </span>
                      </div>
                      <span className="hidden sm:inline">•</span>
                      <span className="truncate">
                        {project.assignedProvider.providerProfile
                          ?.completedJobs || 0}{" "}
                        jobs completed
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    Message
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto text-xs sm:text-sm"
                  >
                    View Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 sm:space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="milestones"
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              Milestones
            </TabsTrigger>
            <TabsTrigger
              value="bids"
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              Bids
            </TabsTrigger>
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
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Project Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">
                      Category
                    </h4>
                    <Badge variant="secondary" className="text-xs sm:text-sm">
                      {project.category}
                    </Badge>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-sm sm:text-base">
                      Timeline
                    </h4>
                    <div className="space-y-2">
                      {project.originalTimeline ? (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            Original Timeline (Company):
                          </p>
                          <p className="text-xs sm:text-sm text-gray-900 font-medium">
                            {formatTimeline(project.originalTimeline)}
                          </p>
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
                    <h4 className="font-medium mb-2 text-sm sm:text-base">
                      Required Skills
                    </h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 pt-0">
                  <MarkdownViewer
                    content={requirements}
                    emptyMessage="No requirements specified."
                    className="text-xs sm:text-sm"
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Deliverables
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <MarkdownViewer
                  content={deliverables}
                  emptyMessage="No deliverables specified."
                  className="text-xs sm:text-sm"
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Project Milestones
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Track progress through key project milestones
                </CardDescription>
                {project?.type === "Project" && (
                  <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-4">
                    <Badge variant="outline" className="text-xs sm:text-sm">
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
                          onClick={() => {
                            // Store original milestones when opening editor
                            setOriginalProjectMilestones(
                              JSON.parse(JSON.stringify(projectMilestones))
                            );
                            setMilestoneEditorOpen(true);
                          }}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          Edit Milestones
                        </Button>
                        <Button
                          onClick={handleApproveProjectMilestones}
                          size="sm"
                          className="text-xs sm:text-sm"
                        >
                          Approve
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-4 sm:space-y-6">
                  {projectMilestones && projectMilestones.length > 0 ? (
                    projectMilestones.map((milestone, index) => (
                      <div key={milestone.id} className="flex gap-2 sm:gap-4">
                        <div className="flex flex-col items-center flex-shrink-0">
                          <div className="w-5 h-5 sm:w-6 sm:h-6">
                            {getMilestoneStatusIcon(milestone.status || "")}
                          </div>
                          {index < projectMilestones.length - 1 && (
                            <div className="w-px h-12 sm:h-16 bg-gray-200 mt-1 sm:mt-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pb-6 sm:pb-8">
                          <div className="flex flex-col gap-2 mb-2">
                            {/* Top Row */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                              <h3 className="font-semibold text-sm sm:text-base break-words">
                                {milestone.title}
                              </h3>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge
                                  className={`${getStatusColor(
                                    milestone.status || ""
                                  )} text-xs`}
                                >
                                  {getStatusText(milestone.status || "")}
                                </Badge>
                                <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
                                  {fmt(milestone.amount)} {currency}
                                </span>
                              </div>
                            </div>

                            {/* Description Row */}
                            <div className="mb-2 sm:mb-3">
                              <p className="text-xs sm:text-sm text-gray-600 break-words">
                                {milestone.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                              <span>
                                Due:{" "}
                                {new Date(
                                  milestone.dueDate
                                ).toLocaleDateString()}
                              </span>
                            </div>
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
                          {milestone.status === "in_progress" &&
                            milestone.progress && (
                              <div className="mt-2 sm:mt-3">
                                <div className="flex justify-between text-xs sm:text-sm mb-1">
                                  <span>Progress</span>
                                  <span>{milestone.progress}%</span>
                                </div>
                                <Progress
                                  value={milestone.progress}
                                  className="h-2"
                                />
                              </div>
                            )}

                          {/* Show start deliverables if available (persists even after status changes) */}
                          {milestone.startDeliverables ? (
                            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-sm font-medium text-green-900 mb-1">
                                📋 Plan / Deliverables (When Starting Work):
                              </p>
                              <p className="text-sm text-green-800 whitespace-pre-wrap">
                                {typeof milestone.startDeliverables ===
                                  "object" &&
                                milestone.startDeliverables !== null &&
                                "description" in milestone.startDeliverables &&
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
                                  : JSON.stringify(milestone.startDeliverables)}
                              </p>
                            </div>
                          ) : null}

                          {/* Show submit deliverables if available (persists even after status changes) */}
                          {milestone.submitDeliverables ? (
                            <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                              <p className="text-sm font-medium text-purple-900 mb-1">
                                ✅ Deliverables / Completion Notes (When
                                Submitting):
                              </p>
                              <p className="text-sm text-purple-800 whitespace-pre-wrap">
                                {typeof milestone.submitDeliverables ===
                                  "object" &&
                                milestone.submitDeliverables !== null &&
                                "description" in milestone.submitDeliverables &&
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
                                  : JSON.stringify(
                                      milestone.submitDeliverables
                                    )}
                              </p>
                            </div>
                          ) : null}

                          {/* Show submission note if available (persists even after status changes) */}
                          {milestone.submissionNote && (
                            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-sm font-medium text-blue-900 mb-1">
                                📝 Submission Note:
                              </p>
                              <p className="text-sm text-blue-800 whitespace-pre-wrap">
                                {milestone.submissionNote}
                              </p>
                            </div>
                          )}

                          {/* Show latest requested changes reason if available (persists even after status changes) */}
                          {milestone.submissionHistory &&
                            Array.isArray(milestone.submissionHistory) &&
                            milestone.submissionHistory.length > 0 &&
                            (() => {
                              const latestRequest = milestone.submissionHistory[
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
                                  <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                                    <p className="text-sm font-medium text-orange-900 mb-1">
                                      🔄 Latest Request for Changes (Revision #
                                      {typeof latestRequest.revisionNumber ===
                                      "number"
                                        ? latestRequest.revisionNumber
                                        : milestone.submissionHistory.length}
                                      ):
                                    </p>
                                    <p className="text-sm text-orange-800 whitespace-pre-wrap">
                                      {latestRequest.requestedChangesReason}
                                    </p>
                                    {latestRequest.requestedChangesAt &&
                                    typeof latestRequest.requestedChangesAt ===
                                      "string" ? (
                                      <p className="text-xs text-orange-600 mt-2">
                                        Requested on:{" "}
                                        {new Date(
                                          latestRequest.requestedChangesAt
                                        ).toLocaleString()}
                                      </p>
                                    ) : null}
                                  </div>
                                );
                              }
                              return null;
                            })()}

                          {/* Show attachment if available (persists even after status changes) */}
                          {milestone.submissionAttachmentUrl && (
                            <div className="mt-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Paperclip className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium text-gray-900">
                                  📎 Submission Attachment
                                </span>
                              </div>
                              <a
                                href={`${
                                  process.env.NEXT_PUBLIC_API_URL ||
                                  "http://localhost:4000"
                                }/${milestone.submissionAttachmentUrl
                                  .replace(/\\/g, "/")
                                  .replace(/^\//, "")}`}
                                download={(() => {
                                  const normalized =
                                    milestone.submissionAttachmentUrl.replace(
                                      /\\/g,
                                      "/"
                                    );
                                  return (
                                    normalized.split("/").pop() || "attachment"
                                  );
                                })()}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50 hover:shadow-sm transition"
                              >
                                {/* Icon circle */}
                                <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                  PDF
                                </div>

                                {/* File info */}
                                <div className="flex flex-col min-w-0">
                                  <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                    {(() => {
                                      const normalized =
                                        milestone.submissionAttachmentUrl.replace(
                                          /\\/g,
                                          "/"
                                        );
                                      return (
                                        normalized.split("/").pop() ||
                                        "attachment"
                                      );
                                    })()}
                                  </span>
                                  <span className="text-xs text-gray-500 leading-snug">
                                    Click to preview / download
                                  </span>
                                </div>

                                {/* Download icon */}
                                <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                                  <svg
                                    className="w-4 h-4"
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
                            </div>
                          )}

                          {/* Show submission history if available (persists even after status changes) */}
                          {milestone.submissionHistory &&
                            Array.isArray(milestone.submissionHistory) &&
                            milestone.submissionHistory.length > 0 && (
                              <div className="mt-4 border-t pt-4">
                                <p className="text-sm font-semibold text-gray-900 mb-3">
                                  📚 Previous Submission History:
                                </p>
                                <div className="space-y-3">
                                  {(
                                    milestone.submissionHistory as unknown[]
                                  ).map((history: unknown, idx: number) => {
                                    const historyRecord = history as Record<
                                      string,
                                      unknown
                                    >;
                                    // Calculate revision number: first submission is revision 1, then 2, 3, etc.
                                    // The revision number in history is the one BEFORE it was rejected
                                    const revisionNumber =
                                      typeof historyRecord.revisionNumber ===
                                      "number"
                                        ? historyRecord.revisionNumber
                                        : idx + 1;

                                    return (
                                      <div
                                        key={idx}
                                        className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                                      >
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="text-sm font-medium text-gray-900">
                                            Revision #{revisionNumber}
                                          </p>
                                          {historyRecord.requestedChangesAt &&
                                          typeof historyRecord.requestedChangesAt ===
                                            "string" ? (
                                            <span className="text-xs text-gray-500">
                                              Changes requested:{" "}
                                              {new Date(
                                                historyRecord.requestedChangesAt
                                              ).toLocaleDateString()}
                                            </span>
                                          ) : null}
                                        </div>

                                        {historyRecord.requestedChangesReason &&
                                        typeof historyRecord.requestedChangesReason ===
                                          "string" ? (
                                          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded">
                                            <p className="text-xs font-medium text-red-900 mb-1">
                                              Reason for Changes:
                                            </p>
                                            <p className="text-xs text-red-800">
                                              {
                                                historyRecord.requestedChangesReason
                                              }
                                            </p>
                                          </div>
                                        ) : null}

                                        {historyRecord.submitDeliverables ? (
                                          <div className="mb-2">
                                            <p className="text-xs font-medium text-gray-700 mb-1">
                                              Deliverables:
                                            </p>
                                            <p className="text-xs text-gray-600 whitespace-pre-wrap">
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
                                                : JSON.stringify(
                                                    historyRecord.submitDeliverables
                                                  )}
                                            </p>
                                          </div>
                                        ) : null}

                                        {historyRecord.submissionNote &&
                                        typeof historyRecord.submissionNote ===
                                          "string" ? (
                                          <div className="mb-2">
                                            <p className="text-xs font-medium text-gray-700 mb-1">
                                              Note:
                                            </p>
                                            <p className="text-xs text-gray-600 whitespace-pre-wrap">
                                              {historyRecord.submissionNote}
                                            </p>
                                          </div>
                                        ) : null}

                                        {historyRecord.submissionAttachmentUrl &&
                                        typeof historyRecord.submissionAttachmentUrl ===
                                          "string" ? (
                                          <div>
                                            <p className="text-xs font-medium text-gray-700 mb-1">
                                              Attachment:
                                            </p>
                                            <a
                                              href={`${
                                                process.env
                                                  .NEXT_PUBLIC_API_URL ||
                                                "http://localhost:4000"
                                              }/${historyRecord.submissionAttachmentUrl
                                                .replace(/\\/g, "/")
                                                .replace(/^\//, "")}`}
                                              download
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-xs text-blue-600 hover:text-blue-800 underline"
                                            >
                                              {(() => {
                                                const normalized =
                                                  historyRecord.submissionAttachmentUrl.replace(
                                                    /\\/g,
                                                    "/"
                                                  );
                                                return (
                                                  normalized.split("/").pop() ||
                                                  "attachment"
                                                );
                                              })()}
                                            </a>
                                          </div>
                                        ) : null}

                                        {historyRecord.submittedAt &&
                                        typeof historyRecord.submittedAt ===
                                          "string" &&
                                        !isNaN(
                                          new Date(
                                            historyRecord.submittedAt
                                          ).getTime()
                                        ) ? (
                                          <p className="text-xs text-gray-500 mt-2">
                                            Submitted:{" "}
                                            {new Date(
                                              historyRecord.submittedAt
                                            ).toLocaleString()}
                                          </p>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          {/* Request Changes Dialog */}
                          <Dialog
                            open={requestChangesDialogOpen}
                            onOpenChange={setRequestChangesDialogOpen}
                          >
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Request Changes</DialogTitle>
                                <DialogDescription>
                                  Add notes about the required changes. The
                                  provider will be notified and can resubmit
                                  after making the changes.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="requestChangesReason">
                                    Changes Required Notes *
                                  </Label>
                                  <Textarea
                                    id="requestChangesReason"
                                    placeholder="Please describe what changes are needed..."
                                    value={requestChangesReason}
                                    onChange={(e) =>
                                      setRequestChangesReason(e.target.value)
                                    }
                                    rows={5}
                                    required
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    This note will be visible to the provider
                                    and saved in submission history.
                                  </p>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setRequestChangesDialogOpen(false);
                                    setRequestChangesReason("");
                                    setSelectedMilestoneForReject(null);
                                  }}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleRejectMilestone}
                                  disabled={!requestChangesReason.trim()}
                                >
                                  Request Changes
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          {milestone.status === "LOCKED" &&
                            projectMilestones.findIndex(
                              (m: Milestone) =>
                                m.status === "LOCKED" &&
                                project.status === "IN_PROGRESS"
                            ) === index && (
                              <>
                                <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />

                                  <p className="text-sm text-amber-800">
                                    {
                                      // 🟡 CHECK PREVIOUS MILESTONE (if exists)
                                      index > 0 &&
                                      projectMilestones[index - 1].status !==
                                        "APPROVED"
                                        ? "You must approve the previous milestone before continuing to the next one."
                                        : "You must complete the payment before the provider can start working."
                                    }
                                  </p>
                                </div>
                                <div className="mt-3">
                                  <Button
                                    size="sm"
                                    disabled={
                                      index > 0 &&
                                      projectMilestones[index - 1].status !==
                                        "APPROVED"
                                        ? true
                                        : false
                                    }
                                    onClick={() =>
                                      milestone.id &&
                                      handlePayMilestone(milestone.id)
                                    }
                                    className="bg-blue-600 hover:bg-blue-700 text-xs sm:text-sm w-full sm:w-auto"
                                  >
                                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                    Pay Now
                                  </Button>
                                </div>
                              </>
                            )}
                          {/* Action buttons only shown for SUBMITTED status */}
                          {milestone.status === "SUBMITTED" && milestone.id ? (
                            <div className="mt-3 flex flex-col sm:flex-row gap-2">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleApproveIndividualMilestone(
                                    milestone.id!
                                  )
                                }
                                className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm w-full sm:w-auto"
                              >
                                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                Approve Milestone
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleRequestChangesClick(milestone.id!)
                                }
                                className="text-xs sm:text-sm w-full sm:w-auto"
                              >
                                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                Request Changes
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600 text-center py-8">
                      No milestones found
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bids Tab */}
          <TabsContent value="bids">
            <Card className="border border-gray-200 shadow-sm">
              <CardHeader className="border-b bg-gray-50 p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg font-semibold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <span>Received Proposals ({proposals.length})</span>
                  {bidsLoading && (
                    <span className="text-xs text-gray-500 font-normal">
                      Loading…
                    </span>
                  )}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  Review and manage proposals from providers
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
                {bidsError && (
                  <div className="text-red-600 text-sm">{bidsError}</div>
                )}

                {!bidsLoading && proposals.length === 0 ? (
                  <div className="text-sm text-gray-500">No proposals yet.</div>
                ) : (
                  proposals.map((p) => (
                    <Card
                      key={p.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardContent className="p-4 sm:p-5 lg:p-6">
                        <div className="flex flex-col lg:flex-row gap-4 sm:gap-5 lg:gap-6">
                          {/* Provider Info */}
                          <div className="flex items-start space-x-3 sm:space-x-4 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarImage
                                src={
                                  p.providerAvatar &&
                                  p.providerAvatar !==
                                    "/placeholder.svg?height=40&width=40" &&
                                  !p.providerAvatar.includes("/placeholder.svg")
                                    ? p.providerAvatar
                                    : "/placeholder.svg"
                                }
                              />
                              <AvatarFallback>
                                {String(p.providerName || "P")
                                  .split(" ")
                                  .filter(Boolean)
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                  {p.providerName || "Provider"}
                                </h3>
                                <div className="flex items-center gap-1">
                                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                                  <span className="text-xs sm:text-sm text-gray-600">
                                    {p.providerRating ?? "No rating"}
                                  </span>
                                </div>
                              </div>

                              {p.providerResponseTime && (
                                <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs sm:text-sm text-gray-600 mb-2">
                                  {p.providerResponseTime && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                      <span>
                                        Responds in {p.providerResponseTime}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {p.coverLetter && (
                                <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-2 break-words">
                                  {p.coverLetter}
                                </p>
                              )}

                              {Array.isArray(p.skills) &&
                                p.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {p.skills
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
                                    {p.skills.length > 3 && (
                                      <Badge
                                        variant="secondary"
                                        className="text-[10px] leading-tight"
                                      >
                                        +{p.skills.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                )}
                            </div>
                          </div>

                          {/* Right column */}
                          <div className="lg:w-80 space-y-2 sm:space-y-3">
                            {/* Status + submitted date */}
                            <div className="flex justify-between items-center">
                              <Badge
                                className={
                                  p.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : p.status === "accepted"
                                    ? "bg-green-100 text-green-800"
                                    : p.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }
                              >
                                {p.status === "pending"
                                  ? "Pending"
                                  : p.status === "accepted"
                                  ? "Accepted"
                                  : p.status === "rejected"
                                  ? "Rejected"
                                  : p.status}
                              </Badge>

                              <span className="text-sm text-gray-500">
                                {p.submittedAt &&
                                !isNaN(new Date(p.submittedAt).getTime())
                                  ? new Date(p.submittedAt).toLocaleDateString()
                                  : "—"}
                              </span>
                            </div>

                            {/* Bid / timeline */}
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-sm text-gray-600">
                                  Bid Amount
                                </p>
                                <p className="font-semibold text-lg">
                                  RM {Number(p.bidAmount ?? 0).toLocaleString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-gray-600">
                                  Timeline
                                </p>
                                <p className="font-medium">
                                  {p.proposedTimeline || "—"}
                                </p>
                              </div>
                            </div>

                            {/* Mini milestones preview */}
                            {!!p.milestones?.length && (
                              <div className="text-xs text-gray-600 bg-gray-50 rounded p-2">
                                <div className="font-medium text-gray-900 mb-1">
                                  Proposed Milestones
                                </div>
                                <ul className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                  {p.milestones.map(
                                    (
                                      m: {
                                        title: string;
                                        amount: number;
                                        dueDate: string;
                                        order: number;
                                        description?: string;
                                      },
                                      idx: number
                                    ) => (
                                      <li
                                        key={idx}
                                        className="flex justify-between"
                                      >
                                        <span className="truncate">
                                          {m.title || `Milestone ${idx + 1}`}
                                        </span>
                                        <span>
                                          RM{" "}
                                          {Number(
                                            m.amount || 0
                                          ).toLocaleString()}
                                        </span>
                                      </li>
                                    )
                                  )}
                                </ul>
                              </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-col sm:flex-row gap-2 pt-2">
                              {/* View Profile */}
                              <NextLink
                                href={`/customer/providers/${p.providerId}`}
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
                              </NextLink>

                              {/* View Details */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs sm:text-sm"
                                onClick={() => {
                                  // sync the dialog state to match requests page structure:
                                  setSelectedProposalDetails({
                                    ...p, // Include all proposal data
                                    provider: {
                                      id: p.providerId,
                                      name: p.providerName,
                                      avatar: p.providerAvatar,
                                      rating: p.providerRating,
                                      location: p.providerLocation,
                                      responseTime: p.providerResponseTime,
                                    },
                                    projectTitle:
                                      p.projectTitle ||
                                      (project.title as string) ||
                                      "",
                                    bidAmount: p.bidAmount,
                                    proposedTimeline: p.proposedTimeline,
                                    deliveryTime:
                                      p.proposedTimeline?.replace(
                                        " days",
                                        ""
                                      ) || p.proposedTimeline,
                                    coverLetter: p.coverLetter,
                                    createdAt: p.submittedAt,
                                    submittedAt: p.submittedAt,
                                    status: p.status,
                                    milestones: p.milestones.map(
                                      (m: {
                                        title: string;
                                        amount: number;
                                        dueDate: string;
                                        order: number;
                                        description?: string;
                                      }) => ({
                                        title: m.title,
                                        amount: m.amount,
                                        dueDate: m.dueDate,
                                        sequence: m.order,
                                        order: m.order,
                                        description: m.description,
                                      })
                                    ),
                                    attachmentUrls: p.attachments || [],
                                    attachments: p.attachments || [],
                                    skills: p.skills || [],
                                    portfolio: p.portfolio || [],
                                    experience:
                                      (
                                        p as ProviderRequest & {
                                          experience?: string;
                                        }
                                      ).experience || "",
                                  });
                                  setProposalDetailsOpen(true);
                                }}
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                View Details
                              </Button>

                              {/* Accept / Reject only if it's still pending */}
                              {p.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleAcceptProposal(p)}
                                    className="bg-green-600 hover:bg-green-700 flex-1 text-xs sm:text-sm"
                                    disabled={processingId === p.id}
                                  >
                                    {processingId === p.id ? (
                                      <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 animate-spin" />
                                    ) : (
                                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                                    )}
                                    {processingId === p.id
                                      ? "Accepting..."
                                      : "Accept"}
                                  </Button>

                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleStartRejectProposal(p)}
                                    className="text-red-600 hover:text-red-700 flex-1 text-xs sm:text-sm"
                                    disabled={processingId === p.id}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files" className="space-y-4 sm:space-y-6">
            {/* Proposal Attachments Section */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Proposal Attachments
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Files attached to accepted proposals
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {(() => {
                  // Get attachments from accepted proposals only
                  const acceptedProposals = proposals.filter(
                    (p) => p.status === "accepted"
                  );
                  const proposalAttachments: Array<{
                    url: string;
                    proposalName: string;
                    proposalId: string;
                  }> = [];

                  acceptedProposals.forEach((proposal) => {
                    if (
                      Array.isArray(proposal.attachments) &&
                      proposal.attachments.length > 0
                    ) {
                      proposal.attachments.forEach((url: string) => {
                        proposalAttachments.push({
                          url,
                          proposalName: proposal.providerName || "Provider",
                          proposalId: proposal.id,
                        });
                      });
                    }
                  });

                  if (proposalAttachments.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-8">
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
                                        await getR2DownloadUrl(attachment.url); // Use original URL/key
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
                                From: {attachment.proposalName} • Click to
                                preview / download
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
                      (milestone.submissionHistory as unknown[]).forEach(
                        (history: unknown) => {
                          const historyRecord = history as Record<
                            string,
                            unknown
                          >;
                          if (
                            historyRecord.submissionAttachmentUrl &&
                            typeof historyRecord.submissionAttachmentUrl ===
                              "string" &&
                            milestone.id
                          ) {
                            milestoneAttachments.push({
                              url: historyRecord.submissionAttachmentUrl,
                              milestoneTitle: `${milestone.title} (Revision ${
                                typeof historyRecord.revisionNumber === "number"
                                  ? historyRecord.revisionNumber
                                  : "N/A"
                              })`,
                              milestoneId: milestone.id,
                              submittedAt:
                                typeof historyRecord.submittedAt === "string"
                                  ? historyRecord.submittedAt
                                  : undefined,
                            });
                          }
                        }
                      );
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
                                        await getR2DownloadUrl(attachment.url); // Use original URL/key
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
                                  !isNaN(
                                    new Date(attachment.submittedAt).getTime()
                                  ) &&
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
                {(() => {
                  const messageAttachments = projectFiles.flatMap(
                    (message: Record<string, unknown>) =>
                      Array.isArray(message.attachments)
                        ? message.attachments.map((url: string) => ({
                            url,
                            senderName:
                              ((message.sender as Record<string, unknown>)
                                ?.name as string) ||
                              (message.senderName as string) ||
                              "User",
                            messageId: message.id as string,
                            timestamp:
                              (message.createdAt as string) ||
                              (message.timestamp as string),
                          }))
                        : []
                  );
                  if (messageAttachments.length === 0) {
                    return (
                      <p className="text-sm text-gray-500 text-center py-8">
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

                        // Use getAttachmentUrl helper for consistent URL handling
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
                                        await getR2DownloadUrl(attachment.url); // Use original URL/key
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
                                From: {attachment.senderName} • Click to preview
                                / download
                              </span>
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

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Project Messages
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Communication with your assigned provider
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto">
                  {msgsToRender.map((message: Record<string, unknown>) => {
                    const messageSender = message.sender as
                      | Record<string, unknown>
                      | undefined;
                    const isCurrentUser =
                      String(message.senderId || messageSender?.id) ===
                      String(currentUserId);
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
                      (isCurrentUser ? "You" : "User");
                    const avatarChar = senderName?.charAt?.(0) || "U";
                    const messageId = message.id as string | number | undefined;
                    const messageKey =
                      messageId !== undefined
                        ? String(messageId)
                        : `msg-${Math.random()}`;

                    return (
                      <div
                        key={messageKey}
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
                                    const name =
                                      url.split("/").pop() || `file-${index}`;

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
                                                target.style.display = "none";
                                              }}
                                            />
                                          </div>
                                        ) : isPDF(url) ? (
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-blue-500 underline"
                                          >
                                            📄 {name}
                                          </a>
                                        ) : (
                                          <a
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
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
                          <p className="text-xs text-gray-500 mt-1">{ts}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Separator className="my-4" />
                {messages.length > 0 && (
                  <div className="flex justify-center gap-2">
                    <Button onClick={handleContact}>Contact</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Edit Project
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 sm:gap-4">
            <div>
              <Label className="text-sm sm:text-base">Title</Label>
              <Input
                value={edit.title}
                onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                className="mt-1.5 text-sm sm:text-base"
              />
            </div>

            <div>
              <Label className="text-sm sm:text-base">Description</Label>
              <Textarea
                rows={4}
                value={edit.description}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
                className="mt-1.5 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm sm:text-base">Category</Label>
                <Input
                  value={edit.category}
                  onChange={(e) =>
                    setEdit({ ...edit, category: e.target.value })
                  }
                  className="mt-1.5 text-sm sm:text-base"
                />
              </div>
              <div>
                <Label className="text-sm sm:text-base">Priority</Label>
                <Input
                  value={edit.priority}
                  onChange={(e) =>
                    setEdit({ ...edit, priority: e.target.value })
                  }
                  className="mt-1.5 text-sm sm:text-base"
                />
              </div>
              <div>
                <Label className="text-sm sm:text-base">Timeline</Label>
                <Input
                  value={edit.timeline}
                  onChange={(e) =>
                    setEdit({ ...edit, timeline: e.target.value })
                  }
                  className="mt-1.5 text-sm sm:text-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm sm:text-base">Budget Min</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={edit.budgetMin}
                  onChange={(e) =>
                    setEdit({ ...edit, budgetMin: e.target.value })
                  }
                  className="mt-1.5 text-sm sm:text-base"
                />
              </div>
              <div>
                <Label className="text-sm sm:text-base">Budget Max</Label>
                <Input
                  type="number"
                  inputMode="decimal"
                  value={edit.budgetMax}
                  onChange={(e) =>
                    setEdit({ ...edit, budgetMax: e.target.value })
                  }
                  className="mt-1.5 text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm sm:text-base">
                Skills (comma / new line)
              </Label>
              <Textarea
                rows={2}
                placeholder="React, Node.js, PostgreSQL"
                value={edit.skills}
                onChange={(e) => setEdit({ ...edit, skills: e.target.value })}
                className="mt-1.5 text-sm sm:text-base"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label className="text-sm sm:text-base">Requirements</Label>
                <div className="mt-1.5">
                  <RichEditor
                    content={edit.requirements}
                    onChange={(value) =>
                      setEdit({ ...edit, requirements: value })
                    }
                    placeholder="Enter project requirements..."
                    initialHeight={200}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm sm:text-base">Deliverables</Label>
                <div className="mt-1.5">
                  <RichEditor
                    content={edit.deliverables}
                    onChange={(value) =>
                      setEdit({ ...edit, deliverables: value })
                    }
                    placeholder="Enter project deliverables..."
                    initialHeight={200}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(false)}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="w-full sm:w-auto text-sm sm:text-base"
            >
              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" /> Save
              Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={milestoneEditorOpen} onOpenChange={setMilestoneEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Edit Milestones
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Company {milestoneApprovalState.companyApproved ? "✓" : "✗"} ·
              Provider {milestoneApprovalState.providerApproved ? "✓" : "✗"}
              {milestoneApprovalState.milestonesLocked && " · LOCKED"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4">
            {milestoneErrors[-1]?.title && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">
                  {milestoneErrors[-1].title}
                </p>
              </div>
            )}
            {projectMilestones.map((m, i) => (
              <Card key={i}>
                <CardContent className="p-3 sm:p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-1">
                      <label className="text-xs sm:text-sm font-medium">
                        Seq
                      </label>
                      <Input
                        type="number"
                        value={i + 1}
                        disabled
                        className="mt-1.5 text-sm sm:text-base"
                      />
                    </div>
                    <div className="sm:col-span-12 md:col-span-4">
                      <label className="text-xs sm:text-sm font-medium">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <Input
                        value={m.title}
                        onChange={(e) => {
                          updateProjectMilestone(i, { title: e.target.value });
                          if (milestoneErrors[i]?.title) {
                            setMilestoneErrors((prev) => ({
                              ...prev,
                              [i]: { ...prev[i], title: undefined },
                            }));
                          }
                        }}
                        className={`mt-1.5 text-sm sm:text-base ${
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
                    <div className="sm:col-span-12 md:col-span-3">
                      <label className="text-xs sm:text-sm font-medium">
                        Amount
                      </label>
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
                        className="mt-1.5 text-sm sm:text-base"
                      />
                    </div>
                    <div className="sm:col-span-12 md:col-span-4">
                      <label className="text-xs sm:text-sm font-medium">
                        Due Date <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="date"
                        min={new Date().toISOString().split("T")[0]}
                        value={(m.dueDate || "").slice(0, 10)}
                        onChange={(e) => {
                          const selectedDate = e.target.value;
                          const today = new Date().toISOString().split("T")[0];
                          if (selectedDate < today) {
                            toast({
                              title: "Invalid Date",
                              description:
                                "Due date cannot be in the past. Please select today or a future date.",
                              variant: "destructive",
                            });
                            return;
                          }
                          updateProjectMilestone(i, { dueDate: selectedDate });
                          if (milestoneErrors[i]?.dueDate) {
                            setMilestoneErrors((prev) => ({
                              ...prev,
                              [i]: { ...prev[i], dueDate: undefined },
                            }));
                          }
                        }}
                        className={`mt-1.5 text-sm sm:text-base ${
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
                    <label className="text-xs sm:text-sm font-medium">
                      Description <span className="text-red-500">*</span>
                    </label>
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
                      className={`mt-1.5 text-sm sm:text-base ${
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
                      onClick={() => removeProjectMilestone(i)}
                      size="sm"
                      className="text-xs sm:text-sm"
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-2">
              <Button
                variant="outline"
                onClick={addProjectMilestone}
                size="sm"
                className="text-xs sm:text-sm w-full sm:w-auto"
              >
                + Add Milestone
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handleSaveProjectMilestones}
                  disabled={savingMilestones}
                  size="sm"
                  className="text-xs sm:text-sm w-full sm:w-auto"
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
                  size="sm"
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

      {/* Payment Dialog */}
      {/* <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Milestone Payment</DialogTitle>
            <DialogDescription>
              Confirm payment for the milestone work
            </DialogDescription>
          </DialogHeader>

          {selectedMilestoneForPayment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">
                  {selectedMilestoneForPayment.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedMilestoneForPayment.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Amount to pay:</span>
                  <span className="text-lg font-semibold text-green-600">
                    RM {selectedMilestoneForPayment.amount}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    Payment Method
                  </span>
                </div>
                <p className="text-sm text-blue-700">
                  This is a temporary payment dialog. In production, this would
                  integrate with payment gateways like Stripe, FPX, or other
                  payment methods.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={processingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessPayment}
              disabled={processingPayment}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {processingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4 mr-2" />
                  Process Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog> */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-3xl w-full">
          <MilestonePayment
            milestone={{
              id: selectedMilestoneForPayment?.id || "",
              title: selectedMilestoneForPayment?.title || "",
              amount: selectedMilestoneForPayment?.amount || 0,
              projectId: project?.id || "",
            }}
            type={"customer"}
            onSuccess={() => {
              setPaymentDialogOpen(false);
              refreshProjectData();
              toast({
                title: "Payment successful",
                description: "Milestone payment has been processed.",
              });
            }}
          />
          {/* <DialogHeader>
            <DialogTitle>Confirm Payment</DialogTitle>
            <DialogDescription>
              You are about to process payment for milestone:{" "}
              <strong>{selectedMilestoneForPayment?.title}</strong>.
            </DialogDescription>
          </DialogHeader>

          {selectedMilestoneForPayment && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">
                  {selectedMilestoneForPayment.title}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {selectedMilestoneForPayment.description}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Amount to pay:</span>
                  <span className="text-lg font-semibold text-green-600">
                    RM {selectedMilestoneForPayment.amount}
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-lg border">
                <p className="text-sm mb-2">Enter card details</p>
                <div className="p-3 border rounded">
                  <CardElement
                    options={{
                      style: {
                        base: { fontSize: "16px", color: "#111827" },
                        invalid: { color: "#ef4444" },
                      },
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Use Stripe test card <code>4242 4242 4242 4242</code> with any
                  future expiry & CVC to simulate a successful payment.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={processingPayment}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleProcessPayment}
              disabled={processingPayment}
            >
              {processingPayment ? "Processing..." : "Confirm Payment"}
            </Button>
          </DialogFooter> */}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this request. This will help
              the provider improve their future proposals.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectReason">Reason for rejection</Label>
              <Textarea
                id="rejectReason"
                placeholder="Please explain why you're rejecting this request..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedProposalForAction && handleConfirmRejectProposal()
              }
              className="bg-red-600 hover:bg-red-700"
              disabled={
                !rejectReason.trim() ||
                processingId === selectedProposalForAction?.id
              }
            >
              {processingId === selectedProposalForAction?.id ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Proposal Details Dialog (View Details) */}
      <Dialog
        open={proposalDetailsOpen}
        onOpenChange={(open) => {
          setProposalDetailsOpen(open);
          if (!open) {
            setSelectedProposalDetails(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              Detailed information about{" "}
              {selectedProposalDetails?.provider?.name || "Provider"}&apos;s
              request
            </DialogDescription>
          </DialogHeader>

          {selectedProposalDetails && (
            <div className="space-y-6">
              {/* Provider Info */}
              <div className="flex items-start space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage
                    src={getProfileImageUrl(
                      selectedProposalDetails.providerAvatar ||
                        selectedProposalDetails.provider?.providerProfile
                          ?.profileImageUrl
                    )}
                  />
                  <AvatarFallback>
                    {String(
                      selectedProposalDetails.provider?.name ||
                        selectedProposalDetails.providerName ||
                        "P"
                    )
                      .split(" ")
                      .filter(Boolean)
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  {/* Name + rating */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-semibold">
                        {selectedProposalDetails.provider?.name ||
                          selectedProposalDetails.providerName ||
                          "Provider"}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>
                            {selectedProposalDetails.provider?.rating ||
                              selectedProposalDetails.providerRating ||
                              0}{" "}
                            rating
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {selectedProposalDetails.provider?.responseTime ||
                            selectedProposalDetails.providerResponseTime ||
                            "N/A"}{" "}
                          response time
                        </div>
                      </div>

                      {selectedProposalDetails.experience && (
                        <p className="text-sm text-gray-600 mt-2">
                          {selectedProposalDetails.experience} experience
                        </p>
                      )}

                      {/* Skills inline preview */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {asArray<string>(selectedProposalDetails.skills || [])
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
                        {asArray<string>(selectedProposalDetails.skills || [])
                          .length > 4 && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] leading-tight"
                          >
                            +
                            {asArray<string>(
                              selectedProposalDetails.skills || []
                            ).length - 4}{" "}
                            more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* View profile button */}
                    <NextLink
                      href={`/customer/providers/${
                        selectedProposalDetails.provider?.id ||
                        selectedProposalDetails.providerId
                      }`}
                      className="self-start"
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                    </NextLink>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Project & Bid Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Project</h4>
                  <p className="text-gray-900">
                    {selectedProposalDetails.projectTitle || project.title}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Bid Amount</h4>
                  <p className="text-2xl font-bold text-green-600">
                    RM{fmt(selectedProposalDetails.bidAmount || 0)}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Proposed Timeline</h4>
                  <p className="text-gray-900">
                    {formatTimeline(selectedProposalDetails.proposedTimeline) ||
                      (selectedProposalDetails.deliveryTime
                        ? formatTimeline(
                            selectedProposalDetails.deliveryTime,
                            "day"
                          )
                        : null) ||
                      "—"}
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status</h4>
                  <Badge
                    className={getStatusColor(
                      selectedProposalDetails.status || "pending"
                    )}
                  >
                    {(selectedProposalDetails.status || "pending")
                      .charAt(0)
                      .toUpperCase() +
                      (selectedProposalDetails.status || "pending").slice(1)}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Cover Letter */}
              <div>
                <h4 className="font-semibold mb-2">Cover Letter</h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {selectedProposalDetails.coverLetter}
                  </p>
                </div>
              </div>

              {/* Skills */}
              <div>
                <h4 className="font-semibold mb-2">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {asArray<string>(selectedProposalDetails.skills || []).map(
                    (skill: string) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    )
                  )}
                </div>
              </div>

              {/* Portfolio */}
              <div>
                <h4 className="font-semibold mb-2">Portfolio</h4>
                <div className="space-y-2">
                  {asArray<string>(selectedProposalDetails.portfolio || []).map(
                    (link: string, index: number) => (
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
                  {asArray<string>(selectedProposalDetails.portfolio || [])
                    .length === 0 && (
                    <p className="text-sm text-gray-500">
                      No portfolio links provided
                    </p>
                  )}
                </div>
              </div>

              {/* Proposed Milestones */}
              {selectedProposalDetails.milestones &&
                selectedProposalDetails.milestones.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Proposed Milestones</h4>

                    <div className="space-y-4">
                      {selectedProposalDetails.milestones
                        .sort(
                          (
                            a: { order?: number; sequence?: number },
                            b: { order?: number; sequence?: number }
                          ) =>
                            (a.order || a.sequence || 0) -
                            (b.order || b.sequence || 0)
                        )
                        .map(
                          (
                            m: {
                              title?: string;
                              amount?: number;
                              dueDate?: string;
                              order?: number;
                              sequence?: number;
                              description?: string;
                            },
                            idx: number
                          ) => (
                            <Card key={idx} className="border border-gray-200">
                              <CardContent className="p-4 space-y-2 text-sm">
                                {/* Top row: title + amount */}
                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">
                                      #{m.order || m.sequence || idx + 1}
                                    </Badge>
                                    <span className="font-medium text-gray-900">
                                      {m.title || "Untitled milestone"}
                                    </span>
                                  </div>

                                  <div className="text-right">
                                    <span className="text-sm text-gray-500 block">
                                      Amount
                                    </span>
                                    <span className="text-lg font-semibold text-gray-900">
                                      RM{" "}
                                      {Number(m.amount || 0).toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                {/* Description */}
                                {m.description &&
                                  m.description.trim() !== "" && (
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                      {m.description}
                                    </p>
                                  )}

                                {/* Dates */}
                                <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
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
                          )
                        )}
                    </div>
                  </div>
                )}

              {/* Attachments */}
              {Array.isArray(selectedProposalDetails.attachments) &&
                selectedProposalDetails.attachments.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3 flex items-center text-gray-900">
                      Attachments
                    </h4>

                    <div className="space-y-2">
                      {selectedProposalDetails.attachments.map(
                        (rawUrl: string, idx: number) => {
                          // rawUrl can look like: "uploads\proposals\1761857633365_Screenshots.pdf" or R2 key
                          // We normalize slashes and extract filename.
                          const normalized = rawUrl.replace(/\\/g, "/"); // -> "uploads/proposals/..." or R2 key
                          const fileName =
                            normalized.split("/").pop() || `file-${idx + 1}`;

                          // Use getAttachmentUrl helper for consistent URL handling
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
                                          await getR2DownloadUrl(rawUrl); // Use original URL/key
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
                              {/* Icon circle */}
                              <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gray-300 bg-gray-100 text-gray-700 text-xs font-medium">
                                {/* If you want, you can make this dynamic based on extension */}
                                PDF
                              </div>

                              {/* File info */}
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-gray-900 break-all leading-snug">
                                  {fileName}
                                </span>
                                <span className="text-xs text-gray-500 leading-snug">
                                  Click to preview / download
                                </span>
                              </div>

                              {/* Download icon on the far right */}
                              <div className="ml-auto flex items-center text-gray-500 hover:text-gray-700">
                                <svg
                                  className="w-4 h-4"
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
                        }
                      )}
                    </div>
                  </div>
                )}
            </div>
          )}

          <DialogFooter>
            {selectedProposalDetails?.status === "pending" && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRejectDialogOpen(true);
                    setProposalDetailsOpen(false);
                    setSelectedProposalForAction(selectedProposalDetails);
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => {
                    handleAcceptProposal(selectedProposalDetails);
                    setProposalDetailsOpen(false);
                  }}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={processingId === selectedProposalDetails?.id}
                >
                  {processingId === selectedProposalDetails?.id ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {processingId === selectedProposalDetails?.id
                    ? "Accepting..."
                    : "Accept Request"}
                </Button>
              </div>
            )}
            {selectedProposalDetails?.status !== "pending" && (
              <Button
                variant="outline"
                onClick={() => {
                  setProposalDetailsOpen(false);
                  setSelectedProposalDetails(null);
                }}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Milestones Dialog (after accepting proposal) */}
      <Dialog open={milestonesOpen} onOpenChange={setMilestonesOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Milestones</DialogTitle>
            <DialogDescription>
              Company {milestoneApprovalStateModal.companyApproved ? "✓" : "✗"}{" "}
              · Provider{" "}
              {milestoneApprovalStateModal.providerApproved ? "✓" : "✗"}
              {milestoneApprovalStateModal.milestonesLocked && " · LOCKED"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {milestoneDraftErrors[-1]?.title && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600 font-medium">
                  {milestoneDraftErrors[-1].title}
                </p>
              </div>
            )}
            {milestonesDraft.map((m, i) => (
              <Card key={i}>
                <CardContent className="p-4 space-y-3">
                  <div className="grid md:grid-cols-12 gap-3">
                    <div className="md:col-span-1">
                      <Label>Seq</Label>
                      <Input type="number" value={i + 1} disabled />
                    </div>
                    <div className="md:col-span-4">
                      <Label>
                        Title <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={m.title}
                        onChange={(e) => {
                          const updated = [...milestonesDraft];
                          updated[i] = { ...updated[i], title: e.target.value };
                          setMilestonesDraft(updated);
                          if (milestoneDraftErrors[i]?.title) {
                            setMilestoneDraftErrors((prev) => ({
                              ...prev,
                              [i]: { ...prev[i], title: undefined },
                            }));
                          }
                        }}
                        className={
                          milestoneDraftErrors[i]?.title
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }
                      />
                      {milestoneDraftErrors[i]?.title && (
                        <p className="text-xs text-red-600 mt-1">
                          {milestoneDraftErrors[i].title}
                        </p>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={String(m.amount ?? 0)}
                        onChange={(e) => {
                          const updated = [...milestonesDraft];
                          updated[i] = {
                            ...updated[i],
                            amount: Number(e.target.value),
                          };
                          setMilestonesDraft(updated);
                          // Clear sum error when amount changes
                          if (milestoneDraftErrors[-1]) {
                            setMilestoneDraftErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[-1];
                              return newErrors;
                            });
                          }
                        }}
                      />
                    </div>
                    <div className="md:col-span-4">
                      <Label>
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
                            toast({
                              title: "Invalid Date",
                              description:
                                "Due date cannot be in the past. Please select today or a future date.",
                              variant: "destructive",
                            });
                            return;
                          }
                          const updated = [...milestonesDraft];
                          updated[i] = {
                            ...updated[i],
                            dueDate: selectedDate,
                          };
                          setMilestonesDraft(updated);
                          if (milestoneDraftErrors[i]?.dueDate) {
                            setMilestoneDraftErrors((prev) => ({
                              ...prev,
                              [i]: { ...prev[i], dueDate: undefined },
                            }));
                          }
                        }}
                        className={
                          milestoneDraftErrors[i]?.dueDate
                            ? "border-red-500 focus-visible:ring-red-500"
                            : ""
                        }
                      />
                      {milestoneDraftErrors[i]?.dueDate && (
                        <p className="text-xs text-red-600 mt-1">
                          {milestoneDraftErrors[i].dueDate}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label>
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      rows={2}
                      value={m.description || ""}
                      onChange={(e) => {
                        const updated = [...milestonesDraft];
                        updated[i] = {
                          ...updated[i],
                          description: e.target.value,
                        };
                        setMilestonesDraft(updated);
                        if (milestoneDraftErrors[i]?.description) {
                          setMilestoneDraftErrors((prev) => ({
                            ...prev,
                            [i]: { ...prev[i], description: undefined },
                          }));
                        }
                      }}
                      className={
                        milestoneDraftErrors[i]?.description
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    {milestoneDraftErrors[i]?.description && (
                      <p className="text-xs text-red-600 mt-1">
                        {milestoneDraftErrors[i].description}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setMilestonesDraft(
                          milestonesDraft.filter((_, idx) => idx !== i)
                        );
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setMilestonesDraft([
                    ...milestonesDraft,
                    {
                      sequence: milestonesDraft.length + 1,
                      title: "",
                      description: "",
                      amount: 0,
                      dueDate: new Date().toISOString().slice(0, 10),
                    },
                  ]);
                }}
              >
                + Add Milestone
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveAcceptedMilestones}
                  disabled={savingMilestonesModal}
                >
                  {savingMilestonesModal ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  onClick={handleApproveAcceptedMilestones}
                  disabled={
                    JSON.stringify(
                      normalizeMilestoneSequences(milestonesDraft)
                    ) !==
                    JSON.stringify(
                      normalizeMilestoneSequences(originalMilestonesDraft)
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
            <DialogTitle className="text-xl">Milestones Submitted</DialogTitle>
            <DialogDescription>
              These milestones are now awaiting final confirmation, or have been
              locked if both sides approved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-gray-700">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <div className="font-semibold text-gray-900">
                  Company Approved
                </div>
                <div>
                  {milestoneApprovalStateModal.companyApproved
                    ? "You have approved the milestone plan."
                    : "You haven't approved yet."}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className={`w-5 h-5 flex-shrink-0 ${
                  milestoneApprovalStateModal.providerApproved
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              />
              <div>
                <div className="font-semibold text-gray-900">
                  Provider Approved
                </div>
                <div>
                  {milestoneApprovalStateModal.providerApproved
                    ? "Provider approved the milestone plan."
                    : "Waiting for provider approval."}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle
                className={`w-5 h-5 flex-shrink-0 ${
                  milestoneApprovalStateModal.milestonesLocked
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              />
              <div>
                <div className="font-semibold text-gray-900">
                  Locked & Ready
                </div>
                <div>
                  {milestoneApprovalStateModal.milestonesLocked
                    ? "Milestones are locked. Work can start and payments will follow these milestones."
                    : "Milestones are not locked yet."}
                </div>
                {milestoneApprovalStateModal.milestonesApprovedAt && (
                  <div className="text-xs text-gray-500 mt-1">
                    Locked at{" "}
                    {new Date(
                      milestoneApprovalStateModal.milestonesApprovedAt
                    ).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4">
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
              Report a dispute related to this project. The associated milestone
              will be frozen until the dispute is resolved.
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
                      <SelectItem key={m.id} value={m.id || ""}>
                        {m.title} - RM{(m.amount || 0).toLocaleString()}
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
                onChange={(e) => setDisputeSuggestedResolution(e.target.value)}
                rows={4}
              />
            </div>

            {/* Attachments */}
            <div>
              <Label htmlFor="disputeAttachments">Attachments (Optional)</Label>
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
                  className={getDisputeStatusColor(currentDispute.status || "")}
                >
                  {currentDispute.status?.replace("_", " ") || "Unknown"}
                </Badge>
                <div className="text-sm text-gray-500">
                  Created:{" "}
                  {currentDispute.createdAt
                    ? new Date(
                        currentDispute.createdAt as string | number | Date
                      ).toLocaleDateString()
                    : "Unknown"}
                  {currentDispute.updatedAt &&
                    currentDispute.updatedAt !== currentDispute.createdAt && (
                      <>
                        {" "}
                        • Updated:{" "}
                        {new Date(
                          currentDispute.updatedAt as string | number | Date
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
                    <p className="mt-1">{currentDispute.reason || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">
                      Description & Updates
                    </Label>
                    <div className="mt-2 space-y-3">
                      {(() => {
                        // Parse description to show original and updates separately
                        const description =
                          (currentDispute.description as string) || "";
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
                                    {currentDispute.raisedBy?.name?.charAt(0) ||
                                      "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-xs font-semibold text-gray-900">
                                    {currentDispute.raisedBy?.name ||
                                      "Unknown User"}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Original dispute •{" "}
                                    {currentDispute.createdAt
                                      ? new Date(
                                          currentDispute.createdAt as
                                            | string
                                            | number
                                            | Date
                                        ).toLocaleString()
                                      : "Unknown"}
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
                                [, userName, updateDate, updateContent] = match;
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
                  {currentDispute.contestedAmount &&
                  typeof currentDispute.contestedAmount === "number" ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Contested Amount
                      </Label>
                      <p className="mt-1 font-medium">
                        RM{currentDispute.contestedAmount.toLocaleString()}
                      </p>
                    </div>
                  ) : null}
                  {currentDispute.suggestedResolution &&
                  typeof currentDispute.suggestedResolution === "string" ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Suggested Resolution
                      </Label>
                      <p className="mt-1 whitespace-pre-wrap">
                        {currentDispute.suggestedResolution}
                      </p>
                    </div>
                  ) : null}
                  {currentDispute.milestone &&
                  typeof currentDispute.milestone === "object" &&
                  currentDispute.milestone !== null ? (
                    <div>
                      <Label className="text-sm font-medium text-gray-500">
                        Related Milestone
                      </Label>
                      <p className="mt-1">
                        {(
                          currentDispute.milestone as {
                            title?: string;
                            amount?: number;
                          }
                        ).title || "Unknown"}{" "}
                        - RM
                        {typeof (
                          currentDispute.milestone as { amount?: number }
                        ).amount === "number"
                          ? (
                              currentDispute.milestone as { amount: number }
                            ).amount.toLocaleString()
                          : "0"}
                      </p>
                    </div>
                  ) : null}
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
                            createdAt?: string | number | Date;
                          },
                          index: number
                        ) => (
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
                                  {note.createdAt
                                    ? new Date(note.createdAt).toLocaleString()
                                    : "Unknown"}
                                </p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                              {note.note || ""}
                            </p>
                          </div>
                        )
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
                        {(currentDispute.attachments as unknown[]).map(
                          (url: unknown, index: number) => {
                            const urlStr =
                              typeof url === "string" ? url : String(url);
                            // Extract filename from path
                            const normalized = urlStr.replace(/\\/g, "/");
                            const filename =
                              normalized.split("/").pop() ||
                              `Attachment ${index + 1}`;
                            // Remove timestamp prefix if present (format: timestamp_filename.ext)
                            const cleanFilename = filename.replace(/^\d+_/, "");

                            // Try to find attachment metadata in description
                            const description =
                              (currentDispute.description as string) || "";
                            const attachmentMetadataMatch = description.match(
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
                              Array.isArray(currentDispute.attachments) &&
                              currentDispute.attachments.length === 1
                            ) {
                              uploadedBy =
                                (currentDispute.raisedBy?.name as string) ||
                                "Unknown User";
                              uploadedAt = currentDispute.createdAt
                                ? new Date(
                                    currentDispute.createdAt as
                                      | string
                                      | number
                                      | Date
                                  ).toLocaleString()
                                : "Unknown Date";
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
                                  const attachmentUrl =
                                    getAttachmentUrl(urlStr);
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
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={
                                        isR2Key
                                          ? async (e) => {
                                              e.preventDefault();
                                              try {
                                                const downloadUrl =
                                                  await getR2DownloadUrl(
                                                    urlStr
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
    </CustomerLayout>
  );
}
