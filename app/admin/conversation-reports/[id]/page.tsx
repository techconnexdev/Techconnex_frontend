"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Flag, Loader2, FileText } from "lucide-react";
import { AdminLayout } from "@/components/admin-layout";
import { useToast } from "@/hooks/use-toast";
import {
  getAdminConversationReportById,
  getAdminConversationReportMessages,
} from "@/lib/api";
import { getProfileImageUrl, getMessageAttachmentUrl } from "@/lib/api";
import { REPORT_REASONS } from "@/components/messages/ReportConversationDialog";

type UserInfo = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string[];
  createdAt: string;
  customerProfile?: { profileImageUrl?: string } | null;
  providerProfile?: { profileImageUrl?: string } | null;
};

type Report = {
  id: string;
  reason: string;
  additionalDetails: string | null;
  status: string;
  createdAt: string;
  reporter: UserInfo;
  reported: UserInfo;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  messageType: string;
  attachments: string[];
  createdAt: string;
  sender: { id: string; name: string; email: string; customerProfile?: { profileImageUrl?: string }; providerProfile?: { profileImageUrl?: string } };
  receiver: { id: string; name: string; email: string; customerProfile?: { profileImageUrl?: string }; providerProfile?: { profileImageUrl?: string } };
};

function getUserAvatar(user: UserInfo) {
  const url =
    user.customerProfile?.profileImageUrl ||
    user.providerProfile?.profileImageUrl;
  return getProfileImageUrl(url || undefined);
}

function getMessageSenderAvatar(sender: Message["sender"]) {
  const url =
    sender.customerProfile?.profileImageUrl ||
    sender.providerProfile?.profileImageUrl;
  return getProfileImageUrl(url || undefined);
}

export default function AdminConversationReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const reportId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<Report | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [reportRes, messagesRes] = await Promise.all([
        getAdminConversationReportById(reportId),
        getAdminConversationReportMessages(reportId),
      ]);
      if (reportRes.success) setReport(reportRes.data);
      if (messagesRes.success) setMessages(messagesRes.data || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to load report",
        variant: "destructive",
      });
      router.push("/admin/conversation-reports");
    } finally {
      setLoading(false);
    }
  }, [reportId, toast, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  if (loading || !report) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </AdminLayout>
    );
  }

  const reporterId = report.reporter.id;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/conversation-reports")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Report #{reportId.slice(0, 8)}
            </h1>
            <p className="text-sm text-gray-500">
              Reported on {new Date(report.createdAt).toLocaleDateString()} ·{" "}
              <Badge className={getStatusColor(report.status)}>
                {report.status}
              </Badge>
            </p>
          </div>
        </div>

        {/* Report context */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flag className="h-4 w-4 text-amber-500" />
              {getReasonLabel(report.reason)}
            </CardTitle>
            {report.additionalDetails && (
              <CardDescription>{report.additionalDetails}</CardDescription>
            )}
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: User info */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reporter</CardTitle>
                <CardDescription>User who submitted the report</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={getUserAvatar(report.reporter)} />
                    <AvatarFallback>
                      {report.reporter.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{report.reporter.name}</p>
                    <p className="text-sm text-gray-500">
                      {report.reporter.email}
                    </p>
                    {report.reporter.phone && (
                      <p className="text-sm text-gray-500">
                        {report.reporter.phone}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                      {report.reporter.role?.map((r) => (
                        <Badge key={r} variant="outline" className="text-xs">
                          {r}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Member since{" "}
                      {new Date(report.reporter.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/admin/users/${report.reporter.id}`}>
                    <Button variant="outline" size="sm">
                      View profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reported User</CardTitle>
                <CardDescription>User being reported</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center space-y-3">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={getUserAvatar(report.reported)} />
                    <AvatarFallback>
                      {report.reported.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{report.reported.name}</p>
                    <p className="text-sm text-gray-500">
                      {report.reported.email}
                    </p>
                    {report.reported.phone && (
                      <p className="text-sm text-gray-500">
                        {report.reported.phone}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 justify-center mt-2">
                      {report.reported.role?.map((r) => (
                        <Badge key={r} variant="outline" className="text-xs">
                          {r}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Member since{" "}
                      {new Date(report.reported.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Link href={`/admin/users/${report.reported.id}`}>
                    <Button variant="outline" size="sm">
                      View profile
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: Conversation */}
          <div className="lg:col-span-2">
            <Card className="h-[calc(100vh-18rem)] flex flex-col">
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>
                  Messages between {report.reporter.name} and{" "}
                  {report.reported.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    No messages in this conversation
                  </div>
                ) : (
                  messages.map((message) => {
                    const isReporter = message.senderId === reporterId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isReporter ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex items-end gap-2 max-w-[85%] ${
                            isReporter ? "flex-row-reverse" : ""
                          }`}
                        >
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarImage
                              src={getMessageSenderAvatar(message.sender)}
                            />
                            <AvatarFallback>
                              {message.sender.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`px-3 py-2 rounded-lg ${
                              isReporter
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {message.messageType === "file" ? (
                              message.attachments.map((fileUrl, idx) => {
                                const attachmentUrl =
                                  getMessageAttachmentUrl(fileUrl);
                                const isImage = /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(
                                  fileUrl
                                );
                                const isPDF = /\.pdf$/i.test(fileUrl);
                                const fileName =
                                  fileUrl.split("/").pop() ||
                                  fileUrl.split("\\").pop() ||
                                  "attachment";
                                return (
                                  <div key={idx} className="mt-1">
                                    {isImage ? (
                                      <a
                                        href={attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Image
                                          src={attachmentUrl}
                                          alt="Attachment"
                                          width={200}
                                          height={200}
                                          className="rounded max-w-[150px] border object-contain"
                                          unoptimized
                                        />
                                      </a>
                                    ) : (
                                      <a
                                        href={attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={
                                          isReporter
                                            ? "text-blue-100 underline"
                                            : "text-blue-600 underline"
                                        }
                                      >
                                        {isPDF ? "📄" : "📎"} {fileName}
                                      </a>
                                    )}
                                  </div>
                                );
                              })
                            ) : message.messageType === "proposal" ? (
                              <div className="flex flex-col bg-white/10 rounded p-2 space-y-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  <span className="text-sm font-medium">
                                    {message.content}
                                  </span>
                                </div>
                                {message.attachments[0] && (
                                  <Link
                                    href={`/admin/projects/${message.attachments[0]}`}
                                    className="text-xs underline"
                                  >
                                    View project
                                  </Link>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm break-words">
                                {message.content}
                              </p>
                            )}
                            <p
                              className={`text-[10px] mt-1 ${
                                isReporter ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {new Date(
                                message.createdAt
                              ).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
