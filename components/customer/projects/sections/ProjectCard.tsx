"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, User, Folder } from "lucide-react";
import type { Project } from "../types";

export default function ProjectCard({ project }: { project: Project }) {
  const badge =
    project.status === "pending" ? "bg-yellow-100 text-yellow-800" :
    project.status === "in_progress" ? "bg-blue-100 text-blue-800" :
    project.status === "completed" ? "bg-green-100 text-green-800" :
    "bg-gray-100 text-gray-800";

  return (
    <Link href={`/customer/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold truncate">{project.title}</h3>
            <Badge className={badge}>{project.status.replace("_", " ")}</Badge>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Folder className="w-4 h-4" /> {project.category}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <User className="w-4 h-4" />
              {project.provider || "No provider yet"}
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-4 h-4" />
              Due {project.deadline || "-"}
            </div>
          </div>

          <div>
            <Progress value={project.progress} className="h-2" />
            <div className="mt-1 text-xs text-gray-500">{project.progress}% complete</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
