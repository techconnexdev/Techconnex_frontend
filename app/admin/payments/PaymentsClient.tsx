"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  DollarSign,
  CreditCard,
  XCircle,
  TrendingUp,
  CheckCircle2,
  Download,
  CalendarRange,
  User,
  ChevronLeft,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  getAdminPayments,
  getAdminPaymentStats,
  getProfileImageUrl,
} from "@/lib/api";
import { useI18n } from "@/contexts/I18nProvider";
import { useToast } from "@/hooks/use-toast";
import {
  milestoneStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/components/admin/payments/payment-i18n-maps";

type Payment = {
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
  project: {
    id: string;
    title: string;
    currencyCode?: string;
    customer: {
      id: string;
      name: string;
      email: string;
      customerProfile?: {
        profileImageUrl?: string;
      };
    };
    provider: {
      id: string;
      name: string;
      email: string;
      providerProfile?: {
        profileImageUrl?: string;
      };
    };
  };
  milestone: {
    id: string;
    title: string;
    status: string;
    amount?: number;
  };
};

type PaymentStats = {
  totalPayments?: number;
  totalVolume?: number;
  totalFees?: number;
  totalRevenue?: number;
  netWorth?: number;
  readyToTransfer?: number;
  failedPayments?: number;
  /** ISO code used for monetary stats (after optional FX conversion). */
  displayCurrency?: string;
  /** True when live FX was unavailable and MYR amounts were returned. */
  displayCurrencyFallback?: boolean;
};

function readAdminPreferredCurrency(): string {
  if (typeof window === "undefined") return "MYR";
  try {
    const raw = localStorage.getItem("user");
    const parsed = raw
      ? (JSON.parse(raw) as {
          settings?: { preferredCurrency?: string };
        })
      : null;
    const code = String(parsed?.settings?.preferredCurrency || "")
      .trim()
      .toUpperCase();
    if (/^[A-Z]{3}$/.test(code)) return code;
  } catch {
    /* ignore */
  }
  return "MYR";
}

const isReadyToTransfer = (payment: Payment) => {
  return (
    payment.status === "ESCROWED" && payment.milestone?.status === "APPROVED"
  );
};

export default function PaymentsClient() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const intlLocale =
    locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US";
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [transferFilter, setTransferFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });

  useEffect(() => {
    void fetchStats();
    const onFocus = () => void fetchStats();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminPayments({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        participant: userFilter.trim() || undefined,
        transfer:
          transferFilter !== "all" ? transferFilter : undefined,
        page: pagination.page,
        limit: pagination.limit,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      if (response.success) {
        setPayments(response.data || []);
        setPagination((prev) => response.pagination || prev);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery,
    statusFilter,
    dateFrom,
    dateTo,
    userFilter,
    transferFilter,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    setPagination((prev) => (prev.page === 1 ? prev : { ...prev, page: 1 }));
  }, [
    searchQuery,
    statusFilter,
    dateFrom,
    dateTo,
    userFilter,
    transferFilter,
  ]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPayments();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [fetchPayments]);

  const fetchStats = async () => {
    try {
      const currency = readAdminPreferredCurrency();
      const response = await getAdminPaymentStats(currency);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "TRANSFERRED":
        return "bg-green-100 text-green-800";
      case "ESCROWED":
        return "bg-blue-100 text-blue-800";
      case "RELEASED":
        return "bg-purple-100 text-purple-800";
      case "PENDING":
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      case "REFUNDED":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(intlLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatMoney = (amount: number, currency?: string) => {
    const code = (currency || "MYR").toUpperCase();
    try {
      return new Intl.NumberFormat(intlLocale, {
        style: "currency",
        currency: code,
      }).format(Number(amount || 0));
    } catch {
      return `${code} ${Number(amount || 0).toLocaleString(intlLocale)}`;
    }
  };

  const getDisplayCurrency = (payment: Payment) => {
    const paymentCurrency = String(payment.currency || "")
      .trim()
      .toUpperCase();
    const projectCurrency = String(payment.project?.currencyCode || "")
      .trim()
      .toUpperCase();

    // Payment row reflects what Stripe charged (updated on escrow). Prefer it for reporting.
    if (paymentCurrency) return paymentCurrency;
    return projectCurrency || "MYR";
  };

  const getPaymentBreakdown = (payment: Payment) => {
    const milestoneAmount = Number(payment.milestone?.amount || 0);
    if (milestoneAmount > 0) {
      const gross = Number((milestoneAmount * 1.05).toFixed(2)); // customer pays +5%
      const platformFee = Number((milestoneAmount * 0.1).toFixed(2)); // platform total 10%
      const providerNet = Number((milestoneAmount * 0.95).toFixed(2)); // provider receives -5%
      return { gross, platformFee, providerNet };
    }
    return {
      gross: Number(payment.amount || 0),
      platformFee: Number(payment.platformFeeAmount || 0),
      providerNet: Number(payment.providerAmount || 0),
    };
  };

  const buildExportQuery = () => ({
    search: searchQuery || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    participant: userFilter.trim() || undefined,
    transfer: transferFilter !== "all" ? transferFilter : undefined,
    page: 1,
    limit: 10000,
    sortBy: "createdAt" as const,
    sortOrder: "desc" as const,
  });

  const tableTotals = payments.reduce(
    (acc, payment) => {
      const displayCurrency = getDisplayCurrency(payment);
      const amounts = getPaymentBreakdown(payment);
      acc.gross += amounts.gross;
      acc.fee += amounts.platformFee;
      acc.net += amounts.providerNet;
      acc.currency = displayCurrency;
      return acc;
    },
    { gross: 0, fee: 0, net: 0, currency: "MYR" },
  );

  const exportPaymentsCsv = async () => {
    try {
      setExporting(true);
      const response = await getAdminPayments(buildExportQuery());
      const rows: Payment[] = response.success ? response.data || [] : [];
      if (rows.length === 0) {
        toast({
          title: t("admin.payments.export.emptyTitle"),
          description: t("admin.payments.export.emptyDescription"),
          variant: "destructive",
        });
        return;
      }
      const header = [
        "ID",
        "Project",
        "Customer",
        "Provider",
        "Gross Amount",
        "Platform Fee",
        "Provider Amount",
        "Currency",
        "Status",
        "Method",
        "Date",
      ];
      const lines = [
        header.join(","),
        ...rows.map((p) => {
          const currency = getDisplayCurrency(p);
          const amounts = getPaymentBreakdown(p);
          const esc = (v: string | number | undefined | null) => {
            const s = v == null ? "" : String(v);
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          };
          return [
            esc(p.id),
            esc(p.project?.title),
            esc(p.project?.customer?.name),
            esc(p.project?.provider?.name),
            esc(amounts.gross),
            esc(amounts.platformFee),
            esc(amounts.providerNet),
            esc(currency),
            esc(p.status),
            esc(p.method),
            esc(formatDate(p.createdAt)),
          ].join(",");
        }),
      ];
      const blob = new Blob(["\uFEFF", lines.join("\r\n")], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
      a.href = url;
      a.download = `payments-export-filtered-${stamp}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        title: t("admin.payments.export.successTitle"),
        description: t("admin.payments.export.successDescription", {
          count: rows.length,
        }),
      });
    } catch (e) {
      console.error(e);
      toast({
        title: t("admin.payments.export.errorTitle"),
        description: t("admin.payments.export.errorDescription"),
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTransferFilter("all");
    setDateFrom("");
    setDateTo("");
    setUserFilter("");
  };

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    statusFilter !== "all" ||
    transferFilter !== "all" ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(userFilter.trim());

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-gray-900">
          {t("admin.payments.page.title")}
        </h1>
        <p className="text-gray-600">{t("admin.payments.page.subtitle")}</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="space-y-2">
          {stats.displayCurrencyFallback ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
              {t("admin.payments.stats.ratesNote", {
                code: String(stats.displayCurrency || "MYR").toUpperCase(),
              })}
            </p>
          ) : null}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("admin.payments.stats.totalTransactions")}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalPayments}
                  </p>
                </div>
                <CreditCard className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-600">
                    {t("admin.payments.stats.totalVolumeLabel")}
                  </p>
                  <p className="text-2xl font-bold text-green-600 truncate">
                    {formatMoney(
                      stats.totalVolume ?? 0,
                      stats.displayCurrency || "MYR",
                    )}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-600">
                    {t("admin.payments.stats.totalRevenue")}
                  </p>
                  <p className="text-2xl font-bold text-purple-600 truncate">
                    {formatMoney(
                      stats.totalRevenue ?? 0,
                      stats.displayCurrency || "MYR",
                    )}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600 shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("admin.payments.stats.readyToTransfer")}
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.readyToTransfer}
                  </p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t("admin.payments.stats.failed")}
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.failedPayments}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-600" aria-hidden />
            {t("admin.payments.filters.title")}
          </CardTitle>
          <CardDescription>{t("admin.payments.filters.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 pt-2">
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="payments-search">{t("admin.payments.filters.transactionSearchLabel")}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <Input
                  id="payments-search"
                  placeholder={t("admin.payments.filters.searchPlaceholder")}
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payments-user-filter">{t("admin.payments.filters.participantLabel")}</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <Input
                  id="payments-user-filter"
                  placeholder={t("admin.payments.filters.participantPlaceholder")}
                  className="pl-10"
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.payments.filters.statusLabel")}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("admin.payments.filters.statusAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.payments.filters.statusAll")}
                  </SelectItem>
                  <SelectItem value="PENDING">
                    {t("admin.payments.filters.status.PENDING")}
                  </SelectItem>
                  <SelectItem value="IN_PROGRESS">
                    {t("admin.payments.filters.status.IN_PROGRESS")}
                  </SelectItem>
                  <SelectItem value="ESCROWED">
                    {t("admin.payments.filters.status.ESCROWED")}
                  </SelectItem>
                  <SelectItem value="RELEASED">
                    {t("admin.payments.filters.status.RELEASED")}
                  </SelectItem>
                  <SelectItem value="TRANSFERRED">
                    {t("admin.payments.filters.status.TRANSFERRED")}
                  </SelectItem>
                  <SelectItem value="FAILED">
                    {t("admin.payments.filters.status.FAILED")}
                  </SelectItem>
                  <SelectItem value="REFUNDED">
                    {t("admin.payments.filters.status.REFUNDED")}
                  </SelectItem>
                  <SelectItem value="COMPLETED">
                    {t("admin.payments.filters.status.COMPLETED")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t("admin.payments.filters.transferLabel")}</Label>
              <Select value={transferFilter} onValueChange={setTransferFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("admin.payments.filters.transferAll")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.payments.filters.transferAll")}
                  </SelectItem>
                  <SelectItem value="ready-to-transfer">
                    {t("admin.payments.filters.transferReady")}
                  </SelectItem>
                  <SelectItem value="normal">
                    {t("admin.payments.filters.transferNormal")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
              <CalendarRange className="w-4 h-4 shrink-0" aria-hidden />
              {t("admin.payments.filters.dateRangeHeading")}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
              <div className="space-y-2">
                <Label htmlFor="payments-date-from">{t("admin.payments.filters.dateFrom")}</Label>
                <Input
                  id="payments-date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="payments-date-to">{t("admin.payments.filters.dateTo")}</Label>
                <Input
                  id="payments-date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 sm:col-span-2 lg:justify-end lg:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void exportPaymentsCsv()}
                  disabled={exporting}
                >
                  <Download className="w-4 h-4 mr-2 shrink-0" />
                  {exporting
                    ? t("admin.payments.export.exporting")
                    : t("admin.payments.export.filtered")}
                </Button>
                {hasActiveFilters ? (
                  <Button type="button" variant="ghost" onClick={clearAllFilters}>
                    {t("admin.payments.filters.clearAll")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {t("admin.payments.table.title", {
              count: pagination.total,
            })}
          </CardTitle>
          <CardDescription>{t("admin.payments.table.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">{t("admin.payments.table.loading")}</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">{t("admin.payments.table.empty")}</p>
            </div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.payments.table.col.transaction")}</TableHead>
                  <TableHead>{t("admin.payments.table.col.participants")}</TableHead>
                  <TableHead>{t("admin.payments.table.col.amount")}</TableHead>
                  <TableHead>{t("admin.payments.table.col.status")}</TableHead>
                  <TableHead>{t("admin.payments.table.col.method")}</TableHead>
                  <TableHead>{t("admin.payments.table.col.date")}</TableHead>
                  <TableHead className="text-right">
                    {t("admin.payments.table.col.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const readyToTransfer = isReadyToTransfer(payment);
                  const displayCurrency = getDisplayCurrency(payment);
                  const amounts = getPaymentBreakdown(payment);
                  return (
                    <TableRow
                      key={payment.id}
                      className={
                        readyToTransfer ? "bg-blue-50 hover:bg-blue-100" : ""
                      }
                    >
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">
                              #{payment.id.slice(0, 8)}
                            </p>
                            {readyToTransfer && (
                              <Badge className="bg-blue-600 text-white">
                                {t("admin.payments.badge.readyToTransfer")}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {payment.project.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {payment.milestone.title}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage
                                src={getProfileImageUrl(
                                  payment.project.customer.customerProfile
                                    ?.profileImageUrl
                                )}
                              />
                              <AvatarFallback>
                                {payment.project.customer.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {payment.project.customer.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage
                                src={getProfileImageUrl(
                                  payment.project.provider.providerProfile
                                    ?.profileImageUrl
                                )}
                              />
                              <AvatarFallback>
                                {payment.project.provider.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {payment.project.provider.name}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {formatMoney(amounts.gross, displayCurrency)}
                          </p>
                          {amounts.platformFee > 0 && (
                            <p className="text-sm text-gray-500">
                              {t("admin.payments.table.feeLine", {
                                amount: formatMoney(
                                  amounts.platformFee,
                                  displayCurrency
                                ),
                              })}
                            </p>
                          )}
                          <p className="text-sm font-medium text-green-600">
                            {t("admin.payments.table.netLine", {
                              amount: formatMoney(
                                amounts.providerNet,
                                displayCurrency
                              ),
                            })}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {paymentStatusLabel(payment.status, t)}
                        </Badge>
                        {payment.milestone && (
                          <p className="text-xs text-gray-500 mt-1">
                            {t("admin.payments.table.milestoneLine", {
                              status: milestoneStatusLabel(
                                payment.milestone.status,
                                t
                              ),
                            })}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {paymentMethodLabel(payment.method, t)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {t("admin.payments.table.created", {
                              date: formatDate(payment.createdAt),
                            })}
                          </p>
                          {payment.escrowedAt && (
                            <p className="text-xs text-gray-500">
                              {t("admin.payments.table.escrowed", {
                                date: formatDate(payment.escrowedAt),
                              })}
                            </p>
                          )}
                          {payment.releasedAt && (
                            <p className="text-xs text-gray-500">
                              {t("admin.payments.table.released", {
                                date: formatDate(payment.releasedAt),
                              })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>
                              {t("admin.payments.actions.label")}
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/payments/${payment.id}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {t("admin.payments.actions.viewDetails")}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {readyToTransfer && (
                              <DropdownMenuItem
                                className="text-blue-600"
                                onClick={() =>
                                  router.push(`/admin/payments/${payment.id}`)
                                }
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                {t("admin.payments.actions.processTransfer")}
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {payments.length > 0 && (
                  <TableRow className="bg-gray-50 border-t-2">
                    <TableCell colSpan={2}>
                      <p className="font-semibold text-gray-900">
                        {t("admin.payments.table.filteredTotals")}
                      </p>
                      <p className="text-xs text-gray-500">
                        {t("admin.payments.table.filteredTotalsHint")}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {formatMoney(tableTotals.gross, tableTotals.currency)}
                        </p>
                        <p className="text-sm text-gray-600">
                          {t("admin.payments.table.feeLine", {
                            amount: formatMoney(
                              tableTotals.fee,
                              tableTotals.currency
                            ),
                          })}
                        </p>
                        <p className="text-sm font-semibold text-green-700">
                          {t("admin.payments.table.netLine", {
                            amount: formatMoney(
                              tableTotals.net,
                              tableTotals.currency
                            ),
                          })}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell colSpan={4} />
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {pagination.totalPages > 1 && pagination.total > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t pt-4 mt-4">
                <p className="text-sm text-gray-600">
                  {t("admin.payments.pagination.summary", {
                    from: Math.min(
                      (pagination.page - 1) * pagination.limit + 1,
                      pagination.total,
                    ),
                    to: Math.min(
                      pagination.page * pagination.limit,
                      pagination.total,
                    ),
                    total: pagination.total,
                  })}
                </p>
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        page: Math.max(1, p.page - 1),
                      }))
                    }
                    aria-label={t("admin.payments.pagination.prev")}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-700 tabular-nums min-w-[5rem] text-center">
                    {t("admin.payments.pagination.pageOf", {
                      page: pagination.page,
                      totalPages: pagination.totalPages,
                    })}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      pagination.page >= pagination.totalPages || loading
                    }
                    onClick={() =>
                      setPagination((p) => ({
                        ...p,
                        page: Math.min(p.totalPages, p.page + 1),
                      }))
                    }
                    aria-label={t("admin.payments.pagination.next")}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
