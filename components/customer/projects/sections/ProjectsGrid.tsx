"use client";

import ProjectCard from "./ProjectCard";
import type { Project } from "../types";

export default function ProjectsGrid({ projects }: { projects: Project[] }) {
  if (!projects.length) return <p className="text-center text-gray-500">No projects found.</p>;
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
    </div>
  );
}
