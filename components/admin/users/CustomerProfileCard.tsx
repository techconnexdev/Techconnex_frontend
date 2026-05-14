"use client"

import { useI18n } from "@/contexts/I18nProvider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CustomerProfile } from "./types"

interface CustomerProfileCardProps {
  profile: CustomerProfile
  formData: CustomerProfile
  isEditing: boolean
  onFieldChange: (field: string, value: unknown) => void
  onArrayFieldChange: (field: string, value: string, action: "add" | "remove") => void
}

export function CustomerProfileCard({
  profile,
  formData,
  isEditing,
  onFieldChange,
  onArrayFieldChange,
}: CustomerProfileCardProps) {
  const { t } = useI18n()
  const em = () => t("admin.users.common.emDash")
  const getStringValue = (value: unknown): string => {
    if (typeof value === "string") return value
    if (typeof value === "number") return String(value)
    return ""
  }

  const getArrayValue = (value: unknown): string[] => {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string")
    }
    return []
  }

  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-lg sm:text-xl">{t("admin.users.customer.title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs sm:text-sm">{t("admin.users.customer.description")}</Label>
          {isEditing ? (
            <Textarea
              id="description"
              value={getStringValue(formData.description)}
              onChange={(e) => onFieldChange("description", e.target.value)}
              placeholder={t("admin.users.customer.descriptionPlaceholder")}
              rows={4}
              className="text-sm sm:text-base"
            />
          ) : (
            <p className="text-sm sm:text-base break-words">{getStringValue(profile.description) || em()}</p>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="industry" className="text-xs sm:text-sm">{t("admin.users.customer.industry")}</Label>
            {isEditing ? (
              <Input
                id="industry"
                value={getStringValue(formData.industry)}
                onChange={(e) => onFieldChange("industry", e.target.value)}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base break-words">{getStringValue(profile.industry) || em()}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location" className="text-xs sm:text-sm">{t("admin.users.customer.location")}</Label>
            {isEditing ? (
              <Input
                id="location"
                value={getStringValue(formData.location)}
                onChange={(e) => onFieldChange("location", e.target.value)}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base break-words">{getStringValue(profile.location) || em()}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="companySize" className="text-xs sm:text-sm">{t("admin.users.customer.companySize")}</Label>
            {isEditing ? (
              <Input
                id="companySize"
                value={getStringValue(formData.companySize)}
                onChange={(e) => onFieldChange("companySize", e.target.value)}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base break-words">{getStringValue(profile.companySize) || em()}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeCount" className="text-xs sm:text-sm">{t("admin.users.customer.employeeCount")}</Label>
            {isEditing ? (
              <Input
                id="employeeCount"
                type="number"
                value={getStringValue(formData.employeeCount)}
                onChange={(e) =>
                  onFieldChange("employeeCount", e.target.value ? Number.parseInt(e.target.value) : null)
                }
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base">{getStringValue(profile.employeeCount) || em()}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="website" className="text-xs sm:text-sm">{t("admin.users.customer.website")}</Label>
            {isEditing ? (
              <Input
                id="website"
                type="url"
                value={getStringValue(formData.website)}
                onChange={(e) => onFieldChange("website", e.target.value)}
                placeholder={t("admin.users.provider.urlPlaceholder")}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base break-words">
                {getStringValue(profile.website) ? (
                  <a
                    href={getStringValue(profile.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {getStringValue(profile.website)}
                  </a>
                ) : (
                  em()
                )}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profileImageUrl" className="text-xs sm:text-sm">{t("admin.users.customer.profileImageUrl")}</Label>
            {isEditing ? (
              <Input
                id="profileImageUrl"
                type="url"
                value={getStringValue(formData.profileImageUrl)}
                onChange={(e) => onFieldChange("profileImageUrl", e.target.value)}
                placeholder={t("admin.users.provider.urlPlaceholder")}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base break-words">
                {getStringValue(profile.profileImageUrl) ? (
                  <a
                    href={getStringValue(profile.profileImageUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {getStringValue(profile.profileImageUrl)}
                  </a>
                ) : (
                  em()
                )}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="annualRevenue" className="text-xs sm:text-sm">{t("admin.users.customer.annualRevenue")}</Label>
            {isEditing ? (
              <Input
                id="annualRevenue"
                value={getStringValue(formData.annualRevenue)}
                onChange={(e) => onFieldChange("annualRevenue", e.target.value)}
                placeholder={t("admin.users.customer.annualRevenuePlaceholder")}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base break-words">{getStringValue(profile.annualRevenue) || em()}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="averageBudgetRange" className="text-xs sm:text-sm">{t("admin.users.customer.averageBudget")}</Label>
            {isEditing ? (
              <Input
                id="averageBudgetRange"
                value={getStringValue(formData.averageBudgetRange)}
                onChange={(e) => onFieldChange("averageBudgetRange", e.target.value)}
                placeholder={t("admin.users.customer.averageBudgetPlaceholder")}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base break-words">{getStringValue(profile.averageBudgetRange) || em()}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">{t("admin.users.customer.contractTypes")}</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={t("admin.users.customer.addContractType")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const value = (e.target as HTMLInputElement).value
                      if (value.trim()) {
                        onArrayFieldChange("preferredContractTypes", value, "add")
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.preferredContractTypes).map((type, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer text-xs"
                    onClick={() => onArrayFieldChange("preferredContractTypes", type, "remove")}
                  >
                    {type} ×
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {getArrayValue(profile.preferredContractTypes).length > 0 ? (
                getArrayValue(profile.preferredContractTypes).map((type, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))
              ) : (
                <span className="text-xs sm:text-sm text-gray-400">{t("admin.users.customer.noContractTypes")}</span>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">{t("admin.users.customer.socialLinks")}</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={t("admin.users.customer.addSocialLink")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const value = (e.target as HTMLInputElement).value
                      if (value.trim()) {
                        onArrayFieldChange("socialLinks", value, "add")
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.socialLinks).map((link, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer text-xs"
                    onClick={() => onArrayFieldChange("socialLinks", link, "remove")}
                  >
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {link}
                    </a>{" "}
                    ×
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {getArrayValue(profile.socialLinks).length > 0 ? (
                getArrayValue(profile.socialLinks).map((link, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                      {link}
                    </a>
                  </Badge>
                ))
              ) : (
                <span className="text-xs sm:text-sm text-gray-400">{t("admin.users.customer.noSocialLinks")}</span>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="benefits" className="text-xs sm:text-sm">{t("admin.users.customer.benefits")}</Label>
          {isEditing ? (
            <Textarea
              id="benefits"
              value={getStringValue(formData.benefits)}
              onChange={(e) => onFieldChange("benefits", e.target.value)}
              placeholder={t("admin.users.customer.benefitsPlaceholder")}
              rows={3}
              className="text-sm sm:text-base"
            />
          ) : (
            <p className="text-sm sm:text-base break-words">{getStringValue(profile.benefits) || em()}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">{t("admin.users.customer.languages")}</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={t("admin.users.customer.addLanguage")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const value = (e.target as HTMLInputElement).value
                      if (value.trim()) {
                        onArrayFieldChange("languages", value, "add")
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.languages).map((lang, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer text-xs"
                    onClick={() => onArrayFieldChange("languages", lang, "remove")}
                  >
                    {lang} ×
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {getArrayValue(profile.languages).length > 0 ? (
                getArrayValue(profile.languages).map((lang, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {lang}
                  </Badge>
                ))
              ) : (
                <span className="text-xs sm:text-sm text-gray-400">{t("admin.users.customer.noLanguages")}</span>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mission" className="text-xs sm:text-sm">{t("admin.users.customer.mission")}</Label>
          {isEditing ? (
            <Textarea
              id="mission"
              value={getStringValue(formData.mission)}
              onChange={(e) => onFieldChange("mission", e.target.value)}
              placeholder={t("admin.users.customer.missionPlaceholder")}
              rows={3}
              className="text-sm sm:text-base"
            />
          ) : (
            <p className="text-sm sm:text-base break-words">{getStringValue(profile.mission) || em()}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">{t("admin.users.customer.values")}</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={t("admin.users.customer.addValue")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const value = (e.target as HTMLInputElement).value
                      if (value.trim()) {
                        onArrayFieldChange("values", value, "add")
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.values).map((value, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer text-xs"
                    onClick={() => onArrayFieldChange("values", value, "remove")}
                  >
                    {value} ×
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {getArrayValue(profile.values).length > 0 ? (
                getArrayValue(profile.values).map((value, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {value}
                  </Badge>
                ))
              ) : (
                <span className="text-xs sm:text-sm text-gray-400">{t("admin.users.customer.noValues")}</span>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <Label htmlFor="establishedYear" className="text-xs sm:text-sm">{t("admin.users.customer.establishedYear")}</Label>
            {isEditing ? (
              <Input
                id="establishedYear"
                type="number"
                value={getStringValue(formData.establishedYear)}
                onChange={(e) =>
                  onFieldChange("establishedYear", e.target.value ? Number.parseInt(e.target.value) : null)
                }
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base">{getStringValue(profile.establishedYear) || em()}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fundingStage" className="text-xs sm:text-sm">{t("admin.users.customer.fundingStage")}</Label>
            {isEditing ? (
              <Input
                id="fundingStage"
                value={getStringValue(formData.fundingStage)}
                onChange={(e) => onFieldChange("fundingStage", e.target.value)}
                placeholder={t("admin.users.customer.fundingPlaceholder")}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base break-words">{getStringValue(profile.fundingStage) || em()}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="remotePolicy" className="text-xs sm:text-sm">{t("admin.users.customer.remotePolicy")}</Label>
            {isEditing ? (
              <Input
                id="remotePolicy"
                value={getStringValue(formData.remotePolicy)}
                onChange={(e) => onFieldChange("remotePolicy", e.target.value)}
                placeholder={t("admin.users.customer.remotePolicyPlaceholder")}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base break-words">{getStringValue(profile.remotePolicy) || em()}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hiringFrequency" className="text-xs sm:text-sm">{t("admin.users.customer.hiringFrequency")}</Label>
            {isEditing ? (
              <Input
                id="hiringFrequency"
                value={getStringValue(formData.hiringFrequency)}
                onChange={(e) => onFieldChange("hiringFrequency", e.target.value)}
                placeholder={t("admin.users.customer.hiringPlaceholder")}
                className="text-sm sm:text-base"
              />
            ) : (
              <p className="text-sm sm:text-base break-words">{getStringValue(profile.hiringFrequency) || em()}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">{t("admin.users.customer.categories")}</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={t("admin.users.customer.addCategory")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const value = (e.target as HTMLInputElement).value
                      if (value.trim()) {
                        onArrayFieldChange("categoriesHiringFor", value, "add")
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.categoriesHiringFor).map((category, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer text-xs"
                    onClick={() => onArrayFieldChange("categoriesHiringFor", category, "remove")}
                  >
                    {category} ×
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {getArrayValue(profile.categoriesHiringFor).length > 0 ? (
                getArrayValue(profile.categoriesHiringFor).map((category, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))
              ) : (
                <span className="text-xs sm:text-sm text-gray-400">{t("admin.users.customer.noCategories")}</span>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label className="text-xs sm:text-sm">{t("admin.users.customer.mediaGallery")}</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder={t("admin.users.customer.addMediaUrl")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const value = (e.target as HTMLInputElement).value
                      if (value.trim()) {
                        onArrayFieldChange("mediaGallery", value, "add")
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.mediaGallery).map((url, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer text-xs max-w-full"
                    onClick={() => onArrayFieldChange("mediaGallery", url, "remove")}
                  >
                    <span className="truncate block max-w-[200px]">{url}</span> ×
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {getArrayValue(profile.mediaGallery).length > 0 ? (
                getArrayValue(profile.mediaGallery).map((url, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline truncate max-w-[200px] block">
                      {url}
                    </a>
                  </Badge>
                ))
              ) : (
                <span className="text-xs sm:text-sm text-gray-400">{t("admin.users.customer.noMediaGallery")}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

