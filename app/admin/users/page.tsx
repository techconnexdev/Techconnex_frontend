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
} from "lucide-react"
import { AdminLayout } from "@/components/admin-layout"
import { getAdminUsers, getAdminUserStats, suspendUser, activateUser, getProfileImageUrl, createAdminUser, exportAdminUsers } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { Label } from "@/components/ui/label"

export default function AdminUsersPage() {
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
          title: "Error",
          description: response.error || "Failed to load users",
          variant: "destructive",
        })
      }
    } catch (error: unknown) {
      console.error("Error loading users:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [searchQuery, statusFilter, roleFilter, toast])

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
    loadUsers()
    loadStats()
  }, [loadUsers])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSuspendClick = (user: Record<string, unknown>) => {
    setSelectedUser(user)
    setSuspendDialogOpen(true)
  }

  const handleActivateClick = (user: Record<string, unknown>) => {
    setSelectedUser(user)
    setActivateDialogOpen(true)
  }

  const confirmSuspend = async () => {
    if (!selectedUser) return

    try {
      setActionLoading(true)
      const response = await suspendUser(selectedUser.id as string)
      if (response.success) {
        toast({
          title: "Success",
          description: "User suspended successfully",
        })
        setSuspendDialogOpen(false)
        setSelectedUser(null)
        loadUsers()
        loadStats()
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to suspend user",
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
          title: "Success",
          description: "User activated successfully",
        })
        setActivateDialogOpen(false)
        setSelectedUser(null)
        loadUsers()
        loadStats()
      }
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to activate user",
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
          title: "Copied!",
          description: "Password copied to clipboard",
        })
        setTimeout(() => setPasswordCopied(false), 2000)
      } catch {
        toast({
          title: "Error",
          description: "Failed to copy password",
          variant: "destructive",
        })
      }
    }
  }

  // Handle add user form submission
  const handleAddUser = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
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
          title: "Success",
          description: "User created successfully",
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
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create user",
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
    if (!roles || !Array.isArray(roles)) return "Unknown"
    if (roles.includes("PROVIDER")) return "Provider"
    if (roles.includes("CUSTOMER")) return "Customer"
    if (roles.includes("ADMIN")) return "Admin"
    return roles[0] || "Unknown"
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "—"
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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Manage all platform users and their activities</p>
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
                    title: "Export successful",
                    description: "Users exported as PDF",
                  })
                } catch (err) {
                  toast({
                    title: "Export failed",
                    description:
                      err instanceof Error
                        ? err.message
                        : "Failed to export users",
                    variant: "destructive",
                  })
                }
              }}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Export Data
            </Button>
            <Button onClick={() => setAddUserDialogOpen(true)} className="w-full sm:w-auto text-xs sm:text-sm">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Users</p>
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
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Active</p>
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
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Suspended</p>
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
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Providers</p>
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
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Customers</p>
                  <p className="text-xl sm:text-2xl font-bold text-purple-600 truncate">{stats.customers}</p>
                </div>
                <Building className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0 ml-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-9 sm:pl-10 text-sm sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="PROVIDER">Providers</SelectItem>
                  <SelectItem value="CUSTOMER">Customers</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">Users ({users.length})</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent className="p-0 sm:p-4 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8 sm:py-12 px-4 sm:px-0">
                <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
                <span className="ml-2 text-sm sm:text-base">Loading users...</span>
              </div>
            ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs sm:text-sm">User</TableHead>
                  <TableHead className="text-xs sm:text-sm">Role</TableHead>
                  <TableHead className="text-xs sm:text-sm">Status</TableHead>
                    <TableHead className="text-xs sm:text-sm">Projects/Stats</TableHead>
                  <TableHead className="text-xs sm:text-sm">Rating</TableHead>
                    <TableHead className="text-xs sm:text-sm">Joined</TableHead>
                  <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 sm:py-12 text-sm sm:text-base text-gray-500">
                        No users found
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
                              {userStatus || "ACTIVE"}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 sm:p-4">
                            {isProvider ? (
                              <div>
                                <p className="font-medium text-xs sm:text-sm">{(profile?.totalProjects as number || 0)} projects</p>
                                <p className="text-xs text-gray-500">
                                  RM {Number(profile?.totalEarnings || 0).toLocaleString()} earned
                                </p>
                              </div>
                            ) : (
                      <div>
                                <p className="font-medium text-xs sm:text-sm">{(profile?.projectsPosted as number || 0)} posted</p>
                        <p className="text-xs text-gray-500">
                                  RM {Number(profile?.totalSpend || 0).toLocaleString()} spent
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
                        <span className="text-xs sm:text-sm text-gray-400">No rating</span>
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
                          <DropdownMenuLabel className="text-xs sm:text-sm">Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/users/${user.id}`} className="text-xs sm:text-sm">
                            <Eye className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            View Profile
                                  </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                                {user.status === "ACTIVE" ? (
                                  <DropdownMenuItem
                                    className="text-red-600 text-xs sm:text-sm"
                                    onClick={() => handleSuspendClick(user)}
                                  >
                              <Ban className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                                  <DropdownMenuItem
                                    className="text-green-600 text-xs sm:text-sm"
                                    onClick={() => handleActivateClick(user)}
                                  >
                              <CheckCircle className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Activate User
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
              <DialogTitle className="text-lg sm:text-xl">Suspend User</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Are you sure you want to suspend {selectedUser?.name as string}? They will not be able to login until activated.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setSuspendDialogOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Cancel
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
                    Suspending...
                  </>
                ) : (
                  "Suspend User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Activate Dialog */}
        <Dialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen}>
          <DialogContent className="p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Activate User</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Are you sure you want to activate {selectedUser?.name as string}? They will be able to login again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setActivateDialogOpen(false)}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmActivate}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    Activating...
                  </>
                ) : (
                  "Activate User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onOpenChange={setAddUserDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Add New User</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Create a new user account. A password will be automatically generated.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs sm:text-sm">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs sm:text-sm">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number (optional)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="text-sm sm:text-base"
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role" className="text-xs sm:text-sm">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "ADMIN" | "PROVIDER" | "CUSTOMER") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role" className="text-sm sm:text-base">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="PROVIDER">Provider</SelectItem>
                    <SelectItem value="CUSTOMER">Customer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Generated Password */}
              <div className="space-y-2">
                <Label className="text-xs sm:text-sm">Generated Password</Label>
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
                      title="Copy password"
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
                      Regenerate
                    </Button>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-gray-500">
                  This password will be used for the initial login. Make sure to copy it before closing this dialog.
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
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={createLoading || !formData.name || !formData.email}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                {createLoading ? (
                  <>
                    <Loader2 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create User"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </AdminLayout>
  )
}
