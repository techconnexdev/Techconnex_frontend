"use client"

import { useI18n } from "@/contexts/I18nProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, FileText } from "lucide-react"
import { KycDoc } from "./types"
import { docStatusLabel } from "./verification-i18n-maps"
import { getAttachmentUrl, getR2DownloadUrl } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

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

interface DocumentsCardProps {
  documents: KycDoc[]
}

export function DocumentsCard({ documents }: DocumentsCardProps) {
  const { t } = useI18n()
  const { toast } = useToast()

  const handleDownload = async (doc: KycDoc) => {
    try {
      const attachmentUrl = getAttachmentUrl(doc.fileUrl)
      const isR2Key = attachmentUrl === "#"

      if (isR2Key) {
        const downloadData = await getR2DownloadUrl(doc.fileUrl)
        window.open(downloadData.downloadUrl, "_blank")
      } else {
        window.open(attachmentUrl, "_blank")
      }
    } catch (error: unknown) {
      console.error("Failed to download document:", error)
      toast({
        title: t("admin.users.toast.errorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("admin.verifications.toast.downloadDocumentFailed"),
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-base sm:text-lg">
          {t("admin.verifications.documentsCard.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="border rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={`w-4 h-4 flex-shrink-0 ${getDocumentStatusColor(doc.status)}`} />
                  <span className="font-medium text-sm sm:text-base truncate">{doc.type}</span>
                </div>
                <Badge variant="outline" className={`text-xs flex-shrink-0 ${getDocumentStatusColor(doc.status)}`}>
                  {docStatusLabel(doc.status, t)}
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mb-3 truncate" title={doc.filename}>
                {t("admin.verifications.documentsCard.filename", {
                  name: doc.filename,
                })}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full bg-transparent text-xs sm:text-sm"
                onClick={() => handleDownload(doc)}
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                {t("admin.verifications.documentsCard.download")}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

