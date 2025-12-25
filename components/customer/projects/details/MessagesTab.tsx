"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { MessageItem } from "../types";

export default function MessagesTab({ items }: { projectId: string; items: MessageItem[] }) {
  const [list, setList] = useState(items);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setList((prev) => [...prev, { id: crypto.randomUUID(), author: "You", at: new Date().toISOString(), text }]);
    setText("");
  };

  return (
    <Card>
      <CardHeader><CardTitle>Messages</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {list.map((m) => (
            <div key={m.id} className="p-3 border rounded-lg">
              <div className="text-sm text-gray-600">{m.author} • {new Date(m.at).toLocaleString()}</div>
              <div className="mt-1">{m.text}</div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="Type a message…" value={text} onChange={(e) => setText(e.target.value)} />
          <Button onClick={send}>Send</Button>
        </div>
      </CardContent>
    </Card>
  );
}
