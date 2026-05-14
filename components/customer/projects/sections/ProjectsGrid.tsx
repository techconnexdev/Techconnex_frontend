"use client";

import { useI18n } from "@/contexts/I18nProvider";
import ProjectCard from "./ProjectCard";
import type { Project } from "../types";

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  const { t } = useI18n();
  if (!projects.length)
    return (
      <p className="text-center text-gray-500">
        {t("customer.projects.list.empty.title")}
      </p>
    );
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  );
}
