"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Project } from "./types";
import { useI18n } from "@/contexts/I18nProvider";

interface ProjectsCardProps {
  projects: Project[];
  isProvider: boolean;
  isCustomer: boolean;
}

export function ProjectsCard({
  projects,
  isProvider,
  isCustomer,
}: ProjectsCardProps) {
  const { t } = useI18n();

  const title = isProvider
    ? t("admin.users.projects.titleProvider")
    : isCustomer
      ? t("admin.users.projects.titleCustomer")
      : t("admin.users.projects.titleGeneric");

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/admin/projects/${project.id}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg active:bg-gray-50 sm:hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex-1 min-w-0 w-full sm:w-auto">
                  <p className="font-medium text-sm sm:text-base break-words">
                    {project.title}
                  </p>
                  {project.description && (
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1 break-words">
                      {project.description}
                    </p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 sm:gap-4 mt-2 text-xs text-gray-400">
                    <span>
                      {t("admin.users.projects.statusPrefix")}:{" "}
                      <Badge variant="outline" className="ml-1 text-xs">
                        {project.status}
                      </Badge>
                    </span>
                    {project.customer && (
                      <span className="break-words">
                        {t("admin.users.projects.customer", {
                          name: project.customer.name,
                        })}
                      </span>
                    )}
                    {project.provider && (
                      <span className="break-words">
                        {t("admin.users.projects.provider", {
                          name: project.provider.name,
                        })}
                      </span>
                    )}
                    {project.approvedPrice ? (
                      <span>
                        {t("admin.users.projects.approvedPrice", {
                          amount: Number(project.approvedPrice).toLocaleString(),
                        })}
                      </span>
                    ) : project.budgetMin && project.budgetMax ? (
                      <span>
                        {t("admin.users.projects.budget", {
                          min: Number(project.budgetMin).toLocaleString(),
                          max: Number(project.budgetMax).toLocaleString(),
                        })}
                      </span>
                    ) : null}
                    <span>
                      {t("admin.users.projects.created", {
                        date: new Date(project.createdAt).toLocaleDateString(),
                      })}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  {t("admin.users.projects.viewDetails")}
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
