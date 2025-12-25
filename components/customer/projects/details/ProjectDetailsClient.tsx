"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, User, ShieldCheck } from "lucide-react";
import type { Project, Milestone, Bid, FileItem, MessageItem } from "../types";
import OverviewTab from "./OverviewTab";
import MilestonesTab from "./MilestonesTab";
import BidsTab from "./BidsTab";
import FilesTab from "./FilesTab";
import MessagesTab from "./MessagesTab";

export default function ProjectDetailsClient({
  project, milestones, bids, files, messages,
}: {
  project: Project;
  milestones: Milestone[];
  bids: Bid[];
  files: FileItem[];
  messages: MessageItem[];
}) {
  const [active, setActive] = useState("overview");

  const badge =
    project.status === "pending" ? "bg-yellow-100 text-yellow-800" :
    project.status === "in_progress" ? "bg-blue-100 text-blue-800" :
    project.status === "completed" ? "bg-green-100 text-green-800" :
    "bg-gray-100 text-gray-800";

  return (
    <div className="space-y-8">
      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold">{project.title}</h1>
              <div className="flex flex-wrap gap-3 text-sm text-gray-600 mt-1">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${badge}`}>
                  {project.status.replace("_", " ")}
                </span>
                <span className="inline-flex items-center gap-1"><User className="w-4 h-4" />{project.provider || "—"}</span>
                <span className="inline-flex items-center gap-1"><Calendar className="w-4 h-4" />Due {project.deadline}</span>
                {project.ndaSigned && <span className="inline-flex items-center gap-1"><ShieldCheck className="w-4 h-4" />NDA</span>}
              </div>
            </div>
            <div className="w-full md:w-64">
              <Progress value={project.progress} className="h-2" />
              <div className="mt-1 text-xs text-gray-500 text-right">{project.progress}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={active} onValueChange={setActive} className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="bids">Bids</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab project={project} />
        </TabsContent>

        <TabsContent value="milestones">
          <MilestonesTab projectId={project.id} items={milestones} />
        </TabsContent>

        <TabsContent value="bids">
          <BidsTab projectId={project.id} items={bids} />
        </TabsContent>

        <TabsContent value="files">
          <FilesTab projectId={project.id} items={files} />
        </TabsContent>

        <TabsContent value="messages">
          <MessagesTab projectId={project.id} items={messages} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
