"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Paperclip, Send } from "lucide-react";
import type { Opportunity, ProposalDraft } from "../types";

export default function ProposalDialog({
  open, onOpenChange, draft, setDraft, opportunity, onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  draft: ProposalDraft;
  setDraft: (v: ProposalDraft) => void;
  opportunity: Opportunity | null;
  onSubmit: () => void;
}) {
  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDraft({ ...draft, attachments: [...draft.attachments, ...files] });
  };
  const removeFile = (i: number) => setDraft({ ...draft, attachments: draft.attachments.filter((_, idx) => idx !== i) });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Submit Proposal</DialogTitle>
          <DialogDescription>Submit your proposal for “{opportunity?.title}”.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bid">Your Bid Amount (RM) *</Label>
              <Input id="bid" type="number" placeholder="15000" value={draft.bidAmount} onChange={(e) => setDraft({ ...draft, bidAmount: e.target.value })} />
              <p className="text-xs text-gray-500 mt-1">Client budget: {opportunity?.budget}</p>
            </div>
            <div>
              <Label htmlFor="time">Delivery Timeline *</Label>
              <Input id="time" placeholder="e.g., 6 weeks, by Dec 15" value={draft.timeline} onChange={(e) => setDraft({ ...draft, timeline: e.target.value })} />
            </div>
          </div>

          <div>
            <Label htmlFor="cover">Cover Letter *</Label>
            <Textarea id="cover" className="min-h-[120px]" placeholder="Introduce yourself and explain why you're the best fit…" value={draft.coverLetter} onChange={(e) => setDraft({ ...draft, coverLetter: e.target.value })} />
            <p className="text-xs text-gray-500 mt-1">{draft.coverLetter.length}/1000 characters</p>
          </div>

          <div>
            <Label htmlFor="milestones">Project Milestones (Optional)</Label>
            <Textarea id="milestones" className="min-h-[100px]" placeholder="Break down your project into milestones…" value={draft.milestones} onChange={(e) => setDraft({ ...draft, milestones: e.target.value })} />
          </div>

          <div>
            <Label>Attachments (Optional)</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input id="file-upload" type="file" multiple onChange={addFiles} className="hidden" accept=".pdf,.doc,.docx,.txt,.jpg,.png" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Paperclip className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">Click to upload portfolio, resume, or relevant documents</p>
                <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB each)</p>
              </label>
            </div>
            {draft.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {draft.attachments.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{f.name}</span>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(i)}>Remove</Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-2">Proposal Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Your Bid:</span><span className="font-semibold">RM {draft.bidAmount || "0"}</span></div>
                <div className="flex justify-between"><span>Timeline:</span><span>{draft.timeline || "Not specified"}</span></div>
                <div className="flex justify-between"><span>Attachments:</span><span>{draft.attachments.length} files</span></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onSubmit}><Send className="w-4 h-4 mr-2" />Submit Proposal</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
