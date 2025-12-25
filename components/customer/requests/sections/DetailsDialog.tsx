"use client";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Download, MapPin, Star, X, Check } from "lucide-react";
import type { ProviderRequest } from "../types";

export default function DetailsDialog({
  open, onOpenChange, request, onAccept, onReject, onDownload,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: ProviderRequest | null;
  onAccept: () => void;
  onReject: () => void;
  onDownload: (url: string) => void;
}) {
  if (!request) return null;
  const statusColor =
    request.status === "pending" ? "bg-yellow-100 text-yellow-800" :
    request.status === "accepted" ? "bg-green-100 text-green-800" :
    request.status === "rejected" ? "bg-red-100 text-red-800" :
    "bg-gray-100 text-gray-800";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request Details</DialogTitle>
          <DialogDescription>Detailed information about {request.providerName}&apos;s request</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider block */}
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={request.providerAvatar || "/placeholder.svg"} />
              <AvatarFallback>{request.providerName.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-xl font-semibold">{request.providerName}</h3>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-400 fill-current" />{request.providerRating} rating</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{request.providerLocation}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{request.providerResponseTime} response time</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Project</h4>
              <p className="text-gray-900">{request.projectTitle}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Bid Amount</h4>
              <p className="text-2xl font-bold text-green-600">RM{request.bidAmount.toLocaleString()}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Proposed Timeline</h4>
              <p className="text-gray-900">{request.proposedTimeline}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Status</h4>
              <Badge className={statusColor}>{request.status[0].toUpperCase()+request.status.slice(1)}</Badge>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Cover Letter</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{request.coverLetter}</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">Skills</h4>
            <div className="flex flex-wrap gap-2">
              {request.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
            </div>
          </div>

          {request.attachmentUrl && (
            <div>
              <h4 className="font-semibold mb-2">Proposal Attachment</h4>
              <Button variant="outline" onClick={() => onDownload(request.attachmentUrl!)} className="text-blue-600 hover:text-blue-700">
                <Download className="w-4 h-4 mr-2" />Download PDF
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {request.status === "pending" && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={onReject} className="text-red-600 hover:text-red-700">
                <X className="w-4 h-4 mr-2" />Reject
              </Button>
              <Button onClick={onAccept} className="bg-green-600 hover:bg-green-700">
                <Check className="w-4 h-4 mr-2" />Accept Request
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
