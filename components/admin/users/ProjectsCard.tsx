"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Project } from "./types"

interface ProjectsCardProps {
  projects: Project[]
  isProvider: boolean
  isCustomer: boolean
}

export function ProjectsCard({ projects, isProvider, isCustomer }: ProjectsCardProps) {
  const title = isProvider
    ? "Projects as Provider"
    : isCustomer
      ? "Projects as Customer"
      : "Projects"

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
                  <p className="font-medium text-sm sm:text-base break-words">{project.title}</p>
                  {project.description && (
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mt-1 break-words">{project.description}</p>
                  )}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2 sm:gap-4 mt-2 text-xs text-gray-400">
                    <span>
                      Status: <Badge variant="outline" className="ml-1 text-xs">{project.status}</Badge>
                    </span>
                    {project.customer && <span className="break-words">Customer: {project.customer.name}</span>}
                    {project.provider && <span className="break-words">Provider: {project.provider.name}</span>}
                    {project.approvedPrice ? (
                      <span>
                        Approved Price: RM {Number(project.approvedPrice).toLocaleString()}
                      </span>
                    ) : project.budgetMin && project.budgetMax ? (
                      <span>
                        Budget: RM {Number(project.budgetMin).toLocaleString()} - RM{" "}
                        {Number(project.budgetMax).toLocaleString()}
                      </span>
                    ) : null}
                    <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                  View Details
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

