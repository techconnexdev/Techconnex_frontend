"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, User, Folder } from "lucide-react";
import type { Project } from "../types";

export default function ProjectsList({ projects }: { projects: Project[] }) {
  if (!projects.length) return <p className="text-center text-gray-500">No projects found.</p>;

  return (
    <div className="divide-y rounded-lg border">
      {projects.map((p) => {
        const badge =
          p.status === "pending" ? "bg-yellow-100 text-yellow-800" :
          p.status === "in_progress" ? "bg-blue-100 text-blue-800" :
          p.status === "completed" ? "bg-green-100 text-green-800" :
          "bg-gray-100 text-gray-800";

        return (
          <Link key={p.id} href={`/customer/projects/${p.id}`} className="block hover:bg-gray-50">
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{p.title}</div>
                <Badge className={badge}>{p.status.replace("_", " ")}</Badge>
              </div>
              <div className="text-sm text-gray-600 line-clamp-2">{p.description}</div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1"><Folder className="w-4 h-4" />{p.category}</span>
                <span className="flex items-center gap-1"><User className="w-4 h-4" />{p.provider || "No provider yet"}</span>
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />Due {p.deadline || "-"}</span>
              </div>
              <div>
                <Progress value={p.progress} className="h-2" />
                <div className="mt-1 text-xs text-gray-500">{p.progress}% complete</div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
