"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Building, DollarSign, Star, Users } from "lucide-react"
import { ProfileStats } from "./types"

interface ProfileStatsCardProps {
  stats: ProfileStats
  isProvider: boolean
}

export function ProfileStatsCard({ stats, isProvider }: ProfileStatsCardProps) {
  if (isProvider) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Projects</p>
                <p className="text-xl sm:text-2xl font-bold truncate">{stats.totalProjects || 0}</p>
              </div>
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Rating</p>
                <p className="text-xl sm:text-2xl font-bold truncate">{stats.rating || 0}</p>
              </div>
              <Star className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-600">Earnings</p>
                <p className="text-xl sm:text-2xl font-bold truncate">RM {Number(stats.totalEarnings || 0).toLocaleString()}</p>
              </div>
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0 ml-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Projects Posted</p>
              <p className="text-xl sm:text-2xl font-bold truncate">{stats.projectsPosted || 0}</p>
            </div>
            <Building className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 flex-shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-xl sm:text-2xl font-bold truncate">RM {Number(stats.totalSpend || 0).toLocaleString()}</p>
            </div>
            <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0 ml-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

