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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Eye,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminDisputes,
  getAdminDisputeStats,
} from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  };
  milestone?: {
    amount: number;
  };
};

type DisputeStats = {
  totalDisputes?: number;
  openDisputes?: number;
  inReviewDisputes?: number;
  resolvedDisputes?: number;
  totalAmount?: number;
};

export default function AdminDisputesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadDisputes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminDisputes({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      if (response.success) {
        setDisputes(response.data || []);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load disputes";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery, toast]);

  const loadStats = useCallback(async () => {
    try {
      const response = await getAdminDisputeStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: unknown) {
      console.error("Failed to load stats:", error);
    }
  }, []);

  useEffect(() => {
    loadDisputes();
    loadStats();
  }, [loadDisputes, loadStats]);

    // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
        loadDisputes();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, loadDisputes]);

  const handleViewDispute = (disputeId: string) => {
    router.push(`/admin/disputes/${disputeId}`);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "OPEN":
        return "bg-red-100 text-red-800";
      case "UNDER_REVIEW":
        return "bg-yellow-100 text-yellow-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      case "CLOSED":
        return "bg-gray-100 text-gray-800";
      case "REJECTED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredDisputes = disputes; // Backend handles filtering now

  const disputeAmount = (dispute: Dispute) => {
    return (
      dispute.payment?.amount ||
      dispute.contestedAmount ||
      dispute.milestone?.amount ||
      0
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dispute Management
            </h1>
            <p className="text-gray-600">
              Resolve conflicts between customers and providers
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                      Total Disputes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                      {stats.totalDisputes || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Open
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                      {stats.openDisputes || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Under Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                      {stats.inReviewDisputes || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                      Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                      {stats.resolvedDisputes || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Amount
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  RM{(stats.totalAmount || 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Filters</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <div className="flex flex-col gap-4">
              <div className="flex-1 min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search disputes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm sm:text-base"
                  />
                </div>
              </div>
              <Tabs
                value={statusFilter}
                onValueChange={setStatusFilter}
                className="w-full"
              >
                <TabsList className="w-full sm:w-auto flex flex-col sm:flex-row h-auto sm:h-10">
                  <TabsTrigger value="all" className="text-xs sm:text-sm w-full sm:w-auto">All Status</TabsTrigger>
                  <TabsTrigger value="OPEN" className="text-xs sm:text-sm w-full sm:w-auto">Open</TabsTrigger>
                  <TabsTrigger value="UNDER_REVIEW" className="text-xs sm:text-sm w-full sm:w-auto">Under Review</TabsTrigger>
                  <TabsTrigger value="RESOLVED" className="text-xs sm:text-sm w-full sm:w-auto">Resolved</TabsTrigger>
                  <TabsTrigger value="CLOSED" className="text-xs sm:text-sm w-full sm:w-auto">Closed</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Disputes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Disputes</CardTitle>
            <CardDescription>
              {filteredDisputes.length} dispute(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : filteredDisputes.length === 0 ? (
              <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No disputes found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Raised By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisputes.map((dispute, index) => (
                      <TableRow key={dispute.id}>
                      <TableCell className="text-gray-600 font-medium">
                        {index + 1}
                      </TableCell>
                        <TableCell>
                            <p className="font-medium">{dispute.reason}</p>
                        </TableCell>
                        <TableCell>
                        <Link
                          href={`/admin/projects/${dispute.projectId}`}
                          className="text-blue-600 hover:underline"
                              >
                          {dispute.project?.title || "N/A"}
                            </Link>
                        </TableCell>
                        <TableCell>
                        <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback>
                                {dispute.raisedBy?.name?.charAt(0) || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">
                              {dispute.raisedBy?.name || "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(dispute.status)}>
                            {dispute.status?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            RM{disputeAmount(dispute).toLocaleString()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">
                              {new Date(dispute.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Updated:{" "}
                              {new Date(dispute.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDispute(dispute.id)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
