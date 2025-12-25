"use client";

import type React from "react";

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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  ThumbsUp,
  Eye,
  Clock,
  DollarSign,
  Users,
  MapPin,
  Star,
  Send,
  Paperclip,
  CheckCircle,
  Loader2,
  Sparkles,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { ProviderLayout } from "@/components/provider-layout";
import { toast } from "sonner";
import {
  getProviderOpportunities,
  getProviderRecommendedOpportunities,
  sendProposal,
  getServiceRequestAiDrafts,
  getProfileImageUrl,
} from "@/lib/api";
import {
  formatTimeline,
  buildTimelineData,
  timelineToDays,
} from "@/lib/timeline-utils";
import Link from "next/link";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";

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

type OpportunityData = {
  id: string;
  title: string;
  description?: string;
  fullDescription?: string;
  client: string;
  clientId: string | null;
  budget: string;
  budgetMin: number;
  budgetMax: number;
  budgetType: string;
  timeline: string;
  originalTimeline: string | null;
  originalTimelineInDays: number;
  skills: string[];
  postedTime: string;
  matchScore?: number;
  proposals: number;
  category?: string;
  location: string;
  clientRating: number;
  projectsPosted: number;
  avatar: string;
  urgent: boolean;
  verified: boolean;
  hasSubmitted: boolean;
  requirements: string;
  deliverables: string;
  clientInfo: {
    companySize: string;
    industry: string;
    memberSince: string;
    totalSpent: string;
    avgRating: number;
  };
  originalData: Record<string, unknown>;
  aiExplanation?: string | null;
  serviceRequestId: string;
};

type AiDraft = {
  referenceId: string;
  summary?: string;
};

