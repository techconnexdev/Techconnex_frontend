"use client"

import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

interface StatusBadgesProps {
  status: string
  roles: string[]
  isVerified: boolean
}

export function StatusBadges({ status, roles, isVerified }: StatusBadgesProps) {
  const getStatusColor = (statusValue: string) => {
    switch (statusValue?.toUpperCase()) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "SUSPENDED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getRoleColor = (role: string) => {
    if (role === "PROVIDER") return "bg-blue-100 text-blue-800"
    if (role === "CUSTOMER") return "bg-purple-100 text-purple-800"
    if (role === "ADMIN") return "bg-red-100 text-red-800"
    return "bg-gray-100 text-gray-800"
  }

  return (
    <div className="flex gap-4">
      <Badge className={getStatusColor(status)}>{status}</Badge>
      {roles.map((role) => (
        <Badge key={role} className={getRoleColor(role)}>
          {role}
        </Badge>
      ))}
      {isVerified && (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      )}
    </div>
  )
}

