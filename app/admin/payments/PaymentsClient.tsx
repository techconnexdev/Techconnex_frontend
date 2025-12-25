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
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getAdminPayments, getAdminPaymentStats, getProfileImageUrl } from "@/lib/api";

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
  };
};

type PaymentStats = {
  totalPayments?: number;
  totalVolume?: number;
  totalFees?: number;
  readyToTransfer?: number;
  failedPayments?: number;
};

export default function PaymentsClient() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminPayments({
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        method: methodFilter !== "all" ? methodFilter : undefined,
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
  }, [searchQuery, statusFilter, methodFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPayments();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [fetchPayments]);

  const fetchStats = async () => {
    try {
      const response = await getAdminPaymentStats();
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

  const getMethodText = (method: string) => {
    switch (method) {
      case "STRIPE":
        return "Stripe";
      case "FPX":
        return "FPX";
      case "EWALLET":
        return "E-Wallet";
      default:
        return method;
    }
  };

  const isReadyToTransfer = (payment: Payment) => {
    return (
      payment.status === "ESCROWED" && payment.milestone?.status === "APPROVED"
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Transactions
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
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Volume
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    RM{((stats.totalVolume || 0) / 1000).toFixed(0)}K
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Platform Fees
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    RM{(stats.totalFees || 0).toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Ready to Transfer
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
                  <p className="text-sm font-medium text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.failedPayments}
                  </p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search transactions, users, or projects..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="STRIPE">Stripe</SelectItem>
                <SelectItem value="FPX">FPX</SelectItem>
                <SelectItem value="EWALLET">E-Wallet</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="ESCROWED">Escrowed</SelectItem>
                <SelectItem value="RELEASED">Released</SelectItem>
                <SelectItem value="TRANSFERRED">Transferred</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions ({pagination.total})</CardTitle>
          <CardDescription>
            Monitor all platform financial transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <p className="text-gray-500">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No payments found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => {
                  const readyToTransfer = isReadyToTransfer(payment);
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
                                Ready to Transfer
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
                                src={getProfileImageUrl(payment.project.customer.customerProfile?.profileImageUrl)}
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
                                src={getProfileImageUrl(payment.project.provider.providerProfile?.profileImageUrl)}
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
                            RM{payment.amount.toLocaleString()}
                          </p>
                          {payment.platformFeeAmount > 0 && (
                            <p className="text-sm text-gray-500">
                              Fee: RM
                              {payment.platformFeeAmount.toLocaleString()}
                            </p>
                          )}
                          <p className="text-sm font-medium text-green-600">
                            Net: RM{payment.providerAmount.toLocaleString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          {payment.status}
                        </Badge>
                        {payment.milestone && (
                          <p className="text-xs text-gray-500 mt-1">
                            Milestone: {payment.milestone.status}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getMethodText(payment.method)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            Created: {formatDate(payment.createdAt)}
                          </p>
                          {payment.escrowedAt && (
                            <p className="text-xs text-gray-500">
                              Escrowed: {formatDate(payment.escrowedAt)}
                            </p>
                          )}
                          {payment.releasedAt && (
                            <p className="text-xs text-gray-500">
                              Released: {formatDate(payment.releasedAt)}
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
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/payments/${payment.id}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
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
                                Process Transfer
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
