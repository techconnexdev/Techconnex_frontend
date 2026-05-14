"use client"

import { useI18n } from "@/contexts/I18nProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KycUser } from "./types"

interface ProfileDetailsCardProps {
  user: KycUser
}

export function ProfileDetailsCard({ user }: ProfileDetailsCardProps) {
  const { t } = useI18n()
  if (!user.profile) return null

  const profile = user.profile
  const em = t("admin.users.common.emDash")
  const getStringValue = (value: unknown): string => {
    if (typeof value === "string") return value
    if (typeof value === "number") return String(value)
    return em
  }

  const getArrayValue = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string")
    }
    return []
  }

  return (
    <Card>
      <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6">
        <CardTitle className="text-base sm:text-lg">
          {user.role === "PROVIDER"
            ? t("admin.verifications.profile.titleProvider")
            : t("admin.verifications.profile.titleCustomer")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-xs sm:text-sm p-4 sm:p-6">
        {user.role === "PROVIDER" ? (
          <>
            <p className="break-words">
              <span className="font-medium">{t("admin.verifications.profile.bio")}</span>{" "}
              {getStringValue(profile.bio)}
            </p>
            <p>
              <span className="font-medium">{t("admin.verifications.profile.location")}</span>{" "}
              {getStringValue(profile.location)}
            </p>
            <p>
              <span className="font-medium">{t("admin.verifications.profile.website")}</span>{" "}
              {getStringValue(profile.website)}
            </p>
            <p>
              <span className="font-medium">
                {t("admin.verifications.profile.yearsExperience")}
              </span>{" "}
              {getStringValue(profile.yearsExperience)}
            </p>
            <p>
              <span className="font-medium">{t("admin.verifications.profile.hourlyRate")}</span> $
              {getStringValue(profile.hourlyRate)}
            </p>
            <p>
              <span className="font-medium">{t("admin.verifications.profile.languages")}</span>{" "}
              {getArrayValue(profile.languages).join(", ") || em}
            </p>
            <p>
              <span className="font-medium">{t("admin.verifications.profile.skills")}</span>{" "}
              {getArrayValue(profile.skills).join(", ") || em}
            </p>
            <p>
              <span className="font-medium">
                {t("admin.verifications.profile.workPreference")}
              </span>{" "}
              {getStringValue(profile.workPreference)}
            </p>
            <p>
              <span className="font-medium">{t("admin.verifications.profile.teamSize")}</span>{" "}
              {getStringValue(profile.teamSize)}
            </p>
            <p>
              <span className="font-medium">{t("admin.verifications.profile.rating")}</span>{" "}
              {getStringValue(profile.rating)} ⭐
            </p>
          </>
        ) : (
          <>
            <p className="break-words">
              <span className="font-medium">
                {t("admin.verifications.profile.description")}
              </span>{" "}
              {getStringValue(profile.description)}
            </p>
            <p>
              <span className="font-medium">{t("admin.verifications.profile.industry")}</span>{" "}
              {getStringValue(profile.industry)}
            </p>
            <p>
              <span className="font-medium">{t("admin.verifications.profile.location")}</span>{" "}
              {getStringValue(profile.location)}
            </p>
            <p>
              <span className="font-medium">{t("admin.verifications.profile.website")}</span>{" "}
              {getStringValue(profile.website)}
            </p>
            <p>
              <span className="font-medium">
                {t("admin.verifications.profile.companySize")}
              </span>{" "}
              {getStringValue(profile.companySize)}
            </p>
            <p>
              <span className="font-medium">
                {t("admin.verifications.profile.establishedYear")}
              </span>{" "}
              {getStringValue(profile.establishedYear)}
            </p>
            <p>
              <span className="font-medium">
                {t("admin.verifications.profile.annualRevenue")}
              </span>{" "}
              {getStringValue(profile.annualRevenue)}
            </p>
            <p>
              <span className="font-medium">
                {t("admin.verifications.profile.fundingStage")}
              </span>{" "}
              {getStringValue(profile.fundingStage)}
            </p>
            <p>
              <span className="font-medium">
                {t("admin.verifications.profile.preferredContracts")}
              </span>{" "}
              {getArrayValue(profile.preferredContractTypes).join(", ") || em}
            </p>
            <p>
              <span className="font-medium">
                {t("admin.verifications.profile.hiringCategories")}
              </span>{" "}
              {getArrayValue(profile.categoriesHiringFor).join(", ") || em}
            </p>
            <p className="break-words">
              <span className="font-medium">{t("admin.verifications.profile.mission")}</span>{" "}
              {getStringValue(profile.mission)}
            </p>
            <p className="break-words">
              <span className="font-medium">{t("admin.verifications.profile.values")}</span>{" "}
              {getArrayValue(profile.values).join(", ") || em}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

