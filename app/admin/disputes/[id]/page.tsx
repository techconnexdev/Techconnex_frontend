"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Eye,
  CheckCircle,
  DollarSign,
  FileText,
  Loader2,
  RefreshCw,
  X,
  MessageSquare,
  Building2,
  Wallet,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Upload,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminDisputeById,
  simulateDisputePayout,
  redoMilestone,
  resolveDispute,
  getAttachmentUrl,
  getR2DownloadUrl,
} from "@/lib/api";
import Link from "next/link";
import Image from "next/image";

// Types
type Dispute = {
  id: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  contestedAmount?: number;
  suggestedResolution?: string;
  attachments?: string[];
  resolutionNotes?: Array<{
    note: string;
    adminName?: string;
    createdAt: string;
  }>;
  resolution?: string;
  paymentId?: string;
  milestoneId?: string;
  projectId: string;
  project?: {
    title: string;
    customer?: {
      id: string;
      name: string;
    };
    provider?: {
      id: string;
      name: string;
      providerProfile?: {
        payoutMethods?: PayoutMethod[];
      };
    };
  };
  raisedBy?: {
    id: string;
    name: string;
  };
  payment?: {
    id: string;
    amount: number;
    status: string;
    method?: string;
    stripeRefundId?: string;
    bankTransferRef?: string;
  };
  milestone?: {
    amount: number;
  };
};

type PayoutMethod = {
  id?: string;
  type: string;
  label?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  accountEmail?: string;
  walletId?: string;
};

