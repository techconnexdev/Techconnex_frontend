"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { KycDocument } from "./types";
import { getAttachmentUrl, getR2DownloadUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/contexts/I18nProvider";

interface KycDocumentsCardProps {
  documents: KycDocument[];
}

export function KycDocumentsCard({ documents }: KycDocumentsCardProps) {
  const { toast } = useToast();
  const { t } = useI18n();

  const handleDownload = async (doc: KycDocument) => {
    try {
      const attachmentUrl = getAttachmentUrl(doc.fileUrl);
      const isR2Key = attachmentUrl === "#";

      if (isR2Key) {
        const downloadData = await getR2DownloadUrl(doc.fileUrl);
        window.open(downloadData.downloadUrl, "_blank");
        toast({
          title: t("admin.users.kyc.toast.downloadTitle"),
          description: t("admin.users.kyc.toast.downloadDesc"),
        });
      } else {
        window.open(attachmentUrl, "_blank");
        toast({
          title: t("admin.users.kyc.toast.downloadTitle"),
          description: t("admin.users.kyc.toast.downloadDesc"),
        });
      }
    } catch (error: unknown) {
      console.error("Failed to download document:", error);
      toast({
        title: t("admin.users.toast.errorTitle"),
        description:
          error instanceof Error
            ? error.message
            : t("admin.users.kyc.toast.downloadFailed"),
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">
          {t("admin.users.kyc.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <div className="space-y-3 sm:space-y-4">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm sm:text-base break-words">
                    {doc.filename}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">{doc.type}</p>
                  <p className="text-xs text-gray-400">
                    {t("admin.users.kyc.statusLine", { status: doc.status })}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload(doc)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Download className="w-3.5 h-3.5 sm:h-4 sm:h-4 mr-1.5 sm:mr-2" />
                {t("admin.users.kyc.download")}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
