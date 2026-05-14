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
  manualResolveDispute,
  redoMilestone,
  redoProject,
  resolveDispute,
  getAttachmentUrl,
  getR2DownloadUrl,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/contexts/I18nProvider";
import {
  disputeStatusLabel,
  paymentStatusLabel,
} from "@/components/admin/disputes/dispute-i18n-maps";

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
    milestoneId?: string;
    milestone?: { id: string; title?: string };
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
  const { t } = useI18n();
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
  const [payoutBankName, setPayoutBankName] = useState("");
  const [payoutAccountNumber, setPayoutAccountNumber] = useState("");
  const [payoutAccountName, setPayoutAccountName] = useState("");
  const [manualSummary, setManualSummary] = useState("");
  const [manualCustomerNote, setManualCustomerNote] = useState("");
  const [manualProviderNote, setManualProviderNote] = useState("");

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
          : t("admin.disputes.toast.loadDetailFailed");
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [disputeId, toast, t]);

  useEffect(() => {
    loadDispute();
  }, [loadDispute]);

  useEffect(() => {
    if (!dispute?.milestoneId) {
      setSelectedAction((prev) =>
        prev === "refund" || prev === "release" ? null : prev,
      );
      setBankTransferRefImage(null);
      setBankTransferRefImagePreview(null);
    }
  }, [dispute?.id, dispute?.milestoneId]);

  const handleResolve = async (
    action: "refund" | "release" | "partial" | "redo" | "cancel"
  ) => {
    if (!dispute) {
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: t("admin.disputes.toast.noDisputeSelected"),
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(true);

      if (action === "redo") {
        const idForApi = String(disputeId || "").trim();
        if (!idForApi) {
          toast({
            title: t("admin.users.toast.errorTitle"),
            description: t("admin.disputes.toast.invalidDisputeUrl"),
            variant: "destructive",
          });
          return;
        }

        // Match Dispute.milestoneId only — payment may reference another milestone.
        const milestoneForRedo = dispute.milestoneId;
        const resolutionText = resolutionNotes.trim() || undefined;

        if (milestoneForRedo) {
          const response = await redoMilestone(idForApi, resolutionText);
          if (response.success) {
            toast({
              title: t("admin.disputes.toast.successTitle"),
              description: t("admin.disputes.toast.redoMilestoneSuccess"),
            });
            await loadDispute();
          }
        } else {
          const response = await redoProject(idForApi, resolutionText);
          if (response.success) {
            toast({
              title: t("admin.disputes.toast.successTitle"),
              description: t("admin.disputes.toast.redoProjectSuccess"),
            });
            await loadDispute();
          }
        }
        return;
      }

      if (action === "cancel") {
        const finalResolution =
          resolutionNotes || t("admin.disputes.resolution.rejectedDefault");
        const response = await resolveDispute(dispute.id, "REJECTED", finalResolution);
        if (response.success) {
          toast({
            title: t("admin.disputes.toast.successTitle"),
            description: t("admin.disputes.toast.rejectedSuccess"),
          });
          setSelectedAction(null);
          setResolutionNotes("");
          await loadDispute();
        }
        return;
      }

      if (
        !dispute.milestoneId &&
        (action === "refund" || action === "release" || action === "partial")
      ) {
        toast({
          title: t("admin.disputes.toast.notAvailableTitle"),
          description: t("admin.disputes.toast.milestoneOnlyRefundRelease"),
          variant: "destructive",
        });
        setActionLoading(false);
        return;
      }

      const amount =
        dispute.payment?.amount ||
        dispute.contestedAmount ||
        0;

      let resolutionText = "";

      if (action === "refund") {
        resolutionText = t("admin.disputes.resolution.refund", {
          amount: amount.toLocaleString(),
        });
      } else if (action === "release") {
        if (!bankTransferRefImage) {
          toast({
            title: t("admin.disputes.toast.imageRequiredTitle"),
            description: t("admin.disputes.toast.uploadBankImage"),
            variant: "destructive",
          });
          setActionLoading(false);
          return;
        }
        resolutionText = t("admin.disputes.resolution.release", {
          amount: amount.toLocaleString(),
        });
      } else if (action === "partial") {
        const refund = parseFloat(refundAmount) || 0;
        const release = parseFloat(releaseAmount) || 0;

        if (refund + release > amount) {
          toast({
            title: t("admin.users.toast.errorTitle"),
            description: t("admin.disputes.toast.amountsExceed"),
            variant: "destructive",
          });
          setActionLoading(false);
          return;
        }

        if (refund <= 0 || release <= 0) {
          toast({
            title: t("admin.users.toast.errorTitle"),
            description: t("admin.disputes.toast.amountsMustBePositive"),
            variant: "destructive",
          });
          setActionLoading(false);
          return;
        }

        if (!bankTransferRefImage) {
          toast({
            title: t("admin.disputes.toast.imageRequiredTitle"),
            description: t("admin.disputes.toast.uploadBankImagePartial"),
            variant: "destructive",
          });
          setActionLoading(false);
          return;
        }

        resolutionText = t("admin.disputes.resolution.partial", {
          refund: refund.toLocaleString(),
          release: release.toLocaleString(),
        });
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

      const payoutOverride =
        (action === "release" || action === "partial") &&
        payoutBankName.trim() &&
        payoutAccountNumber.trim()
          ? {
              bankName: payoutBankName.trim(),
              accountNumber: payoutAccountNumber.trim(),
              accountName: payoutAccountName.trim(),
            }
          : undefined;

      const response = await simulateDisputePayout(
        dispute.id,
        refundAmt,
        releaseAmt,
        finalResolution,
        bankTransferRefImage || undefined,
        payoutOverride
      );

      if (response.success) {
        const resolvedDesc =
          action === "refund"
            ? t("admin.disputes.toast.disputeResolvedRefund")
            : action === "release"
              ? t("admin.disputes.toast.disputeResolvedRelease")
              : t("admin.disputes.toast.disputeResolvedPartial");
        toast({
          title: t("admin.disputes.toast.successTitle"),
          description: resolvedDesc,
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
        error instanceof Error
          ? error.message
          : t("admin.disputes.toast.resolveFailed");
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualResolve = async () => {
    if (!dispute) return;
    try {
      setActionLoading(true);
      const response = await manualResolveDispute(dispute.id, {
        resolution: manualSummary,
        customerPayoutNote: manualCustomerNote,
        providerPayoutNote: manualProviderNote,
      });
      if (response.success) {
        toast({
          title: t("admin.disputes.toast.recordedTitle"),
          description: t("admin.disputes.toast.manualRecorded"),
        });
        setManualSummary("");
        setManualCustomerNote("");
        setManualProviderNote("");
        await loadDispute();
      }
    } catch (error: unknown) {
      toast({
        title: t("admin.users.toast.errorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("admin.disputes.toast.manualFailed"),
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
      case "REJECTED":
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

  const parseDescriptionWithAttachments = useCallback(
    (text: string) => {
      if (!text) return null;

      const attachmentPattern =
        /\[Attachment: (.+?) uploaded by (.+?) on (.+?)\]/g;
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

        const matchingAttachment = dispute?.attachments?.find(
          (url: string) => {
            const normalized = url.replace(/\\/g, "/");
            const urlFilename = normalized.split("/").pop() || "";
            return (
              urlFilename === filename ||
              urlFilename.includes(filename) ||
              filename.includes(urlFilename)
            );
          }
        );

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
              <span className="text-blue-600">
                {t("admin.disputes.detail.attachment.openBracket")}
              </span>
              <button
                onClick={async (e) => {
                  e.preventDefault();
                  try {
                    let downloadUrl: string;
                    if (isR2Key) {
                      const r2Response =
                        await getR2DownloadUrl(matchingAttachment);
                      downloadUrl = r2Response.downloadUrl;
                    } else {
                      downloadUrl = attachmentUrl;
                    }
                    window.open(downloadUrl, "_blank");
                  } catch (error) {
                    console.error("Failed to download attachment:", error);
                    toast({
                      title: t("admin.users.toast.errorTitle"),
                      description: t(
                        "admin.disputes.toast.downloadAttachmentFailed"
                      ),
                      variant: "destructive",
                    });
                  }
                }}
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
              >
                {filename}
              </button>
              <span className="text-gray-600">
                {t("admin.disputes.detail.attachment.uploadedByOn", {
                  user: uploadedBy,
                  date: uploadedAt,
                })}
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
    },
    [dispute, t, toast]
  );

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
          <p className="text-gray-500">{t("admin.disputes.detail.notFound")}</p>
          <Link href="/admin/disputes">
            <Button className="mt-4">{t("admin.disputes.detail.backToList")}</Button>
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
                {t("admin.disputes.detail.headerTitle", { reason: dispute.reason })}
              </h1>
              <p className="text-gray-600">
                {t("admin.disputes.detail.projectLabel", {
                  title: dispute.project?.title || t("admin.disputes.na"),
                })}
              </p>
            </div>
          </div>
          <Badge className={getStatusColor(dispute.status)}>
            {disputeStatusLabel(dispute.status, t)}
          </Badge>
        </div>

        {/* Dispute Overview */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("admin.disputes.detail.card.disputeDetails")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{dispute.reason}</p>
                <p className="text-sm text-gray-500">
                  {t("admin.disputes.detail.field.project")}{" "}
                  {dispute.project?.title}
                </p>
              </div>
              <div className="text-sm space-y-1">
                <p>
                  <span className="font-medium">
                    {t("admin.disputes.detail.field.amount")}
                  </span>{" "}
                  {t("admin.disputes.stats.amountRm", {
                    amount: disputeAmount(dispute).toLocaleString(),
                  })}
                </p>
                <p>
                  <span className="font-medium">
                    {t("admin.disputes.detail.field.created")}
                  </span>{" "}
                  {new Date(dispute.createdAt).toLocaleDateString()}
                </p>
                {dispute.contestedAmount && (
                  <p>
                    <span className="font-medium">
                      {t("admin.disputes.detail.field.contestedAmount")}
                    </span>{" "}
                    {t("admin.disputes.stats.amountRm", {
                      amount: dispute.contestedAmount.toLocaleString(),
                    })}
                  </p>
                )}
              </div>
              <div className="mt-3">
                <p className="font-medium mb-3">
                  {t("admin.disputes.detail.section.descriptionUpdates")}
                </p>
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
                          {dispute.raisedBy?.name ||
                            t("admin.disputes.detail.unknownUser")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t("admin.disputes.detail.originalMeta", {
                            date: new Date(dispute.createdAt).toLocaleString(),
                          })}
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
                            userName =
                              dispute.project?.customer?.name ||
                              t("admin.disputes.detail.role.customer");
                          } else if (
                            dispute.project?.provider?.id === userIdOrName
                          ) {
                            userName =
                              dispute.project?.provider?.name ||
                              t("admin.disputes.detail.role.provider");
                          } else if (dispute.raisedBy?.id === userIdOrName) {
                            userName =
                              dispute.raisedBy?.name ||
                              t("admin.disputes.detail.unknownUser");
                          } else {
                            userName = t("admin.disputes.detail.unknownUser");
                          }
                          updateDate = t("admin.disputes.detail.unknownDate");
                          updateContent = content;
                        } else {
                          userName = userIdOrName;
                          updateDate = t("admin.disputes.detail.unknownDate");
                        updateContent = content;
                        }
                      } else {
                        updateContent = update;
                        userName = t("admin.disputes.detail.unknownUser");
                        updateDate = t("admin.disputes.detail.unknownDate");
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
                                  ? t("admin.disputes.detail.role.customer")
                                  : isProvider
                                  ? t("admin.disputes.detail.role.provider")
                                  : t("admin.disputes.detail.role.user")}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500">
                              {t("admin.disputes.detail.updateLine", {
                                n: idx + 1,
                                date: updateDate,
                              })}
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
                  <p className="font-medium mb-2">
                    {t("admin.disputes.detail.suggestedResolution")}
                  </p>
                  <p className="text-sm text-gray-700">
                    {dispute.suggestedResolution}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("admin.disputes.detail.participants.title")}
              </CardTitle>
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
                    {dispute.project?.customer?.name || t("admin.disputes.na")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("admin.disputes.detail.role.customer")}
                  </p>
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
                    {dispute.project?.provider?.name || t("admin.disputes.na")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("admin.disputes.detail.role.provider")}
                  </p>
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
                    {dispute.raisedBy?.name || t("admin.disputes.na")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("admin.disputes.detail.participants.raisedBy")}
                  </p>
                </div>
              </div>
              <Link href={`/admin/projects/${dispute.projectId}`}>
                <Button variant="outline" className="w-full">
                  <Eye className="w-4 h-4 mr-2" />
                  {t("admin.disputes.detail.viewProject")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Evidence */}
        {dispute.attachments && dispute.attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {t("admin.disputes.detail.evidence.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                {dispute.attachments.map((url: string, index: number) => {
                  const normalized = url.replace(/\\/g, "/");
                  const filename =
                    normalized.split("/").pop() ||
                    t("admin.disputes.detail.evidence.fallbackName", {
                      n: index + 1,
                    });
                  const cleanFilename = filename.replace(/^\d+_/, "");

                  const attachmentMetadataMatch =
                    dispute.description?.match(
                      new RegExp(
                        `\\[Attachment: (.+?) uploaded by (.+?) on (.+?)\\]`,
                        "g"
                      )
                    );
                  let uploadedBy = "";
                  let uploadedAt = "";
                  let matchedAttachmentMeta = false;

                  if (attachmentMetadataMatch) {
                    for (const meta of attachmentMetadataMatch) {
                      const metaMatch = meta.match(
                        /\[Attachment: (.+?) uploaded by (.+?) on (.+?)\]/
                      );
                      if (metaMatch && metaMatch[1] === filename) {
                        uploadedBy = metaMatch[2];
                        uploadedAt = metaMatch[3];
                        matchedAttachmentMeta = true;
                        break;
                      }
                    }
                  }

                  if (
                    !matchedAttachmentMeta &&
                    index === 0 &&
                    dispute.attachments?.length === 1
                  ) {
                    uploadedBy =
                      dispute.raisedBy?.name ||
                      t("admin.disputes.detail.unknownUser");
                    uploadedAt = new Date(dispute.createdAt).toLocaleString();
                  } else if (!matchedAttachmentMeta) {
                    uploadedBy = t("admin.disputes.detail.unknownUser");
                    uploadedAt = t("admin.disputes.detail.unknownDate");
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
                              {t("admin.disputes.detail.evidence.uploadedLine", {
                                user: uploadedBy,
                                date: uploadedAt,
                              })}
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
                                        title: t("admin.users.toast.errorTitle"),
                                        description: t(
                                          "admin.disputes.toast.downloadAttachmentFailed"
                                        ),
                                        variant: "destructive",
                                      });
                                    }
                                  }
                                : undefined
                            }
                          >
                            <Button variant="outline" size="sm" className="w-full bg-transparent">
                              <Eye className="w-4 h-4 mr-2" />
                              {t("admin.disputes.detail.evidence.view")}
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
                  {t("admin.disputes.detail.adminNotesCard.title")}
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
                              {t("admin.disputes.detail.adminNotesCard.noteHeading", {
                                n: index + 1,
                              })}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t("admin.disputes.detail.adminNotesCard.byLine", {
                                name:
                                  note.adminName ||
                                  t("admin.disputes.detail.adminNotesCard.adminFallback"),
                                date: new Date(note.createdAt).toLocaleString(),
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3 mt-2">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-1">
                              {t(
                                "admin.disputes.detail.adminNotesCard.resolutionResult"
                              )}
                            </p>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                              {resolutionResult}
                            </p>
                          </div>
                          {hasAdminNote && adminNote && (
                            <div>
                              <p className="text-xs font-semibold text-purple-600 mb-1">
                                {t("admin.disputes.detail.adminNotesCard.adminNote")}
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
                  {t("admin.disputes.detail.legacyResolutionTitle")}
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
                {t("admin.disputes.detail.payment.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-blue-800">
                    {t("admin.disputes.detail.payment.paymentId")}
                  </span>
                  <p className="text-blue-600 font-mono text-xs break-all">
                    {dispute.payment?.id ||
                      dispute.paymentId ||
                      t("admin.disputes.na")}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">
                    {t("admin.disputes.detail.payment.amount")}
                  </span>
                  <p className="text-blue-600">
                    {t("admin.disputes.stats.amountRm", {
                      amount:
                        dispute.payment?.amount?.toLocaleString() || "0",
                    })}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">
                    {t("admin.disputes.detail.payment.status")}
                  </span>
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
                    {paymentStatusLabel(dispute.payment?.status, t)}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium text-blue-800">
                    {t("admin.disputes.detail.payment.method")}
                  </span>
                  <p className="text-blue-600">
                    {dispute.payment?.method || t("admin.disputes.na")}
                  </p>
                </div>
              </div>
              {dispute.payment?.stripeRefundId && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="font-medium text-blue-800">
                    {t("admin.disputes.detail.payment.refundTxnId")}
                  </span>
                  <p className="text-blue-600 font-mono text-xs break-all">
                    {dispute.payment?.stripeRefundId}
                  </p>
                </div>
              )}
              {dispute.payment?.bankTransferRef && (
                <div className="mt-2 pt-2 border-t border-blue-200">
                  <span className="font-medium text-blue-800">
                    {t("admin.disputes.detail.payment.transferRef")}
                  </span>
                  <p className="text-blue-600 font-mono text-xs break-all">
                    {dispute.payment?.bankTransferRef?.startsWith("http") ? (
                      <a
                        href={dispute.payment.bankTransferRef}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {t("admin.disputes.detail.payment.viewFile")}
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
              <CardTitle className="text-lg">
                {t("admin.disputes.detail.resolution.title")}
              </CardTitle>
              <CardDescription>
                {dispute.payment
                  ? t("admin.disputes.detail.resolution.descPayment", {
                      amount: String(
                        dispute.payment?.amount?.toLocaleString() ||
                          dispute.contestedAmount ||
                          0
                      ),
                    })
                  : t("admin.disputes.detail.resolution.descContested", {
                      amount: String(dispute.contestedAmount || 0),
                    })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {dispute.milestoneId ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedAction("refund");
                        setBankTransferRefImage(null);
                        setBankTransferRefImagePreview(null);
                      }}
                      disabled={actionLoading}
                      className={`${
                        selectedAction === "refund"
                          ? "bg-green-50 border-green-500 text-green-700"
                          : "text-green-600 hover:text-green-700 border-green-300"
                      }`}
                    >
                      <DollarSign className="w-4 h-4 mr-2" />
                      {t("admin.disputes.detail.action.refund")}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedAction("release");
                        setBankTransferRefImage(null);
                        setBankTransferRefImagePreview(null);
                      }}
                      disabled={actionLoading}
                      className={`${
                        selectedAction === "release"
                          ? "bg-blue-50 border-blue-500 text-blue-700"
                          : "text-blue-600 hover:text-blue-700 border-blue-300"
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t("admin.disputes.detail.action.release")}
                    </Button>
                  </>
                ) : null}
                <Button
                  variant="outline"
                  onClick={() => handleResolve("redo")}
                  disabled={actionLoading}
                  className="text-yellow-600 hover:text-yellow-700 border-yellow-300"
                  title={
                    dispute.milestoneId
                      ? t("admin.disputes.detail.action.redoHintMilestone")
                      : t("admin.disputes.detail.action.redoHintProject")
                  }
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {dispute.milestoneId
                    ? t("admin.disputes.detail.action.redoMilestone")
                    : t("admin.disputes.detail.action.redoProject")}
                </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleResolve("cancel")}
                    disabled={actionLoading}
                    className="text-red-600 hover:text-red-700 border-red-300"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t("admin.disputes.detail.action.endProject")}
                  </Button>
                </div>

                {/* Admin Note Box */}
                <div className="p-4 border rounded-lg bg-gray-50">
                  <Label htmlFor="admin-resolution-notes" className="text-base font-semibold">
                    {t("admin.disputes.detail.adminNoteBox.label")}
                  </Label>
                  <p className="text-sm text-gray-600 mt-1 mb-3">
                    {t("admin.disputes.detail.adminNoteBox.hint")}
                  </p>
                  <textarea
                    id="admin-resolution-notes"
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder={t("admin.disputes.detail.adminNoteBox.placeholder")}
                    className="w-full p-3 border rounded-md min-h-[120px] resize-y"
                  />
              </div>

              {/* Refund Section */}
              {selectedAction === "refund" && (
                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-green-900">
                        {t("admin.disputes.detail.refund.heading")}
                      </h4>
                      <p className="text-sm text-green-700 mt-1">
                        {t("admin.disputes.detail.refund.body")}
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
                        {t("admin.disputes.detail.processing")}
                      </>
                    ) : (
                      <>
                        <DollarSign className="w-4 h-4 mr-2" />
                        {t("admin.disputes.detail.refund.submit")}
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
                        {t("admin.disputes.detail.release.imageLabel")}
                      </Label>
                      <p className="text-sm text-gray-600 mt-1">
                        {t("admin.disputes.detail.release.imageHint")}
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
                        setPayoutBankName("");
                        setPayoutAccountNumber("");
                        setPayoutAccountName("");
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="p-4 border rounded-lg bg-slate-50 border-slate-200 space-y-3">
                    <h4 className="font-semibold text-slate-900 text-sm">
                      {t("admin.disputes.detail.release.overrideHeading")}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {t("admin.disputes.detail.release.overrideHint")}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="space-y-1">
                        <Label htmlFor="payout-bank" className="text-xs">
                          {t("admin.disputes.detail.release.bankName")}
                        </Label>
                        <Input
                          id="payout-bank"
                          value={payoutBankName}
                          onChange={(e) => setPayoutBankName(e.target.value)}
                          placeholder={t(
                            "admin.disputes.detail.release.placeholderBank"
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="payout-acct" className="text-xs">
                          {t("admin.disputes.detail.release.accountNumber")}
                        </Label>
                        <Input
                          id="payout-acct"
                          value={payoutAccountNumber}
                          onChange={(e) =>
                            setPayoutAccountNumber(e.target.value)
                          }
                          placeholder={t(
                            "admin.disputes.detail.release.placeholderAccount"
                          )}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="payout-holder" className="text-xs">
                          {t("admin.disputes.detail.release.accountHolder")}
                        </Label>
                        <Input
                          id="payout-holder"
                          value={payoutAccountName}
                          onChange={(e) => setPayoutAccountName(e.target.value)}
                          placeholder={t(
                            "admin.disputes.detail.release.placeholderHolder"
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Provider Payout Method Info */}
                  <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-900">
                        {t("admin.disputes.detail.payout.title")}
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
                          {t("admin.disputes.detail.payout.messageProvider")}
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
                                    t("admin.disputes.detail.payout.bankAccount"),
                                  subtitle: method.accountNumber
                                    ? t(
                                        "admin.disputes.detail.payout.accountLine",
                                        { number: method.accountNumber }
                                      )
                                    : t(
                                        "admin.disputes.detail.payout.noAccountNumber"
                                      ),
                                  details: method.accountHolder
                                    ? t(
                                        "admin.disputes.detail.payout.holderLine",
                                        { name: method.accountHolder }
                                      )
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
                              {t("admin.disputes.detail.payout.noMethodsTitle")}
                            </p>
                            <p className="text-xs text-yellow-700 mt-1">
                              {t("admin.disputes.detail.payout.noMethodsBody")}
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
                                {t("admin.disputes.detail.payout.promptAddMethod")}
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
                          alt={t("admin.disputes.detail.release.bankImageAlt")}
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
                                  title: t(
                                    "admin.disputes.toast.invalidFileTypeTitle"
                                  ),
                                  description: t(
                                    "admin.disputes.toast.invalidFileTypeDesc"
                                  ),
                                  variant: "destructive",
                                });
                                return;
                              }
                              if (file.size > 5 * 1024 * 1024) {
                                toast({
                                  title: t(
                                    "admin.disputes.toast.fileTooLargeTitle"
                                  ),
                                  description: t(
                                    "admin.disputes.toast.fileTooLargeDesc"
                                  ),
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
                            {t("admin.disputes.detail.upload.cta")}
                          </span>
                          <span className="text-xs text-gray-500 mt-1">
                            {t("admin.disputes.detail.upload.formats")}
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
                              title: t(
                                "admin.disputes.toast.imageRequiredTitle"
                              ),
                              description: t(
                                "admin.disputes.toast.uploadBankImage"
                              ),
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
                          {t("admin.disputes.detail.processing")}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {t("admin.disputes.detail.release.submit")}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              <div className="p-4 border border-dashed rounded-lg border-amber-300 bg-amber-50/60 space-y-3">
                <h4 className="font-semibold text-amber-950">
                  {t("admin.disputes.detail.manual.title")}
                </h4>
                <p className="text-sm text-amber-900/90">
                  {t("admin.disputes.detail.manual.body")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="manual-summary">
                    {t("admin.disputes.detail.manual.summary")}
                  </Label>
                  <textarea
                    id="manual-summary"
                    value={manualSummary}
                    onChange={(e) => setManualSummary(e.target.value)}
                    placeholder={t(
                      "admin.disputes.detail.manual.summaryPlaceholder"
                    )}
                    className="w-full p-3 border rounded-md min-h-[72px] text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-customer">
                    {t("admin.disputes.detail.manual.customerNote")}
                  </Label>
                  <textarea
                    id="manual-customer"
                    value={manualCustomerNote}
                    onChange={(e) => setManualCustomerNote(e.target.value)}
                    placeholder={t(
                      "admin.disputes.detail.manual.customerPlaceholder"
                    )}
                    className="w-full p-3 border rounded-md min-h-[64px] text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-provider">
                    {t("admin.disputes.detail.manual.providerNote")}
                  </Label>
                  <textarea
                    id="manual-provider"
                    value={manualProviderNote}
                    onChange={(e) => setManualProviderNote(e.target.value)}
                    placeholder={t(
                      "admin.disputes.detail.manual.providerPlaceholder"
                    )}
                    className="w-full p-3 border rounded-md min-h-[64px] text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-amber-400 text-amber-950 hover:bg-amber-100"
                  disabled={actionLoading}
                  onClick={handleManualResolve}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t("admin.disputes.detail.manual.saving")}
                    </>
                  ) : (
                    t("admin.disputes.detail.manual.record")
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

