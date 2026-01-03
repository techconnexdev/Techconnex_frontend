"use client";

import { useEffect, useState } from "react";
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
  CreditCard,
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
  ArrowDownRight,
} from "lucide-react";
import { CustomerLayout } from "@/components/customer-layout";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, API_BASE } from "@/lib/api";
import Link from "next/link";
import MilestonePayment from "@/components/MilestonePayment";

type Transaction = {
  id: string;
  description: string;
  project: string;
  provider: string;
  milestone: string;
  method: string;
  reference: string;
  status: string;
  date: string;
  amount: number;
  type: string;
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

export default function CustomerBillingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
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
    completedPayments: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.provider.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPeriod =
      filterPeriod === "all" ||
      (() => {
        const transactionDate = new Date(transaction.date);
        const now = new Date();
        switch (filterPeriod) {
          case "week":
            return (
              now.getTime() - transactionDate.getTime() <=
              7 * 24 * 60 * 60 * 1000
            );
          case "month":
            return (
              now.getTime() - transactionDate.getTime() <=
              30 * 24 * 60 * 60 * 1000
            );
          case "quarter":
            return (
              now.getTime() - transactionDate.getTime() <=
              90 * 24 * 60 * 60 * 1000
            );
          default:
            return true;
        }
      })();

    return matchesSearch && matchesPeriod;
  });

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
    switch (status) {
      case "completed":
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
      case "scheduled":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
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
          title: "Error",
          description: "Not authenticated",
          variant: "destructive",
        });
        return;
      }

      const res = await fetch(
        `${API_BASE}/company/billing/${transactionId}/receipt`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
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
      console.error(e);
      const errorMessage =
        e instanceof Error ? e.message : "Failed to download receipt";
      toast({
        title: "Error downloading receipt",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleExportReport = async () => {
    try {
      const token = localStorage.getItem("token") || "";
      const res = await fetch(`${API_BASE}/company/billing/export/report`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
            "Your billing report has been generated and is ready to download.",
        });
      } else {
        throw new Error(data.message || "Failed to get download URL");
      }
    } catch (e: unknown) {
      console.error(e);
      const errorMessage =
        e instanceof Error ? e.message : "Failed to export report";
      toast({
        title: "Error exporting report",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleSaveBudgetEdit = () => {
    toast({
      title: "Budget Updated",
      description: `Budget for ${selectedBudget?.category} has been updated successfully.`,
    });
    setEditBudgetOpen(false);
  };

  const handleDownloadInvoice = (invoice: Invoice) => {
    toast({
      title: "Downloading Invoice",
      description: `Invoice ${invoice.number} is being downloaded.`,
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
          completedPayments: overviewRes.data.recentTransactions.length,
        });
        // Budgets feature is commented out, so we don't set budgets state
        setTransactions(
          (txnRes.transactions || []).map((txn: Record<string, unknown>) => {
            const status = ((txn.status as string) || "").toLowerCase();
            const isRefunded = status === "refunded";
            return {
              id: (txn.id as string) || "",
              description:
                ((txn.metadata as Record<string, unknown>)
                  ?.milestoneTitle as string) || "",
              project:
                ((txn.project as Record<string, unknown>)?.title as string) ||
                "",
              provider:
                ((txn.metadata as Record<string, unknown>)
                  ?.providerEmail as string) || "",
              milestone:
                ((txn.milestone as Record<string, unknown>)?.title as string) ||
                "",
              method: (txn.method as string) || "",
              reference: (txn.stripePaymentIntentId as string) || "",
              status: status,
              date: (txn.createdAt as string) || "",
              amount: (txn.amount as number) || 0,
              type: isRefunded ? "refund" : "payment",
            };
          })
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
              })
            )
          )
        );
      } catch (error) {
        console.error("Failed to fetch billing data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillingData();
  }, []);

  if (loading)
    return (
      <div className="text-center p-10 text-gray-500">
        Loading billing overview...
      </div>
    );

  return (
    <CustomerLayout>
      <div className="space-y-6 md:space-y-8 px-4 md:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              Billing & Finance
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              Manage your payments, invoices, and financial overview
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button variant="outline" onClick={handleExportReport} className="w-full sm:w-auto text-xs md:text-sm">
              <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Export Report
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
                  <DialogTitle>Add Payment Method</DialogTitle>
                  <DialogDescription>
                    Add a new credit card or bank account to your account.
                  </DialogDescription>
                </DialogHeader>
                <AddPaymentMethodForm />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs md:text-sm">Transactions</TabsTrigger>
            {/* <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger> */}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* ===== Stats Cards ===== */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-gray-500">Total Spent</p>
                      <p className="text-xl md:text-2xl font-bold">
                        RM{(stats?.totalSpent || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2 text-green-600 text-xs md:text-sm">
                        <TrendingUp className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span>12% vs last month</span>
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
                      <p className="text-xs md:text-sm text-gray-500">Pending Payments</p>
                      <p className="text-xl md:text-2xl font-bold">
                        RM{(stats?.pendingPayments || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2 text-yellow-600 text-xs md:text-sm">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span>
                          {
                            transactions.filter((t) => t.status === "pending")
                              .length
                          }{" "}
                          pending
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
                        RM{(stats?.thisMonth || 0).toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2 text-blue-600 text-xs md:text-sm">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span>January 2024</span>
                      </div>
                    </div>
                    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-blue-600 flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm text-gray-500">Avg. Transaction</p>
                      <p className="text-xl md:text-2xl font-bold">
                        RM
                        {Math.round(
                          stats?.averageTransaction || 0
                        ).toLocaleString()}
                      </p>
                      <div className="flex items-center mt-2 text-purple-600 text-xs md:text-sm">
                        <Receipt className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        <span>{stats.completedPayments} completed</span>
                      </div>
                    </div>
                    <Receipt className="w-6 h-6 md:w-8 md:h-8 text-purple-600 flex-shrink-0 ml-2" />
                  </div>
                </CardContent>
              </Card>
            </div>

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

            {/* ===== Upcoming Payments ===== */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base md:text-lg">Upcoming Payments</CardTitle>
                <CardDescription className="text-xs md:text-sm">
                  Scheduled and pending payments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingPayments.map((payment) => (
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
                            Due:{" "}
                            {new Date(payment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right flex-shrink-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base md:text-lg font-bold text-gray-900">
                            RM{(payment.amount ?? 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${getStatusColor(payment.status)} text-xs`}>
                            {getStatusIcon(payment.status)}
                            <span className="ml-1 capitalize">
                              {payment.status}
                            </span>
                          </Badge>
                        </div>
                        {(payment.sequence === 0 ||
                          upcomingPayments.find(
                            (p) =>
                              p.projectId === payment.projectId &&
                              p.sequence === payment.sequence - 1
                          )?.status === "APPROVED") && (
                          <Button
                            size="sm"
                            className="w-full sm:w-auto text-xs md:text-sm"
                            onClick={() => handlePayMilestone(payment.id)}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ===== Recent Transactions ===== */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle className="text-base md:text-lg">Recent Transactions</CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Your latest payment activities
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("transactions")}
                    className="w-full sm:w-auto text-xs md:text-sm"
                  >
                    View All
                    <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {transaction.type === "payment" ? (
                            <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-sm md:text-base truncate">
                            {transaction.description}
                          </h3>
                          <p className="text-xs md:text-sm text-gray-500 truncate">
                            {transaction.project}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(transaction.date).toLocaleDateString()}
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
                          {transaction.type === "refund" ? "+" : "-"}RM
                          {transaction.amount.toLocaleString() ?? "0.00"}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getStatusColor(transaction.status)} text-xs`}>
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1 capitalize">
                              {transaction.status}
                            </span>
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search transactions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 text-sm md:text-base"
                      />
                    </div>
                  </div>
                  {/* <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full lg:w-48">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select> */}
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-full sm:w-auto lg:w-48 text-sm md:text-base">
                      <Calendar className="w-4 h-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="week">Last Week</SelectItem>
                      <SelectItem value="month">Last Month</SelectItem>
                      <SelectItem value="quarter">Last Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Transactions List */}
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <Card key={transaction.id}>
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          {transaction.type === "payment" ? (
                            <CreditCard className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
                          ) : (
                            <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
                          )}
                        </div>
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
                            {transaction.type === "refund" ? "+" : "-"}RM
                            {transaction.amount.toLocaleString() ?? "0.00"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${getStatusColor(transaction.status)} text-xs`}>
                            {getStatusIcon(transaction.status)}
                            <span className="ml-1 capitalize">
                              {transaction.status}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(transaction.date).toLocaleDateString()}
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
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto text-xs md:text-sm"
                        onClick={() => handleDownloadReceipt(transaction.id)}
                      >
                        <Download className="w-3 h-3 md:w-4 md:h-4 mr-2" />
                        Receipt
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
                    No transactions found
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm || filterPeriod !== "all"
                      ? "Try adjusting your search or filter criteria."
                      : "You haven't made any payments yet."}
                  </p>
                </CardContent>
              </Card>
            )}
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
                  <DialogTitle>Invoice Details</DialogTitle>
                  <DialogDescription>
                    Invoice {selectedInvoice.number}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl font-bold">INVOICE</h3>
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
                      <h4 className="font-semibold mb-2">From:</h4>
                      <p className="text-sm text-gray-600">
                        {selectedInvoice.provider}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">To:</h4>
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
                      <h4 className="font-semibold mb-2">Issue Date:</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(
                          selectedInvoice.issueDate
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Due Date:</h4>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Paid Date:</h4>
                      <p className="text-sm text-gray-600">
                        {selectedInvoice.paidDate
                          ? new Date(
                              selectedInvoice.paidDate
                            ).toLocaleDateString()
                          : "Not paid yet"}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Invoice Items */}
                  <div>
                    <h4 className="font-semibold mb-4">Items</h4>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
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
                            index: number
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
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal:</span>
                        <span>RM{selectedInvoice.amount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tax (0%):</span>
                        <span>RM0.00</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
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
                    Close
                  </Button>
                  <Button
                    onClick={() => handleDownloadInvoice(selectedInvoice)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
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
                  title: "Payment successful",
                  description: "Milestone payment has been processed.",
                });
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Edit Budget Dialog */}
        <Dialog open={editBudgetOpen} onOpenChange={setEditBudgetOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Budget</DialogTitle>
              <DialogDescription>
                Update your budget allocation and settings.
              </DialogDescription>
            </DialogHeader>
            {selectedBudget && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit-category">Category</Label>
                  <Input
                    id="edit-category"
                    defaultValue={selectedBudget.category}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-allocated">Allocated Amount (RM)</Label>
                  <Input
                    id="edit-allocated"
                    type="number"
                    defaultValue={selectedBudget.allocated}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-period">Period</Label>
                  <Select
                    defaultValue={
                      selectedBudget.period?.toLowerCase() || "monthly"
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
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
                Cancel
              </Button>
              <Button onClick={handleSaveBudgetEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </CustomerLayout>
  );
}

function AddPaymentMethodForm() {
  return (
    <div className="space-y-4">
      <Tabs defaultValue="card">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="card">Credit Card</TabsTrigger>
          <TabsTrigger value="bank">Bank Account</TabsTrigger>
        </TabsList>
        <TabsContent value="card" className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card Number</Label>
            <Input id="cardNumber" placeholder="1234 5678 9012 3456" />
          </div>
          <div>
            <Label htmlFor="cardName">Cardholder Name</Label>
            <Input id="cardName" placeholder="Ahmad Rahman" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" placeholder="MM/YY" />
            </div>
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input id="cvv" placeholder="123" />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="bank" className="space-y-4">
          <div>
            <Label htmlFor="bankName">Bank Name</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Select bank" />
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
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input id="accountNumber" placeholder="1234567890" />
          </div>
          <div>
            <Label htmlFor="accountName">Account Holder Name</Label>
            <Input id="accountName" placeholder="Tech Innovations Sdn Bhd" />
          </div>
        </TabsContent>
      </Tabs>
      <div className="flex items-center space-x-2">
        <input type="checkbox" id="default" className="rounded" />
        <Label htmlFor="default" className="text-sm">
          Set as default payment method
        </Label>
      </div>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        {/* <Button onClick={onSubmit}>Add Payment Method</Button> */}
      </DialogFooter>
    </div>
  );
}
