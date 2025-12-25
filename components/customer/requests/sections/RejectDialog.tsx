"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function RejectDialog({
  open, onOpenChange, onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");
  const confirm = () => { onConfirm(reason); setReason(""); onOpenChange(false); };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject Request</DialogTitle>
          <DialogDescription>Please provide a reason for rejecting this request.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="rejectReason">Reason</Label>
            <Textarea id="rejectReason" rows={4} placeholder="Explain why you're rejecting…" value={reason} onChange={(e)=>setReason(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button className="bg-red-600 hover:bg-red-700" disabled={!reason.trim()} onClick={confirm}>Reject Request</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
