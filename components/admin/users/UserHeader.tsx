"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft, Ban, CheckCircle, Edit, Loader2, MessageSquare, Save, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface UserHeaderProps {
  userName: string
  userEmail: string
  userStatus: string
  isEditing: boolean
  saving: boolean
  actionLoading: boolean
  isProvider: boolean
  isCustomer: boolean
  providerProfile?: Record<string, unknown>
  customerProfile?: Record<string, unknown>
  userId: string
  onEdit: () => void
  onCancel: () => void
  onSave: () => void
  onSuspend: () => void
  onActivate: () => void
}

export function UserHeader({
  userName,
  userEmail,
  userStatus,
  isEditing,
  saving,
  actionLoading,
  isProvider,
  isCustomer,
  providerProfile,
  customerProfile,
  userId,
  onEdit,
  onCancel,
  onSave,
  onSuspend,
  onActivate,
}: UserHeaderProps) {
  const router = useRouter()

  const handleContact = () => {
    let avatar = ""
    if (isProvider && providerProfile) {
      avatar = typeof providerProfile.profileImageUrl === "string" ? providerProfile.profileImageUrl : ""
    } else if (isCustomer && customerProfile) {
      avatar = typeof customerProfile.profileImageUrl === "string" ? customerProfile.profileImageUrl : ""
    }
    router.push(
      `/admin/messages?userId=${userId}&name=${encodeURIComponent(userName)}&avatar=${encodeURIComponent(avatar)}`
    )
  }

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link href="/admin/users">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{userName}</h1>
          <p className="text-gray-600">{userEmail}</p>
        </div>
      </div>
      <div className="flex gap-3">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={onSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={handleContact}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact
            </Button>
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
            {userStatus === "ACTIVE" ? (
              <Button variant="destructive" onClick={onSuspend} disabled={actionLoading}>
                <Ban className="w-4 h-4 mr-2" />
                Suspend User
              </Button>
            ) : (
              <Button onClick={onActivate} disabled={actionLoading}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate User
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

