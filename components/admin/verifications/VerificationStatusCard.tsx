"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KycUser } from "./types"

function getStatusColor(status: string) {
  switch (status) {
    case "verified":
      return "bg-green-100 text-green-800"
    case "uploaded":
      return "bg-yellow-100 text-yellow-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    case "under_review":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

function uiDocStatus(s: string): "verified" | "rejected" | "uploaded" {
  switch (s) {
    case "verified":
      return "verified"
    case "rejected":
      return "rejected"
    case "uploaded":
    default:
      return "uploaded"
  }
}

interface VerificationStatusCardProps {
  user: KycUser
}

export function VerificationStatusCard({ user }: VerificationStatusCardProps) {
  const latestDoc = user.documents?.[0]
  const status = latestDoc ? uiDocStatus(latestDoc.status) : "uploaded"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Verification Status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(status)}>
            {status.replace("_", " ")}
          </Badge>
        </div>
        <div className="text-sm space-y-1">
          <p>
            <span className="font-medium">Latest Upload:</span>{" "}
            {latestDoc?.uploadedAt
              ? new Date(latestDoc.uploadedAt).toLocaleDateString("en-MY", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

