"use client";

import type React from "react";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  CATEGORY_COLORS,
  type NotificationCategory,
} from "@/lib/notification-categories";
import { NOTIFICATION_CATEGORY_I18N_KEYS } from "@/lib/app-layout-notification-categories";
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
import { PrefetchNavLink } from "@/components/PrefetchNavLink";
import { usePathname, useRouter } from "next/navigation";
import { getProfileImageUrl, getUnreadMessageCount } from "@/lib/api";
import BetaBanner from "@/components/BetaBanner";
import { SupportChatWidget } from "@/components/support/SupportChatWidget";
import { FloatingMessagesWidget } from "@/components/messages/FloatingMessagesWidget";
import { CustomerCompletionProvider } from "@/contexts/CustomerCompletionContext";
import { CompanyProfileCompletionWidget } from "@/components/customer/CompanyProfileCompletionWidget";
import { UserLocaleSync } from "@/components/UserLocaleSync";
import Image from "next/image";
import { queryKeys } from "@/lib/query-keys";
import { fetchCustomerLayoutProfile } from "@/lib/queries/customer-layout-profile";
import { useI18n } from "@/contexts/I18nProvider";
import type { LucideIcon } from "lucide-react";
import {
  formatNotificationTimestamp,
  getLocalizedNotificationText,
  notificationIntlLocale,
} from "@/lib/notifications/notification-display-i18n";

interface CustomerLayoutProps {
  children: React.ReactNode;
}

