"use client"

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
  if (!user) return null

  const hasPendingDocuments = user.documents?.some((doc) => doc.status === "uploaded")

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Verification Review - {user.name}</DialogTitle>
          <DialogDescription>Review all submitted documents and user information</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="grid md:grid-cols-2 gap-6">
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

        <DialogFooter>
          {hasPendingDocuments && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => onReject(user.id)}
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={() => onApprove(user.id)} className="bg-green-600 hover:bg-green-700">
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

