"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "../types";

export default function OverviewTab({ project }: { project: Project }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Project Brief</CardTitle>
          <CardDescription>Summary and key info</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-800 whitespace-pre-wrap">{project.description}</p>
          <div className="flex flex-wrap gap-2">
            {(project.aiStackSuggest || []).map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total budget</span>
            <span className="font-semibold">RM{project.budget.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Spent</span>
            <span>RM{project.spent.toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
