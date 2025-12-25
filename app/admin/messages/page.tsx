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
import { AdminLayout } from "@/components/admin-layout";
import Link from "next/link";
import Image from "next/image";

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
  const [pendingAttachmentUrl, setPendingAttachmentUrl] = useState<string | null>(null);

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
      alert(`Failed to send message: ${error.error}`);
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

    newSocket.on("message_read", (data: { messageId: string; readAt: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, isRead: true, readAt: data.readAt }
            : msg
        )
      );
    });

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
  }, [token, currentUserId]);

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
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch messages for a specific conversation
  const fetchMessages = useCallback(async (otherUserId: string, skipLoadingCheck = false) => {
    if (!token || !otherUserId) return;
    if (loading && !skipLoadingCheck) return;

    try {
      if (!skipLoadingCheck) setLoading(true);
      
      // Always fetch conversation messages with the other user
      const url = `${API_URL}/messages?otherUserId=${otherUserId}`;

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
          filteredMessages = data.data.filter((msg: Record<string, unknown>) => 
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
    } finally {
      if (!skipLoadingCheck) setLoading(false);
    }
  }, [token, projectIdParam, loading]);

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
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token || !socket || !selectedChat) return;

    const formData = new FormData();
    formData.append("file", file);

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

    setPendingAttachmentUrl(data.fileUrl);
    setShowAttachmentPicker(true);
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

      socket.emit("send_message", messageData, (response: { success?: boolean; error?: string }) => {
        if (response?.success) {
          console.log("✅ Message sent successfully via socket");
        } else {
          console.error("❌ Failed to send message via socket:", response?.error);
          setMessages((prev) =>
            prev.filter((msg) => msg.id !== optimisticMessage.id)
          );
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

        unreadMessages.forEach((msg) => {
          socket.emit("mark_as_read", { messageId: msg.id });
        });
      }
    }
  }, [messages, selectedChat, currentUserId, socket, token, markMessagesAsRead]);

  const selectedConversation = conversations.find(
    (c) => c.userId === selectedChat
  );

  if (!token || !user) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Please log in to view messages</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-12rem)] flex gap-6">
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
                <div className="divide-y max-h-[calc(100vh-20rem)] overflow-y-auto">
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
                              src={
                                conversation.avatar
                                  ? `${
                                      process.env.NEXT_PUBLIC_API_BASE_URL ||
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
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 truncate">
                                {conversation.name}
                              </p>
                              {conversation.role && (
                                <Badge variant="outline" className="text-xs">
                                  {conversation.role}
                                </Badge>
                              )}
                            </div>
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
                            src={
                              selectedConversation.avatar
                                ? `${
                                    process.env.NEXT_PUBLIC_API_BASE_URL ||
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
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div>
                        <Link
                          href={`/admin/users/${selectedConversation.userId}`}
                          className="font-semibold text-lg hover:underline"
                        >
                          {selectedConversation.name}
                        </Link>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">
                            {selectedConversation.online
                              ? "Online"
                              : "Last seen recently"}
                          </p>
                          {selectedConversation.role && (
                            <Badge variant="outline" className="text-xs">
                              {selectedConversation.role}
                            </Badge>
                          )}
                        </div>
                      </div>
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
                                          alt="Attachment"
                                          width={200}
                                          height={200}
                                          className="rounded-lg max-w-[200px] border"
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
                              <div className="flex flex-col bg-gray-50 border border-gray-200 rounded-lg shadow-sm p-4 space-y-2 max-w-xs">
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
                                    View Project
                                  </a>
                                )}
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
                      onChange={(e) => setNewMessage(e.target.value)}
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
                  <div className="absolute bottom-16 left-4 bg-white border rounded-lg p-2 shadow-lg z-10 w-64">
                    <div className="p-2 text-sm text-gray-700">
                      File uploaded. Send now?
                    </div>
                    <div className="p-2 border-t">
                      <Button
                        onClick={() => sendAttachmentMessage()}
                        className="w-full"
                      >
                        Send File
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

