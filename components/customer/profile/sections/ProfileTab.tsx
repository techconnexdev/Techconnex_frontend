"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Mail, Phone, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import type { ProfileData, Stats } from "../types";

interface Props {
  isEditing: boolean;
  profileData: ProfileData;
  onProfileChange: (patch: Partial<ProfileData>) => void;
  stats: Stats;
  onChangeAvatar?: () => void;
}

export default function ProfileTab({
  isEditing,
  profileData,
  onProfileChange,
  stats,
  onChangeAvatar,
}: Props) {
  const initials = useMemo(
    () =>
      profileData.name
        ? profileData.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2)
        : "U",
    [profileData.name]
  );

  return (
    <div className="space-y-6">
      {/* Profile Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Overview</CardTitle>
          <CardDescription>Your public profile information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar + Basic Info */}
          <div className="flex items-start space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src="/placeholder.svg?height=96&width=96" />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              {isEditing && (
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  onClick={onChangeAvatar}
                >
                  {/* simple camera glyph using emoji or your own icon */}
                  📷
                </Button>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileData.name || ""}
                  onChange={(e) => onProfileChange({ name: e.target.value })}
                  disabled={!isEditing}
                />
              </div>
              <div>
                <Label htmlFor="bio">Bio / Description</Label>
                <Textarea
                  id="bio"
                  value={profileData.customerProfile?.description || ""}
                  onChange={(e) =>
                    onProfileChange({
                      customerProfile: {
                        ...profileData.customerProfile,
                        description: e.target.value,
                      },
                    })
                  }
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Tell us about your company..."
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => onProfileChange({ email: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => onProfileChange({ phone: e.target.value })}
                    disabled={!isEditing}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="location">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    id="location"
                    value={profileData.customerProfile?.location || ""}
                    onChange={(e) =>
                      onProfileChange({
                        customerProfile: {
                          ...profileData.customerProfile,
                          location: e.target.value,
                        },
                      })
                    }
                    disabled={!isEditing}
                    className="pl-10"
                    placeholder="City, State, Country"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Statistics</CardTitle>
          <CardDescription>
            Your activity and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Stat
              label="Projects Posted"
              value={stats.projectsPosted}
              className="text-blue-600"
            />
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                RM{parseFloat(stats.totalSpend || "0").toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Spent</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="text-2xl font-bold text-yellow-600">
                  {stats.rating.toFixed(1)}
                </span>
              </div>
              <div className="text-sm text-gray-500">Rating</div>
            </div>
            <Stat
              label="Reviews"
              value={stats.reviewCount}
              className="text-indigo-600"
            />
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">
                {stats.completion}%
              </div>
              <div className="text-sm text-gray-500">Profile Completion</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-bold text-gray-600">
                {stats.memberSince}
              </div>
              <div className="text-sm text-gray-500">Member Since</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  className,
}: {
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className="text-center">
      <div className={`text-2xl font-bold ${className ?? ""}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}
