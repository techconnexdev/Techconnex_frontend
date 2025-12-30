"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"
import { UserBasicInfo, UserFormData } from "./types"

interface BasicInformationCardProps {
  userInfo: UserBasicInfo
  formData: UserFormData
  isEditing: boolean
  onFieldChange: (field: string, value: unknown) => void
}

export function BasicInformationCard({
  userInfo,
  formData,
  isEditing,
  onFieldChange,
}: BasicInformationCardProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "SUSPENDED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs sm:text-sm">Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFieldChange("name", e.target.value)}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="font-medium text-sm sm:text-base break-words">{userInfo.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs sm:text-sm">Email</Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onFieldChange("email", e.target.value)}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="font-medium text-sm sm:text-base break-words">{userInfo.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs sm:text-sm">Phone</Label>
            {isEditing ? (
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => onFieldChange("phone", e.target.value)}
                placeholder="Optional"
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="font-medium text-sm sm:text-base break-words">{userInfo.phone || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Status</Label>
            {isEditing ? (
              <Select value={formData.status} onValueChange={(value) => onFieldChange("status", value)}>
                <SelectTrigger className="text-sm sm:text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={`${getStatusColor(userInfo.status)} text-xs`}>{userInfo.status}</Badge>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Verified</Label>
            {isEditing ? (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isVerified"
                  checked={formData.isVerified}
                  onCheckedChange={(checked) => onFieldChange("isVerified", checked)}
                />
                <Label htmlFor="isVerified" className="font-normal text-xs sm:text-sm">
                  Verified Account
                </Label>
              </div>
            ) : (
              <div>
                {userInfo.isVerified ? (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">Not Verified</Badge>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs sm:text-sm">Joined</Label>
            <p className="font-medium text-sm sm:text-base">
              {userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

