"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { KycUser } from "./types";

interface UserInfoCardProps {
  user: KycUser;
}

export function UserInfoCard({ user }: UserInfoCardProps) {
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
      <CardHeader>
        <CardTitle className="text-lg">User Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.name || "Unnamed"}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Role:</span> {user.role}
          </p>
          <p>
            <span className="font-medium">KYC Status:</span> {user.kycStatus}
          </p>
          {profileCreatedAt && (
            <p>
              <span className="font-medium">Joined:</span>{" "}
              {new Date(profileCreatedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
