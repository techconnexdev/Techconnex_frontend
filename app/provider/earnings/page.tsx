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
} from "lucide-react";
import { ProviderLayout } from "@/components/provider-layout";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
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
  status: string;
  date: string;
  avatar?: string;
};

type MonthlyEarning = {
  month: string;
  projects: number;
  amount: number;
};

export default function ProviderEarningsPage() {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState("this-month");
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<MonthlyEarning[]>([]);
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
          }
        );

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        setEarningsData(data.earningsData);
        setRecentPayments(data.recentPayments);
        setMonthlyEarnings(data.monthlyEarnings);
        setQuickStats(data.quickStats);
        // Use bankDetails returned from API
        // const _bd = data.bankDetails;
        // if (_bd && Object.values(_bd).some((val) => val)) {
        //   setBankAccount([_bd]);
        // } else {
        //   setBankAccount([]);
        // }
      } catch (err) {
        console.error("❌ Failed to fetch earnings:", err);
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
        }
      );

      if (!res.ok) throw new Error("Failed to fetch payout methods");

      const result = await res.json();
      setPayoutMethods(result.payoutMethods || []);
    } catch (err) {
      console.error("❌ Failed to fetch payout methods:", err);
    }
  };

  // On component mount
  useEffect(() => {
    fetchPayoutMethods();
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
          throw new Error("Please fill in all bank details");
      } else if (!formData.accountEmail) {
        throw new Error("Please provide an email address");
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
        title: "Success",
        description: editingMethod
          ? "Payout method updated successfully"
          : "Payout method added successfully",
      });

      setShowAddForm(false);
      setEditingMethod(null);
      resetForm();
      await fetchPayoutMethods();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to save payout method";
      toast({
        title: "Error",
        description: errorMessage,
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
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );

      if (!res.ok) throw new Error("Failed to delete payout method");

      toast({
        title: "Deleted",
        description: "Payout method removed successfully",
      });
      await fetchPayoutMethods();
    } catch (err: unknown) {
      console.error(err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete payout method";
      toast({
        title: "Error",
        description: errorMessage,
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
          title: "Error",
          description: "Please login to export reports",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/provider/earnings/export/report?timeFilter=${timeFilter}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
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
          title: "Report Generated",
          description:
            "Your earnings report has been generated and is ready to download.",
        });
      } else {
        throw new Error(data.message || "Failed to get download URL");
      }
    } catch (err: unknown) {
      console.error("Export report error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to export report";
      toast({
        title: "Error exporting report",
        description: errorMessage,
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
        title: method.label || method.bankName || "Bank Account",
        subtitle: method.accountNumber
          ? `•••• ${method.accountNumber.slice(-4)}`
          : "",
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
      <ProviderLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading earnings...</p>
        </div>
      </ProviderLayout>
    );
  }

  if (!earningsData) {
    return (
      <ProviderLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">No earnings data found.</p>
        </div>
      </ProviderLayout>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "released":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "released":
        return "Paid";
      case "pending":
        return "Pending";
      case "in_progress":
        return "Processing";
      default:
        return status;
    }
  };

  return (
    <ProviderLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
            <p className="text-gray-600">
              Track your income and payment history
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={timeFilter} onValueChange={setTimeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
                <SelectItem value="last-month">Last Month</SelectItem>
                <SelectItem value="this-year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportReport}>
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Earnings
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    RM{earningsData.totalEarnings.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    This Month
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    RM{earningsData.thisMonth.toLocaleString()}
                  </p>
                  <div className="flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 text-green-500 mr-1" />
                    <span className="text-xs text-green-500">
                      +{earningsData.monthlyGrowth}%
                    </span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Pending Payments
                  </p>
                  <p className="text-2xl font-bold text-yellow-600">
                    RM{earningsData.pendingPayments.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Available Balance
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    RM{earningsData.availableBalance.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            {/* <TabsTrigger value="analytics">Analytics</TabsTrigger> */}
            {/* <TabsTrigger value="withdraw">Withdraw</TabsTrigger> */}
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Monthly Earnings Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Monthly Earnings Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {monthlyEarnings.map((month) => (
                        <div
                          key={month.month}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                            <span className="font-medium">{month.month}</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-500">
                              {month.projects} projects
                            </span>
                            <span className="font-semibold">
                              RM{month.amount.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Payments */}
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Payments</CardTitle>
                    <CardDescription>
                      Your latest payment transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentPayments.slice(0, 4).map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <Avatar>
                              <AvatarImage
                                src={payment.avatar || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {payment.client.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{payment.project}</p>
                              <p className="text-sm text-gray-600">
                                {payment.client}
                              </p>
                              <p className="text-xs text-gray-500">
                                {payment.milestone}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">
                              RM{payment.amount.toLocaleString()}
                            </p>
                            <Badge className={getStatusColor(payment.status)}>
                              {getStatusText(payment.status)}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              {payment.date}
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
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Average Project Value
                      </span>
                      <span className="font-semibold">
                        RM{earningsData.averageProjectValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Projects This Month
                      </span>
                      <span className="font-semibold">
                        {quickStats?.projectsThisMonth.toLocaleString() ?? 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Success Rate
                      </span>
                      <span className="font-semibold">
                        {quickStats?.successRate.toLocaleString() ?? 0}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Repeat Clients
                      </span>
                      <span className="font-semibold">
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
                <CardTitle>Payment History</CardTitle>
                <CardDescription>
                  Complete history of all your payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Avatar>
                          <AvatarImage
                            src={payment.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {payment.client.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{payment.project}</p>
                          <p className="text-sm text-gray-600">
                            {payment.client}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.milestone} • {payment.date}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="font-semibold">
                            RM{payment.amount.toLocaleString()}
                          </p>
                          <Badge className={getStatusColor(payment.status)}>
                            {getStatusText(payment.status)}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/provider/earnings/transactions/${payment.id}`
                            )
                          }
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Details
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
            <div className="grid md:grid-cols-2 gap-6">
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Payout Methods</CardTitle>
                    <CardDescription>
                      Manage your payout methods for withdrawals
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setEditingMethod(null);
                      resetForm();
                      setShowAddForm(true);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payoutMethods?.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">
                      No payout methods added yet
                    </p>
                    <Button
                      onClick={() => {
                        setEditingMethod(null);
                        resetForm();
                        setShowAddForm(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Method
                    </Button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {payoutMethods?.map((method) => {
                      const displayInfo = getPayoutDisplayText(method);
                      return (
                        <Card
                          key={method.id}
                          className="border-2 hover:border-primary/50 transition-colors"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                                  {getPayoutIcon(method.type)}
                                </div>
                                <div>
                                  <p className="font-semibold text-lg">
                                    {displayInfo.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {displayInfo.subtitle}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="secondary">{method.type}</Badge>
                            </div>
                            {displayInfo.details && (
                              <p className="text-sm text-gray-600 mb-4">
                                {displayInfo.details}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditPayoutMethod(method)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive bg-transparent"
                                onClick={() =>
                                  handleDeletePayoutMethod(method.id)
                                }
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Remove
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
              {editingMethod ? "Edit Payout Method" : "Add Payout Method"}
            </DialogTitle>
            <DialogDescription>
              {editingMethod
                ? "Update your payout method details"
                : "Add a new payout method for withdrawals"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="type">Method Type</Label>
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
                  <SelectItem value="BANK">Bank Transfer</SelectItem>
                  <SelectItem value="PAYPAL">PayPal</SelectItem>
                  <SelectItem value="PAYONEER">Payoneer</SelectItem>
                  <SelectItem value="WISE">Wise</SelectItem>
                  <SelectItem value="EWALLET">E-Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Label (Optional)</Label>
              <Input
                id="label"
                placeholder="e.g. Main Bank, Business PayPal"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </div>

            {formData.type === "BANK" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="bankName">Bank Name *</Label>
                  <Input
                    id="bankName"
                    placeholder="e.g. Maybank, CIMB Bank"
                    value={formData.bankName}
                    onChange={(e) =>
                      setFormData({ ...formData, bankName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accountNumber">Account Number *</Label>
                  <Input
                    id="accountNumber"
                    placeholder="e.g. 1234567890"
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
                  <Label htmlFor="accountHolder">Account Holder Name *</Label>
                  <Input
                    id="accountHolder"
                    placeholder="e.g. John Doe"
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
                  <Label htmlFor="accountEmail">Email Address *</Label>
                  <Input
                    id="accountEmail"
                    type="email"
                    placeholder="e.g. your@email.com"
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
                      Wallet ID / Phone Number (Optional)
                    </Label>
                    <Input
                      id="walletId"
                      placeholder="e.g. +60123456789"
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
              Cancel
            </Button>
            <Button onClick={handleSavePayoutMethod}>
              {editingMethod ? "Update Method" : "Add Method"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProviderLayout>
  );
}
