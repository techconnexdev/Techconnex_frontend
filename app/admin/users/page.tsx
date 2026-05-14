"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  Users,
  Building,
  Loader2,
  Copy,
  Check,
  MessageSquare,
  Bell,
  Megaphone,
  RotateCcw,
} from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"
import { getAdminUsers, getAdminUserStats, suspendUser, activateUser, restoreDeletedUser, getProfileImageUrl, createAdminUser, exportAdminUsers, adminSendNotification, adminBroadcastNotification } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import { useI18n } from "@/contexts/I18nProvider"
import type { MessageKey } from "@/lib/i18n/messages"
import Link from "next/link"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export default function AdminUsersPage() {
  const { t } = useI18n()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<Array<Record<string, unknown>>>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    suspendedUsers: 0,
    providers: 0,
    customers: 0,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<Record<string, unknown> | null>(null)
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false)
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "CUSTOMER" as "ADMIN" | "PROVIDER" | "CUSTOMER",
  })
  const [notifyOpen, setNotifyOpen] = useState(false)
  const [notifyTarget, setNotifyTarget] = useState<Record<string, unknown> | null>(null)
  const [notifyTitle, setNotifyTitle] = useState("")
  const [notifyContent, setNotifyContent] = useState("")
  const [broadcastOpen, setBroadcastOpen] = useState(false)
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [broadcastContent, setBroadcastContent] = useState("")
  const [broadcastLoading, setBroadcastLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const filters: Record<string, string> = {}
      if (statusFilter !== "all") filters.status = statusFilter
      if (roleFilter !== "all") filters.role = roleFilter
      if (searchQuery) filters.search = searchQuery

      const response = await getAdminUsers(filters)
      console.log("Admin users response:", response)
      if (response.success) {
        setUsers((response.data || []) as Array<Record<string, unknown>>)
      } else {
        console.error("Failed to load users:", response.error)
        toast({
          title: t("admin.users.toast.errorTitle"),
          description: response.error || t("admin.users.toast.loadUsersFailed"),
          variant: "destructive",
        })
      }
    } catch (error: unknown) {
      console.error("Error loading users:", error)
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: error instanceof Error ? error.message : t("admin.users.toast.loadUsersFailed"),
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter, roleFilter, toast, t])

  const loadStats = async () => {
    try {
      const response = await getAdminUserStats()
      if (response.success) {
        setStats(response.data)
      }
    } catch (error: unknown) {
      console.error("Failed to load stats:", error)
    }
  }

  useEffect(() => {
    void loadUsers()
    void loadStats()
  }, [loadUsers])

  const handleSuspendClick = (user: Record<string, unknown>) => {
    setSelectedUser(user)
    setSuspendDialogOpen(true)
  }

  const handleActivateClick = (user: Record<string, unknown>) => {
    setSelectedUser(user)
    setActivateDialogOpen(true)
  }

  const handleRestoreClick = (user: Record<string, unknown>) => {
    setSelectedUser(user)
    setRestoreDialogOpen(true)
  }

  const openNotifyDialog = (user: Record<string, unknown>) => {
    setNotifyTarget(user)
    setNotifyTitle(t("admin.users.notify.defaultTitle"))
    setNotifyContent("")
    setNotifyOpen(true)
  }

  const handleSendNotification = async () => {
    if (!notifyTarget?.id || !notifyTitle.trim() || !notifyContent.trim()) return

    try {
      setActionLoading(true)
      await adminSendNotification({
        userId: String(notifyTarget.id),
        title: notifyTitle.trim(),
        content: notifyContent.trim(),
      })
      toast({
        title: t("admin.users.toast.successTitle"),
        description: t("admin.users.toast.notificationSent"),
      })
      setNotifyOpen(false)
      setNotifyTarget(null)
      setNotifyTitle("")
      setNotifyContent("")
    } catch (error: unknown) {
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: error instanceof Error ? error.message : t("admin.users.toast.notificationSendFailed"),
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleBroadcastNotification = async () => {
    if (!broadcastTitle.trim() || !broadcastContent.trim()) return

    try {
      setBroadcastLoading(true)
      const res = await adminBroadcastNotification({
        title: broadcastTitle.trim(),
        content: broadcastContent.trim(),
      })
      const count = (res as { count?: number })?.count ?? 0
      toast({
        title: t("admin.users.toast.successTitle"),
        description: t("admin.users.toast.broadcastSent", { count: String(count) }),
      })
      setBroadcastOpen(false)
      setBroadcastTitle("")
      setBroadcastContent("")
    } catch (error: unknown) {
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: error instanceof Error ? error.message : t("admin.users.toast.broadcastFailed"),
        variant: "destructive",
      })
    } finally {
      setBroadcastLoading(false)
    }
  }

  const confirmSuspend = async () => {
    if (!selectedUser) return

    try {
      setActionLoading(true)
      const response = await suspendUser(selectedUser.id as string)
      if (response.success) {
        toast({
          title: t("admin.users.toast.successTitle"),
          description: t("admin.users.toast.userSuspended"),
        })
        setSuspendDialogOpen(false)
        setSelectedUser(null)
        loadUsers()
        loadStats()
      }
    } catch (error: unknown) {
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: error instanceof Error ? error.message : t("admin.users.toast.suspendFailed"),
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const confirmActivate = async () => {
    if (!selectedUser) return

    try {
      setActionLoading(true)
      const response = await activateUser(selectedUser.id as string)
      if (response.success) {
        toast({
          title: t("admin.users.toast.successTitle"),
          description: t("admin.users.toast.userActivated"),
        })
        setActivateDialogOpen(false)
        setSelectedUser(null)
        loadUsers()
        loadStats()
      }
    } catch (error: unknown) {
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: error instanceof Error ? error.message : t("admin.users.toast.activateFailed"),
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const confirmRestore = async () => {
    if (!selectedUser) return

    try {
      setActionLoading(true)
      const response = await restoreDeletedUser(selectedUser.id as string)
      if (response.success) {
        toast({
          title: t("admin.users.toast.successTitle"),
          description: t("admin.users.toast.accountRestored"),
        })
        setRestoreDialogOpen(false)
        setSelectedUser(null)
        loadUsers()
        loadStats()
      }
    } catch (error: unknown) {
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: error instanceof Error ? error.message : t("admin.users.toast.restoreFailed"),
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  // Generate random password
  const generatePassword = () => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setGeneratedPassword(password)
    setPasswordCopied(false)
    return password
  }

  // Copy password to clipboard
  const copyPassword = async () => {
    if (generatedPassword) {
      try {
        await navigator.clipboard.writeText(generatedPassword)
        setPasswordCopied(true)
        toast({
          title: t("admin.users.toast.copiedTitle"),
          description: t("admin.users.toast.passwordCopiedDesc"),
        })
        setTimeout(() => setPasswordCopied(false), 2000)
      } catch {
        toast({
          title: t("admin.users.toast.errorTitle"),
          description: t("admin.users.toast.copyPasswordFailed"),
          variant: "destructive",
        })
      }
    }
  }

  // Handle add user form submission
  const handleAddUser = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: t("admin.users.toast.validationTitle"),
        description: t("admin.users.toast.nameEmailRequired"),
        variant: "destructive",
      })
      return
    }

    // Generate password if not already generated
    const password = generatedPassword || generatePassword()

    try {
      setCreateLoading(true)
      const response = await createAdminUser({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        role: formData.role,
        password: password,
      })

      if (response.success) {
        toast({
          title: t("admin.users.toast.successTitle"),
          description: t("admin.users.toast.userCreated"),
        })
        setAddUserDialogOpen(false)
        setFormData({
          name: "",
          email: "",
          phone: "",
          role: "CUSTOMER",
        })
        setGeneratedPassword("")
        setPasswordCopied(false)
        loadUsers()
        loadStats()
      }
    } catch (error: unknown) {
      toast({
        title: t("admin.users.toast.errorTitle"),
        description: error instanceof Error ? error.message : t("admin.users.toast.createUserFailed"),
        variant: "destructive",
      })
    } finally {
      setCreateLoading(false)
    }
  }

  // Generate password when dialog opens
  useEffect(() => {
    if (addUserDialogOpen && !generatedPassword) {
      generatePassword()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addUserDialogOpen])


  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "SUSPENDED":
        return "bg-red-100 text-red-800"
      case "DELETED":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (roles: string[]) => {
    if (!roles || !Array.isArray(roles)) return "bg-gray-100 text-gray-800"
    if (roles.includes("PROVIDER")) return "bg-blue-100 text-blue-800"
    if (roles.includes("CUSTOMER")) return "bg-purple-100 text-purple-800"
    if (roles.includes("ADMIN")) return "bg-red-100 text-red-800"
        return "bg-gray-100 text-gray-800"
    }

  const getPrimaryRole = (roles: string[]) => {
    if (!roles || !Array.isArray(roles)) return t("admin.users.role.unknown")
    if (roles.includes("PROVIDER")) return t("admin.users.role.provider")
    if (roles.includes("CUSTOMER")) return t("admin.users.role.customer")
    if (roles.includes("ADMIN")) return t("admin.users.role.admin")
    const raw = roles[0]
    if (raw === "PROVIDER" || raw === "CUSTOMER" || raw === "ADMIN") {
      return t(`admin.users.roleBadge.${raw}` as MessageKey)
    }
    return raw || t("admin.users.role.unknown")
  }

  const accountStatusLabel = (status: string | undefined) => {
    const key = (status || "ACTIVE").toUpperCase()
    if (key === "ACTIVE" || key === "SUSPENDED" || key === "DELETED") {
      return t(`admin.users.statusBadge.${key}` as MessageKey)
    }
    return status || t("admin.users.statusBadge.ACTIVE")
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return t("admin.users.common.emDash")
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("admin.users.page.title")}</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">{t("admin.users.page.subtitle")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const blob = await exportAdminUsers({
                    search: searchQuery,
                    role: roleFilter !== "all" ? roleFilter : undefined,
                    status: statusFilter !== "all" ? statusFilter : undefined,
                  })
                  const url = URL.createObjectURL(blob)
                  const link = document.createElement("a")
                  link.href = url
                  link.download = `admin-users-${Date.now()}.pdf`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                  URL.revokeObjectURL(url)
                  toast({
                    title: t("admin.users.export.successTitle"),
                    description: t("admin.users.export.successDesc"),
                  })
                } catch (err) {
                  toast({
                    title: t("admin.users.export.failTitle"),
                    description:
                      err instanceof Error
                        ? err.message
                        : t("admin.users.export.failDesc"),
                    variant: "destructive",
                  })
                }
              }}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {t("admin.users.export.button")}
            </Button>
            <Button onClick={() => setAddUserDialogOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {t("admin.users.addUser.button")}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t("admin.users.stats.totalUsers")}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{stats.totalUsers}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t("admin.users.stats.active")}</p>
                  <p className="text-xl sm:text-2xl font-bold text-green-600 truncate">{stats.activeUsers}</p>
                </div>
                <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t("admin.users.stats.suspended")}</p>
                  <p className="text-xl sm:text-2xl font-bold text-red-600 truncate">{stats.suspendedUsers || 0}</p>
                </div>
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t("admin.users.stats.providers")}</p>
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 truncate">{stats.providers}</p>
                </div>
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">{t("admin.users.stats.customers")}</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600 truncate">{stats.customers}</p>
                </div>
                <Building className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Announcements – send notification to all users */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-sky-600" />
              {t("admin.users.announcements.title")}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t("admin.users.announcements.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <Button
              onClick={() => {
                setBroadcastTitle(t("admin.users.notify.defaultTitle"))
                setBroadcastContent("")
                setBroadcastOpen(true)
              }}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Megaphone className="w-4 h-4 mr-2" />
              {t("admin.users.announcements.cta")}
            </Button>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <Input
                    placeholder={t("admin.users.filters.searchPlaceholder")}
                    className="pl-9 sm:pl-10 text-sm sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                  <SelectValue placeholder={t("admin.users.filters.allRoles")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.users.filters.allRoles")}</SelectItem>
                  <SelectItem value="PROVIDER">{t("admin.users.filters.roleProviders")}</SelectItem>
                  <SelectItem value="CUSTOMER">{t("admin.users.filters.roleCustomers")}</SelectItem>
                  <SelectItem value="ADMIN">{t("admin.users.filters.roleAdmins")}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                  <SelectValue placeholder={t("admin.users.filters.allStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.users.filters.allStatus")}</SelectItem>
                    <SelectItem value="ACTIVE">{t("admin.users.filters.statusActive")}</SelectItem>
                    <SelectItem value="SUSPENDED">{t("admin.users.filters.statusSuspended")}</SelectItem>
                    <SelectItem value="DELETED">{t("admin.users.filters.statusDeleted")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">{t("admin.users.table.title", { count: String(users.length) })}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">{t("admin.users.table.description")}</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-0">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
                <span className="ml-2 text-sm sm:text-base">{t("admin.users.table.loading")}</span>
              </div>
            ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">{t("admin.users.table.col.user")}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("admin.users.table.col.role")}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("admin.users.table.col.status")}</TableHead>
                    <TableHead className="text-xs sm:text-sm">{t("admin.users.table.col.projectsStats")}</TableHead>
                  <TableHead className="text-xs sm:text-sm">{t("admin.users.table.col.rating")}</TableHead>
                    <TableHead className="text-xs sm:text-sm">{t("admin.users.table.col.joined")}</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">{t("admin.users.table.col.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 sm:py-12 text-sm sm:text-base text-gray-500">
                        {t("admin.users.table.empty")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => {
                      const userRole = Array.isArray(user.role) ? user.role : []
                      const isProvider = userRole.includes("PROVIDER")
                      const isCustomer = userRole.includes("CUSTOMER")
                      const profile = (isProvider ? user.providerProfile : user.customerProfile) as Record<string, unknown> | undefined
                      const userName = user.name as string | undefined
                      const userEmail = user.email as string | undefined
                      const userStatus = user.status as string | undefined
                      const userCreatedAt = user.createdAt as string | undefined
                      
                      return (
                  <TableRow key={user.id as string}>
                    <TableCell className="p-3 sm:p-4">
                      <div className="flex items-center space-x-2 sm:space-x-3">
                        <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                          <AvatarImage 
                            src={getProfileImageUrl(profile?.profileImageUrl as string | undefined)}
                          />
                          <AvatarFallback className="text-xs sm:text-sm">{(userName?.charAt(0) || "U") as string}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <p className="font-medium text-sm sm:text-base truncate">{userName as string}</p>
                            {(user.isVerified as boolean) && <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">{userEmail as string}</p>
                          {(() => {
                            const location = profile?.location as string | undefined;
                            return location ? (
                              <p className="text-xs text-gray-400 truncate">{location}</p>
                            ) : null;
                          })()}
                          {(() => {
                            const bio = isProvider ? (profile?.bio as string | undefined) : undefined;
                            return bio ? (
                              <p className="text-xs text-gray-400 line-clamp-1">{bio}</p>
                            ) : null;
                          })()}
                          {(() => {
                            const description = isCustomer ? (profile?.description as string | undefined) : undefined;
                            return description ? (
                              <p className="text-xs text-gray-400 line-clamp-1">{description}</p>
                            ) : null;
                          })()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                      <Badge className={`${getRoleColor(userRole)} text-xs`}>
                              {getPrimaryRole(userRole)}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                      <Badge className={`${getStatusColor(userStatus || "")} text-xs`}>
                              {accountStatusLabel(userStatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                            {isProvider ? (
                              <div>
                                <p className="font-medium text-xs sm:text-sm">
                                  {t("admin.users.table.projectsCount", {
                                    count: String((profile?.totalProjects as number) || 0),
                                  })}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t("admin.users.table.earned", {
                                    amount: Number(profile?.totalEarnings || 0).toLocaleString(),
                                  })}
                                </p>
                              </div>
                            ) : (
                      <div>
                                <p className="font-medium text-xs sm:text-sm">
                                  {t("admin.users.table.postedCount", {
                                    count: String((profile?.projectsPosted as number) || 0),
                                  })}
                                </p>
                        <p className="text-xs text-gray-500">
                                  {t("admin.users.table.spent", {
                                    amount: Number(profile?.totalSpend || 0).toLocaleString(),
                                  })}
                        </p>
                      </div>
                            )}
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                            {profile?.rating ? (
                        <div className="flex items-center">
                          <span className="text-yellow-400 text-xs sm:text-sm">★</span>
                                <span className="ml-1 font-medium text-xs sm:text-sm">{Number(profile.rating).toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-gray-400">{t("admin.users.table.noRating")}</span>
                      )}
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                            <p className="text-xs sm:text-sm">{formatDate(userCreatedAt || "")}</p>
                    </TableCell>
                    <TableCell className="text-right p-3 sm:p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 sm:h-8 sm:w-8 p-0">
                            <MoreHorizontal className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs sm:text-sm">
                          <DropdownMenuLabel className="text-xs sm:text-sm">{t("admin.users.table.actionsLabel")}</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/users/${user.id}`} className="text-xs sm:text-sm">
                            <Eye className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            {t("admin.users.actions.viewProfile")}
                                  </Link>
                          </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/admin/messages?userId=${user.id}&name=${encodeURIComponent((user.name as string) || "")}`}
                                    className="text-xs sm:text-sm"
                                  >
                                    <MessageSquare className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    {t("admin.users.actions.message")}
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openNotifyDialog(user)} className="text-xs sm:text-sm">
                                  <Bell className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                  {t("admin.users.actions.sendNotification")}
                                </DropdownMenuItem>
                          <DropdownMenuSeparator />
                                {user.status === "ACTIVE" ? (
                                  <DropdownMenuItem
                                    className="text-red-600 text-xs sm:text-sm"
                                    onClick={() => handleSuspendClick(user)}
                                  >
                              <Ban className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              {t("admin.users.actions.suspendUser")}
                            </DropdownMenuItem>
                                ) : user.status === "SUSPENDED" ? (
                                  <DropdownMenuItem
                                    className="text-green-600 text-xs sm:text-sm"
                                    onClick={() => handleActivateClick(user)}
                                  >
                              <CheckCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              {t("admin.users.actions.activateUser")}
                            </DropdownMenuItem>
                                ) : user.status === "DELETED" ? (
                                  <DropdownMenuItem
                                    className="text-sky-700 text-xs sm:text-sm"
                                    onClick={() => handleRestoreClick(user)}
                                  >
                                    <RotateCcw className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    {t("admin.users.actions.restoreAccount")}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem disabled className="text-xs sm:text-sm">
                                    {t("admin.users.actions.unknownStatus")}
                                  </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                      )
                    })
                  )}
              </TableBody>
            </Table>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Suspend Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent className="p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t("admin.users.dialog.suspend.title")}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("admin.users.dialog.suspend.description", {
                  name: String(selectedUser?.name ?? ""),
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setSuspendDialogOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {t("admin.users.common.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={confirmSuspend}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    {t("admin.users.dialog.suspend.working")}
                  </>
                ) : (
                  t("admin.users.dialog.suspend.confirm")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activate Dialog */}
        <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
          <DialogContent className="p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t("admin.users.dialog.activate.title")}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("admin.users.dialog.activate.description", {
                  name: String(selectedUser?.name ?? ""),
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setActivateDialogOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {t("admin.users.common.cancel")}
              </Button>
              <Button
                onClick={confirmActivate}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    {t("admin.users.dialog.activate.working")}
                  </>
                ) : (
                  t("admin.users.dialog.activate.confirm")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Restore deleted account */}
        <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
          <DialogContent className="p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t("admin.users.dialog.restore.title")}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("admin.users.dialog.restore.description", {
                  name: String(selectedUser?.name ?? ""),
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setRestoreDialogOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {t("admin.users.common.cancel")}
              </Button>
              <Button
                onClick={confirmRestore}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    {t("admin.users.dialog.restore.working")}
                  </>
                ) : (
                  t("admin.users.dialog.restore.confirm")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t("admin.users.dialog.addUser.title")}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("admin.users.dialog.addUser.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm">{t("admin.users.dialog.addUser.name")}</Label>
                <Input
                  id="name"
                  placeholder={t("admin.users.dialog.addUser.namePlaceholder")}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">{t("admin.users.dialog.addUser.email")}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t("admin.users.dialog.addUser.emailPlaceholder")}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">{t("admin.users.dialog.addUser.phone")}</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder={t("admin.users.dialog.addUser.phonePlaceholder")}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs sm:text-sm">{t("admin.users.dialog.addUser.role")}</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "ADMIN" | "PROVIDER" | "CUSTOMER") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role" className="text-sm sm:text-base">
                    <SelectValue placeholder={t("admin.users.dialog.addUser.rolePlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">{t("admin.users.role.admin")}</SelectItem>
                    <SelectItem value="PROVIDER">{t("admin.users.role.provider")}</SelectItem>
                    <SelectItem value="CUSTOMER">{t("admin.users.role.customer")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generated Password */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">{t("admin.users.dialog.addUser.generatedPassword")}</Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="text"
                    value={generatedPassword}
                    readOnly
                    className="font-mono text-xs sm:text-sm"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={copyPassword}
                      title={t("admin.users.dialog.addUser.copyPasswordTitle")}
                      className="flex-shrink-0"
                    >
                      {passwordCopied ? (
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generatePassword}
                      className="text-xs sm:text-sm"
                    >
                      {t("admin.users.dialog.addUser.regenerate")}
                    </Button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  {t("admin.users.dialog.addUser.passwordHint")}
                </p>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setAddUserDialogOpen(false)
                  setFormData({
                    name: "",
                    email: "",
                    phone: "",
                    role: "CUSTOMER",
                  })
                  setGeneratedPassword("")
                  setPasswordCopied(false)
                }}
                disabled={createLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {t("admin.users.common.cancel")}
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={createLoading || !formData.name || !formData.email}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    {t("admin.users.dialog.addUser.creating")}
                  </>
                ) : (
                  t("admin.users.dialog.addUser.create")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Send notification dialog */}
        <Dialog open={notifyOpen} onOpenChange={setNotifyOpen}>
          <DialogContent className="p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">{t("admin.users.dialog.notify.title")}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("admin.users.dialog.notify.description", {
                  name: String(notifyTarget?.name ?? t("admin.users.dialog.notify.descriptionFallback")),
                })}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="notify-title">{t("admin.users.dialog.notify.titleLabel")}</Label>
                <Input
                  id="notify-title"
                  value={notifyTitle}
                  onChange={(e) => setNotifyTitle(e.target.value)}
                  placeholder={t("admin.users.dialog.notify.titlePlaceholder")}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notify-content">{t("admin.users.dialog.notify.messageLabel")}</Label>
                <Textarea
                  id="notify-content"
                  className="min-h-[100px] text-sm sm:text-base"
                  value={notifyContent}
                  onChange={(e) => setNotifyContent(e.target.value)}
                  placeholder={t("admin.users.dialog.notify.messagePlaceholder")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNotifyOpen(false)}
                disabled={actionLoading}
              >
                {t("admin.users.common.cancel")}
              </Button>
              <Button
                onClick={handleSendNotification}
                disabled={
                  !notifyTitle.trim() ||
                  !notifyContent.trim() ||
                  !!actionLoading
                }
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  t("admin.users.common.send")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Broadcast announcement dialog – send to all users */}
        <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
          <DialogContent className="p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-sky-600" />
                {t("admin.users.dialog.broadcast.title")}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("admin.users.dialog.broadcast.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="broadcast-title">{t("admin.users.dialog.broadcast.titleLabel")}</Label>
                <Input
                  id="broadcast-title"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder={t("admin.users.dialog.broadcast.titlePlaceholder")}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="broadcast-content">{t("admin.users.dialog.broadcast.messageLabel")}</Label>
                <Textarea
                  id="broadcast-content"
                  className="min-h-[120px] text-sm sm:text-base"
                  value={broadcastContent}
                  onChange={(e) => setBroadcastContent(e.target.value)}
                  placeholder={t("admin.users.dialog.broadcast.messagePlaceholder")}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setBroadcastOpen(false)}
                disabled={broadcastLoading}
              >
                {t("admin.users.common.cancel")}
              </Button>
              <Button
                onClick={handleBroadcastNotification}
                disabled={
                  !broadcastTitle.trim() ||
                  !broadcastContent.trim() ||
                  broadcastLoading
                }
              >
                {broadcastLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                {t("admin.users.dialog.broadcast.sendAll")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  )
}
