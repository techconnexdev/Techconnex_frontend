"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Clock, Download, Eye, MapPin, Star, Check, X } from "lucide-react";
import type { ProviderRequest } from "../types";

export default function RequestCard({
  request,
  onView,
  onAccept,
  onReject,
  onDownload,
}: {
  request: ProviderRequest;
  onView: () => void;
  onAccept: () => void;
  onReject: () => void;
  onDownload?: () => void;
}) {
  const statusColor =
    request.status === "pending" ? "bg-yellow-100 text-yellow-800" :
    request.status === "accepted" ? "bg-green-100 text-green-800" :
    request.status === "rejected" ? "bg-red-100 text-red-800" :
    "bg-gray-100 text-gray-800";

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Provider info */}
          <div className="flex items-start space-x-4 flex-1">
            <Avatar className="w-12 h-12">
              <AvatarImage src={request.providerAvatar || "/placeholder.svg"} />
              <AvatarFallback>{request.providerName.split(" ").map(n=>n[0]).join("")}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900">{request.providerName}</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" /><span className="text-sm text-gray-600">{request.providerRating}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{request.providerLocation}</div>
                <div className="flex items-center gap-1"><Clock className="w-4 h-4" />Responds in {request.providerResponseTime}</div>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">{request.projectTitle}</p>
              <p className="text-sm text-gray-600 line-clamp-2">{request.coverLetter}</p>
              {request.attachmentUrl && (
                <Button variant="outline" size="sm" onClick={onDownload} className="mt-2 text-blue-600 hover:text-blue-700">
                  <Download className="w-4 h-4 mr-1" />Download PDF
                </Button>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="lg:w-80 space-y-3">
            <div className="flex justify-between items-center">
              <Badge className={statusColor}>
                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
              </Badge>
              <span className="text-sm text-gray-500">
                {new Date(request.submittedAt).toLocaleDateString()}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Bid Amount</p>
                <p className="font-semibold text-lg">RM{request.bidAmount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Timeline</p>
                <p className="font-medium">{request.proposedTimeline}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {request.skills.slice(0, 3).map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
              ))}
              {request.skills.length > 3 && (
                <Badge variant="secondary" className="text-xs">+{request.skills.length - 3} more</Badge>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onView} className="flex-1">
                <Eye className="w-4 h-4 mr-1" />View Details
              </Button>
              {request.status === "pending" && (
                <>
                  <Button size="sm" onClick={onAccept} className="bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 mr-1" />Accept
                  </Button>
                  <Button variant="outline" size="sm" onClick={onReject} className="text-red-600 hover:text-red-700">
                    <X className="w-4 h-4 mr-1" />Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
