"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import ProjectFilters from "./sections/ProjectFilters";
import ProjectsGrid from "./sections/ProjectsGrid";
import ProjectsList from "./sections/ProjectsList";
import type { Project } from "./types";
import { getCompanyProjects } from "@/lib/api";

export default function ProjectsClient() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | Project["status"]>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await getCompanyProjects({
          page: 1,
          limit: 50,
        });

        // Transform service requests to Project format
        const transformedProjects: Project[] = (response.serviceRequests || []).map((sr: Record<string, unknown>) => ({
          id: sr.id as string,
          title: sr.title as string,
          description: (sr.description as string) || "",
          provider: ((sr.project as Record<string, unknown>)?.provider as Record<string, unknown>)?.name as string || null,
          status: sr.status === "OPEN" ? "pending" : sr.status === "MATCHED" ? "in_progress" : "completed",
          progress: sr.project ? 50 : 0, // Mock progress for active projects
          budget: (sr.budgetMax as number) ?? 0,
          spent: 0, // Will be calculated from payments
          deadline: (sr.timeline as string) || "",
          startDate: sr.createdAt as string,
          avatar: "/placeholder.svg",
          category: ((sr.category as string) || "").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
          milestones: Array.isArray((sr.project as Record<string, unknown>)?.milestones) ? ((sr.project as Record<string, unknown>).milestones as unknown[]).length : 0,
          completedMilestones: Array.isArray((sr.project as Record<string, unknown>)?.milestones) ? ((sr.project as Record<string, unknown>).milestones as Array<Record<string, unknown>>).filter((m) => m.status === "APPROVED").length : 0,
          proposals: Array.isArray(sr.proposals) ? sr.proposals : [],
          timeline: sr.timeline as string | undefined,
          priority: sr.priority as "Low" | "Medium" | "High" | undefined,
          ndaSigned: Boolean(sr.ndaSigned),
          aiStackSuggest: Array.isArray(sr.aiStackSuggest) ? (sr.aiStackSuggest as string[]) : [],
          // Additional fields from service request
          budgetMin: sr.budgetMin as number | undefined,
          budgetMax: sr.budgetMax as number | undefined,
          requirements: sr.requirements as string | undefined,
          deliverables: sr.deliverables as string | undefined,
          customer: sr.customer as Record<string, unknown> | undefined,
          project: sr.project as Record<string, unknown> | undefined,
        }));

        setProjects(transformedProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        // Set empty array on error
        setProjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return projects.filter((p) => {
      const matchesText =
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.provider || "").toLowerCase().includes(q);
      const matchesStatus = status === "all" || p.status === status;
      return matchesText && matchesStatus;
    });
  }, [projects, search, status]);

  if (loading) return <div className="text-center p-10">Loading projects…</div>;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Projects</h1>
          <p className="text-gray-600">Manage and track all your ICT projects</p>
        </div>
        <Link href="/customer/projects/new">
          <Button><Plus className="w-4 h-4 mr-2" />New Project</Button>
        </Link>
      </div>

      <ProjectFilters search={search} setSearch={setSearch} status={status} setStatus={setStatus} />

      <Tabs defaultValue="grid" className="space-y-6">
        <TabsList>
          <TabsTrigger value="grid">Grid</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>
        <TabsContent value="grid">
          <ProjectsGrid projects={filtered} />
        </TabsContent>
        <TabsContent value="list">
          <ProjectsList projects={filtered} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
