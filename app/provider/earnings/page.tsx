"use client";

import { useEffect, useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Eye,
  CreditCard,
  Wallet,
  BarChart3,
  Edit,
  Trash2,
  Building2,
  Plus,
  AlertCircle,
} from "lucide-react";
import { ProviderEarningsTour } from "@/components/provider/ProviderEarningsTour";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getKycDocuments } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useI18n } from "@/contexts/I18nProvider";
import { ProviderEarningsPageSkeleton } from "@/components/provider/ProviderEarningsSkeletons";
import { getProfileImageUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
type PayoutMethodType = "BANK" | "PAYPAL" | "PAYONEER" | "WISE" | "EWALLET";
interface PayoutMethod {
  id: string;
  type: PayoutMethodType;
  label?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  accountEmail?: string;
  walletId?: string;
  createdAt: string;
  updatedAt: string;
}

type EarningsData = {
  totalEarnings: number;
  preferredCurrency?: string;
  thisMonth: number;
  monthlyGrowth: number;
  pendingPayments: number;
  availableBalance: number;
  averageProjectValue: number;
  stripeAccountId?: string;
};

type QuickStats = {
  projectsThisMonth: number;
  successRate: number;
  repeatClientsPercent: number;
};

type Payment = {
  id: string;
  project: string;
  client: string;
  milestone: string;
  amount: number;
  currency?: string;
  status: string;
  date: string;
  avatar?: string;
  originalAmount?: number;
  originalCurrency?: string;
  preferredAmount?: number | null;
  preferredCurrency?: string;
};

type MonthlyEarning = {
  month: string;
  monthStartIso?: string;
  projects: number;
  amount: number;
};

export default function ProviderEarningsPage() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [timeFilter, setTimeFilter] = useState("this-month");
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PayoutMethod | null>(null);
  const [payoutMethods, setPayoutMethods] = useState<PayoutMethod[]>([]);
  const [formData, setFormData] = useState({
    type: "BANK" as PayoutMethodType,
    label: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    accountEmail: "",
    walletId: "",
  });
  const [isProviderVerified, setIsProviderVerified] = useState<boolean | null>(null);

  useEffect(() => {
    const fetchEarnings = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.warn("⚠️ No token found");
          setLoading(false);
          return;
        }

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/provider/earnings/overview`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          },
        );

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setEarningsData(data.earningsData);
        setRecentPayments(data.recentPayments);
        setMonthlyEarnings(data.monthlyEarnings);
        setQuickStats(data.quickStats);

        // Extract available years from monthly earnings
        const years = new Set<number>();
        data.monthlyEarnings?.forEach((earning: MonthlyEarning) => {
          // Parse year from month string (e.g., "Nov 2025" -> 2025)
          const yearMatch = earning.month.match(/\d{4}/);
          if (yearMatch) {
            years.add(parseInt(yearMatch[0], 10));
          }
        });
        const sortedYears = Array.from(years).sort((a, b) => b - a);
        setAvailableYears(sortedYears);

        // Set default year to current year or most recent year with data
        if (sortedYears.length > 0) {
          const currentYear = new Date().getFullYear();
          const defaultYear = sortedYears.includes(currentYear)
            ? currentYear
            : sortedYears[0];
          setSelectedYear(defaultYear);
        }
        // Use bankDetails returned from API
        // const _bd = data.bankDetails;
        // if (_bd && Object.values(_bd).some((val) => val)) {
        //   setBankAccount([_bd]);
        // } else {
        //   setBankAccount([]);
        // }
      } catch (err) {
        toast({
          title: t("provider.earnings.toast.errorTitle"),
          description: getUserFriendlyErrorMessage(
            err,
            "provider earnings fetch",
          ),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEarnings();
  }, []);

  // Fetch payout methods from backend
  const fetchPayoutMethods = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/provider/earnings/bank`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!res.ok) throw new Error("Failed to fetch payout methods");

      const result = await res.json();
      setPayoutMethods(result.payoutMethods || []);
    } catch (err) {
      toast({
        title: t("provider.earnings.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          err,
          "provider earnings payout methods",
        ),
        variant: "destructive",
      });
    }
  };

  // On component mount
  useEffect(() => {
    fetchPayoutMethods();
  }, []);

  // Fetch KYC status to show verification warning (unverified providers cannot receive payouts)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          if (mounted) setIsProviderVerified(false);
          return;
        }
        const kycResp = await getKycDocuments();
        const docsData = (kycResp?.data?.documents ?? kycResp?.data ?? []) as Array<{ status?: string }>;
        const verified = docsData.some((d) => {
          const raw = String(d?.status ?? "").toLowerCase();
          return raw === "verified" || raw === "approved";
        });
        if (mounted) setIsProviderVerified(verified);
      } catch {
        if (mounted) setIsProviderVerified(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Save (create/update) payout method
  const handleSavePayoutMethod = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      // Validation
      if (formData.type === "BANK") {
        if (
          !formData.bankName ||
          !formData.accountNumber ||
          !formData.accountHolder
        )
          throw new Error(t("provider.earnings.validation.bankFields"));
      } else if (!formData.accountEmail) {
        throw new Error(t("provider.earnings.validation.emailRequired"));
      }

      const url = editingMethod
        ? `${process.env.NEXT_PUBLIC_API_URL}/provider/earnings/bank/${editingMethod.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/provider/earnings/bank`;
      const method = editingMethod ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save payout method");

      toast({
        title: t("provider.earnings.toast.successTitle"),
        description: editingMethod
          ? t("provider.earnings.toast.payoutUpdated")
          : t("provider.earnings.toast.payoutAdded"),
      });

      setShowAddForm(false);
      setEditingMethod(null);
      resetForm();
      await fetchPayoutMethods();
    } catch (err: unknown) {
      toast({
        title: t("provider.earnings.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          err,
          "provider earnings save payout method",
        ),
        variant: "destructive",
      });
    }
  };

  // Delete payout method
  const handleDeletePayoutMethod = async (id: string) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Unauthorized");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/provider/earnings/bank/${id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) throw new Error("Failed to delete payout method");

      toast({
        title: t("provider.earnings.toast.deletedTitle"),
        description: t("provider.earnings.toast.payoutRemoved"),
      });
      await fetchPayoutMethods();
    } catch (err: unknown) {
      toast({
        title: t("provider.earnings.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          err,
          "provider earnings delete payout method",
        ),
        variant: "destructive",
      });
    }
  };

  // Edit payout method
  const handleEditPayoutMethod = (method: PayoutMethod) => {
    setEditingMethod(method);
    setFormData({
      type: method.type,
      label: method.label || "",
      bankName: method.bankName || "",
      accountNumber: method.accountNumber || "",
      accountHolder: method.accountHolder || "",
      accountEmail: method.accountEmail || "",
      walletId: method.walletId || "",
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({
      type: "BANK",
      label: "",
      bankName: "",
      accountNumber: "",
      accountHolder: "",
      accountEmail: "",
      walletId: "",
    });
  };

  // Export earnings report
  const handleExportReport = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: t("provider.earnings.toast.errorTitle"),
          description: t("provider.earnings.toast.loginForExport"),
          variant: "destructive",
        });
        return;
      }

      const exportCurrency = String(
        earningsData?.preferredCurrency || "MYR",
      ).toUpperCase();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/provider/earnings/export/report?timeFilter=${encodeURIComponent(timeFilter)}&lang=${encodeURIComponent(locale)}&currency=${encodeURIComponent(exportCurrency)}`,
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
          title: t("provider.earnings.toast.exportReadyTitle"),
          description: t("provider.earnings.toast.exportReadyDesc"),
        });
      } else {
        throw new Error(data.message || "Failed to get download URL");
      }
    } catch (err: unknown) {
      toast({
        title: t("provider.earnings.toast.exportFailedTitle"),
        description: getUserFriendlyErrorMessage(
          err,
          "provider earnings export report",
        ),
        variant: "destructive",
      });
    }
  };

  const getPayoutIcon = (type: PayoutMethodType) => {
    switch (type) {
      case "BANK":
        return <Building2 className="w-6 h-6" />;
      case "PAYPAL":
        return <Wallet className="w-6 h-6" />;
      case "PAYONEER":
        return <CreditCard className="w-6 h-6" />;
      case "WISE":
        return <TrendingUp className="w-6 h-6" />;
      case "EWALLET":
        return <Wallet className="w-6 h-6" />;
      default:
        return <CreditCard className="w-6 h-6" />;
    }
  };

  const getPayoutDisplayText = (method: PayoutMethod) => {
    if (method.type === "BANK") {
      return {
        title:
          method.label ||
          method.bankName ||
          t("provider.earnings.methods.bankAccountFallback"),
        subtitle: method.accountNumber ? `${method.accountNumber}` : "",
        details: method.accountHolder || "",
      };
    } else {
      return {
        title: method.label || method.type,
        subtitle: method.accountEmail || "",
        details: method.walletId || "",
      };
    }
  };

  // Handlers to add or delete bank details
  // const handleAddBankDetails = async () => {
  //   if (!newBankName || !newAccountNumber || !newAccountName || !newSwiftCode) {
  //     alert("Please fill in all bank details");
  //     return;
  //   }
  //   const token = localStorage.getItem("token");
  //   if (!token) return;
  //   try {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/provider/earnings/bank`,
  //       {
  //         method: "PUT",
  //         headers: {
  //           "Content-Type": "application/json",
  //           Authorization: `Bearer ${token}`,
  //         },
  //         body: JSON.stringify({
  //           bankName: newBankName,
  //           bankAccountNumber: newAccountNumber,
  //           bankAccountName: newAccountName,
  //           bankSwiftCode: newSwiftCode,
  //         }),
  //       }
  //     );
  //     if (!res.ok) throw new Error("Failed to add bank details");
  //     const data = await res.json();
  //     const _bd2 = data.bankDetails;
  //     if (_bd2 && Object.values(_bd2).some((val) => val)) {
  //       setBankAccount([_bd2]);
  //     } else {
  //       setBankAccount([]);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  // const handleDeleteBankDetails = async () => {
  //   const token = localStorage.getItem("token");
  //   if (!token) return;
  //   try {
  //     const res = await fetch(
  //       `${process.env.NEXT_PUBLIC_API_URL}/provider/earnings/bank`,
  //       {
  //         method: "DELETE",
  //         headers: { Authorization: `Bearer ${token}` },
  //       }
  //     );
  //     if (!res.ok) throw new Error("Failed to delete bank details");
  //     setBankAccount([]);
  //   } catch (err) {
  //     console.error(err);
  //   }
  // };

  if (loading) {
    return (
      <>
        <ProviderEarningsTour />
        <ProviderEarningsPageSkeleton
          loadingLabel={t("provider.earnings.loading")}
        />
      </>
    );
  }

  if (!earningsData) {
    return (
      
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">{t("provider.earnings.noData")}</p>
        </div>
      
    );
  }

  const getPayoutTypeLabel = (type: PayoutMethodType) => {
    switch (type) {
      case "BANK":
        return t("provider.earnings.payoutType.BANK");
      case "PAYPAL":
        return t("provider.earnings.payoutType.PAYPAL");
      case "PAYONEER":
        return t("provider.earnings.payoutType.PAYONEER");
      case "WISE":
        return t("provider.earnings.payoutType.WISE");
      case "EWALLET":
        return t("provider.earnings.payoutType.EWALLET");
      default:
        return type;
    }
  };
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


  const getStatusText = (status: string) => {
    switch (String(status || "").toLowerCase()) {
      case "released":
      case "transferred":
      case "completed":
        return t("provider.earnings.paymentStatus.released");
      case "pending":
        return t("provider.earnings.paymentStatus.pending");
      case "in_progress":
      case "processing":
        return t("provider.earnings.paymentStatus.in_progress");
      default:
        return status;
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

  const renderDualPaymentAmount = (payment: Payment) => {
    const originalAmount = Number(
      payment.originalAmount ?? payment.amount ?? 0,
    );
    const originalCurrency = String(
      payment.originalCurrency || payment.currency || "MYR",
    ).toUpperCase();
    const preferredCurrency = String(
      payment.preferredCurrency || originalCurrency,
    ).toUpperCase();
    const preferredAmount =
      payment.preferredAmount != null
        ? Number(payment.preferredAmount)
        : null;
    const showDual =
      preferredAmount != null && preferredCurrency !== originalCurrency;

    return (
      <>
        <p className="font-semibold text-sm md:text-base">
          {formatMoney(originalAmount, originalCurrency)}
        </p>
        {showDual && (
          <p className="text-xs text-gray-500 mt-0.5">
            {formatMoney(preferredAmount, preferredCurrency)}
          </p>
        )}
      </>
    );
  };

  const formatPaymentDateTime = (value?: string) => {
    const d = value ? new Date(value) : null;
    if (!d || Number.isNaN(d.getTime())) return value || "-";
    const localeTag =
      locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US";
    return d.toLocaleString(localeTag, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <ProviderEarningsTour />
      <div className="space-y-6 md:space-y-8 px-4 md:px-0">
        {/* Verification warning: unverified providers cannot receive payouts */}
        {isProviderVerified === false && (
          <Link
            href="/provider/profile?tab=verification"
            className="flex flex-wrap items-center gap-2 sm:gap-3 py-3 px-4 rounded-lg border border-amber-200 bg-amber-50/90 hover:bg-amber-100/90 hover:border-amber-300 w-full text-left transition-colors"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                {t("provider.earnings.verify.title")}
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                {t("provider.earnings.verify.desc")}
              </p>
            </div>
          </Link>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" data-tour-step="0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {t("provider.earnings.title")}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {t("provider.earnings.subtitle")}
            </p>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Currency preference can be changed in{" "}
              <Link
                href="/provider/settings?tab=language"
                className="text-blue-600 hover:underline"
              >
                Settings → Language
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto" data-tour-step="1">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-full sm:w-48 text-sm md:text-base">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">
                  {t("provider.earnings.timeFilter.thisWeek")}
                </SelectItem>
                <SelectItem value="this-month">
                  {t("provider.earnings.timeFilter.thisMonth")}
                </SelectItem>
                <SelectItem value="last-month">
                  {t("provider.earnings.timeFilter.lastMonth")}
                </SelectItem>
                <SelectItem value="this-year">
                  {t("provider.earnings.timeFilter.thisYear")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={handleExportReport}
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              {t("provider.earnings.exportReport")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" data-tour-step="2">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-600">
                    {t("provider.earnings.stats.totalEarnings")}
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900">
                    {formatMoney(
                      earningsData.totalEarnings,
                      earningsData.preferredCurrency || "MYR",
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-600">
                    {t("provider.earnings.stats.thisMonth")}
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">
                    {formatMoney(
                      earningsData.thisMonth,
                      earningsData.preferredCurrency || "MYR",
                    )}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">
                      +{earningsData.monthlyGrowth}%
                    </span>
                  </div>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs md:text-sm font-medium text-gray-600">
                    {t("provider.earnings.stats.pendingPayments")}
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-yellow-600">
                    {formatMoney(
                      earningsData.pendingPayments,
                      earningsData.preferredCurrency || "MYR",
                    )}
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <Wallet className="w-5 h-5 md:w-6 md:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs md:text-sm font-medium text-gray-600">
                    {t("provider.earnings.stats.availableBalance")}
                  </p>
                  <p className="text-xl md:text-2xl font-bold text-purple-600">
                    {formatMoney(
                      earningsData.availableBalance,
                      earningsData.preferredCurrency || "MYR",
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    {t("provider.earnings.stats.availableBalanceHint")}
                  </p>
                </div>
                <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-2">
                  <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6" data-tour-step="3">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview" className="text-xs md:text-sm">
              {t("provider.earnings.tabs.overview")}
            </TabsTrigger>
            <TabsTrigger value="payments" className="text-xs md:text-sm">
              {t("provider.earnings.tabs.paymentHistory")}
            </TabsTrigger>
            {/* <TabsTrigger value="analytics">Analytics</TabsTrigger> */}
            {/* <TabsTrigger value="withdraw">Withdraw</TabsTrigger> */}
            <TabsTrigger value="methods" className="text-xs md:text-sm">
              {t("provider.earnings.tabs.paymentMethods")}
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-4 md:gap-6" data-tour-step="4">
              <div className="lg:col-span-2 space-y-6">
                {/* Monthly Earnings Chart */}
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                        <BarChart3 className="w-4 h-4 md:w-5 md:h-5" />
                        {t("provider.earnings.monthlyTrend.title")}
                      </CardTitle>
                      {availableYears.length > 0 && (
                        <Select
                          value={selectedYear?.toString() || ""}
                          onValueChange={(value) =>
                            setSelectedYear(parseInt(value, 10))
                          }
                        >
                          <SelectTrigger className="w-full sm:w-48 text-sm md:text-base">
                            <SelectValue
                              placeholder={t(
                                "provider.earnings.monthlyTrend.selectYear",
                              )}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {availableYears.map((year) => {
                              const currentYear = new Date().getFullYear();
                              const isOnlyYear = availableYears.length === 1;
                              const isCurrentYear = year === currentYear;
                              const label =
                                isOnlyYear && isCurrentYear
                                  ? t(
                                      "provider.earnings.monthlyTrend.yearOnlyData",
                                      { year },
                                    )
                                  : year.toString();

                              return (
                                <SelectItem key={year} value={year.toString()}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {monthlyEarnings
                        .filter((month) => {
                          if (!selectedYear) return true;
                          // Extract year from month string (e.g., "Nov 2025" -> 2025)
                          const yearMatch = month.month.match(/\d{4}/);
                          if (!yearMatch) return false;
                          return parseInt(yearMatch[0], 10) === selectedYear;
                        })
                        .map((month) => (
                          <div
                            key={month.month}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                          >
                            <div className="flex items-center space-x-2 md:space-x-3">
                              <div className="w-2 h-2 md:w-3 md:h-3 bg-blue-500 rounded-full flex-shrink-0" />
                              <span className="font-medium text-sm md:text-base">
                                {month.month}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2 md:space-x-4">
                              <span className="text-xs md:text-sm text-gray-500">
                                {t("provider.earnings.monthlyTrend.projectsCount", {
                                  n: month.projects,
                                })}
                              </span>
                              <span className="font-semibold text-sm md:text-base">
                                {formatMoney(
                                  month.amount,
                                  earningsData.preferredCurrency || "MYR",
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      {monthlyEarnings.filter((month) => {
                        if (!selectedYear) return false;
                        const yearMatch = month.month.match(/\d{4}/);
                        if (!yearMatch) return false;
                        return parseInt(yearMatch[0], 10) === selectedYear;
                      }).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          {t("provider.earnings.monthlyTrend.emptyYear", {
                            year: selectedYear ?? "",
                          })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Payments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">
                      {t("provider.earnings.recentPayments.title")}
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      {t("provider.earnings.recentPayments.desc")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentPayments.slice(0, 4).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                            <Avatar className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                              <AvatarImage
                                src={getProfileImageUrl(payment.avatar)}
                              />
                              <AvatarFallback>
                                {payment.client.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm md:text-base truncate">
                                {payment.project}
                              </p>
                              <p className="text-xs md:text-sm text-gray-600 truncate">
                                {payment.client}
                              </p>
                              <p className="text-xs text-gray-500">
                                {payment.milestone}
                              </p>
                            </div>
                          </div>
                          <div className="text-left sm:text-right flex-shrink-0">
                            {renderDualPaymentAmount(payment)}
                            <Badge
                              className={`${getStatusColor(payment.status)} text-xs mt-1`}
                            >
                              {getStatusText(payment.status)}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatPaymentDateTime(payment.date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Quick Stats */}
                <Card data-tour-step="5">
                  <CardHeader>
                    <CardTitle className="text-base md:text-lg">
                      {t("provider.earnings.quickStats.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">
                        {t("provider.earnings.quickStats.avgProjectValue")}
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {formatMoney(
                          earningsData.averageProjectValue,
                          earningsData.preferredCurrency || "MYR",
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">
                        {t("provider.earnings.quickStats.projectsThisMonth")}
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {quickStats?.projectsThisMonth.toLocaleString() ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">
                        {t("provider.earnings.quickStats.successRate")}
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {quickStats?.successRate.toLocaleString() ?? 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs md:text-sm text-gray-600">
                        {t("provider.earnings.quickStats.repeatClients")}
                      </span>
                      <span className="font-semibold text-sm md:text-base">
                        {quickStats?.repeatClientsPercent.toLocaleString() ?? 0}
                        %
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Top Clients */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle>Top Clients</CardTitle>
                    <CardDescription>
                      Clients with highest total payments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {topClients.map((client, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={client.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{client.name}</p>
                            <p className="text-sm text-gray-500">{client.projects} projects</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">RM{client.totalPaid.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card> */}

                {/* Withdraw Balance */}
                {/* <Card>
                  <CardHeader>
                    <CardTitle>Available Balance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center space-y-4">
                      <div>
                        <p className="text-3xl font-bold text-green-600">
                          RM{earningsData.availableBalance.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500">
                          Ready to withdraw
                        </p>
                      </div>
                      <Button className="w-full">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Withdraw Funds
                      </Button>
                    </div>
                  </CardContent>
                </Card> */}
              </div>
            </div>
          </TabsContent>

          {/* Payment History */}
          <TabsContent value="payments">
            <Card>
              <CardHeader>
                <CardTitle>{t("provider.earnings.history.title")}</CardTitle>
                <CardDescription>
                  {t("provider.earnings.history.desc")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                        <Avatar className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0">
                          <AvatarImage
                            src={getProfileImageUrl(payment.avatar)}
                          />
                          <AvatarFallback>
                            {payment.client.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm md:text-base truncate">
                            {payment.project}
                          </p>
                          <p className="text-xs md:text-sm text-gray-600 truncate">
                            {payment.client}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.milestone} •{" "}
                            {formatPaymentDateTime(payment.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-shrink-0">
                        <div className="text-left sm:text-right">
                          {renderDualPaymentAmount(payment)}
                          <Badge
                            className={`${getStatusColor(payment.status)} text-xs mt-1`}
                          >
                            {getStatusText(payment.status)}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full sm:w-auto text-xs md:text-sm"
                          onClick={() =>
                            router.push(
                              `/provider/earnings/transactions/${payment.id}`,
                            )
                          }
                        >
                          <Eye className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                          {t("provider.earnings.history.details")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics */}
          {/* <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Earnings by Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full" />
                        <span className="text-sm">Web Development</span>
                      </div>
                      <span className="font-semibold">RM45,200 (53%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full" />
                        <span className="text-sm">Mobile Development</span>
                      </div>
                      <span className="font-semibold">RM25,800 (30%)</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        <span className="text-sm">Cloud Services</span>
                      </div>
                      <span className="font-semibold">RM14,000 (17%)</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Project Completion Rate
                      </span>
                      <span className="font-semibold">98%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        On-time Delivery
                      </span>
                      <span className="font-semibold">94%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Client Satisfaction
                      </span>
                      <span className="font-semibold">4.9/5.0</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Response Time
                      </span>
                      <span className="font-semibold">2.3 hours</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent> */}

          {/* Withdraw */}
          {/* <TabsContent value="withdraw">
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Withdraw Funds</CardTitle>
                  <CardDescription>
                    Transfer your earnings to your bank account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">
                          Available Balance
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                          RM{earningsData.availableBalance.toLocaleString()}
                        </p>
                      </div>
                      <Wallet className="w-8 h-8 text-green-600" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Bank Account
                      </label>

                      {hasStripeAccount ? (
                        <Select
                          value={selectedBank || ""}
                          onValueChange={setSelectedBank}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select bank account" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="maybank">
                              Maybank - ****1234
                            </SelectItem>
                            <SelectItem value="cimb">
                              CIMB Bank - ****5678
                            </SelectItem>
                            <SelectItem value="public">
                              Public Bank - ****9012
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                          ⚠️ You need to connect your Stripe account before
                          withdrawing funds.
                        </div>
                      )}

                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) =>
                          setWithdrawAmount(Number(e.target.value))
                        }
                        className="w-full pl-12 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-2"
                        placeholder="0.00"
                        max={earningsData.availableBalance}
                        disabled={!hasStripeAccount}
                      />
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium text-blue-800 mb-2">
                        Withdrawal Information
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Processing time: 1-3 business days</li>
                        <li>• No withdrawal fees for amounts above RM100</li>
                        <li>• Minimum withdrawal amount: RM50</li>
                      </ul>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleWithdraw}
                      disabled={isWithdrawing || !hasStripeAccount}
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      {isWithdrawing ? "Processing..." : "Request Withdrawal"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent> */}

          {/* Payment Methods Tab */}
          {/* Payment Methods Tab */}
          <TabsContent value="methods" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-base md:text-lg">
                      {t("provider.earnings.methods.title")}
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      {t("provider.earnings.methods.desc")}
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingMethod(null);
                      resetForm();
                      setShowAddForm(true);
                    }}
                    className="w-full sm:w-auto text-xs md:text-sm"
                  >
                    <Plus className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                    {t("provider.earnings.methods.add")}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payoutMethods?.length === 0 ? (
                  <div className="text-center py-8 md:py-12">
                    <Wallet className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm md:text-base text-gray-500 mb-4">
                      {t("provider.earnings.methods.empty")}
                    </p>
                    <Button
                      onClick={() => {
                        setEditingMethod(null);
                        resetForm();
                        setShowAddForm(true);
                      }}
                      className="text-xs md:text-sm"
                    >
                      <Plus className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                      {t("provider.earnings.methods.addFirst")}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {payoutMethods?.map((method) => {
                      const displayInfo = getPayoutDisplayText(method);
                      return (
                        <Card
                          key={method.id}
                          className="border-2 hover:border-primary/50 transition-colors"
                        >
                          <CardContent className="p-4 md:p-6">
                            <div className="flex items-start justify-between mb-4 gap-3">
                              <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary flex-shrink-0">
                                  {getPayoutIcon(method.type)}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="font-semibold text-base md:text-lg truncate">
                                    {displayInfo.title}
                                  </p>
                                  <p className="text-xs md:text-sm text-muted-foreground truncate">
                                    {displayInfo.subtitle}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="secondary"
                                className="text-xs flex-shrink-0"
                              >
                                {getPayoutTypeLabel(method.type)}
                              </Badge>
                            </div>
                            {displayInfo.details && (
                              <p className="text-xs md:text-sm text-gray-600 mb-4">
                                {displayInfo.details}
                              </p>
                            )}
                            <div className="flex flex-col sm:flex-row gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto text-xs md:text-sm"
                                onClick={() => handleEditPayoutMethod(method)}
                              >
                                <Edit className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                {t("provider.earnings.methods.actions.edit")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto text-xs md:text-sm text-destructive hover:text-destructive bg-transparent"
                                onClick={() =>
                                  handleDeletePayoutMethod(method.id)
                                }
                              >
                                <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                                {t("provider.earnings.methods.actions.remove")}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingMethod
                ? t("provider.earnings.dialog.titleEdit")
                : t("provider.earnings.dialog.titleAdd")}
            </DialogTitle>
            <DialogDescription>
              {editingMethod
                ? t("provider.earnings.dialog.descEdit")
                : t("provider.earnings.dialog.descAdd")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">
                {t("provider.earnings.dialog.methodType")}
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value: PayoutMethodType) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BANK">
                    {t("provider.earnings.payoutType.BANK")}
                  </SelectItem>
                  <SelectItem value="PAYPAL">
                    {t("provider.earnings.payoutType.PAYPAL")}
                  </SelectItem>
                  <SelectItem value="PAYONEER">
                    {t("provider.earnings.payoutType.PAYONEER")}
                  </SelectItem>
                  <SelectItem value="WISE">
                    {t("provider.earnings.payoutType.WISE")}
                  </SelectItem>
                  <SelectItem value="EWALLET">
                    {t("provider.earnings.payoutType.EWALLET")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">
                {t("provider.earnings.dialog.labelOptional")}
              </Label>
              <Input
                id="label"
                placeholder={t("provider.earnings.dialog.labelPlaceholder")}
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </div>

            {formData.type === "BANK" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">
                    {t("provider.earnings.dialog.bankName")}
                  </Label>
                  <Input
                    id="bankName"
                    placeholder={t("provider.earnings.dialog.bankNamePh")}
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">
                    {t("provider.earnings.dialog.accountNumber")}
                  </Label>
                  <Input
                    id="accountNumber"
                    placeholder={t("provider.earnings.dialog.accountNumberPh")}
                    value={formData.accountNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountNumber: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountHolder">
                    {t("provider.earnings.dialog.accountHolder")}
                  </Label>
                  <Input
                    id="accountHolder"
                    placeholder={t("provider.earnings.dialog.accountHolderPh")}
                    value={formData.accountHolder}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountHolder: e.target.value,
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="accountEmail">
                    {t("provider.earnings.dialog.email")}
                  </Label>
                  <Input
                    id="accountEmail"
                    type="email"
                    placeholder={t("provider.earnings.dialog.emailPh")}
                    value={formData.accountEmail}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        accountEmail: e.target.value,
                      })
                    }
                  />
                </div>
                {formData.type === "EWALLET" && (
                  <div className="space-y-2">
                    <Label htmlFor="walletId">
                      {t("provider.earnings.dialog.walletIdOptional")}
                    </Label>
                    <Input
                      id="walletId"
                      placeholder={t("provider.earnings.dialog.walletIdPh")}
                      value={formData.walletId}
                      onChange={(e) =>
                        setFormData({ ...formData, walletId: e.target.value })
                      }
                    />
                  </div>
                )}
              </>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddForm(false);
                setEditingMethod(null);
                resetForm();
              }}
            >
              {t("provider.earnings.dialog.cancel")}
            </Button>
            <Button onClick={handleSavePayoutMethod}>
              {editingMethod
                ? t("provider.earnings.dialog.submitUpdate")
                : t("provider.earnings.dialog.submitAdd")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
