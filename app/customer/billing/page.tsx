"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChartContainer } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
  Download,
  Search,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  Receipt,
  TrendingUp,
  Wallet,
  Send,
  ArrowUpRight,
  HelpCircle,
} from "lucide-react";
import { CustomerPreferredCurrencyDialog } from "@/components/customer/CustomerPreferredCurrencyDialog";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, API_BASE, getProfileImageUrl } from "@/lib/api";
import Link from "next/link";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import MilestonePayment from "@/components/MilestonePayment";
import { useI18n } from "@/contexts/I18nProvider";
import { CustomerBillingTour } from "@/components/customer/CustomerBillingTour";
import { CustomerBillingPageSkeleton } from "@/components/customer/CustomerPageSkeletons";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { convertWithSnapshot, type FxRatesMap } from "@/lib/fx-snapshot";

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

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
  description: string;
  project: string;
  provider: string;
  providerAvatar?: string;
  milestone: string;
  method: string;
  reference: string;
  status: string;
  date: string;
  amount: number;
  type: string;
  currency?: string;
  originalCurrency?: string;
  fxSnapshotRatesJson?: FxRatesMap | null;
};

type Budget = {
  id: string;
  category: string;
  allocated: number;
  spent: number;
  remaining: number;
  projects: number;
  period?: string;
};

type UpcomingPayment = {
  id: string;
  projectId: string;
  project: string;
  milestone: string;
  status: string;
  amount: number;
  dueDate: string;
  sequence: number;
  currency?: string;
  fxSnapshotRatesJson?: FxRatesMap | null;
};

type Invoice = {
  id: string;
  number: string;
  status: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  provider: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
};

function TransactionFiltersSection({
  searchTerm,
  onSearchChange,
  filterPeriod,
  onPeriodChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClear,
  showClear,
  t,
  compact,
}: {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  filterPeriod: string;
  onPeriodChange: (v: string) => void;
  dateFrom: string;
  onDateFromChange: (v: string) => void;
  dateTo: string;
  onDateToChange: (v: string) => void;
  onClear: () => void;
  showClear: boolean;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  compact?: boolean;
}) {
  const inner = (
    <>
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 sm:items-start">
        <div className="flex-1 min-w-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={t("customer.payments.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 text-sm md:text-base"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center w-full sm:w-auto shrink-0">
          <Select value={filterPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-full sm:w-[min(100%,13rem)] text-sm md:text-base">
              <Calendar className="w-4 h-4 mr-2 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("customer.payments.period.all")}
              </SelectItem>
              <SelectItem value="week">
                {t("customer.payments.period.week")}
              </SelectItem>
              <SelectItem value="month">
                {t("customer.payments.period.month")}
              </SelectItem>
              <SelectItem value="quarter">
                {t("customer.payments.period.quarter")}
              </SelectItem>
              <SelectItem value="year">
                {t("customer.payments.period.year")}
              </SelectItem>
            </SelectContent>
          </Select>
          {showClear ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClear}
              className="whitespace-nowrap"
            >
              {t("customer.billing.filters.clear")}
            </Button>
          ) : null}
        </div>
      </div>
      <div className="pt-3 border-t border-gray-100 space-y-3">
        <p className="text-xs text-gray-500 leading-snug">
          {t("customer.billing.filters.dateRangeHelp")}
        </p>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-700">
              {t("customer.billing.filters.dateFrom")}
            </Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="text-sm w-full sm:w-[11.5rem]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-medium text-gray-700">
              {t("customer.billing.filters.dateTo")}
            </Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="text-sm w-full sm:w-[11.5rem]"
            />
          </div>
        </div>
      </div>
    </>
  );

  if (compact) {
    return <div className="space-y-3">{inner}</div>;
  }
  return (
    <Card>
      <CardContent className="p-4 md:p-6 space-y-3">{inner}</CardContent>
    </Card>
  );
}

