"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Briefcase,
  Shield,
  Settings,
  BarChart3,
  AlertTriangle,
  DollarSign,
  Menu,
  X,
  Bell,
  User,
  CreditCard,
  LogOut,
  Zap,
  Star,
  MessageSquare,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Badge as BadgeComponent } from "@/components/ui/badge";

interface AdminLayoutProps {
  children: React.ReactNode;
}

type AdminProfile = {
  id?: string;
  name?: string;
  email?: string;
  resume?: {
    fileUrl?: string;
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

const NAV_ITEMS = [
  { name: "Dashboard", href: "/admin/dashboard", icon: Home },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Projects", href: "/admin/projects", icon: Briefcase },
  { name: "Reviews", href: "/admin/reviews", icon: Star },
  { name: "Verifications", href: "/admin/verifications", icon: Shield },
  { name: "Disputes", href: "/admin/disputes", icon: AlertTriangle },
  { name: "Payments", href: "/admin/payments", icon: DollarSign },
  { name: "Messages", href: "/admin/messages", icon: MessageSquare },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  // Profile state
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Notifications state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] =
    useState<Notification | null>(null);

  const handleLogout = () => {
    // Clear user data from localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    // Clear any other session data
    sessionStorage.clear();

    // Redirect to login page
    router.push("/auth/login");
  };
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const verifyAdmin = async () => {
      if (typeof window === "undefined") return;

      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/auth/login");
        return;
      }

      try {
        console.log("🔑 Token from localStorage:", token);

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
        const res = await fetch(`${API_URL}/admin/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Unauthorized");

        const data = await res.json();
        setProfile(data as AdminProfile);
      } catch {
        // Token invalid or expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/auth/login");
      } finally {
        setProfileLoading(false);
      }
    };

    verifyAdmin();
  }, [router]);

  // Fetch notifications for admin header
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

  // Calculate unread notifications
  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
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
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
          {/* <div className="p-4 border-t">
            <Link href="/customer/projects/new">
              <Button className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </Link>
          </div> */}
          <div className="p-4 border-t">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 text-white">
              <h3 className="text-sm font-medium mb-1">Need Help?</h3>
              <p className="text-xs opacity-90 mb-3">
                Contact our support team for assistance
              </p>
              <Button size="sm" variant="secondary" className="w-full">
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
                    placeholder="Search projects, providers..."
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
                    {unreadCount > 0 && (
                      <BadgeComponent className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs bg-red-500">
                        {unreadCount}
                      </BadgeComponent>
                    )}
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
                          alt={profile.name || "User"}
                        />
                      ) : (
                        <AvatarImage
                          src="/placeholder.svg?height=32&width=32"
                          alt="User"
                        />
                      )}
                      <AvatarFallback>
                        {profile && profile.name
                          ? String(profile.name)
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
                          : profile?.name || "Unknown User"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {profileLoading ? "Loading..." : profile?.email || "-"}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Billing</span>
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
    </div>
  );
}
