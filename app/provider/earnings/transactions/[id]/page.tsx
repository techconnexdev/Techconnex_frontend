"use client";
import { useRouter, useParams } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, API_BASE } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useI18n } from "@/contexts/I18nProvider";
import { convertWithSnapshot, type FxRatesMap } from "@/lib/fx-snapshot";

type Transaction = {
  id: string;
  stripePaymentIntentId: string;
  status: string;
  createdAt: string;
  providerAmount: number;
  amount: number;
  platformFeeAmount: number;
  currency?: string;
  method: string;
  bankTransferRef?: string;
  timeline?: Array<{ status: string; timestamp: string }>;
  project: {
    title: string;
    currencyCode?: string;
    fxSnapshotRatesJson?: FxRatesMap | null;
    provider: {
      name: string;
      email: string;
      phone: string;
      settings?: {
        preferredCurrency?: string;
      };
      providerProfile?: {
        location?: string;
      };
    };
    customer: {
      name: string;
      email: string;
      phone: string;
      customerProfile?: {
        location?: string;
      };
    };
  };
  milestone: {
    title: string;
    amount?: number;
  };
};

export default function TransactionDetailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const dateLocale =
    locale === "id" ? "id-ID" : locale === "ar" ? "ar" : undefined;
  const { id } = useParams();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const json = await apiFetch(`/provider/earnings/${id}`);
        setTransaction(json.data);
      } catch (e: unknown) {
        const friendlyMessage = getUserFriendlyErrorMessage(
          e,
          "provider earnings transaction",
        );
        setError(friendlyMessage);
        toast({
          title: t("provider.earnings.toast.errorTitle"),
          description: friendlyMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast, t]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh] text-muted-foreground">
        {t("provider.earnings.transaction.loading")}
      </div>
    );
  }
  if (error) {
    return <div className="text-red-600 px-4">{error}</div>;
  }
  if (!transaction) {
    return (
      <div className="text-muted-foreground px-4">
        {t("provider.earnings.transaction.notFound")}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTimelineMessage = (status: string) => {
    const upper = status.toUpperCase();
    switch (upper) {
      case "ESCROW":
        return t("provider.earnings.transaction.timeline.ESCROW");
      case "TRANSFERRED":
        return t("provider.earnings.transaction.timeline.TRANSFERRED");
      case "PENDING":
        return t("provider.earnings.transaction.timeline.PENDING");
      case "IN_PROGRESS":
        return t("provider.earnings.transaction.timeline.IN_PROGRESS");
      case "RELEASED":
        return t("provider.earnings.transaction.timeline.RELEASED");
      case "REFUNDED":
        return t("provider.earnings.transaction.timeline.REFUNDED");
      case "FAILED":
        return t("provider.earnings.transaction.timeline.FAILED");
      default:
        return status;
    }
  };

  const formatTransactionStatus = (status: string) => {
    const lower = status.toLowerCase();
    switch (lower) {
      case "completed":
        return t("provider.earnings.transaction.status.completed");
      case "pending":
        return t("provider.earnings.transaction.status.pending");
      case "processing":
      case "in_progress":
        return t("provider.earnings.transaction.status.processing");
      case "failed":
        return t("provider.earnings.transaction.status.failed");
      case "released":
        return t("provider.earnings.transaction.status.released");
      case "transferred":
        return t("provider.earnings.transaction.status.transferred");
      default:
        return status;
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : undefined;
      if (!token) {
        toast({
          title: t("provider.earnings.toast.errorTitle"),
          description: t("provider.earnings.transaction.toast.notAuth"),
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(
        `${API_BASE}/provider/earnings/${id}/receipt?lang=${encodeURIComponent(locale)}`,
        {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to get receipt URL");
      }

      const data = await res.json();

      if (data.success && data.downloadUrl) {
        // Navigate to the R2 URL (opens in new tab/window)
        window.open(data.downloadUrl, "_blank");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (e: unknown) {
      toast({
        title: t("provider.earnings.transaction.toast.receiptErrorTitle"),
        description: getUserFriendlyErrorMessage(
          e,
          "provider earnings receipt",
        ),
        variant: "destructive",
      });
    }
  };

  const formatMoney = (amount: number, currency = "MYR") => {
    const code = String(currency || "MYR").toUpperCase();
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: code,
      }).format(Number(amount || 0));
    } catch {
      return `${code} ${Number(amount || 0).toLocaleString()}`;
    }
  };

  const originalCurrency = String(
    transaction.project?.currencyCode || transaction.currency || "MYR",
  ).toUpperCase();
  const preferredCurrency = String(
    transaction.project?.provider?.settings?.preferredCurrency ||
      originalCurrency ||
      "MYR",
  ).toUpperCase();
  const toPreferred = (amount: number) => {
    if (preferredCurrency === originalCurrency) return null;
    return convertWithSnapshot({
      amount: Number(amount || 0),
      fromCurrencyCode: originalCurrency,
      toCurrencyCode: preferredCurrency,
      ratesMap: transaction.project?.fxSnapshotRatesJson ?? null,
    });
  };

  // Provider view: show provider-side processing fee (5%), not total platform fee (10%).
  const providerProcessingFee = Number(
    (Number(transaction.platformFeeAmount || 0) / 2).toFixed(2),
  );
  const providerSubtotal = Number(
    Number.isFinite(Number(transaction.milestone?.amount))
      ? Number(Number(transaction.milestone?.amount).toFixed(2))
      : (
          Number(transaction.providerAmount || 0) + providerProcessingFee
        ).toFixed(2),
  );
  const providerTotalAmount = Number(
    (providerSubtotal - providerProcessingFee).toFixed(2),
  );

  // Derive timeline events: use provided timeline or fallback to current status
  const timelineEvents =
    transaction.timeline && transaction.timeline.length > 0
      ? transaction.timeline
      : [{ status: transaction.status, timestamp: transaction.createdAt }];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t("provider.earnings.transaction.title")}
            </h1>
            {/* <p className="text-gray-600">
                Transaction ID: {transaction.stripePaymentIntentId}
              </p> */}
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadReceipt}>
            <Receipt className="w-4 h-4 mr-2" />
            {t("provider.earnings.transaction.downloadReceipt")}
          </Button>
          {/* <Button variant="outline" onClick={handleDownloadInvoice}>
              <FileText className="w-4 h-4 mr-2" />
              Download Invoice
            </Button> */}
        </div>
      </div>

      {/* Status Card */}
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  {t("provider.earnings.transaction.amountLabel")}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatMoney(providerTotalAmount, originalCurrency)}
                </p>
                {toPreferred(providerTotalAmount) != null && (
                  <p className="text-xs text-gray-500 mt-1">
                    {formatMoney(
                      Number(toPreferred(providerTotalAmount)),
                      preferredCurrency,
                    )}
                  </p>
                )}
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(transaction.createdAt).toLocaleString(dateLocale)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <Badge
                className={`${getStatusColor(
                  transaction.status,
                )} text-lg px-4 py-2`}
              >
                {getStatusIcon(transaction.status)}
                <span className="ml-2 capitalize">
                  {formatTransactionStatus(transaction.status)}
                </span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Overview */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("provider.earnings.transaction.overviewTitle")}
              </CardTitle>
              <CardDescription>
                {t("provider.earnings.transaction.overviewDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* <div>
                    <p className="text-sm text-gray-500">Transaction Type</p>
                    <p className="font-medium capitalize">{transaction.type}</p>
                  </div> */}
                {/* <div>
                    <p className="text-sm text-gray-500">Reference Number</p>
                    <p className="font-medium">{transaction.id}</p>
                  </div> */}
                <div>
                  <p className="text-sm text-gray-500">
                    {t("provider.earnings.transaction.project")}
                  </p>
                  <p className="font-medium">{transaction.project.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("provider.earnings.transaction.milestone")}
                  </p>
                  <p className="font-medium">{transaction.milestone.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("provider.earnings.transaction.paymentStatus")}
                  </p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <p className="font-medium">
                      {formatTransactionStatus(transaction.status)}
                    </p>
                  </div>
                </div>
                {transaction.status === "TRANSFERRED" &&
                  transaction.bankTransferRef && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500 mb-1">
                        {t("provider.earnings.transaction.transferRef")}
                      </p>
                      {transaction.bankTransferRef.startsWith("http://") ||
                      transaction.bankTransferRef.startsWith("https://") ? (
                        <a
                          href={transaction.bankTransferRef}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            {t("provider.earnings.transaction.viewFile")}
                          </Button>
                        </a>
                      ) : (
                        <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border">
                          {transaction.bankTransferRef}
                        </p>
                      )}
                    </div>
                  )}

                {/* <div>
                    <p className="text-sm text-gray-500">Invoice Number</p>
                    <p className="font-medium">{transaction.id}</p>
                  </div> */}
              </div>
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("provider.earnings.transaction.breakdownTitle")}
              </CardTitle>
              <CardDescription>
                {t("provider.earnings.transaction.breakdownDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    {t("provider.earnings.transaction.subtotal")}
                  </span>
                  <span className="font-medium">
                    {formatMoney(providerSubtotal, originalCurrency)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    {t("provider.earnings.transaction.processingFee")}
                  </span>
                  <span className="font-medium">
                    {formatMoney(providerProcessingFee, originalCurrency)}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    {t("provider.earnings.transaction.tax")}
                  </span>
                  <span className="font-medium">
                    {formatMoney(0, originalCurrency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-lg font-semibold">
                    {t("provider.earnings.transaction.total")}
                  </span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-blue-600 block">
                      {formatMoney(providerTotalAmount, originalCurrency)}
                    </span>
                    {toPreferred(providerTotalAmount) != null && (
                      <span className="text-xs text-gray-500">
                        {formatMoney(
                          Number(toPreferred(providerTotalAmount)),
                          preferredCurrency,
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Details */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("provider.earnings.transaction.methodSectionTitle")}
              </CardTitle>
              <CardDescription>
                {t("provider.earnings.transaction.methodSectionDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <CreditCard className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium">{transaction.method}</p>
                  <p className="text-sm text-gray-500">
                    {t("provider.earnings.transaction.methodLabel")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("provider.earnings.transaction.timelineTitle")}
              </CardTitle>
              <CardDescription>
                {t("provider.earnings.transaction.timelineDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineEvents.map(
                  (
                    event: { status: string; timestamp: string },
                    index: number,
                  ) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.status === "completed"
                              ? "bg-green-100"
                              : event.status === "processing"
                                ? "bg-blue-100"
                                : "bg-gray-100"
                          }`}
                        >
                          {event.status === "completed" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        {index < timelineEvents.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="font-medium capitalize">
                          {getTimelineMessage(event.status)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString(dateLocale)}
                        </p>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Provider Information */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("provider.earnings.transaction.providerSectionTitle")}
              </CardTitle>
              <CardDescription>
                {t("provider.earnings.transaction.providerSectionDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {transaction.project.provider.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("provider.earnings.transaction.serviceProvider")}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                {/* <div className="flex items-start gap-2">
                    <Building className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="text-sm font-medium">
                        {transaction.project.provider.providerProfile
                          ?.company ||
                          transaction.project.provider.providerProfile
                            ?.businessName ||
                          ""}
                      </p>
                    </div>
                  </div> */}
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("provider.earnings.transaction.email")}
                    </p>
                    <p className="text-sm font-medium">
                      {transaction.project.provider.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("provider.earnings.transaction.phone")}
                    </p>
                    <p className="text-sm font-medium">
                      {transaction.project.provider.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("provider.earnings.transaction.address")}
                    </p>
                    <p className="text-sm font-medium">
                      {transaction.project.provider.providerProfile?.location ||
                        ""}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("provider.earnings.transaction.customerSectionTitle")}
              </CardTitle>
              <CardDescription>
                {t("provider.earnings.transaction.customerSectionDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">
                    {transaction.project.customer.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t("provider.earnings.transaction.customer")}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="space-y-3">
                {/* <div className="flex items-start gap-2">
                    <Building className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="text-sm font-medium">
                        {transaction.project.customer.customerProfile
                          ?.industry || ""}
                      </p>
                    </div>
                  </div> */}
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("provider.earnings.transaction.email")}
                    </p>
                    <p className="text-sm font-medium">
                      {transaction.project.customer.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("provider.earnings.transaction.phone")}
                    </p>
                    <p className="text-sm font-medium">
                      {transaction.project.customer.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">
                      {t("provider.earnings.transaction.address")}
                    </p>
                    <p className="text-sm font-medium">
                      {transaction.project.customer.customerProfile?.location ||
                        ""}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {/* <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={handleDownloadReceipt}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={handleDownloadInvoice}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as PDF
                </Button>
              </CardContent>
            </Card> */}
        </div>
      </div>
    </div>
  );
}
