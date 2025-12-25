"use client"

import { Badge } from "@/components/ui/badge"
import { KycDoc } from "./types"

function getDocumentStatusColor(status: string) {
  switch (status) {
    case "verified":
      return "text-green-600"
    case "uploaded":
      return "text-blue-600"
    case "rejected":
      return "text-red-600"
    default:
      return "text-gray-600"
  }
}

interface ReviewHistoryCardProps {
  documents: KycDoc[]
}

export function ReviewHistoryCard({ documents }: ReviewHistoryCardProps) {
  const reviewedDocs = documents.filter((doc) => doc.reviewedBy)

  if (reviewedDocs.length === 0) return null

  return (
    <div className="bg-gray-50 border rounded-lg p-4 text-sm space-y-3">
      <h3 className="font-semibold text-gray-800">Review History</h3>
      <div className="divide-y">
        {reviewedDocs.map((doc) => (
          <div key={doc.id} className="pt-2">
            <p>
              <span className="font-medium text-gray-700">📄 Document:</span> {doc.filename || doc.type}
            </p>
            <p>
              <span className="font-medium text-gray-700">🗂 Status:</span>{" "}
              <Badge variant="outline" className={getDocumentStatusColor(doc.status)}>
                {doc.status}
              </Badge>
            </p>
            <p>
              <span className="font-medium text-gray-700">📝 Review Notes:</span>{" "}
              {doc.reviewNotes || "—"}
            </p>
            <p>
              <span className="font-medium text-gray-700">👤 Reviewed By:</span> {doc.reviewedBy || "—"}
            </p>
            <p>
              <span className="font-medium text-gray-700">📅 Reviewed At:</span>{" "}
              {doc.reviewedAt
                ? new Date(doc.reviewedAt).toLocaleString("en-MY", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

