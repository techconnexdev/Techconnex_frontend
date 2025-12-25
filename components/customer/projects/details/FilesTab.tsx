"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload } from "lucide-react";
import type { FileItem } from "../types";

export default function FilesTab({ items }: { projectId: string; items: FileItem[] }) {
  const download = async (f: FileItem) => {
    // wire to your backend when ready
    console.log("download", f);
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <div><CardTitle>Files</CardTitle></div>
        <Button size="sm"><Upload className="w-4 h-4 mr-1" />Upload</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((f) => (
          <div key={f.id} className="p-3 border rounded-lg flex items-center justify-between">
            <div>
              <div className="font-medium">{f.name}</div>
              <div className="text-xs text-gray-600">{f.size} • {f.uploadedAt}</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => download(f)}>
              <Download className="w-4 h-4 mr-1" />Download
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
