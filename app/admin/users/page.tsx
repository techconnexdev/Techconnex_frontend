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
import { getAdminUsers, getAdminUserStats, suspendUser, activateUser, getProfileImageUrl, createAdminUser } from "@/lib/api"
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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage all platform users and their activities</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Export Data
            </Button>
            <Button onClick={() => setAddUserDialogOpen(true)}>
              <Users className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Suspended</p>
                  <p className="text-2xl font-bold text-red-600">{stats.suspendedUsers || 0}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Providers</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.providers}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customers</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.customers}</p>
                </div>
                <Building className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search users by name or email..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-48">
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
                <SelectTrigger className="w-full sm:w-48">
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
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
            <CardDescription>Manage user accounts and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Loading users...</span>
              </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                    <TableHead>Projects/Stats</TableHead>
                  <TableHead>Rating</TableHead>
                    <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-gray-500">
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
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage 
                            src={getProfileImageUrl(profile?.profileImageUrl as string | undefined)}
                          />
                          <AvatarFallback>{(userName?.charAt(0) || "U") as string}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{userName as string}</p>
                            {(user.isVerified as boolean) && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                          <p className="text-sm text-gray-500">{userEmail as string}</p>
                          {(() => {
                            const location = profile?.location as string | undefined;
                            return location ? (
                              <p className="text-xs text-gray-400">{location}</p>
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
                    <TableCell>
                      <Badge className={getRoleColor(userRole)}>
                              {getPrimaryRole(userRole)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(userStatus || "")}>
                              {userStatus || "ACTIVE"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                            {isProvider ? (
                              <div>
                                <p className="font-medium">{(profile?.totalProjects as number || 0)} projects</p>
                                <p className="text-sm text-gray-500">
                                  RM {Number(profile?.totalEarnings || 0).toLocaleString()} earned
                                </p>
                              </div>
                            ) : (
                      <div>
                                <p className="font-medium">{(profile?.projectsPosted as number || 0)} posted</p>
                        <p className="text-sm text-gray-500">
                                  RM {Number(profile?.totalSpend || 0).toLocaleString()} spent
                        </p>
                      </div>
                            )}
                    </TableCell>
                    <TableCell>
                            {profile?.rating ? (
                        <div className="flex items-center">
                          <span className="text-yellow-400">★</span>
                                <span className="ml-1 font-medium">{Number(profile.rating).toFixed(1)}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">No rating</span>
                      )}
                    </TableCell>
                    <TableCell>
                            <p className="text-sm">{formatDate(userCreatedAt || "")}</p>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/admin/users/${user.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                                  </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                                {user.status === "ACTIVE" ? (
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => handleSuspendClick(user)}
                                  >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend User
                            </DropdownMenuItem>
                          ) : (
                                  <DropdownMenuItem
                                    className="text-green-600"
                                    onClick={() => handleActivateClick(user)}
                                  >
                              <CheckCircle className="mr-2 h-4 w-4" />
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
            )}
          </CardContent>
        </Card>

        {/* Suspend Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Suspend User</DialogTitle>
              <DialogDescription>
                Are you sure you want to suspend {selectedUser?.name as string}? They will not be able to login until activated.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setSuspendDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmSuspend}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activate User</DialogTitle>
              <DialogDescription>
                Are you sure you want to activate {selectedUser?.name as string}? They will be able to login again.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setActivateDialogOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmActivate}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account. A password will be automatically generated.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter phone number (optional)"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* Role */}
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: "ADMIN" | "PROVIDER" | "CUSTOMER") =>
                    setFormData({ ...formData, role: value })
                  }
                >
                  <SelectTrigger id="role">
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
                <Label>Generated Password</Label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={generatedPassword}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={copyPassword}
                    title="Copy password"
                  >
                    {passwordCopied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generatePassword}
                  >
                    Regenerate
                  </Button>
                </div>
                <p className="text-sm text-gray-500">
                  This password will be used for the initial login. Make sure to copy it before closing this dialog.
                </p>
              </div>
            </div>
            <DialogFooter>
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
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddUser}
                disabled={createLoading || !formData.name || !formData.email}
              >
                {createLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
