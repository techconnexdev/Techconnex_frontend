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
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, API_BASE } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { convertWithSnapshot, type FxRatesMap } from "@/lib/fx-snapshot";

function getBillingStatusLabel(
  status: string,
  t: (key: MessageKey, vars?: Record<string, string | number>) => string,
): string {
  const s = status.toLowerCase().replace(/\s+/g, "_");
  const paymentKeys: Record<string, MessageKey> = {
    completed: "customer.payments.status.completed",
    pending: "customer.payments.status.pending",
    processing: "customer.payments.status.processing",
    failed: "customer.payments.status.failed",
  };
  const billingKeys: Record<string, MessageKey> = {
    paid: "customer.billing.status.paid",
    scheduled: "customer.billing.status.scheduled",
    overdue: "customer.billing.status.overdue",
    refunded: "customer.billing.status.refunded",
    approved: "customer.billing.status.approved",
  };
  if (paymentKeys[s]) return t(paymentKeys[s]);
  if (billingKeys[s]) return t(billingKeys[s]);
  return status.replace(/_/g, " ");
}

type Transaction = {
  id: string;
  stripePaymentIntentId: string;
  status: string;
  createdAt: string;
  amount: number;
  platformFeeAmount: number;
  currency?: string;
  method: string;
  timeline?: Array<{ status: string; timestamp: string }>;
  project: {
    title: string;
    currencyCode?: string;
    fxSnapshotRatesJson?: FxRatesMap | null;
    provider: {
      name: string;
      email: string;
      phone: string;
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
  const { id } = useParams();
  const { t, locale } = useI18n();
  const dateLocale =
    locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US";

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preferredCurrency, setPreferredCurrency] = useState("MYR");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (raw) {
        const parsed = JSON.parse(raw) as {
          settings?: { preferredCurrency?: string };
        };
        const code = String(parsed?.settings?.preferredCurrency || "")
          .trim()
          .toUpperCase();
        if (/^[A-Z]{3}$/.test(code)) setPreferredCurrency(code);
      }
    } catch {
      // ignore malformed local storage
    }

    if (!id) return;
    (async () => {
      try {
        const json = await apiFetch(`/company/billing/${id}`);
        setTransaction(json.data);
      } catch (e: unknown) {
        console.error(e);
        const errorMessage =
          e instanceof Error ? e.message : t("customer.billing.txn.errorLoad");
        setError(errorMessage);
        toast({
          title: t("customer.billing.toast.error"),
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast, t]);

  if (loading)
    return (
      <div className="text-center p-10 text-gray-500">
        {t("customer.billing.txn.loading")}
      </div>
    );
  if (error)
    return <div className="text-red-600 p-10 text-center">{error}</div>;
  if (!transaction)
    return (
      <div className="p-10 text-center text-gray-600">
        {t("customer.billing.txn.notFound")}
      </div>
    );

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
    const u = status.toUpperCase().replace(/-/g, "_");
    const timelineKeys: Record<string, MessageKey> = {
      ESCROW: "customer.billing.txn.timeline.ESCROW",
      TRANSFERRED: "customer.billing.txn.timeline.TRANSFERRED",
      PENDING: "customer.billing.txn.timeline.PENDING",
      IN_PROGRESS: "customer.billing.txn.timeline.IN_PROGRESS",
      PROCESSING: "customer.billing.txn.timeline.IN_PROGRESS",
      RELEASED: "customer.billing.txn.timeline.RELEASED",
      REFUNDED: "customer.billing.txn.timeline.REFUNDED",
      FAILED: "customer.billing.txn.timeline.FAILED",
      COMPLETED: "customer.billing.txn.timeline.COMPLETED",
    };
    const key = timelineKeys[u];
    if (key) return t(key);
    return getBillingStatusLabel(status.toLowerCase(), t) || status;
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
  const txCurrency = String(
    transaction.project?.currencyCode || transaction.currency || "MYR",
  ).toUpperCase();
  const displayCurrency = String(
    preferredCurrency || txCurrency || "MYR",
  ).toUpperCase();
  const isPendingLike = ["pending", "in_progress", "processing"].includes(
    String(transaction.status || "").toLowerCase(),
  );
  const milestoneSubtotal = Number.isFinite(
    Number(transaction.milestone?.amount),
  )
    ? Number(Number(transaction.milestone?.amount).toFixed(2))
    : Number(
        (
          Number(transaction.amount || 0) -
          Number(transaction.platformFeeAmount || 0) / 2
        ).toFixed(2),
      );
  const customerProcessingFee = isPendingLike
    ? Number((milestoneSubtotal * 0.05).toFixed(2))
    : Number((Number(transaction.platformFeeAmount || 0) / 2).toFixed(2));
  const transactionDisplayAmount = isPendingLike
    ? Number((milestoneSubtotal + customerProcessingFee).toFixed(2))
    : Number(transaction.amount || 0);
  const toDisplayCurrency = (amount: number) => {
    if (txCurrency === displayCurrency) return Number(amount || 0);
    const converted = convertWithSnapshot({
      amount: Number(amount || 0),
      fromCurrencyCode: txCurrency,
      toCurrencyCode: displayCurrency,
      ratesMap: transaction.project?.fxSnapshotRatesJson ?? null,
    });
    return converted == null ? Number(amount || 0) : converted;
  };

  const handleDownloadReceipt = async () => {
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : undefined;
      if (!token) {
        toast({
          title: t("customer.billing.toast.error"),
          description: t("customer.billing.toast.notAuthenticated"),
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(
        `${API_BASE}/company/billing/${id}/receipt?lang=${encodeURIComponent(locale)}`,
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
        throw new Error(t("customer.billing.txn.toast.invalidReceipt"));
      }
    } catch (e: unknown) {
      toast({
        title: t("customer.billing.toast.downloadReceiptError"),
        description: getUserFriendlyErrorMessage(
          e,
          "customer billing transaction receipt download",
        ),
        variant: "destructive",
      });
    }
  };

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
              {t("customer.billing.txn.title")}
            </h1>
            <p className="text-gray-600">
              {t("customer.billing.txn.idLabel", {
                id: transaction.stripePaymentIntentId,
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleDownloadReceipt}>
            <Receipt className="w-4 h-4 mr-2" />
            {t("customer.billing.txn.downloadReceipt")}
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
                  {t("customer.billing.txn.amount")}
                </p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatMoney(
                    toDisplayCurrency(transactionDisplayAmount),
                    displayCurrency,
                  )}
                </p>
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
                  {getBillingStatusLabel(transaction.status, t)}
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
              <CardTitle>{t("customer.billing.txn.overviewTitle")}</CardTitle>
              <CardDescription>
                {t("customer.billing.txn.overviewDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* <div>
                    <p className="text-sm text-gray-500">Transaction Type</p>
                    <p className="font-medium capitalize">{transaction.type}</p>
                  </div> */}
                <div>
                  <p className="text-sm text-gray-500">
                    {t("customer.billing.txn.referenceNumber")}
                  </p>
                  <p className="font-medium">
                    {transaction.stripePaymentIntentId}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("customer.billing.txn.project")}
                  </p>
                  <p className="font-medium">{transaction.project.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("customer.billing.txn.milestone")}
                  </p>
                  <p className="font-medium">{transaction.milestone.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">
                    {t("customer.billing.txn.paymentMethod")}
                  </p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <p className="font-medium">{transaction.method}</p>
                  </div>
                </div>
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
              <CardTitle>{t("customer.billing.txn.breakdownTitle")}</CardTitle>
              <CardDescription>
                {t("customer.billing.txn.breakdownDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    {t("customer.billing.txn.subtotal")}
                  </span>
                  <span className="font-medium">
                    {formatMoney(
                      toDisplayCurrency(milestoneSubtotal),
                      displayCurrency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    {t("customer.billing.txn.processingFee")}
                  </span>
                  <span className="font-medium">
                    {formatMoney(
                      toDisplayCurrency(customerProcessingFee),
                      displayCurrency,
                    )}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">
                    {t("customer.billing.txn.tax")}
                  </span>
                  <span className="font-medium">
                    {formatMoney(0, displayCurrency)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between py-2">
                  <span className="text-lg font-semibold">
                    {t("customer.billing.txn.totalAmount")}
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {formatMoney(
                      toDisplayCurrency(transactionDisplayAmount),
                      displayCurrency,
                    )}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Details */}
          <Card>
            <CardHeader>
              <CardTitle>
                {t("customer.billing.txn.methodDetailsTitle")}
              </CardTitle>
              <CardDescription>
                {t("customer.billing.txn.methodDetailsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <CreditCard className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium">{transaction.method}</p>
                  <p className="text-sm text-gray-500">
                    {t("customer.billing.txn.paymentMethod")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{t("customer.billing.txn.timelineTitle")}</CardTitle>
              <CardDescription>
                {t("customer.billing.txn.timelineDesc")}
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
              <CardTitle>{t("customer.billing.txn.providerTitle")}</CardTitle>
              <CardDescription>
                {t("customer.billing.txn.providerDesc")}
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
                    {t("customer.billing.txn.serviceProvider")}
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
                      {t("customer.billing.txn.email")}
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
                      {t("customer.billing.txn.phone")}
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
                      {t("customer.billing.txn.address")}
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
              <CardTitle>{t("customer.billing.txn.customerTitle")}</CardTitle>
              <CardDescription>
                {t("customer.billing.txn.customerDesc")}
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
                    {t("customer.billing.txn.customer")}
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
                      {t("customer.billing.txn.email")}
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
                      {t("customer.billing.txn.phone")}
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
                      {t("customer.billing.txn.address")}
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