export default function ProviderOpportunitiesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState<OpportunityData | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  type Milestone = {
    sequence: number;
    title: string;
    description?: string;
    amount: number;
    dueDate: string; // ISO (yyyy-mm-dd or full ISO; we’ll normalize on submit)
  };

  type ProposalFormData = {
    coverLetter: string;
    bidAmount: string;
    timelineAmount: string;
    timelineUnit: "day" | "week" | "month" | "";
    milestones: Milestone[];
    attachments: File[];
  };

  const [proposalData, setProposalData] = useState({
    coverLetter: "",
    bidAmount: "",
    timelineAmount: "",
    timelineUnit: "" as "day" | "week" | "month" | "",
    milestones: [] as Milestone[],
    attachments: [] as File[],
  });

  // API state
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  // Recommended opportunities state
  const [recommendedOpportunities, setRecommendedOpportunities] = useState<
    OpportunityData[]
  >([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [errorRecommended, setErrorRecommended] = useState<string | null>(null);
  const [recommendationsCacheInfo, setRecommendationsCacheInfo] = useState<{
    cachedAt: number | null;
    nextRefreshAt: number | null;
  }>({ cachedAt: null, nextRefreshAt: null });
  const [expandedOpportunityId, setExpandedOpportunityId] = useState<
    string | null
  >(null);
  const [proposalErrors, setProposalErrors] = useState<{
    bidAmount?: string;
    timelineAmount?: string;
    timelineUnit?: string;
    coverLetter?: string;
    milestones?: string;
    attachments?: string;
    milestoneFields?: Record<
      number,
      {
        title?: string;
        description?: string;
        amount?: string;
        dueDate?: string;
      }
    >;
  }>({});

  // Helper function to map opportunity data
  // useRecommendationInsights: if true, use aiExplanation from opportunity (for recommended tab), if false, ignore it (for all tab - will use drafts)
  const mapOpportunityData = (
    opportunity: Record<string, unknown>,
    useRecommendationInsights: boolean = false
  ): OpportunityData => ({
    id: String(opportunity.id || ""),
    title: String(opportunity.title || ""),
    description: opportunity.description ? String(opportunity.description) : undefined,
    fullDescription: opportunity.description ? String(opportunity.description) : undefined,
    client: (opportunity.customer as OpportunityCustomer)?.name || "Unknown Client",
    clientId: (opportunity.customer as OpportunityCustomer)?.id || null,
    budget: `RM ${((opportunity.budgetMin as number) || 0).toLocaleString()} - RM ${((opportunity.budgetMax as number) || 0).toLocaleString()}`,
    budgetMin: (opportunity.budgetMin as number) || 0,
    budgetMax: (opportunity.budgetMax as number) || 0,
    budgetType: "fixed",
    timeline: formatTimeline(opportunity.timeline as string) || "Not specified",
    originalTimeline: (opportunity.timeline as string) || null,
    originalTimelineInDays: (() => {
      if (!opportunity.timeline) return 0;
      const timelineStr = String(opportunity.timeline).toLowerCase().trim();
      const match = timelineStr.match(
        /^(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)$/
      );
      if (match) {
        const amount = Number(match[1]);
        const unit = match[2].replace(/s$/, "");
        return timelineToDays(amount, unit);
      }
      return 0;
    })(),
    skills: Array.isArray(opportunity.skills) ? (opportunity.skills as string[]) : [],
    postedTime: new Date(String(opportunity.createdAt || Date.now())).toLocaleDateString(),
    matchScore: opportunity.matchScore ? Number(opportunity.matchScore) : undefined,
    proposals: ((opportunity._count as { proposals?: number })?.proposals) || (opportunity.proposalCount as number) || 0,
    category: opportunity.category ? String(opportunity.category) : undefined,
    location:
      (opportunity.customer as OpportunityCustomer)?.customerProfile?.location || "Not specified",
    clientRating: 4.5,
    projectsPosted: (opportunity.customer as OpportunityCustomer)?.customerProfile?.projectsPosted || 0,
    avatar: getProfileImageUrl((opportunity.customer as OpportunityCustomer)?.customerProfile?.profileImageUrl),
    urgent: opportunity.priority === "High",
    verified: (opportunity.customer as OpportunityCustomer)?.isVerified || false,
    hasSubmitted: (opportunity.hasProposed as boolean) || false,
    requirements:
      typeof opportunity.requirements === "string"
        ? opportunity.requirements
        : Array.isArray(opportunity.requirements)
        ? (opportunity.requirements as unknown[]).map((r: unknown) => `- ${String(r)}`).join("\n")
        : "",
    deliverables:
      typeof opportunity.deliverables === "string"
        ? opportunity.deliverables
        : Array.isArray(opportunity.deliverables)
        ? (opportunity.deliverables as unknown[]).map((d: unknown) => `- ${String(d)}`).join("\n")
        : "",
    clientInfo: {
      companySize:
        (opportunity.customer as OpportunityCustomer)?.customerProfile?.companySize || "Not specified",
      industry:
        (opportunity.customer as OpportunityCustomer)?.customerProfile?.industry || "Not specified",
      memberSince: new Date((opportunity.customer as OpportunityCustomer)?.createdAt || Date.now())
        .getFullYear()
        .toString(),
      totalSpent: (opportunity.customer as OpportunityCustomer)?.customerProfile?.totalSpend
        ? `RM ${Number(
            (opportunity.customer as OpportunityCustomer).customerProfile?.totalSpend
          ).toLocaleString()}`
        : "RM 0",
      avgRating: 4.5,
    },
    originalData: opportunity,
    // Only use aiExplanation from opportunity if useRecommendationInsights is true (for recommended tab)
    // For "All" tab, this will be null and we'll use drafts instead
    aiExplanation: useRecommendationInsights
      ? (opportunity.aiExplanation ? String(opportunity.aiExplanation) : null)
      : null,
    serviceRequestId: String(opportunity.id || ""), // ID for fetching AI drafts
  });

  // Fetch all opportunities from API
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getProviderOpportunities({
          page: 1,
          limit: 100,
          search: searchQuery,
          category: categoryFilter === "all" ? undefined : categoryFilter,
        });

        if (response.success) {
          // For "All" tab: Don't use recommendation insights, only use drafts
          let mappedOpportunities = (response.opportunities || []).map(
            (opp: Record<string, unknown>) => mapOpportunityData(opp, false) // false = don't use recommendation insights
          );

          // Fetch AiDraft summaries and merge into opportunities (this is the only source of AI insights for "All" tab)
          const serviceRequestIds = mappedOpportunities
            .map((opp: OpportunityData) => opp.serviceRequestId)
            .filter(Boolean);
          if (serviceRequestIds.length > 0) {
            try {
              const draftRes = await getServiceRequestAiDrafts(
                serviceRequestIds
              );
              if (draftRes?.success && Array.isArray(draftRes.drafts)) {
                const draftMap = new Map<string, string>(
                  (draftRes.drafts as AiDraft[]).map((d: AiDraft) => [d.referenceId, d.summary || ""])
                );
                mappedOpportunities = mappedOpportunities.map((opp: OpportunityData) => ({
                  ...opp,
                  // Only use draft summary for "All" tab
                  aiExplanation:
                    opp.serviceRequestId && draftMap.has(opp.serviceRequestId)
                      ? draftMap.get(opp.serviceRequestId) || null
                      : null,
                }));
              }
            } catch (err) {
              console.warn("Failed to fetch AI drafts for opportunities", err);
            }
          }

          setOpportunities(mappedOpportunities);
        } else {
          setError("Failed to fetch opportunities");
        }
      } catch (err) {
        console.error("Error fetching opportunities:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch opportunities"
        );
        toast.error("Failed to load opportunities");
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [searchQuery, categoryFilter]);

  // Fetch recommended opportunities
  useEffect(() => {
    const fetchRecommendedOpportunities = async () => {
      try {
        setLoadingRecommended(true);
        setErrorRecommended(null);

        const response = await getProviderRecommendedOpportunities();
        if (response.success) {
          // For "AI Recommended" tab: Use recommendation insights (aiExplanation from API), don't fetch drafts
          // Map the data but ensure aiExplanation from recommendation API is preserved
          const mappedRecommended = (response.recommendations || []).map(
            (opp: Record<string, unknown>) => {
              const mapped = mapOpportunityData(opp, true); // true = use recommendation insights
              // Explicitly preserve the aiExplanation from the recommendation API response
              return {
                ...mapped,
                aiExplanation: opp.aiExplanation ? String(opp.aiExplanation) : null, // Use aiExplanation directly from API response
              };
            }
          );
          // Don't fetch drafts for recommended opportunities - use the aiExplanation from the recommendation API
          setRecommendedOpportunities(mappedRecommended);
          setRecommendationsCacheInfo({
            cachedAt: response.cachedAt,
            nextRefreshAt: response.nextRefreshAt,
          });
        }
      } catch (err) {
        console.error("Error fetching recommended opportunities:", err);
        setErrorRecommended(
          err instanceof Error
            ? err.message
            : "Failed to fetch recommended opportunities"
        );
      } finally {
        setLoadingRecommended(false);
      }
    };

    fetchRecommendedOpportunities();
  }, []);

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 80) return "text-blue-600 bg-blue-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    return "text-gray-600 bg-gray-100";
  };
  // Keep sequences clean and sorted
  const normalizeDraftSequences = (items: Milestone[]) =>
    items
      .map((m, i) => ({ ...m, sequence: i + 1 }))
      .sort((a, b) => a.sequence - b.sequence);

  const addProposalMilestone = () => {
    setProposalData((prev) => ({
      ...prev,
      milestones: normalizeDraftSequences([
        ...prev.milestones,
        {
          sequence: prev.milestones.length + 1,
          title: "",
          description: "",
          amount: 0,
          dueDate: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
        },
      ]),
    }));
  };

  const updateProposalMilestone = (i: number, patch: Partial<Milestone>) => {
    setProposalData((prev) => ({
      ...prev,
      milestones: normalizeDraftSequences(
        prev.milestones.map((m, idx) => (idx === i ? { ...m, ...patch } : m))
      ),
    }));
  };

  const removeProposalMilestone = (i: number) => {
    setProposalData((prev) => ({
      ...prev,
      milestones: normalizeDraftSequences(
        prev.milestones.filter((_, idx) => idx !== i)
      ),
    }));
  };

  const filteredOpportunities = opportunities.filter((opportunity) => {
    const matchesSearch =
      opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opportunity.skills.some((skill: string) =>
        skill.toLowerCase().includes(searchQuery.toLowerCase())
      );

    let matchesCategory = true;
    if (categoryFilter === "submitted") {
      matchesCategory = opportunity.hasSubmitted;
    } else if (categoryFilter === "not-submitted") {
      matchesCategory = !opportunity.hasSubmitted;
    } else if (categoryFilter !== "all") {
      matchesCategory = opportunity.category
        ? opportunity.category.toLowerCase().includes(categoryFilter.toLowerCase())
        : false;
    }

    return matchesSearch && matchesCategory;
  });

  const handleSubmitProposal = (opportunity: OpportunityData) => {
    setSelectedProject(opportunity);
    setIsProposalModalOpen(true);
    setProposalData({
      coverLetter: "",
      bidAmount: "",
      timelineAmount: "",
      timelineUnit: "",
      milestones: [],
      attachments: [],
    });
  };
  // --- Proposal validation helpers ---
  // --- Proposal validation ---
  function validateProposal(form: ProposalFormData) {
    const newErrors: {
      bidAmount?: string;
      timelineAmount?: string;
      timelineUnit?: string;
      coverLetter?: string;
      milestones?: string;
      milestoneFields?: Record<
        number,
        {
          title?: string;
          description?: string;
          amount?: string;
          dueDate?: string;
        }
      >;
    } = {};

    const messages: string[] = [];

    // Bid amount: required, >0, and within budget range
    const bidAmountNum = Number(form.bidAmount);
    if (!form.bidAmount) {
      newErrors.bidAmount = "Bid amount is required.";
      messages.push("Bid amount is required.");
    } else if (isNaN(bidAmountNum) || bidAmountNum <= 0) {
      newErrors.bidAmount = "Bid amount must be a positive number.";
      messages.push("Bid amount must be a positive number.");
    } else if (selectedProject) {
      const budgetMin = selectedProject.budgetMin || 0;
      const budgetMax = selectedProject.budgetMax || 0;
      if (bidAmountNum < budgetMin || bidAmountNum > budgetMax) {
        newErrors.bidAmount = `Bid amount must be between RM ${budgetMin.toLocaleString()} and RM ${budgetMax.toLocaleString()}.`;
        messages.push(
          `Bid amount must be within the budget range (RM ${budgetMin.toLocaleString()} - RM ${budgetMax.toLocaleString()}).`
        );
      }
    }

    // Timeline: required, and must be <= original timeline
    const timelineAmountNum = Number(form.timelineAmount);
    if (!form.timelineAmount) {
      newErrors.timelineAmount = "Timeline amount is required.";
      messages.push("Timeline amount is required.");
    } else if (isNaN(timelineAmountNum) || timelineAmountNum <= 0) {
      newErrors.timelineAmount = "Timeline amount must be greater than 0.";
      messages.push("Timeline amount must be greater than 0.");
    }

    if (!form.timelineUnit) {
      newErrors.timelineUnit = "Timeline unit is required.";
      messages.push("Timeline unit is required.");
    } else if (selectedProject && selectedProject.originalTimelineInDays > 0) {
      // Check if provider timeline is <= original timeline
      const providerTimelineInDays = timelineToDays(
        timelineAmountNum,
        form.timelineUnit
      );
      if (providerTimelineInDays > selectedProject.originalTimelineInDays) {
        const originalTimelineDisplay =
          formatTimeline(selectedProject.originalTimeline) ||
          `${selectedProject.originalTimelineInDays} days`;
        newErrors.timelineAmount = `Your timeline must be equal to or less than the company's timeline (${originalTimelineDisplay}).`;
        messages.push(
          `Your timeline must be equal to or less than the company's timeline (${originalTimelineDisplay}).`
        );
      }
    }

    // Cover letter: required, min length 20
    if (!form.coverLetter || form.coverLetter.trim().length < 20) {
      newErrors.coverLetter = "Cover letter must be at least 20 characters.";
      messages.push("Cover letter must be at least 20 characters.");
    }

    // Milestones validation (REQUIRED)
    const milestoneFieldErrors: Record<
      number,
      {
        title?: string;
        description?: string;
        amount?: string;
        dueDate?: string;
      }
    > = {};

    if (form.milestones.length === 0) {
      newErrors.milestones = "At least one milestone is required.";
      messages.push("At least one milestone is required.");
    } else {
      // each milestone needs title, description, amount>0, dueDate
      form.milestones.forEach((m: Milestone, idx: number) => {
        milestoneFieldErrors[idx] = {};

        if (!m.title || !m.title.trim()) {
          const errorMsg = "Title is required.";
          milestoneFieldErrors[idx].title = errorMsg;
          messages.push(`Milestone #${idx + 1}: title is required.`);
        }
        if (!m.description || !m.description.trim()) {
          const errorMsg = "Description is required.";
          milestoneFieldErrors[idx].description = errorMsg;
          messages.push(`Milestone #${idx + 1}: description is required.`);
        }
        if (
          m.amount == null ||
          isNaN(Number(m.amount)) ||
          Number(m.amount) <= 0
        ) {
          const errorMsg = "Amount must be greater than 0.";
          milestoneFieldErrors[idx].amount = errorMsg;
          messages.push(`Milestone #${idx + 1}: amount must be > 0.`);
        }
        if (!m.dueDate) {
          const errorMsg = "Due date is required.";
          milestoneFieldErrors[idx].dueDate = errorMsg;
          messages.push(`Milestone #${idx + 1}: due date is required.`);
        } else {
          // Validate that due date is not in the past (must be today or future)
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(m.dueDate);
          dueDate.setHours(0, 0, 0, 0);

          if (dueDate < today) {
            const errorMsg =
              "Due date cannot be in the past. Please select today or a future date.";
            milestoneFieldErrors[idx].dueDate = errorMsg;
            messages.push(
              `Milestone #${
                idx + 1
              }: due date cannot be in the past. Please select today or a future date.`
            );
          }
        }
      });

      // Only add milestoneFieldErrors if there are any errors
      if (Object.keys(milestoneFieldErrors).length > 0) {
        newErrors.milestoneFields = milestoneFieldErrors;
      }

      // sum rule: milestones total must equal bidAmount
      if (!isNaN(bidAmountNum) && bidAmountNum > 0) {
        const sumMilestones = form.milestones.reduce(
          (sum: number, m: Milestone) => {
            const val = Number(m.amount);
            if (!isNaN(val)) return sum + val;
            return sum;
          },
          0
        );

        if (sumMilestones !== bidAmountNum) {
          const msg = `Total of milestones (RM ${sumMilestones}) must equal your bid amount (RM ${bidAmountNum}).`;
          newErrors.milestones = msg;
          messages.push(msg);
        }
      }
    }

    return { fieldErrors: newErrors, messages };
  }

  const handleProposalSubmit = async () => {
    // 1. run validation
    const { fieldErrors, messages } = validateProposal(proposalData);

    // save inline field errors to state (like customer form does with setErrors) :contentReference[oaicite:2]{index=2}
    setProposalErrors(fieldErrors);

    // if there are validation problems, stop here and toast
    if (messages.length > 0) {
      toast.error(messages.map((m) => `• ${m}`).join("\n"));
      return;
    }

    // 2. make sure we have selectedProject data
    if (!selectedProject?.originalData) {
      toast.error("Invalid project data");
      return;
    }

    // 3. attachments validation (same as before)
    if (proposalData.attachments.length > MAX_FILES) {
      toast.error("You can only upload up to 3 attachments");
      return;
    }
    for (const file of proposalData.attachments) {
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`"${file.name}" is larger than 10 MB`);
        return;
      }
    }

    try {
      setSubmittingProposal(true);

      // Normalize milestones for the backend
      const normalized = normalizeDraftSequences(proposalData.milestones).map(
        (m: Milestone, idx: number) => ({
          sequence: idx + 1,
          title: (m.title || "").trim(),
          description: m.description || "",
          amount: Number(m.amount || 0),
          dueDate: m.dueDate
            ? new Date(m.dueDate).toISOString()
            : new Date().toISOString(),
        })
      );

      // Build multipart/form-data
      const formDataToSend = new FormData();

      formDataToSend.append(
        "serviceRequestId",
        String(selectedProject.originalData.id || "")
      );

      formDataToSend.append(
        "bidAmount",
        parseFloat(proposalData.bidAmount).toString()
      );

      // Build timeline data from amount and unit
      const { timeline, timelineInDays } = buildTimelineData(
        Number(proposalData.timelineAmount),
        proposalData.timelineUnit
      );

      formDataToSend.append("deliveryTime", timelineInDays.toString());
      formDataToSend.append("timeline", timeline);
      formDataToSend.append("timelineInDays", timelineInDays.toString());

      formDataToSend.append("coverLetter", proposalData.coverLetter);

      normalized.forEach((m, idx) => {
        formDataToSend.append(
          `milestones[${idx}][sequence]`,
          String(m.sequence)
        );
        formDataToSend.append(`milestones[${idx}][title]`, m.title);
        formDataToSend.append(`milestones[${idx}][description]`, m.description);
        formDataToSend.append(
          `milestones[${idx}][amount]`,
          m.amount != null ? String(m.amount) : "0"
        );
        formDataToSend.append(`milestones[${idx}][dueDate]`, m.dueDate);
      });

      proposalData.attachments.forEach((file) => {
        formDataToSend.append("attachments", file);
      });

      const response = await sendProposal(formDataToSend);

      if (response.success) {
        toast.success("Proposal submitted successfully!");
        setIsProposalModalOpen(false);

        // optimistic UI
        const updatedOpportunities = opportunities.map((opp) =>
          opp.id === selectedProject?.id
            ? {
                ...opp,
                hasSubmitted: true,
                proposals: opp.proposals + 1,
              }
            : opp
        );
        setOpportunities(updatedOpportunities);

        // reset form + errors
        setProposalData({
          coverLetter: "",
          bidAmount: "",
          timelineAmount: "",
          timelineUnit: "",
          milestones: [],
          attachments: [],
        });
        setProposalErrors({});
      } else {
        toast.error(response.message || "Failed to submit proposal");
      }
    } catch (err) {
      console.error("Error submitting proposal:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to submit proposal"
      );
    } finally {
      setSubmittingProposal(false);
    }
  };

  const MAX_FILES = 3;
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(event.target.files || []);

    if (incoming.length === 0) return;

    // --- Reset previous attachment errors ---
    setProposalErrors((prev) => ({ ...prev, attachments: undefined }));

    // --- Check file sizes ---
    for (const file of incoming) {
      if (file.size > MAX_SIZE_BYTES) {
        toast.error(`"${file.name}" is larger than 10 MB`);
        setProposalErrors((prev) => ({
          ...prev,
          attachments: `"${file.name}" exceeds 10 MB.`,
        }));
        event.target.value = "";
        return;
      }
    }

    setProposalData((prev) => {
      const combined = [...prev.attachments, ...incoming];

      // --- File count validation ---
      if (combined.length > MAX_FILES) {
        const errorMsg = `You can upload a maximum of ${MAX_FILES} files only. Remove some before adding new ones.`;
        toast.error(errorMsg);
        setProposalErrors((prev) => ({ ...prev, attachments: errorMsg }));
        event.target.value = "";
        return prev; // stop update
      }

      return {
        ...prev,
        attachments: combined,
      };
    });

    // reset input
    event.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setProposalData((prev) => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  return (
    <ProviderLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Job Opportunities
            </h1>
            <p className="text-gray-600">
              Discover projects that match your skills and expertise
            </p>
          </div>
          {/* <div className="flex gap-3">
            <Button>
              <Zap className="w-4 h-4 mr-2" />
              AI Recommendations
            </Button>
          </div> */}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search opportunities by title, client, or skills..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="submitted">Already Submitted</SelectItem>
                  <SelectItem value="not-submitted">Not Submitted</SelectItem>
                  <SelectItem value="web">Web Development</SelectItem>
                  <SelectItem value="mobile">Mobile Development</SelectItem>
                  <SelectItem value="cloud">Cloud Services</SelectItem>
                  <SelectItem value="iot">IoT Solutions</SelectItem>
                  <SelectItem value="data">Data Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities */}
        {loading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Loading opportunities...
              </h3>
              <p className="text-gray-600">
                Please wait while we fetch available opportunities.
              </p>
            </CardContent>
          </Card>
        ) : error ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 text-xl">⚠️</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Error loading opportunities
              </h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="recommended">AI Recommended</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-6">
              {filteredOpportunities.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No opportunities found
                    </h3>
                    <p className="text-gray-600">
                      {searchQuery || categoryFilter !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "There are no opportunities available at the moment."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredOpportunities.map((opportunity) => {
                  const isExpanded = expandedOpportunityId === opportunity.id;
                  return (
                    <Card
                      key={opportunity.id}
                      className="group relative hover:shadow-lg transition-shadow"
                    >
                      {/* AI Badge Indicator */}
                      {opportunity.aiExplanation && (
                        <div className="absolute top-3 right-3 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                          <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-medium shadow-md">
                            <Sparkles className="w-3 h-3" />
                            <span className="hidden sm:inline">
                              AI Insights
                            </span>
                          </div>
                        </div>
                      )}
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1 pr-0 sm:pr-20">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">
                                {opportunity.title}
                              </CardTitle>
                              {opportunity.urgent && (
                                <Badge className="bg-red-100 text-red-800">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Urgent
                                </Badge>
                              )}
                              {opportunity.verified && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Verified Client
                                </Badge>
                              )}
                              {opportunity.hasSubmitted && (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Submitted
                                </Badge>
                              )}
                            </div>
                            <CardDescription className="text-base line-clamp-3">
                              {opportunity.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage
                                src={
                                  opportunity.avatar &&
                                  opportunity.avatar !==
                                    "/placeholder.svg?height=40&width=40" &&
                                  !opportunity.avatar.includes(
                                    "/placeholder.svg"
                                  )
                                    ? opportunity.avatar
                                    : "/placeholder.svg"
                                }
                              />
                              <AvatarFallback>
                                {opportunity.client.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              {opportunity.clientId ? (
                                <Link
                                  href={`/provider/companies/${opportunity.clientId}`}
                                  className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {opportunity.client}
                                </Link>
                              ) : (
                                <p className="font-medium">
                                  {opportunity.client}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <span className="text-yellow-400">★</span>
                                  <span className="ml-1">
                                    {opportunity.clientRating}
                                  </span>
                                </div>
                                <span>•</span>
                                <span>
                                  {opportunity.projectsPosted} projects posted
                                </span>
                                <span>•</span>
                                <div className="flex items-center">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {opportunity.location}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center text-green-600 font-semibold">
                              <DollarSign className="w-4 h-4 mr-1" />
                              {opportunity.budget}
                            </div>
                            <p className="text-sm text-gray-500">
                              {formatTimeline(opportunity.timeline)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {opportunity.skills.map((skill: string) => (
                            <Badge
                              key={skill}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>

                        {/* AI Explanation - Responsive: Hover on desktop, Click on mobile */}
                        {opportunity.aiExplanation && (
                          <div className="overflow-hidden">
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
                                    About this opportunity:
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
                                      const cleanLine = line
                                        .replace(/^[•\-\*]\s*/, "")
                                        .trim();
                                      const isWarning =
                                        cleanLine.includes("⚠️") ||
                                        cleanLine.includes("Warning");
                                      return cleanLine ? (
                                        <div
                                          key={index}
                                          className={`flex items-start gap-2 sm:gap-3 ${
                                            isWarning
                                              ? "bg-red-50 p-2 rounded border border-red-200"
                                              : ""
                                          }`}
                                        >
                                          <span
                                            className={`mt-0.5 font-bold flex-shrink-0 ${
                                              isWarning
                                                ? "text-red-600"
                                                : "text-blue-600"
                                            }`}
                                          >
                                            •
                                          </span>
                                          <span
                                            className={`leading-relaxed break-words ${
                                              isWarning
                                                ? "text-red-800 font-medium"
                                                : ""
                                            }`}
                                          >
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

                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{opportunity.postedTime}</span>
                            <div className="flex items-center">
                              <Users className="w-4 h-4 mr-1" />
                              {opportunity.proposals} proposals
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Link
                              href={`/provider/opportunities/${opportunity.id}`}
                            >
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                            </Link>
                            {opportunity.hasSubmitted ? (
                              <Button size="sm" disabled>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Submitted
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSubmitProposal(opportunity)
                                }
                              >
                                <ThumbsUp className="w-4 h-4 mr-2" />
                                Submit Proposal
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="recommended" className="space-y-6">
              {loadingRecommended ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Loading recommended opportunities...
                    </h3>
                    <p className="text-gray-600">
                      Please wait while we fetch AI-matched opportunities.
                    </p>
                  </CardContent>
                </Card>
              ) : errorRecommended ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                      <span className="text-red-600 text-xl">⚠️</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Error loading recommendations
                    </h3>
                    <p className="text-gray-600 mb-4">{errorRecommended}</p>
                    <Button
                      onClick={() => window.location.reload()}
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </CardContent>
                </Card>
              ) : recommendedOpportunities.length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      No recommended opportunities found
                    </h3>
                    <p className="text-gray-600">
                      Check back later for AI-matched opportunities based on
                      your skills and preferences.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {recommendationsCacheInfo.cachedAt &&
                    recommendationsCacheInfo.nextRefreshAt && (
                      <div className="text-xs text-gray-500 mb-4">
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
                  <div className="space-y-3 sm:space-y-4">
                    {recommendedOpportunities.map((opportunity: OpportunityData) => {
                      const isExpanded =
                        expandedOpportunityId === opportunity.id;
                      return (
                        <Card
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

                          <CardHeader className="p-0 pb-3 sm:pb-4">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-3 pr-0 sm:pr-20">
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2 flex-wrap">
                                  <CardTitle className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-base sm:text-lg break-words">
                                    {opportunity.title}
                                  </CardTitle>
                                  {opportunity.matchScore !== undefined && (
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
                                <CardDescription className="text-xs sm:text-sm font-medium text-gray-700 mt-1">
                                  {opportunity.budget}
                                </CardDescription>
                                {opportunity.client && (
                                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                                    <p className="text-xs text-gray-600">
                                      {opportunity.client}
                                    </p>
                                    {opportunity.verified && (
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
                          </CardHeader>

                          <CardContent className="p-0 space-y-3 sm:space-y-4">
                            <div className="flex flex-wrap gap-1.5">
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
                                  {opportunity.category}
                                </span>
                                {opportunity.timeline && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3 shrink-0" />
                                    <span className="break-words">
                                      {opportunity.timeline}
                                    </span>
                                  </span>
                                )}
                                {opportunity.proposals !== undefined && (
                                  <span className="whitespace-nowrap">
                                    {opportunity.proposals} proposal
                                    {opportunity.proposals !== 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2 w-full sm:w-auto">
                                <Link
                                  href={`/provider/opportunities/${opportunity.id}`}
                                  className="flex-1 sm:flex-none"
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full sm:w-auto"
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                  </Button>
                                </Link>
                                {opportunity.hasSubmitted ? (
                                  <Button
                                    size="sm"
                                    disabled
                                    className="flex-1 sm:flex-none"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Submitted
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSubmitProposal(opportunity)
                                    }
                                    className="flex-1 sm:flex-none group-hover:bg-blue-600 group-hover:text-white transition-all duration-300"
                                  >
                                    <ThumbsUp className="w-4 h-4 mr-2" />
                                    Submit Proposal
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Project Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {selectedProject?.title}
              </DialogTitle>
              <DialogDescription className="text-base">
                Posted by {selectedProject?.client} •{" "}
                {selectedProject?.postedTime}
              </DialogDescription>
            </DialogHeader>

            {selectedProject && (
              <div className="space-y-6">
                {/* Project Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Project Description
                      </h3>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedProject.fullDescription}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Requirements
                      </h3>
                      <MarkdownViewer
                        content={selectedProject.requirements}
                        emptyMessage="No requirements specified."
                        className="text-gray-700"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        Deliverables
                      </h3>
                      <MarkdownViewer
                        content={selectedProject.deliverables}
                        emptyMessage="No deliverables specified."
                        className="text-gray-700"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Project Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Budget:</span>
                          <span className="font-semibold text-green-600">
                            {selectedProject.budget}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Timeline:</span>
                          <span className="font-semibold">
                            {formatTimeline(selectedProject?.timeline)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Proposals:</span>
                          <span className="font-semibold">
                            {selectedProject.proposals}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-semibold">
                            {selectedProject.location}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Match Score:</span>
                          <Badge
                            className={getMatchScoreColor(
                              selectedProject.matchScore || 0
                            )}
                          >
                            {selectedProject.matchScore || 0}%
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Client Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage
                              src={
                                selectedProject.avatar &&
                                selectedProject.avatar !==
                                  "/placeholder.svg?height=40&width=40" &&
                                !selectedProject.avatar.includes(
                                  "/placeholder.svg"
                                )
                                  ? selectedProject.avatar
                                  : "/placeholder.svg"
                              }
                            />
                            <AvatarFallback>
                              {selectedProject.client.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold">
                              {selectedProject.client}
                            </p>
                            <div className="flex items-center text-sm text-gray-500">
                              <Star className="w-3 h-3 text-yellow-400 mr-1" />
                              {selectedProject.clientRating} (
                              {selectedProject.projectsPosted} projects)
                            </div>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Company Size:</span>
                            <span>
                              {selectedProject.clientInfo?.companySize}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Industry:</span>
                            <span>{selectedProject.clientInfo?.industry}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Member Since:</span>
                            <span>
                              {selectedProject.clientInfo?.memberSince}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Spent:</span>
                            <span className="text-green-600 font-semibold">
                              {selectedProject.clientInfo?.totalSpent || "RM 0"}
                            </span>
                          </div>
                        </div>
                        {selectedProject.clientId && (
                          <div className="pt-2">
                            <Link
                              href={`/provider/companies/${selectedProject.clientId}`}
                            >
                              <Button variant="outline" className="w-full">
                                <Eye className="w-4 h-4 mr-2" />
                                View Company
                              </Button>
                            </Link>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Skills Required */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    Skills Required
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.skills.map((skill: string) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-sm px-3 py-1"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDetailsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  if (selectedProject) {
                    handleSubmitProposal(selectedProject);
                  }
                }}
                disabled={selectedProject?.hasSubmitted}
              >
                {selectedProject?.hasSubmitted
                  ? "Already Submitted"
                  : "Submit Proposal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Proposal Submission Modal */}
        <Dialog
          open={isProposalModalOpen}
          onOpenChange={setIsProposalModalOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Submit Proposal</DialogTitle>
              <DialogDescription>
                Submit your proposal for &quot;{selectedProject?.title}&quot;
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Bid Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bidAmount">Your Bid Amount (RM) *</Label>
                  <Input
                    id="bidAmount"
                    type="number"
                    placeholder="15000"
                    value={proposalData.bidAmount}
                    onChange={(e) =>
                      setProposalData((prev) => ({
                        ...prev,
                        bidAmount: e.target.value,
                      }))
                    }
                    className={
                      proposalErrors.bidAmount
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {proposalErrors.bidAmount && (
                    <p className="text-xs text-red-600">
                      {proposalErrors.bidAmount}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Client budget range: RM{" "}
                    {selectedProject?.budgetMin?.toLocaleString() || "0"} - RM{" "}
                    {selectedProject?.budgetMax?.toLocaleString() || "0"}
                  </p>
                </div>
                <div>
                  <Label htmlFor="timeline">Delivery Timeline *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="timelineAmount"
                      type="number"
                      placeholder="e.g. 2"
                      min="1"
                      value={proposalData.timelineAmount}
                      onChange={(e) =>
                        setProposalData((prev) => ({
                          ...prev,
                          timelineAmount: e.target.value,
                        }))
                      }
                      className={
                        proposalErrors.timelineAmount
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
                      }
                    />
                    <Select
                      value={proposalData.timelineUnit}
                      onValueChange={(value: "day" | "week" | "month") =>
                        setProposalData((prev) => ({
                          ...prev,
                          timelineUnit: value,
                        }))
                      }
                    >
                      <SelectTrigger
                        className={
                          proposalErrors.timelineUnit
                            ? "border-red-500 focus:ring-red-500"
                            : ""
                        }
                      >
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day(s)</SelectItem>
                        <SelectItem value="week">Week(s)</SelectItem>
                        <SelectItem value="month">Month(s)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {proposalErrors.timelineAmount && (
                    <p className="text-xs text-red-600 mt-1">
                      {proposalErrors.timelineAmount}
                    </p>
                  )}
                  {proposalErrors.timelineUnit && (
                    <p className="text-xs text-red-600 mt-1">
                      {proposalErrors.timelineUnit}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Company timeline:{" "}
                    {selectedProject?.originalTimeline
                      ? formatTimeline(selectedProject.originalTimeline)
                      : "Not specified"}
                  </p>
                  {proposalData.timelineAmount && proposalData.timelineUnit && (
                    <p className="text-xs text-gray-500 mt-1">
                      Your timeline:{" "}
                      {formatTimeline(
                        proposalData.timelineAmount,
                        proposalData.timelineUnit
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Cover Letter */}
              <div>
                <Label htmlFor="coverLetter">Cover Letter *</Label>
                <Textarea
                  id="coverLetter"
                  placeholder="Introduce yourself and explain why you're the best fit for this project..."
                  className={`min-h-[120px] ${
                    proposalErrors.coverLetter
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                  value={proposalData.coverLetter}
                  onChange={(e) =>
                    setProposalData((prev) => ({
                      ...prev,
                      coverLetter: e.target.value,
                    }))
                  }
                />
                {proposalErrors.coverLetter && (
                  <p className="text-xs text-red-600">
                    {proposalErrors.coverLetter}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {proposalData.coverLetter.length}/1000 characters
                </p>
              </div>

              {/* Project Milestones (Required) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>
                    Project Milestones <span className="text-red-500">*</span>
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addProposalMilestone}
                  >
                    + Add Milestone
                  </Button>
                </div>

                {proposalData.milestones.length === 0 && (
                  <p
                    className={`text-sm ${
                      proposalErrors.milestones
                        ? "text-red-600 font-medium"
                        : "text-gray-500"
                    }`}
                  >
                    {proposalErrors.milestones ||
                      "At least one milestone is required. Click 'Add Milestone' to get started."}
                  </p>
                )}

                <div className="space-y-3">
                  {proposalData.milestones.map((m, i) => (
                    <Card key={i}>
                      <CardContent className="p-4 space-y-3">
                        <div className="grid md:grid-cols-12 gap-3">
                          <div className="md:col-span-1">
                            <label className="text-sm font-medium">Seq</label>
                            <Input type="number" value={i + 1} disabled />
                          </div>
                          <div className="md:col-span-4">
                            <label className="text-sm font-medium">
                              Title <span className="text-red-500">*</span>
                            </label>
                            <Input
                              value={m.title}
                              onChange={(e) => {
                                updateProposalMilestone(i, {
                                  title: e.target.value,
                                });
                                // Clear error when user starts typing
                                if (
                                  proposalErrors.milestoneFields?.[i]?.title
                                ) {
                                  setProposalErrors((prev) => ({
                                    ...prev,
                                    milestoneFields: {
                                      ...prev.milestoneFields,
                                      [i]: {
                                        ...prev.milestoneFields?.[i],
                                        title: undefined,
                                      },
                                    },
                                  }));
                                }
                              }}
                              placeholder="Milestone title (required)"
                              className={
                                proposalErrors.milestoneFields?.[i]?.title
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : ""
                              }
                            />
                            {proposalErrors.milestoneFields?.[i]?.title && (
                              <p className="text-xs text-red-600 mt-1">
                                {proposalErrors.milestoneFields[i].title}
                              </p>
                            )}
                          </div>
                          <div className="md:col-span-3">
                            <label className="text-sm font-medium">
                              Amount (RM)
                            </label>
                            <Input
                              type="number"
                              value={String(m.amount ?? 0)}
                              onChange={(e) => {
                                updateProposalMilestone(i, {
                                  amount: Number(e.target.value),
                                });
                                // Clear error when user starts typing
                                if (
                                  proposalErrors.milestoneFields?.[i]?.amount
                                ) {
                                  setProposalErrors((prev) => ({
                                    ...prev,
                                    milestoneFields: {
                                      ...prev.milestoneFields,
                                      [i]: {
                                        ...prev.milestoneFields?.[i],
                                        amount: undefined,
                                      },
                                    },
                                  }));
                                }
                              }}
                              className={
                                proposalErrors.milestoneFields?.[i]?.amount
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : ""
                              }
                            />
                            {proposalErrors.milestoneFields?.[i]?.amount && (
                              <p className="text-xs text-red-600 mt-1">
                                {proposalErrors.milestoneFields[i].amount}
                              </p>
                            )}
                          </div>
                          <div className="md:col-span-4">
                            <label className="text-sm font-medium">
                              Due Date <span className="text-red-500">*</span>
                            </label>
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
                                  toast.error(
                                    "Due date cannot be in the past. Please select today or a future date."
                                  );
                                  return;
                                }
                                updateProposalMilestone(i, {
                                  dueDate: selectedDate,
                                });
                                // Clear error when user selects a date
                                if (
                                  proposalErrors.milestoneFields?.[i]?.dueDate
                                ) {
                                  setProposalErrors((prev) => ({
                                    ...prev,
                                    milestoneFields: {
                                      ...prev.milestoneFields,
                                      [i]: {
                                        ...prev.milestoneFields?.[i],
                                        dueDate: undefined,
                                      },
                                    },
                                  }));
                                }
                              }}
                              className={
                                proposalErrors.milestoneFields?.[i]?.dueDate
                                  ? "border-red-500 focus-visible:ring-red-500"
                                  : ""
                              }
                            />
                            {proposalErrors.milestoneFields?.[i]?.dueDate && (
                              <p className="text-xs text-red-600 mt-1">
                                {proposalErrors.milestoneFields[i].dueDate}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium">
                            Description <span className="text-red-500">*</span>
                          </label>
                          <Textarea
                            rows={2}
                            value={m.description || ""}
                            onChange={(e) => {
                              updateProposalMilestone(i, {
                                description: e.target.value,
                              });
                              // Clear error when user starts typing
                              if (
                                proposalErrors.milestoneFields?.[i]?.description
                              ) {
                                setProposalErrors((prev) => ({
                                  ...prev,
                                  milestoneFields: {
                                    ...prev.milestoneFields,
                                    [i]: {
                                      ...prev.milestoneFields?.[i],
                                      description: undefined,
                                    },
                                  },
                                }));
                              }
                            }}
                            placeholder="Milestone description (required)"
                            className={
                              proposalErrors.milestoneFields?.[i]?.description
                                ? "border-red-500 focus-visible:ring-red-500"
                                : ""
                            }
                          />
                          {proposalErrors.milestoneFields?.[i]?.description && (
                            <p className="text-xs text-red-600 mt-1">
                              {proposalErrors.milestoneFields[i].description}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeProposalMilestone(i)}
                          >
                            Remove
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {/* Milestones total check */}
                {proposalData.milestones.length > 0 && (
                  <div className="mt-4 rounded-md border p-3 text-sm">
                    {(() => {
                      const bidAmountNum = Number(proposalData.bidAmount || 0);
                      const sumMilestones = proposalData.milestones.reduce(
                        (sum, m) => {
                          const val = Number(m.amount);
                          if (!isNaN(val)) return sum + val;
                          return sum;
                        },
                        0
                      );

                      const match =
                        bidAmountNum > 0 && sumMilestones === bidAmountNum;

                      return (
                        <div className="flex justify-between flex-wrap gap-2">
                          <div>
                            <div className="font-medium">
                              Milestones total: RM {sumMilestones || 0}
                            </div>
                            <div>Your bid: RM {bidAmountNum || 0}</div>
                          </div>
                          <div
                            className={
                              "text-xs font-semibold " +
                              (match ? "text-green-600" : "text-red-600")
                            }
                          >
                            {match
                              ? "Total matches bid ✅"
                              : "Total does not match bid ❗"}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                {proposalErrors.milestones && (
                  <p className="text-xs text-red-600 mt-1">
                    {proposalErrors.milestones}
                  </p>
                )}
              </div>

              {/* File Attachments */}
              <div>
                <Label>Attachments (Optional)</Label>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center ${
                    proposalErrors.attachments
                      ? "border-red-500 bg-red-50"
                      : "border-gray-300"
                  }`}
                >
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Paperclip className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload portfolio, resume, or relevant documents
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB each)
                    </p>
                  </label>
                </div>

                {/* Uploaded Files */}
                {proposalData.attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {proposalData.attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <span className="text-sm text-gray-700">
                          {file.name}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                {proposalErrors.attachments && (
                  <p className="text-xs text-red-600 mt-2">
                    {proposalErrors.attachments}
                  </p>
                )}
              </div>

              {/* Proposal Summary */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">Proposal Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Your Bid:</span>
                      <span className="font-semibold">
                        RM {proposalData.bidAmount || "0"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Timeline:</span>
                      <span>
                        {formatTimeline(
                          proposalData.timelineAmount,
                          proposalData.timelineUnit
                        ) || "Not specified"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Attachments:</span>
                      <span>{proposalData.attachments.length} files</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsProposalModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleProposalSubmit}
                disabled={submittingProposal}
              >
                {submittingProposal ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {submittingProposal ? "Submitting..." : "Submit Proposal"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProviderLayout>
  );
}
