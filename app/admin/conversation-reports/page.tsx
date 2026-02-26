"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Flag, Loader2, MoreHorizontal, MessageSquare, Bell, UserX } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminConversationReports,
  getAdminConversationReportStats,
  updateConversationReportStatus,
  adminSendNotification,
  suspendUser,
} from "@/lib/api";
import Link from "next/link";
import { REPORT_REASONS } from "@/components/messages/ReportConversationDialog";

type ConversationReport = {
  id: string;
  reason: string;
  additionalDetails: string | null;
  status: string;
  createdAt: string;
  reporter: {
    id: string;
    name: string;
    email: string;
    role: string[];
    customerProfile?: { profileImageUrl?: string } | null;
    providerProfile?: { profileImageUrl?: string } | null;
  };
  reported: {
    id: string;
    name: string;
    email: string;
    role: string[];
    customerProfile?: { profileImageUrl?: string } | null;
    providerProfile?: { profileImageUrl?: string } | null;
  };
};

type ReportStats = {
  total: number;
  pending: number;
  reviewed: number;
};

export default function AdminConversationReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ConversationReport[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<{
    reportId: string;
    userId: string;
    name: string;
  } | null>(null);
  const [notifyTitle, setNotifyTitle] = useState("");
  const [notifyContent, setNotifyContent] = useState("");

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminConversationReports({
        status: statusFilter !== "all" ? statusFilter : undefined,
        search: searchQuery || undefined,
      });
      if (response.success) {
        setReports(response.data || []);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load reports";
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
      const response = await getAdminConversationReportStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: unknown) {
      console.error("Failed to load stats:", error);
    }
  }, []);

  useEffect(() => {
    loadReports();
    loadStats();
  }, [loadReports, loadStats]);

  useEffect(() => {
    const timer = setTimeout(loadReports, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, loadReports]);

  const getReasonLabel = (reason: string) => {
    const found = REPORT_REASONS.find((r) => r.value === reason);
    return found ? found.label : reason;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "bg-amber-100 text-amber-800";
      case "REVIEWED":
        return "bg-blue-100 text-blue-800";
      case "RESOLVED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleStatusChange = async (reportId: string, status: string) => {
    try {
      setActionLoading(reportId);
      await updateConversationReportStatus(reportId, status);
      toast({ title: "Success", description: "Report status updated" });
      loadReports();
      loadStats();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = async (report: ConversationReport) => {
    try {
      setActionLoading(report.id);
      await suspendUser(report.reported.id);
      toast({ title: "Success", description: `Suspended ${report.reported.name}` });
      loadReports();
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to suspend user",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openNotifyDialog = (report: ConversationReport) => {
    setNotifyTarget({
      reportId: report.id,
      userId: report.reported.id,
      name: report.reported.name,
    });
    setNotifyTitle("Regarding your reported conversation");
    setNotifyContent("");
    setNotifyOpen(true);
  };

  const handleSendNotification = async () => {
    if (!notifyTarget || !notifyTitle.trim() || !notifyContent.trim()) return;
    try {
      setActionLoading(notifyTarget.reportId);
      await adminSendNotification({
        userId: notifyTarget.userId,
        title: notifyTitle.trim(),
        content: notifyContent.trim(),
      });
      toast({ title: "Success", description: "Notification sent" });
      setNotifyOpen(false);
      setNotifyTarget(null);
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Failed to send notification",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Message Reports
            </h1>
            <p className="text-gray-600">
              Review reports of suspicious or inappropriate conversations
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Reports
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {stats.pending || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Reviewed / Resolved
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {stats.reviewed || 0}
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
                    placeholder="Search by reporter or reported user name/email..."
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
                  <TabsTrigger
                    value="all"
                    className="text-xs sm:text-sm w-full sm:w-auto"
                  >
                    All Status
                  </TabsTrigger>
                  <TabsTrigger
                    value="PENDING"
                    className="text-xs sm:text-sm w-full sm:w-auto"
                  >
                    Pending
                  </TabsTrigger>
                  <TabsTrigger
                    value="REVIEWED"
                    className="text-xs sm:text-sm w-full sm:w-auto"
                  >
                    Reviewed
                  </TabsTrigger>
                  <TabsTrigger
                    value="RESOLVED"
                    className="text-xs sm:text-sm w-full sm:w-auto"
                  >
                    Resolved
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Reports Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="h-5 w-5 text-amber-500" />
              Conversation Reports
            </CardTitle>
            <CardDescription>
              {reports.length} report(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <Flag className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No reports found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reporter</TableHead>
                    <TableHead>Reported User</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <Link
                          href={`/admin/users/${report.reporter.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {report.reporter.name}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {report.reporter.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/users/${report.reported.id}`}
                          className="font-medium text-blue-600 hover:underline"
                        >
                          {report.reported.name}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {report.reported.email}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {getReasonLabel(report.reason)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 line-clamp-2 max-w-[200px]">
                          {report.additionalDetails || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getStatusColor(report.status)}
                        >
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={!!actionLoading}
                            >
                              {actionLoading === report.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/conversation-reports/${report.id}`}
                              >
                                View conversation
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                Change status
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                {["PENDING", "REVIEWED", "RESOLVED"].map(
                                  (s) => (
                                    <DropdownMenuItem
                                      key={s}
                                      onClick={() =>
                                        handleStatusChange(report.id, s)
                                      }
                                      disabled={report.status === s}
                                    >
                                      {s}
                                    </DropdownMenuItem>
                                  )
                                )}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                            <DropdownMenuItem
                              onClick={() => handleSuspend(report)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Suspend reported user
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/admin/messages?userId=${report.reported.id}&name=${encodeURIComponent(report.reported.name)}`}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Message user
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openNotifyDialog(report)}
                            >
                              <Bell className="h-4 w-4 mr-2" />
                              Send notification
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Send notification dialog */}
        <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send notification</DialogTitle>
              <DialogDescription>
                Send a notification to {notifyTarget?.name || "the reported user"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="notify-title">Title</Label>
                <Input
                  id="notify-title"
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  placeholder="Notification title"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notify-content">Message</Label>
                <Textarea
                  id="notify-content"
                  className="min-h-[100px]"
                  value={notifyContent}
                  onChange={(e) => setNotifyContent(e.target.value)}
                  placeholder="Notification message"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNotifyOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendNotification}
                disabled={
                  !notifyTitle.trim() ||
                  !notifyContent.trim() ||
                  !!actionLoading
                }
              >
                {actionLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Send"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
