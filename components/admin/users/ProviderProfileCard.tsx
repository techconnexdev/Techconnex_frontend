"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ProviderProfile } from "./types"

interface ProviderProfileCardProps {
  profile: ProviderProfile
  formData: ProviderProfile
  isEditing: boolean
  onFieldChange: (field: string, value: unknown) => void
  onArrayFieldChange: (field: string, value: string, action: "add" | "remove") => void
}

export function ProviderProfileCard({
  profile,
  formData,
  isEditing,
  onFieldChange,
  onArrayFieldChange,
}: ProviderProfileCardProps) {
  const getStringValue = (value: unknown): string => {
    if (typeof value === "string") return value
    if (typeof value === "number") return String(value)
    return ""
  }

  const getNumberValue = (value: unknown): number => {
    if (typeof value === "number") return value
    if (typeof value === "string") {
      const parsed = Number.parseFloat(value)
      return isNaN(parsed) ? 0 : parsed
    }
    return 0
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
        <CardTitle>Provider Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          {isEditing ? (
            <Textarea
              id="bio"
              value={getStringValue(formData.bio)}
              onChange={(e) => onFieldChange("bio", e.target.value)}
              placeholder="Enter bio"
              rows={4}
            />
          ) : (
            <p>{getStringValue(profile.bio) || "—"}</p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <Label htmlFor="hourlyRate">Hourly Rate (RM)</Label>
            {isEditing ? (
              <Input
                id="hourlyRate"
                type="number"
                value={getNumberValue(formData.hourlyRate)}
                onChange={(e) =>
                  onFieldChange("hourlyRate", e.target.value ? Number.parseFloat(e.target.value) : null)
                }
              />
            ) : (
              <p>{profile.hourlyRate ? `RM ${profile.hourlyRate}` : "—"}</p>
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
              <p>{getStringValue(profile.website) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="yearsExperience">Years Experience</Label>
            {isEditing ? (
              <Input
                id="yearsExperience"
                type="number"
                value={getNumberValue(formData.yearsExperience)}
                onChange={(e) =>
                  onFieldChange("yearsExperience", e.target.value ? Number.parseInt(e.target.value) : null)
                }
              />
            ) : (
              <p>{getStringValue(profile.yearsExperience) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="availability">Availability</Label>
            {isEditing ? (
              <Select
                value={getStringValue(formData.availability) || "available"}
                onValueChange={(value) => onFieldChange("availability", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p>{getStringValue(profile.availability) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="workPreference">Work Preference</Label>
            {isEditing ? (
              <Select
                value={getStringValue(formData.workPreference) || "remote"}
                onValueChange={(value) => onFieldChange("workPreference", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <p>{getStringValue(profile.workPreference) || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamSize">Team Size</Label>
            {isEditing ? (
              <Input
                id="teamSize"
                type="number"
                value={formData.teamSize || 1}
                onChange={(e) => onFieldChange("teamSize", e.target.value ? Number.parseInt(e.target.value) : 1)}
              />
            ) : (
              <p>{profile.teamSize || "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="minimumProjectBudget">Minimum Project Budget (RM)</Label>
            {isEditing ? (
              <Input
                id="minimumProjectBudget"
                type="number"
                value={getNumberValue(formData.minimumProjectBudget)}
                onChange={(e) =>
                  onFieldChange("minimumProjectBudget", e.target.value ? Number.parseFloat(e.target.value) : null)
                }
              />
            ) : (
              <p>{profile.minimumProjectBudget ? `RM ${profile.minimumProjectBudget}` : "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="maximumProjectBudget">Maximum Project Budget (RM)</Label>
            {isEditing ? (
              <Input
                id="maximumProjectBudget"
                type="number"
                value={getNumberValue(formData.maximumProjectBudget)}
                onChange={(e) =>
                  onFieldChange("maximumProjectBudget", e.target.value ? Number.parseFloat(e.target.value) : null)
                }
              />
            ) : (
              <p>{profile.maximumProjectBudget ? `RM ${profile.maximumProjectBudget}` : "—"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="preferredProjectDuration">Preferred Project Duration</Label>
            {isEditing ? (
              <Input
                id="preferredProjectDuration"
                value={getStringValue(formData.preferredProjectDuration)}
                onChange={(e) => onFieldChange("preferredProjectDuration", e.target.value)}
                placeholder="e.g. 1-3 months"
              />
            ) : (
              <p>{getStringValue(profile.preferredProjectDuration) || "—"}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Skills</Label>
          {isEditing ? (
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Add skill"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      const value = (e.target as HTMLInputElement).value
                      if (value.trim()) {
                        onArrayFieldChange("skills", value, "add")
                        ;(e.target as HTMLInputElement).value = ""
                      }
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {getArrayValue(formData.skills).map((skill, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => onArrayFieldChange("skills", skill, "remove")}
                  >
                    {skill} ×
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {getArrayValue(profile.skills).length > 0 ? (
                getArrayValue(profile.skills).map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))
              ) : (
                <span className="text-gray-400">No skills</span>
              )}
            </div>
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
      </CardContent>
    </Card>
  )
}

