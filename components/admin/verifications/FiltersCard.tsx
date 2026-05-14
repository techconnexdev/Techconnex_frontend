"use client"

import { useI18n } from "@/contexts/I18nProvider"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface FiltersCardProps {
  searchQuery: string
  typeFilter: string
  statusFilter: string
  onSearchChange: (value: string) => void
  onTypeFilterChange: (value: string) => void
  onStatusFilterChange: (value: string) => void
}

export function FiltersCard({
  searchQuery,
  typeFilter,
  statusFilter,
  onSearchChange,
  onTypeFilterChange,
  onStatusFilterChange,
}: FiltersCardProps) {
  const { t } = useI18n()
  return (
    <Card>
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t("admin.verifications.filters.searchPlaceholder")}
                className="pl-10 text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
            </div>
          </div>
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
              <SelectValue
                placeholder={t("admin.verifications.filters.allTypes")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("admin.verifications.filters.allTypes")}
              </SelectItem>
              <SelectItem value="provider">
                {t("admin.verifications.filters.providers")}
              </SelectItem>
              <SelectItem value="customer">
                {t("admin.verifications.filters.customers")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
              <SelectValue
                placeholder={t("admin.verifications.filters.allStatus")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("admin.verifications.filters.allStatus")}
              </SelectItem>
              <SelectItem value="uploaded">
                {t("admin.verifications.filters.statusPendingReview")}
              </SelectItem>
              <SelectItem value="verified">
                {t("admin.verifications.filters.statusVerified")}
              </SelectItem>
              <SelectItem value="rejected">
                {t("admin.verifications.filters.statusRejected")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}

