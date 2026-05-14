"use client"

import { useI18n } from "@/contexts/I18nProvider"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle } from "lucide-react"
import { KycUser } from "./types"
import { UserInfoCard } from "./UserInfoCard"
import { VerificationStatusCard } from "./VerificationStatusCard"
import { DocumentsCard } from "./DocumentsCard"
import { ProfileDetailsCard } from "./ProfileDetailsCard"
import { ReviewHistoryCard } from "./ReviewHistoryCard"
import { ReviewNotesCard } from "./ReviewNotesCard"

interface ReviewDialogProps {
  user: KycUser | null
  reviewNotes: string
  onNotesChange: (value: string) => void
  onApprove: (userId: string) => void
  onReject: (userId: string) => void
  onClose: () => void
}

export function ReviewDialog({
  user,
  reviewNotes,
  onNotesChange,
  onApprove,
  onReject,
  onClose,
}: ReviewDialogProps) {
  const { t } = useI18n()
  if (!user) return null

  const hasPendingDocuments = user.documents?.some((doc) => doc.status === "uploaded")

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">
            {t("admin.verifications.dialog.title", { name: user.name })}
          </DialogTitle>
          <DialogDescription className="text-sm">
            {t("admin.verifications.dialog.description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* User Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <UserInfoCard user={user} />
            <VerificationStatusCard user={user} />
          </div>

          {/* Review History */}
          <ReviewHistoryCard documents={user.documents || []} />

          {/* Documents */}
          <DocumentsCard documents={user.documents || []} />

          {/* Profile Details */}
          {user.profile && <ProfileDetailsCard user={user} />}

          {/* Review Notes */}
          {hasPendingDocuments && (
            <ReviewNotesCard reviewNotes={reviewNotes} onNotesChange={onNotesChange} />
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-3">
          {hasPendingDocuments && (
            <>
              <Button
                variant="outline"
                onClick={() => onReject(user.id)}
                className="text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {t("admin.verifications.dialog.reject")}
              </Button>
              <Button onClick={() => onApprove(user.id)} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                <CheckCircle className="w-4 h-4 mr-2" />
                {t("admin.verifications.dialog.approve")}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

