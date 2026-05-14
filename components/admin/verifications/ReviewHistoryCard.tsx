"use client"

import { useI18n } from "@/contexts/I18nProvider"
import { Badge } from "@/components/ui/badge"
import { KycDoc } from "./types"
import { docStatusLabel } from "./verification-i18n-maps"

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
  const { t } = useI18n()
  const reviewedDocs = documents.filter((doc) => doc.reviewedBy)

  if (reviewedDocs.length === 0) return null

  return (
    <div className="bg-gray-50 border rounded-lg p-3 sm:p-4 text-xs sm:text-sm space-y-3">
      <h3 className="font-semibold text-gray-800 text-sm sm:text-base">
        {t("admin.verifications.reviewHistory.title")}
      </h3>
      <div className="divide-y">
        {reviewedDocs.map((doc) => (
          <div key={doc.id} className="pt-2 space-y-1.5 sm:space-y-2">
            <p className="break-words">
              <span className="font-medium text-gray-700">
                📄 {t("admin.verifications.reviewHistory.document")}
              </span>{" "}
              {doc.filename || doc.type}
            </p>
            <p>
              <span className="font-medium text-gray-700">
                🗂 {t("admin.verifications.reviewHistory.status")}
              </span>{" "}
              <Badge variant="outline" className={`text-xs ${getDocumentStatusColor(doc.status)}`}>
                {docStatusLabel(doc.status, t)}
              </Badge>
            </p>
            <p className="break-words">
              <span className="font-medium text-gray-700">
                📝 {t("admin.verifications.reviewHistory.notes")}
              </span>{" "}
              {doc.reviewNotes || t("admin.users.common.emDash")}
            </p>
            <p className="break-words">
              <span className="font-medium text-gray-700">👤 Reviewed By:</span> {doc.reviewedBy || "—"}
            </p>
            <p>
              <span className="font-medium text-gray-700">
                📅 {t("admin.verifications.reviewHistory.reviewedAt")}
              </span>{" "}
              {doc.reviewedAt
                ? new Date(doc.reviewedAt).toLocaleString("en-MY", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : t("admin.users.common.emDash")}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

