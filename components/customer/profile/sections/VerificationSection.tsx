"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Download,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { API_BASE } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import type { UploadedDocument } from "../types";
import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages/en";

type Props = {
  documents: UploadedDocument[];
  setDocuments: (docs: UploadedDocument[]) => void;
  documentType: string;
  userId?: string;
};

export default function VerificationSection({
  documents,
  setDocuments,
  documentType,
  userId,
}: Props) {
  const { toast } = useToast();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [reuploadTargetId, setReuploadTargetId] = useState<string | null>(null);

  // statuses normalized to: "approved" | "pending" | "rejected"
  const counts = {
    approved: documents.filter((d) => d.status === "approved").length,
    pending: documents.filter((d) => d.status === "pending").length,
    rejected: documents.filter((d) => d.status === "rejected").length,
  };
  // Overall KYC status used for UI
  // If any approved exists -> verified
  // If any pending exists -> pending
  // If any rejected exists and no pending/approved -> action_required
  const status =
    counts.approved > 0
      ? "verified"
      : counts.pending > 0
      ? "pending"
      : counts.rejected > 0
      ? "action_required"
      : "not_verified";

  const StatusIcon =
    status === "verified"
      ? CheckCircle
      : status === "pending"
      ? Clock
      : status === "action_required"
      ? AlertCircle
      : XCircle;

  const isProvider = documentType === "PROVIDER_ID";
  const title = t(
    isProvider
      ? "customer.profile.verification.titleProvider"
      : "customer.profile.verification.titleCompany",
  );
  const description = t(
    isProvider
      ? "customer.profile.verification.descProvider"
      : "customer.profile.verification.descCompany",
  );
  const requiredDocs: { labelKey: MessageKey; hintKey: MessageKey }[] = isProvider
    ? [
        {
          labelKey: "customer.profile.verification.req.id.label",
          hintKey: "customer.profile.verification.req.id.hint",
        },
        {
          labelKey: "customer.profile.verification.req.address.label",
          hintKey: "customer.profile.verification.req.address.hint",
        },
        {
          labelKey: "customer.profile.verification.req.cred.label",
          hintKey: "customer.profile.verification.req.cred.hint",
        },
      ]
    : [
        {
          labelKey: "customer.profile.verification.req.ssm.label",
          hintKey: "customer.profile.verification.req.ssm.hint",
        },
        {
          labelKey: "customer.profile.verification.req.tax.label",
          hintKey: "customer.profile.verification.req.tax.hint",
        },
        {
          labelKey: "customer.profile.verification.req.bank.label",
          hintKey: "customer.profile.verification.req.bank.hint",
        },
        {
          labelKey: "customer.profile.verification.req.director.label",
          hintKey: "customer.profile.verification.req.director.hint",
        },
      ];

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    // ✅ Check if user accidentally selected a folder
    if (f.type === "" && f.size === 0) {
      return toast({
        title: t("customer.profile.verification.toast.invalidFolder"),
        description: t("customer.profile.verification.toast.invalidFolderDesc"),
        variant: "destructive",
      });
    }

    if (f.size > 10 * 1024 * 1024)
      return toast({
        title: t("customer.projects.new.toast.fileTooLargeTitle"),
        description: t("customer.profile.verification.toast.max10mb"),
        variant: "destructive",
      });
    const ok = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
    ].includes(f.type);
    if (!ok)
      return toast({
        title: t("customer.projects.new.toast.invalidFileTitle"),
        description: t("customer.profile.verification.toast.typesPdfJpeg"),
        variant: "destructive",
      });
    setFile(f);
  };

  const upload = async () => {
    if (!file) {
      return toast({
        title: t("customer.profile.verification.toast.missingFile"),
        description: t("customer.profile.verification.toast.missingFileDesc"),
        variant: "destructive",
      });
    }

    // Validate file size (50MB max for documents)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      const mb = maxSize / (1024 * 1024);
      return toast({
        title: t("customer.projects.new.toast.fileTooLargeTitle"),
        description: t("customer.profile.verification.toast.max50", {
          mb: mb.toFixed(0),
        }),
        variant: "destructive",
      });
    }

    // close dialog and reset form immediately
    setOpen(false);
    setFile(null);

    // perform upload to R2 first, then backend
    try {

      // Upload to R2 first
      // Category will be auto-detected from file type (image, document, or video)
      const { uploadFile } = await import("@/lib/upload");
      
      let uploadResult;
      try {
        uploadResult = await uploadFile({
          file: file as File,
          prefix: "kyc",
          visibility: "private", // KYC documents should be private
          // Don't specify category - let it auto-detect from file.type
        });
      } catch (uploadError: unknown) {
        // Handle R2 upload errors
        const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);
        if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
          throw new Error("Network error: Unable to connect to upload service. Please check your internet connection and try again.");
        }
        if (errorMessage.includes("size") || errorMessage.includes("limit")) {
          throw new Error(`File size error: ${errorMessage}`);
        }
        if (errorMessage.includes("type") || errorMessage.includes("format")) {
          throw new Error(`File type error: ${errorMessage}`);
        }
        throw new Error(`Upload failed: ${errorMessage || "Unknown error occurred during file upload"}`);
      }

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload KYC document to R2");
      }

      // Send R2 key/URL to backend
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : undefined;
      
      // Token is optional (for registration flows), but required for profile updates
      if (!token && userId) {
        throw new Error("Not authenticated: Please log in to upload documents.");
      }

      let res;
      try {
        res = await fetch(`${API_BASE}/kyc`, {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: userId || undefined,
            type: documentType.toString(),
            key: uploadResult.key,
            url: uploadResult.url || uploadResult.key, // Use key if URL is empty (private files)
            filename: file.name,
            mimeType: file.type || "application/octet-stream",
          }),
        });
      } catch (fetchError: unknown) {
        // Handle network errors
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorName = fetchError instanceof Error ? fetchError.name : "";
        if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorName === "TypeError") {
          throw new Error("Network error: Unable to connect to server. Please check your internet connection and try again.");
        }
        throw new Error(`Server connection failed: ${errorMessage || "Unknown error"}`);
      }

      let payload;
      try {
        payload = await res.json();
      } catch {
        throw new Error("Server response error: Invalid response from server. Please try again.");
      }

      if (!res.ok) {
        const errorMsg = payload?.error || payload?.message || `KYC upload failed (${res.status})`;
        if (res.status === 400) {
          throw new Error(`Validation error: ${errorMsg}`);
        } else if (res.status === 401 || res.status === 403) {
          throw new Error(`Authorization error: ${errorMsg}. Please refresh the page and try again.`);
        } else if (res.status >= 500) {
          throw new Error(`Server error: ${errorMsg}. Please try again later.`);
        }
        throw new Error(errorMsg);
      }

      const data = payload.data ?? payload;

      // map backend response to UploadedDocument
      const uploaded: UploadedDocument = {
        id: String(data.id ?? data._id),
        name: String(data.filename ?? data.fileUrl ?? file.name),
        type: String(data.type ?? "COMPANY_REG"),
        size: String(
          data.size ?? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        ),
        uploadDate: String(
          data.uploadedAt ?? data.uploadDate ?? new Date().toISOString()
        ),
        status: ((): "pending" | "approved" | "rejected" => {
          const raw = String(data.status ?? "uploaded").toLowerCase();
          if (raw === "verified" || raw === "approved") return "approved";
          if (raw === "rejected") return "rejected";
          return "pending";
        })(),
        rejectionReason: data.reviewNotes
          ? String(data.reviewNotes)
          : undefined,
        reviewedBy:
          data.reviewer && data.reviewer.name
            ? String(data.reviewer.name)
            : data.reviewedBy
            ? String(data.reviewedBy)
            : undefined,
        reviewedAt: data.reviewedAt ? String(data.reviewedAt) : undefined,
        fileUrl: data.fileUrl ? String(data.fileUrl) : undefined,
        reviewer: data.reviewer
          ? {
              id: data.reviewer.id,
              name: data.reviewer.name,
              email: data.reviewer.email,
            }
          : null,
      };

      // Update UI with real data from server (add or replace)
      if (reuploadTargetId) {
        // replace the reuploaded document
        setDocuments(
          documents.map((d) => (d.id === reuploadTargetId ? uploaded : d))
        );
      } else {
        // add new document
        setDocuments([...(documents ?? []), uploaded]);
      }

      setReuploadTargetId(null);
      toast({
        title: t("customer.profile.verification.toast.uploadedTitle"),
        description: t("customer.profile.verification.toast.uploadedDesc"),
      });
    } catch (err: unknown) {
      toast({
        title: t("customer.profile.verification.toast.uploadFailed"),
        description: getUserFriendlyErrorMessage(
          err,
          "customer profile verification upload",
        ),
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (doc: UploadedDocument) => {
    if (!doc.fileUrl) {
      return toast({
        title: t("customer.profile.verification.toast.downloadUnavailable"),
        description: t("customer.profile.verification.toast.downloadUnavailableDesc"),
        variant: "destructive",
      });
    }

    try {
      // Use getAttachmentUrl to resolve the URL (handles R2 keys, public URLs, local paths)
      const { getAttachmentUrl, getR2DownloadUrl } = await import("@/lib/api");
      const attachmentUrl = getAttachmentUrl(doc.fileUrl);
      const isR2Key = attachmentUrl === "#"; // Check if getAttachmentUrl returned "#"

      if (isR2Key) {
        // For R2 private keys, fetch a presigned download URL
        const downloadData = await getR2DownloadUrl(doc.fileUrl);
        window.open(downloadData.downloadUrl, "_blank");
      } else {
        // For public URLs or local paths, download directly
        const link = document.createElement("a");
        link.href = attachmentUrl;
        link.download = doc.name || "document";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error: unknown) {
      toast({
        title: t("customer.profile.verification.toast.downloadFailed"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile verification download",
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-2">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {description}
            </CardDescription>
          </div>
          <Badge
            className={`text-xs sm:text-sm flex-shrink-0 ${
              status === "verified"
                ? "bg-green-100 text-green-800"
                : status === "pending"
                ? "bg-yellow-100 text-yellow-800"
                : status === "action_required"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            <StatusIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
            {status === "verified"
              ? t("customer.profile.verification.badge.verified")
              : status === "pending"
              ? t("customer.profile.verification.badge.pending")
              : status === "action_required"
              ? t("customer.profile.verification.badge.action")
              : t("customer.profile.verification.badge.notVerified")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 sm:space-y-5 lg:space-y-6 p-4 sm:p-6 pt-0">
        {/* Alert Banner */}
        {status !== "verified" && (
          <div
            className={`p-3 sm:p-4 rounded-lg border ${
              status === "action_required"
                ? "bg-red-50 border-red-200"
                : status === "pending"
                ? "bg-yellow-50 border-yellow-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="flex items-start gap-2.5 sm:gap-3">
              <AlertCircle
                className={`w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0 ${
                  status === "action_required"
                    ? "text-red-600"
                    : status === "pending"
                    ? "text-yellow-600"
                    : "text-blue-600"
                }`}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm sm:text-base mb-1">
                  {status === "action_required"
                    ? t("customer.profile.verification.alert.actionTitle")
                    : status === "pending"
                    ? t("customer.profile.verification.alert.pendingTitle")
                    : t("customer.profile.verification.alert.completeTitle")}
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 break-words">
                  {status === "action_required"
                    ? t("customer.profile.verification.alert.actionBody")
                    : status === "pending"
                    ? t("customer.profile.verification.alert.pendingBody")
                    : t("customer.profile.verification.alert.completeBody")}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Required list (kept brief) */}
        <div className="space-y-2.5 sm:space-y-3">
          <h3 className="text-base sm:text-lg font-semibold">
            {t("customer.profile.verification.requiredTitle")}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {requiredDocs.map(({ labelKey, hintKey }) => (
              <div
                key={labelKey}
                className="p-3 border rounded-lg bg-gray-50 flex items-start gap-2"
              >
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">{t(labelKey)}</p>
                  <p className="text-xs text-gray-500">{t(hintKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Upload button & dialog */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold">
              {t("customer.profile.verification.uploadedTitle")}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500">
              {t("customer.profile.verification.uploadedDesc")}
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button disabled={status === "verified" || status === "pending"} className="text-xs sm:text-sm w-full sm:w-auto">
                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {t("customer.profile.verification.uploadBtn")}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl sm:max-w-md max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">
                  {t("customer.profile.verification.dialogTitle")}
                </DialogTitle>
                <DialogDescription className="text-xs sm:text-sm">
                  {t("customer.profile.verification.dialogDesc")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* <div>
                  <Label>Document Type</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div> */}
                <div>
                  <Label>{t("customer.profile.verification.selectFile")}</Label>
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={onFile}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  {t("customer.profile.cancel")}
                </Button>
                <Button onClick={upload} disabled={!file}>
                  {t("customer.profile.verification.uploadSubmit")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Uploaded list */}
        <div className="space-y-2.5 sm:space-y-3">
          {documents.length === 0 ? (
            <div className="text-center py-6 sm:py-8 border rounded-lg bg-gray-50 px-4">
              <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm sm:text-base text-gray-600">
                {t("customer.profile.verification.emptyTitle")}
              </p>
              <p className="text-xs sm:text-sm text-gray-500">
                {t("customer.profile.verification.emptyDesc")}
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                className="p-3 sm:p-4 border rounded-lg hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0 w-full sm:w-auto">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 sm:mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <h4 className="font-medium text-sm sm:text-base break-words">{doc.name}</h4>
                        {doc.status === "approved" && (
                          <Badge className="bg-green-100 text-green-800 text-[10px] sm:text-xs flex-shrink-0">
                            <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                            {t("customer.profile.verification.badgeDoc.verified")}
                          </Badge>
                        )}
                        {doc.status === "pending" && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs flex-shrink-0">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                            {t("customer.profile.verification.badgeDoc.uploaded")}
                          </Badge>
                        )}
                        {doc.status === "rejected" && (
                          <Badge className="bg-red-100 text-red-800 text-[10px] sm:text-xs flex-shrink-0">
                            <XCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                            {t("customer.profile.verification.badgeDoc.rejected")}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">{doc.type}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-gray-500">
                        <span className="whitespace-nowrap">{doc.size}</span>
                        <span className="break-words">
                          {t("customer.profile.verification.uploadedLabel")}{" "}
                          {doc.uploadDate}
                        </span>
                      </div>
                      {doc.status === "rejected" && doc.rejectionReason && (
                        <div className="mt-2 p-2 sm:p-2.5 bg-red-50 border border-red-200 rounded text-xs sm:text-sm text-red-700">
                          <strong>{t("customer.profile.verification.reason")}</strong>{" "}
                          <span className="break-words">{doc.rejectionReason}</span>
                          {doc.reviewedBy && (
                            <div className="text-[10px] sm:text-xs text-red-700 mt-1 break-words">
                              <strong>
                                {t("customer.profile.verification.reviewedBy")}
                              </strong>{" "}
                              {doc.reviewedBy}
                            </div>
                          )}
                          {doc.reviewedAt && (
                            <div className="text-[10px] sm:text-xs text-red-700 mt-1 break-words">
                              <strong>
                                {t("customer.profile.verification.reviewedAt")}
                              </strong>{" "}
                              {doc.reviewedAt}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto justify-end sm:justify-start">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                      disabled={!doc.fileUrl}
                      className="text-xs sm:text-sm"
                    >
                      <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </Button>
                    {doc.status === "rejected" && status !== "verified" ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // open dialog prefilled for reupload
                           
                            setReuploadTargetId(doc.id);
                            setOpen(true);
                          }}
                          className="text-xs sm:text-sm"
                        >
                          {t("customer.profile.verification.reupload")}
                        </Button>
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => remove(doc.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button> */}
                      </>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
