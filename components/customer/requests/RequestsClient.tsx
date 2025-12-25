"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { MessageSquare, Search, RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

import type { Option, ProviderRequest } from "./types";
import StatsBar from "./sections/StatsBar";
import RequestCard from "./sections/RequestCard";
import DetailsDialog from "./sections/DetailsDialog";
import RejectDialog from "./sections/RejectDialog";

// Types for API response
interface ApiServiceRequest {
  id: string;
  customerId: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  aiStackSuggest?: string[];
  priority: string;
  status: string;
  ndaSigned: boolean;
  proposals?: ApiProposal[];
}

interface ApiProposal {
  id: string;
  providerId: string;
  bidAmount: number;
  deliveryTime?: number;
  coverLetter: string;
  createdAt: string;
  attachmentUrl?: string;
  provider?: {
    name?: string;
    location?: string;
  };
}

export default function RequestsClient({
  projects,
  sortOptions,
}: {
  projects: Option[];
  sortOptions: Option[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState(projects[0]?.value ?? "all");
  const [sortBy, setSortBy] = useState(sortOptions[0]?.value ?? "newest");

  const [requests, setRequests] = useState<ProviderRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ProviderRequest | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  // Load requests (mapped from your original page) :contentReference[oaicite:1]{index=1}
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const user =
        typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
      const userId = user?.id;
      if (!userId) {
        setError("User not found.");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`http://localhost:4000/api/service-requests/${userId}`);
        const data = await res.json();
        const list: ProviderRequest[] = [];
        ((data.serviceRequests as ApiServiceRequest[]) || []).forEach((sr: ApiServiceRequest) => {
          ((sr.proposals as ApiProposal[]) || []).forEach((p: ApiProposal) => {
            list.push({
              id: p.id,
              providerId: p.providerId,
              providerName: p.provider?.name || "Unknown Provider",
              providerAvatar: "/placeholder.svg?height=40&width=40",
              providerRating: 4.5,
              providerLocation: p.provider?.location || "-",
              providerResponseTime: "-",
              serviceRequestId: sr.id,
              projectTitle: sr.title,
              bidAmount: p.bidAmount,
              proposedTimeline: p.deliveryTime ? `${p.deliveryTime} days` : "-",
              coverLetter: p.coverLetter,
              status: "pending",
              submittedAt: p.createdAt,
              skills: sr.aiStackSuggest || [],
              portfolio: [],
              experience: "-",
              attachmentUrl: p.attachmentUrl,
              serviceRequest: {
                id: sr.id,
                customerId: sr.customerId,
                title: sr.title,
                description: sr.description,
                category: sr.category,
                budgetMin: sr.budgetMin,
                budgetMax: sr.budgetMax,
                timeline: sr.timeline,
                aiStackSuggest: sr.aiStackSuggest || [],
                priority: sr.priority,
                status: sr.status,
                ndaSigned: sr.ndaSigned,
              },
            });
          });
        });
        setRequests(list);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to fetch requests.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return requests
      .filter((r) => {
        const matchesSearch =
          r.providerName.toLowerCase().includes(q) ||
          r.projectTitle.toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || r.status === statusFilter;
        const matchesProject = projectFilter === "all" || r.serviceRequestId === projectFilter;
        return matchesSearch && matchesStatus && matchesProject;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
          case "oldest":
            return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          case "highest-bid":
            return b.bidAmount - a.bidAmount;
          case "lowest-bid":
            return a.bidAmount - b.bidAmount;
          case "rating":
            return b.providerRating - a.providerRating;
          default:
            return 0;
        }
      });
  }, [requests, searchQuery, statusFilter, projectFilter, sortBy]);

  const stats = {
    total: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    accepted: requests.filter((r) => r.status === "accepted").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const accept = async (requestId: string) => {
    const req = requests.find((r) => r.id === requestId);
    if (!req) return;

    const user =
      typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user") || "null") : null;
    const userId = user?.id;
    if (!userId) {
      toast("User not found", { description: "Please log in again." });
      return;
    }

    // Payload preserved from your original page :contentReference[oaicite:2]{index=2}
    const payload = {
      customerId: userId,
      providerId: req.providerId,
      title: req.serviceRequest.title,
      description: req.serviceRequest.description,
      category: req.serviceRequest.category,
      budgetMin: req.bidAmount,
      budgetMax: req.bidAmount,
      timeline: req.proposedTimeline,
      skills: req.serviceRequest.aiStackSuggest,
      priority: req.serviceRequest.priority,
      status: "IN_PROGRESS",
      ndaSigned: req.serviceRequest.ndaSigned,
    };

    try {
      const r1 = await fetch("http://localhost:4000/api/projects/accept-provider", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r1.ok) throw new Error("Failed to create project");

      // NOTE: original code used a likely-typo endpoint: /service-requests/dservice-request/{id}
      // If your API expects /service-requests/{id}, update here.
      await fetch(`http://localhost:4000/api/service-requests/${req.serviceRequestId}`, {
        method: "DELETE",
      });

      setRequests((prev) => prev.map((x) => (x.id === requestId ? { ...x, status: "accepted" } as ProviderRequest : x)));
      toast("Request Accepted", { description: "Provider notified. Project created." });
    } catch (e: unknown) {
      toast("Failed to accept request", { description: e instanceof Error ? e.message : "An error occurred" });
    }
  };

  const reject = (requestId: string) => {
    setRequests((prev) => prev.map((x) => (x.id === requestId ? { ...x, status: "rejected" } : x)));
    toast("Request Rejected", { description: "The provider has been notified." });
  };

  const downloadAttachment = async (attachmentUrl: string) => {
    const full = `http://localhost:4000/api/${attachmentUrl}`;
    try {
      const res = await fetch(full);
      if (!res.ok) throw new Error("Failed to download file");
      const blob = await res.blob();
      const name = (attachmentUrl.split(/[\\/]/).pop() || "attachment") + ".pdf";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      toast("Failed to download PDF", { description: e instanceof Error ? e.message : "An error occurred" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-[400px] text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Provider Requests</h1>
          <p className="text-gray-600">Manage requests from providers for your projects</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline"><Download className="w-4 h-4 mr-2" />Export</Button>
          <Button variant="outline" onClick={() => location.reload()}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by provider name or project..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="accepted">Accepted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>

              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-48"><SelectValue placeholder="Project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Sort by" /></SelectTrigger>
                <SelectContent>
                  {sortOptions.map((o) => (<SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <Card><CardContent className="p-12 text-center"><MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" /><h3 className="text-lg font-semibold">No requests found</h3><p className="text-gray-600">No provider requests match your current filters.</p></CardContent></Card>
        ) : (
          filtered.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              onView={() => { setSelected(r); setViewOpen(true); }}
              onAccept={() => accept(r.id)}
              onReject={() => { setSelected(r); setRejectOpen(true); }}
              onDownload={() => r.attachmentUrl && downloadAttachment(r.attachmentUrl)}
            />
          ))
        )}
      </div>

      {/* Dialogs */}
      <DetailsDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        request={selected}
        onAccept={() => { if (selected) accept(selected.id); setViewOpen(false); }}
        onReject={() => { setViewOpen(false); setRejectOpen(true); }}
        onDownload={(url) => downloadAttachment(url)}
      />

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onConfirm={() => { if (selected) reject(selected.id); }}
      />
    </div>
  );
}