export default function CustomerBillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const dateLocale =
    locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US";
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [upcomingSearchTerm, setUpcomingSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedInvoice] = useState<Invoice | null>(null);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [addPaymentMethodOpen, setAddPaymentMethodOpen] = useState(false);
  const [editBudgetOpen, setEditBudgetOpen] = useState(false);
  const [selectedBudget] = useState<Budget | null>(null);
  const [selectedMilestoneForPayment, setSelectedMilestoneForPayment] =
    useState<UpcomingPayment | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const refreshProjectData = () => {
    // TODO: implement data refresh after payment
  };

  const [stats, setStats] = useState({
    totalSpent: 0,
    pendingPayments: 0,
    thisMonth: 0,
    averageTransaction: 0,
    averageTransactionByYear: [] as { year: number; average: number }[],
    completedPayments: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [preferredCurrency, setPreferredCurrency] = useState("MYR");

  const filteredTransactions = useMemo(() => {
    let effFrom = dateFrom.trim();
    let effTo = dateTo.trim();
    if (effFrom && effTo && new Date(effFrom) > new Date(effTo)) {
      const swap = effFrom;
      effFrom = effTo;
      effTo = swap;
    }
    const useManualDates = Boolean(effFrom || effTo);

    const q = searchTerm.trim().toLowerCase();
    return transactions.filter((transaction) => {
      const matchesSearch =
        !q ||
        transaction.description.toLowerCase().includes(q) ||
        transaction.project.toLowerCase().includes(q) ||
        transaction.provider.toLowerCase().includes(q) ||
        transaction.milestone.toLowerCase().includes(q) ||
        (transaction.reference &&
          transaction.reference.toLowerCase().includes(q)) ||
        (transaction.method && transaction.method.toLowerCase().includes(q));

      const transactionDate = new Date(transaction.date);
      if (Number.isNaN(transactionDate.getTime())) {
        if (useManualDates) return false;
        return matchesSearch && filterPeriod === "all";
      }

      let matchesPeriod = true;
      const now = new Date();

      if (useManualDates) {
        const fromBound = effFrom ? startOfDay(new Date(effFrom)) : null;
        const toBound = effTo ? endOfDay(new Date(effTo)) : null;
        if (fromBound && transactionDate < fromBound) matchesPeriod = false;
        if (toBound && transactionDate > toBound) matchesPeriod = false;
      } else if (filterPeriod === "all") {
        matchesPeriod = true;
      } else {
        const ms = now.getTime() - transactionDate.getTime();
        switch (filterPeriod) {
          case "week":
            matchesPeriod = ms <= 7 * 24 * 60 * 60 * 1000;
            break;
          case "month":
            matchesPeriod = ms <= 30 * 24 * 60 * 60 * 1000;
            break;
          case "quarter":
            matchesPeriod = ms <= 90 * 24 * 60 * 60 * 1000;
            break;
          case "year":
            matchesPeriod = ms <= 365 * 24 * 60 * 60 * 1000;
            break;
          default:
            matchesPeriod = true;
        }
      }

      return matchesSearch && matchesPeriod;
    });
  }, [transactions, searchTerm, filterPeriod, dateFrom, dateTo]);

  const filteredUpcomingPayments = useMemo(() => {
    const q = upcomingSearchTerm.trim().toLowerCase();
    if (!q) return upcomingPayments;
    return upcomingPayments.filter(
      (p) =>
        p.project.toLowerCase().includes(q) ||
        p.milestone.toLowerCase().includes(q),
    );
  }, [upcomingPayments, upcomingSearchTerm]);

  const hasActiveTxnFilters =
    Boolean(searchTerm.trim()) ||
    filterPeriod !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo);

  const clearTxnFilters = () => {
    setSearchTerm("");
    setFilterPeriod("all");
    setDateFrom("");
    setDateTo("");
  };

  const handlePeriodChange = (v: string) => {
    setFilterPeriod(v);
    if (v === "week" || v === "month" || v === "quarter" || v === "year") {
      setDateFrom("");
      setDateTo("");
    }
  };

  /** Manual dates override quick period; entering a date switches to “All time” so presets don’t clash. */
  const setManualDateFrom = (v: string) => {
    setDateFrom(v);
    if (v.trim()) setFilterPeriod("all");
  };
  const setManualDateTo = (v: string) => {
    setDateTo(v);
    if (v.trim()) setFilterPeriod("all");
  };

  // const stats = {
  //   totalSpent: transactions
  //     .filter((t) => t.type === "payment" && t.status === "completed")
  //     .reduce((acc, t) => acc + t.amount, 0),
  //   pendingPayments: transactions.filter((t) => t.status === "pending").reduce((acc, t) => acc + t.amount, 0),
  //   totalTransactions: transactions.length,
  //   thisMonth: transactions
  //     .filter((t) => {
  //       const transactionDate = new Date(t.date)
  //       const now = new Date()
  //       return transactionDate.getMonth() === now.getMonth() && transactionDate.getFullYear() === now.getFullYear()
  //     })
  //     .reduce((acc, t) => acc + (t.type === "payment" ? t.amount : 0), 0),
  //   averageTransaction:
  //     transactions.filter((t) => t.type === "payment").reduce((acc, t) => acc + t.amount, 0) /
  //       transactions.filter((t) => t.type === "payment").length || 0,
  //   completedPayments: transactions.filter((t) => t.status === "completed").length,
  // }

  const getStatusColor = (status: string) => {
    switch (String(status || "").toLowerCase()) {
      case "transferred":
      case "paid":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      case "escrow":
      case "escrowed":
        return "bg-cyan-100 text-cyan-800 border border-cyan-200";
      case "pending":
      case "scheduled":
        return "bg-amber-100 text-amber-800 border border-amber-200";
      case "processing":
      case "in_progress":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200";
      case "refunded":
        return "bg-violet-100 text-violet-800 border border-violet-200";
      case "approved":
        return "bg-sky-100 text-sky-800 border border-sky-200";
      case "failed":
      case "overdue":
        return "bg-rose-100 text-rose-800 border border-rose-200";
      default:
        return "bg-slate-100 text-slate-800 border border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "transferred":
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
      case "scheduled":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "failed":
      case "overdue":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
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

  const getDisplayAmount = (transaction: Transaction) => {
    const amount = Number(transaction.amount || 0);
    const from = String(
      transaction.originalCurrency || transaction.currency || "MYR",
    ).toUpperCase();
    const to = String(preferredCurrency || "MYR").toUpperCase();
    if (from === to) return amount;
    const converted = convertWithSnapshot({
      amount,
      fromCurrencyCode: from,
      toCurrencyCode: to,
      ratesMap: transaction.fxSnapshotRatesJson ?? null,
    });
    return converted == null ? amount : converted;
  };
  const convertAmount = (
    amount: number,
    fromCurrency: string,
    ratesMap?: FxRatesMap | null,
  ) => {
    const from = String(fromCurrency || "MYR").toUpperCase();
    const to = String(preferredCurrency || "MYR").toUpperCase();
    if (from === to) return Number(amount || 0);
    const converted = convertWithSnapshot({
      amount: Number(amount || 0),
      fromCurrencyCode: from,
      toCurrencyCode: to,
      ratesMap: ratesMap ?? null,
    });
    return converted == null ? Number(amount || 0) : converted;
  };

  const preferredStats = useMemo(() => {
    const now = new Date();
    const transactionItems = transactions.filter(
      (t) => String(t.type || "").toLowerCase() !== "refund",
    );
    const totalSpent = transactionItems
      .filter((t) => {
        const s = String(t.status || "").toLowerCase();
        return s === "transferred" || s === "escrow" || s === "escrowed";
      })
      .reduce(
        (sum, t) =>
          sum +
          convertAmount(
            Number(t.amount || 0),
            t.originalCurrency || t.currency || "MYR",
            t.fxSnapshotRatesJson ?? null,
          ),
        0,
      );
    const thisMonth = transactionItems
      .filter((t) => {
        const d = new Date(t.date);
        const s = String(t.status || "").toLowerCase();
        const isIncludedStatus =
          s === "transferred" || s === "escrow" || s === "escrowed";
        return (
          isIncludedStatus &&
          d.getMonth() === now.getMonth() &&
          d.getFullYear() === now.getFullYear()
        );
      })
      .reduce(
        (sum, t) =>
          sum +
          convertAmount(
            Number(t.amount || 0),
            t.originalCurrency || t.currency || "MYR",
            t.fxSnapshotRatesJson ?? null,
          ),
        0,
      );
    const pendingPayments = transactionItems
      .filter((t) => {
        const s = String(t.status || "").toLowerCase();
        return s === "pending" || s === "escrow" || s === "escrowed";
      })
      .reduce(
        (sum, t) =>
          sum +
          convertAmount(
            Number(t.amount || 0),
            t.originalCurrency || t.currency || "MYR",
            t.fxSnapshotRatesJson ?? null,
          ),
        0,
      );
    const completedPayments = transactionItems.length;
    const averageTransaction =
      completedPayments > 0 ? totalSpent / completedPayments : 0;

    return {
      totalSpent,
      pendingPayments,
      thisMonth,
      averageTransaction,
      completedPayments,
    };
  }, [transactions, preferredCurrency]);

  const renderDualTransactionAmount = (
    transaction: Transaction,
    showSign = false,
  ) => {
    const originalCurrency = String(
      transaction.originalCurrency || transaction.currency || "MYR",
    ).toUpperCase();
    const preferredCode = String(preferredCurrency || "MYR").toUpperCase();
    const originalAmount = Number(transaction.amount || 0);
    const preferredAmount = getDisplayAmount(transaction);
    const signPrefix = showSign
      ? transaction.type === "refund"
        ? "+"
        : "-"
      : transaction.type === "refund"
        ? "+"
        : "";

    return (
      <span className="inline-flex flex-col items-end gap-0.5">
        <span>
          {signPrefix}
          {formatMoney(originalAmount, originalCurrency)}
        </span>
        {originalCurrency !== preferredCode && (
          <span className="text-xs text-gray-500 font-normal">
            {t("provider.projects.milestones.amountEquivPreferred", {
              amount: formatMoney(preferredAmount, preferredCode),
            })}
          </span>
        )}
      </span>
    );
  };

  const handleViewTransactionDetails = (transactionId: string) => {
    router.push(`/customer/billing/transactions/${transactionId}`);
  };

  const handleDownloadReceipt = async (transactionId: string) => {
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
        `${API_BASE}/company/billing/${transactionId}/receipt?lang=${encodeURIComponent(locale)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

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
        title: t("customer.billing.toast.downloadReceiptError"),
        description: getUserFriendlyErrorMessage(
          e,
          "customer billing receipt download",
        ),
        variant: "destructive",
      });
    }
  };

  const handleExportReport = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(
        `${API_BASE}/company/billing/export/report?lang=${encodeURIComponent(locale)}&currency=${encodeURIComponent(preferredCurrency)}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to export report");
      }

      const data = await res.json();

      if (data.success && data.downloadUrl) {
        // Open the download URL in a new tab/window
        window.open(data.downloadUrl, "_blank");

        toast({
          title: t("customer.billing.toast.reportGenerated"),
          description: t("customer.billing.toast.reportGeneratedDesc"),
        });
      } else {
        throw new Error(data.message || "Failed to get download URL");
      }
    } catch (e: unknown) {
      toast({
        title: t("customer.billing.toast.exportReportError"),
        description: getUserFriendlyErrorMessage(
          e,
          "customer billing export report",
        ),
        variant: "destructive",
      });
    }
  };

  const handleSaveBudgetEdit = () => {
    toast({
      title: t("customer.billing.toast.budgetUpdated"),
      description: t("customer.billing.toast.budgetUpdatedDesc", {
        category: selectedBudget?.category ?? "",
      }),
    });
    setEditBudgetOpen(false);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast({
      title: t("customer.billing.toast.downloadingInvoice"),
      description: t("customer.billing.toast.downloadingInvoiceDesc", {
        number: invoice.number,
      }),
    });
  };

  // Handle payment button click
  const handlePayMilestone = (milestoneId: string) => {
    const milestone = upcomingPayments.find((m) => m.id === milestoneId);
    if (milestone) {
      setSelectedMilestoneForPayment(milestone);
      setPaymentDialogOpen(true);
    }
  };

  // ✅ Fetch all billing data
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

    const fetchBillingData = async () => {
      try {
        const [overviewRes, txnRes, upcomingRes] = await Promise.all([
          apiFetch("/company/billing/overview"),
          apiFetch("/company/billing/transactions"),
          apiFetch("/company/billing/upcoming"),
        ]);

        // Match structure expected by UI
        setStats({
          totalSpent: overviewRes.data.totalSpent,
          pendingPayments: overviewRes.data.pendingPayments,
          thisMonth: overviewRes.data.thisMonthSpent,
          averageTransaction: overviewRes.data.averageTransaction,
          averageTransactionByYear:
            overviewRes.data.averageTransactionByYear ?? [],
          completedPayments: overviewRes.data.recentTransactions.length,
        });
        // Budgets feature is commented out, so we don't set budgets state
        setTransactions(
          (txnRes.transactions || []).map((txn: Record<string, unknown>) => {
            const status = ((txn.status as string) || "").toLowerCase();
            const isRefunded = status === "refunded";
            const isPendingLike = [
              "pending",
              "in_progress",
              "processing",
            ].includes(status);
            const milestoneAmount = Number(
              ((txn.milestone as Record<string, unknown>)?.amount as number) ||
                0,
            );
            const rawAmount = Number((txn.amount as number) || 0);
            const amountForList = isPendingLike
              ? Number((milestoneAmount * 1.05).toFixed(2))
              : rawAmount;
            return {
              id: (txn.id as string) || "",
              description:
                ((txn.metadata as Record<string, unknown>)
                  ?.milestoneTitle as string) || "",
              project:
                ((txn.project as Record<string, unknown>)?.title as string) ||
                "",
              provider:
                ((
                  (txn.project as Record<string, unknown>)?.provider as Record<
                    string,
                    unknown
                  >
                )?.name as string) ||
                ((txn.metadata as Record<string, unknown>)
                  ?.providerEmail as string) ||
                "",
              providerAvatar:
                ((
                  (
                    (txn.project as Record<string, unknown>)
                      ?.provider as Record<string, unknown>
                  )?.providerProfile as Record<string, unknown>
                )?.profileImageUrl as string) || "",
              milestone:
                ((txn.milestone as Record<string, unknown>)?.title as string) ||
                "",
              method: (txn.method as string) || "",
              reference: (txn.stripePaymentIntentId as string) || "",
              status: status,
              date: (txn.createdAt as string) || "",
              amount: amountForList,
              type: isRefunded ? "refund" : "payment",
              currency:
                ((txn.project as Record<string, unknown>)
                  ?.currencyCode as string) ||
                (txn.currency as string) ||
                "MYR",
              originalCurrency:
                ((txn.project as Record<string, unknown>)
                  ?.currencyCode as string) || "MYR",
              fxSnapshotRatesJson:
                ((txn.project as Record<string, unknown>)
                  ?.fxSnapshotRatesJson as FxRatesMap | null) || null,
            };
          }),
        );
        setUpcomingPayments(
          (upcomingRes.data || []).flatMap((project: Record<string, unknown>) =>
            ((project.milestones as Array<Record<string, unknown>>) || []).map(
              (milestone: Record<string, unknown>, index: number) => ({
                id: (milestone.id as string) || "",
                projectId: (project.id as string) || "",
                project: (project.title as string) || "",
                milestone: (milestone.title as string) || "",
                status: (milestone.status as string) || "",
                amount: (milestone.amount as number) || 0,
                dueDate: (milestone.dueDate as string) || "",
                sequence: index,
                currency: (project.currencyCode as string) || "MYR",
                fxSnapshotRatesJson:
                  (project.fxSnapshotRatesJson as FxRatesMap | null) || null,
              }),
            ),
          ),
        );
      } catch (error) {
        getUserFriendlyErrorMessage(error, "customer billing fetch");
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  if (loading) {
    return (
      <>
        <CustomerBillingTour />
        <CustomerBillingPageSkeleton
          loadingLabel={t("customer.billing.loading")}
        />
      </>
    );
  }

  const currentMonthLabel = new Date().toLocaleDateString(dateLocale, {
    month: "long",
    year: "numeric",
  });

  return (
    <>
      <CustomerPreferredCurrencyDialog
        tourStorageKeyPrefix="customer-billing-tour-done"
        onSaved={async () => {
          if (typeof window !== "undefined") {
            const raw = localStorage.getItem("user");
            if (raw) {
              try {
                const parsed = JSON.parse(raw) as {
                  settings?: { preferredCurrency?: string };
                };
                const code = String(parsed?.settings?.preferredCurrency || "")
                  .trim()
                  .toUpperCase();
                if (/^[A-Z]{3}$/.test(code)) setPreferredCurrency(code);
              } catch {
                // ignore parse error
              }
            }
          }
        }}
      />
      <CustomerBillingTour />
      <div className="space-y-6 md:space-y-8 px-4 md:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div data-tour-step="0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t("customer.billing.title")}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {t("customer.billing.subtitle")}
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Currency preference can be changed in{" "}
              <Link
                href="/customer/settings?tab=language"
                className="text-blue-600 hover:underline"
              >
                Settings → Language
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleExportReport}
              className="w-full sm:w-auto text-xs md:text-sm"
              data-tour-step="1"
            >
              <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              {t("customer.billing.exportReport")}
            </Button>
            <Dialog
              open={addPaymentMethodOpen}
              onOpenChange={setAddPaymentMethodOpen}
            >
              {/* <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </DialogTrigger> */}
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("customer.payments.dialog.addTitle")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("customer.billing.dialog.addPaymentDescription")}
                  </DialogDescription>
                </DialogHeader>
                <AddPaymentMethodForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ===== Top Stats (always visible) ===== */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          data-tour-step="2"
        >
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-gray-500">
                    {t("customer.payments.stats.totalSpent")}
                  </p>
                  <p className="text-xl md:text-2xl font-bold">
                    {formatMoney(preferredStats.totalSpent, preferredCurrency)}
                  </p>
                  <div className="flex items-center mt-2 text-green-600 text-xs md:text-sm">
                    <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    <span>
                      {t("customer.billing.stats.trendDemo", { pct: 12 })}
                    </span>
                  </div>
                </div>
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-green-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-gray-500">
                    {t("customer.payments.stats.pending")}
                  </p>
                  <p className="text-xl md:text-2xl font-bold">
                    {formatMoney(
                      preferredStats.pendingPayments,
                      preferredCurrency,
                    )}
                  </p>
                  <div className="flex items-center mt-2 text-yellow-600 text-xs md:text-sm">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    <span>
                      {t("customer.billing.stats.pendingCount", {
                        n: transactions.filter(
                          (txn) => txn.status === "pending",
                        ).length,
                      })}
                    </span>
                  </div>
                </div>
                <Clock className="w-6 h-6 md:w-8 md:h-8 text-yellow-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm text-gray-500">This Month</p>
                  <p className="text-xl md:text-2xl font-bold">
                    {formatMoney(preferredStats.thisMonth, preferredCurrency)}
                  </p>
                  <div className="flex items-center mt-2 text-blue-600 text-xs md:text-sm">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    <span>{currentMonthLabel}</span>
                  </div>
                </div>
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs md:text-sm text-gray-500">
                      {t("customer.billing.stats.avgTransactionYtd")}
                    </p>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-3.5 w-3.5 md:h-4 md:w-4 text-gray-400 hover:text-gray-600 cursor-help shrink-0" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px]">
                          <p>{t("customer.billing.stats.avgTooltip")}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className="text-xl md:text-2xl font-bold mt-1">
                    {formatMoney(
                      preferredStats.averageTransaction,
                      preferredCurrency,
                    )}
                  </p>
                  <div className="flex items-center mt-2 text-purple-600 text-xs md:text-sm">
                    <Receipt className="w-3 h-3 md:w-4 md:h-4 mr-1 shrink-0" />
                    <span>
                      {t("customer.billing.stats.totalTransactions", {
                        n: preferredStats.completedPayments,
                      })}
                    </span>
                  </div>
                </div>
                {(stats.averageTransactionByYear?.length ?? 0) > 0 && (
                  <div className="w-20 md:w-28 h-12 shrink-0">
                    <ChartContainer
                      config={{
                        average: {
                          label: t("customer.billing.stats.chartAvg"),
                          color: "rgb(147 51 234)",
                        },
                      }}
                      className="h-full w-full !aspect-auto [&_.recharts-cartesian-grid]:opacity-0"
                    >
                      <BarChart
                        data={[...(stats.averageTransactionByYear ?? [])]
                          .reverse()
                          .map((d) => ({
                            year: String(d.year).slice(-2),
                            average: Math.round(d.average),
                          }))}
                        margin={{ top: 2, right: 2, bottom: 2, left: 2 }}
                      >
                        <XAxis
                          type="category"
                          dataKey="year"
                          tick={{ fontSize: 9 }}
                        />
                        <YAxis type="number" hide />
                        <Bar
                          dataKey="average"
                          fill="rgb(147 51 234)"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ChartContainer>
                  </div>
                )}
                <Receipt className="w-6 h-6 md:w-8 md:h-8 text-purple-600 flex-shrink-0 hidden sm:block" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="text-xs md:text-sm">
              {t("customer.billing.tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs md:text-sm">
              {t("customer.billing.tabs.transactions")}
            </TabsTrigger>
            {/* <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger> */}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* ===== Spending by Category ===== */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>
                  Your budget allocation and spending overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgets.map((budget) => {
                    const percentage = (budget.spent / budget.allocated) * 100;
                    return (
                      <div key={budget.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{budget.category}</p>
                            <p className="text-sm text-gray-500">
                              {budget.projects} active projects
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              RM{budget.spent.toLocaleString() ?? "0.00"} / RM
                              {budget.allocated.toLocaleString() ?? "0.00"}
                            </p>
                            <p className="text-sm text-gray-500">
                              RM{budget.remaining.toLocaleString() ?? "0.00"}{" "}
                              remaining
                            </p>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card> */}

            <div data-tour-step="3" className="space-y-6">
              {/* ===== Upcoming Payments ===== */}
              <Card data-tour-step="4">
                <CardHeader>
                  <CardTitle className="text-base md:text-lg">
                    {t("customer.billing.upcoming.title")}
                  </CardTitle>
                  <CardDescription className="text-xs md:text-sm">
                    {t("customer.billing.upcoming.description")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder={t(
                        "customer.billing.filters.upcomingSearch",
                      )}
                      value={upcomingSearchTerm}
                      onChange={(e) => setUpcomingSearchTerm(e.target.value)}
                      className="pl-10 text-sm md:text-base"
                    />
                  </div>
                  <div className="space-y-4">
                    {filteredUpcomingPayments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                          <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Wallet className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm md:text-base">
                              <Link
                                href={`/customer/projects/${payment.projectId}`}
                                className="text-blue-600 hover:underline truncate block"
                              >
                                {payment.project}
                              </Link>
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500">
                              {payment.milestone}
                            </p>
                            <p className="text-xs text-gray-400">
                              {t("customer.billing.upcoming.duePrefix")}{" "}
                              {new Date(payment.dueDate).toLocaleDateString(
                                dateLocale,
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-base md:text-lg font-bold text-gray-900">
                              {formatMoney(
                                payment.amount ?? 0,
                                payment.currency || "MYR",
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge
                              className={`${getStatusColor(payment.status)} text-xs`}
                            >
                              {getStatusIcon(payment.status)}
                              <span className="ml-1 capitalize">
                                {getBillingStatusLabel(payment.status, t)}
                              </span>
                            </Badge>
                          </div>
                          {(payment.sequence === 0 ||
                            upcomingPayments.find(
                              (p) =>
                                p.projectId === payment.projectId &&
                                p.sequence === payment.sequence - 1,
                            )?.status === "APPROVED") && (
                            <Button
                              size="sm"
                              className="w-full sm:w-auto text-xs md:text-sm"
                              onClick={() => handlePayMilestone(payment.id)}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              {t("customer.billing.upcoming.payNow")}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredUpcomingPayments.length === 0 &&
                    upcomingPayments.length > 0 && (
                      <p className="text-sm text-center text-gray-500 py-6">
                        {t("customer.payments.empty.adjustFilters")}
                      </p>
                    )}
                </CardContent>
              </Card>

              {/* ===== Recent Transactions ===== */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <CardTitle className="text-base md:text-lg">
                        {t("customer.billing.recent.title")}
                      </CardTitle>
                      <CardDescription className="text-xs md:text-sm">
                        {t("customer.billing.recent.description")}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setActiveTab("transactions")}
                      className="w-full sm:w-auto text-xs md:text-sm"
                    >
                      {t("customer.billing.recent.viewAll")}
                      <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <TransactionFiltersSection
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    filterPeriod={filterPeriod}
                    onPeriodChange={handlePeriodChange}
                    dateFrom={dateFrom}
                    onDateFromChange={setManualDateFrom}
                    dateTo={dateTo}
                    onDateToChange={setManualDateTo}
                    onClear={clearTxnFilters}
                    showClear={hasActiveTxnFilters}
                    t={t}
                    compact
                  />
                  {transactions.length > 0 ? (
                    <p className="text-xs text-gray-500 mb-4">
                      {t("customer.billing.filters.matchesCount", {
                        n: String(filteredTransactions.length),
                      })}
                    </p>
                  ) : null}
                  <div className="space-y-4">
                    {filteredTransactions.slice(0, 5).map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                            <AvatarImage
                              src={getProfileImageUrl(
                                transaction.providerAvatar,
                              )}
                              alt={transaction.provider || "Provider"}
                            />
                            <AvatarFallback>
                              {(transaction.provider || "P")
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm md:text-base truncate">
                              {transaction.description}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500 truncate">
                              {transaction.project}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(transaction.date).toLocaleDateString(
                                dateLocale,
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <span
                            className={`text-base md:text-lg font-bold ${
                              transaction.type === "refund"
                                ? "text-green-600"
                                : "text-gray-900"
                            }`}
                          >
                            {renderDualTransactionAmount(transaction, true)}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={`${getStatusColor(transaction.status)} text-xs`}
                            >
                              {getStatusIcon(transaction.status)}
                              <span className="ml-1 capitalize">
                                {getBillingStatusLabel(transaction.status, t)}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {filteredTransactions.length === 0 && (
                    <div className="text-center py-8 text-sm text-gray-500">
                      {hasActiveTxnFilters
                        ? t("customer.payments.empty.adjustFilters")
                        : t("customer.payments.empty.noPayments")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <div className="space-y-6" data-tour-step="bill-5">
              <TransactionFiltersSection
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                filterPeriod={filterPeriod}
                onPeriodChange={handlePeriodChange}
                dateFrom={dateFrom}
                onDateFromChange={setManualDateFrom}
                dateTo={dateTo}
                onDateToChange={setManualDateTo}
                onClear={clearTxnFilters}
                showClear={hasActiveTxnFilters}
                t={t}
              />
              {transactions.length > 0 ? (
                <p className="text-sm text-gray-500 -mt-2">
                  {t("customer.billing.filters.showingCount", {
                    shown: filteredTransactions.length,
                    total: transactions.length,
                  })}
                </p>
              ) : null}

              {/* Transactions List */}
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <Card key={transaction.id}>
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                          <Avatar className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                            <AvatarImage
                              src={getProfileImageUrl(
                                transaction.providerAvatar,
                              )}
                              alt={transaction.provider || "Provider"}
                            />
                            <AvatarFallback>
                              {(transaction.provider || "P")
                                .charAt(0)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-semibold text-sm md:text-base truncate">
                              {transaction.description}
                            </h3>
                            <p className="text-xs md:text-sm text-gray-500 truncate">
                              {transaction.project}
                            </p>
                            <p className="text-xs text-gray-400 line-clamp-1">
                              {transaction.milestone} • {transaction.method} •{" "}
                              {transaction.reference}
                            </p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right flex-shrink-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-base md:text-lg font-bold ${
                                transaction.type === "refund"
                                  ? "text-green-600"
                                  : "text-gray-900"
                              }`}
                            >
                              {renderDualTransactionAmount(transaction, false)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${getStatusColor(transaction.status)} text-xs`}
                            >
                              {getStatusIcon(transaction.status)}
                              <span className="ml-1 capitalize">
                                {getBillingStatusLabel(transaction.status, t)}
                              </span>
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(transaction.date).toLocaleDateString(
                              dateLocale,
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-xs md:text-sm"
                          onClick={() =>
                            handleViewTransactionDetails(transaction.id)
                          }
                        >
                          <Eye className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                          {t("customer.payments.viewDetails")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-xs md:text-sm"
                          onClick={() => handleDownloadReceipt(transaction.id)}
                        >
                          <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                          {t("customer.payments.receipt")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredTransactions.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {t("customer.payments.empty.title")}
                    </h3>
                    <p className="text-gray-600">
                      {hasActiveTxnFilters
                        ? t("customer.payments.empty.adjustFilters")
                        : t("customer.payments.empty.noPayments")}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Invoices</CardTitle>
                <CardDescription>
                  View and download your invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {invoices.length > 0 ? (
                      invoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            {invoice.number}
                          </TableCell>
                          <TableCell>{invoice.project}</TableCell>
                          <TableCell>{invoice.provider}</TableCell>
                          <TableCell>
                            RM{(invoice.amount ?? 0).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            {invoice.issueDate
                              ? new Date(invoice.issueDate).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {invoice.dueDate
                              ? new Date(invoice.dueDate).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.status)}>
                              {getStatusIcon(invoice.status)}
                              <span className="ml-1 capitalize">
                                {invoice.status}
                              </span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadInvoice(invoice)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center text-gray-500"
                        >
                          No invoices found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent> */}

          {/* Payment Methods Tab */}
          {/* <TabsContent value="methods" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {paymentMethods.map((method) => (
                <Card
                  key={method.id}
                  className={method.isDefault ? "ring-2 ring-blue-500" : ""}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {method.type === "credit_card"
                            ? getCardIcon(method.brand!)
                            : "🏦"}
                        </div>
                        <div>
                          {method.type === "credit_card" ? (
                            <>
                              <p className="font-semibold">
                                {method.brand} •••• {method.last4}
                              </p>
                              <p className="text-sm text-gray-500">
                                Expires{" "}
                                {method
                                  .expiryMonth!.toString()
                                  .padStart(2, "0")}
                                /{method.expiryYear}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-semibold">{method.bankName}</p>
                              <p className="text-sm text-gray-500">
                                Account •••• {method.last4}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Default
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      {method.type === "credit_card"
                        ? method.name
                        : method.accountName}
                    </p>
                    <div className="flex gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSetDefaultPaymentMethod(method.id)
                          }
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 bg-transparent"
                        onClick={() => handleRemovePaymentMethod(method.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent> */}

          {/* Budgets Tab */}
          {/* <TabsContent value="budgets" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">Budget Management</h3>
                <p className="text-sm text-gray-600">
                  Track and manage your project budgets
                </p>
              </div>
              <Dialog open={addBudgetOpen} onOpenChange={setAddBudgetOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Budget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Budget</DialogTitle>
                    <DialogDescription>
                      Set up a new budget for your projects.
                    </DialogDescription>
                  </DialogHeader>
                  <AddBudgetForm />
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {budgets.map((budget) => {
                const percentage = (budget.spent / budget.allocated) * 100;
                const isOverBudget = percentage > 90;
                return (
                  <Card
                    key={budget.id}
                    className={isOverBudget ? "ring-2 ring-red-500" : ""}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {budget.category}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {budget.period} Budget
                          </p>
                        </div>
                        {isOverBudget && (
                          <Badge className="bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Near Limit
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Spent</span>
                            <span className="font-medium">
                              RM{budget.spent.toLocaleString() ?? "0.00"} / RM
                              {budget.allocated.toLocaleString() ?? "0.00"}
                            </span>
                          </div>
                          <Progress
                            value={percentage}
                            className={`h-2 ${
                              isOverBudget ? "bg-red-100" : ""
                            }`}
                          />
                          <p className="text-sm text-gray-500 mt-1">
                            {percentage.toFixed(0)}% used
                          </p>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Remaining</p>
                            <p className="text-lg font-bold text-green-600">
                              RM{budget.remaining.toLocaleString() ?? "0.00"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              Active Projects
                            </p>
                            <p className="text-lg font-bold">
                              {budget.projects}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => handleEditBudget(budget)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-transparent"
                            onClick={() => handleViewBudgetDetails(budget.id)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div> */}

          {/* Budget Summary */}
          {/* <Card>
              <CardHeader>
                <CardTitle>Budget Summary</CardTitle>
                <CardDescription>Overall budget performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      RM
                      {budgets
                        .reduce((acc, b) => acc + b.allocated, 0)
                        .toLocaleString() ?? "0.00"}
                    </div>
                    <div className="text-sm text-gray-500">Total Allocated</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      RM
                      {budgets
                        .reduce((acc, b) => acc + b.spent, 0)
                        .toLocaleString() ?? "0.00"}
                    </div>
                    <div className="text-sm text-gray-500">Total Spent</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      RM
                      {budgets
                        .reduce((acc, b) => acc + b.remaining, 0)
                        .toLocaleString() ?? "0.00"}
                    </div>
                    <div className="text-sm text-gray-500">Total Remaining</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {budgets.reduce((acc, b) => acc + b.projects, 0)}
                    </div>
                    <div className="text-sm text-gray-500">Total Projects</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent> */}
        </Tabs>

        {/* Invoice Detail Dialog */}
        <Dialog open={invoiceDialogOpen} onOpenChange={setInvoiceDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            {selectedInvoice && (
              <>
                <DialogHeader>
                  <DialogTitle>
                    {t("customer.billing.invoice.title")}
                  </DialogTitle>
                  <DialogDescription>
                    {t("customer.billing.invoice.desc", {
                      number: selectedInvoice.number,
                    })}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold">
                        {t("customer.billing.invoice.invoiceWord")}
                      </h3>
                      <p className="text-gray-600">{selectedInvoice.number}</p>
                    </div>
                    <Badge className={getStatusColor(selectedInvoice.status)}>
                      {selectedInvoice.status.toUpperCase()}
                    </Badge>
                  </div>

                  <Separator />

                  {/* Invoice Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">
                        {t("customer.billing.invoice.from")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedInvoice.provider}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        {t("customer.billing.invoice.to")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Tech Innovations Sdn Bhd
                      </p>
                      <p className="text-sm text-gray-600">
                        sarah@techcorp.com
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-semibold mb-2">
                        {t("customer.billing.invoice.issueDate")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedInvoice.issueDate).toLocaleDateString(
                          dateLocale,
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        {t("customer.billing.invoice.dueDate")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedInvoice.dueDate).toLocaleDateString(
                          dateLocale,
                        )}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">
                        {t("customer.billing.invoice.paidDate")}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {selectedInvoice.paidDate
                          ? new Date(
                              selectedInvoice.paidDate,
                            ).toLocaleDateString(dateLocale)
                          : t("customer.billing.invoice.notPaidYet")}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Invoice Items */}
                  <div>
                    <h4 className="font-semibold mb-4">
                      {t("customer.billing.invoice.items")}
                    </h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>
                            {t("customer.billing.invoice.tableDescription")}
                          </TableHead>
                          <TableHead>
                            {t("customer.billing.invoice.tableQuantity")}
                          </TableHead>
                          <TableHead>
                            {t("customer.billing.invoice.tableRate")}
                          </TableHead>
                          <TableHead className="text-right">
                            {t("customer.billing.invoice.tableAmount")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map(
                          (
                            item: {
                              description: string;
                              quantity: number;
                              rate: number;
                              amount: number;
                            },
                            index: number,
                          ) => (
                            <TableRow key={index}>
                              <TableCell>{item.description}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>
                                RM{item.rate.toLocaleString() ?? "0.00"}
                              </TableCell>
                              <TableCell className="text-right">
                                RM{item.amount.toLocaleString() ?? "0.00"}
                              </TableCell>
                            </TableRow>
                          ),
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("customer.billing.invoice.subtotal")}
                        </span>
                        <span>RM{selectedInvoice.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          {t("customer.billing.invoice.taxZero")}
                        </span>
                        <span>RM0.00</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>{t("customer.billing.invoice.total")}</span>
                        <span>
                          RM{selectedInvoice.amount.toLocaleString() ?? "0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setInvoiceDialogOpen(false)}
                  >
                    {t("customer.billing.invoice.close")}
                  </Button>
                  <Button
                    onClick={() => handleDownloadInvoice(selectedInvoice)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t("customer.billing.invoice.downloadPdf")}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Milestone Payment Dialog */}
        <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
          <DialogContent className="sm:max-w-3xl w-full">
            <MilestonePayment
              milestone={{
                id: selectedMilestoneForPayment?.id || "",
                title: selectedMilestoneForPayment?.milestone || "",
                amount: selectedMilestoneForPayment?.amount || 0,
                projectId: selectedMilestoneForPayment?.projectId || "",
              }}
              type={"customer"}
              onSuccess={() => {
                setPaymentDialogOpen(false);
                refreshProjectData();
                toast({
                  title: t("customer.billing.toast.paymentSuccess"),
                  description: t("customer.billing.toast.paymentSuccessDesc"),
                });
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Budget Dialog */}
        <Dialog open={editBudgetOpen} onOpenChange={setEditBudgetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {t("customer.billing.editBudget.title")}
              </DialogTitle>
              <DialogDescription>
                {t("customer.billing.editBudget.description")}
              </DialogDescription>
            </DialogHeader>
            {selectedBudget && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-category">
                    {t("customer.billing.editBudget.category")}
                  </Label>
                  <Input
                    id="edit-category"
                    defaultValue={selectedBudget.category}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-allocated">
                    {t("customer.billing.editBudget.allocated")}
                  </Label>
                  <Input
                    id="edit-allocated"
                    type="number"
                    defaultValue={selectedBudget.allocated}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-period">
                    {t("customer.billing.editBudget.period")}
                  </Label>
                  <Select
                    defaultValue={
                      selectedBudget.period?.toLowerCase() || "monthly"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">
                        {t("customer.billing.editBudget.monthly")}
                      </SelectItem>
                      <SelectItem value="quarterly">
                        {t("customer.billing.editBudget.quarterly")}
                      </SelectItem>
                      <SelectItem value="yearly">
                        {t("customer.billing.editBudget.yearly")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditBudgetOpen(false)}
              >
                {t("customer.billing.editBudget.cancel")}
              </Button>
              <Button onClick={handleSaveBudgetEdit}>
                {t("customer.billing.editBudget.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}

function AddPaymentMethodForm() {
  const { t } = useI18n();
  return (
    <div className="space-y-4">
      <Tabs defaultValue="card">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="card">
            {t("customer.billing.form.tabCard")}
          </TabsTrigger>
          <TabsTrigger value="bank">
            {t("customer.billing.form.tabBank")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="card" className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">
              {t("customer.payments.form.cardNumber")}
            </Label>
            <Input
              id="cardNumber"
              placeholder={t("customer.payments.form.cardNumberPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="cardName">
              {t("customer.payments.form.cardholderName")}
            </Label>
            <Input
              id="cardName"
              placeholder={t("customer.payments.form.cardholderPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">
                {t("customer.payments.form.expiryDate")}
              </Label>
              <Input
                id="expiry"
                placeholder={t("customer.payments.form.expiryPlaceholder")}
              />
            </div>
            <div>
              <Label htmlFor="cvv">{t("customer.payments.form.cvv")}</Label>
              <Input
                id="cvv"
                placeholder={t("customer.payments.form.cvvPlaceholder")}
              />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="bank" className="space-y-4">
          <div>
            <Label htmlFor="bankName">
              {t("customer.billing.form.bankName")}
            </Label>
            <Select>
              <SelectTrigger>
                <SelectValue
                  placeholder={t("customer.billing.form.selectBank")}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="maybank">Maybank</SelectItem>
                <SelectItem value="cimb">CIMB Bank</SelectItem>
                <SelectItem value="rhb">RHB Bank</SelectItem>
                <SelectItem value="pbb">Public Bank</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="accountNumber">
              {t("customer.billing.form.accountNumber")}
            </Label>
            <Input id="accountNumber" placeholder="1234567890" />
          </div>
          <div>
            <Label htmlFor="accountName">
              {t("customer.billing.form.accountHolderName")}
            </Label>
            <Input id="accountName" placeholder="Tech Innovations Sdn Bhd" />
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="default" className="rounded" />
        <Label htmlFor="default" className="text-sm">
          {t("customer.payments.form.defaultCheckbox")}
        </Label>
      </div>
      <DialogFooter>
        <Button variant="outline">{t("customer.payments.form.cancel")}</Button>
        {/* <Button onClick={onSubmit}>Add Payment Method</Button> */}
      </DialogFooter>
    </div>
  );
}
