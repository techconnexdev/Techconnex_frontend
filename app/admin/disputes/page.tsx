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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  FileText,
  Loader2,
  RefreshCw,
  Ban,
  Upload,
  X,
  MessageSquare,
  Building2,
  Wallet,
  CreditCard,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminDisputes,
  getAdminDisputeStats,
  getAdminDisputeById,
  simulateDisputePayout,
  redoMilestone,
  resolveDispute,
  getAttachmentUrl,
  getR2DownloadUrl,
} from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";

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
      providerProfile?: {
        payoutMethods?: PayoutMethod[];
      };
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

type PayoutMethod = {
  id?: string;
  type: string;
  label?: string;
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  accountEmail?: string;
  walletId?: string;
};

export default function AdminDisputesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [releaseAmount, setReleaseAmount] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [bankTransferRefImage, setBankTransferRefImage] = useState<File | null>(
    null
  );
  const [bankTransferRefImagePreview, setBankTransferRefImagePreview] =
    useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<
    "refund" | "release" | "partial" | null
  >(null);

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

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      if (searchQuery || statusFilter !== "all") {
        loadDisputes();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, loadDisputes]);

  const handleViewDispute = async (disputeId: string) => {
    try {
      const response = await getAdminDisputeById(disputeId);
      if (response.success) {
        console.log("Dispute data loaded:", response.data);
        console.log("Payment data:", response.data?.payment);
        console.log("Payment ID:", response.data?.payment?.id);
        console.log("PaymentId field:", response.data?.paymentId);
        setSelectedDispute(response.data);
        setViewDialogOpen(true);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to load dispute details";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleResolve = async (
    action: "refund" | "release" | "partial" | "redo" | "cancel"
  ) => {
    if (!selectedDispute) {
      toast({
        title: "Error",
        description: "No dispute selected",
        variant: "destructive",
      });
      return;
    }

    try {
      setActionLoading(true);

      if (action === "refund") {
        const amount =
          selectedDispute.payment?.amount ||
          selectedDispute.contestedAmount ||
          0;
        if (amount <= 0) {
          toast({
            title: "Error",
            description: "Invalid payment amount. Cannot process refund.",
            variant: "destructive",
          });
          return;
        }
        console.log("Processing refund:", {
          disputeId: selectedDispute.id,
          amount,
        });
        const response = await simulateDisputePayout(
          selectedDispute.id,
          amount,
          0,
          resolutionNotes || undefined
          // No image needed for refunds - processed directly via Stripe
        );
        console.log("Refund response:", response);
        toast({
          title: "Success",
          description: `Refund of RM${amount} processed successfully. Payment status updated to REFUNDED.`,
        });
      } else if (action === "release") {
        const amount =
          selectedDispute.payment?.amount ||
          selectedDispute.contestedAmount ||
          0;
        if (amount <= 0) {
          toast({
            title: "Error",
            description: "Invalid payment amount. Cannot process release.",
            variant: "destructive",
          });
          return;
        }
        console.log("Processing release:", {
          disputeId: selectedDispute.id,
          amount,
          hasImage: !!bankTransferRefImage,
        });
        const response = await simulateDisputePayout(
          selectedDispute.id,
          0,
          amount,
          resolutionNotes || undefined,
          bankTransferRefImage || undefined
        );
        console.log("Release response:", response);
        toast({
          title: "Success",
          description: `Release of RM${amount} processed successfully. Payment status updated to RELEASED. Please transfer funds to provider.`,
        });
        // Reset image after successful release
        setBankTransferRefImage(null);
        setBankTransferRefImagePreview(null);
      } else if (action === "partial") {
        const refund = parseFloat(refundAmount) || 0;
        const release = parseFloat(releaseAmount) || 0;
        if (refund === 0 && release === 0) {
          toast({
            title: "Error",
            description: "Please specify refund or release amount",
            variant: "destructive",
          });
          return;
        }
        const totalAmount =
          selectedDispute.payment?.amount ||
          selectedDispute.contestedAmount ||
          0;
        if (refund + release > totalAmount) {
          toast({
            title: "Error",
            description: `Total amount (RM${
              refund + release
            }) exceeds payment amount (RM${totalAmount})`,
            variant: "destructive",
          });
          return;
        }
        // Require bank transfer reference image if release amount > 0
        if (release > 0 && !bankTransferRefImage) {
          toast({
            title: "Image Required",
            description:
              "Bank transfer reference image is required when releasing funds to provider",
            variant: "destructive",
          });
          return;
        }
        console.log("Processing partial payout:", {
          disputeId: selectedDispute.id,
          refund,
          release,
          hasImage: !!bankTransferRefImage,
        });
        const response = await simulateDisputePayout(
          selectedDispute.id,
          refund,
          release,
          resolutionNotes || undefined,
          release > 0 ? bankTransferRefImage || undefined : undefined
        );
        console.log("Partial payout response:", response);
        toast({
          title: "Success",
          description: `Partial payout processed: Refund RM${refund}, Release RM${release}. Payment status updated.`,
        });
        // Reset state after successful partial payout
        setRefundAmount("");
        setReleaseAmount("");
        setBankTransferRefImage(null);
        setBankTransferRefImagePreview(null);
        setSelectedAction(null);
      } else if (action === "redo") {
        console.log("Processing redo milestone:", {
          disputeId: selectedDispute.id,
        });
        const response = await redoMilestone(
          selectedDispute.id,
          resolutionNotes || undefined
        );
        console.log("Redo milestone response:", response);
        toast({
          title: "Success",
          description:
            "Milestone returned to IN_PROGRESS. Payment remains in escrow.",
        });
      } else if (action === "cancel") {
        console.log("Processing dispute rejection:", {
          disputeId: selectedDispute.id,
        });
        const response = await resolveDispute(
          selectedDispute.id,
          "REJECTED",
          resolutionNotes || "Dispute rejected"
        );
        console.log("Dispute rejection response:", response);
        toast({
          title: "Success",
          description: "Dispute rejected. Payment remains in escrow.",
        });
      }

      setViewDialogOpen(false);
      setPayoutDialogOpen(false);
      setSelectedDispute(null);
      setResolutionNotes("");
      setRefundAmount("");
      setReleaseAmount("");
      setBankTransferRefImage(null);
      setBankTransferRefImagePreview(null);
      setSelectedAction(null);
      await loadDisputes();
      await loadStats();
    } catch (error: unknown) {
      console.error("Error in handleResolve:", error);
      let errorMessage = "Failed to process action";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "error" in error
      ) {
        errorMessage = String(error.error);
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Disputes
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.totalDisputes || 0}
                    </p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Open</p>
                    <p className="text-2xl font-bold text-red-600">
                      {stats.openDisputes || 0}
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      In Review
                    </p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {stats.inReviewDisputes || 0}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Resolved
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {stats.resolvedDisputes || 0}
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Total Value
                    </p>
                    <p className="text-2xl font-bold text-purple-600">
                      RM{((stats.totalAmount || 0) / 1000).toFixed(0)}K
                    </p>
                  </div>
                  <DollarSign className="w-8 h-8 text-purple-600" />
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
                    placeholder="Search disputes, customers, or providers..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="UNDER_REVIEW">In Review</SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={loadDisputes}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Disputes Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Disputes ({filteredDisputes.length})</CardTitle>
            <CardDescription>
              Review and resolve platform disputes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dispute</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Raised By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisputes.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center py-12 text-gray-500"
                      >
                        No disputes found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDisputes.map((dispute) => (
                      <TableRow key={dispute.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{dispute.reason}</p>
                            <p className="text-sm text-gray-500 line-clamp-2">
                              {dispute.description}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {dispute.project?.title || "N/A"}
                            </p>
                            <Link href={`/admin/projects/${dispute.projectId}`}>
                              <Button
                                variant="link"
                                size="sm"
                                className="p-0 h-auto"
                              >
                                View Project
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback>
                                  {dispute.project?.customer?.name?.charAt(0) ||
                                    "C"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {dispute.project?.customer?.name || "N/A"}
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Avatar className="w-6 h-6">
                                <AvatarFallback>
                                  {dispute.project?.provider?.name?.charAt(0) ||
                                    "P"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm">
                                {dispute.project?.provider?.name || "N/A"}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
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
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* View Dispute Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Dispute Review - {selectedDispute?.reason}
              </DialogTitle>
              <DialogDescription>
                Review dispute details and provide resolution
              </DialogDescription>
            </DialogHeader>

            {selectedDispute && (
              <div className="space-y-6">
                {/* Dispute Overview */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dispute Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="font-medium">{selectedDispute.reason}</p>
                        <p className="text-sm text-gray-500">
                          Project: {selectedDispute.project?.title}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          className={getStatusColor(selectedDispute.status)}
                        >
                          {selectedDispute.status?.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="text-sm space-y-1">
                        <p>
                          <span className="font-medium">Amount:</span> RM
                          {disputeAmount(selectedDispute).toLocaleString()}
                        </p>
                        <p>
                          <span className="font-medium">Created:</span>{" "}
                          {new Date(
                            selectedDispute.createdAt
                          ).toLocaleDateString()}
                        </p>
                        {selectedDispute.contestedAmount && (
                          <p>
                            <span className="font-medium">
                              Contested Amount:
                            </span>{" "}
                            RM
                            {selectedDispute.contestedAmount.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="mt-3">
                        <p className="font-medium mb-3">
                          Description & Updates:
                        </p>
                        <div className="space-y-4">
                          {(() => {
                            // Parse description to show original and updates separately
                            const description =
                              selectedDispute.description || "";
                            const parts = description.split(/\n---\n/);
                            const originalDescription = parts[0]?.trim() || "";
                            const updates = parts.slice(1);

                            return (
                              <>
                                {/* Original Description */}
                                <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback>
                                        {selectedDispute.raisedBy?.name?.charAt(
                                          0
                                        ) || "U"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="text-sm font-semibold text-gray-900">
                                        {selectedDispute.raisedBy?.name ||
                                          "Unknown User"}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Original dispute •{" "}
                                        {new Date(
                                          selectedDispute.createdAt
                                        ).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                                    {originalDescription}
                                  </p>
                                </div>

                                {/* Updates */}
                                {updates.map((update: string, idx: number) => {
                                  // Parse update format: [Update by Name on Date]: content
                                  // Also handle old format: [Update by userId]: content
                                  const match = update.match(
                                    /^\[Update by (.+?) on (.+?)\]:\s*([\s\S]+)$/
                                  );
                                  let userName = "";
                                  let updateDate = "";
                                  let updateContent = "";

                                  if (match) {
                                    [, userName, updateDate, updateContent] =
                                      match;
                                  } else {
                                    // Try old format: [Update by userId]: content
                                    const oldMatch = update.match(
                                      /^\[Update by (.+?)\]:\s*([\s\S]+)$/
                                    );
                                    if (oldMatch) {
                                      const [, userIdOrName, content] =
                                        oldMatch;
                                      // Check if it's a UUID (old format)
                                      const uuidRegex =
                                        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
                                      if (uuidRegex.test(userIdOrName)) {
                                        // It's a UUID, try to match with customer or provider
                                        if (
                                          selectedDispute.project?.customer
                                            ?.id === userIdOrName
                                        ) {
                                          userName =
                                            selectedDispute.project?.customer
                                              ?.name || "Customer";
                                        } else if (
                                          selectedDispute.project?.provider
                                            ?.id === userIdOrName
                                        ) {
                                          userName =
                                            selectedDispute.project?.provider
                                              ?.name || "Provider";
                                        } else if (
                                          selectedDispute.raisedBy?.id ===
                                          userIdOrName
                                        ) {
                                          userName =
                                            selectedDispute.raisedBy?.name ||
                                            "Unknown User";
                                        } else {
                                          userName = "Unknown User";
                                        }
                                        updateDate = "Unknown Date";
                                        updateContent = content;
                                      } else {
                                        userName = userIdOrName;
                                        updateDate = "Unknown Date";
                                        updateContent = content;
                                      }
                                    } else {
                                      // Fallback: treat entire update as content
                                      updateContent = update;
                                      userName = "Unknown User";
                                      updateDate = "Unknown Date";
                                    }
                                  }

                                  // Determine if update is from customer or provider
                                  const isCustomer =
                                    selectedDispute.project?.customer?.name ===
                                    userName;
                                  const isProvider =
                                    selectedDispute.project?.provider?.name ===
                                    userName;

                                  return (
                                    <div
                                      key={idx}
                                      className={`p-4 rounded-lg border-l-4 ${
                                        isCustomer
                                          ? "bg-blue-50 border-blue-400"
                                          : isProvider
                                          ? "bg-green-50 border-green-400"
                                          : "bg-yellow-50 border-yellow-400"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2 mb-2">
                                        <Avatar className="w-6 h-6">
                                          <AvatarFallback>
                                            {userName.charAt(0).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-900">
                                              {userName}
                                            </p>
                                            <Badge
                                              variant="outline"
                                              className="text-xs"
                                            >
                                              {isCustomer
                                                ? "Customer"
                                                : isProvider
                                                ? "Provider"
                                                : "User"}
                                            </Badge>
                                          </div>
                                          <p className="text-xs text-gray-500">
                                            Update #{idx + 1} • {updateDate}
                                          </p>
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">
                                        {updateContent.trim()}
                                      </p>
                                    </div>
                                  );
                                })}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                      {selectedDispute.suggestedResolution && (
                        <div className="mt-3">
                          <p className="font-medium mb-2">
                            Suggested Resolution:
                          </p>
                          <p className="text-sm text-gray-700">
                            {selectedDispute.suggestedResolution}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Participants</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar>
                          <AvatarFallback>
                            {selectedDispute.project?.customer?.name?.charAt(
                              0
                            ) || "C"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {selectedDispute.project?.customer?.name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">Customer</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar>
                          <AvatarFallback>
                            {selectedDispute.project?.provider?.name?.charAt(
                              0
                            ) || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {selectedDispute.project?.provider?.name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">Provider</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 border rounded-lg">
                        <Avatar>
                          <AvatarFallback>
                            {selectedDispute.raisedBy?.name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {selectedDispute.raisedBy?.name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">Raised By</p>
                        </div>
                      </div>
                      <Link
                        href={`/admin/projects/${selectedDispute.projectId}`}
                      >
                        <Button variant="outline" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          View Project Details
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                {/* Evidence */}
                {selectedDispute.attachments &&
                  selectedDispute.attachments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Evidence & Documents
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          {selectedDispute.attachments.map(
                            (url: string, index: number) => {
                              // Extract filename from path
                              const normalized = url.replace(/\\/g, "/");
                              const filename =
                                normalized.split("/").pop() ||
                                `Attachment ${index + 1}`;
                              // Remove timestamp prefix if present (format: timestamp_filename.ext)
                              const cleanFilename = filename.replace(
                                /^\d+_/,
                                ""
                              );

                              // Try to find attachment metadata in description
                              const attachmentMetadataMatch =
                                selectedDispute.description?.match(
                                  new RegExp(
                                    `\\[Attachment: (.+?) uploaded by (.+?) on (.+?)\\]`,
                                    "g"
                                  )
                                );
                              let uploadedBy = "Unknown User";
                              let uploadedAt = "Unknown Date";

                              if (attachmentMetadataMatch) {
                                // Find matching metadata for this file
                                for (const meta of attachmentMetadataMatch) {
                                  const metaMatch = meta.match(
                                    /\[Attachment: (.+?) uploaded by (.+?) on (.+?)\]/
                                  );
                                  if (metaMatch && metaMatch[1] === filename) {
                                    uploadedBy = metaMatch[2];
                                    uploadedAt = metaMatch[3];
                                    break;
                                  }
                                }
                              }

                              // Also check if it's from the original dispute creator
                              if (
                                uploadedBy === "Unknown User" &&
                                index === 0 &&
                                selectedDispute.attachments?.length === 1
                              ) {
                                uploadedBy =
                                  selectedDispute.raisedBy?.name ||
                                  "Unknown User";
                                uploadedAt = new Date(
                                  selectedDispute.createdAt
                                ).toLocaleString();
                              }

                              return (
                                <div
                                  key={index}
                                  className="border rounded-lg p-4"
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-gray-900 truncate">
                                          {cleanFilename}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Uploaded by {uploadedBy} •{" "}
                                          {uploadedAt}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  {(() => {
                                    const attachmentUrl = getAttachmentUrl(url);
                                    const isR2Key =
                                      attachmentUrl === "#" ||
                                      (!attachmentUrl.startsWith("http") &&
                                        !attachmentUrl.startsWith(
                                          "/uploads/"
                                        ) &&
                                        !attachmentUrl.includes(
                                          process.env.NEXT_PUBLIC_API_URL ||
                                            "localhost"
                                        ));

                                    return (
                                      <a
                                        href={
                                          attachmentUrl === "#"
                                            ? undefined
                                            : attachmentUrl
                                        }
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={
                                          isR2Key
                                            ? async (e) => {
                                                e.preventDefault();
                                                try {
                                                  const downloadUrl =
                                                    await getR2DownloadUrl(url); // Use original URL/key
                                                  window.open(
                                                    downloadUrl.downloadUrl,
                                                    "_blank"
                                                  );
                                                } catch (error) {
                                                  console.error(
                                                    "Failed to get download URL:",
                                                    error
                                                  );
                                                  toast({
                                                    title: "Error",
                                                    description:
                                                      "Failed to download attachment",
                                                    variant: "destructive",
                                                  });
                                                }
                                              }
                                            : undefined
                                        }
                                      >
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          className="w-full bg-transparent"
                                        >
                                          <Eye className="w-4 h-4 mr-2" />
                                          View
                                        </Button>
                                      </a>
                                    );
                                  })()}
                                </div>
                              );
                            }
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Resolution Notes */}
                {selectedDispute.resolutionNotes &&
                  Array.isArray(selectedDispute.resolutionNotes) &&
                  selectedDispute.resolutionNotes.length > 0 && (
                    <Card className="border-purple-200 bg-purple-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-purple-800">
                          Admin Resolution Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {selectedDispute.resolutionNotes.map(
                          (
                            note: {
                              note?: string;
                              adminName?: string;
                              createdAt: string;
                            },
                            index: number
                          ) => {
                            // Check if note contains "--- Admin Note ---" separator
                            const noteParts =
                              note.note?.split(/\n--- Admin Note ---\n/) || [];
                            const hasAdminNote = noteParts.length > 1;
                            const resolutionResult = noteParts[0] || note.note;
                            const adminNote = noteParts[1];

                            return (
                              <div
                                key={index}
                                className="bg-white p-4 rounded-lg border-l-4 border-purple-500"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <Avatar className="w-6 h-6">
                                    <AvatarFallback className="bg-purple-100 text-purple-700">
                                      {note.adminName?.charAt(0) || "A"}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                      Resolution Note #{index + 1}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      By {note.adminName || "Admin"} •{" "}
                                      {new Date(
                                        note.createdAt
                                      ).toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                                <div className="space-y-3 mt-2">
                                  {/* Resolution Result */}
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">
                                      Resolution Result:
                                    </p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                                      {resolutionResult}
                                    </p>
                                  </div>
                                  {/* Admin Note (if exists) */}
                                  {hasAdminNote && adminNote && (
                                    <div>
                                      <p className="text-xs font-semibold text-purple-600 mb-1">
                                        Admin Note:
                                      </p>
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-purple-50 p-2 rounded border-l-2 border-purple-300">
                                        {adminNote}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </CardContent>
                    </Card>
                  )}

                {/* Legacy Resolution (for backward compatibility) */}
                {selectedDispute.status === "RESOLVED" &&
                  selectedDispute.resolution &&
                  (!selectedDispute.resolutionNotes ||
                    !Array.isArray(selectedDispute.resolutionNotes) ||
                    selectedDispute.resolutionNotes.length === 0) && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="text-lg text-green-800">
                          Resolution
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-green-700">
                          {selectedDispute.resolution}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                {/* Payment Status Info */}
                {(selectedDispute.payment || selectedDispute.paymentId) && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-blue-900">
                        Payment Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-blue-800">
                            Payment ID:
                          </span>
                          <p className="text-blue-600 font-mono text-xs break-all">
                            {selectedDispute.payment?.id ||
                              selectedDispute.paymentId ||
                              "N/A"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">
                            Amount:
                          </span>
                          <p className="text-blue-600">
                            RM{" "}
                            {selectedDispute.payment?.amount?.toLocaleString() ||
                              "0"}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">
                            Status:
                          </span>
                          <Badge
                            className={`ml-2 ${
                              selectedDispute.payment?.status === "ESCROWED"
                                ? "bg-green-100 text-green-800"
                                : selectedDispute.payment?.status === "REFUNDED"
                                ? "bg-red-100 text-red-800"
                                : selectedDispute.payment?.status === "RELEASED"
                                ? "bg-blue-100 text-blue-800"
                                : selectedDispute.payment?.status === "DISPUTED"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {selectedDispute.payment?.status || "N/A"}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium text-blue-800">
                            Payment Method:
                          </span>
                          <p className="text-blue-600">
                            {selectedDispute.payment?.method || "N/A"}
                          </p>
                        </div>
                      </div>
                      {selectedDispute.payment?.stripeRefundId && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <span className="font-medium text-blue-800">
                            Refund Transaction ID:
                          </span>
                          <p className="text-blue-600 font-mono text-xs break-all">
                            {selectedDispute.payment?.stripeRefundId}
                          </p>
                        </div>
                      )}
                      {selectedDispute.payment?.bankTransferRef && (
                        <div className="mt-2 pt-2 border-t border-blue-200">
                          <span className="font-medium text-blue-800">
                            Transfer Reference:
                          </span>
                          <p className="text-blue-600 font-mono text-xs break-all">
                            {selectedDispute.payment?.bankTransferRef?.startsWith(
                              "http"
                            ) ? (
                              <a
                                href={selectedDispute.payment.bankTransferRef}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                View File
                              </a>
                            ) : (
                              selectedDispute.payment?.bankTransferRef
                            )}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Resolution Form */}
                {selectedDispute.status !== "RESOLVED" &&
                  selectedDispute.status !== "CLOSED" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Resolution Actions
                        </CardTitle>
                        <CardDescription>
                          {selectedDispute.payment
                            ? `Payment Amount: RM ${
                                selectedDispute.payment?.amount?.toLocaleString() ||
                                selectedDispute.contestedAmount ||
                                0
                              }`
                            : `Contested Amount: RM ${
                                selectedDispute.contestedAmount || 0
                              }`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (
                                !selectedDispute.payment?.id &&
                                !selectedDispute.paymentId &&
                                !selectedDispute.milestoneId
                              ) {
                                toast({
                                  title: "Error",
                                  description:
                                    "No payment found for this dispute",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setSelectedAction("refund");
                              // Reset image when switching actions
                              setBankTransferRefImage(null);
                              setBankTransferRefImagePreview(null);
                            }}
                            disabled={
                              actionLoading ||
                              (!selectedDispute.payment?.id &&
                                !selectedDispute.paymentId &&
                                !selectedDispute.milestoneId)
                            }
                            className={`${
                              selectedAction === "refund"
                                ? "bg-green-50 border-green-500 text-green-700"
                                : "text-green-600 hover:text-green-700 border-green-300"
                            }`}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Refund (Company Wins)
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (
                                !selectedDispute.payment?.id &&
                                !selectedDispute.paymentId &&
                                !selectedDispute.milestoneId
                              ) {
                                toast({
                                  title: "Error",
                                  description:
                                    "No payment found for this dispute",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setSelectedAction("release");
                              // Reset image when switching actions
                              setBankTransferRefImage(null);
                              setBankTransferRefImagePreview(null);
                            }}
                            disabled={
                              actionLoading ||
                              (!selectedDispute.payment?.id &&
                                !selectedDispute.paymentId &&
                                !selectedDispute.milestoneId)
                            }
                            className={`${
                              selectedAction === "release"
                                ? "bg-blue-50 border-blue-500 text-blue-700"
                                : "text-blue-600 hover:text-blue-700 border-blue-300"
                            }`}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Release (Provider Wins)
                          </Button>
                          {/* <Button
                            variant="outline"
                            onClick={() => {
                              if (
                                !selectedDispute.payment?.id &&
                                !selectedDispute.paymentId &&
                                !selectedDispute.milestoneId
                              ) {
                                toast({
                                  title: "Error",
                                  description:
                                    "No payment found for this dispute",
                                  variant: "destructive",
                                });
                                return;
                              }
                              setSelectedAction("partial");
                              // Reset amounts and image when switching actions
                              setRefundAmount("");
                              setReleaseAmount("");
                              setBankTransferRefImage(null);
                              setBankTransferRefImagePreview(null);
                            }}
                            disabled={
                              actionLoading ||
                              (!selectedDispute.payment?.id &&
                                !selectedDispute.paymentId &&
                                !selectedDispute.milestoneId)
                            }
                            className={`${
                              selectedAction === "partial"
                                ? "bg-purple-50 border-purple-500 text-purple-700"
                                : "border-purple-300 text-purple-600 hover:text-purple-700"
                            }`}
                          >
                            <DollarSign className="w-4 h-4 mr-2" />
                            Partial Split
                          </Button> */}
                          <Button
                            variant="outline"
                            onClick={() => handleResolve("redo")}
                            disabled={actionLoading}
                            className="text-yellow-600 hover:text-yellow-700 border-yellow-300"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Redo Milestone
                          </Button>
                        </div>

                        {/* Submit Button for Refund - No image needed */}
                        {selectedAction === "refund" && (
                          <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-green-900">
                                  Process Refund
                                </h4>
                                <p className="text-sm text-green-700 mt-1">
                                  Refund will be processed directly via Stripe.
                                  No bank transfer reference needed.
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAction(null);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            <Button
                              onClick={() => handleResolve("refund")}
                              disabled={actionLoading}
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                            >
                              {actionLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <DollarSign className="w-4 h-4 mr-2" />
                                  Submit Refund
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        {/* Bank Transfer Reference Image Upload Section - Only for Release */}
                        {selectedAction === "release" && (
                          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label
                                  htmlFor="bank-transfer-ref-image"
                                  className="text-base font-semibold"
                                >
                                  Bank Transfer Reference Image
                                </Label>
                                <p className="text-sm text-gray-600 mt-1">
                                  Required for release processing
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAction(null);
                                  setBankTransferRefImage(null);
                                  setBankTransferRefImagePreview(null);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Provider Payout Method Info */}
                            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="font-semibold text-blue-900">
                                  Provider Payout Method
                                </h4>
                                {selectedDispute.project?.provider?.id && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const provider =
                                        selectedDispute.project?.provider;
                                      if (provider?.id) {
                                        router.push(
                                          `/admin/messages?userId=${
                                            provider.id
                                          }&name=${encodeURIComponent(
                                            provider.name || ""
                                          )}`
                                        );
                                      }
                                    }}
                                    className="text-xs"
                                  >
                                    <MessageSquare className="w-3 h-3 mr-1" />
                                    Message Provider
                                  </Button>
                                )}
                              </div>
                              {selectedDispute.project?.provider
                                ?.providerProfile?.payoutMethods &&
                              selectedDispute.project.provider.providerProfile
                                .payoutMethods.length > 0 ? (
                                <div className="space-y-2">
                                  {selectedDispute.project.provider.providerProfile.payoutMethods.map(
                                    (method: PayoutMethod, index: number) => {
                                      const getPayoutIcon = (type: string) => {
                                        switch (type) {
                                          case "BANK":
                                            return (
                                              <Building2 className="w-4 h-4" />
                                            );
                                          case "PAYPAL":
                                            return (
                                              <Wallet className="w-4 h-4" />
                                            );
                                          case "PAYONEER":
                                            return (
                                              <CreditCard className="w-4 h-4" />
                                            );
                                          case "WISE":
                                            return (
                                              <TrendingUp className="w-4 h-4" />
                                            );
                                          case "EWALLET":
                                            return (
                                              <Wallet className="w-4 h-4" />
                                            );
                                          default:
                                            return (
                                              <CreditCard className="w-4 h-4" />
                                            );
                                        }
                                      };

                                      const getPayoutDisplay = (
                                        method: PayoutMethod
                                      ) => {
                                        if (method.type === "BANK") {
                                          return {
                                            title:
                                              method.label ||
                                              method.bankName ||
                                              "Bank Account",
                                            subtitle: method.accountNumber
                                              ? `Account: •••• ${method.accountNumber.slice(
                                                  -4
                                                )}`
                                              : "No account number",
                                            details: method.accountHolder
                                              ? `Holder: ${method.accountHolder}`
                                              : "",
                                          };
                                        } else {
                                          return {
                                            title: method.label || method.type,
                                            subtitle: method.accountEmail || "",
                                            details: method.walletId || "",
                                          };
                                        }
                                      };

                                      const display = getPayoutDisplay(method);

                                      return (
                                        <div
                                          key={method.id || index}
                                          className="p-3 bg-white rounded border border-blue-200"
                                        >
                                          <div className="flex items-start gap-3">
                                            <div className="mt-0.5 text-blue-600">
                                              {getPayoutIcon(method.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="font-medium text-sm text-gray-900">
                                                {display.title}
                                              </p>
                                              {display.subtitle && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                  {display.subtitle}
                                                </p>
                                              )}
                                              {display.details && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                  {display.details}
                                                </p>
                                              )}
                                              <Badge
                                                variant="outline"
                                                className="mt-2 text-xs"
                                              >
                                                {method.type}
                                              </Badge>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              ) : (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                  <div className="flex items-start gap-2">
                                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-yellow-900">
                                        No payout method provided
                                      </p>
                                      <p className="text-xs text-yellow-700 mt-1">
                                        The provider has not set up any payout
                                        methods. Please contact them to add
                                        their bank details or payment
                                        information.
                                      </p>
                                      {selectedDispute.project?.provider
                                        ?.id && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => {
                                            const provider =
                                              selectedDispute.project?.provider;
                                            if (provider?.id) {
                                              router.push(
                                                `/admin/messages?userId=${
                                                  provider.id
                                                }&name=${encodeURIComponent(
                                                  provider.name || ""
                                                )}`
                                              );
                                            }
                                          }}
                                          className="mt-2 text-xs"
                                        >
                                          <MessageSquare className="w-3 h-3 mr-1" />
                                          Message Provider to Add Payout Method
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2">
                              {bankTransferRefImagePreview ? (
                                <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                                  <Image
                                    src={bankTransferRefImagePreview}
                                    alt="Bank transfer reference"
                                    fill
                                    className="object-contain"
                                    unoptimized
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    className="absolute top-2 right-2"
                                    onClick={() => {
                                      setBankTransferRefImage(null);
                                      setBankTransferRefImagePreview(null);
                                    }}
                                  >
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                  <input
                                    type="file"
                                    id="bank-transfer-ref-image"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        // Validate file type
                                        if (!file.type.startsWith("image/")) {
                                          toast({
                                            title: "Invalid file type",
                                            description:
                                              "Please select an image file",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        // Validate file size (5MB)
                                        if (file.size > 5 * 1024 * 1024) {
                                          toast({
                                            title: "File too large",
                                            description:
                                              "Please select an image smaller than 5MB",
                                            variant: "destructive",
                                          });
                                          return;
                                        }
                                        setBankTransferRefImage(file);
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                          setBankTransferRefImagePreview(
                                            reader.result as string
                                          );
                                        };
                                        reader.readAsDataURL(file);
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor="bank-transfer-ref-image"
                                    className="cursor-pointer flex flex-col items-center"
                                  >
                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-600">
                                      Click to upload bank transfer reference
                                      image
                                    </span>
                                    <span className="text-xs text-gray-500 mt-1">
                                      PNG, JPG, GIF up to 5MB
                                    </span>
                                  </label>
                                </div>
                              )}
                            </div>
                            {/* Submit Button - Only shows when image is uploaded for Release */}
                            {bankTransferRefImage && (
                              <Button
                                onClick={() => {
                                  if (!bankTransferRefImage) {
                                    toast({
                                      title: "Image Required",
                                      description:
                                        "Please upload a bank transfer reference image",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  handleResolve("release");
                                }}
                                disabled={actionLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                {actionLoading ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Processing...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Submit Release
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Partial Split Section - Shows when partial is selected */}
                        {selectedAction === "partial" && (
                          <div className="space-y-4 p-4 border rounded-lg bg-purple-50 border-purple-200">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-semibold text-purple-900">
                                  Partial Split
                                </h4>
                                <p className="text-sm text-purple-700 mt-1">
                                  Split the payment between refund (customer)
                                  and release (provider)
                                </p>
                                <p className="text-xs text-purple-600 mt-1">
                                  Total Available: RM{" "}
                                  {(
                                    selectedDispute?.payment?.amount ||
                                    selectedDispute?.contestedAmount ||
                                    0
                                  ).toLocaleString()}
                                </p>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedAction(null);
                                  setRefundAmount("");
                                  setReleaseAmount("");
                                  setBankTransferRefImage(null);
                                  setBankTransferRefImagePreview(null);
                                }}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="space-y-4">
                              {/* Refund Amount Input */}
                              <div className="space-y-2">
                                <Label htmlFor="partial-refund-amount">
                                  Refund Amount (RM) - To Customer
                                </Label>
                                <Input
                                  id="partial-refund-amount"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={
                                    selectedDispute?.payment?.amount ||
                                    selectedDispute?.contestedAmount ||
                                    0
                                  }
                                  value={refundAmount}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setRefundAmount(val);
                                  }}
                                  placeholder="0.00"
                                  className="bg-white"
                                />
                                <p className="text-xs text-gray-600">
                                  Amount to refund to customer via Stripe (no
                                  image needed)
                                </p>
                              </div>

                              {/* Release Amount Input */}
                              <div className="space-y-2">
                                <Label htmlFor="partial-release-amount">
                                  Release Amount (RM) - To Provider
                                </Label>
                                <Input
                                  id="partial-release-amount"
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={
                                    selectedDispute?.payment?.amount ||
                                    selectedDispute?.contestedAmount ||
                                    0
                                  }
                                  value={releaseAmount}
                                  onChange={(e) =>
                                    setReleaseAmount(e.target.value)
                                  }
                                  placeholder="0.00"
                                  className="bg-white"
                                />
                                <p className="text-xs text-gray-600">
                                  Amount to release to provider (requires bank
                                  transfer reference)
                                </p>
                              </div>

                              {/* Total Validation Warning */}
                              {(parseFloat(refundAmount) || 0) +
                                (parseFloat(releaseAmount) || 0) >
                                (selectedDispute?.payment?.amount ||
                                  selectedDispute?.contestedAmount ||
                                  0) && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                                  <AlertCircle className="w-4 h-4 inline mr-2" />
                                  Warning: Total exceeds available payment
                                  amount
                                </div>
                              )}

                              {/* Provider Payout Method Info - Only shows if release amount > 0 */}
                              {parseFloat(releaseAmount) > 0 && (
                                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                                  <div className="flex items-center justify-between mb-3">
                                    <h4 className="font-semibold text-blue-900 text-sm">
                                      Provider Payout Method
                                    </h4>
                                    {selectedDispute.project?.provider?.id && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const provider =
                                            selectedDispute.project?.provider;
                                          if (provider?.id) {
                                            router.push(
                                              `/admin/messages?userId=${
                                                provider.id
                                              }&name=${encodeURIComponent(
                                                provider.name || ""
                                              )}`
                                            );
                                          }
                                        }}
                                        className="text-xs"
                                      >
                                        <MessageSquare className="w-3 h-3 mr-1" />
                                        Message Provider
                                      </Button>
                                    )}
                                  </div>
                                  {selectedDispute.project?.provider
                                    ?.providerProfile?.payoutMethods &&
                                  selectedDispute.project.provider
                                    .providerProfile.payoutMethods.length >
                                    0 ? (
                                    <div className="space-y-2">
                                      {selectedDispute.project.provider.providerProfile.payoutMethods.map(
                                        (
                                          method: PayoutMethod,
                                          index: number
                                        ) => {
                                          const getPayoutIcon = (
                                            type: string
                                          ) => {
                                            switch (type) {
                                              case "BANK":
                                                return (
                                                  <Building2 className="w-4 h-4" />
                                                );
                                              case "PAYPAL":
                                                return (
                                                  <Wallet className="w-4 h-4" />
                                                );
                                              case "PAYONEER":
                                                return (
                                                  <CreditCard className="w-4 h-4" />
                                                );
                                              case "WISE":
                                                return (
                                                  <TrendingUp className="w-4 h-4" />
                                                );
                                              case "EWALLET":
                                                return (
                                                  <Wallet className="w-4 h-4" />
                                                );
                                              default:
                                                return (
                                                  <CreditCard className="w-4 h-4" />
                                                );
                                            }
                                          };

                                          const getPayoutDisplay = (
                                            method: PayoutMethod
                                          ) => {
                                            if (method.type === "BANK") {
                                              return {
                                                title:
                                                  method.label ||
                                                  method.bankName ||
                                                  "Bank Account",
                                                subtitle: method.accountNumber
                                                  ? `Account: •••• ${method.accountNumber.slice(
                                                      -4
                                                    )}`
                                                  : "No account number",
                                                details: method.accountHolder
                                                  ? `Holder: ${method.accountHolder}`
                                                  : "",
                                              };
                                            } else {
                                              return {
                                                title:
                                                  method.label || method.type,
                                                subtitle:
                                                  method.accountEmail || "",
                                                details: method.walletId || "",
                                              };
                                            }
                                          };

                                          const display =
                                            getPayoutDisplay(method);

                                          return (
                                            <div
                                              key={method.id || index}
                                              className="p-3 bg-white rounded border border-blue-200"
                                            >
                                              <div className="flex items-start gap-3">
                                                <div className="mt-0.5 text-blue-600">
                                                  {getPayoutIcon(method.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <p className="font-medium text-sm text-gray-900">
                                                    {display.title}
                                                  </p>
                                                  {display.subtitle && (
                                                    <p className="text-xs text-gray-600 mt-1">
                                                      {display.subtitle}
                                                    </p>
                                                  )}
                                                  {display.details && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                      {display.details}
                                                    </p>
                                                  )}
                                                  <Badge
                                                    variant="outline"
                                                    className="mt-2 text-xs"
                                                  >
                                                    {method.type}
                                                  </Badge>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  ) : (
                                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                      <div className="flex items-start gap-2">
                                        <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="text-sm font-medium text-yellow-900">
                                            No payout method provided
                                          </p>
                                          <p className="text-xs text-yellow-700 mt-1">
                                            The provider has not set up any
                                            payout methods. Please contact them
                                            to add their bank details or payment
                                            information.
                                          </p>
                                          {selectedDispute.project?.provider
                                            ?.id && (
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() => {
                                                const provider =
                                                  selectedDispute.project
                                                    ?.provider;
                                                if (provider?.id) {
                                                  router.push(
                                                    `/admin/messages?userId=${
                                                      provider.id
                                                    }&name=${encodeURIComponent(
                                                      provider.name || ""
                                                    )}`
                                                  );
                                                }
                                              }}
                                              className="mt-2 text-xs"
                                            >
                                              <MessageSquare className="w-3 h-3 mr-1" />
                                              Message Provider to Add Payout
                                              Method
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Bank Transfer Reference Image Upload - Only required if release amount > 0 */}
                              {parseFloat(releaseAmount) > 0 && (
                                <div className="space-y-2">
                                  <Label htmlFor="partial-bank-transfer-ref-image">
                                    Bank Transfer Reference Image (Required for
                                    Release)
                                  </Label>
                                  <div className="space-y-2">
                                    {bankTransferRefImagePreview ? (
                                      <div className="relative w-full h-48 border rounded-lg overflow-hidden">
                                        <Image
                                          src={bankTransferRefImagePreview}
                                          alt="Bank transfer reference"
                                          fill
                                          className="object-contain"
                                          unoptimized
                                        />
                                        <Button
                                          type="button"
                                          variant="destructive"
                                          size="sm"
                                          className="absolute top-2 right-2"
                                          onClick={() => {
                                            setBankTransferRefImage(null);
                                            setBankTransferRefImagePreview(
                                              null
                                            );
                                          }}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
                                        <input
                                          type="file"
                                          id="partial-bank-transfer-ref-image"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              // Validate file type
                                              if (
                                                !file.type.startsWith("image/")
                                              ) {
                                                toast({
                                                  title: "Invalid file type",
                                                  description:
                                                    "Please select an image file",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }
                                              // Validate file size (5MB)
                                              if (file.size > 5 * 1024 * 1024) {
                                                toast({
                                                  title: "File too large",
                                                  description:
                                                    "Please select an image smaller than 5MB",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }
                                              setBankTransferRefImage(file);
                                              const reader = new FileReader();
                                              reader.onloadend = () => {
                                                setBankTransferRefImagePreview(
                                                  reader.result as string
                                                );
                                              };
                                              reader.readAsDataURL(file);
                                            }
                                          }}
                                        />
                                        <label
                                          htmlFor="partial-bank-transfer-ref-image"
                                          className="cursor-pointer flex flex-col items-center"
                                        >
                                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                          <span className="text-sm text-gray-600">
                                            Click to upload bank transfer
                                            reference image
                                          </span>
                                          <span className="text-xs text-gray-500 mt-1">
                                            PNG, JPG, GIF up to 5MB
                                          </span>
                                        </label>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Resolution Notes */}
                              <div className="space-y-2">
                                <Label htmlFor="partial-resolution-notes">
                                  Resolution Notes (Optional)
                                </Label>
                                <Textarea
                                  id="partial-resolution-notes"
                                  placeholder="Enter resolution notes..."
                                  value={resolutionNotes}
                                  onChange={(e) =>
                                    setResolutionNotes(e.target.value)
                                  }
                                  className="min-h-[80px] bg-white"
                                />
                              </div>

                              {/* Submit Button */}
                              {(() => {
                                const hasPayment =
                                  selectedDispute?.payment?.id ||
                                  selectedDispute?.paymentId ||
                                  selectedDispute?.milestoneId;
                                const refund = parseFloat(refundAmount) || 0;
                                const release = parseFloat(releaseAmount) || 0;
                                const hasAmount = refund > 0 || release > 0;
                                const needsImage =
                                  release > 0 && !bankTransferRefImage;
                                const totalAmount =
                                  selectedDispute?.payment?.amount ||
                                  selectedDispute?.contestedAmount ||
                                  0;
                                const exceedsTotal =
                                  refund + release > totalAmount;
                                const isDisabled =
                                  actionLoading ||
                                  !hasPayment ||
                                  !hasAmount ||
                                  needsImage ||
                                  exceedsTotal;

                                return (
                                  <div className="space-y-2">
                                    {isDisabled && !actionLoading && (
                                      <div className="text-xs text-red-600 space-y-1">
                                        {!hasPayment && (
                                          <p className="flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            No payment found for this dispute
                                          </p>
                                        )}
                                        {hasPayment && !hasAmount && (
                                          <p className="flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Please enter at least one amount
                                            (refund or release)
                                          </p>
                                        )}
                                        {hasPayment &&
                                          hasAmount &&
                                          needsImage && (
                                            <p className="flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" />
                                              Bank transfer reference image is
                                              required for release
                                            </p>
                                          )}
                                        {hasPayment &&
                                          hasAmount &&
                                          !needsImage &&
                                          exceedsTotal && (
                                            <p className="flex items-center gap-1">
                                              <AlertCircle className="w-3 h-3" />
                                              Total amount exceeds available
                                              payment
                                            </p>
                                          )}
                                      </div>
                                    )}
                                    <Button
                                      onClick={() => handleResolve("partial")}
                                      disabled={isDisabled}
                                      className="w-full bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {actionLoading ? (
                                        <>
                                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                          Processing...
                                        </>
                                      ) : (
                                        <>
                                          <DollarSign className="w-4 h-4 mr-2" />
                                          Submit Partial Split
                                        </>
                                      )}
                                    </Button>
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        )}
                        <div className="space-y-2">
                          <Label htmlFor="resolution-notes">
                            Resolution Notes (Optional)
                          </Label>
                          <Textarea
                            id="resolution-notes"
                            placeholder="Enter resolution notes..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            className="min-h-[80px]"
                          />
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => handleResolve("cancel")}
                          disabled={actionLoading}
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Reject Dispute
                        </Button>
                      </CardContent>
                    </Card>
                  )}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setViewDialogOpen(false);
                  setSelectedAction(null);
                  setBankTransferRefImage(null);
                  setBankTransferRefImagePreview(null);
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Partial Payout Dialog */}
        <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Partial Payout</DialogTitle>
              <DialogDescription>
                Specify refund and release amounts. Total available: RM{" "}
                {selectedDispute?.payment?.amount?.toLocaleString() ||
                  selectedDispute?.contestedAmount ||
                  0}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedDispute?.payment && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Payment Status:</span>{" "}
                    {selectedDispute.payment.status}
                  </p>
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Payment ID:</span>{" "}
                    <span className="font-mono text-xs">
                      {selectedDispute.payment.id}
                    </span>
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="refund-amount">
                  Refund Amount (RM) - To Customer
                </Label>
                <Input
                  id="refund-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={
                    selectedDispute?.payment?.amount ||
                    selectedDispute?.contestedAmount ||
                    0
                  }
                  value={refundAmount}
                  onChange={(e) => {
                    const val = e.target.value;
                    setRefundAmount(val);
                    // Auto-calculate remaining for release if total is set
                    if (selectedDispute?.payment?.amount) {
                      // Remaining amount available for release (not used currently)
                      // const refund = parseFloat(val) || 0;
                      // const remaining = Math.max(
                      //   0,
                      //   selectedDispute.payment.amount - refund
                      // );
                      if (!releaseAmount || parseFloat(releaseAmount) === 0) {
                        // Only auto-fill if release is empty
                      }
                    }
                  }}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500">
                  Amount to refund to the customer via Stripe
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="release-amount">
                  Release Amount (RM) - To Provider
                </Label>
                <Input
                  id="release-amount"
                  type="number"
                  step="0.01"
                  min="0"
                  max={
                    selectedDispute?.payment?.amount ||
                    selectedDispute?.contestedAmount ||
                    0
                  }
                  value={releaseAmount}
                  onChange={(e) => setReleaseAmount(e.target.value)}
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500">
                  Amount to release to the provider (requires bank transfer)
                </p>
              </div>
              {(parseFloat(refundAmount) || 0) +
                (parseFloat(releaseAmount) || 0) >
                (selectedDispute?.payment?.amount ||
                  selectedDispute?.contestedAmount ||
                  0) && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  Warning: Total exceeds payment amount
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="payout-resolution-notes">
                  Resolution Notes (Optional)
                </Label>
                <Textarea
                  id="payout-resolution-notes"
                  placeholder="Enter resolution notes..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setPayoutDialogOpen(false);
                  setRefundAmount("");
                  setReleaseAmount("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => handleResolve("partial")}
                disabled={
                  actionLoading ||
                  (!selectedDispute?.payment?.id && !selectedDispute?.paymentId)
                }
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Payout"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
