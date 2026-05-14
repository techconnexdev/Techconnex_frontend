"use client";

import Link from "next/link";
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

export default function ProjectsList({ projects }: { projects: Project[] }) {
  const { t } = useI18n();

  const statusLabel = (status: ProjectStatus) => {
    switch (status) {
      case "pending":
        return t("customer.projects.list.filter.pending");
      case "in_progress":
        return t("customer.projects.list.filter.inProgress");
      case "completed":
        return t("customer.projects.list.filter.completed");
      case "on_hold":
        return t("customer.projects.list.filter.onHold");
      default:
        return status;
    }
  };

  if (!projects.length)
    return (
      <p className="text-center text-gray-500">
        {t("customer.projects.list.empty.title")}
      </p>
    );

  return (
    <div className="divide-y rounded-lg border">
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/customer/projects/${p.id}`}
          className="block hover:bg-gray-50"
        >
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{p.title}</div>
              <Badge className={statusBadgeClass(p.status)}>
                {statusLabel(p.status)}
              </Badge>
            </div>
            <div className="text-sm text-gray-600 line-clamp-2">
              {p.description}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Folder className="w-4 h-4" />
                {p.category}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {p.provider || t("customer.projects.list.noProvider")}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {t("customer.projects.list.due")}{" "}
                {p.deadline || t("customer.projects.list.dueDash")}
              </span>
            </div>
            <div>
              <Progress value={p.progress} className="h-2" />
              <div className="mt-1 text-xs text-gray-500">
                {t("customer.projects.demo.percentComplete", { n: p.progress })}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
