"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import io, { Socket } from "socket.io-client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Paperclip,
  Loader2,
  Bot,
  User,
  HeadphonesIcon,
  MessageSquare,
  History,
  ArrowLeft,
} from "lucide-react";
import Image from "next/image";
import {
  getSupportConversation,
  getSupportSessions,
  getSupportConversationById,
  sendSupportMessage,
  startNewSupportConversation,
  type SupportConversation as SupportConvType,
  type SupportMessage,
  type SupportSessionItem,
} from "@/lib/api";
import { getMessageAttachmentUrl } from "@/lib/api";
import { uploadFile } from "@/lib/upload";

type ViewMode = "chat" | "history" | "history-detail";

function formatRelativeTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 30) return `${diffDays}d`;
  if (diffMonths < 12) return `${diffMonths}mo`;
  return `${diffYears}y`;
}

type SupportChatClientProps = {
  /** When true, render without Card wrapper for use inside floating widget */
  embedded?: boolean;
};

export function SupportChatClient({
  embedded = false,
}: SupportChatClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("chat");
  const [conversation, setConversation] = useState<SupportConvType | null>(
    null,
  );
  const [sessions, setSessions] = useState<SupportSessionItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [historyConversation, setHistoryConversation] =
    useState<SupportConvType | null>(null);
  const [historyDetailLoading, setHistoryDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [startingNew, setStartingNew] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")?.id
      : null;

  const load = useCallback(async () => {
    try {
      const res = await getSupportConversation();
      setConversation(res.data);
    } catch (e) {
      console.error(e);
      setConversation(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await getSupportSessions();
      setSessions(res.data || []);
    } catch (e) {
      console.error(e);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (viewMode === "history") loadSessions();
  }, [viewMode, loadSessions]);

  // Poll for status change until HUMAN_TAKEN or CLOSED (so we detect when admin takes over)
  useEffect(() => {
    const status = conversation?.status;
    if (!conversation?.id || status === "HUMAN_TAKEN" || status === "CLOSED")
      return;
    const interval = setInterval(() => {
      getSupportConversation()
        .then((res) => setConversation(res.data))
        .catch(() => {});
    }, 2500);
    return () => clearInterval(interval);
  }, [conversation?.id, conversation?.status]);

  // Socket.IO: connect only when on chat view and HUMAN_TAKEN (admin has taken over). Otherwise disconnect.
  useEffect(() => {
    if (viewMode !== "chat" || conversation?.status !== "HUMAN_TAKEN") {
      setSocket((prev) => {
        if (prev) {
          prev.disconnect();
          return null;
        }
        return prev;
      });
      return;
    }
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const s = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    setSocket(s);
    // Refetch conversation so we have any messages admin sent before we connected
    getSupportConversation()
      .then((res) => setConversation(res.data))
      .catch(() => {});
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [viewMode, conversation?.status]);

  // Real-time: listen for support_message (admin replies, AI replies, status changes)
  useEffect(() => {
    if (!socket || !conversation?.id) return;
    const convId = conversation.id;
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
      if (data.conversationId !== convId) return;
      if (data.status) {
        setConversation((c) => (c ? { ...c, status: data.status! } : null));
        // Refetch so we have full state (e.g. messages sent before we connected)
        getSupportConversation()
          .then((res) => setConversation(res.data))
          .catch(() => {});
      }
      if (data.messages?.length) {
        setConversation((c) => {
          if (!c) return null;
          const existingIds = new Set(c.messages.map((m) => m.id));
          const toAdd = data.messages!.filter((m) => !existingIds.has(m.id));
          if (toAdd.length === 0) return c;
          const newMsgs: SupportMessage[] = toAdd.map((m) => ({
            id: m.id,
            senderType: m.senderType as "AI" | "HUMAN",
            senderUserId: m.senderUserId,
            content: m.content,
            attachments: m.attachments ?? [],
            metadata: m.metadata as SupportMessage["metadata"],
            createdAt: m.createdAt,
          }));
          return {
            ...c,
            messages: [...c.messages, ...newMsgs],
          };
        });
      }
    };
    socket.on("support_message", handler);
    return () => {
      socket.off("support_message", handler);
    };
  }, [socket, conversation?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  useEffect(() => {
    if (viewMode === "history-detail" && historyConversation?.messages?.length) {
      historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [viewMode, historyConversation?.messages?.length]);

  const senderLabel = (m: SupportMessage) => {
    if (m.senderType === "AI")
      return { label: "AI", icon: Bot, color: "bg-blue-700/10" };
    if (m.senderUserId === userId)
      return { label: "You", icon: User, color: "bg-blue-700/10" };
    return {
      label: "Human Support",
      icon: HeadphonesIcon,
      color: "bg-green-500/10",
    };
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text && attachmentUrls.length === 0) return;
    setSending(true);
    setInput("");
    const urls = [...attachmentUrls];
    setAttachmentUrls([]);
    try {
      const res = await sendSupportMessage(text, urls);
      if (conversation) {
        const newMessages = [res.data.userMessage];
        if (res.data.aiMessage) newMessages.push(res.data.aiMessage);
        setConversation({
          ...conversation,
          messages: [...conversation.messages, ...newMessages],
        });
      } else {
        await load();
      }
    } catch (e) {
      console.error(e);
      setInput(text);
      setAttachmentUrls(urls);
    } finally {
      setSending(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    setUploading(true);
    try {
      const result = await uploadFile({
        file,
        prefix: "support-chat",
        visibility: "public",
        category: "image",
      });
      if (result.success && (result.url || result.key)) {
        const url = result.url || getMessageAttachmentUrl(result.key);
        setAttachmentUrls((prev) => [...prev, url]);
      } else {
        alert(result.error || "Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const openHistorySession = async (sessionId: string) => {
    setHistoryDetailLoading(true);
    setViewMode("history-detail");
    try {
      const res = await getSupportConversationById(sessionId);
      setHistoryConversation(res.data);
    } catch (e) {
      console.error(e);
      setHistoryConversation(null);
    } finally {
      setHistoryDetailLoading(false);
    }
  };

  const backToChat = () => {
    setViewMode("chat");
    setHistoryConversation(null);
  };

  if (loading) {
    if (embedded) {
      return (
        <div className="flex-1 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }
    return (
      <Card className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  const tabs = (
    <div className="flex shrink-0 gap-1 rounded-full border bg-muted/30 p-1 mb-3">
      <button
        type="button"
        onClick={() => setViewMode("chat")}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === "chat"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <MessageSquare className="h-4 w-4" />
        Chat
      </button>
      <button
        type="button"
        onClick={() => setViewMode("history")}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
          viewMode === "history" || viewMode === "history-detail"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <History className="h-4 w-4" />
        History
      </button>
    </div>
  );

  const content = (
    <>
      <div
        className={`flex-1 overflow-y-auto space-y-4 ${embedded ? "mb-2" : "mb-4"}`}
      >
        {!conversation?.messages?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Send a message to get started. The AI answers from the .
          </p>
        ) : (
          conversation.messages.map((m) => {
            const { label, icon: Icon, color } = senderLabel(m);
            return (
              <div
                key={m.id}
                className={`flex gap-3 ${m.senderUserId === userId ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 rounded-full items-center justify-center ${color}`}
                >
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <div
                  className={`flex flex-col max-w-[85%] ${m.senderUserId === userId ? "items-end" : ""}`}
                >
                  <Badge variant="secondary" className="mb-1 w-fit text-xs">
                    {label}
                  </Badge>
                  <div className="rounded-lg border border-blue-700/20 bg-card px-3 py-2 text-sm overflow-hidden">
                    <div className="chat-markdown text-sm [&>*+*]:mt-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <p className="whitespace-pre-wrap m-0">
                              {children}
                            </p>
                          ),
                          ul: ({ children }) => (
                            <ul className="list-disc pl-4 my-2 space-y-0.5">
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol className="list-decimal pl-4 my-2 space-y-0.5">
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li className="leading-relaxed">{children}</li>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-semibold">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic">{children}</em>
                          ),
                          code: ({ className, children, ...props }) => {
                            const isInline = !className;
                            if (isInline) {
                              return (
                                <code
                                  className="rounded bg-blue-700/10 px-1.5 py-0.5 font-mono text-xs"
                                  {...props}
                                >
                                  {children}
                                </code>
                              );
                            }
                            return (
                              <code
                                className="block rounded bg-blue-700/10 p-3 font-mono text-xs overflow-x-auto"
                                {...props}
                              >
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children }) => (
                            <pre className="rounded bg-blue-700/10 p-3 overflow-x-auto my-2 text-xs [&>code]:p-0 [&>code]:bg-transparent">
                              {children}
                            </pre>
                          ),
                          a: ({ href, children }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-700 underline underline-offset-2 hover:no-underline"
                            >
                              {children}
                            </a>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-2 border-blue-700/30 pl-3 my-2 text-muted-foreground italic">
                              {children}
                            </blockquote>
                          ),
                          h1: ({ children }) => (
                            <h1 className="text-base font-semibold mt-3 first:mt-0">
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2 className="text-sm font-semibold mt-3 first:mt-0">
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3 className="text-sm font-medium mt-2 first:mt-0">
                              {children}
                            </h3>
                          ),
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-2">
                              <table className="border-collapse border border-blue-700/20 text-xs w-full">
                                {children}
                              </table>
                            </div>
                          ),
                          th: ({ children }) => (
                            <th className="border border-blue-700/20 bg-blue-700/10 px-2 py-1.5 text-left font-medium">
                              to Guide and Help {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="border border-blue-700/20 px-2 py-1.5">
                              {children}
                            </td>
                          ),
                          hr: () => <hr className="border-blue-700/20 my-2" />,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                    {m.attachments?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.attachments.map((url, i) => {
                          const fullUrl = url.startsWith("http")
                            ? url
                            : getMessageAttachmentUrl(url);
                          const isImage =
                            /\.(jpg|jpeg|png|gif|webp)/i.test(url) ||
                            fullUrl.includes("support-chat");
                          return isImage ? (
                            <a
                              key={i}
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block relative w-24 h-24 rounded overflow-hidden border"
                            >
                              <Image
                                src={fullUrl}
                                alt="Attachment"
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </a>
                          ) : (
                            <a
                              key={i}
                              href={fullUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-700 underline"
                            >
                              View attachment
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground mt-1">
                    {new Date(m.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {conversation?.status === "CLOSED" ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-3 py-3 text-sm text-amber-800 dark:text-amber-200 space-y-2">
          <p>
            This conversation has been closed. You cannot send more messages.
          </p>
          <Button
            size="sm"
            onClick={async () => {
              setStartingNew(true);
              try {
                const res = await startNewSupportConversation();
                setConversation(res.data);
              } catch (e) {
                console.error(e);
              } finally {
                setStartingNew(false);
              }
            }}
            disabled={startingNew}
          >
            {startingNew ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Starting…
              </>
            ) : (
              "Start new conversation"
            )}
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg p-2 space-y-2">
          {attachmentUrls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachmentUrls.map((url, i) => (
                <div
                  key={i}
                  className="relative w-16 h-16 rounded overflow-hidden border"
                >
                  <Image
                    src={
                      url.startsWith("http")
                        ? url
                        : getMessageAttachmentUrl(url)
                    }
                    alt="Attach"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-destructive text-destructive-foreground rounded-bl text-xs px-1"
                    onClick={() =>
                      setAttachmentUrls((p) => p.filter((_, j) => j !== i))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Paperclip className="h-4 w-4" />
              )}
            </Button>
            <Textarea
              placeholder="Type your message..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="min-h-[44px] max-h-32 resize-none"
              rows={2}
            />
            <Button
              onClick={handleSend}
              disabled={sending || (!input.trim() && !attachmentUrls.length)}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );

  const statusLabel: Record<string, string> = {
    OPEN: "Open",
    HANDOFF_REQUESTED: "Handoff requested",
    HUMAN_TAKEN: "Human taken",
    CLOSED: "Closed",
  };

  const historyListView = (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {sessionsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No past sessions yet.
          </p>
        ) : (
          <ul className="divide-y">
            {sessions.map((s) => (
              <li
                key={s.id}
                role="button"
                tabIndex={0}
                onClick={() => openHistorySession(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openHistorySession(s.id);
                  }
                }}
                className="flex cursor-pointer items-center gap-3 p-3 hover:bg-muted/50 rounded-lg transition-colors"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-700/10">
                  <Bot className="h-5 w-5 text-blue-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">AI Support</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.lastMessage?.content?.trim()
                      ? s.lastMessage.content.slice(0, 60) +
                        (s.lastMessage.content.length > 60 ? "…" : "")
                      : "No messages"}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {statusLabel[s.status] ?? s.status}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatRelativeTime(s.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const historyDetailView = (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
      <Button
        variant="ghost"
        size="sm"
        className="w-fit mb-2 -ml-1"
        onClick={() => {
          setViewMode("history");
          setHistoryConversation(null);
        }}
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        Back to list
      </Button>
      {historyDetailLoading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !historyConversation ? (
        <p className="text-sm text-muted-foreground py-4">Failed to load conversation.</p>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {historyConversation.messages.map((m) => {
              const { label, icon: Icon, color } = senderLabel(m);
              return (
                <div
                  key={m.id}
                  className={`flex gap-3 ${m.senderUserId === userId ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 rounded-full items-center justify-center ${color}`}
                  >
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div
                    className={`flex flex-col max-w-[85%] ${m.senderUserId === userId ? "items-end" : ""}`}
                  >
                    <Badge variant="secondary" className="mb-1 w-fit text-xs">
                      {label}
                    </Badge>
                    <div className="rounded-lg border border-blue-700/20 bg-card px-3 py-2 text-sm overflow-hidden">
                      <div className="chat-markdown text-sm [&>*+*]:mt-2">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({ children }) => (
                              <p className="whitespace-pre-wrap m-0">{children}</p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-4 my-2 space-y-0.5">{children}</ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal pl-4 my-2 space-y-0.5">{children}</ol>
                            ),
                            li: ({ children }) => (
                              <li className="leading-relaxed">{children}</li>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold">{children}</strong>
                            ),
                            code: ({ children }) => (
                              <code className="rounded bg-blue-700/10 px-1.5 py-0.5 font-mono text-xs">
                                {children}
                              </code>
                            ),
                            a: ({ href, children }) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-700 underline"
                              >
                                {children}
                              </a>
                            ),
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      </div>
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
                                className="text-xs text-blue-700 underline"
                              >
                                View attachment
                              </a>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">
                      {new Date(m.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
            <div ref={historyEndRef} />
          </div>
          <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
            <p className="text-xs text-muted-foreground">
              This is a past conversation. Status: {statusLabel[historyConversation.status] ?? historyConversation.status}.
            </p>
            <Button size="sm" variant="outline" onClick={backToChat}>
              Back to current chat
            </Button>
            {historyConversation.status === "CLOSED" && (
              <Button
                size="sm"
                onClick={async () => {
                  setStartingNew(true);
                  try {
                    const res = await startNewSupportConversation();
                    setConversation(res.data);
                    setViewMode("chat");
                    setHistoryConversation(null);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setStartingNew(false);
                  }}
                }
                disabled={startingNew}
              >
                {startingNew ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Start new conversation
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (embedded) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden p-4">
        {tabs}
        {viewMode === "history" && historyListView}
        {viewMode === "history-detail" && historyDetailView}
        {viewMode === "chat" && content}
      </div>
    );
  }

  return (
    <Card className="flex flex-col flex-1 min-h-[500px]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          <HeadphonesIcon className="h-5 w-5" />
          AI Support Chat
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask questions about the platform. For account or payment issues, a
          human agent will join.
        </p>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 p-4 overflow-hidden min-h-0">
        {tabs}
        {viewMode === "history" && historyListView}
        {viewMode === "history-detail" && historyDetailView}
        {viewMode === "chat" && content}
      </CardContent>
    </Card>
  );
}
