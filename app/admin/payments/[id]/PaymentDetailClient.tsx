"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCircle2,
  Building2,
  User,
  CreditCard,
  MessageSquare,
  Loader2,
  AlertCircle,
  ExternalLink,
  FolderOpen,
  Upload,
  FileText,
  X,
  Receipt,
} from "lucide-react";
import {
  getAdminPaymentById,
  confirmAdminBankTransfer,
  getProfileImageUrl,
} from "@/lib/api";
import { API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";
import { convertWithSnapshot, type FxRatesMap } from "@/lib/fx-snapshot";
import { useI18n } from "@/contexts/I18nProvider";
import {
  milestoneStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/components/admin/payments/payment-i18n-maps";

type PaymentDetail = {
  id: string;
  amount: number;
  currency: string;
  platformFeeAmount: number;
  providerAmount: number;
  method: string;
  status: string;
  createdAt: string;
  escrowedAt?: string;
  releasedAt?: string;
  bankTransferStatus?: string;
  bankTransferRef?: string;
  metadata?: Record<string, unknown>;
  project: {
    id: string;
    title: string;
    description: string;
    currencyCode?: string;
    fxSnapshotRatesJson?: FxRatesMap | null;
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      isVerified?: boolean;
      kycStatus?: string;
      customerProfile?: {
        profileImageUrl?: string;
        industry?: string;
        location?: string;
        companySize?: string;
        website?: string;
      };
      settings?: {
        showEmail: boolean;
        showPhone: boolean;
        allowMessages: boolean;
        preferredCurrency?: string;
      };
    };
    provider: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      isVerified?: boolean;
      kycStatus?: string;
      providerProfile?: {
        profileImageUrl?: string;
        major?: string;
        location?: string;
        hourlyRate?: number;
        website?: string;
        payoutMethods?: Array<{
          id: string;
          type: string;
          label?: string;
          bankName?: string;
          accountNumber?: string;
          accountHolder?: string;
          accountEmail?: string;
          walletId?: string;
        }>;
      };
      settings?: {
        showEmail: boolean;
        showPhone: boolean;
        allowMessages: boolean;
        preferredCurrency?: string;
      };
    };
  };
  milestone: {
    id: string;
    title: string;
    description: string;
    amount: number;
    status: string;
    dueDate?: string;
  };
  Invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
  };
};

