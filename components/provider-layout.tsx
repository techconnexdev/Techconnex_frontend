"use client";

import type React from "react";

import { useEffect, useState, useRef } from "react";
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
  Zap,
  Home,
  Briefcase,
  Target,
  MessageSquare,
  Settings,
  Bell,
  DollarSign,
  LogOut,
  User,
  BarChart3,
  Menu,
  X,
  Building2,
  Star,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  getProfileImageUrl,
  getAdminUsersForSupport,
  getUnreadMessageCount,
} from "@/lib/api";

interface ProviderLayoutProps {
  children: React.ReactNode;
}

type ProviderProfile = {
  id?: string;
  name?: string;
  email?: string;
  resume?: {
    fileUrl?: string;
  };
  data?: {
    user?: {
      name?: string;
      email?: string;
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

type AdminUser = {
  id: string;
  name: string;
  email: string;
  customerProfile?: {
    profileImageUrl?: string;
  };
};

export function ProviderLayout({ children }: ProviderLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const routerRef = useRef(router);

  // Update ref when router changes
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Profile state
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  // Support dialog state
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminUsersLoading, setAdminUsersLoading] = useState(false);

  // Unread message count state
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

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

  // Handler to mark a notification as read
  const handleNotificationClick = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const notif = notifications.find((n) => n.id === id);

    // Optimistically update UI
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );

    // Mark as read in database
    try {
      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Revert optimistic update on error
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, isRead: notif?.isRead || false } : n
          )
        );
        console.error("Failed to mark notification as read");
        return;
      }

      // Refresh notifications to ensure sync with database
      const refreshResponse = await fetch(`${API_URL}/notifications/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        if (refreshData.success) {
          setNotifications((refreshData.data || []) as Notification[]);
        }
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error);
      // Revert optimistic update on error
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, isRead: notif?.isRead || false } : n
        )
      );
    }

    if (notif) {
      setSelectedNotification({ ...notif, isRead: true });
      setModalOpen(true);
    }
  };

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      if (typeof window === "undefined") return;

      console.log("🔐 Checking authentication...");
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      console.log(
        "📦 User data from localStorage:",
        user ? "exists" : "missing"
      );
      console.log("🔑 Token from localStorage:", token ? "exists" : "missing");

      if (!user || !token) {
        console.log("❌ No user or token found, redirecting to login");
        // User is not authenticated, redirect to login
        routerRef.current.push("/auth/login");
        return;
      }

      // Try to get user id from localStorage
      let userId = null;
      try {
        const userData = JSON.parse(user);
        userId = userData?.id;
        console.log("👤 User ID extracted:", userId);
      } catch (e) {
        console.error("❌ Error parsing user data:", e);
        routerRef.current.push("/auth/login");
        return;
      }

      if (!userId) {
        console.log("❌ No user ID found, redirecting to login");
        routerRef.current.push("/auth/login");
        return;
      }
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
      // Fetch user profile
      try {
        const endpoint = `${API_URL}/provider/profile/`; // ✅ updated endpoint
        console.log("🌐 Fetching profile from:", endpoint);

        const res = await fetch(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          throw new Error("Failed to fetch profile");
        }

        const data = await res.json();
        console.log("✅ Profile fetched successfully:", data.name);
        setProfile(data as ProviderProfile);
      } catch (error) {
        console.error("❌ Error fetching profile:", error);
        // Don't redirect immediately on fetch error, just set profile to null
        setProfile(null);
      } finally {
        setProfileLoading(false);
        setAuthChecked(true);
        console.log("✅ Authentication check completed");
      }
    };

    checkAuth();
  }, []); // Remove router dependency to prevent infinite re-renders

  // Fetch notifications for provider header
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    if (!token) return;
    const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
    const endpoint = `${API_URL}/notifications/`;

    fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch notifications");
        return res.json();
      })
      .then((data) => setNotifications((data.data || []) as Notification[]))
      .catch(() => setNotifications([]))
      .finally(() => setNotificationsLoading(false));
  }, []);

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

  // Fetch admin users when support dialog opens
  useEffect(() => {
    if (supportDialogOpen && adminUsers.length === 0) {
      const fetchAdminUsers = async () => {
        setAdminUsersLoading(true);
        try {
          const response = await getAdminUsersForSupport();
          if (response.success && response.data) {
            setAdminUsers(response.data as AdminUser[]);
          }
        } catch (error) {
          console.error("Failed to fetch admin users:", error);
        } finally {
          setAdminUsersLoading(false);
        }
      };
      fetchAdminUsers();
    }
  }, [supportDialogOpen, adminUsers.length]);

  // Handle admin selection and navigate to messages
  const handleAdminSelect = (admin: AdminUser) => {
    const adminName = admin.name || "Admin";
    const adminAvatar = admin.customerProfile?.profileImageUrl || "";
    router.push(
      `/provider/messages?userId=${admin.id}&name=${encodeURIComponent(
        adminName
      )}&avatar=${encodeURIComponent(adminAvatar)}`
    );
    setSupportDialogOpen(false);
  };

  // Show loading spinner while checking authentication
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const navigation = [
    { name: "Dashboard", href: "/provider/dashboard", icon: Home },
    { name: "My Projects", href: "/provider/projects", icon: Briefcase },
    { name: "Opportunities", href: "/provider/opportunities", icon: Target },
    { name: "Find Companies", href: "/provider/companies", icon: Building2 },
    { name: "Messages", href: "/provider/messages", icon: MessageSquare },
    { name: "Reviews", href: "/provider/reviews", icon: Star },
    { name: "Earnings", href: "/provider/earnings", icon: DollarSign },
    { name: "Profile", href: "/provider/profile", icon: User },
    { name: "Settings", href: "/provider/settings", icon: Settings },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
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
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                TechConnect
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
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center h-16 px-4 border-b">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                TechConnect
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
          <div className="p-4 border-t">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
              <h3 className="text-sm font-medium mb-1">Need Help?</h3>
              <p className="text-xs opacity-90 mb-3">
                Contact our support team for assistance
              </p>
              <Button
                size="sm"
                variant="secondary"
                className="w-full"
                onClick={() => setSupportDialogOpen(true)}
              >
                Get Support
              </Button>
            </div>
          </div>
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
                    placeholder="Search opportunities, projects..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
                  />
                </div>
              </div> */}
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="w-5 h-5" />
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-red-500">
                      {notifications.filter((n) => !n.isRead).length}
                    </Badge>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-80 max-h-[800px] overflow-y-auto"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-medium text-gray-900">
                    Notifications
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {notificationsLoading ? (
                    <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
                  ) : notifications.length > 0 ? (
                    notifications.map((n) => (
                      <DropdownMenuItem
                        key={n.id}
                        onClick={() => handleNotificationClick(n.id)}
                        className={n.isRead ? "opacity-50" : ""}
                      >
                        <div className="flex flex-col space-y-1">
                          <span className="font-medium">{String(n.title)}</span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(n.createdAt).toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-600">
                            {String(n.content)}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <DropdownMenuItem disabled>
                      No notifications
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-8 w-8 rounded-full"
                  >
                    <Avatar className="h-8 w-8">
                      {profile && profile.resume && profile.resume.fileUrl ? (
                        <AvatarImage
                          src={`/${String(profile.resume.fileUrl).replace(
                            /\\/g,
                            "/"
                          )}`}
                          alt={profile.data?.user?.name || "User"}
                        />
                      ) : (
                        <AvatarImage
                          src="/placeholder.svg?height=32&width=32"
                          alt="User"
                        />
                      )}
                      <AvatarFallback>
                        {profile && profile.data?.user?.name
                          ? String(profile.data.user.name)
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
                          : profile && profile.data?.user?.name
                          ? profile.data.user.name
                          : "Unknown User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profileLoading
                          ? "Loading..."
                          : profile && profile.data?.user?.email
                          ? profile.data.user.email
                          : "-"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    <span>Analytics</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
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
              <div className="flex flex-col space-y-4">
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
                {/* Payment transfer proof button */}
                {(() => {
                  if (
                    !selectedNotification.type ||
                    typeof selectedNotification.type !== "string" ||
                    !selectedNotification.type.includes("PAYMENT") ||
                    !selectedNotification.metadata ||
                    typeof selectedNotification.metadata !== "object"
                  ) {
                    return null;
                  }

                  const metadata = selectedNotification.metadata as {
                    reference?: string;
                    transferProofUrl?: string;
                    photoUrl?: string;
                    bankTransferRef?: string;
                    paymentId?: string;
                  };
                  const photoUrl =
                    metadata.reference ||
                    metadata.transferProofUrl ||
                    metadata.photoUrl ||
                    metadata.bankTransferRef;

                  // Show button if there's a photo URL (even if it's a text reference that looks like a URL) or payment ID
                  if (photoUrl || metadata.paymentId) {
                    // Check if reference looks like a URL (contains http, https, or is a file path)
                    const isUrlOrPath =
                      photoUrl &&
                      (photoUrl.startsWith("http://") ||
                        photoUrl.startsWith("https://") ||
                        photoUrl.includes("/") ||
                        photoUrl.includes("\\"));

                    return (
                      <div className="mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            if (photoUrl) {
                              // Check if it's a full URL
                              if (
                                photoUrl.startsWith("http://") ||
                                photoUrl.startsWith("https://")
                              ) {
                                window.open(photoUrl, "_blank");
                              } else if (
                                photoUrl.includes("/") ||
                                photoUrl.includes("\\")
                              ) {
                                // It's likely an R2 key or path, construct the URL
                                const API_URL =
                                  process.env.NEXT_PUBLIC_API_URL ||
                                  process.env.NEXT_PUBLIC_API_URL ||
                                  "http://localhost:4000";
                                const cleanPath = photoUrl.startsWith("/")
                                  ? photoUrl
                                  : `/${photoUrl}`;
                                window.open(`${API_URL}${cleanPath}`, "_blank");
                              } else {
                                // It's likely an R2 key, construct the URL
                                const API_URL =
                                  process.env.NEXT_PUBLIC_API_URL ||
                                  process.env.NEXT_PUBLIC_API_URL ||
                                  "http://localhost:4000";
                                window.open(
                                  `${API_URL}/uploads/${photoUrl}`,
                                  "_blank"
                                );
                              }
                            } else if (metadata.paymentId) {
                              // Navigate to payment details if paymentId is available
                              router.push(`/provider/earnings`);
                            }
                          }}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          {photoUrl && isUrlOrPath
                            ? "View Payment Receipt"
                            : metadata.paymentId
                            ? "View Payment Details"
                            : "View Payment"}
                        </Button>
                      </div>
                    );
                  }
                  return null;
                })()}
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

      {/* Support Dialog - Select Admin */}
      <Dialog open={supportDialogOpen} onOpenChange={setSupportDialogOpen}>
        <DialogContent className="max-w-md p-6 mx-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Contact Support
            </DialogTitle>
            <DialogDescription className="mt-2">
              Select an admin to contact for support
            </DialogDescription>
            <DialogClose className="absolute right-4 top-4">
              <X className="w-5 h-5" />
            </DialogClose>
          </DialogHeader>
          <div className="mt-4 max-h-[400px] overflow-y-auto">
            {adminUsersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading admins...</p>
                </div>
              </div>
            ) : adminUsers.length > 0 ? (
              <div className="space-y-2">
                {adminUsers.map((admin) => (
                  <button
                    key={admin.id}
                    onClick={() => handleAdminSelect(admin)}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors text-left"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={getProfileImageUrl(
                          admin.customerProfile?.profileImageUrl
                        )}
                        alt={admin.name}
                      />
                      <AvatarFallback>
                        {admin.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {admin.name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {admin.email}
                      </p>
                    </div>
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-600">No admins available</p>
              </div>
            )}
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setSupportDialogOpen(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
