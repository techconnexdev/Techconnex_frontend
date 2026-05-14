"use client";

import { useI18n } from "@/contexts/I18nProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KycUser } from "./types";

interface UserInfoCardProps {
  user: KycUser;
}

export function UserInfoCard({ user }: UserInfoCardProps) {
  const { t } = useI18n();
  const rawCreatedAt = user.profile?.createdAt;
  const profileCreatedAt = rawCreatedAt
    ? typeof rawCreatedAt === "string"
      ? rawCreatedAt
      : typeof rawCreatedAt === "number"
      ? new Date(rawCreatedAt).toISOString()
      : null
    : null;

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-base sm:text-lg">
          {t("admin.verifications.userInfo.title")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 px-4 sm:px-6 pb-4 sm:pb-6">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {user.name || t("admin.verifications.unnamed")}
            </p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-xs sm:text-sm">
          <p>
            <span className="font-medium">
              {t("admin.verifications.userInfo.role")}
            </span>{" "}
            {user.role}
          </p>
          {profileCreatedAt && (
            <p>
              <span className="font-medium">
                {t("admin.verifications.userInfo.joined")}
              </span>{" "}
              {new Date(profileCreatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
