"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminLayout } from "@/components/admin-layout";
import { Download, FileText, RefreshCw } from "lucide-react";
import { StatsCards } from "@/components/admin/verifications/StatsCards";
import { FiltersCard } from "@/components/admin/verifications/FiltersCard";
import { VerificationsTable } from "@/components/admin/verifications/VerificationsTable";
import { ReviewDialog } from "@/components/admin/verifications/ReviewDialog";
import type {
  KycUser,
  KycDocStatus,
  KycStatus,
  Role,
  VerificationStats,
  VerificationRow,
} from "@/components/admin/verifications/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Map backend KycStatus -> UI status pills
function uiDocStatus(s: KycDocStatus): "verified" | "rejected" | "uploaded" {
  switch (s) {
    case "verified":
      return "verified";
    case "rejected":
      return "rejected";
    case "uploaded":
    default:
      return "uploaded";
  }
}

function csvEscape(value: string | number | undefined | null): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadVerificationCsv(rows: VerificationRow[]) {
  const generated = new Date().toISOString();
  const header = [
    "Name",
    "Email",
    "Type",
    "Account KYC status",
    "Latest verification status",
    "Submitted date",
    "Reviewed document",
    "Document review status",
    "User ID",
  ];

  const lines: string[] = [
    header.map(csvEscape).join(","),
    ...rows.map((r) =>
      [
        r.name,
        r.email,
        r._uiType,
        r.kycStatus,
        r._uiStatus,
        r.submittedDate,
        r.reviewedDocName,
        r.reviewedDocStatus,
        r.id,
      ]
        .map(csvEscape)
        .join(","),
    ),
  ];

  const blob = new Blob(["\uFEFF", lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = generated.slice(0, 16).replace(/[:T]/g, "-");
  a.href = url;
  a.download = `verification-report-${stamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminVerificationsPage() {
  const { t } = useI18n();
  // ===== UI state =====
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<KycUser | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [guidelinesOpen, setGuidelinesOpen] = useState(false);

  // ===== Data state =====
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<KycUser[]>([]);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token"));
    }
  }, []);

  async function fetchKyc() {
    const currentToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!currentToken) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/kyc/`, {
        headers: {
          Authorization: `Bearer ${currentToken}`,
        },
        cache: "no-store",
      });
      if (!res.ok)
        throw new Error(
          t("admin.verifications.errors.fetchList", { code: res.status })
        );

      const rawData = await res.json();

      // Group docs by userId
      const grouped: Record<string, KycUser> = {};

      rawData.forEach((item: Record<string, unknown>) => {
        const u = item.user as Record<string, unknown>;
        const userId = u.id as string;
        if (!grouped[userId]) {
          grouped[userId] = {
            id: userId,
            name: (u.name as string) || t("admin.verifications.unnamed"),
            email: u.email as string,
            role: (Array.isArray(u.role) ? u.role[0] : u.role) as Role,
            kycStatus: u.kycStatus as KycStatus,
            createdAt: u.createdAt as string,
            profile: u.profile as Record<string, unknown> | undefined,
            documents: [],
          };
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
        });
      });

      // Convert to array
      const formattedData = Object.values(grouped);
      setUsers(formattedData);
    } catch (e: unknown) {
      console.error("❌ KYC fetch error:", e);
      setError(
        e instanceof Error
          ? e.message
          : t("admin.verifications.errors.fetchGeneric")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchKyc();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ===== Derived =====
  const rows = useMemo((): VerificationRow[] => {
    return users
      .map((u) => {
        // Get latest uploaded document
        const latestDoc = u.documents?.slice().sort((a, b) => {
          const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
          const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
          return dateB - dateA;
        })[0];

        // Get the latest reviewed document
        const latestReviewed = u.documents
          ?.filter((d) => d.reviewedBy)
          ?.sort((a, b) => {
            const dateA = a.reviewedAt ? new Date(a.reviewedAt).getTime() : 0;
            const dateB = b.reviewedAt ? new Date(b.reviewedAt).getTime() : 0;
            return dateB - dateA;
          })[0];

        const emDash = t("admin.users.common.emDash");
        return {
          ...u,
          submittedDate: latestDoc?.uploadedAt
            ? new Date(latestDoc.uploadedAt).toLocaleDateString("en-MY", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : emDash,
          _uiStatus: latestDoc ? uiDocStatus(latestDoc.status) : "uploaded",
          _uiType: (u.role === "PROVIDER"
            ? "provider"
            : u.role === "CUSTOMER"
              ? "customer"
              : "admin") as "provider" | "customer" | "admin",
          reviewedDocName:
            latestReviewed?.filename || latestReviewed?.type || emDash,
          reviewedDocStatus: latestReviewed?.status || emDash,
        };
      })
      .filter((u) => {
        const matchesSearch =
          !searchQuery ||
          u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus =
          statusFilter === "all" || u._uiStatus === statusFilter;

        const matchesType =
          typeFilter === "all" ||
          (typeFilter === "provider"
            ? u._uiType === "provider"
            : u._uiType === "customer");

        return matchesSearch && matchesStatus && matchesType;
      });
  }, [users, searchQuery, statusFilter, typeFilter, t]);

  const stats = useMemo((): VerificationStats => {
    const total = users.length;
    let pending = 0,
      approved = 0,
      rejected = 0;

    users.forEach((u) => {
      const latestDoc = u.documents?.slice().sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateB - dateA;
      })[0];
      const s = latestDoc ? uiDocStatus(latestDoc.status) : "uploaded";

      if (s === "uploaded") pending++;
      if (s === "verified") approved++;
      if (s === "rejected") rejected++;
    });

    return { total, pending, approved, rejected };
  }, [users]);

  // ===== Actions =====
  async function decide(userId: string, approve: boolean) {
    const currentToken = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!currentToken) return;

    try {
      const res = await fetch(`${API_URL}/kyc/${userId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${currentToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approve, notes: reviewNotes || undefined }),
      });
      if (!res.ok)
        throw new Error(
          approve
            ? t("admin.verifications.errors.approveFailed", {
                code: res.status,
              })
            : t("admin.verifications.errors.rejectFailed", {
                code: res.status,
              })
        );

      // Refetch the full KYC list so the table shows correct server state (e.g. role stays provider/customer, not admin)
      await fetchKyc();
      setSelectedUser(null);
      setReviewNotes("");
    } catch (e: unknown) {
      alert(
        e instanceof Error
          ? e.message
          : t("admin.verifications.alert.operationFailed")
      );
    }
  }

  return (
    <AdminLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("admin.verifications.page.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t("admin.verifications.page.subtitle")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => fetchKyc()}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("admin.verifications.actions.refresh")}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => downloadVerificationCsv(rows)}
            >
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">
                {t("admin.verifications.actions.exportReport")}
              </span>
              <span className="sm:hidden">
                {t("admin.verifications.actions.export")}
              </span>
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => setGuidelinesOpen(true)}
            >
              <FileText className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">
                {t("admin.verifications.actions.guidelinesFull")}
              </span>
              <span className="sm:hidden">
                {t("admin.verifications.actions.guidelinesShort")}
              </span>
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
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="text-lg sm:text-xl">
              {t("admin.verifications.table.title", { count: rows.length })}
            </CardTitle>
            <CardDescription className="text-sm">
              {t("admin.verifications.table.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <VerificationsTable
              rows={rows}
              loading={loading}
              onSelectUser={setSelectedUser}
            />
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
            setSelectedUser(null);
            setReviewNotes("");
          }}
        />

        <Dialog open={guidelinesOpen} onOpenChange={setGuidelinesOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Verification guidelines</DialogTitle>
              <DialogDescription>
                Use this checklist when reviewing KYC documents. This does not
                replace your organisation&apos;s compliance policy.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-sm text-gray-700">
              <section>
                <h3 className="font-semibold text-gray-900">General</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    Match the legal name on documents to the user&apos;s profile
                    and email where possible.
                  </li>
                  <li>
                    Reject blurry, cropped, or expired IDs; ask the user to
                    re-upload a clear, full document.
                  </li>
                  <li>
                    Add review notes for every rejection so the user knows what
                    to fix.
                  </li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900">Providers</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    Expect government-issued photo ID (e.g. NRIC, passport)
                    appropriate to your jurisdiction.
                  </li>
                  <li>
                    Confirm the document type matches what was submitted
                    (PROVIDER_ID).
                  </li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900">Companies (customers)</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    Company registration certificate (COMPANY_REG) should be
                    current and legible.
                  </li>
                  <li>
                    Director or authorised signatory ID (COMPANY_DIRECTOR_ID)
                    may be required alongside registration.
                  </li>
                </ul>
              </section>
              <section>
                <h3 className="font-semibold text-gray-900">Statuses</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>
                    <strong>Pending / uploaded</strong> — awaiting your review.
                  </li>
                  <li>
                    <strong>Approved (verified)</strong> — document accepted;
                    user can proceed per product rules.
                  </li>
                  <li>
                    <strong>Rejected</strong> — document declined; user should
                    upload a corrected file.
                  </li>
                </ul>
              </section>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
