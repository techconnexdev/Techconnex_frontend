"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KycUser } from "./types"

interface ProfileDetailsCardProps {
  user: KycUser
}

export function ProfileDetailsCard({ user }: ProfileDetailsCardProps) {
  if (!user.profile) return null

  const profile = user.profile
  const getStringValue = (value: unknown): string => {
    if (typeof value === "string") return value
    if (typeof value === "number") return String(value)
    return "—"
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
        <CardTitle className="text-lg">
          {user.role === "PROVIDER" ? "Provider Profile Details" : "Customer Profile Details"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {user.role === "PROVIDER" ? (
          <>
            <p>
              <span className="font-medium">Bio:</span> {getStringValue(profile.bio)}
            </p>
            <p>
              <span className="font-medium">Location:</span> {getStringValue(profile.location)}
            </p>
            <p>
              <span className="font-medium">Website:</span> {getStringValue(profile.website)}
            </p>
            <p>
              <span className="font-medium">Years of Experience:</span>{" "}
              {getStringValue(profile.yearsExperience)}
            </p>
            <p>
              <span className="font-medium">Hourly Rate:</span> ${getStringValue(profile.hourlyRate)}
            </p>
            <p>
              <span className="font-medium">Languages:</span>{" "}
              {getArrayValue(profile.languages).join(", ") || "—"}
            </p>
            <p>
              <span className="font-medium">Skills:</span>{" "}
              {getArrayValue(profile.skills).join(", ") || "—"}
            </p>
            <p>
              <span className="font-medium">Work Preference:</span>{" "}
              {getStringValue(profile.workPreference)}
            </p>
            <p>
              <span className="font-medium">Team Size:</span> {getStringValue(profile.teamSize)}
            </p>
            <p>
              <span className="font-medium">Rating:</span> {getStringValue(profile.rating)} ⭐
            </p>
          </>
        ) : (
          <>
            <p>
              <span className="font-medium">Description:</span> {getStringValue(profile.description)}
            </p>
            <p>
              <span className="font-medium">Industry:</span> {getStringValue(profile.industry)}
            </p>
            <p>
              <span className="font-medium">Location:</span> {getStringValue(profile.location)}
            </p>
            <p>
              <span className="font-medium">Website:</span> {getStringValue(profile.website)}
            </p>
            <p>
              <span className="font-medium">Company Size:</span> {getStringValue(profile.companySize)}
            </p>
            <p>
              <span className="font-medium">Established Year:</span>{" "}
              {getStringValue(profile.establishedYear)}
            </p>
            <p>
              <span className="font-medium">Annual Revenue:</span>{" "}
              {getStringValue(profile.annualRevenue)}
            </p>
            <p>
              <span className="font-medium">Funding Stage:</span> {getStringValue(profile.fundingStage)}
            </p>
            <p>
              <span className="font-medium">Preferred Contracts:</span>{" "}
              {getArrayValue(profile.preferredContractTypes).join(", ")}
            </p>
            <p>
              <span className="font-medium">Hiring Categories:</span>{" "}
              {getArrayValue(profile.categoriesHiringFor).join(", ")}
            </p>
            <p>
              <span className="font-medium">Mission:</span> {getStringValue(profile.mission)}
            </p>
            <p>
              <span className="font-medium">Values:</span>{" "}
              {getArrayValue(profile.values).join(", ")}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}

