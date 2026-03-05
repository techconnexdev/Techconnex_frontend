"use client";

import type React from "react";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getNotificationCategory,
  DISPLAY_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/lib/notification-categories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Home,
  Briefcase,
  Users,
  MessageSquare,
  Settings,
  Bell,
  LogOut,
  User,
  CreditCard,
  Menu,
  X,
  ClipboardList,
  Wallet,
  Star,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getProfileImageUrl, getUnreadMessageCount } from "@/lib/api";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { CustomerCompletionProvider } from "@/contexts/CustomerCompletionContext";
import { CompanyProfileCompletionWidget } from "@/components/customer/CompanyProfileCompletionWidget";
import Image from "next/image";

interface CustomerLayoutProps {
  children: React.ReactNode;
}

type CustomerProfile = {
  id?: string;
  name?: string;
  email?: string;
  data?: {
    name?: string;
    email?: string;
    customerProfile?: {
      profileImageUrl?: string;
    };
  };
  [key: string]: unknown;
};

type Notification = {
  id: string;
  title: string;
  content: string;
  createdAt: string | number | Date;
  isRead?: boolean;
  [key: string]: unknown;
};

/** Grouped notification (project + type); from API when ?grouped=1 */
type GroupedNotification = {
  id: string;
  projectName: string;
  type: string;
  eventType?: string;
  count: number;
  latestAt: string | number | Date;
  notificationIds: string[];
  linkPath: string | null;
  isRead: boolean;
  title: string;
  content: string;
};

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Profile state
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Logout function
  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Clear any other session data
    sessionStorage.clear();

    // Redirect to login page
    router.push("/auth/login");
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!user || !token) {
        router.push("/auth/login");
        return;
      }

      try {
        const parsedUser = JSON.parse(user);
        const userId = parsedUser?.id;
        const roles = Array.isArray(parsedUser?.role) ? parsedUser.role : (parsedUser?.role ? [parsedUser.role] : []);

        // Only customers (company) can access customer/company routes
        if (!roles.includes("CUSTOMER")) {
          if (roles.includes("PROVIDER")) {
            router.push("/provider/dashboard");
          } else if (roles.includes("ADMIN")) {
            router.push("/admin/dashboard");
          } else {
            router.push("/auth/login");
          }
          return;
        }

        if (userId) {
          const API_URL =
            process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
          const endpoint = `${API_URL}/company/profile/`; // ✅ updated endpoint

          fetch(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => {
              if (!res.ok) throw new Error("Failed to fetch profile");
              return res.json();
            })
            .then((data) => setProfile(data as CustomerProfile))
            .catch(() => {
              setProfile(null);
              router.push("/auth/login");
            })
            .finally(() => setProfileLoading(false));
        }
      } catch {
        router.push("/auth/login");
      }
    }
  }, [router]);

  // Notifications state (grouped by project + type)
  const [notifications, setNotifications] = useState<GroupedNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Unread message count state
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) return;
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      const endpoint = `${API_URL}/notifications?grouped=1`;

      fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch notifications");
          return res.json();
        })
        .then((data) =>
          setNotifications((data.data || []) as GroupedNotification[]),
        )
        .catch(() => setNotifications([]))
        .finally(() => setNotificationsLoading(false));
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const notificationsByCategory = useMemo(() => {
    const map: Record<string, GroupedNotification[]> = {};
    for (const cat of DISPLAY_CATEGORIES) map[cat] = [];
    for (const n of notifications) {
      const cat = getNotificationCategory(n.type, n.eventType);
      if (map[cat]) map[cat].push(n);
    }
    return map;
  }, [notifications]);

  // Fetch unread message count
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadMessageCount();
        if (response.success) {
          setUnreadMessageCount(response.count);
        }
      } catch (error) {
        console.error("Failed to fetch unread message count:", error);
        setUnreadMessageCount(0);
      }
    };

    // Fetch immediately
    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, []);

  // Handler when clicking a (grouped) notification: mark as read, then navigate or open modal
  const handleNotificationClick = async (group: GroupedNotification) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

    setNotifications((prev) =>
      prev.map((n) =>
        n.notificationIds.some((id) => group.notificationIds.includes(id))
          ? { ...n, isRead: true }
          : n,
      ),
    );

    try {
      if (group.notificationIds.length > 1) {
        const res = await fetch(`${API_URL}/notifications/read-bulk`, {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ids: group.notificationIds }),
        });
        if (!res.ok) throw new Error("Failed to mark as read");
      } else if (group.notificationIds.length === 1) {
        const res = await fetch(
          `${API_URL}/notifications/${group.notificationIds[0]}/read`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
        if (!res.ok) throw new Error("Failed to mark as read");
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationIds.some((id) => group.notificationIds.includes(id))
            ? { ...n, isRead: group.isRead }
            : n,
        ),
      );
      return;
    }

    if (group.linkPath) {
      router.push(group.linkPath);
      return;
    }
    setSelectedNotification({
      id: group.id,
      title: group.title,
      content: group.content,
      createdAt: group.latestAt,
      isRead: true,
    });
    setModalOpen(true);
  };

  const navigation = [
    { name: "Dashboard", href: "/customer/dashboard", icon: Home },
    { name: "My Projects", href: "/customer/projects", icon: Briefcase },
    { name: "Find Providers", href: "/customer/providers", icon: Users },
    {
      name: "Provider Requests",
      href: "/customer/requests",
      icon: ClipboardList,
    },
    { name: "Messages", href: "/customer/messages", icon: MessageSquare },
    { name: "Reviews", href: "/customer/reviews", icon: Star },
    { name: "Billing", href: "/customer/billing", icon: Wallet },
    { name: "Profile", href: "/customer/profile", icon: User },
    { name: "Settings", href: "/customer/settings", icon: Settings },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <CustomerCompletionProvider>
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${
          sidebarOpen ? "block" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="TechConnex"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-contain"
              />
              <span className="text-xl font-bold text-gray-900">
                Techconnex
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
                {item.name === "Messages" && unreadMessageCount > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div
        className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col"
        data-tour-step="5"
      >
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="TechConnex"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-contain"
              />
              <span className="text-xl font-bold text-gray-900">
                Techconnex
              </span>
            </div>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
                {item.name === "Messages" && unreadMessageCount > 0 && (
                  <Badge className="ml-auto bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5">
                    {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                  </Badge>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              {/* <div className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search projects, providers..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
              </div> */}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <CompanyProfileCompletionWidget />
              <DropdownMenu
                onOpenChange={(open) => !open && setSelectedCategory(null)}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="w-5 h-5" />
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-red-500">
                      {unreadCount}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-80 min-h-[200px] max-h-[420px] p-0"
                  align="end"
                  forceMount
                >
                  <div className="flex flex-col">
                    <div className="px-4 py-3 border-b">
                      <DropdownMenuLabel className="font-medium text-gray-900 p-0">
                        {selectedCategory ? (
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(null)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 -ml-1"
                          >
                            <ChevronLeft className="w-4 h-4" />
                            {CATEGORY_LABELS[selectedCategory as keyof typeof CATEGORY_LABELS]}
                          </button>
                        ) : (
                          "Notifications"
                        )}
                      </DropdownMenuLabel>
                    </div>
                    <div className="overflow-y-auto max-h-[360px]">
                      {notificationsLoading ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                          Loading...
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                          No notifications
                        </div>
                      ) : selectedCategory ? (
                        (notificationsByCategory[selectedCategory] ?? []).map(
                          (n) => (
                            <DropdownMenuItem
                              key={n.id}
                              onClick={() => handleNotificationClick(n)}
                              className={`flex flex-col items-start gap-1 py-3 px-4 rounded-none border-b last:border-b-0 cursor-pointer ${
                                n.isRead ? "opacity-60" : ""
                              }`}
                            >
                              <span className="font-medium text-left">
                                {n.count > 1 ? (
                                  n.type === "proposal" &&
                                  n.eventType === "new_proposal" ? (
                                    <>
                                      You received {n.count} new proposals for
                                      &quot;{n.projectName}&quot;
                                    </>
                                  ) : n.type === "milestone" ? (
                                    <>
                                      {n.count} milestone updates for &quot;
                                      {n.projectName}&quot;
                                    </>
                                  ) : (
                                    <>
                                      {n.title} for &quot;{n.projectName}&quot;
                                      (+{n.count - 1} more)
                                    </>
                                  )
                                ) : (
                                  String(n.title)
                                )}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(n.latestAt).toLocaleString()}
                              </span>
                              {n.count === 1 && (
                                <span className="text-sm text-gray-600 line-clamp-2 text-left">
                                  {String(n.content)}
                                </span>
                              )}
                            </DropdownMenuItem>
                          ),
                        )
                      ) : (
                        <div className="py-2">
                          {DISPLAY_CATEGORIES.filter(
                            (cat) =>
                              (notificationsByCategory[cat]?.length ?? 0) > 0,
                          ).map((category) => {
                            const count =
                              notificationsByCategory[category]?.length ?? 0;
                            const unreadCount =
                              notificationsByCategory[category]?.filter(
                                (n) => !n.isRead,
                              ).length ?? 0;
                            const color =
                              CATEGORY_COLORS[
                                category as keyof typeof CATEGORY_COLORS
                              ];
                            return (
                              <button
                                key={category}
                                type="button"
                                onClick={() => setSelectedCategory(category)}
                                className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-l-4"
                                style={{
                                  borderLeftColor: color,
                                }}
                              >
                                <div
                                  className="w-3 h-3 rounded-full shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="flex-1 font-medium text-gray-900">
                                  {CATEGORY_LABELS[
                                    category as keyof typeof CATEGORY_LABELS
                                  ]}
                                </span>
                                <Badge
                                  variant={unreadCount > 0 ? "default" : "secondary"}
                                  className={
                                    unreadCount > 0
                                      ? "bg-red-500"
                                      : "bg-gray-200 text-gray-700"
                                  }
                                >
                                  {count}
                                </Badge>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getProfileImageUrl(
                          profile?.data?.customerProfile?.profileImageUrl,
                        )}
                        alt={profile?.data?.name || profile?.name || "User"}
                      />
                      <AvatarFallback>
                        {profile && profile.data?.name
                          ? String(profile.data.name)
                              .split(" ")
                              .map((n: string) => n[0])
                              .join("")
                              .toUpperCase()
                          : "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profileLoading
                          ? "Loading..."
                          : profile && profile.data?.name
                            ? profile.data.name
                            : "Unknown User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profileLoading
                          ? "Loading..."
                          : profile && profile.data?.email
                            ? profile.data.email
                            : "-"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => router.push("/customer/profile")}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/customer/billing")}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push("/customer/settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {profileLoading ? (
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading...</p>
              </div>
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      {/* Notification modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg p-6 mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Notification
            </DialogTitle>
            <DialogClose className="absolute right-4 top-4">
              <X className="w-5 h-5" />
            </DialogClose>
          </DialogHeader>
          <DialogDescription className="mt-4 text-sm text-gray-700">
            {selectedNotification ? (
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium">
                    {String(selectedNotification.title)}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {new Date(selectedNotification.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">
                  {String(selectedNotification.content)}
                </p>
              </div>
            ) : (
              "No notification details available."
            )}
          </DialogDescription>
          <DialogFooter className="mt-4">
            <Button
              variant="default"
              onClick={() => setModalOpen(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SupportChatWidget />
    </div>
    </CustomerCompletionProvider>
  );
}
