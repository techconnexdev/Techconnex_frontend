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
} from "lucide-react";
import io, { Socket } from "socket.io-client";
import { useSearchParams } from "next/navigation";
import { ProviderLayout } from "@/components/provider-layout";
import Link from "next/link";
import Image from "next/image";
import { getProfileImageUrl, getMessageAttachmentUrl } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Types
type User = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  online?: boolean;
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

// New type for project association
type ServiceRequest = {
  id: string;
  title: string;
  status: string;
};

export default function CustomerMessagesPage() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");
  const chatName = searchParams.get("name");
  const chatAvatar = searchParams.get("avatar");

  const [socket, setSocket] = useState<Socket | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [projects, setProjects] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState<string>("");
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectedChatRef = useRef<string | null>(null);
  const [showAttachmentPicker, setShowAttachmentPicker] = useState(false);
  const [pendingAttachmentUrl, setPendingAttachmentUrl] = useState<
    string | null
  >(null);

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
      }
    }
  }, []);

  // Fetch open project requests for company
  useEffect(() => {
    if (!token) return;
    const fetchProjects = async () => {
      try {
        const res = await fetch(`${API_URL}/provider/projects`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        if (data.success) {
          const projects = data.projects ?? data.data;
          const availableProjects = projects.filter(
            (proj: Record<string, unknown>) =>
              proj.status === "IN_PROGRESS" || proj.status === "DISPUTED"
          );
          setProjects(availableProjects);
        }
      } catch (error) {
        console.error("Error fetching project requests", error);
      }
    };
    fetchProjects();
  }, [token]);

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
    // In your socket connection, add error handling:
    newSocket.on("message_error", (error: { error: string }) => {
      console.error("❌ Message sending failed:", error.error);
      alert(`Failed to send message: ${error.error}`);

      // Remove the optimistic message
      setMessages((prev) => prev.filter((msg) => msg.id.startsWith("temp-")));
    });

    // Also add this to handle connection errors
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

    // Handle receiving messages (both sent and received)
    newSocket.on("receive_message", (message: Message) => {
      console.log("📨 Received message via socket:", message);

      const otherUserId =
        message.senderId === currentUserId
          ? message.receiverId
          : message.senderId;

      // If this message is for the currently selected chat, add it to messages
      if (selectedChatRef.current === otherUserId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((msg) => msg.id === message.id)) {
            return prev;
          }
          console.log("✅ Adding message to current chat");
          return [...prev, message];
        });
      }

      // Always update conversations list with the latest message
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

        // If conversation doesn't exist, create it (for new conversations)
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
            },
            ...updated,
          ];
        }

        return updated;
      });
    });

    newSocket.on("message_sent", (message: Message) => {
      console.log("✅ Message sent confirmation:", message);
      // Replace optimistic message with real one
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
      console.log("🟢 User online:", data.userId);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === data.userId ? { ...conv, online: true } : conv
        )
      );
    });

    newSocket.on("user_offline", (data: { userId: string }) => {
      console.log("🔴 User offline:", data.userId);
      setConversations((prev) =>
        prev.map((conv) =>
          conv.userId === data.userId ? { ...conv, online: false } : conv
        )
      );
    });

    newSocket.on("online_users", (data: { userIds: string[] }) => {
      console.log("👥 Online users list:", data.userIds);
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
  }, [token, currentUserId]);

  // Fetch conversations list
  const fetchConversations = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      console.log("🔄 Fetching conversations with token:", token);

      const response = await fetch(`${API_URL}/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("📨 Response status:", response.status);

      const data = await response.json();
      console.log("📨 Response data:", data);

      if (data.success) {
        console.log("✅ Conversations data:", data.data);
        setConversations(data.data);
      } else {
        console.error("❌ Failed to fetch conversations:", data.message);
      }
    } catch (error) {
      console.error("❌ Error fetching conversations:", error);
      // Set empty array as fallback
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (
    otherUserId: string,
    skipLoadingCheck = false
  ) => {
    if (!token || !otherUserId) return;
    if (loading && !skipLoadingCheck) return; // prevents re-fetching while still loading

    try {
      if (!skipLoadingCheck) setLoading(true);
      const response = await fetch(
        `${API_URL}/messages?otherUserId=${otherUserId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessages(data.data);

        // Mark conversation as read in the list
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
    } finally {
      if (!skipLoadingCheck) setLoading(false);
    }
  }, [token, loading]);

  // Load conversations on mount
  useEffect(() => {
    if (token) {
      console.log("🔄 Loading conversations...");
      fetchConversations();
    }
  }, [token, fetchConversations]);

  // Handle URL parameters for direct chat links - only when conversations are ready
  useEffect(() => {
    if (userIdParam && chatName && !loading && token) {
      console.log("📍 URL params detected:", { userIdParam, chatName });

      selectedChatRef.current = userIdParam;
      setSelectedChat(userIdParam);

      // Add to conversations if not already there
      const exists = conversations.some((c) => c.userId === userIdParam);
      if (!exists) {
        console.log("➕ Adding new conversation from URL params");
        setConversations((prev) => [
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
        ]);
      } else {
        console.log("✅ Conversation already exists in list");
      }

      // Fetch messages for this user
      console.log("📨 Fetching messages for user:", userIdParam);
      fetchMessages(userIdParam, true);
    }
  }, [userIdParam, chatName, chatAvatar, token, loading, conversations, fetchMessages]);

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    selectedChatRef.current = conversation.userId;
    setSelectedChat(conversation.userId);
    fetchMessages(conversation.userId);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !token || !socket || !selectedChat) return;

    const formData = new FormData();
    formData.append("file", file);

    // Upload file to backend
    const res = await fetch(`${API_URL}/messages/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!data.success) {
      alert("File upload failed");
      return;
    }
    // Show project list picker for attachment if available
    // Always show attachment picker after upload
    setPendingAttachmentUrl(data.fileUrl);
    setShowAttachmentPicker(true);
    return;
  };
  // Helper to send attachment after project selection
  const sendAttachmentMessage = (projectId?: string) => {
    if (!pendingAttachmentUrl || !socket || !selectedChat) return;
    const messageData: {
      senderId: string | undefined;
      receiverId: string | null;
      projectId: string | null;
      messageType: "file";
      attachments: string[];
    } = {
      senderId: currentUserId,
      receiverId: selectedChat,
      projectId: projectId || null,
      messageType: "file",
      attachments: [pendingAttachmentUrl],
    };
    socket.emit("send_message", messageData, (response: { success?: boolean; error?: string }) => {
      if (!response?.success) {
        alert("Failed to send file: " + response.error);
      }
    });
    setPendingAttachmentUrl(null);
    setShowAttachmentPicker(false);
  };

  // Send message
  const handleSendMessage = async () => {
    console.log("🔄 Send message triggered");
    console.log("newMessage:", newMessage);
    console.log("selectedChat:", selectedChat);
    console.log("socket connected:", socket?.connected);

    if (!newMessage.trim() || !selectedChat || !socket) {
      console.log("❌ Cannot send - missing requirements");
      return;
    }

    const messageData = {
      senderId: currentUserId, // ✅ add this line
      receiverId: selectedChat,
      content: newMessage.trim(),
      messageType: "text" as const,
      attachments: [],
    };

    console.log("📤 Sending message data:", messageData);

    try {
      // Create optimistic message immediately
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
          name: (user?.name as string) || "You",
          email: (user?.email as string) || "",
        },
        receiver: {
          id: selectedChat,
          name: selectedConversation?.name || "Unknown",
          email: selectedConversation?.email || "",
        },
      };

      // Add optimistic message to UI immediately
      setMessages((prev) => [...prev, optimisticMessage]);
      setNewMessage(""); // Clear input immediately

      // Send via socket with callback
      socket.emit("send_message", messageData, (response: { success?: boolean; error?: string }) => {
        console.log("📨 Socket callback response:", response);
        if (response?.success) {
          console.log("✅ Message sent successfully via socket");
          // The message_sent event will handle replacing the temp message
        } else {
          console.error(
            "❌ Failed to send message via socket:",
            response?.error
          );
          // Remove the optimistic message on error
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== optimisticMessage.id)
          );
          // Optionally show error to user
          alert("Failed to send message: " + response?.error);
        }
      });
    } catch (error) {
      console.error("❌ Error in send message:", error);
    }
  };

  // Mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
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
    }
  }, [token]);

  // Auto-mark messages as read when they become visible
  useEffect(() => {
    if (selectedChat && messages.length > 0 && socket) {
      const unreadMessages = messages.filter(
        (msg) => !msg.isRead && msg.receiverId === currentUserId
      );

      if (unreadMessages.length > 0) {
        const unreadIds = unreadMessages.map((msg) => msg.id);
        markMessagesAsRead(unreadIds);

        // Emit read receipt via socket
        unreadMessages.forEach((msg) => {
          socket.emit("mark_as_read", { messageId: msg.id });
        });
      }
    }
  }, [messages, selectedChat, currentUserId, socket, markMessagesAsRead]);

  const selectedConversation = conversations.find(
    (c) => c.userId === selectedChat
  );

  if (!token || !user) {
    return (
      <ProviderLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Please log in to view messages</p>
        </div>
      </ProviderLayout>
    );
  }

  return (
    <ProviderLayout>
      <div className="h-[calc(100vh-8rem)] flex gap-6">
        {/* 🧾 Conversations List */}
        <div className="w-1/3">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Messages</span>
                <Badge
                  variant={isConnected ? "default" : "secondary"}
                  className={isConnected ? "bg-green-500" : "bg-gray-500"}
                >
                  {isConnected ? "Online" : "Offline"}
                </Badge>
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search conversations..."
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading && conversations.length === 0 ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conversation) => (
                    <div
                      key={conversation.userId}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedChat === conversation.userId
                          ? "bg-blue-50 border-r-2 border-blue-500"
                          : ""
                      }`}
                      onClick={() => handleSelectConversation(conversation)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="relative">
                          <Avatar>
                            <AvatarImage
                              src={getProfileImageUrl(conversation.avatar)}
                            />
                            <AvatarFallback>
                              {conversation.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-gray-900 truncate">
                              {conversation.name}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                {new Date(
                                  conversation.lastMessageAt
                                ).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {conversation.lastMessage || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {conversations.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No conversations yet
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 💬 Chat Area */}
        <div className="flex-1">
          <Card className="h-full flex flex-col">
            {/* Header */}
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                {selectedConversation ? (
                  <>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar>
                          <AvatarImage
                            src={getProfileImageUrl(selectedConversation.avatar)}
                          />
                          <AvatarFallback>
                            {selectedConversation.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        {selectedConversation.online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/provider/companies/${selectedConversation.userId}`}
                          className="font-semibold text-lg hover:underline"
                        >
                          {selectedConversation.name}
                        </Link>
                        <p className="text-xs text-gray-500">
                          {selectedConversation.online
                            ? "Online"
                            : "Last seen recently"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <Button variant="outline" size="sm">
                        <Phone className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Video className="w-4 h-4" />
                      </Button> */}
                      {/* <Button variant="outline" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button> */}
                    </div>
                  </>
                ) : (
                  <div className="text-center w-full py-4">
                    <p className="text-gray-500">
                      Select a conversation to start chatting
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : (
                <>
                  {messages.length === 0 && selectedChat && (
                    <p className="text-center text-gray-400 text-sm mt-8">
                      No messages yet. Start the conversation!
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
                          className={`flex items-end space-x-2 max-w-[14rem] ${
                            isOwn ? "flex-row-reverse space-x-reverse" : ""
                          }`}
                        >
                          {!isOwn && (
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={message.sender.avatar} />
                              <AvatarFallback>
                                {message.sender.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isOwn
                                ? "bg-blue-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            {message.messageType === "file" ? (
                              message.attachments.map((fileUrl, index) => {
                                const attachmentUrl = getMessageAttachmentUrl(fileUrl);
                                const isImage =
                                  /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(
                                    fileUrl
                                  );
                                const isPDF = /\.pdf$/i.test(fileUrl);
                                const fileName = fileUrl.split("/").pop() || fileUrl.split("\\").pop() || "attachment";

                                return (
                                  <div key={index} className="mt-2">
                                    {isImage ? (
                                      <a
                                        href={attachmentUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <Image
                                          src={fileUrl}
                                          alt="Attachment"
                                          width={200}
                                          height={200}
                                          className="rounded-lg max-w-[200px] border object-contain"
                                          unoptimized
                                        />
                                      </a>
                                    ) : isPDF ? (
                                      <a
                                        href={attachmentUrl}
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
                                        href={attachmentUrl}
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
                              <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-4 space-y-2 max-w-xs">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-5 h-5 text-blue-500" />
                                  <h4 className="text-sm font-semibold text-gray-900">
                                    {message.content}
                                  </h4>
                                </div>
                                <a
                                  href={`/provider/opportunities/${message.attachments[0]}`}
                                  className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                                >
                                  View Project
                                </a>
                              </div>
                            ) : (
                              <p className="text-sm">{message.content}</p>
                            )}
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? "text-blue-100" : "text-gray-500"
                              }`}
                            >
                              {new Date(message.createdAt).toLocaleTimeString(
                                [],
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
              <div className="border-t p-4 relative">
                <div className="flex items-end space-x-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="sr-only"
                      onChange={handleFileSelect}
                    />
                  </div>

                  <div className="flex-1">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => {
                        console.log("Typed:", e.target.value);
                        setNewMessage(e.target.value);
                      }}
                      className="min-h-[40px] max-h-32 resize-none"
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
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                {showAttachmentPicker && (
                  <div className="absolute bottom-16 left-4 bg-white border rounded-lg p-2 max-h-60 overflow-y-auto shadow-lg z-10 w-64">
                    <div className="p-2 text-sm text-gray-700">
                      This file is associated with a project. Please select a
                      project to continue:
                    </div>
                    {projects.length > 0 ? (
                      projects.map((proj) => (
                        <div
                          key={proj.id}
                          className="p-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => sendAttachmentMessage(proj.id)}
                        >
                          <p className="text-sm font-medium">{proj.title}</p>
                          <p className="text-xs text-gray-500">{proj.status}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">No open projects</p>
                    )}
                    <div className="p-2 border-t">
                      <Button
                        onClick={() => sendAttachmentMessage()}
                        className="w-full"
                      >
                        Send without project
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </ProviderLayout>
  );
}
