"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, User, Folder } from "lucide-react";
import { useI18n } from "@/contexts/I18nProvider";
import type { Project, ProjectStatus } from "../types";

function statusBadgeClass(status: ProjectStatus) {
  if (status === "pending") return "bg-yellow-100 text-yellow-800";
  if (status === "in_progress") return "bg-blue-100 text-blue-800";
  if (status === "completed") return "bg-green-100 text-green-800";
  return "bg-gray-100 text-gray-800";
}

export default function ProjectCard({ project }: { project: Project }) {
  const { t } = useI18n();
  const statusLabel = (() => {
    switch (project.status) {
      case "pending":
        return t("customer.projects.list.filter.pending");
      case "in_progress":
        return t("customer.projects.list.filter.inProgress");
      case "completed":
        return t("customer.projects.list.filter.completed");
      case "on_hold":
        return t("customer.projects.list.filter.onHold");
      default:
        return project.status;
    }
  })();

  return (
    <Link href={`/customer/projects/${project.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold truncate">{project.title}</h3>
            <Badge className={statusBadgeClass(project.status)}>
              {statusLabel}
            </Badge>
          </div>
          <div className="text-sm text-gray-500 flex items-center gap-2">
            <Folder className="w-4 h-4" /> {project.category}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {project.description}
          </p>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-gray-600">
              <User className="w-4 h-4" />
              {project.provider || t("customer.projects.list.noProvider")}
            </div>
            <div className="flex items-center gap-1 text-gray-600">
              <Calendar className="w-4 h-4" />
              {t("customer.projects.list.due")}{" "}
              {project.deadline || t("customer.projects.list.dueDash")}
            </div>
          </div>

          <div>
            <Progress value={project.progress} className="h-2" />
            <div className="mt-1 text-xs text-gray-500">
              {t("customer.projects.demo.percentComplete", {
                n: project.progress,
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
