"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Milestone } from "../types";

export default function MilestonesTab({
  items,
}: { projectId: string; items: Milestone[] }) {
  const [list, setList] = useState(items);

  const release = (id: string) => {
    setList((prev) => prev.map((m) => (m.id === id ? { ...m, status: "RELEASED" } : m)));
  };

  return (
    <Card>
      <CardHeader><CardTitle>Milestones</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {list.map((m) => {
          const badge =
            m.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
            m.status === "PAID" ? "bg-blue-100 text-blue-800" :
            "bg-green-100 text-green-800";
          return (
            <div key={m.id} className="p-4 border rounded-lg flex items-center justify-between">
              <div>
                <div className="font-medium">{m.title}</div>
                <div className="text-sm text-gray-600">Due {m.due}</div>
                <div className="text-sm mt-1">Amount: <b>RM{m.amount.toLocaleString()}</b></div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={badge}>{m.status}</Badge>
                {m.status !== "RELEASED" && (
                  <Button size="sm" onClick={() => release(m.id)}>Release</Button>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
