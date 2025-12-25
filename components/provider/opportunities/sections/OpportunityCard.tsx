"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, DollarSign, Eye, MapPin, Users, CheckCircle } from "lucide-react";
import type { Opportunity } from "../types";

const scoreColor = (n: number) =>
  n >= 90 ? "text-green-600 bg-green-100" : n >= 80 ? "text-blue-600 bg-blue-100" : n >= 70 ? "text-yellow-600 bg-yellow-100" : "text-gray-600 bg-gray-100";

export default function OpportunityCard({
  opportunity, onView, onSubmit,
}: {
  opportunity: Opportunity;
  onView: () => void;
  onSubmit: () => void;
}) {
  const o = opportunity;
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-xl">{o.title}</CardTitle>
              {o.urgent && <Badge className="bg-red-100 text-red-800"><Clock className="w-3 h-3 mr-1" />Urgent</Badge>}
              {o.verified && <Badge className="bg-blue-100 text-blue-800">Verified Client</Badge>}
              {o.hasSubmitted && <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Submitted</Badge>}
            </div>
            <CardDescription className="text-base">{o.description}</CardDescription>
          </div>
          <Badge className={`${scoreColor(o.matchScore)} font-semibold text-sm px-3 py-1`}>{o.matchScore}% match</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Avatar><AvatarImage src={o.avatar || "/placeholder.svg"} /><AvatarFallback>{o.client.charAt(0)}</AvatarFallback></Avatar>
            <div>
              <p className="font-medium">{o.client}</p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>★ {o.clientRating}</span><span>•</span>
                <span>{o.clientJobs} jobs</span><span>•</span>
                <span className="inline-flex items-center"><MapPin className="w-3 h-3 mr-1" />{o.location}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center text-green-600 font-semibold"><DollarSign className="w-4 h-4 mr-1" />{o.budget}</div>
            <p className="text-sm text-gray-500">{o.timeline}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {o.skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{o.postedTime}</span>
            <span className="inline-flex items-center"><Users className="w-4 h-4 mr-1" />{o.proposals} proposals</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onView}><Eye className="w-4 h-4 mr-2" />View Details</Button>
            <Button size="sm" onClick={onSubmit} disabled={o.hasSubmitted}>
              {o.hasSubmitted ? <><CheckCircle className="w-4 h-4 mr-2" />Submitted</> : "Submit Proposal"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
