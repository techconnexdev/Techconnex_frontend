"use client";

import React, { useEffect, useState } from "react";
import type {
  UploadedDocument,
  ProfileData,
  Stats,
  DocumentType,
} from "./types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Save,
  Edit,
  Loader2,
  CheckCircle,
  AlertCircle,
  ListTodo,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { CustomerProfileTour } from "../CustomerProfileTour";

type TabValue = "profile" | "company" | "verification";

type Props = {
  profileData?: ProfileData;
  uploadedDocuments?: UploadedDocument[];
  documentTypes?: DocumentType[];
  stats?: Stats;
  /** When set, the profile page opens with this tab selected (e.g. from /customer/profile/company). */
  defaultTab?: TabValue;
};

export default function ProfileClient(props: Props = {}) {
  const {
    profileData: initialProfileData,
    uploadedDocuments: initialUploadedDocuments,
    stats: initialStats,
    defaultTab = "profile",
  } = props;
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(
    initialProfileData ?? null,
  );
  const [docs, setDocs] = useState<UploadedDocument[]>(
    initialUploadedDocuments ?? [],
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statsState, setStatsState] = useState<Stats | null>(
    initialStats ?? null,
  );
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [completionSuggestions, setCompletionSuggestions] = useState<string[]>(
    [],
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
    const payload: Record<string, unknown> = {
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
    // Send phone so backend can set it once when not yet assigned (same as provider profile)
    if (
      frontendProfile.phone != null &&
      String(frontendProfile.phone).trim() !== ""
    ) {
      payload.phone = String(frontendProfile.phone).trim();
    }
    return payload;
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
                item.reviewer &&
                typeof item.reviewer === "object" &&
                item.reviewer !== null &&
                "name" in item.reviewer
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
              reviewer:
                item.reviewer &&
                typeof item.reviewer === "object" &&
                item.reviewer !== null
                  ? {
                      id: String(
                        (item.reviewer as Record<string, unknown>).id || "",
                      ),
                      name: String(
                        (item.reviewer as Record<string, unknown>).name || "",
                      ),
                      email: (item.reviewer as Record<string, unknown>).email
                        ? String(
                            (item.reviewer as Record<string, unknown>).email,
                          )
                        : undefined,
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
        <div className="text-center text-sm sm:text-base text-gray-600">
          Loading profile...
        </div>
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
      <CustomerProfileTour />
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
        data-tour-step="0"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Profile
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your account settings and company information
          </p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => setIsEditing(true)}
            className="w-full sm:w-auto text-xs sm:text-sm"
            data-tour-step="1"
          >
            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            Edit Profile
          </Button>
        )}
      </div>

      {/* Edit-mode banner: clear indicator and actions (same pattern as provider profile) */}
      {isEditing && (
        <div
          role="status"
          aria-live="polite"
          className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 py-3 px-4 -mx-4 sm:mx-0 sm:rounded-lg bg-amber-50 border border-amber-200 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-3 min-w-0">
            <p className="text-sm text-amber-900">
              <strong>Editing your profile.</strong> Update any section below
              (Profile, Company, Verification) and click{" "}
              <strong>Save changes</strong> when done.
            </p>
            {profileCompletion < 100 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-900 hover:bg-amber-100 hover:text-amber-950"
                  >
                    <ListTodo className="w-3.5 h-3.5 mr-1.5" />
                    View missing fields
                    <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-80 max-h-[60vh] overflow-y-auto"
                >
                  <div className="px-3 py-2 border-b bg-muted/50">
                    <p className="text-sm font-semibold text-gray-900">
                      Incomplete or missing
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Complete these to increase your profile score
                    </p>
                  </div>
                  {completionSuggestions.length > 0 ? (
                    <div className="py-1">
                      {completionSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span className="break-words">{suggestion}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-sm text-muted-foreground">
                      Fill in all sections below (Profile, Company, Verification)
                      to complete your profile.
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save changes
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Profile completion: compact strip (full checklist in edit banner dropdown) */}
      {profileCompletion < 100 && (
        <div
          className="flex flex-wrap items-center gap-2 sm:gap-3 py-2.5 px-3 rounded-lg border border-blue-200 bg-blue-50/80"
          data-tour-step="2"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-2 w-20 sm:w-24 rounded-full bg-blue-200 overflow-hidden flex-shrink-0">
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, profileCompletion)}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-blue-800 whitespace-nowrap">
              {profileCompletion}%
            </span>
          </div>
          <span className="text-xs text-blue-700">
            Profile incomplete — click <strong>Edit Profile</strong> then{" "}
            <strong>View missing fields</strong> to see what to add.
          </span>
        </div>
      )}
      {profileCompletion === 100 && (
        <div
          className="flex items-center gap-2 py-2.5 px-3 rounded-lg border border-green-200 bg-green-50/80"
          data-tour-step="2"
        >
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <span className="text-sm font-medium text-green-800">
            Your profile is complete!
          </span>
        </div>
      )}

      <div data-tour-step="3">
      <Tabs
        defaultValue={defaultTab}
        className="space-y-4 sm:space-y-5 lg:space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>

        <TabsContent
          value="profile"
          className="space-y-4 sm:space-y-5 lg:space-y-6"
        >
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

        <TabsContent
          value="company"
          className="space-y-4 sm:space-y-5 lg:space-y-6"
        >
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

        <TabsContent
          value="verification"
          className="space-y-4 sm:space-y-5 lg:space-y-6"
        >
          <VerificationSection
            documents={docs}
            setDocuments={setDocs}
            documentType={"COMPANY_REG"}
            userId={getUserIdFromToken() || undefined}
          />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
