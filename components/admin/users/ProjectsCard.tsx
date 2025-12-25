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
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/admin/projects/${project.id}`}>
              <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <div className="flex-1">
                  <p className="font-medium">{project.title}</p>
                  {project.description && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{project.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>
                      Status: <Badge variant="outline" className="ml-1">{project.status}</Badge>
                    </span>
                    {project.customer && <span>Customer: {project.customer.name}</span>}
                    {project.provider && <span>Provider: {project.provider.name}</span>}
                    {project.budgetMin && project.budgetMax && (
                      <span>
                        Budget: RM {Number(project.budgetMin).toLocaleString()} - RM{" "}
                        {Number(project.budgetMax).toLocaleString()}
                      </span>
                    )}
                    <span>Created: {new Date(project.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
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