export default function AdminDisputeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const disputeId = params.id as string;
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [releaseAmount, setReleaseAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [bankTransferRefImage, setBankTransferRefImage] = useState<File | null>(
    null
  );
  const [bankTransferRefImagePreview, setBankTransferRefImagePreview] =
    useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<
    "refund" | "release" | "partial" | null
  >(null);

  const loadDispute = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminDisputeById(disputeId);
      if (response.success) {
        setDispute(response.data);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dispute details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [disputeId, toast]);

  useEffect(() => {
    loadDispute();
  }, [loadDispute]);

  const handleResolve = async (
    action: "refund" | "release" | "partial" | "redo" | "cancel"
  ) => {
    if (!dispute) {
      toast({
        title: "Error",
        description: "No dispute selected",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(true);

      if (action === "redo") {
        if (!dispute.milestoneId) {
          toast({
            title: "Error",
            description: "No milestone found for this dispute",
            variant: "destructive",
          });
          return;
        }

        const response = await redoMilestone(dispute.milestoneId);
        if (response.success) {
        toast({
          title: "Success",
            description: "Milestone has been reset for rework",
        });
          await loadDispute();
        }
        return;
      }

      if (action === "cancel") {
        const finalResolution = resolutionNotes || "Dispute rejected by admin";
        const response = await resolveDispute(dispute.id, "CANCELLED", finalResolution);
        if (response.success) {
          toast({
            title: "Success",
            description: "Dispute has been rejected",
          });
          setSelectedAction(null);
          setResolutionNotes("");
          await loadDispute();
        }
          return;
        }

      const amount =
        dispute.payment?.amount ||
        dispute.contestedAmount ||
        0;

      let resolutionText = "";

      if (action === "refund") {
        resolutionText = `Refunded RM ${amount.toLocaleString()} to customer via Stripe.`;
      } else if (action === "release") {
        if (!bankTransferRefImage) {
          toast({
            title: "Image Required",
            description:
              "Please upload a bank transfer reference image",
            variant: "destructive",
          });
          setActionLoading(false);
          return;
        }
        resolutionText = `Released RM ${amount.toLocaleString()} to provider. Bank transfer reference uploaded.`;
      } else if (action === "partial") {
        const refund = parseFloat(refundAmount) || 0;
        const release = parseFloat(releaseAmount) || 0;

        if (refund + release > amount) {
          toast({
            title: "Error",
            description:
              "Refund and release amounts cannot exceed total amount",
            variant: "destructive",
          });
          setActionLoading(false);
          return;
        }

        if (refund <= 0 || release <= 0) {
          toast({
            title: "Error",
            description: "Both amounts must be greater than 0",
            variant: "destructive",
          });
          setActionLoading(false);
          return;
        }

        if (!bankTransferRefImage) {
          toast({
            title: "Image Required",
            description:
              "Please upload a bank transfer reference image for the release portion",
            variant: "destructive",
          });
          setActionLoading(false);
          return;
        }

        resolutionText = `Partial split: Refunded RM ${refund.toLocaleString()} to customer via Stripe, Released RM ${release.toLocaleString()} to provider. Bank transfer reference uploaded.`;
      }

      const finalResolution = resolutionNotes
        ? `${resolutionText}\n\n--- Admin Note ---\n${resolutionNotes}`
        : resolutionText;

      const refundAmt =
        action === "refund" || action === "partial"
          ? action === "partial"
            ? parseFloat(refundAmount) || 0
            : amount
          : 0;
      const releaseAmt =
        action === "release" || action === "partial"
          ? action === "partial"
            ? parseFloat(releaseAmount) || 0
            : amount
          : 0;

        const response = await simulateDisputePayout(
          dispute.id,
        refundAmt,
        releaseAmt,
        finalResolution,
        bankTransferRefImage || undefined
        );

      if (response.success) {
        toast({
          title: "Success",
          description: `Dispute resolved: ${action}`,
        });
        setSelectedAction(null);
      setResolutionNotes("");
      setRefundAmount("");
      setReleaseAmount("");
      setBankTransferRefImage(null);
      setBankTransferRefImagePreview(null);
      await loadDispute();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to resolve dispute";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800";
      case "CLOSED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  const disputeAmount = (dispute: Dispute) => {
    return (
      dispute.payment?.amount ||
      dispute.contestedAmount ||
      dispute.milestone?.amount ||
      0
    );
  };

  // Parse description to convert attachment metadata to clickable links
  const parseDescriptionWithAttachments = (text: string) => {
    if (!text) return null;

    const attachmentPattern = /\[Attachment: (.+?) uploaded by (.+?) on (.+?)\]/g;
    const parts: (string | React.ReactElement)[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = attachmentPattern.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      const filename = match[1];
      const uploadedBy = match[2];
      const uploadedAt = match[3];

      const matchingAttachment = dispute?.attachments?.find((url: string) => {
        const normalized = url.replace(/\\/g, "/");
        const urlFilename = normalized.split("/").pop() || "";
        return (
          urlFilename === filename ||
          urlFilename.includes(filename) ||
          filename.includes(urlFilename)
        );
      });

      if (matchingAttachment) {
        const attachmentUrl = getAttachmentUrl(matchingAttachment);
        const isR2Key =
          attachmentUrl === "#" ||
          (!attachmentUrl.startsWith("http") &&
            !attachmentUrl.startsWith("/uploads/") &&
            !attachmentUrl.includes(
              process.env.NEXT_PUBLIC_API_URL || "localhost"
            ));

        parts.push(
          <span
            key={`attachment-${keyIndex++}`}
            className="inline-flex items-center gap-1"
          >
            <span className="text-blue-600">[Attachment:</span>
            <button
              onClick={async (e) => {
                e.preventDefault();
                try {
                  let downloadUrl: string;
                  if (isR2Key) {
                    const r2Response = await getR2DownloadUrl(matchingAttachment);
                    downloadUrl = r2Response.downloadUrl;
                  } else {
                    downloadUrl = attachmentUrl;
                  }
                  window.open(downloadUrl, "_blank");
                } catch (error) {
                  console.error("Failed to download attachment:", error);
                  toast({
                    title: "Error",
                    description: "Failed to download attachment",
                    variant: "destructive",
                  });
                }
              }}
              className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
            >
              {filename}
            </button>
            <span className="text-gray-600">
              uploaded by {uploadedBy} on {uploadedAt}]
            </span>
          </span>
        );
      } else {
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!dispute) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Dispute not found</p>
          <Link href="/admin/disputes">
            <Button className="mt-4">Back to Disputes</Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  // Parse description to show original and updates separately
  const description = dispute.description || "";
  const parts = description.split(/\n---\n/);
  const originalDescription = parts[0]?.trim() || "";
  const updates = parts.slice(1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/disputes">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Dispute Review - {dispute.reason}
              </h1>
              <p className="text-gray-600">
                Project: {dispute.project?.title || "N/A"}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(dispute.status)}>
            {dispute.status?.replace("_", " ")}
          </Badge>
        </div>

        {/* Dispute Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dispute Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{dispute.reason}</p>
                <p className="text-sm text-gray-500">
                  Project: {dispute.project?.title}
                </p>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">Amount:</span> RM
                  {disputeAmount(dispute).toLocaleString()}
                </p>
                <p>
                  <span className="font-medium">Created:</span>{" "}
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </p>
                {dispute.contestedAmount && (
                  <p>
                    <span className="font-medium">Contested Amount:</span> RM
                    {dispute.contestedAmount.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="mt-3">
                <p className="font-medium mb-3">Description & Updates:</p>
                <div className="space-y-4">
                  {/* Original Description */}
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback>
                          {dispute.raisedBy?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {dispute.raisedBy?.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          Original dispute •{" "}
                          {new Date(dispute.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                      {parseDescriptionWithAttachments(originalDescription) ||
                        originalDescription}
                    </div>
                  </div>

                  {/* Updates */}
                  {updates.map((update: string, idx: number) => {
                    const match = update.match(
                      /^\[Update by (.+?) on (.+?)\]:\s*([\s\S]+)$/
                    );
                    let userName = "";
                    let updateDate = "";
                    let updateContent = "";

                    if (match) {
                      [, userName, updateDate, updateContent] = match;
                    } else {
                      const oldMatch = update.match(
                        /^\[Update by (.+?)\]:\s*([\s\S]+)$/
                      );
                      if (oldMatch) {
                        const [, userIdOrName, content] = oldMatch;
                        const uuidRegex =
                          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                        if (uuidRegex.test(userIdOrName)) {
                          if (dispute.project?.customer?.id === userIdOrName) {
                            userName = dispute.project?.customer?.name || "Customer";
                          } else if (
                            dispute.project?.provider?.id === userIdOrName
                          ) {
                            userName = dispute.project?.provider?.name || "Provider";
                          } else if (dispute.raisedBy?.id === userIdOrName) {
                            userName = dispute.raisedBy?.name || "Unknown User";
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
                        updateContent = update;
                        userName = "Unknown User";
                        updateDate = "Unknown Date";
                      }
                    }

                    const isCustomer =
                      dispute.project?.customer?.name === userName;
                    const isProvider =
                      dispute.project?.provider?.name === userName;

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 ${
                          isCustomer
                            ? "bg-blue-50 border-blue-400"
                            : isProvider
                            ? "bg-green-50 border-green-400"
                            : "bg-yellow-50 border-yellow-400"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback>
                              {userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-gray-900">
                                {userName}
                              </p>
                              <Badge variant="outline" className="text-xs">
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
                        <div className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                          {parseDescriptionWithAttachments(updateContent.trim()) ||
                            updateContent.trim()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              {dispute.suggestedResolution && (
                <div className="mt-3">
                  <p className="font-medium mb-2">Suggested Resolution:</p>
                  <p className="text-sm text-gray-700">
                    {dispute.suggestedResolution}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Participants</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar>
                  <AvatarFallback>
                    {dispute.project?.customer?.name?.charAt(0) || "C"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {dispute.project?.customer?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">Customer</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar>
                  <AvatarFallback>
                    {dispute.project?.provider?.name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {dispute.project?.provider?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">Provider</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar>
                  <AvatarFallback>
                    {dispute.raisedBy?.name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {dispute.raisedBy?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500">Raised By</p>
                </div>
              </div>
              <Link href={`/admin/projects/${dispute.projectId}`}>
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  View Project Details
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Evidence */}
        {dispute.attachments && dispute.attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evidence & Documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {dispute.attachments.map((url: string, index: number) => {
                  const normalized = url.replace(/\\/g, "/");
                  const filename =
                    normalized.split("/").pop() || `Attachment ${index + 1}`;
                  const cleanFilename = filename.replace(/^\d+_/, "");

                  const attachmentMetadataMatch =
                    dispute.description?.match(
                      new RegExp(
                        `\\[Attachment: (.+?) uploaded by (.+?) on (.+?)\\]`,
                        "g"
                      )
                    );
                  let uploadedBy = "Unknown User";
                  let uploadedAt = "Unknown Date";

                  if (attachmentMetadataMatch) {
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

                  if (
                    uploadedBy === "Unknown User" &&
                    index === 0 &&
                    dispute.attachments?.length === 1
                  ) {
                    uploadedBy = dispute.raisedBy?.name || "Unknown User";
                    uploadedAt = new Date(dispute.createdAt).toLocaleString();
                  }

                  return (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {cleanFilename}
                            </p>
                            <p className="text-xs text-gray-500">
                              Uploaded by {uploadedBy} • {uploadedAt}
                            </p>
                          </div>
                        </div>
                      </div>
                      {(() => {
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
                            href={attachmentUrl === "#" ? undefined : attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={
                              isR2Key
                                ? async (e) => {
                                    e.preventDefault();
                                    try {
                                      const downloadUrl =
                                        await getR2DownloadUrl(url);
                                      window.open(downloadUrl.downloadUrl, "_blank");
                                    } catch (error) {
                                      console.error(
                                        "Failed to get download URL:",
                                        error
                                      );
                                      toast({
                                        title: "Error",
                                        description: "Failed to download attachment",
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                : undefined
                            }
                          >
                            <Button variant="outline" size="sm" className="w-full bg-transparent">
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </a>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resolution Notes */}
        {dispute.resolutionNotes &&
          Array.isArray(dispute.resolutionNotes) &&
          dispute.resolutionNotes.length > 0 && (
            <Card className="border-purple-200 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-lg text-purple-800">
                  Admin Resolution Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dispute.resolutionNotes.map(
                  (
                    note: {
                      note?: string;
                      adminName?: string;
                      createdAt: string;
                    },
                    index: number
                  ) => {
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
                              {new Date(note.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3 mt-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">
                              Resolution Result:
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                              {resolutionResult}
                            </p>
                          </div>
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

        {/* Legacy Resolution */}
        {dispute.status === "RESOLVED" &&
          dispute.resolution &&
          (!dispute.resolutionNotes ||
            !Array.isArray(dispute.resolutionNotes) ||
            dispute.resolutionNotes.length === 0) && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg text-green-800">
                  Resolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700">{dispute.resolution}</p>
              </CardContent>
            </Card>
          )}

        {/* Payment Status Info */}
        {(dispute.payment || dispute.paymentId) && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">Payment ID:</span>
                  <p className="text-blue-600 font-mono text-xs break-all">
                    {dispute.payment?.id || dispute.paymentId || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Amount:</span>
                  <p className="text-blue-600">
                    RM {dispute.payment?.amount?.toLocaleString() || "0"}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">Status:</span>
                  <Badge
                    className={`ml-2 ${
                      dispute.payment?.status === "ESCROWED"
                        ? "bg-green-100 text-green-800"
                        : dispute.payment?.status === "REFUNDED"
                        ? "bg-red-100 text-red-800"
                        : dispute.payment?.status === "RELEASED"
                        ? "bg-blue-100 text-blue-800"
                        : dispute.payment?.status === "DISPUTED"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {dispute.payment?.status || "N/A"}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-blue-800">
                    Payment Method:
                  </span>
                  <p className="text-blue-600">
                    {dispute.payment?.method || "N/A"}
                  </p>
                </div>
              </div>
              {dispute.payment?.stripeRefundId && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="font-medium text-blue-800">
                    Refund Transaction ID:
                  </span>
                  <p className="text-blue-600 font-mono text-xs break-all">
                    {dispute.payment?.stripeRefundId}
                  </p>
                </div>
              )}
              {dispute.payment?.bankTransferRef && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="font-medium text-blue-800">
                    Transfer Reference:
                  </span>
                  <p className="text-blue-600 font-mono text-xs break-all">
                    {dispute.payment?.bankTransferRef?.startsWith("http") ? (
                      <a
                        href={dispute.payment.bankTransferRef}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        View File
                      </a>
                    ) : (
                      dispute.payment?.bankTransferRef
                    )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Resolution Form */}
        {dispute.status !== "RESOLVED" &&
          dispute.status !== "CLOSED" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resolution Actions</CardTitle>
              <CardDescription>
                {dispute.payment
                  ? `Payment Amount: RM ${
                      dispute.payment?.amount?.toLocaleString() ||
                      dispute.contestedAmount ||
                      0
                    }`
                  : `Contested Amount: RM ${dispute.contestedAmount || 0}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (
                      !dispute.payment?.id &&
                      !dispute.paymentId &&
                      !dispute.milestoneId
                    ) {
                      toast({
                        title: "Error",
                        description: "No payment found for this dispute",
                        variant: "destructive",
                      });
                      return;
                    }
                    setSelectedAction("refund");
                    setBankTransferRefImage(null);
                    setBankTransferRefImagePreview(null);
                  }}
                  disabled={
                    actionLoading ||
                    (!dispute.payment?.id &&
                      !dispute.paymentId &&
                      !dispute.milestoneId)
                  }
                  className={`${
                    selectedAction === "refund"
                      ? "bg-green-50 border-green-500 text-green-700"
                      : "text-green-600 hover:text-green-700 border-green-300"
                  }`}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Refund (Company Wins)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (
                      !dispute.payment?.id &&
                      !dispute.paymentId &&
                      !dispute.milestoneId
                    ) {
                      toast({
                        title: "Error",
                        description: "No payment found for this dispute",
                        variant: "destructive",
                      });
                      return;
                    }
                    setSelectedAction("release");
                    setBankTransferRefImage(null);
                    setBankTransferRefImagePreview(null);
                  }}
                  disabled={
                    actionLoading ||
                    (!dispute.payment?.id &&
                      !dispute.paymentId &&
                      !dispute.milestoneId)
                  }
                  className={`${
                    selectedAction === "release"
                      ? "bg-blue-50 border-blue-500 text-blue-700"
                      : "text-blue-600 hover:text-blue-700 border-blue-300"
                  }`}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Release (Provider Wins)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleResolve("redo")}
                  disabled={actionLoading}
                  className="text-yellow-600 hover:text-yellow-700 border-yellow-300"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Redo Milestone
                </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleResolve("cancel")}
                    disabled={actionLoading}
                    className="text-red-600 hover:text-red-700 border-red-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject Dispute
                  </Button>
                </div>

                {/* Admin Note Box */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <Label htmlFor="admin-resolution-notes" className="text-base font-semibold">
                    Admin Resolution Notes (Optional)
                  </Label>
                  <p className="text-sm text-gray-600 mt-1 mb-3">
                    Add notes about this resolution. These notes will be visible to all parties.
                  </p>
                  <textarea
                    id="admin-resolution-notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Enter resolution notes or admin comments..."
                    className="w-full p-3 border rounded-md min-h-[120px] resize-y"
                  />
              </div>

              {/* Refund Section */}
              {selectedAction === "refund" && (
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-green-900">
                        Process Refund
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        Refund will be processed directly via Stripe. No bank
                        transfer reference needed.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAction(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    onClick={() => handleResolve("refund")}
                    disabled={actionLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        Submit Refund
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Release Section */}
              {selectedAction === "release" && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label
                        htmlFor="bank-transfer-ref-image"
                        className="text-base font-semibold"
                      >
                        Bank Transfer Reference Image
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        Required for release processing
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedAction(null);
                        setBankTransferRefImage(null);
                        setBankTransferRefImagePreview(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Provider Payout Method Info */}
                  <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">
                        Provider Payout Method
                      </h4>
                      {dispute.project?.provider?.id && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const provider = dispute.project?.provider;
                            if (provider?.id) {
                              router.push(
                                  `/admin/messages?userId=${provider.id}&name=${encodeURIComponent(
                                    provider.name || ""
                                  )}`
                              );
                            }
                          }}
                          className="text-xs"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Message Provider
                        </Button>
                      )}
                    </div>
                    {dispute.project?.provider?.providerProfile?.payoutMethods &&
                      dispute.project.provider.providerProfile.payoutMethods
                        .length > 0 ? (
                      <div className="space-y-2">
                        {dispute.project.provider.providerProfile.payoutMethods.map(
                          (method: PayoutMethod, index: number) => {
                            const getPayoutIcon = (type: string) => {
                              switch (type) {
                                case "BANK":
                                  return <Building2 className="w-4 h-4" />;
                                case "PAYPAL":
                                  return <Wallet className="w-4 h-4" />;
                                case "PAYONEER":
                                  return <CreditCard className="w-4 h-4" />;
                                case "WISE":
                                  return <TrendingUp className="w-4 h-4" />;
                                case "EWALLET":
                                  return <Wallet className="w-4 h-4" />;
                                default:
                                  return <CreditCard className="w-4 h-4" />;
                              }
                            };

                            const getPayoutDisplay = (method: PayoutMethod) => {
                              if (method.type === "BANK") {
                                return {
                                  title:
                                    method.label ||
                                    method.bankName ||
                                    "Bank Account",
                                  subtitle: method.accountNumber
                                    ? `Account: ${method.accountNumber}`
                                    : "No account number",
                                  details: method.accountHolder
                                    ? `Holder: ${method.accountHolder}`
                                    : "",
                                };
                              } else {
                                return {
                                  title: method.label || method.type,
                                  subtitle: method.accountEmail || "",
                                  details: method.walletId || "",
                                };
                              }
                            };

                            const display = getPayoutDisplay(method);

                            return (
                              <div
                                key={method.id || index}
                                className="p-3 bg-white rounded border border-blue-200"
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5 text-blue-600">
                                    {getPayoutIcon(method.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-gray-900">
                                      {display.title}
                                    </p>
                                    {display.subtitle && (
                                      <p className="text-xs text-gray-600 mt-1">
                                        {display.subtitle}
                                      </p>
                                    )}
                                    {display.details && (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {display.details}
                                      </p>
                                    )}
                                      <Badge variant="outline" className="mt-2 text-xs">
                                      {method.type}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ) : (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-yellow-900">
                              No payout method provided
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              The provider has not set up any payout methods.
                              Please contact them to add their bank details or
                              payment information.
                            </p>
                            {dispute.project?.provider?.id && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const provider = dispute.project?.provider;
                                  if (provider?.id) {
                                    router.push(
                                        `/admin/messages?userId=${provider.id}&name=${encodeURIComponent(
                                        provider.name || ""
                                      )}`
                                    );
                                  }
                                }}
                                className="mt-2 text-xs"
                              >
                                <MessageSquare className="w-3 h-3 mr-1" />
                                Message Provider to Add Payout Method
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {bankTransferRefImagePreview ? (
                      <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                        <Image
                          src={bankTransferRefImagePreview}
                          alt="Bank transfer reference"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            setBankTransferRefImage(null);
                            setBankTransferRefImagePreview(null);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <input
                          type="file"
                          id="bank-transfer-ref-image"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (!file.type.startsWith("image/")) {
                                toast({
                                  title: "Invalid file type",
                                  description: "Please select an image file",
                                  variant: "destructive",
                                });
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                toast({
                                  title: "File too large",
                                  description:
                                    "Please select an image smaller than 5MB",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setBankTransferRefImage(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setBankTransferRefImagePreview(
                                  reader.result as string
                                );
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <label
                          htmlFor="bank-transfer-ref-image"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-600">
                            Click to upload bank transfer reference image
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 5MB
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                  {bankTransferRefImage && (
                    <Button
                        onClick={() => {
                          if (!bankTransferRefImage) {
                            toast({
                              title: "Image Required",
                              description:
                                "Please upload a bank transfer reference image",
                              variant: "destructive",
                            });
                            return;
                          }
                          handleResolve("release");
                        }}
                      disabled={actionLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {actionLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Submit Release
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

