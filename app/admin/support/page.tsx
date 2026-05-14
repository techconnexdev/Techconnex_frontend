"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import { AdminLayout } from "@/components/admin-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  getAdminSupportConversations,
  getAdminSupportConversation,
  sendAdminSupportMessage,
  updateAdminSupportConversationStatus,
  getAdminSupportReferences,
  uploadAdminSupportReference,
  reindexAdminSupportReference,
  deleteAdminSupportReference,
} from "@/lib/api";
import { getMessageAttachmentUrl } from "@/lib/api";
import {
  Loader2,
  Upload,
  RefreshCw,
  X,
  Trash2,
} from "lucide-react";
import { uploadFile } from "@/lib/upload";
import { useI18n } from "@/contexts/I18nProvider";

type ConvItem = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string[];
  status: string;
  handoffRequestedAt: string | null;
  messageCount: number;
  lastMessage: {
    content: string;
    senderType: string;
    createdAt: string;
  } | null;
  updatedAt: string;
  hasUnread?: boolean;
};

type RefDoc = {
  id: string;
  name: string;
  slug: string;
  fileKey: string;
  fileUrl: string | null;
  indexedAt: string | null;
  chunksCount: number;
  createdAt: string;
};

export default function AdminSupportPage() {
  const { t, locale } = useI18n();
  const [conversations, setConversations] = useState<ConvItem[]>([]);
  const [refs, setRefs] = useState<RefDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [convDetail, setConvDetail] = useState<{
    id: string;
    userId: string;
    user: { id: string; name: string; email: string };
    status: string;
    messages: Array<{
      id: string;
      senderType: string;
      senderUserId: string | null;
      content: string;
      attachments: string[];
      createdAt: string;
    }>;
  } | null>(null);
  const [reply, setReply] = useState("");
  const [replyAttachments, setReplyAttachments] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [uploadingRef, setUploadingRef] = useState<string | null>(null);
  const [reindexing, setReindexing] = useState<string | null>(null);
  const [deletingRef, setDeletingRef] = useState<string | null>(null);
  const [refUploadSlug, setRefUploadSlug] = useState("company_manual");
  const [refUploadName, setRefUploadName] = useState(
    t("admin.support.refs.companyManual")
  );
  const [refFile, setRefFile] = useState<File | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const intlLocale = locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US";

  const loadConversations = useCallback(async () => {
    try {
      const res = await getAdminSupportConversations(statusFilter || undefined);
      setConversations(res.data || []);
    } catch (e) {
      console.error(e);
    }
  }, [statusFilter]);

  const loadRefs = async () => {
    try {
      const res = await getAdminSupportReferences();
      setRefs(res.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadConversations(), loadRefs()]);
      setLoading(false);
    })();
  }, [loadConversations]);

  // Socket.IO: connect for real-time support messages
  useEffect(() => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const API_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const s = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, []);

  // Join/leave conversation room when selecting a conversation
  useEffect(() => {
    if (!socket) return;
    if (selectedId) {
      socket.emit("support:join_conversation", { conversationId: selectedId });
      return () => {
        socket.emit("support:leave_conversation", {
          conversationId: selectedId,
        });
      };
    }
  }, [socket, selectedId]);

  // Real-time: listen for support_message (user messages, AI replies)
  useEffect(() => {
    if (!socket || !selectedId) return;
    const currentId = selectedId;
    const handler = (data: {
      conversationId: string;
      messages?: Array<{
        id: string;
        senderType: string;
        senderUserId: string | null;
        content: string;
        attachments?: string[];
        metadata?: unknown;
        createdAt: string;
      }>;
      status?: string;
    }) => {
      if (data.conversationId !== currentId) return;
      if (data.status) {
        setConvDetail((c) => (c ? { ...c, status: data.status! } : null));
      }
      if (data.messages?.length) {
        setConvDetail((c) => {
          if (!c) return null;
          const existingIds = new Set(c.messages.map((m) => m.id));
          const toAdd = data.messages!.filter((m) => !existingIds.has(m.id)).map((m) => ({
            id: m.id,
            senderType: m.senderType,
            senderUserId: m.senderUserId,
            content: m.content,
            attachments: m.attachments ?? [],
            createdAt: m.createdAt,
          }));
          if (toAdd.length === 0) return c;
          return {
            ...c,
            messages: [...c.messages, ...toAdd],
          };
        });
      }
      loadConversations(); // refresh list (last message, etc.)
    };
    socket.on("support_message", handler);
    return () => {
      socket.off("support_message", handler);
    };
  }, [socket, selectedId]);

  // When switching conversation: clear draft and load the selected one
  useEffect(() => {
    setReply("");
    setReplyAttachments([]);
    if (selectedId) {
      getAdminSupportConversation(selectedId)
        .then((res) => setConvDetail(res.data))
        .catch(() => setConvDetail(null));
    } else {
      setConvDetail(null);
    }
  }, [selectedId]);

  // Fallback: poll conversations list every 10s for new conversations
  useEffect(() => {
    const interval = setInterval(() => loadConversations(), 10000);
    return () => clearInterval(interval);
  }, [loadConversations]);

  const sendReply = async () => {
    if (!selectedId || (!reply.trim() && replyAttachments.length === 0)) return;
    setSending(true);
    try {
      await sendAdminSupportMessage(selectedId, reply.trim(), replyAttachments);
      setReply("");
      setReplyAttachments([]);
      const res = await getAdminSupportConversation(selectedId);
      setConvDetail(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const [replyUploading, setReplyUploading] = useState(false);
  const replyFileRef = useRef<HTMLInputElement>(null);
  const onReplyImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    setReplyUploading(true);
    try {
      const result = await uploadFile({
        file,
        prefix: "support-chat",
        visibility: "public",
        category: "image",
      });
      if (result.success && (result.url || result.key)) {
        setReplyAttachments((p) => [
          ...p,
          result.url || getMessageAttachmentUrl(result.key),
        ]);
      }
    } finally {
      setReplyUploading(false);
      e.target.value = "";
    }
  };

  const closeConversation = async () => {
    if (!selectedId) return;
    try {
      await updateAdminSupportConversationStatus(selectedId, "CLOSED");
      setConvDetail((p) => (p ? { ...p, status: "CLOSED" } : null));
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const uploadRef = async () => {
    if (!refFile || !refUploadSlug || !refUploadName) return;
    setUploadingRef(refUploadSlug);
    try {
      await uploadAdminSupportReference(refFile, refUploadSlug, refUploadName);
      setRefFile(null);
      await loadRefs();
    } catch (e) {
      console.error(e);
    } finally {
      setUploadingRef(null);
    }
  };

  const reindex = async (id: string) => {
    setReindexing(id);
    try {
      await reindexAdminSupportReference(id);
      await loadRefs();
    } catch (e) {
      console.error(e);
    } finally {
      setReindexing(null);
    }
  };

  const deleteRef = async (id: string, name: string) => {
    if (
      !confirm(
        t("admin.support.refs.removeConfirm", {
          name,
        })
      )
    )
      return;
    setDeletingRef(id);
    try {
      await deleteAdminSupportReference(id);
      await loadRefs();
    } catch (e) {
      console.error(e);
      alert((e as Error)?.message || t("admin.support.refs.deleteFailed"));
    } finally {
      setDeletingRef(null);
    }
  };

  const senderLabel = (m: {
    senderType: string;
    senderUserId: string | null;
  }) => {
    if (m.senderType === "AI") return t("admin.support.sender.ai");
    if (convDetail && m.senderUserId === convDetail.userId) return t("admin.support.sender.user");
    return t("admin.support.sender.humanSupport");
  };

  const statusConfig: Record<
    string,
    { label: string; className: string; desc: string }
  > = {
    OPEN: {
      label: t("admin.support.status.OPEN.label"),
      className:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800",
      desc: t("admin.support.status.OPEN.desc"),
    },
    HANDOFF_REQUESTED: {
      label: t("admin.support.status.HANDOFF_REQUESTED.label"),
      className:
        "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-200 dark:border-amber-700",
      desc: t("admin.support.status.HANDOFF_REQUESTED.desc"),
    },
    HUMAN_TAKEN: {
      label: t("admin.support.status.HUMAN_TAKEN.label"),
      className:
        "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:border-emerald-800",
      desc: t("admin.support.status.HUMAN_TAKEN.desc"),
    },
    CLOSED: {
      label: t("admin.support.status.CLOSED.label"),
      className:
        "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      desc: t("admin.support.status.CLOSED.desc"),
    },
  };

  const updateStatus = async (newStatus: string) => {
    if (!selectedId) return;
    try {
      await updateAdminSupportConversationStatus(selectedId, newStatus);
      setConvDetail((p) => (p ? { ...p, status: newStatus } : null));
      loadConversations();
    } catch (e) {
      console.error(e);
    }
  };

  const canAdminReply =
    convDetail && convDetail.status === "HUMAN_TAKEN";

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("admin.support.page.title")}</h1>
          <p className="text-muted-foreground">
            {t("admin.support.page.subtitle")}
          </p>
        </div>

        {/* Reference documents */}
        <Card>
          <CardHeader>
            <CardTitle>{t("admin.support.refs.title")}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t("admin.support.refs.subtitle")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4 items-end">
              <select
                value={refUploadSlug}
                onChange={(e) => {
                  setRefUploadSlug(e.target.value);
                  setRefUploadName(
                    e.target.value === "company_manual"
                      ? t("admin.support.refs.companyManual")
                      : t("admin.support.refs.providerManual"),
                  );
                }}
                className="border rounded px-3 py-2"
              >
                <option value="company_manual">
                  {t("admin.support.refs.companyManual")}
                </option>
                <option value="provider_manual">
                  {t("admin.support.refs.providerManual")}
                </option>
              </select>
              <Input
                placeholder={t("admin.support.refs.displayNamePlaceholder")}
                value={refUploadName}
                onChange={(e) => setRefUploadName(e.target.value)}
                className="max-w-[200px]"
              />
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => setRefFile(e.target.files?.[0] || null)}
                className="max-w-[220px]"
              />
              <Button
                onClick={uploadRef}
                disabled={!refFile || uploadingRef !== null}
              >
                {uploadingRef ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploadingRef
                  ? ` ${t("admin.support.refs.uploading")}`
                  : ` ${t("admin.support.refs.uploadPdf")}`}
              </Button>
            </div>
            <div className="border rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">{t("admin.support.refs.table.name")}</th>
                    <th className="text-left p-2">{t("admin.support.refs.table.slug")}</th>
                    <th className="text-left p-2">{t("admin.support.refs.table.indexed")}</th>
                    <th className="text-left p-2">{t("admin.support.refs.table.chunks")}</th>
                    <th className="text-left p-2">{t("admin.support.refs.table.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {refs.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.slug}</td>
                      <td className="p-2">
                        {r.indexedAt
                          ? new Date(r.indexedAt).toLocaleString(intlLocale)
                          : "—"}
                      </td>
                      <td className="p-2">{r.chunksCount}</td>
                      <td className="p-2 flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => reindex(r.id)}
                          disabled={reindexing === r.id || deletingRef === r.id}
                        >
                          {reindexing === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                          {t("admin.support.refs.table.reindex")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => deleteRef(r.id, r.name)}
                          disabled={reindexing === r.id || deletingRef === r.id}
                        >
                          {deletingRef === r.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                          {t("admin.support.refs.table.remove")}
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!refs.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-4 text-muted-foreground text-center"
                      >
                        {t("admin.support.refs.table.empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Conversations */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>{t("admin.support.conversations.title")}</CardTitle>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-background max-w-[200px]"
              >
                <option value="">{t("admin.support.conversations.filter.allStatuses")}</option>
                <option value="OPEN">{t("admin.support.status.OPEN.label")}</option>
                <option value="HANDOFF_REQUESTED">{t("admin.support.status.HANDOFF_REQUESTED.label")}</option>
                <option value="HUMAN_TAKEN">{t("admin.support.status.HUMAN_TAKEN.label")}</option>
                <option value="CLOSED">{t("admin.support.status.CLOSED.label")}</option>
              </select>
            </div>
            <div className="flex flex-wrap gap-2 mt-2 text-xs">
              <span className="text-muted-foreground">{t("admin.support.conversations.statusLabel")}</span>
              {(
                ["OPEN", "HANDOFF_REQUESTED", "HUMAN_TAKEN", "CLOSED"] as const
              ).map((s) => (
                <span
                  key={s}
                  className={`rounded-full border px-2 py-0.5 ${statusConfig[s].className}`}
                >
                  {statusConfig[s].label}
                </span>
              ))}
            </div>
          </CardHeader>
          <CardContent className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 min-w-0 border rounded overflow-auto max-h-[400px]">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ul className="divide-y">
                  {conversations.map((c) => {
                    const config = statusConfig[c.status] || statusConfig.OPEN;
                    const unread = c.hasUnread && selectedId !== c.id;
                    return (
                      <li
                        key={c.id}
                        className={`p-3 cursor-pointer hover:bg-muted/50 ${selectedId === c.id ? "bg-muted ring-inset ring-1 ring-primary/20" : ""} ${unread ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                        onClick={() => setSelectedId(c.id)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`font-medium truncate flex items-center gap-1.5 ${unread ? "font-semibold text-foreground" : ""}`}
                          >
                            {unread && (
                              <span
                                className="shrink-0 size-2 rounded-full bg-primary"
                                aria-hidden
                              />
                            )}
                            {c.userName || c.userEmail}
                          </span>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${config.className}`}
                          >
                            {config.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.userEmail}
                        </p>
                        {c.lastMessage && (
                          <p
                            className={`text-xs truncate mt-1 ${unread ? "font-medium text-foreground" : ""}`}
                          >
                            {c.lastMessage.content}
                          </p>
                        )}
                        {unread && (
                          <p className="text-xs text-primary font-medium mt-0.5">{t("admin.support.conversations.newMessages")}</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="flex-1 min-w-0 border rounded flex flex-col max-h-[500px]">
              {!convDetail ? (
                <div className="p-8 text-center text-muted-foreground">
                  {t("admin.support.conversations.selectPrompt")}
                </div>
              ) : (
                <>
                  <div className="p-3 border-b bg-muted/30 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">
                        {convDetail.user.name} ({convDetail.user.email})
                      </p>
                      <div className="flex items-center gap-2">
                        <select
                          value={convDetail.status}
                          onChange={(e) => updateStatus(e.target.value)}
                          className={`rounded-md border px-2 py-1 text-sm font-medium ${statusConfig[convDetail.status]?.className ?? ""} bg-background`}
                        >
                          <option value="OPEN">{t("admin.support.status.OPEN.label")}</option>
                          <option value="HANDOFF_REQUESTED">
                            {t("admin.support.status.HANDOFF_REQUESTED.label")}
                          </option>
                          <option value="HUMAN_TAKEN">{t("admin.support.status.HUMAN_TAKEN.label")}</option>
                          <option value="CLOSED">{t("admin.support.status.CLOSED.label")}</option>
                        </select>
                        {convDetail.status !== "CLOSED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={closeConversation}
                          >
                            <X className="h-4 w-4" /> {t("admin.support.actions.close")}
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {statusConfig[convDetail.status]?.desc ??
                        convDetail.status}
                    </p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {convDetail.messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex gap-2 ${m.senderUserId !== convDetail.userId ? "" : "flex-row-reverse"}`}
                      >
                        <div className="rounded-lg border bg-card px-3 py-2 text-sm max-w-[85%]">
                          <Badge variant="outline" className="text-xs mb-1">
                            {senderLabel(m)}
                          </Badge>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          {m.attachments?.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {m.attachments.map((url, i) => {
                                const fullUrl = url.startsWith("http")
                                  ? url
                                  : getMessageAttachmentUrl(url);
                                return (
                                  <a
                                    key={i}
                                    href={fullUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary underline"
                                  >
                                    {t("admin.support.attachment.label")}
                                  </a>
                                );
                              })}
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(m.createdAt).toLocaleString(intlLocale)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {convDetail.status === "OPEN" && (
                    <div className="p-3 border-t bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 rounded-b">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        {t("admin.support.hints.open")}
                      </p>
                    </div>
                  )}
                  {convDetail.status === "HANDOFF_REQUESTED" && (
                    <div className="p-3 border-t bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700 rounded-b">
                      <p className="text-sm text-amber-800 dark:text-amber-200">
                        {t("admin.support.hints.handoffRequested")}
                      </p>
                    </div>
                  )}
                  {canAdminReply && (
                    <div className="p-3 border-t space-y-2">
                      {replyAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {replyAttachments.map((url, i) => (
                            <span key={i} className="text-xs text-primary">
                              {t("admin.support.reply.imageAttached")}
                              <button
                                type="button"
                                className="ml-1 text-destructive"
                                onClick={() =>
                                  setReplyAttachments((p) =>
                                    p.filter((_, j) => j !== i),
                                  )
                                }
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input
                          ref={replyFileRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={onReplyImageUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={replyUploading}
                          onClick={() => replyFileRef.current?.click()}
                        >
                          {replyUploading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </Button>
                        <Textarea
                          placeholder={t("admin.support.reply.placeholder")}
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          rows={2}
                          className="min-h-[60px] flex-1"
                        />
                        <Button
                          onClick={sendReply}
                          disabled={
                            sending ||
                            (!reply.trim() && replyAttachments.length === 0)
                          }
                        >
                          {sending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            t("admin.support.reply.send")
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  {convDetail.status === "CLOSED" && (
                    <div className="p-3 border-t bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-sm rounded-b">
                      {t("admin.support.hints.closed")}
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
