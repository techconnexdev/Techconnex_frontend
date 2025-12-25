"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Bid } from "../types";

export default function BidsTab({ items }: { projectId: string; items: Bid[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Bids</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {items.map((b) => (
          <div key={b.id} className="p-4 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="font-semibold">{b.provider}</div>
              <Badge className="bg-yellow-100 text-yellow-800">{b.rating}★</Badge>
            </div>
            <div className="mt-1 text-sm text-gray-600">{b.timeline} • RM{b.amount.toLocaleString()}</div>
            <p className="mt-2 text-gray-700">{b.summary}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm">Accept</Button>
              <Button variant="outline" size="sm">Message</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
