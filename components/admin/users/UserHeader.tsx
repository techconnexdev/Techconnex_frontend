"use client";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Ban,
  CheckCircle,
  Edit,
  Loader2,
  MessageSquare,
  Save,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserHeaderProps {
  userName: string;
  userEmail: string;
  userStatus: string;
  isEditing: boolean;
  saving: boolean;
  actionLoading: boolean;
  isProvider: boolean;
  isCustomer: boolean;
  providerProfile?: Record<string, unknown>;
  customerProfile?: Record<string, unknown>;
  userId: string;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onSuspend: () => void;
  onActivate: () => void;
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
  const router = useRouter();

  const handleContact = () => {
    let avatar = "";
    if (isProvider && providerProfile) {
      avatar =
        typeof providerProfile.profileImageUrl === "string"
          ? providerProfile.profileImageUrl
          : "";
    } else if (isCustomer && customerProfile) {
      avatar =
        typeof customerProfile.profileImageUrl === "string"
          ? customerProfile.profileImageUrl
          : "";
    }
    router.push(
      `/admin/messages?userId=${userId}&name=${encodeURIComponent(
        userName
      )}&avatar=${encodeURIComponent(avatar)}`
    );
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/admin/users">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
            {userName}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 break-words">
            {userEmail}
          </p>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
        {isEditing ? (
          <>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={saving}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={saving}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            {!isProvider && (
              <Button variant="outline" onClick={handleContact}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact
              </Button>
            )}
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit User
            </Button>
            {userStatus === "ACTIVE" ? (
              <Button
                variant="destructive"
                onClick={onSuspend}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Suspend User
              </Button>
            ) : (
              <Button
                onClick={onActivate}
                disabled={actionLoading}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                Activate User
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
