"use client"

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
      <CardHeader>
        <CardTitle>Company Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          {isEditing ? (
            <Textarea
              id="description"
              value={getStringValue(formData.description)}
              onChange={(e) => onFieldChange("description", e.target.value)}
              placeholder="Enter company description"
              rows={4}
            />
          ) : (
            <p>{getStringValue(profile.description) || "—"}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            {isEditing ? (
              <Input
                id="industry"
                value={getStringValue(formData.industry)}
                onChange={(e) => onFieldChange("industry", e.target.value)}
              />
            ) : (
              <p>{getStringValue(profile.industry) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            {isEditing ? (
              <Input
                id="location"
                value={getStringValue(formData.location)}
                onChange={(e) => onFieldChange("location", e.target.value)}
              />
            ) : (
              <p>{getStringValue(profile.location) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="companySize">Company Size</Label>
            {isEditing ? (
              <Input
                id="companySize"
                value={getStringValue(formData.companySize)}
                onChange={(e) => onFieldChange("companySize", e.target.value)}
              />
            ) : (
              <p>{getStringValue(profile.companySize) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="employeeCount">Employee Count</Label>
            {isEditing ? (
              <Input
                id="employeeCount"
                type="number"
                value={getStringValue(formData.employeeCount)}
                onChange={(e) =>
                  onFieldChange("employeeCount", e.target.value ? Number.parseInt(e.target.value) : null)
                }
              />
            ) : (
              <p>{getStringValue(profile.employeeCount) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website</Label>
            {isEditing ? (
              <Input
                id="website"
                type="url"
                value={getStringValue(formData.website)}
                onChange={(e) => onFieldChange("website", e.target.value)}
                placeholder="https://..."
              />
            ) : (
              <p>
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
                  "—"
                )}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="annualRevenue">Annual Revenue</Label>
            {isEditing ? (
              <Input
                id="annualRevenue"
                value={getStringValue(formData.annualRevenue)}
                onChange={(e) => onFieldChange("annualRevenue", e.target.value)}
                placeholder="e.g. 500000"
              />
            ) : (
              <p>{getStringValue(profile.annualRevenue) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="averageBudgetRange">Average Budget Range</Label>
            {isEditing ? (
              <Input
                id="averageBudgetRange"
                value={getStringValue(formData.averageBudgetRange)}
                onChange={(e) => onFieldChange("averageBudgetRange", e.target.value)}
                placeholder="e.g. 20000"
              />
            ) : (
              <p>{getStringValue(profile.averageBudgetRange) || "—"}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Preferred Contract Types</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add contract type"
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
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.preferredContractTypes).map((type, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
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
                  <Badge key={index} variant="secondary">
                    {type}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">No contract types</span>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Social Links</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add social link (e.g. https://linkedin.com/company/example)"
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
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.socialLinks).map((link, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => onArrayFieldChange("socialLinks", link, "remove")}
                  >
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
                  <Badge key={index} variant="secondary">
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {link}
                    </a>
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">No social links</span>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="benefits">Benefits</Label>
          {isEditing ? (
            <Textarea
              id="benefits"
              value={getStringValue(formData.benefits)}
              onChange={(e) => onFieldChange("benefits", e.target.value)}
              placeholder="Enter company benefits"
              rows={3}
            />
          ) : (
            <p>{getStringValue(profile.benefits) || "—"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Languages</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add language"
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
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.languages).map((lang, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
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
                  <Badge key={index} variant="secondary">
                    {lang}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">No languages</span>
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="mission">Mission</Label>
          {isEditing ? (
            <Textarea
              id="mission"
              value={getStringValue(formData.mission)}
              onChange={(e) => onFieldChange("mission", e.target.value)}
              placeholder="Enter company mission"
              rows={3}
            />
          ) : (
            <p>{getStringValue(profile.mission) || "—"}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Company Values</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add value"
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
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.values).map((value, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
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
                  <Badge key={index} variant="secondary">
                    {value}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">No values</span>
              )}
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="establishedYear">Established Year</Label>
            {isEditing ? (
              <Input
                id="establishedYear"
                type="number"
                value={getStringValue(formData.establishedYear)}
                onChange={(e) =>
                  onFieldChange("establishedYear", e.target.value ? Number.parseInt(e.target.value) : null)
                }
              />
            ) : (
              <p>{getStringValue(profile.establishedYear) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="fundingStage">Funding Stage</Label>
            {isEditing ? (
              <Input
                id="fundingStage"
                value={getStringValue(formData.fundingStage)}
                onChange={(e) => onFieldChange("fundingStage", e.target.value)}
                placeholder="e.g. Bootstrap, Seed, Series A"
              />
            ) : (
              <p>{getStringValue(profile.fundingStage) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="remotePolicy">Remote Policy</Label>
            {isEditing ? (
              <Input
                id="remotePolicy"
                value={getStringValue(formData.remotePolicy)}
                onChange={(e) => onFieldChange("remotePolicy", e.target.value)}
                placeholder="On-site, Remote, Hybrid"
              />
            ) : (
              <p>{getStringValue(profile.remotePolicy) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="hiringFrequency">Hiring Frequency</Label>
            {isEditing ? (
              <Input
                id="hiringFrequency"
                value={getStringValue(formData.hiringFrequency)}
                onChange={(e) => onFieldChange("hiringFrequency", e.target.value)}
                placeholder="occasional, regular, enterprise"
              />
            ) : (
              <p>{getStringValue(profile.hiringFrequency) || "—"}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Categories Hiring For</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add category"
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
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.categoriesHiringFor).map((category, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
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
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">No categories</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

