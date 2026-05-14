"use client"

import { useI18n } from "@/contexts/I18nProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { KycUser } from "./types"
import { PILL_STATUS_KEYS } from "./verification-i18n-maps"

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
  const { t } = useI18n()
  const latestDoc = user.documents?.[0]
  const status = latestDoc ? uiDocStatus(latestDoc.status) : "uploaded"

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-base sm:text-lg">
          {t("admin.verifications.statusCard.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(status)}>
            {t(PILL_STATUS_KEYS[status])}
          </Badge>
        </div>
        <div className="text-xs sm:text-sm space-y-1">
          <p>
            <span className="font-medium">
              {t("admin.verifications.statusCard.latestUpload")}
            </span>{" "}
            {latestDoc?.uploadedAt
              ? new Date(latestDoc.uploadedAt).toLocaleDateString("en-MY", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : t("admin.users.common.emDash")}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

