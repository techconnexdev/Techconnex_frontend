"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminLayout } from "@/components/admin-layout"
import { Filter, FileText, RefreshCw } from "lucide-react"
import { StatsCards } from "@/components/admin/verifications/StatsCards"
import { FiltersCard } from "@/components/admin/verifications/FiltersCard"
import { VerificationsTable } from "@/components/admin/verifications/VerificationsTable"
import { ReviewDialog } from "@/components/admin/verifications/ReviewDialog"
import type {
  KycUser,
  KycDocStatus,
  KycStatus,
  Role,
  VerificationStats,
  VerificationRow,
} from "@/components/admin/verifications/types"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

// Map backend KycStatus -> UI status pills
function uiDocStatus(s: KycDocStatus): "verified" | "rejected" | "uploaded" {
  switch (s) {
    case "verified":
      return "verified"
    case "rejected":
      return "rejected"
    case "uploaded":
    default:
      return "uploaded"
  }
}

export default function AdminVerificationsPage() {
  // ===== UI state =====
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedUser, setSelectedUser] = useState<KycUser | null>(null)
  const [reviewNotes, setReviewNotes] = useState("")

  // ===== Data state =====
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<KycUser[]>([])
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  async function fetchKyc() {
    if (!token) return

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/kyc/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`Failed to fetch KYC list (${res.status})`)

      const rawData = await res.json()

      // Group docs by userId
      const grouped: Record<string, KycUser> = {}

      rawData.forEach((item: Record<string, unknown>) => {
        const u = item.user as Record<string, unknown>
        const userId = u.id as string
        if (!grouped[userId]) {
          grouped[userId] = {
            id: userId,
            name: (u.name as string) || "Unnamed",
            email: u.email as string,
            role: (Array.isArray(u.role) ? u.role[0] : u.role) as Role,
            kycStatus: u.kycStatus as KycStatus,
            createdAt: u.createdAt as string,
            profile: u.profile as Record<string, unknown> | undefined,
            documents: [],
          }
        }

        // Push this KYC doc
        grouped[userId].documents.push({
          id: item.id as string,
          type: item.type as KycUser["documents"][0]["type"],
          fileUrl: item.fileUrl as string,
          filename: item.filename as string,
          mimeType: item.mimeType as string | undefined,
          status: item.status as KycDocStatus,
          uploadedAt: item.uploadedAt as string | undefined,
          reviewNotes: item.reviewNotes as string | undefined,
          reviewedBy: item.reviewedBy as string | undefined,
          reviewedAt: item.reviewedAt as string | undefined,
        })
      })

      // Convert to array
      const formattedData = Object.values(grouped)
      setUsers(formattedData)
    } catch (e: unknown) {
      console.error("❌ KYC fetch error:", e)
      setError(e instanceof Error ? e.message : "Failed to fetch KYC list")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchKyc()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ===== Derived =====
  const rows = useMemo((): VerificationRow[] => {
    return users
      .map((u) => {
        // Get latest uploaded document
        const latestDoc = u.documents?.slice().sort((a, b) => {
          const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
          const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
          return dateB - dateA
        })[0]

        // Get the latest reviewed document
        const latestReviewed = u.documents
          ?.filter((d) => d.reviewedBy)
          ?.sort((a, b) => {
            const dateA = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0
            const dateB = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0
            return dateB - dateA
          })[0]

        return {
          ...u,
          submittedDate: latestDoc?.uploadedAt
            ? new Date(latestDoc.uploadedAt).toLocaleDateString("en-MY", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "—",
          _uiStatus: latestDoc ? uiDocStatus(latestDoc.status) : "uploaded",
          _uiType: (u.role === "PROVIDER"
            ? "provider"
            : u.role === "CUSTOMER"
              ? "customer"
              : "admin") as "provider" | "customer" | "admin",
          reviewedDocName: latestReviewed?.filename || latestReviewed?.type || "—",
          reviewedDocStatus: latestReviewed?.status || "—",
        }
      })
      .filter((u) => {
        const matchesSearch =
          !searchQuery ||
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === "all" || u._uiStatus === statusFilter

        const matchesType =
          typeFilter === "all" ||
          (typeFilter === "provider"
            ? u._uiType === "provider"
            : u._uiType === "customer")

        return matchesSearch && matchesStatus && matchesType
      })
  }, [users, searchQuery, statusFilter, typeFilter])

  const stats = useMemo((): VerificationStats => {
    const total = users.length
    let pending = 0,
      approved = 0,
      rejected = 0

    users.forEach((u) => {
      const latestDoc = u.documents?.slice().sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0
        return dateB - dateA
      })[0]
      const s = latestDoc ? uiDocStatus(latestDoc.status) : "uploaded"

      if (s === "uploaded") pending++
      if (s === "verified") approved++
      if (s === "rejected") rejected++
    })

    return { total, pending, approved, rejected }
  }, [users])

  // ===== Actions =====
  async function decide(userId: string, approve: boolean) {
    if (!token) return

    try {
      const res = await fetch(`${API_URL}/kyc/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approve, notes: reviewNotes || undefined }),
      })
      if (!res.ok)
        throw new Error(`Failed to ${approve ? "approve" : "reject"} (${res.status})`)

      const updated: KycUser = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
      setSelectedUser(null)
      setReviewNotes("")
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Operation failed")
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Verifications</h1>
            <p className="text-gray-600">Review and approve user verification requests</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => fetchKyc()} disabled={loading}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Verification Guidelines
            </Button>
          </div>
        </div>

        {/* Empty / Error states */}
        {error && (
          <Card>
            <CardContent className="p-6 text-red-700">{error}</CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <StatsCards stats={stats} />

        {/* Filters */}
        <FiltersCard
          searchQuery={searchQuery}
          typeFilter={typeFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onTypeFilterChange={setTypeFilter}
          onStatusFilterChange={setStatusFilter}
        />

        {/* Verifications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Verification Requests ({rows.length})</CardTitle>
            <CardDescription>
              Review user verification documents and approve or reject requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VerificationsTable rows={rows} loading={loading} onSelectUser={setSelectedUser} />
          </CardContent>
        </Card>

        {/* Review Dialog */}
        <ReviewDialog
          user={selectedUser}
          reviewNotes={reviewNotes}
          onNotesChange={setReviewNotes}
          onApprove={(userId) => decide(userId, true)}
          onReject={(userId) => decide(userId, false)}
          onClose={() => {
            setSelectedUser(null)
            setReviewNotes("")
          }}
        />
      </div>
    </AdminLayout>
  )
}
