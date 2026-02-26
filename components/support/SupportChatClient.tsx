"use client";

import { useEffect, useState, useRef } from "react";
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
} from "lucide-react";
import Image from "next/image";
import {
  getSupportConversation,
  sendSupportMessage,
  type SupportConversation as SupportConvType,
  type SupportMessage,
} from "@/lib/api";
import { getMessageAttachmentUrl } from "@/lib/api";
import { uploadFile } from "@/lib/upload";

type SupportChatClientProps = {
  /** When true, render without Card wrapper for use inside floating widget */
  embedded?: boolean;
};

export function SupportChatClient({
  embedded = false,
}: SupportChatClientProps) {
  const [conversation, setConversation] = useState<SupportConvType | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState("");
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userId =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")?.id
      : null;

  const load = async () => {
    try {
      const res = await getSupportConversation();
      setConversation(res.data);
    } catch (e) {
      console.error(e);
      setConversation(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Real-time: when a human has taken over (or handoff requested), poll for new messages so the user sees admin replies without refreshing
  useEffect(() => {
    const status = conversation?.status;
    const shouldPoll =
      status === "HUMAN_TAKEN" || status === "HANDOFF_REQUESTED";
    if (!shouldPoll || !conversation?.id) return;

    const interval = setInterval(() => {
      getSupportConversation()
        .then((res) => {
          setConversation(res.data);
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [conversation?.id, conversation?.status]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversation?.messages]);

  const senderLabel = (m: SupportMessage) => {
    if (m.senderType === "AI")
      return { label: "AI", icon: Bot, color: "bg-muted" };
    if (m.senderUserId === userId)
      return { label: "You", icon: User, color: "bg-primary/10" };
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

  const content = (
    <>
      <div
        className={`flex-1 overflow-y-auto space-y-4 ${embedded ? "mb-2" : "mb-4"}`}
      >
        {!conversation?.messages?.length ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Send a message to get started. The AI answers from the Company and
            Provider manuals.
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
                  <div className="rounded-lg border bg-card px-3 py-2 text-sm">
                    <p className="whitespace-pre-wrap">{m.content}</p>
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
                              className="text-xs text-primary underline"
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
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm text-amber-800 dark:text-amber-200">
          This conversation has been closed. You cannot send more messages.
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

  if (embedded) {
    return (
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden p-4">
        {content}
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
        {content}
      </CardContent>
    </Card>
  );
}
