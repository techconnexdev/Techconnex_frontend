"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Send,
  Paperclip,
  Loader2,
  FileText,
  ArrowLeft,
  Flag,
} from "lucide-react";
import io, { Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";
import { AdminLayout } from "@/components/admin-layout";
import { ReportConversationDialog } from "@/components/messages/ReportConversationDialog";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/contexts/I18nProvider";
import { useToast } from "@/hooks/use-toast";
import { TranslatedMessageText } from "@/components/messages/TranslatedMessageText";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Types
type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  online?: boolean;
  role?: string;
};

type Conversation = {
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
  online?: boolean;
  role?: string;
};

type Message = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  messageType: "text" | "file" | "system" | "proposal";
  attachments: string[];
  isRead: boolean;
  createdAt: string;
  sender: User;
  receiver: User;
};

export default function AdminMessagesPage() {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const projectIdParam = searchParams.get("projectId");
  const chatName = searchParams.get("name");
  const chatAvatar = searchParams.get("avatar");

  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedChatRef = useRef<string | null>(null);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [pendingAttachmentUrl, setPendingAttachmentUrl] = useState<
    string | null
  >(null);
  const [showConversationsList, setShowConversationsList] = useState(true);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const intlLocale = locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US";

  // Get user data and token on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const tokenFromStorage = localStorage.getItem("token");
        const userJson = localStorage.getItem("user");
        const userFromStorage = userJson ? JSON.parse(userJson) : null;
        setToken(tokenFromStorage || "");
        setUser(userFromStorage);
      } catch (error) {
        console.error("Error loading auth data:", error);
        toast({
          title: t("admin.users.toast.errorTitle"),
          description: t("admin.messages.toast.loadAuthError"),
          variant: "destructive",
        });
      }
    }
  }, [t, toast]);

  const currentUserId = user?.id as string | undefined;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!token) return;

    const newSocket = io(API_URL!, {
      auth: {
        token: token,
      },
      transports: ["websocket", "polling"],
    });

    newSocket.on("message_error", (error: { error: string }) => {
      console.error("❌ Message sending failed:", error.error);
      alert(
        t("admin.messages.alert.sendFailed", {
          error: error.error,
        })
      );
      setMessages((prev) => prev.filter((msg) => msg.id.startsWith("temp-")));
    });

    newSocket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error);
      setIsConnected(false);
    });

    newSocket.on("connect", () => {
      console.log("✅ Connected to server");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      setIsConnected(false);
    });

    // Handle receiving messages
    newSocket.on("receive_message", (message: Message) => {
      console.log("📨 Received message via socket:", message);

      const otherUserId =
        message.senderId === currentUserId
          ? message.receiverId
          : message.senderId;

      if (selectedChatRef.current === otherUserId) {
        setMessages((prev) => {
          if (prev.some((msg) => msg.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      }

      setConversations((prev) => {
        const updated = prev.map((conv) => {
          if (conv.userId === otherUserId) {
            return {
              ...conv,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              unreadCount:
                selectedChatRef.current === otherUserId
                  ? 0
                  : conv.unreadCount + 1,
            };
          }
          return conv;
        });

        if (!updated.some((c) => c.userId === otherUserId)) {
          return [
            {
              userId: otherUserId,
              name: message.sender.name || message.receiver.name,
              email: message.sender.email || message.receiver.email,
              avatar: message.sender.avatar || message.receiver.avatar,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              unreadCount: selectedChatRef.current === otherUserId ? 0 : 1,
              online: true,
              role: message.sender.role || message.receiver.role,
            },
            ...updated,
          ];
        }

        return updated;
      });
    });

    newSocket.on("message_sent", (message: Message) => {
      console.log("✅ Message sent confirmation:", message);
      setMessages((prev) =>
        prev.map((msg) => (msg.id.startsWith("temp-") ? message : msg))
      );
    });

    newSocket.on(
      "message_read",
      (data: { messageId: string; readAt: string }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === data.messageId
              ? { ...msg, isRead: true, readAt: data.readAt }
              : msg
          )
        );
      }
    );

    // Handle user online/offline status
    newSocket.on("user_online", (data: { userId: string }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === data.userId ? { ...conv, online: true } : conv
        )
      );
    });

    newSocket.on("user_offline", (data: { userId: string }) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === data.userId ? { ...conv, online: false } : conv
        )
      );
    });

    newSocket.on("online_users", (data: { userIds: string[] }) => {
      setConversations((prev) =>
        prev.map((conv) => ({
          ...conv,
          online: data.userIds.includes(conv.userId),
        }))
      );
    });

    newSocket.on("error", (error: { message: string }) => {
      console.error("Socket error:", error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token, currentUserId, t]);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setConversations(data.data);
      } else {
        console.error("❌ Failed to fetch conversations:", data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
      setConversations([]);
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: t("admin.messages.toast.loadConversationsFailed"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [token, t, toast]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(
    async (otherUserId: string, skipLoadingCheck = false) => {
      if (!token || !otherUserId) return;
      if (loading && !skipLoadingCheck) return;

      try {
        if (!skipLoadingCheck) setLoading(true);

        const url = `${API_URL}/messages?otherUserId=${otherUserId}&translate=0`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (data.success) {
          // If projectId is provided, filter messages for that project, otherwise show all
          let filteredMessages = data.data;
          if (projectIdParam) {
            // Note: This assumes messages have a projectId field
            // If backend doesn't return projectId, we'll show all messages
            filteredMessages = data.data.filter(
              (msg: Record<string, unknown>) =>
                !msg.projectId || msg.projectId === projectIdParam
            );
          }

          setMessages(filteredMessages);

          setConversations((prev) =>
            prev.map((conv) =>
              conv.userId === otherUserId ? { ...conv, unreadCount: 0 } : conv
            )
          );
        } else {
          console.error("Failed to fetch messages:", data.message);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast({
          title: t("admin.users.toast.errorTitle"),
          description: t("admin.messages.toast.loadMessagesFailed"),
          variant: "destructive",
        });
      } finally {
        if (!skipLoadingCheck) setLoading(false);
      }
    },
    [token, projectIdParam, loading, t, toast]
  );

  const handleMessageTranslated = useCallback(
    (messageId: string, newContent: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: newContent } : m,
        ),
      );
    },
    [],
  );

  // Load conversations on mount
  useEffect(() => {
    if (token) {
      fetchConversations();
    }
  }, [token, fetchConversations]);

  // Handle URL parameters for direct chat links
  useEffect(() => {
    if (userIdParam && chatName && !loading && token) {
      selectedChatRef.current = userIdParam;
      setSelectedChat(userIdParam);

      // Hide conversations list on mobile when chat is selected via URL
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setShowConversationsList(false);
      }

      setConversations((prev) => {
        const exists = prev.some((c) => c.userId === userIdParam);
        if (!exists) {
          return [
            ...prev,
            {
              userId: userIdParam,
              name: chatName,
              email: "",
              avatar: chatAvatar || "",
              lastMessageAt: new Date().toISOString(),
              unreadCount: 0,
              online: true,
            },
          ];
        }
        return prev;
      });

      fetchMessages(userIdParam, true);
    }
  }, [userIdParam, chatName, chatAvatar, token, loading, fetchMessages]);

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    selectedChatRef.current = conversation.userId;
    setSelectedChat(conversation.userId);
    fetchMessages(conversation.userId);
    // Hide conversations list on mobile when chat is selected
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setShowConversationsList(false);
    }
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    const resetFileInput = () => {
      event.target.value = "";
    };

    if (!file || !token || !socket || !selectedChat) {
      resetFileInput();
      return;
    }

    setAttachmentUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/messages/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        alert(t("admin.messages.alert.uploadFailed"));
        return;
      }

      setPendingAttachmentUrl(data.fileUrl);
      setShowAttachmentPicker(true);
    } catch {
      alert(t("admin.messages.alert.uploadFailed"));
    } finally {
      setAttachmentUploading(false);
      resetFileInput();
    }
  };

  const sendAttachmentMessage = (projectId?: string) => {
    if (!pendingAttachmentUrl || !socket || !selectedChat) return;
    const messageData: {
      senderId: string | undefined;
      receiverId: string;
      projectId: string | null;
      messageType: "file";
      attachments: string[];
    } = {
      senderId: currentUserId as string | undefined,
      receiverId: selectedChat,
      projectId: projectId || projectIdParam || null,
      messageType: "file",
      attachments: [pendingAttachmentUrl],
    };
    socket.emit(
      "send_message",
      messageData,
      (response: { success?: boolean; error?: string }) => {
        if (!response?.success) {
          alert(
            t("admin.messages.alert.sendFileFailed", {
              error: response.error || t("admin.messages.toast.genericError"),
            })
          );
        }
      }
    );
    setPendingAttachmentUrl(null);
    setShowAttachmentPicker(false);
  };

  // Send message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !socket) {
      return;
    }

    const messageData = {
      senderId: currentUserId,
      receiverId: selectedChat,
      content: newMessage.trim(),
      messageType: "text" as const,
      attachments: [],
      projectId: projectIdParam || null,
    };

    try {
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        content: newMessage.trim(),
        senderId: currentUserId!,
        receiverId: selectedChat,
        messageType: "text",
        attachments: [],
        isRead: false,
        createdAt: new Date().toISOString(),
        sender: {
          id: currentUserId!,
          name: (user?.name as string | undefined) || "Admin",
          email: (user?.email as string | undefined) || "",
        },
        receiver: {
          id: selectedChat,
          name: selectedConversation?.name || "Unknown",
          email: selectedConversation?.email || "",
        },
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage("");

      socket.emit(
        "send_message",
        messageData,
        (response: { success?: boolean; error?: string }) => {
          if (response?.success) {
            console.log("✅ Message sent successfully via socket");
          } else {
            console.error(
              "❌ Failed to send message via socket:",
              response?.error
            );
            setMessages((prev) =>
              prev.filter((msg) => msg.id !== optimisticMessage.id)
            );
            alert(
              t("admin.messages.alert.sendFailed", {
                error: response?.error || t("admin.messages.toast.genericError"),
              })
            );
          }
        }
      );
    } catch (error) {
      console.error("❌ Error in send message:", error);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = useCallback(
    async (messageIds: string[]) => {
      if (!token) return;

      try {
        await Promise.all(
          messageIds.map((id) =>
            fetch(`${API_URL}/messages/${id}/read`, {
              method: "PUT",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
          )
        );
      } catch (error) {
        console.error("Error marking messages as read:", error);
        toast({
          title: t("admin.users.toast.errorTitle"),
          description: t("admin.messages.toast.markReadFailed"),
          variant: "destructive",
        });
      }
    },
    [token, t, toast]
  );

  // Auto-mark messages as read when they become visible
  useEffect(() => {
    if (selectedChat && messages.length > 0 && socket) {
      const unreadMessages = messages.filter(
        (msg) => !msg.isRead && msg.receiverId === currentUserId
      );

      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map((msg) => msg.id);
        markMessagesAsRead(unreadIds);

        unreadMessages.forEach((msg) => {
          socket.emit("mark_as_read", { messageId: msg.id });
        });
      }
    }
  }, [
    messages,
    selectedChat,
    currentUserId,
    socket,
    token,
    markMessagesAsRead,
  ]);

  const selectedConversation = conversations.find(
    (c) => c.userId === selectedChat
  );

  if (!token || !user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">{t("admin.messages.authRequired")}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-12rem)] flex flex-col md:flex-row gap-4 md:gap-6">
        {/* 🧾 Conversations List */}
        <div
          className={`${
            showConversationsList ? "flex" : "hidden"
          } md:flex w-full md:w-1/3 flex-col`}
        >
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base md:text-lg">
                <span>{t("admin.messages.title")}</span>
                <Badge
                  variant={isConnected ? "default" : "secondary"}
                  className={`text-xs ${
                    isConnected ? "bg-green-500" : "bg-gray-500"
                  }`}
                >
                  {isConnected
                    ? t("admin.messages.status.online")
                    : t("admin.messages.status.offline")}
                </Badge>
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder={t("admin.messages.searchPlaceholder")}
                  className="pl-10 text-sm"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
              {loading && conversations.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.userId}
                      className={`p-3 md:p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedChat === conversation.userId
                          ? "bg-blue-50 border-r-2 border-blue-500"
                          : ""
                      }`}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <div className="flex items-start space-x-2 md:space-x-3">
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-10 h-10 md:w-12 md:h-12">
                            <AvatarImage
                              src={
                                conversation.avatar
                                  ? `${
                                      process.env.NEXT_PUBLIC_API_URL ||
                                      "http://localhost:4000"
                                    }${
                                      conversation.avatar.startsWith("/")
                                        ? ""
                                        : "/"
                                    }${conversation.avatar}`
                                  : undefined
                              }
                            />
                            <AvatarFallback>
                              {conversation.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.online && (
                            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1 md:gap-2 min-w-0">
                              <p className="font-medium text-gray-900 truncate text-sm md:text-base">
                                {conversation.name}
                              </p>
                              {conversation.role && (
                                <Badge
                                  variant="outline"
                                  className="text-xs flex-shrink-0"
                                >
                                  {conversation.role}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-1 md:gap-2 flex-shrink-0 ml-2">
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  conversation.lastMessageAt
                                ).toLocaleTimeString(intlLocale, {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-blue-500 text-white text-xs px-1.5 py-0.5 md:px-2 md:py-1 rounded-full">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                            {conversation.lastMessage ||
                              t("admin.messages.lastMessagePlaceholder")}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {conversations.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  {t("admin.messages.empty.noConversations")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 💬 Chat Area */}
        <div
          className={`${
            !showConversationsList || selectedChat ? "flex" : "hidden"
          } md:flex flex-1 flex-col`}
        >
          <Card className="h-full flex flex-col">
            {/* Header */}
            <CardHeader className="border-b pb-3">
              <div className="flex items-center justify-between">
                {selectedConversation ? (
                  <>
                    <div className="flex items-center space-x-2 md:space-x-3 flex-1 min-w-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden mr-1"
                        onClick={() => {
                          setShowConversationsList(true);
                          setSelectedChat(null);
                        }}
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-10 h-10 md:w-12 md:h-12">
                          <AvatarImage
                            src={
                              selectedConversation.avatar
                                ? `${
                                    process.env.NEXT_PUBLIC_API_URL ||
                                    "http://localhost:4000"
                                  }${
                                    selectedConversation.avatar.startsWith("/")
                                      ? ""
                                      : "/"
                                  }${selectedConversation.avatar}`
                                : undefined
                            }
                          />
                          <AvatarFallback>
                            {selectedConversation.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {selectedConversation.online && (
                          <div className="absolute bottom-0 right-0 w-2.5 h-2.5 md:w-3 md:h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin/users/${selectedConversation.userId}`}
                          className="font-semibold text-base md:text-lg hover:underline truncate block"
                        >
                          {selectedConversation.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">
                            {selectedConversation.online
                              ? t("admin.messages.onlineStatus.online")
                              : t("admin.messages.onlineStatus.lastSeen")}
                          </p>
                          {selectedConversation.role && (
                            <Badge
                              variant="outline"
                              className="text-xs flex-shrink-0"
                            >
                              {selectedConversation.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReportDialogOpen(true)}
                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      >
                        <Flag className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center w-full py-4">
                    <p className="text-gray-500 text-sm md:text-base">
                      {t("admin.messages.empty.selectConversation")}
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  {messages.length === 0 && selectedChat && (
                    <p className="text-center text-gray-400 text-sm mt-8">
                      {t("admin.messages.empty.noMessages")}
                    </p>
                  )}

                  {messages.map((message) => {
                    const isOwn = message.senderId === currentUserId;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${
                          isOwn ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`flex items-end space-x-2 max-w-[85%] sm:max-w-xs md:max-w-sm lg:max-w-md ${
                            isOwn ? "flex-row-reverse space-x-reverse" : ""
                          }`}
                        >
                          {!isOwn && (
                            <Avatar className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0">
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback>
                                {message.sender.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`px-3 py-1.5 md:px-4 md:py-2 rounded-lg ${
                              isOwn
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {message.messageType === "file" ? (
                              message.attachments.map((fileUrl, index) => {
                                const isImage =
                                  /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(
                                    fileUrl
                                  );
                                const isPDF = /\.pdf$/i.test(fileUrl);
                                const fileName = fileUrl.split("/").pop();

                                return (
                                  <div key={index} className="mt-2">
                                    {isImage ? (
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Image
                                          src={fileUrl}
                                          alt={t("admin.messages.attachment.alt")}
                                          width={200}
                                          height={200}
                                          className="rounded-lg max-w-[150px] md:max-w-[200px] border object-contain"
                                          unoptimized
                                        />
                                      </a>
                                    ) : isPDF ? (
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`block mt-1 underline ${
                                          isOwn
                                            ? "text-blue-100"
                                            : "text-blue-600"
                                        }`}
                                      >
                                        📄 {fileName}
                                      </a>
                                    ) : (
                                      <a
                                        href={fileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`block mt-1 underline ${
                                          isOwn
                                            ? "text-blue-100"
                                            : "text-blue-600"
                                        }`}
                                      >
                                        📎 {fileName}
                                      </a>
                                    )}
                                  </div>
                                );
                              })
                            ) : message.messageType === "proposal" ? (
                              <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-3 md:p-4 space-y-2 max-w-[280px] md:max-w-xs">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-5 h-5 text-blue-500" />
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {message.content}
                                  </h4>
                                </div>
                                {message.attachments[0] && (
                                  <a
                                    href={`/admin/projects/${message.attachments[0]}`}
                                    className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                                  >
                                    {t("admin.messages.actions.viewProject")}
                                  </a>
                                )}
                              </div>
                            ) : (
                              <TranslatedMessageText
                                messageId={message.id}
                                content={message.content}
                                isOwn={isOwn}
                                targetLocale={locale}
                                token={token}
                                translateLabel={t(
                                  "messages.translate.translate",
                                )}
                                translatingLabel={t(
                                  "messages.translate.translating",
                                )}
                                onContentReplaced={handleMessageTranslated}
                                onTranslateFailed={(reason) =>
                                  toast({
                                    title: t("admin.users.toast.errorTitle"),
                                    description:
                                      reason?.trim() ||
                                      t("messages.translate.failed"),
                                    variant: "destructive",
                                  })
                                }
                                className={
                                  isOwn ? "text-white" : "text-gray-900"
                                }
                              />
                            )}
                            <p
                              className={`text-[10px] md:text-xs mt-1 ${
                                isOwn ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString(
                                intlLocale,
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                              {isOwn && (
                                <span className="ml-2">
                                  {message.isRead ? "✓✓" : "✓"}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </CardContent>

            {/* Input */}
            {selectedChat && (
              <div className="border-t p-2 md:p-4 relative">
                {attachmentUploading && (
                  <div
                    className="mb-2 flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50/80 px-3 py-2 text-xs text-blue-900 md:text-sm"
                    role="status"
                    aria-live="polite"
                  >
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-blue-600" />
                    <span>Uploading file…</span>
                  </div>
                )}
                <div className="flex items-end gap-1 md:gap-2">
                  <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 md:h-10 md:w-10"
                      disabled={attachmentUploading}
                      aria-busy={attachmentUploading}
                      aria-label={
                        attachmentUploading
                          ? "Uploading attachment"
                          : "Attach file"
                      }
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {attachmentUploading ? (
                        <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin text-blue-600" />
                      ) : (
                        <Paperclip className="w-4 h-4 md:w-5 md:h-5" />
                      )}
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <Textarea
                      placeholder={t("admin.messages.input.placeholder")}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[36px] md:min-h-[40px] max-h-24 md:max-h-32 resize-none text-sm md:text-base"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || !selectedChat}
                    className="bg-blue-500 hover:bg-blue-600 text-white h-8 w-8 md:h-10 md:w-10 flex-shrink-0 p-0"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {showAttachmentPicker && (
                  <div className="absolute bottom-14 md:bottom-16 left-2 md:left-4 bg-white border rounded-lg p-2 shadow-lg z-10 w-[calc(100%-1rem)] md:w-64">
                    <div className="p-2 text-sm text-gray-700">
                      {t("admin.messages.attach.prompt")}
                    </div>
                    <div className="p-2 border-t">
                      <Button
                        onClick={() => sendAttachmentMessage()}
                        className="w-full"
                      >
                        {t("admin.messages.attach.sendFile")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
      {selectedConversation && (
        <ReportConversationDialog
          open={reportDialogOpen}
          onOpenChange={setReportDialogOpen}
          reportedUserName={selectedConversation.name}
          reportedUserId={selectedConversation.userId}
        />
      )}
    </AdminLayout>
  );
}
