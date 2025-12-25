"use client";

import React, { useEffect, useState } from "react";
import type {
  UploadedDocument,
  ProfileData,
  Stats,
  DocumentType,
} from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Edit, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  upsertCompanyProfile,
  getCompanyProfile,
  getKycDocuments,
  getCompanyProfileCompletion,
  getUserIdFromToken,
  API_BASE,
} from "@/lib/api";

import ProfileOverview from "./sections/ProfileOverview";
import CompanyInfo from "./sections/CompanyInfo";
import VerificationSection from "./sections/VerificationSection";

type Props = {
  profileData?: ProfileData;
  uploadedDocuments?: UploadedDocument[];
  documentTypes?: DocumentType[];
  stats?: Stats;
};

export default function ProfileClient(props: Props = {}) {
  const {
    profileData: initialProfileData,
    uploadedDocuments: initialUploadedDocuments,
    stats: initialStats,
  } = props;
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(
    initialProfileData ?? null
  );
  const [docs, setDocs] = useState<UploadedDocument[]>(
    initialUploadedDocuments ?? []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statsState, setStatsState] = useState<Stats | null>(
    initialStats ?? null
  );
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [completionSuggestions, setCompletionSuggestions] = useState<string[]>(
    []
  );

  // documentTypes removed - not used in component

  const defaultProfile: ProfileData = {
    email: "",
    name: "",
    phone: "",
    isVerified: false,
    kycStatus: "",
    createdAt: new Date().toISOString(),
    customerProfile: {
      description: "",
      industry: "",
      location: "",
      website: "",
      profileImageUrl: "",
      socialLinks: [],
      languages: [],
      companySize: "",
      employeeCount: 0,
      establishedYear: 0,
      annualRevenue: "",
      fundingStage: "",
      preferredContractTypes: [],
      averageBudgetRange: "",
      remotePolicy: "",
      hiringFrequency: "",
      categoriesHiringFor: [],
      completion: 0,
      rating: 0,
      reviewCount: 0,
      totalSpend: "0",
      projectsPosted: 0,
      lastActiveAt: "",
      mission: "",
      values: [],
      benefits: "",
      mediaGallery: [],
    },
    kycDocuments: [],
  };

  const transformToBackendFormat = (frontendProfile: ProfileData | null) => {
    if (!frontendProfile) return {};
    return {
      description: frontendProfile.customerProfile?.description || "",
      industry: frontendProfile.customerProfile?.industry || "",
      location: frontendProfile.customerProfile?.location || "",
      website: frontendProfile.customerProfile?.website || "",
      socialLinks: frontendProfile.customerProfile?.socialLinks || [],
      languages: frontendProfile.customerProfile?.languages || [],
      companySize: frontendProfile.customerProfile?.companySize || "",
      employeeCount: frontendProfile.customerProfile?.employeeCount || 0,
      establishedYear: frontendProfile.customerProfile?.establishedYear || 0,
      annualRevenue: frontendProfile.customerProfile?.annualRevenue || "",
      fundingStage: frontendProfile.customerProfile?.fundingStage || "",
      preferredContractTypes:
        frontendProfile.customerProfile?.preferredContractTypes || [],
      averageBudgetRange:
        frontendProfile.customerProfile?.averageBudgetRange || "",
      remotePolicy: frontendProfile.customerProfile?.remotePolicy || "",
      hiringFrequency: frontendProfile.customerProfile?.hiringFrequency || "",
      categoriesHiringFor:
        frontendProfile.customerProfile?.categoriesHiringFor || [],
      mission: frontendProfile.customerProfile?.mission || "",
      values: frontendProfile.customerProfile?.values || [],
      benefits: frontendProfile.customerProfile?.benefits || "",
      mediaGallery: frontendProfile.customerProfile?.mediaGallery || [],
    };
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const backendData = transformToBackendFormat(profile);
      const response = await upsertCompanyProfile(backendData);

      if (response?.data) {
        setProfile(response.data);
      }

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      // Reload completion percentage and suggestions
      try {
        const completionResponse = await getCompanyProfileCompletion();
        if (completionResponse.success) {
          setProfileCompletion(completionResponse.data.completion || 0);
          setCompletionSuggestions(completionResponse.data.suggestions || []);
        }
      } catch (error) {
        console.error("Failed to fetch completion:", error);
      }
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Fetch profile and kyc documents client-side when not provided via props
  useEffect(() => {
    if (initialProfileData) return; // server provided

    setIsLoading(true);
    (async () => {
      try {
        const [profileResp, completionResp] = await Promise.all([
          getCompanyProfile(),
          getCompanyProfileCompletion(),
        ]);

        if (profileResp?.data) setProfile(profileResp.data);

        if (profileResp?.data) {
          const pd = profileResp.data as ProfileData;
          const computed: Stats = {
            projectsPosted: pd.customerProfile?.projectsPosted || 0,
            rating: pd.customerProfile?.rating || 0,
            reviewCount: pd.customerProfile?.reviewCount || 0,
            totalSpend: pd.customerProfile?.totalSpend || "0",
            completion: pd.customerProfile?.completion || 0,
            lastActiveAt: pd.customerProfile?.lastActiveAt || "",
            memberSince: new Date(pd.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
            }),
          };
          setStatsState(computed);
        }

        // Set completion and suggestions
        if (completionResp?.success) {
          setProfileCompletion(completionResp.data.completion || 0);
          setCompletionSuggestions(completionResp.data.suggestions || []);
        }

        try {
          const kycResp = await getKycDocuments();
          const docsData = (kycResp?.data?.documents ??
            kycResp?.data ??
            []) as unknown[];
          const mapped = docsData.map((d) => {
            const item = d as Record<string, unknown>;
            const fileUrl = item.fileUrl ? String(item.fileUrl) : undefined;
            // Construct full URL if it's a relative path
            const fullFileUrl =
              fileUrl && fileUrl.startsWith("/")
                ? `${API_BASE}${fileUrl}`
                : fileUrl;
            return {
              id: String(item.id ?? ""),
              name: String(item.filename ?? item.fileUrl ?? item.id ?? ""),
              type: String(item.type ?? "document"),
              size: String(item.size ?? "-"),
              uploadDate: String(item.uploadedAt ?? item.uploadDate ?? ""),
              // Normalize backend statuses (uploaded|verified|rejected) to our UI statuses
              status: ((): "pending" | "approved" | "rejected" => {
                const raw = String(item.status ?? "uploaded").toLowerCase();
                if (raw === "verified" || raw === "approved") return "approved";
                if (raw === "rejected") return "rejected";
                return "pending"; // uploaded / uploaded-but-not-reviewed
              })(),
              rejectionReason: item.reviewNotes
                ? String(item.reviewNotes)
                : undefined,
              // prefer the reviewer's display name when available (item.reviewer.name),
              // otherwise fall back to any top-level reviewedBy value
              reviewedBy:
                item.reviewer && typeof item.reviewer === "object" && item.reviewer !== null && "name" in item.reviewer
                  ? String((item.reviewer as Record<string, unknown>).name)
                  : item.reviewedBy
                  ? String(item.reviewedBy)
                  : undefined,
              reviewedAt: item.reviewedAt
                ? new Date(String(item.reviewedAt)).toLocaleString("en-MY", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })
                : undefined,
              fileUrl: fullFileUrl,
              reviewer: item.reviewer && typeof item.reviewer === "object" && item.reviewer !== null
                ? {
                    id: String((item.reviewer as Record<string, unknown>).id || ""),
                    name: String((item.reviewer as Record<string, unknown>).name || ""),
                    email: (item.reviewer as Record<string, unknown>).email ? String((item.reviewer as Record<string, unknown>).email) : undefined,
                  }
                : null,
            } as UploadedDocument;
          });
          setDocs(mapped);
        } catch (err) {
          console.warn("Failed to fetch KYC documents", err);
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
        toast({
          title: "Error",
          description: "Failed to load profile. Please login and try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // initialProfileData and toast are intentionally excluded

  // Recompute stats when profile changes
  useEffect(() => {
    if (!profile) return;
    const pd = profile as ProfileData;
    const computed: Stats = {
      projectsPosted: pd.customerProfile?.projectsPosted || 0,
      rating: pd.customerProfile?.rating || 0,
      reviewCount: pd.customerProfile?.reviewCount || 0,
      totalSpend: pd.customerProfile?.totalSpend || "0",
      completion: pd.customerProfile?.completion || 0,
      lastActiveAt: pd.customerProfile?.lastActiveAt || "",
      memberSince: new Date(pd.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      }),
    };
    setStatsState(computed);
  }, [profile]);

  if (isLoading && !profile) {
    return (
      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-0">
        <div className="text-center text-sm sm:text-base text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-0">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="text-sm sm:text-base text-gray-700">
            No profile found for your account.
          </div>
          <div>
            <Button
              onClick={() => {
                setProfile(defaultProfile);
                setIsEditing(true);
              }}
              className="text-xs sm:text-sm"
            >
              Create Profile
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">Manage your account settings</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
                className="text-xs sm:text-sm w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="text-xs sm:text-sm w-full sm:w-auto">
                {isSaving ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                )}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)} className="text-xs sm:text-sm w-full sm:w-auto">
              <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Profile Completion */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm sm:text-base text-blue-900">
                Profile Completion
              </h3>
              <p className="text-xs sm:text-sm text-blue-700 mt-0.5">
                Complete your profile to attract more providers
              </p>
            </div>
            <div className="text-left sm:text-right flex-shrink-0">
              <p className="text-xl sm:text-2xl font-bold text-blue-600">
                {profileCompletion}%
              </p>
            </div>
          </div>
          <Progress value={profileCompletion} className="h-2 mb-3 sm:mb-4" />
          {completionSuggestions.length > 0 && (
            <div className="mt-3 sm:mt-4">
              <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1.5 sm:mb-2">
                To complete your profile:
              </p>
              <ul className="space-y-1">
                {completionSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="text-xs sm:text-sm text-blue-700 flex items-start gap-1.5 sm:gap-2"
                  >
                    <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {profileCompletion === 100 && (
            <div className="mt-3 sm:mt-4 flex items-center gap-1.5 sm:gap-2 text-green-700">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">
                Your profile is complete! 🎉
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="profile" className="space-y-4 sm:space-y-5 lg:space-y-6">
        <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 sm:space-y-5 lg:space-y-6">
          <ProfileOverview
            value={profile as ProfileData}
            onChange={setProfile}
            isEditing={isEditing}
            onCompletionUpdate={(completion, suggestions) => {
              setProfileCompletion(completion);
              setCompletionSuggestions(suggestions);
            }}
            memberSince={statsState?.memberSince || ""}
          />
        </TabsContent>

        <TabsContent value="company" className="space-y-4 sm:space-y-5 lg:space-y-6">
          <CompanyInfo
            value={profile as ProfileData}
            onChange={setProfile}
            isEditing={isEditing}
            onCompletionUpdate={(completion, suggestions) => {
              setProfileCompletion(completion);
              setCompletionSuggestions(suggestions);
            }}
          />
        </TabsContent>

        <TabsContent value="verification" className="space-y-4 sm:space-y-5 lg:space-y-6">
          <VerificationSection
            documents={docs}
            setDocuments={setDocs}
            documentType={"COMPANY_REG"}
            userId={getUserIdFromToken() || undefined}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