type Notification = {
  id: string;
  title: string;
  content: string;
  createdAt: string | number | Date;
  isRead?: boolean;
  type?: string;
  metadata?: unknown;
  eventType?: string;
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

type CustomerNavItem = {
  id: string;
  href: string;
  icon: LucideIcon;
  label: string;
};

export function CustomerLayout({ children }: CustomerLayoutProps) {
  const { t, locale } = useI18n();
  const intlLocale = notificationIntlLocale(locale);
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const [authReady, setAuthReady] = useState(false);

  const {
    data: profile,
    isPending: profileQueryPending,
    isError: profileQueryError,
  } = useQuery({
    queryKey: queryKeys.customer.profile,
    queryFn: fetchCustomerLayoutProfile,
    enabled: authReady,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const profileLoading = !authReady || profileQueryPending;

  // Logout function
  const handleLogout = () => {
    queryClient.removeQueries({ queryKey: queryKeys.customer.profile });
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.clear();
    router.push("/auth/login");
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!user || !token) {
      routerRef.current.push("/auth/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(user) as {
        id?: string;
        role?: string | string[];
      };
      const userId = parsedUser?.id;
      const roles = Array.isArray(parsedUser?.role)
        ? parsedUser.role
        : parsedUser?.role
          ? [parsedUser.role]
          : [];

      if (!roles.includes("CUSTOMER")) {
        if (roles.includes("PROVIDER")) {
          routerRef.current.push("/provider/dashboard");
        } else if (roles.includes("ADMIN")) {
          routerRef.current.push("/admin/dashboard");
        } else {
          routerRef.current.push("/auth/login");
        }
        return;
      }

      if (!userId) {
        routerRef.current.push("/auth/login");
        return;
      }

      setAuthReady(true);
    } catch {
      routerRef.current.push("/auth/login");
    }
  }, []);

  useEffect(() => {
    if (profileQueryError) {
      routerRef.current.push("/auth/login");
    }
  }, [profileQueryError]);

  // Notifications state (grouped by project + type)
  const [notifications, setNotifications] = useState<GroupedNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
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

  const unreadNotificationIds = useMemo(() => {
    return Array.from(
      new Set(
        notifications
          .filter((n) => !n.isRead)
          .flatMap((n) => n.notificationIds ?? []),
      ),
    );
  }, [notifications]);

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
      type: group.type,
      eventType: group.eventType,
    });
    setModalOpen(true);
  };

  const handleMarkAllAsRead = async () => {
    if (markingAllRead || unreadNotificationIds.length === 0) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const previousNotifications = notifications;

    setMarkingAllRead(true);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));

    try {
      const res = await fetch(`${API_URL}/notifications/read-bulk`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ids: unreadNotificationIds }),
      });

      if (!res.ok) throw new Error("Failed to mark all notifications as read");
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
      setNotifications(previousNotifications);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const navigation = useMemo((): CustomerNavItem[] => {
    return [
      {
        id: "dashboard",
        href: "/customer/dashboard",
        icon: Home,
        label: t("app.layout.nav.dashboard"),
      },
      {
        id: "projects",
        href: "/customer/projects",
        icon: Briefcase,
        label: t("app.layout.nav.myProjects"),
      },
      {
        id: "providers",
        href: "/customer/providers",
        icon: Users,
        label: t("customer.layout.nav.findProviders"),
      },
      {
        id: "requests",
        href: "/customer/requests",
        icon: ClipboardList,
        label: t("customer.layout.nav.providerRequests"),
      },
      {
        id: "messages",
        href: "/customer/messages",
        icon: MessageSquare,
        label: t("app.layout.nav.messages"),
      },
      {
        id: "reviews",
        href: "/customer/reviews",
        icon: Star,
        label: t("app.layout.nav.reviews"),
      },
      {
        id: "billing",
        href: "/customer/billing",
        icon: Wallet,
        label: t("customer.layout.nav.billing"),
      },
      {
        id: "profile",
        href: "/customer/profile",
        icon: User,
        label: t("app.layout.nav.profile"),
      },
      {
        id: "settings",
        href: "/customer/settings",
        icon: Settings,
        label: t("app.layout.nav.settings"),
      },
    ];
  }, [t]);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <CustomerCompletionProvider>
      <UserLocaleSync />
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
                  alt={t("app.layout.brandAlt")}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-xl object-contain"
                />
                <span className="text-xl font-bold text-gray-900">
                  {t("app.layout.brandTitle")}
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
                <PrefetchNavLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                  {item.id === "messages" && unreadMessageCount > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </Badge>
                  )}
                </PrefetchNavLink>
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
                  alt={t("app.layout.brandAlt")}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded-xl object-contain"
                />
                <span className="text-xl font-bold text-gray-900">
                  {t("app.layout.brandTitle")}
                </span>
              </div>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navigation.map((item) => (
                <PrefetchNavLink
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors relative ${
                    isActive(item.href)
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.label}
                  {item.id === "messages" && unreadMessageCount > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                    </Badge>
                  )}
                </PrefetchNavLink>
              ))}
            </nav>
          </div>
        </div>

        {/* Main content */}
        <div className="lg:pl-64">
          <BetaBanner />
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
                      <div className="px-4 py-3 border-b flex items-center justify-between gap-2">
                        <DropdownMenuLabel className="font-medium text-gray-900 p-0">
                          {selectedCategory ? (
                            <button
                              type="button"
                              onClick={() => setSelectedCategory(null)}
                              className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 -ml-1"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              {t(
                                NOTIFICATION_CATEGORY_I18N_KEYS[
                                  selectedCategory as NotificationCategory
                                ],
                              )}
                            </button>
                          ) : (
                            t("app.layout.notifications.title")
                          )}
                        </DropdownMenuLabel>
                        {!selectedCategory && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={handleMarkAllAsRead}
                            disabled={
                              markingAllRead ||
                              notificationsLoading ||
                              unreadNotificationIds.length === 0
                            }
                          >
                            {markingAllRead
                              ? t("app.layout.notifications.marking")
                              : t("app.layout.notifications.markAllRead")}
                          </Button>
                        )}
                      </div>
                      <div className="overflow-y-auto max-h-[360px]">
                        {notificationsLoading ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {t("app.layout.notifications.loading")}
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                            {t("app.layout.notifications.empty")}
                          </div>
                        ) : selectedCategory ? (
                          (notificationsByCategory[selectedCategory] ?? []).map(
                            (n) => {
                              const locSingle =
                                n.count === 1
                                  ? getLocalizedNotificationText(
                                      {
                                        title: n.title,
                                        content: n.content,
                                        type: n.type,
                                        eventType: n.eventType,
                                      },
                                      t,
                                    )
                                  : null;
                              const groupedTitleLoc =
                                n.count > 1 &&
                                !(
                                  n.type === "proposal" &&
                                  n.eventType === "new_proposal"
                                ) &&
                                n.type !== "milestone"
                                  ? getLocalizedNotificationText(
                                      {
                                        title: n.title,
                                        content: n.content,
                                        type: n.type,
                                        eventType: n.eventType,
                                      },
                                      t,
                                    )
                                  : null;
                              return (
                              <DropdownMenuItem
                                key={n.id}
                                onClick={() => handleNotificationClick(n)}
                                className={`flex flex-col items-start gap-1 py-3 px-4 rounded-none border-b last:border-b-0 cursor-pointer ${
                                  n.isRead ? "opacity-60" : ""
                                }`}
                              >
                                <span className="font-medium text-left">
                                  {n.count > 1
                                    ? n.type === "proposal" &&
                                      n.eventType === "new_proposal"
                                      ? t(
                                          "app.layout.notifications.groupProposals",
                                          {
                                            count: n.count,
                                            project: n.projectName,
                                          },
                                        )
                                      : n.type === "milestone"
                                        ? t(
                                            "app.layout.notifications.groupMilestones",
                                            {
                                              count: n.count,
                                              project: n.projectName,
                                            },
                                          )
                                        : t(
                                            "app.layout.notifications.groupFallback",
                                            {
                                              title:
                                                groupedTitleLoc?.title ??
                                                String(n.title),
                                              project: n.projectName,
                                              more: n.count - 1,
                                            },
                                          )
                                    : (locSingle?.title ?? String(n.title))}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatNotificationTimestamp(
                                    n.latestAt,
                                    intlLocale,
                                  )}
                                </span>
                                {n.count === 1 && (
                                  <span className="text-sm text-gray-600 line-clamp-2 text-left">
                                    {locSingle?.content ?? String(n.content)}
                                  </span>
                                )}
                              </DropdownMenuItem>
                            );
                            },
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
                                    {t(
                                      NOTIFICATION_CATEGORY_I18N_KEYS[category],
                                    )}
                                  </span>
                                  <Badge
                                    variant={
                                      unreadCount > 0 ? "default" : "secondary"
                                    }
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
                          src={
                            profileLoading
                              ? undefined
                              : getProfileImageUrl(
                                  profile?.data?.customerProfile
                                    ?.profileImageUrl,
                                )
                          }
                          alt={
                            profile?.data?.name ||
                            profile?.name ||
                            t("app.layout.userMenu.avatarAlt")
                          }
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
                            ? t("app.layout.notifications.loading")
                            : profile && profile.data?.name
                              ? profile.data.name
                              : t("app.layout.userMenu.unknownUser")}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {profileLoading
                            ? t("app.layout.notifications.loading")
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
                      <span>{t("app.layout.userMenu.profile")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/customer/billing")}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>{t("app.layout.userMenu.billing")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/customer/settings")}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{t("app.layout.userMenu.settings")}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t("app.layout.userMenu.logOut")}</span>
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
                  <p className="text-gray-600">{t("app.layout.mainLoading")}</p>
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>

        {/* Notification modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="mx-auto max-w-xl overflow-hidden p-0">
            <DialogHeader className="border-b bg-gradient-to-r from-blue-50 via-white to-indigo-50 p-6">
              <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Bell className="h-4 w-4" />
                </span>
                {t("app.layout.notificationModal.title")}
              </DialogTitle>
              <DialogClose className="absolute right-4 top-4 rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900">
                <X className="h-5 w-5" />
              </DialogClose>
            </DialogHeader>
            <DialogDescription asChild>
              <div className="p-6">
                {selectedNotification ? (
                  <div className="space-y-4">
                    <div className="rounded-lg border bg-slate-50/70 p-4">
                      <div className="mb-2 flex items-start justify-between gap-4">
                        <h3 className="text-base font-semibold text-slate-900">
                          {
                            getLocalizedNotificationText(
                              {
                                title: String(selectedNotification.title),
                                content: String(selectedNotification.content),
                                type:
                                  typeof selectedNotification.type === "string"
                                    ? selectedNotification.type
                                    : undefined,
                                metadata: selectedNotification.metadata,
                                eventType:
                                  typeof selectedNotification.eventType ===
                                  "string"
                                    ? selectedNotification.eventType
                                    : undefined,
                              },
                              t,
                            ).title
                          }
                        </h3>
                        <span className="shrink-0 text-xs text-slate-500">
                          {formatNotificationTimestamp(
                            selectedNotification.createdAt,
                            intlLocale,
                          )}
                        </span>
                      </div>
                      <p className="text-sm leading-6 text-slate-700">
                        {
                          getLocalizedNotificationText(
                            {
                              title: String(selectedNotification.title),
                              content: String(selectedNotification.content),
                              type:
                                typeof selectedNotification.type === "string"
                                  ? selectedNotification.type
                                  : undefined,
                              metadata: selectedNotification.metadata,
                              eventType:
                                typeof selectedNotification.eventType ===
                                "string"
                                  ? selectedNotification.eventType
                                  : undefined,
                            },
                            t,
                          ).content
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed bg-slate-50 p-4 text-sm text-slate-600">
                    {t("app.layout.notificationModal.empty")}
                  </div>
                )}
              </div>
            </DialogDescription>
            <DialogFooter className="border-t bg-slate-50 px-6 py-4">
              <Button
                variant="default"
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto"
              >
                {t("app.layout.notificationModal.close")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <SupportChatWidget />
        {!profileLoading && !pathname.startsWith("/customer/messages") && (
          <FloatingMessagesWidget fullPageHref="/customer/messages" />
        )}
      </div>
    </CustomerCompletionProvider>
  );
}
