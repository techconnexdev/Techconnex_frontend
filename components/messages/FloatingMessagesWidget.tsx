"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import io, { type Socket } from "socket.io-client";
import {
  MessageSquare,
  Send,
  ChevronDown,
  Loader2,
  User,
  Users,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileImageUrl } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const MOBILE_BREAKPOINT = 768;
const LAUNCHER_SIZE = 56;
const EDGE_PADDING = 24; // align with support chatbot's right-6 gutter

type Conversation = {
  userId: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageAt: string;
  unreadCount: number;
  online?: boolean;
};

type ChatMessage = {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string; avatar?: string };
};

type FloatingMessagesWidgetProps = {
  fullPageHref: string;
  bottomOffset?: number;
};

export function FloatingMessagesWidget({
  fullPageHref: _fullPageHref,
  bottomOffset = 96,
}: FloatingMessagesWidgetProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  /** Thread fetch only — avoids showing "No messages yet" while GET /messages is in flight */
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [token, setToken] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [launcherPos, setLauncherPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const endRef = useRef<HTMLDivElement>(null);
  const selectedChatRef = useRef<string | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const movedDuringDragRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getDefaultLauncherPos = useCallback(() => {
    if (typeof window === "undefined") return { x: EDGE_PADDING, y: EDGE_PADDING };
    return {
      x: window.innerWidth - EDGE_PADDING - LAUNCHER_SIZE,
      y: window.innerHeight - bottomOffset - LAUNCHER_SIZE,
    };
  }, [bottomOffset]);

  const clampLauncherPos = useCallback((x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const maxX = Math.max(EDGE_PADDING, window.innerWidth - EDGE_PADDING - LAUNCHER_SIZE);
    const maxY = Math.max(EDGE_PADDING, window.innerHeight - EDGE_PADDING - LAUNCHER_SIZE);
    return {
      x: Math.min(Math.max(EDGE_PADDING, x), maxX),
      y: Math.min(Math.max(EDGE_PADDING, y), maxY),
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || isMobile) return;
    const initial = getDefaultLauncherPos();
    setLauncherPos(clampLauncherPos(initial.x, initial.y));
  }, [isMobile, getDefaultLauncherPos, clampLauncherPos]);

  useEffect(() => {
    if (typeof window === "undefined" || isMobile) return;
    const onResize = () => {
      setLauncherPos((prev) => {
        const next = prev || getDefaultLauncherPos();
        return clampLauncherPos(next.x, next.y);
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isMobile, clampLauncherPos, getDefaultLauncherPos]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedToken = localStorage.getItem("token") || "";
    const rawUser = localStorage.getItem("user");
    let uid = "";
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser) as { id?: string };
        uid = parsed.id || "";
      } catch {
        uid = "";
      }
    }
    setToken(savedToken);
    setCurrentUserId(uid);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/messages/conversations`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const data = await res.json();
      if (data?.success) {
        setConversations((data.data || []) as Conversation[]);
      } else {
        setConversations([]);
      }
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
      setConversationsLoaded(true);
    }
  }, [token]);

  const fetchMessages = useCallback(
    async (otherUserId: string) => {
      if (!token || !otherUserId) return;
      try {
        setLoadingMessages(true);
        const res = await fetch(
          `${API_URL}/messages?otherUserId=${otherUserId}&translate=0`,
          {
            cache: "no-store",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        const data = await res.json();
        if (data?.success) {
          const fetched = (data.data || []) as ChatMessage[];
          setMessages(fetched);
          setConversations((prev) =>
            prev.map((c) =>
              c.userId === otherUserId ? { ...c, unreadCount: 0 } : c,
            ),
          );
          const unreadIncoming = fetched.filter(
            (m) => !m.isRead && m.receiverId === currentUserId,
          );
          if (unreadIncoming.length > 0) {
            await Promise.all(
              unreadIncoming.map((m) =>
                fetch(`${API_URL}/messages/${m.id}/read`, {
                  method: "PUT",
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }),
              ),
            );
            unreadIncoming.forEach((m) => {
              socket?.emit("mark_as_read", { messageId: m.id });
            });
          }
        } else {
          setMessages([]);
        }
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, currentUserId, socket],
  );

  useEffect(() => {
    if (!open || !token || isMobile) return;
    fetchConversations();
  }, [open, token, isMobile, fetchConversations]);

  useEffect(() => {
    if (!token || isMobile) return;
    fetchConversations();
  }, [token, isMobile, fetchConversations]);

  useEffect(() => {
    if (!open || !token || isMobile) return;
    const interval = setInterval(fetchConversations, 20000);
    return () => clearInterval(interval);
  }, [open, token, isMobile, fetchConversations]);

  useEffect(() => {
    if (!token || !open || isMobile) return;
    const s = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    s.on("receive_message", (message: ChatMessage) => {
      const otherUserId =
        message.senderId === currentUserId
          ? message.receiverId
          : message.senderId;

      if (selectedChatRef.current === otherUserId) {
        setMessages((prev) =>
          prev.some((m) => m.id === message.id) ? prev : [...prev, message],
        );
      }

      setConversations((prev) => {
        const found = prev.some((c) => c.userId === otherUserId);
        if (!found) {
          return [
            {
              userId: otherUserId,
              name: message.sender?.name || "User",
              avatar: message.sender?.avatar,
              lastMessage: message.content,
              lastMessageAt: message.createdAt,
              unreadCount: selectedChatRef.current === otherUserId ? 0 : 1,
              online: true,
            },
            ...prev,
          ];
        }

        return prev.map((c) =>
          c.userId === otherUserId
            ? {
                ...c,
                lastMessage: message.content,
                lastMessageAt: message.createdAt,
                unreadCount:
                  selectedChatRef.current === otherUserId
                    ? 0
                    : c.unreadCount + 1,
              }
            : c,
        );
      });
    });

    s.on("message_sent", (message: ChatMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id.startsWith("temp-") ? message : m)),
      );
    });

    setSocket(s);
    return () => {
      s.close();
      setSocket(null);
    };
  }, [token, open, isMobile, currentUserId]);

  // Auto-select first conversation when list loads (fetch happens when panel opens — see below)
  useEffect(() => {
    if (selectedChat || conversations.length === 0) return;
    const first = conversations[0];
    selectedChatRef.current = first.userId;
    setSelectedChat(first.userId);
  }, [selectedChat, conversations]);

  // Load thread when the panel opens or the selected user changes (fixes empty history when
  // conversations loaded before the widget was opened).
  useEffect(() => {
    if (!open || !selectedChat || !token) return;
    fetchMessages(selectedChat);
  }, [open, selectedChat, token, fetchMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const unreadCount = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations],
  );
  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => c.name?.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  const selectedConversation = conversations.find(
    (c) => c.userId === selectedChat,
  );
  const launcherConversation = selectedConversation || conversations[0] || null;

  const handleSend = () => {
    if (
      !socket ||
      !selectedChat ||
      !newMessage.trim() ||
      !currentUserId ||
      sending
    )
      return;

    const content = newMessage.trim();
    setSending(true);
    const optimisticId = `temp-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: optimisticId,
        content,
        senderId: currentUserId,
        receiverId: selectedChat,
        isRead: false,
        createdAt: new Date().toISOString(),
        sender: { id: currentUserId, name: "You" },
      },
    ]);
    setNewMessage("");

    socket.emit(
      "send_message",
      {
        senderId: currentUserId,
        receiverId: selectedChat,
        content,
        messageType: "text",
        attachments: [],
      },
      (response: { success?: boolean; error?: string }) => {
        if (!response?.success) {
          setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
          console.error(
            getUserFriendlyErrorMessage(
              response?.error ? new Error(response.error) : undefined,
              "floating messages send",
            ),
          );
        }
        setSending(false);
      },
    );
  };

  const handleLauncherPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (isMobile || e.button !== 0) return;
    e.preventDefault();
    dragPointerIdRef.current = e.pointerId;
    movedDuringDragRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    const current = launcherPos || getDefaultLauncherPos();
    dragOffsetRef.current = {
      x: e.clientX - current.x,
      y: e.clientY - current.y,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // no-op: pointer capture may fail in rare browser states
    }
  };

  const clearLauncherDragState = () => {
    dragPointerIdRef.current = null;
    dragOffsetRef.current = null;
    dragStartRef.current = null;
  };

  const handleLauncherPointerMove = (
    e: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (dragPointerIdRef.current !== e.pointerId || !dragOffsetRef.current) return;
    const next = clampLauncherPos(
      e.clientX - dragOffsetRef.current.x,
      e.clientY - dragOffsetRef.current.y,
    );
    setLauncherPos(next);

    if (!movedDuringDragRef.current && dragStartRef.current) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);
      if (dx > 3 || dy > 3) {
        movedDuringDragRef.current = true;
      }
    }
  };

  const handleLauncherPointerUp = (
    e: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (dragPointerIdRef.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    clearLauncherDragState();
  };

  const handleLauncherPointerCancel = (
    e: React.PointerEvent<HTMLButtonElement>,
  ) => {
    if (dragPointerIdRef.current !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    clearLauncherDragState();
  };

  const handleLauncherClick = () => {
    if (movedDuringDragRef.current) {
      movedDuringDragRef.current = false;
      return;
    }
    setOpen((v) => !v);
  };

  if (isMobile || !token || !conversationsLoaded) return null;

  const currentLauncherPos = launcherPos || getDefaultLauncherPos();
  const panelWidth = expanded ? 720 : 420;
  const panelHeight = 600;
  const viewportWidth = typeof window !== "undefined" ? window.innerWidth : 1280;
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const panelLeft = Math.min(
    Math.max(EDGE_PADDING, currentLauncherPos.x + LAUNCHER_SIZE - panelWidth),
    Math.max(EDGE_PADDING, viewportWidth - panelWidth - EDGE_PADDING),
  );
  const panelTop = Math.min(
    Math.max(EDGE_PADDING, currentLauncherPos.y - panelHeight - 12),
    Math.max(EDGE_PADDING, viewportHeight - panelHeight - EDGE_PADDING),
  );

  return (
    <>
      <button
        type="button"
        onPointerDown={handleLauncherPointerDown}
        onPointerMove={handleLauncherPointerMove}
        onPointerUp={handleLauncherPointerUp}
        onPointerCancel={handleLauncherPointerCancel}
        onClick={handleLauncherClick}
        className="fixed z-[9998] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all hover:scale-105 hover:bg-blue-500 overflow-hidden"
        style={{
          left: `${currentLauncherPos.x}px`,
          top: `${currentLauncherPos.y}px`,
          touchAction: "none",
        }}
        aria-label="Open messages"
      >
        {launcherConversation ? (
          <Avatar className="h-14 w-14 rounded-full">
            <AvatarImage
              src={getProfileImageUrl(launcherConversation.avatar)}
              alt={launcherConversation.name}
            />
            <AvatarFallback className="bg-blue-700 text-white">
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        ) : (
          <Avatar className="h-14 w-14 rounded-full">
            <AvatarFallback className="bg-blue-700 text-white">
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 rounded-full bg-red-500 px-1 text-[10px] font-semibold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div
        className="fixed z-[9999] flex flex-col rounded-2xl border bg-white shadow-2xl transition-[opacity,transform] duration-200"
        style={{
          left: `${panelLeft}px`,
          top: `${panelTop}px`,
          width: panelWidth,
          height: panelHeight,
          transform: open
            ? "translateY(0) scale(1)"
            : "translateY(12px) scale(0.98)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          visibility: open ? "visible" : "hidden",
        }}
      >
        <div className="flex items-center justify-between border-b px-4 py-3 bg-[#1877F2] text-white rounded-t-2xl">
          <div className="text-sm font-semibold tracking-wide">
            {selectedConversation ? selectedConversation.name : "Messenger"}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-blue-500"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? "Collapse users list" : "Open users list"}
              title={expanded ? "Collapse users list" : "Open users list"}
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-blue-500"
              onClick={() => setOpen(false)}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1">
          {expanded && (
            <div className="w-[42%] border-r overflow-y-auto bg-white">
              <div className="p-3 border-b bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search conversations"
                    className="h-9 pl-8 bg-white"
                  />
                </div>
              </div>
              {loading && conversations.length === 0 ? (
                <div className="p-4 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-3 text-xs text-gray-500">No conversations yet</div>
              ) : (
                filteredConversations.map((c) => (
                  <button
                    key={c.userId}
                    type="button"
                    onClick={() => {
                      selectedChatRef.current = c.userId;
                      setSelectedChat(c.userId);
                    }}
                    className={`w-full text-left px-3 py-2.5 border-b hover:bg-gray-50 transition-colors ${
                      selectedChat === c.userId ? "bg-blue-50" : "bg-white"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="relative">
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={getProfileImageUrl(c.avatar)} />
                          <AvatarFallback>
                            <User className="h-4 w-4 text-gray-500" />
                          </AvatarFallback>
                        </Avatar>
                        {c.online && (
                          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border border-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">{c.name}</p>
                          <span className="text-[10px] text-gray-400 shrink-0">
                            {new Date(c.lastMessageAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {c.lastMessage || "No messages"}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b px-3 py-2.5 text-xs font-medium bg-gray-50 flex items-center gap-2">
              {selectedConversation ? (
                <>
                  <Avatar className="h-7 w-7">
                    <AvatarImage
                      src={getProfileImageUrl(selectedConversation.avatar)}
                    />
                    <AvatarFallback>
                      <User className="h-4 w-4 text-gray-500" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {selectedConversation.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {selectedConversation.online ? "Active now" : "Offline"}
                    </p>
                  </div>
                </>
              ) : (
                "Select a chat"
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-[#F0F2F5]">
              {loading && conversations.length === 0 ? (
                <div className="p-4 flex justify-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : selectedConversation ? (
                loadingMessages ? (
                  <div className="p-4 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-gray-500">No messages yet</p>
                ) : (
                  messages.map((m) => {
                    const own = m.senderId === currentUserId;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${own ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs shadow-sm ${
                            own
                              ? "bg-[#1877F2] text-white rounded-br-md"
                              : "bg-white text-gray-900 rounded-bl-md"
                          }`}
                        >
                          {m.content}
                          <div
                            className={`mt-1 text-[10px] ${
                              own ? "text-blue-100" : "text-gray-400"
                            }`}
                          >
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )
              ) : (
                <p className="text-xs text-gray-500">No active conversation</p>
              )}
              <div ref={endRef} />
            </div>
            {selectedConversation && (
              <div className="border-t p-2 flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Aa"
                  className="h-9 text-sm bg-gray-100 border-0 focus-visible:ring-1 focus-visible:ring-[#1877F2]"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleSend}
                  disabled={!newMessage.trim() || sending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