export default function PaymentDetailClient({
  paymentId,
}: {
  paymentId: string;
}) {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const intlLocale =
    locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US";
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [transferRef, setTransferRef] = useState("");
  const [transferProofFile, setTransferProofFile] = useState<File | null>(null);
  const [transferProofPreview, setTransferProofPreview] = useState<
    string | null
  >(null);
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPayment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminPaymentById(paymentId);
      if (response.success) {
        setPayment(response.data);
      }
    } catch (error: unknown) {
      console.error("Failed to fetch payment:", error);
      toast({
        title: t("admin.users.toast.errorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("admin.payments.detail.toast.loadFailed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [paymentId, t, toast]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      const validExtensions = [
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
      ];
      const fileExt = "." + file.name.split(".").pop()?.toLowerCase();

      if (
        !validTypes.includes(file.type) &&
        !validExtensions.includes(fileExt)
      ) {
        toast({
          title: t("admin.users.toast.errorTitle"),
          description: t("admin.payments.detail.alert.invalidFile"),
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: t("admin.users.toast.errorTitle"),
          description: t("admin.payments.detail.alert.fileTooLarge"),
          variant: "destructive",
        });
        return;
      }

      setTransferProofFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setTransferProofPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setTransferProofPreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setTransferProofFile(null);
    setTransferProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmTransfer = async () => {
    // Check if payout methods exist
    if (
      !payment?.project?.provider?.providerProfile?.payoutMethods ||
      payment.project.provider.providerProfile.payoutMethods.length === 0
    ) {
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: t("admin.payments.detail.alert.noPayoutMethod"),
        variant: "destructive",
      });
      return;
    }

    if (!transferRef.trim() && !transferProofFile) {
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: t("admin.payments.detail.alert.refOrProofRequired"),
        variant: "destructive",
      });
      return;
    }

    try {
      setConfirming(true);
      const response = await confirmAdminBankTransfer(
        paymentId,
        transferRef.trim() || "",
        transferProofFile,
      );
      if (response.success) {
        toast({
          title: t("admin.payments.detail.toast.successTitle"),
          description: t("admin.payments.detail.toast.confirmSuccess"),
        });
        setShowConfirmDialog(false);
        setTransferRef("");
        setTransferProofFile(null);
        setTransferProofPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchPayment(); // Refresh payment data
      }
    } catch (error: unknown) {
      console.error("Failed to confirm transfer:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("admin.payments.detail.toast.confirmFailed");
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setConfirming(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowConfirmDialog(false);
      setTransferRef("");
      setTransferProofFile(null);
      setTransferProofPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      setShowConfirmDialog(true);
    }
  };

  const isReadyToTransfer =
    payment?.status === "ESCROWED" && payment?.milestone?.status === "APPROVED";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(intlLocale, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMoney = (amount: number, currency?: string) => {
    const code = String(currency || "MYR")
      .trim()
      .toUpperCase();
    try {
      return new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: code,
      }).format(Number(amount || 0));
    } catch {
      return `${code} ${Number(amount || 0).toLocaleString(intlLocale)}`;
    }
  };

  /** Charged / settlement currency: payment row (synced from Stripe on escrow) beats project default. */
  const originalCurrency = (
    payment?.currency ||
    payment?.project?.currencyCode ||
    "MYR"
  )
    .toString()
    .trim()
    .toUpperCase();
  const providerCurrency = (
    payment?.project?.provider?.settings?.preferredCurrency ||
    originalCurrency ||
    "MYR"
  )
    .toString()
    .trim()
    .toUpperCase();
  const providerReceiveInProviderCurrency =
    payment && providerCurrency !== originalCurrency
      ? convertWithSnapshot({
          amount: Number(payment.providerAmount || 0),
          fromCurrencyCode: originalCurrency,
          toCurrencyCode: providerCurrency,
          ratesMap: payment.project?.fxSnapshotRatesJson ?? null,
        })
      : null;
  const isCustomerVerified =
    payment?.project?.customer?.isVerified === true ||
    String(payment?.project?.customer?.kycStatus || "").toLowerCase() ===
      "verified";
  const isProviderVerified =
    payment?.project?.provider?.isVerified === true ||
    String(payment?.project?.provider?.kycStatus || "").toLowerCase() ===
      "verified";

  const handleDownloadReceipt = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : undefined;
      if (!token) {
        toast({
          title: t("admin.users.toast.errorTitle"),
          description: t("admin.payments.detail.toast.notAuthenticated"),
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(
        `${API_BASE}/admin/payments/${paymentId}/receipt?lang=${encodeURIComponent(locale)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            t("admin.payments.detail.toast.receiptUrlFailed"),
        );
      }

      const data = await res.json();

      if (data.success && data.downloadUrl) {
        // Navigate to the R2 URL (opens in new tab/window)
        window.open(data.downloadUrl, "_blank");
      } else {
        throw new Error(
          t("admin.payments.detail.toast.invalidReceiptResponse"),
        );
      }
    } catch (error: unknown) {
      console.error(error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : t("admin.payments.detail.toast.receiptFailed");
      toast({
        title: t("admin.payments.detail.toast.receiptErrorTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">
          {t("admin.payments.detail.loading")}
        </span>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {t("admin.payments.detail.notFoundTitle")}
        </h2>
        <p className="text-gray-600 mb-4">
          {t("admin.payments.detail.notFoundBody")}
        </p>
        <Button onClick={() => router.push("/admin/payments")}>
          {t("admin.payments.detail.backToList")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/payments")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("admin.payments.detail.headerTitle")}
            </h1>
            <p className="text-gray-600">
              {t("admin.payments.detail.transactionId", {
                id: payment.id.slice(0, 8),
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadReceipt}>
            <Receipt className="w-4 h-4 mr-2" />
            {t("admin.payments.detail.downloadReceipt")}
          </Button>
          {isReadyToTransfer && (
            <Button
              onClick={() => setShowConfirmDialog(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {t("admin.payments.detail.confirmBankTransfer")}
            </Button>
          )}
        </div>
      </div>

      {/* Ready to Transfer Alert */}
      {isReadyToTransfer && (
        <>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">
                    {t("admin.payments.detail.readyBanner.title")}
                  </p>
                  <p className="text-sm text-blue-700">
                    {t("admin.payments.detail.readyBanner.body")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payout Method Info for Transfer */}
          {payment.project.provider.providerProfile?.payoutMethods &&
          payment.project.provider.providerProfile.payoutMethods.length > 0 ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <CreditCard className="w-5 h-5" />
                  {t("admin.payments.detail.transferCard.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payment.project.provider.providerProfile.payoutMethods.map(
                    (method, index) => (
                      <div
                        key={method.id}
                        className="p-4 bg-white rounded-lg border-2 border-green-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-green-600 text-white">
                            {method.type}
                          </Badge>
                          {method.label && (
                            <p className="text-sm font-semibold text-gray-900">
                              {method.label}
                            </p>
                          )}
                        </div>
                        {method.bankName && (
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-gray-500">
                                  {t("admin.payments.detail.field.bankName")}
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {method.bankName}
                                </p>
                              </div>
                              {method.accountNumber && (
                                <div>
                                  <p className="text-gray-500">
                                    {t(
                                      "admin.payments.detail.field.accountNumber",
                                    )}
                                  </p>
                                  <p className="font-semibold text-gray-900 font-mono">
                                    {method.accountNumber}
                                  </p>
                                </div>
                              )}
                              {method.accountHolder && (
                                <div>
                                  <p className="text-gray-500">
                                    {t(
                                      "admin.payments.detail.field.accountHolder",
                                    )}
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {method.accountHolder}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {method.accountEmail && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-sm">
                              {t("admin.payments.detail.field.email")}
                            </p>
                            <p className="font-semibold text-gray-900">
                              {method.accountEmail}
                            </p>
                          </div>
                        )}
                        {method.walletId && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-sm">
                              {t("admin.payments.detail.field.walletId")}
                            </p>
                            <p className="font-semibold text-gray-900 font-mono">
                              {method.walletId}
                            </p>
                          </div>
                        )}
                        {payment.project.provider.providerProfile
                          ?.payoutMethods &&
                          payment.project.provider.providerProfile.payoutMethods
                            .length > 1 &&
                          index === 0 && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              {t("admin.payments.detail.payoutMultipleNote")}
                            </p>
                          )}
                      </div>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900 mb-1">
                      {t("admin.payments.detail.noPayoutTitle")}
                    </p>
                    <p className="text-sm text-orange-700 mb-3">
                      {t("admin.payments.detail.noPayoutBody")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const avatar = getProfileImageUrl(
                          payment.project.provider.providerProfile
                            ?.profileImageUrl,
                        );
                        router.push(
                          `/admin/messages?userId=${
                            payment.project.provider.id
                          }&name=${encodeURIComponent(
                            payment.project.provider.name,
                          )}&avatar=${encodeURIComponent(avatar)}&projectId=${
                            payment.project.id
                          }&paymentId=${payment.id}`,
                        );
                      }}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t("admin.payments.detail.contactProvider")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("admin.payments.detail.paymentInfo.title")}
              </CardTitle>
              <CardDescription>
                {t("admin.payments.detail.paymentInfo.description")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    {t("admin.payments.detail.field.amount")}
                  </p>
                  <p className="text-2xl font-bold">
                    {formatMoney(payment.amount, originalCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("admin.payments.detail.field.status")}
                  </p>
                  <Badge
                    className={
                      payment.status === "TRANSFERRED"
                        ? "bg-green-100 text-green-800"
                        : payment.status === "ESCROWED"
                          ? "bg-blue-100 text-blue-800"
                          : payment.status === "RELEASED"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                    }
                  >
                    {paymentStatusLabel(payment.status, t)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("admin.payments.detail.field.platformFee")}
                  </p>
                  <p className="text-lg font-semibold">
                    {formatMoney(payment.platformFeeAmount, originalCurrency)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("admin.payments.detail.field.providerAmount")}
                  </p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatMoney(payment.providerAmount, originalCurrency)}
                  </p>
                  {providerReceiveInProviderCurrency != null && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t("admin.payments.detail.providerReceives", {
                        amount: formatMoney(
                          providerReceiveInProviderCurrency,
                          providerCurrency,
                        ),
                      })}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("admin.payments.detail.field.paymentMethod")}
                  </p>
                  <p className="text-lg">
                    {paymentMethodLabel(payment.method, t)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("admin.payments.detail.field.createdAt")}
                  </p>
                  <p className="text-sm">{formatDate(payment.createdAt)}</p>
                </div>
                {payment.escrowedAt && (
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("admin.payments.detail.field.escrowedAt")}
                    </p>
                    <p className="text-sm">{formatDate(payment.escrowedAt)}</p>
                  </div>
                )}
                {payment.releasedAt && (
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("admin.payments.detail.field.releasedAt")}
                    </p>
                    <p className="text-sm">{formatDate(payment.releasedAt)}</p>
                  </div>
                )}
                {payment.bankTransferRef && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      {t("admin.payments.detail.field.transferRefProof")}
                    </p>
                    {payment.bankTransferRef.startsWith("http://") ||
                    payment.bankTransferRef.startsWith("https://") ? (
                      <a
                        href={payment.bankTransferRef}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {t("admin.payments.detail.viewFile")}
                        </Button>
                      </a>
                    ) : (
                      <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border">
                        {payment.bankTransferRef}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  {t("admin.payments.detail.project.title")}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/admin/projects/${payment.project.id}`)
                  }
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  {t("admin.payments.detail.project.viewProject")}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">
                  {t("admin.payments.detail.project.projectTitle")}
                </p>
                <p className="text-lg font-semibold">{payment.project.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {t("admin.payments.detail.project.description")}
                </p>
                <p className="text-sm">{payment.project.description}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500">
                  {t("admin.payments.detail.project.milestone")}
                </p>
                <p className="text-lg font-semibold">
                  {payment.milestone.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {payment.milestone.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge
                    className={
                      payment.milestone.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {milestoneStatusLabel(payment.milestone.status, t)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {t("admin.payments.detail.project.amountLine", {
                      amount: formatMoney(
                        payment.milestone.amount,
                        originalCurrency,
                      ),
                    })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messaging Section */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
              <CardDescription>
                Communicate with customer or provider about this payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendingMessage}
                  className="flex-1"
                >
                  {sendingMessage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Navigate to messages with project context
                    // Try to find a conversation with either customer or provider
                    const targetUserId =
                      payment.project.customer?.id ||
                      payment.project.provider?.id;
                    if (targetUserId) {
                      router.push(
                        `/admin/messages?userId=${targetUserId}&projectId=${payment.project.id}&paymentId=${payment.id}`
                      );
                    } else {
                      router.push(
                        `/admin/messages?projectId=${payment.project.id}&paymentId=${payment.id}`
                      );
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Messages
                </Button>
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  {t("admin.payments.detail.customer.title")}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const avatar = getProfileImageUrl(
                        payment.project.customer.customerProfile
                          ?.profileImageUrl,
                      );
                      router.push(
                        `/admin/messages?userId=${
                          payment.project.customer.id
                        }&name=${encodeURIComponent(
                          payment.project.customer.name,
                        )}&avatar=${encodeURIComponent(avatar)}&projectId=${
                          payment.project.id
                        }&paymentId=${payment.id}`,
                      );
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t("admin.payments.detail.contact")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/users/${payment.project.customer.id}`)
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t("admin.payments.detail.viewProfile")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={getProfileImageUrl(
                      payment.project.customer.customerProfile?.profileImageUrl,
                    )}
                  />
                  <AvatarFallback>
                    {payment.project.customer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {payment.project.customer.name}
                  </p>
                  <div className="mt-1">
                    <Badge
                      className={
                        isCustomerVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      {isCustomerVerified
                        ? t("admin.payments.detail.verifiedCustomer")
                        : t("admin.payments.detail.unverifiedCustomer")}
                    </Badge>
                  </div>
                  {payment.project.customer.customerProfile?.industry && (
                    <p className="text-sm text-gray-500">
                      {payment.project.customer.customerProfile.industry}
                    </p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                {payment.project.customer.settings?.showEmail && (
                  <div>
                    <p className="text-gray-500">
                      {t("admin.payments.detail.field.email")}
                    </p>
                    <p className="font-medium">
                      {payment.project.customer.email}
                    </p>
                  </div>
                )}
                {payment.project.customer.settings?.showPhone &&
                  payment.project.customer.phone && (
                    <div>
                      <p className="text-gray-500">
                        {t("admin.payments.detail.field.phone")}
                      </p>
                      <p className="font-medium">
                        {payment.project.customer.phone}
                      </p>
                    </div>
                  )}
                {payment.project.customer.customerProfile?.location && (
                  <div>
                    <p className="text-gray-500">
                      {t("admin.payments.detail.field.location")}
                    </p>
                    <p className="font-medium">
                      {payment.project.customer.customerProfile.location}
                    </p>
                  </div>
                )}
                {payment.project.customer.customerProfile?.website && (
                  <div>
                    <p className="text-gray-500">
                      {t("admin.payments.detail.field.website")}
                    </p>
                    <a
                      href={payment.project.customer.customerProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {payment.project.customer.customerProfile.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Provider Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t("admin.payments.detail.provider.title")}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const avatar =
                        payment.project.provider.providerProfile
                          ?.profileImageUrl || "";
                      router.push(
                        `/admin/messages?userId=${
                          payment.project.provider.id
                        }&name=${encodeURIComponent(
                          payment.project.provider.name,
                        )}&avatar=${encodeURIComponent(avatar)}&projectId=${
                          payment.project.id
                        }&paymentId=${payment.id}`,
                      );
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t("admin.payments.detail.contact")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/users/${payment.project.provider.id}`)
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t("admin.payments.detail.viewProfile")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={getProfileImageUrl(
                      payment.project.provider.providerProfile?.profileImageUrl,
                    )}
                  />
                  <AvatarFallback>
                    {payment.project.provider.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {payment.project.provider.name}
                  </p>
                  <div className="mt-1">
                    <Badge
                      className={
                        isProviderVerified
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      {isProviderVerified
                        ? t("admin.payments.detail.verifiedProvider")
                        : t("admin.payments.detail.unverifiedProvider")}
                    </Badge>
                  </div>
                  {payment.project.provider.providerProfile?.major && (
                    <p className="text-sm text-gray-500">
                      {payment.project.provider.providerProfile.major}
                    </p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                {payment.project.provider.settings?.showEmail && (
                  <div>
                    <p className="text-gray-500">
                      {t("admin.payments.detail.field.email")}
                    </p>
                    <p className="font-medium">
                      {payment.project.provider.email}
                    </p>
                  </div>
                )}
                {payment.project.provider.settings?.showPhone &&
                  payment.project.provider.phone && (
                    <div>
                      <p className="text-gray-500">
                        {t("admin.payments.detail.field.phone")}
                      </p>
                      <p className="font-medium">
                        {payment.project.provider.phone}
                      </p>
                    </div>
                  )}
                {payment.project.provider.providerProfile?.location && (
                  <div>
                    <p className="text-gray-500">
                      {t("admin.payments.detail.field.location")}
                    </p>
                    <p className="font-medium">
                      {payment.project.provider.providerProfile.location}
                    </p>
                  </div>
                )}
                {typeof payment.project.provider.providerProfile?.hourlyRate ===
                  "number" && (
                  <div>
                    <p className="text-gray-500">
                      {t("admin.payments.detail.field.hourlyRate")}
                    </p>
                    <p className="font-medium">
                      {formatMoney(
                        payment.project.provider.providerProfile.hourlyRate,
                        providerCurrency,
                      )}
                      {t("admin.payments.detail.perHour")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payout Methods (Always show for reference) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                {t("admin.payments.detail.payoutMethods.title")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payment.project.provider.providerProfile?.payoutMethods &&
              payment.project.provider.providerProfile.payoutMethods.length >
                0 ? (
                <div className="space-y-3">
                  {payment.project.provider.providerProfile.payoutMethods.map(
                    (method) => (
                      <div key={method.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{method.type}</Badge>
                          {method.label && (
                            <p className="text-sm font-medium">
                              {method.label}
                            </p>
                          )}
                        </div>
                        {method.bankName && (
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-500">
                              {t(
                                "admin.payments.detail.payoutMethods.bankLine",
                                {
                                  name: method.bankName,
                                },
                              )}
                            </p>
                            {method.accountNumber && (
                              <p className="text-gray-500">
                                {t(
                                  "admin.payments.detail.payoutMethods.accountLine",
                                  { number: method.accountNumber },
                                )}
                              </p>
                            )}
                            {method.accountHolder && (
                              <p className="text-gray-500">
                                {t(
                                  "admin.payments.detail.payoutMethods.holderLine",
                                  { name: method.accountHolder },
                                )}
                              </p>
                            )}
                          </div>
                        )}
                        {method.accountEmail && (
                          <p className="text-sm text-gray-500">
                            {t(
                              "admin.payments.detail.payoutMethods.emailLine",
                              {
                                email: method.accountEmail,
                              },
                            )}
                          </p>
                        )}
                        {method.walletId && (
                          <p className="text-sm text-gray-500">
                            {t(
                              "admin.payments.detail.payoutMethods.walletLine",
                              {
                                id: method.walletId,
                              },
                            )}
                          </p>
                        )}
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">
                    {t("admin.payments.detail.payoutMethods.none")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const avatar =
                        payment.project.provider.providerProfile
                          ?.profileImageUrl || "";
                      router.push(
                        `/admin/messages?userId=${
                          payment.project.provider.id
                        }&name=${encodeURIComponent(
                          payment.project.provider.name,
                        )}&avatar=${encodeURIComponent(avatar)}&projectId=${
                          payment.project.id
                        }&paymentId=${payment.id}`,
                      );
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    {t("admin.payments.detail.contactProvider")}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Transfer Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-xl">
              {t("admin.payments.detail.dialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.payments.detail.dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 px-6 overflow-y-auto flex-1">
            {/* Amount Info */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    {t("admin.payments.detail.dialog.amountToTransfer")}
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    {formatMoney(payment.providerAmount, originalCurrency)}
                  </p>
                  {providerReceiveInProviderCurrency != null && (
                    <p className="text-xs text-blue-800 mt-1">
                      {t("admin.payments.detail.dialog.providerCurrency", {
                        amount: formatMoney(
                          providerReceiveInProviderCurrency,
                          providerCurrency,
                        ),
                      })}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-700">
                    {t("admin.payments.detail.dialog.paymentId")}
                  </p>
                  <p className="text-xs font-mono text-blue-900">
                    {payment.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Payout Methods */}
            {payment.project.provider.providerProfile?.payoutMethods &&
            payment.project.provider.providerProfile.payoutMethods.length >
              0 ? (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  {t("admin.payments.detail.dialog.transferToLabel")}
                </label>
                <div className="space-y-3">
                  {payment.project.provider.providerProfile.payoutMethods.map(
                    (method) => (
                      <div
                        key={method.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-green-600 text-white">
                            {method.type}
                          </Badge>
                          {method.label && (
                            <p className="text-sm font-semibold text-gray-900">
                              {method.label}
                            </p>
                          )}
                        </div>
                        {method.bankName && (
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-gray-500">
                                  {t("admin.payments.detail.field.bankName")}
                                </p>
                                <p className="font-semibold text-gray-900">
                                  {method.bankName}
                                </p>
                              </div>
                              {method.accountNumber && (
                                <div>
                                  <p className="text-gray-500">
                                    {t(
                                      "admin.payments.detail.field.accountNumber",
                                    )}
                                  </p>
                                  <p className="font-semibold text-gray-900 font-mono">
                                    {method.accountNumber}
                                  </p>
                                </div>
                              )}
                              {method.accountHolder && (
                                <div className="col-span-2">
                                  <p className="text-gray-500">
                                    {t(
                                      "admin.payments.detail.field.accountHolder",
                                    )}
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {method.accountHolder}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {method.accountEmail && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-sm">
                              {t("admin.payments.detail.field.email")}
                            </p>
                            <p className="font-semibold text-gray-900">
                              {method.accountEmail}
                            </p>
                          </div>
                        )}
                        {method.walletId && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-sm">
                              {t("admin.payments.detail.field.walletId")}
                            </p>
                            <p className="font-semibold text-gray-900 font-mono">
                              {method.walletId}
                            </p>
                          </div>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900 mb-1">
                      {t("admin.payments.detail.dialog.noPayoutInDialogTitle")}
                    </p>
                    <p className="text-sm text-orange-700 mb-3">
                      {t("admin.payments.detail.dialog.noPayoutInDialogBody")}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const avatar = getProfileImageUrl(
                          payment.project.provider.providerProfile
                            ?.profileImageUrl,
                        );
                        router.push(
                          `/admin/messages?userId=${
                            payment.project.provider.id
                          }&name=${encodeURIComponent(
                            payment.project.provider.name,
                          )}&avatar=${encodeURIComponent(avatar)}&projectId=${
                            payment.project.id
                          }&paymentId=${payment.id}`,
                        );
                        setShowConfirmDialog(false);
                      }}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {t("admin.payments.detail.contactProvider")}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Reference */}
            <div>
              <label
                htmlFor="transferRef"
                className="text-sm font-medium mb-2 block"
              >
                {t("admin.payments.detail.dialog.transferRefLabel")}
              </label>
              <Input
                id="transferRef"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                placeholder={t(
                  "admin.payments.detail.dialog.transferRefPlaceholder",
                )}
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                {t("admin.payments.detail.dialog.transferRefHint")}
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label
                htmlFor="transferProof"
                className="text-sm font-medium mb-2 block"
              >
                {t("admin.payments.detail.dialog.uploadProofLabel")}
              </label>
              <div className="space-y-3">
                {!transferProofFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      {t("admin.payments.detail.dialog.uploadCta")}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t("admin.payments.detail.dialog.uploadFormats")}
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {transferProofPreview ? (
                          <div className="w-16 h-16 rounded border overflow-hidden">
                            <Image
                              src={transferProofPreview}
                              alt={t("admin.payments.detail.dialog.previewAlt")}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded border flex items-center justify-center bg-gray-50">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transferProofFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(transferProofFile.size / 1024 / 1024).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="transferProof"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,application/pdf,image/*"
                  onChange={handleFileSelect}
                />
                {transferProofFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {t("admin.payments.detail.dialog.changeFile")}
                  </Button>
                )}
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>{t("admin.payments.detail.dialog.noteTitle")}</strong>{" "}
                {t("admin.payments.detail.dialog.noteBody")}
              </p>
              <p className="text-xs text-gray-600 mt-2">
                <strong>
                  {t("admin.payments.detail.dialog.complianceTitle")}
                </strong>{" "}
                {t("admin.payments.detail.dialog.complianceBody")}
              </p>
              {!isProviderVerified && (
                <p className="text-xs text-amber-700 mt-1">
                  {t("admin.payments.detail.dialog.providerUnverified")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={confirming}
            >
              {t("admin.payments.detail.dialog.cancel")}
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              disabled={
                (!transferRef.trim() && !transferProofFile) ||
                confirming ||
                !payment.project.provider.providerProfile?.payoutMethods ||
                payment.project.provider.providerProfile.payoutMethods
                  .length === 0
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("admin.payments.detail.dialog.confirming")}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t("admin.payments.detail.dialog.confirm")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
