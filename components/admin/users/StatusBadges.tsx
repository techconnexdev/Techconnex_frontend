"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";

interface StatusBadgesProps {
  status: string;
  roles: string[];
  isVerified: boolean;
}

export function StatusBadges({ status, roles, isVerified }: StatusBadgesProps) {
  const { t } = useI18n();

  const getStatusColor = (statusValue: string) => {
    switch (statusValue?.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "SUSPENDED":
        return "bg-red-100 text-red-800";
      case "DELETED":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleColor = (role: string) => {
    if (role === "PROVIDER") return "bg-blue-100 text-blue-800";
    if (role === "CUSTOMER") return "bg-purple-100 text-purple-800";
    if (role === "ADMIN") return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const statusKey = status?.toUpperCase();
  const statusLabel =
    statusKey === "ACTIVE" || statusKey === "SUSPENDED" || statusKey === "DELETED"
      ? t(`admin.users.statusBadge.${statusKey}` as MessageKey)
      : status;

  return (
    <div className="flex flex-wrap gap-2 sm:gap-4">
      <Badge className={`${getStatusColor(status)} text-xs`}>{statusLabel}</Badge>
      {roles.map((role) => {
        const rk =
          role === "ADMIN" || role === "CUSTOMER" || role === "PROVIDER"
            ? role
            : null;
        return (
          <Badge key={role} className={`${getRoleColor(role)} text-xs`}>
            {rk ? t(`admin.users.roleBadge.${rk}` as MessageKey) : role}
          </Badge>
        );
      })}
      {isVerified && (
        <Badge className="bg-green-100 text-green-800 text-xs">
          <CheckCircle className="w-3 h-3 mr-1" />
          {t("admin.users.statusBadge.verified")}
        </Badge>
      )}
    </div>
  );
}
