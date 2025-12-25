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
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            {isEditing ? (
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => onFieldChange("name", e.target.value)}
              />
            ) : (
              <p className="font-medium">{userInfo.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            {isEditing ? (
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onFieldChange("email", e.target.value)}
              />
            ) : (
              <p className="font-medium">{userInfo.email}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            {isEditing ? (
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => onFieldChange("phone", e.target.value)}
                placeholder="Optional"
              />
            ) : (
              <p className="font-medium">{userInfo.phone || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>KYC Status</Label>
            {isEditing ? (
              <Select value={formData.kycStatus} onValueChange={(value) => onFieldChange("kycStatus", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_verification">Pending Verification</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline">{userInfo.kycStatus}</Badge>
            )}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            {isEditing ? (
              <Select value={formData.status} onValueChange={(value) => onFieldChange("status", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Badge className={getStatusColor(userInfo.status)}>{userInfo.status}</Badge>
            )}
          </div>
          <div className="space-y-2">
            <Label>Verified</Label>
            {isEditing ? (
              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="isVerified"
                  checked={formData.isVerified}
                  onCheckedChange={(checked) => onFieldChange("isVerified", checked)}
                />
                <Label htmlFor="isVerified" className="font-normal">
                  Verified Account
                </Label>
              </div>
            ) : (
              <div>
                {userInfo.isVerified ? (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="outline">Not Verified</Badge>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label>Joined</Label>
            <p className="font-medium">
              {userInfo.createdAt ? new Date(userInfo.createdAt).toLocaleDateString() : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

