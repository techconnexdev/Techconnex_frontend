"use client";

import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  MapPin,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  Send,
  Paperclip,
  ThumbsUp,
  Eye,
} from "lucide-react";
import { ProviderLayout } from "@/components/provider-layout";
import {
  getProviderOpportunityById,
  sendProposal,
} from "@/lib/api";
import { formatTimeline, buildTimelineData, timelineToDays } from "@/lib/timeline-utils";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";

type Milestone = {
  sequence: number;
  title: string;
  description?: string;
  amount: number;
  dueDate: string; // ISO (yyyy-mm-dd)
};

type ProposalFormData = {
  coverLetter: string;
  bidAmount: string;
  timelineAmount: string;
  timelineUnit: "day" | "week" | "month" | "";
  milestones: Milestone[];
  attachments: File[];
};

type OpportunityMilestone = {
  id?: string;
  order?: number;
  title: string;
  description?: string;
  amount?: number;
  dueDate?: string;
};

type OpportunityCustomer = {
  id?: string;
  name?: string;
  email?: string;
  customerProfile?: {
    profileImageUrl?: string;
    location?: string;
    website?: string;
    industry?: string;
    companySize?: string;
    projectsPosted?: number;
  };
};

type Opportunity = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  timeline?: string;
  priority?: string;
  skills?: string[];
  requirements?: string | string[];
  deliverables?: string | string[];
  milestones?: OpportunityMilestone[];
  customer?: OpportunityCustomer;
  hasProposed?: boolean;
  createdAt: string;
  _count?: {
    proposals?: number;
  };
};

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const opportunityId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  const [proposalData, setProposalData] = useState<ProposalFormData>({
    coverLetter: "",
    bidAmount: "",
    timelineAmount: "",
    timelineUnit: "",
    milestones: [],
    attachments: [],
  });

  const [proposalErrors, setProposalErrors] = useState<{
    bidAmount?: string;
    timelineAmount?: string;
    timelineUnit?: string;
    coverLetter?: string;
    milestones?: string;
    attachments?: string;
    milestoneFields?: Record<number, {
      title?: string;
      description?: string;
      amount?: string;
      dueDate?: string;
    }>;
  }>({});

  const MAX_FILES = 3;
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

  const loadOpportunity = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProviderOpportunityById(opportunityId);
      if (response.success) {
        setOpportunity(response.opportunity);
      } else {
        setError("Failed to load opportunity");
      }
    } catch (err: unknown) {
      console.error("Error loading opportunity:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to load opportunity";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (opportunityId) {
      loadOpportunity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

  // Keep sequences clean and sorted
  const normalizeDraftSequences = (items: Milestone[]) =>
    items
      .map((m, i) => ({ ...m, sequence: i + 1 }))
      .sort((a, b) => a.sequence - b.sequence);

  const addMilestone = () => {
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

  const updateMilestone = (index: number, patch: Partial<Milestone>) => {
    setProposalData((prev) => ({
      ...prev,
      milestones: normalizeDraftSequences(
        prev.milestones.map((m, i) => (i === index ? { ...m, ...patch } : m))
      ),
    }));
  };

  const removeMilestone = (index: number) => {
    setProposalData((prev) => ({
      ...prev,
      milestones: normalizeDraftSequences(
        prev.milestones.filter((_, i) => i !== index)
      ),
    }));
  };

  function validateProposal(form: ProposalFormData) {
    const newErrors: {
      bidAmount?: string;
      timelineAmount?: string;
      timelineUnit?: string;
      coverLetter?: string;
      milestones?: string;
      milestoneFields?: Record<number, {
        title?: string;
        description?: string;
        amount?: string;
        dueDate?: string;
      }>;
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
    } else if (opportunity) {
      const budgetMin = opportunity.budgetMin || 0;
      const budgetMax = opportunity.budgetMax || 0;
      if (bidAmountNum < budgetMin || bidAmountNum > budgetMax) {
        newErrors.bidAmount = `Bid amount must be between RM ${budgetMin.toLocaleString()} and RM ${budgetMax.toLocaleString()}.`;
        messages.push(`Bid amount must be within the budget range (RM ${budgetMin.toLocaleString()} - RM ${budgetMax.toLocaleString()}).`);
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
    } else if (opportunity && opportunity.timeline) {
      // Parse original timeline to days
      const timelineStr = opportunity.timeline.toLowerCase().trim();
      const match = timelineStr.match(/^(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)$/);
      if (match) {
        const amount = Number(match[1]);
        const unit = match[2].replace(/s$/, "");
        const originalTimelineInDays = timelineToDays(amount, unit);
        const providerTimelineInDays = timelineToDays(timelineAmountNum, form.timelineUnit);
        if (providerTimelineInDays > originalTimelineInDays) {
          const originalTimelineDisplay = formatTimeline(opportunity.timeline) || `${originalTimelineInDays} days`;
          newErrors.timelineAmount = `Your timeline must be equal to or less than the company's timeline (${originalTimelineDisplay}).`;
          messages.push(`Your timeline must be equal to or less than the company's timeline (${originalTimelineDisplay}).`);
        }
      }
    }

    // Cover letter: required, min length 20
    if (!form.coverLetter || form.coverLetter.trim().length < 20) {
      newErrors.coverLetter = "Cover letter must be at least 20 characters.";
      messages.push("Cover letter must be at least 20 characters.");
    }

    // Milestones validation (REQUIRED)
    const milestoneFieldErrors: Record<number, {
      title?: string;
      description?: string;
      amount?: string;
      dueDate?: string;
    }> = {};

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
            const errorMsg = "Due date cannot be in the past. Please select today or a future date.";
            milestoneFieldErrors[idx].dueDate = errorMsg;
            messages.push(`Milestone #${idx + 1}: due date cannot be in the past. Please select today or a future date.`);
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

    setProposalErrors(newErrors);
    return { fieldErrors: newErrors, messages };
  }

  const handleSubmitProposal = async () => {
    // 1. run validation
    const { fieldErrors, messages } = validateProposal(proposalData);

    // save inline field errors to state
    setProposalErrors(fieldErrors);

    // if there are validation problems, stop here and toast
    if (messages.length > 0) {
      toast.error(messages.map((m) => `• ${m}`).join("\n"));
      return;
    }

    // 2. make sure we have opportunity data
    if (!opportunity) {
      toast.error("Invalid opportunity data");
      return;
    }

    // 3. attachments validation
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

      formDataToSend.append("serviceRequestId", opportunity.id);

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
        
        // Reload opportunity to update hasProposed flag
        await loadOpportunity();
      } else {
        toast.error(response.message || "Failed to submit proposal");
      }
    } catch (err: unknown) {
      console.error("Error submitting proposal:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to submit proposal";
      toast.error(errorMessage);
    } finally {
      setSubmittingProposal(false);
    }
  };

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

  if (loading) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Loading opportunity...
            </h3>
            <p className="text-gray-600">
              Please wait while we fetch the opportunity details.
            </p>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  if (error || !opportunity) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Error loading opportunity
            </h3>
            <p className="text-gray-600 mb-4">{error || "Opportunity not found"}</p>
            <Button onClick={() => router.back()} variant="outline">
              Go Back
            </Button>
          </div>
        </div>
      </ProviderLayout>
    );
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return `RM${amount.toLocaleString()}`;
  };

  // Get skills array
  const skills = Array.isArray(opportunity.skills) ? opportunity.skills : [];

  // Get requirements and deliverables (handle both string and array formats)
  const requirements =
    typeof opportunity.requirements === "string"
      ? opportunity.requirements
      : Array.isArray(opportunity.requirements)
      ? opportunity.requirements.map((r: string | unknown) => `- ${String(r)}`).join("\n")
      : "";

  const deliverables =
    typeof opportunity.deliverables === "string"
      ? opportunity.deliverables
      : Array.isArray(opportunity.deliverables)
      ? opportunity.deliverables.map((d: string | unknown) => `- ${String(d)}`).join("\n")
      : "";

  // Get client profile image
  const clientAvatar =
    opportunity.customer?.customerProfile?.profileImageUrl;

  const clientAvatarUrl = clientAvatar
    ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}${clientAvatar.startsWith("/") ? "" : "/"}${clientAvatar}`
    : "/placeholder.svg";

  return (
    <ProviderLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{opportunity.title}</h1>
            <p className="text-gray-600">{opportunity.description}</p>
          </div>
          <div className="flex gap-3">
            {opportunity.hasProposed ? (
              <Button variant="outline" disabled>
                <CheckCircle className="w-4 h-4 mr-2" />
                Proposal Submitted
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setIsProposalModalOpen(true);
                  setProposalData({
                    coverLetter: "",
                    bidAmount: "",
                    timelineAmount: "",
                    timelineUnit: "",
                    milestones: [],
                    attachments: [],
                  });
                  setProposalErrors({});
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Submit Proposal
              </Button>
            )}
          </div>
        </div>

        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                {opportunity.milestones && opportunity.milestones.length > 0 && (
                  <TabsTrigger value="milestones">
                    Milestones ({opportunity.milestones.length})
                  </TabsTrigger>
                )}
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
                        <p className="text-lg">{opportunity.category}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Status
                        </Label>
                        <Badge className="bg-green-100 text-green-800">
                          Open
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Budget Range
                        </Label>
                        <p className="text-lg">
                          {formatCurrency(opportunity.budgetMin || 0)} -{" "}
                          {formatCurrency(opportunity.budgetMax || 0)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Timeline
                        </Label>
                        <p className="text-lg">
                          {formatTimeline(opportunity.timeline) || "Not specified"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Priority
                        </Label>
                        <Badge>
                          {opportunity.priority || "medium"}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Proposals
                        </Label>
                        <p className="text-lg">
                          {opportunity._count?.proposals || 0} proposals received
                        </p>
                      </div>
                    </div>

                    {skills.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Required Skills
                        </Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {skills.map((skill: string, index: number) => (
                            <Badge key={index} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {requirements && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Requirements
                        </Label>
                        <div className="mt-2 prose max-w-none text-gray-700">
                          <MarkdownViewer
                            content={requirements}
                            className="prose max-w-none text-gray-700"
                            emptyMessage="No requirements specified"
                          />
                        </div>
                      </div>
                    )}

                    {deliverables && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">
                          Deliverables
                        </Label>
                        <div className="mt-2 prose max-w-none text-gray-700">
                          <MarkdownViewer
                            content={deliverables}
                            className="prose max-w-none text-gray-700"
                            emptyMessage="No deliverables specified"
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {opportunity.milestones && opportunity.milestones.length > 0 && (
                <TabsContent value="milestones" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Company Proposed Milestones</CardTitle>
                      <CardDescription>
                        These are the milestones suggested by the company. You can use them or propose your own in your proposal.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {opportunity.milestones.map((milestone: OpportunityMilestone, index: number) => (
                          <div key={milestone.id || index} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                                  {milestone.order || index + 1}
                                </div>
                                <div>
                                  <h4 className="font-medium">{milestone.title}</h4>
                                  {milestone.description && (
                                    <p className="text-sm text-gray-600">
                                      {milestone.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-semibold">
                                  {formatCurrency(milestone.amount || 0)}
                                </p>
                                {milestone.dueDate && (
                                  <p className="text-sm text-gray-500">
                                    Due: {new Date(milestone.dueDate).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle>Client Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={clientAvatarUrl} />
                    <AvatarFallback>
                      {opportunity.customer?.name?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <p className="font-semibold text-lg">
                        {opportunity.customer?.name || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {opportunity.customer?.email || ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      {opportunity.customer?.customerProfile?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {opportunity.customer.customerProfile.location}
                          </span>
                        </div>
                      )}
                      {opportunity.customer?.customerProfile?.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <a
                            href={
                              opportunity.customer.customerProfile.website.startsWith("http")
                                ? opportunity.customer.customerProfile.website
                                : `https://${opportunity.customer.customerProfile.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {opportunity.customer.customerProfile.website}
                          </a>
                        </div>
                      )}
                      {opportunity.customer?.customerProfile?.industry && (
                        <div>
                          <span className="text-gray-500">Industry: </span>
                          <span className="text-gray-700">
                            {opportunity.customer.customerProfile.industry}
                          </span>
                        </div>
                      )}
                      {opportunity.customer?.customerProfile?.companySize && (
                        <div>
                          <span className="text-gray-500">Company Size: </span>
                          <span className="text-gray-700">
                            {opportunity.customer.customerProfile.companySize}
                          </span>
                        </div>
                      )}
                      {opportunity.customer?.customerProfile?.projectsPosted !== undefined && (
                        <div>
                          <span className="text-gray-500">Projects Posted: </span>
                          <span className="text-gray-700">
                            {opportunity.customer.customerProfile.projectsPosted || 0}
                          </span>
                        </div>
                      )}
                    </div>
                    {opportunity.customer?.id && (
                      <Link href={`/provider/companies/${opportunity.customer.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View Company
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Posted:</span>
                  <span className="font-semibold">
                    {new Date(opportunity.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Proposals:</span>
                  <span className="font-semibold">
                    {opportunity._count?.proposals || 0}
                  </span>
                </div>
                {opportunity.priority && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Priority:</span>
                    <Badge>{opportunity.priority}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Submit Proposal Dialog */}
        <Dialog
          open={isProposalModalOpen}
          onOpenChange={setIsProposalModalOpen}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Submit Proposal</DialogTitle>
              <DialogDescription>
                Submit your proposal for &quot;{opportunity.title}&quot;
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
                    Client budget range: RM {opportunity.budgetMin?.toLocaleString() || "0"} - RM {opportunity.budgetMax?.toLocaleString() || "0"}
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
                    Company timeline: {opportunity.timeline ? formatTimeline(opportunity.timeline) : "Not specified"}
                  </p>
                  {proposalData.timelineAmount && proposalData.timelineUnit && (
                    <p className="text-xs text-gray-500 mt-1">
                      Your timeline: {formatTimeline(proposalData.timelineAmount, proposalData.timelineUnit)}
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
                    onClick={addMilestone}
                  >
                    + Add Milestone
                  </Button>
                </div>

                {proposalData.milestones.length === 0 && (
                  <p className={`text-sm ${
                    proposalErrors.milestones ? "text-red-600 font-medium" : "text-gray-500"
                  }`}>
                    {proposalErrors.milestones || "At least one milestone is required. Click 'Add Milestone' to get started."}
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
                                updateMilestone(i, {
                                  title: e.target.value,
                                });
                                // Clear error when user starts typing
                                if (proposalErrors.milestoneFields?.[i]?.title) {
                                  setProposalErrors(prev => ({
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
                                updateMilestone(i, {
                                  amount: Number(e.target.value),
                                });
                                // Clear error when user starts typing
                                if (proposalErrors.milestoneFields?.[i]?.amount) {
                                  setProposalErrors(prev => ({
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
                              min={new Date().toISOString().split('T')[0]}
                              value={(m.dueDate || "").slice(0, 10)}
                              onChange={(e) => {
                                const selectedDate = e.target.value;
                                const today = new Date().toISOString().split('T')[0];
                                if (selectedDate < today) {
                                  toast.error("Due date cannot be in the past. Please select today or a future date.");
                                  return;
                                }
                                updateMilestone(i, {
                                  dueDate: selectedDate,
                                });
                                // Clear error when user selects a date
                                if (proposalErrors.milestoneFields?.[i]?.dueDate) {
                                  setProposalErrors(prev => ({
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
                              updateMilestone(i, {
                                description: e.target.value,
                              });
                              // Clear error when user starts typing
                              if (proposalErrors.milestoneFields?.[i]?.description) {
                                setProposalErrors(prev => ({
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
                            onClick={() => removeMilestone(i)}
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
                      <span>{formatTimeline(proposalData.timelineAmount, proposalData.timelineUnit) || "Not specified"}</span>
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
                onClick={handleSubmitProposal}
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

