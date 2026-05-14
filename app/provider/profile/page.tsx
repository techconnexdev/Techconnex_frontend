"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Star,
  MapPin,
  Calendar,
  Award,
  Edit,
  Plus,
  Trash2,
  Upload,
  ExternalLink,
  CheckCircle,
  Loader2,
  X,
  Globe,
  Camera,
  AlertCircle,
  FileText,
  ChevronDown,
  ListTodo,
} from "lucide-react";
import { ProviderProfileTour } from "@/components/provider/ProviderProfileTour";
import {
  getProviderProfile,
  upsertProviderProfile,
  getProviderProfileStats,
  getProviderProfileCompletion,
  uploadProviderProfileImage,
  getProviderPortfolio,
  getProviderPortfolioItems,
  createPortfolioItem,
  updatePortfolioItem,
  deletePortfolioItem,
  getProfileImageUrl,
  uploadPortfolioImage,
  getMyCertifications,
  createCertification,
  updateCertification,
  deleteCertification,
  getUserIdFromToken,
  getKycDocuments,
  API_BASE,
  getMyResume,
  uploadResume,
  deleteResume,
  getR2DownloadUrl,
} from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { uploadFile } from "@/lib/upload";
import { useToast } from "@/hooks/use-toast";
import { useInvalidateProviderLayoutProfile } from "@/hooks/useInvalidateProviderLayoutProfile";
import { useI18n } from "@/contexts/I18nProvider";
import { PREFERRED_CURRENCY_OPTIONS } from "@/lib/currency-options";
import { formatProviderMoney } from "@/lib/provider-currency-format";
import { useRef } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useProviderCompletion } from "@/contexts/ProviderCompletionContext";
import VerificationSection from "@/components/customer/profile/sections/VerificationSection";
import { UploadedDocument } from "@/components/customer/profile/types";
import { ProfileImageCropModal } from "@/components/provider/ProfileImageCropModal";
import {
  ProviderProfileCertificationsSkeleton,
  ProviderProfilePageSkeleton,
} from "@/components/provider/ProviderProfileSkeletons";
import {
  ProviderContactVerificationDialog,
  type ContactVerifyNeeds,
} from "@/components/provider/ProviderContactVerificationDialog";
import { PhoneInputField } from "@/app/auth/register/components/PhoneInputField";

type Props = Record<string, never>;

type PortfolioProject = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  technologies?: string[];
  client?: string;
  completedDate?: string;
  approvedPrice?: number;
};

type PortfolioItem = {
  id: string;
  title: string;
  description?: string;
  techStack?: string[];
  client?: string;
  date?: string;
  imageUrl?: string;
  externalUrl?: string;
};

type Certification = {
  id: string;
  name: string;
  issuer: string;
  issuedDate?: string;
  serialNumber?: string;
  sourceUrl?: string;
  verified?: boolean;
};

type Reviewer = {
  id: string;
  name: string;
  email?: string;
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function ProviderProfilePage(_props: Props) {
  // Props are required by Next.js but not used in this client component

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileCropOpen, setProfileCropOpen] = useState(false);
  const [pendingProfileImageFile, setPendingProfileImageFile] =
    useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const portfolioImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPortfolioImage, setUploadingPortfolioImage] = useState(false);
  const [profileData, setProfileData] = useState<{
    name: string;
    email: string;
    phone: string;
    bio: string;
    major: string;
    location: string;
    hourlyRate: number;
    website: string;
    portfolioLinks: string[];
    profileImageUrl: string;
    languages: string[];
    availability: string;
    skills: string[];
    yearsExperience: number;
    minimumProjectBudget: number;
    maximumProjectBudget: number;
    preferredProjectDuration: string;
    workPreference: string;
    teamSize: number;
    preferredCurrency: string;
  }>({
    name: "",
    email: "",
    phone: "",
    bio: "",
    major: "",
    location: "",
    hourlyRate: 0,
    website: "",
    portfolioLinks: [],
    profileImageUrl: "",
    languages: [],
    availability: "available",
    skills: [],
    yearsExperience: 0,
    minimumProjectBudget: 0,
    maximumProjectBudget: 0,
    preferredProjectDuration: "",
    workPreference: "remote",
    teamSize: 1,
    preferredCurrency: "MYR",
  });
  const [fxSnapshotDate, setFxSnapshotDate] = useState<string | null>(null);
  const [profileStats, setProfileStats] = useState({
    rating: 0,
    totalReviews: 0,
    totalProjects: 0,
    totalEarnings: 0,
    viewsCount: 0,
    successRate: 0,
    responseTime: 0,
    completion: 0,
  });
  const { refetch: refetchCompletion } = useProviderCompletion();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [completionSuggestions, setCompletionSuggestions] = useState<string[]>(
    [],
  );
  /** Server truth for email/phone when edit started (OTP flow matches company profile). */
  const [contactSnapshot, setContactSnapshot] = useState({
    email: "",
    phone: "",
  });
  const [contactVerifyOpen, setContactVerifyOpen] = useState(false);
  const [contactVerifyNeeds, setContactVerifyNeeds] =
    useState<ContactVerifyNeeds>({
      emailCurrent: false,
      emailNew: false,
      phoneCurrent: false,
      phoneNew: false,
    });
  const contactProfileApi = useMemo(() => `${API_BASE}/provider/profile`, []);
  const [profileFormErrors, setProfileFormErrors] = useState<{
    name?: string;
    email?: string;
    phone?: string;
    bio?: string;
    major?: string;
    location?: string;
    hourlyRate?: string;
    website?: string;
    portfolioLinks?: string;
    languages?: string;
    skills?: string;
    yearsExperience?: string;
    minimumProjectBudget?: string;
    maximumProjectBudget?: string;
    preferredProjectDuration?: string;
    teamSize?: string;
  }>({});
  /** Server flag: WhatsApp / phone OTP completed (drives Settings → Notifications). */
  const [phoneVerified, setPhoneVerified] = useState(false);
  const { toast } = useToast();
  const invalidateLayoutProfile = useInvalidateProviderLayoutProfile();
  const { t, locale } = useI18n();

  const syncPhoneVerifiedToAuthStorage = useCallback((verified: boolean) => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const u = JSON.parse(raw) as Record<string, unknown>;
      if (!u || typeof u !== "object") return;
      u.phoneVerified = verified;
      u.isPhoneVerified = verified;
      localStorage.setItem("user", JSON.stringify(u));
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // State for input fields (similar to registration form)
  const [customSkill, setCustomSkill] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [newPortfolioLink, setNewPortfolioLink] = useState("");

  // State for portfolio projects (platform projects)
  const [portfolioProjects, setPortfolioProjects] = useState<
    PortfolioProject[]
  >([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);

  // State for portfolio items (external work)
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [loadingPortfolioItems, setLoadingPortfolioItems] = useState(false);
  const [selectedPortfolioItem, setSelectedPortfolioItem] =
    useState<PortfolioItem | null>(null);
  const [portfolioItemToDelete, setPortfolioItemToDelete] =
    useState<PortfolioItem | null>(null);
  const [deletingPortfolioItem, setDeletingPortfolioItem] = useState(false);
  const [showPortfolioDialog, setShowPortfolioDialog] = useState(false);
  const [editingPortfolioIndex, setEditingPortfolioIndex] = useState<
    number | null
  >(null);
  const [portfolioFormData, setPortfolioFormData] = useState({
    title: "",
    description: "",
    techStack: [] as string[],
    client: "",
    date: "",
    imageUrl: "",
    externalUrl: "",
  });
  const [newTechStack, setNewTechStack] = useState("");
  const [portfolioFormErrors, setPortfolioFormErrors] = useState<{
    title?: string;
    description?: string;
    date?: string;
  }>({});

  // State for certifications
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loadingCertifications, setLoadingCertifications] = useState(false);
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [certFormData, setCertFormData] = useState({
    name: "",
    issuer: "",
    issuedDate: "",
    serialNumber: "",
    sourceUrl: "",
  });
  const [certFormErrors, setCertFormErrors] = useState<{
    name?: string;
    issuer?: string;
    issuedDate?: string;
    serialNumber?: string;
    sourceUrl?: string;
  }>({});
  const [docs, setDocs] = useState<UploadedDocument[]>([]);
  const [resume, setResume] = useState<{
    fileUrl: string;
    uploadedAt: string;
  } | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [deletingResume, setDeletingResume] = useState(false);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  // Controlled tab for switching to verification from warning
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");

  // Sync tab from URL (e.g. /provider/profile?tab=verification)
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "verification") setActiveTab("verification");
  }, [searchParams]);

  // Provider is verified if at least one KYC document has approved status
  const isProviderVerified = docs.some((d) => d.status === "approved");

  // Load profile data on component mount
  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setLoading(true);
        const [
          profileResponse,
          statsResponse,
          completionResponse,
          resumeResponse,
        ] = await Promise.all([
          getProviderProfile(),
          getProviderProfileStats(),
          getProviderProfileCompletion(),
          getMyResume().catch(() => ({ success: false, data: null })), // Resume is optional
        ]);

        if (profileResponse.success) {
          const profile = profileResponse.data;
          const initialPhone = profile.user?.phone || "";
          const initialEmail = profile.user?.email || "";
          setContactSnapshot({
            email: String(initialEmail).trim(),
            phone: String(initialPhone).trim(),
          });
          const verified = Boolean(profile.user?.phoneVerified);
          setPhoneVerified(verified);
          syncPhoneVerifiedToAuthStorage(verified);

          setProfileData({
            name: profile.user?.name || "",
            email: profile.user?.email || "",
            phone: initialPhone,
            bio: profile.bio || "",
            major: profile.major || "",
            location: profile.location || "",
            hourlyRate: profile.hourlyRate || 0,
            website: profile.website || "",
            portfolioLinks: profile.portfolioLinks || [],
            profileImageUrl: profile.profileImageUrl || "",
            languages: profile.languages || [],
            availability: profile.availability || "available",
            skills: profile.skills || [],
            yearsExperience: profile.yearsExperience || 0,
            minimumProjectBudget: profile.minimumProjectBudget || 0,
            maximumProjectBudget: profile.maximumProjectBudget || 0,
            preferredProjectDuration: profile.preferredProjectDuration || "",
            workPreference: profile.workPreference || "remote",
            teamSize: profile.teamSize || 1,
            preferredCurrency:
              (profile as { preferredCurrency?: string }).preferredCurrency ||
              "MYR",
          });
          setFxSnapshotDate(
            (profile as { fxSnapshotDate?: string | null }).fxSnapshotDate ??
              null,
          );

          // Load portfolio links if available
          if (profile.portfolioLinks && Array.isArray(profile.portfolioLinks)) {
            setProfileData((prev) => ({
              ...prev,
              portfolioLinks: profile.portfolioLinks,
            }));
          }
        }

        if (statsResponse.success) {
          setProfileStats(statsResponse.data);
        }

        if (completionResponse.success) {
          setProfileCompletion(completionResponse.data.completion ?? 0);
          setCompletionSuggestions(completionResponse.data.suggestions || []);
        }
        await refetchCompletion();

        if (resumeResponse.success && resumeResponse.data) {
          setResume(resumeResponse.data);
        }
      } catch (error) {
        toast({
          title: t("provider.profile.toast.errorTitle"),
          description: getUserFriendlyErrorMessage(
            error,
            "provider profile load",
          ),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfileData();
  }, [toast, t, syncPhoneVerifiedToAuthStorage]);

  // Load portfolio projects
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setLoadingPortfolio(true);
        const response = await getProviderPortfolio();
        if (response.success && response.data) {
          setPortfolioProjects(response.data);
        }
      } catch (error) {
        toast({
          title: t("provider.profile.toast.errorTitle"),
          description: getUserFriendlyErrorMessage(
            error,
            "provider profile portfolio",
          ),
          variant: "destructive",
        });
      } finally {
        setLoadingPortfolio(false);
      }
    };

    loadPortfolio();
  }, [toast, t]);

  // Load portfolio items (external work)
  useEffect(() => {
    const loadPortfolioItems = async () => {
      try {
        setLoadingPortfolioItems(true);
        const response = await getProviderPortfolioItems();
        if (response.success && response.data) {
          setPortfolioItems(response.data);
        }
      } catch (error) {
        toast({
          title: t("provider.profile.toast.errorTitle"),
          description: getUserFriendlyErrorMessage(
            error,
            "provider profile portfolio items",
          ),
          variant: "destructive",
        });
      } finally {
        setLoadingPortfolioItems(false);
      }
    };

    loadPortfolioItems();
  }, [toast, t]);

  // Load certifications
  useEffect(() => {
    const loadCertifications = async () => {
      try {
        setLoadingCertifications(true);
        const response = await getMyCertifications();
        if (response.success && response.data) {
          setCertifications(response.data);
        }
      } catch (error) {
        toast({
          title: t("provider.profile.toast.errorTitle"),
          description: getUserFriendlyErrorMessage(
            error,
            "provider profile certifications",
          ),
          variant: "destructive",
        });
      } finally {
        setLoadingCertifications(false);
      }
    };

    loadCertifications();
  }, [toast, t]);

  // Fetch profile and kyc documents client-side
  useEffect(() => {
    setLoading(true);
    (async () => {
      try {
        const kycResp = await getKycDocuments();
        const docsData = (kycResp?.data?.documents ??
          kycResp?.data ??
          []) as unknown[];
        const mapped = docsData.map((d) => {
          const item = d as Record<string, unknown>;
          const fileUrl = item.fileUrl ? String(item.fileUrl) : undefined;
          // Use getAttachmentUrl helper for consistent URL handling (R2 keys, public URLs, local paths)
          // Note: We'll resolve the actual URL when downloading, not here
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
              "name" in item.reviewer
                ? String((item.reviewer as Reviewer).name)
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
            fileUrl: fileUrl, // Keep original fileUrl (R2 key or path) - will be resolved when downloading
            reviewer:
              item.reviewer && typeof item.reviewer === "object"
                ? {
                    id: String((item.reviewer as Reviewer).id || ""),
                    name: String((item.reviewer as Reviewer).name || ""),
                    email: (item.reviewer as Reviewer).email
                      ? String((item.reviewer as Reviewer).email)
                      : undefined,
                  }
                : null,
          } as UploadedDocument;
        });
        setDocs(mapped);
      } catch (err) {
        console.warn("Failed to fetch KYC documents", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Ensure href is absolute so target="_blank" opens in a new tab
  const ensureAbsoluteUrl = (url: string) => {
    if (!url?.trim()) return url;
    const trimmed = url.trim();
    return trimmed.startsWith("http://") || trimmed.startsWith("https://")
      ? trimmed
      : `https://${trimmed}`;
  };

  /** Same idea as customer profile: open WhatsApp OTP for the phone already on the account. */
  const handleVerifyCurrentPhone = () => {
    if (!contactSnapshot.phone?.trim()) {
      toast({
        title: t("provider.profile.toast.errorTitle"),
        description: t("provider.profile.toast.noPhoneToVerify"),
        variant: "destructive",
      });
      return;
    }
    setContactVerifyNeeds({
      emailCurrent: false,
      emailNew: false,
      phoneCurrent: true,
      phoneNew: false,
    });
    setContactVerifyOpen(true);
  };

  const computeContactVerifyNeeds = (): ContactVerifyNeeds | null => {
    const emailChanged =
      (profileData.email || "").trim().toLowerCase() !==
      (contactSnapshot.email || "").trim().toLowerCase();
    const phoneChanged =
      (profileData.phone || "").trim() !== (contactSnapshot.phone || "").trim();
    if (!emailChanged && !phoneChanged) return null;
    return {
      emailCurrent: emailChanged && !!contactSnapshot.email?.trim(),
      emailNew: emailChanged,
      phoneCurrent: phoneChanged && !!contactSnapshot.phone?.trim(),
      phoneNew: phoneChanged,
    };
  };

  const executeProfileSave = async () => {
    try {
      setSaving(true);
      const response = await upsertProviderProfile({
        bio: profileData.bio,
        major: profileData.major,
        location: profileData.location,
        ...(profileData.email != null &&
          profileData.email.trim() !== "" && {
            email: profileData.email.trim(),
          }),
        ...(profileData.phone != null &&
          profileData.phone.trim() !== "" && {
            phone: profileData.phone.trim(),
          }),
        hourlyRate: profileData.hourlyRate,
        availability: profileData.availability,
        languages: profileData.languages,
        website: profileData.website,
        portfolioLinks: profileData.portfolioLinks,
        skills: profileData.skills,
        yearsExperience: profileData.yearsExperience,
        minimumProjectBudget: profileData.minimumProjectBudget,
        maximumProjectBudget: profileData.maximumProjectBudget,
        preferredProjectDuration: profileData.preferredProjectDuration,
        workPreference: profileData.workPreference,
        teamSize: profileData.teamSize,
        preferredCurrency: profileData.preferredCurrency,
      });

      if (response.success) {
        const payload = (response as { data?: { fxSnapshotDate?: string | null } })
          .data;
        if (payload?.fxSnapshotDate != null && payload.fxSnapshotDate !== "") {
          setFxSnapshotDate(payload.fxSnapshotDate);
        }
        setContactSnapshot({
          email: (profileData.email || "").trim(),
          phone: (profileData.phone || "").trim(),
        });
        invalidateLayoutProfile();
        toast({
          title: t("provider.profile.toast.successTitle"),
          description: t("provider.profile.toast.profileUpdated"),
        });
        setIsEditing(false);
        setProfileFormErrors({});
        const completionResponse = await getProviderProfileCompletion();
        if (completionResponse.success) {
          setProfileCompletion(completionResponse.data.completion ?? 0);
          setCompletionSuggestions(completionResponse.data.suggestions || []);
        }
        await refetchCompletion();
      } else {
        const msg =
          (response as { message?: string }).message ||
          (response as { error?: string }).error;
        toast({
          title: t("provider.profile.toast.errorTitle"),
          description:
            msg ||
            getUserFriendlyErrorMessage(undefined, "provider profile save"),
          variant: "destructive",
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({
        title: t("provider.profile.toast.errorTitle"),
        description:
          message ||
          getUserFriendlyErrorMessage(error, "provider profile save"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      toast({
        title: t("provider.profile.toast.validationTitle"),
        description: t("provider.profile.toast.validationDesc"),
        variant: "destructive",
      });
      return;
    }

    const verifyNeeds = computeContactVerifyNeeds();
    if (
      verifyNeeds &&
      (verifyNeeds.emailCurrent ||
        verifyNeeds.emailNew ||
        verifyNeeds.phoneCurrent ||
        verifyNeeds.phoneNew)
    ) {
      setContactVerifyNeeds(verifyNeeds);
      setContactVerifyOpen(true);
      return;
    }

    await executeProfileSave();
  };

  // Validate profile form (format/consistency only — no “required field” / empty checks)
  const validateProfile = () => {
    const errors: typeof profileFormErrors = {};

    if (profileData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email.trim())) {
        errors.email = t("provider.profile.validation.emailInvalid");
      }
    }

    // Hourly rate: disallow negative only
    if (profileData.hourlyRate < 0) {
      errors.hourlyRate = t("provider.profile.validation.hourlyNegative");
    }

    // Website: optional; if provided, must parse as URL
    if (profileData.website.trim()) {
      try {
        const url = profileData.website.trim();
        const urlWithProtocol =
          url.startsWith("http://") || url.startsWith("https://")
            ? url
            : `https://${url}`;
        new URL(urlWithProtocol);
      } catch {
        errors.website = t("provider.profile.validation.websiteInvalid");
      }
    }

    // Portfolio links: validate URL format only for non-empty entries
    const nonEmptyPortfolioLinks = profileData.portfolioLinks.filter((link) =>
      link.trim(),
    );
    if (nonEmptyPortfolioLinks.length > 0) {
      const invalidLinks = nonEmptyPortfolioLinks.filter((link) => {
        try {
          const trimmed = link.trim();
          const urlWithProtocol =
            trimmed.startsWith("http://") || trimmed.startsWith("https://")
              ? trimmed
              : `https://${trimmed}`;
          new URL(urlWithProtocol);
          return false;
        } catch {
          return true;
        }
      });
      if (invalidLinks.length > 0) {
        errors.portfolioLinks = t(
          "provider.profile.validation.portfolioLinksInvalid",
        );
      }
    }

    if (profileData.yearsExperience < 0) {
      errors.yearsExperience = t("provider.profile.validation.yearsNegative");
    }

    if (profileData.minimumProjectBudget < 0) {
      errors.minimumProjectBudget = t(
        "provider.profile.validation.minBudgetNegative",
      );
    }
    if (profileData.maximumProjectBudget < 0) {
      errors.maximumProjectBudget = t(
        "provider.profile.validation.maxBudgetNegative",
      );
    }
    if (
      profileData.minimumProjectBudget > 0 &&
      profileData.maximumProjectBudget > 0 &&
      profileData.minimumProjectBudget > profileData.maximumProjectBudget
    ) {
      errors.minimumProjectBudget = t(
        "provider.profile.validation.minExceedsMax",
      );
      errors.maximumProjectBudget = t(
        "provider.profile.validation.maxBelowMin",
      );
    }

    setProfileFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (field: string, value: string | number) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    if (profileFormErrors[field as keyof typeof profileFormErrors]) {
      setProfileFormErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Handle skills array changes
  const handleSkillsChange = (skills: string[]) => {
    setProfileData((prev) => ({
      ...prev,
      skills,
    }));
  };

  // Handle languages array changes
  const handleLanguagesChange = (languages: string[]) => {
    setProfileData((prev) => ({
      ...prev,
      languages,
    }));
  };

  // Popular skills and languages (same as registration form)
  const popularSkills = [
    "React",
    "Next.js",
    "Vue.js",
    "Angular",
    "Node.js",
    "Python",
    "Java",
    "PHP",
    "Mobile Development",
    "iOS",
    "Android",
    "Flutter",
    "React Native",
    "Cloud Computing",
    "AWS",
    "Azure",
    "Google Cloud",
    "DevOps",
    "Database",
    "MySQL",
    "PostgreSQL",
    "MongoDB",
    "Redis",
    "UI/UX Design",
    "Figma",
    "Adobe XD",
    "Photoshop",
    "Cybersecurity",
    "Blockchain",
    "IoT",
    "AI/ML",
    "Data Science",
  ];

  const commonLanguages = [
    "English",
    "Bahasa Malaysia",
    "Mandarin",
    "Tamil",
    "Cantonese",
    "Hokkien",
    "Hindi",
    "Arabic",
    "Japanese",
    "Korean",
    "French",
    "German",
  ];

  // Handler functions for adding/removing items
  const handleAddCustomSkill = () => {
    if (
      customSkill.trim() &&
      !profileData.skills.includes(customSkill.trim())
    ) {
      handleSkillsChange([...profileData.skills, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    handleSkillsChange(profileData.skills.filter((s) => s !== skill));
  };

  const handleSkillToggle = (skill: string) => {
    if (profileData.skills.includes(skill)) {
      handleRemoveSkill(skill);
    } else {
      handleSkillsChange([...profileData.skills, skill]);
    }
  };

  const handleAddCustomLanguage = () => {
    if (
      customLanguage.trim() &&
      !profileData.languages.includes(customLanguage.trim())
    ) {
      handleLanguagesChange([...profileData.languages, customLanguage.trim()]);
      setCustomLanguage("");
    }
  };

  const handleRemoveLanguage = (language: string) => {
    handleLanguagesChange(profileData.languages.filter((l) => l !== language));
  };

  const handleLanguageToggle = (language: string) => {
    if (profileData.languages.includes(language)) {
      handleRemoveLanguage(language);
    } else {
      handleLanguagesChange([...profileData.languages, language]);
    }
  };

  const handleAddPortfolioLink = () => {
    if (!newPortfolioLink.trim()) {
      return;
    }

    // Validate URL format
    try {
      const url = newPortfolioLink.trim();
      const urlWithProtocol =
        url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`;
      new URL(urlWithProtocol);
    } catch {
      toast({
        title: t("provider.profile.toast.invalidUrlTitle"),
        description: t("provider.profile.toast.invalidUrlDesc"),
        variant: "destructive",
      });
      return;
    }

    if (!profileData.portfolioLinks.includes(newPortfolioLink.trim())) {
      setProfileData((prev) => ({
        ...prev,
        portfolioLinks: [...prev.portfolioLinks, newPortfolioLink.trim()],
      }));
      setNewPortfolioLink("");
      // Clear portfolio links error if it exists
      if (profileFormErrors.portfolioLinks) {
        setProfileFormErrors((prev) => ({
          ...prev,
          portfolioLinks: undefined,
        }));
      }
    } else {
      toast({
        title: t("provider.profile.toast.duplicateLinkTitle"),
        description: t("provider.profile.toast.duplicateLinkDesc"),
        variant: "destructive",
      });
    }
  };

  const handleRemovePortfolioLink = (url: string) => {
    setProfileData((prev) => ({
      ...prev,
      portfolioLinks: prev.portfolioLinks.filter((u) => u !== url),
    }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: t("provider.profile.toast.invalidImageTypeTitle"),
        description: t("provider.profile.toast.invalidImageTypeDesc"),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: t("provider.profile.toast.fileTooLargeTitle"),
        description: t("provider.profile.toast.imageTooLargeDesc"),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    setPendingProfileImageFile(file);
    setProfileCropOpen(true);
    e.target.value = "";
  };

  const handleProfileImageCropConfirm = async (croppedFile: File) => {
    setPendingProfileImageFile(null);
    setUploadingImage(true);
    try {
      const result = await uploadProviderProfileImage(croppedFile);
      setProfileData((prev) => ({
        ...prev,
        profileImageUrl: result.data.profileImageUrl,
      }));
      invalidateLayoutProfile();
      toast({
        title: t("provider.profile.toast.successTitle"),
        description: t("provider.profile.toast.profileImageUploaded"),
      });
      const completionResponse = await getProviderProfileCompletion();
      if (completionResponse.success) {
        setProfileCompletion(completionResponse.data.completion ?? 0);
        setCompletionSuggestions(completionResponse.data.suggestions || []);
        refetchCompletion();
      }
    } catch (error: unknown) {
      toast({
        title: t("provider.profile.toast.uploadFailedTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile image upload",
        ),
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const availabilityDisplayLabel = (value: string) => {
    if (value === "busy") return t("provider.profile.availability.busy");
    if (value === "unavailable")
      return t("provider.profile.availability.unavailable");
    return t("provider.profile.availability.available");
  };

  const workPrefDisplayLabel = (value: string) => {
    if (value === "onsite") return t("provider.profile.workPref.onsite");
    if (value === "hybrid") return t("provider.profile.workPref.hybrid");
    return t("provider.profile.workPref.remote");
  };

  if (loading) {
    return (
      <ProviderProfilePageSkeleton
        loadingLabel={t("provider.profile.loading")}
      />
    );
  }

  // Resume handlers
  const handleResumeClick = () => {
    resumeInputRef.current?.click();
  };

  const handleResumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast({
        title: t("provider.profile.toast.invalidImageTypeTitle"),
        description: t("provider.profile.toast.resumePdfOnly"),
        variant: "destructive",
      });
      if (e.target) {
        e.target.value = ""; // Reset input
      }
      return;
    }

    // Validate file size (50MB max for documents)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      toast({
        title: t("provider.profile.toast.fileTooLargeTitle"),
        description: t("provider.profile.toast.resumeMaxMb", {
          mb: (maxSize / (1024 * 1024)).toFixed(0),
        }),
        variant: "destructive",
      });
      if (e.target) {
        e.target.value = ""; // Reset input
      }
      return;
    }

    setUploadingResume(true);
    try {
      // Upload to R2 first
      let uploadResult;
      try {
        uploadResult = await uploadFile({
          file: file,
          prefix: "resumes",
          visibility: "private",
          category: "document",
        });
      } catch (uploadError: unknown) {
        // Handle R2 upload errors
        const errorMessage =
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError);
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("fetch")
        ) {
          throw new Error(
            "Network error: Unable to connect to upload service. Please check your internet connection and try again.",
          );
        }
        if (errorMessage.includes("size") || errorMessage.includes("limit")) {
          throw new Error(`File size error: ${errorMessage}`);
        }
        if (errorMessage.includes("type") || errorMessage.includes("format")) {
          throw new Error(`File type error: ${errorMessage}`);
        }
        throw new Error(
          `Upload failed: ${errorMessage || "Unknown error occurred during file upload"}`,
        );
      }

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload resume to R2");
      }

      // Send R2 key to backend
      let response;
      try {
        response = await uploadResume(uploadResult.key);
      } catch (apiError: unknown) {
        // Handle API errors
        const errorMessage =
          apiError instanceof Error ? apiError.message : String(apiError);
        const errorName = apiError instanceof Error ? apiError.name : "";
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("fetch") ||
          errorName === "TypeError"
        ) {
          throw new Error(
            "Network error: Unable to connect to server. Please check your internet connection and try again.",
          );
        }
        if (errorMessage.includes("401") || errorMessage.includes("403")) {
          throw new Error(
            "Authorization error: Your session may have expired. Please refresh the page and try again.",
          );
        }
        throw apiError instanceof Error
          ? apiError
          : new Error(String(apiError));
      }

      if (response.success) {
        setResume(response.data);
        toast({
          title: t("provider.profile.toast.successTitle"),
          description: t("provider.profile.toast.resumeUploaded"),
        });
      } else {
        throw new Error(response.error || "Failed to save resume");
      }
    } catch (error: unknown) {
      toast({
        title: t("provider.profile.toast.uploadFailedTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile resume upload",
        ),
        variant: "destructive",
      });
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
    }
  };

  const handleDeleteResume = async () => {
    if (!confirm(t("provider.profile.confirm.deleteResume"))) {
      return;
    }

    setDeletingResume(true);
    try {
      await deleteResume();
      setResume(null);
      toast({
        title: t("provider.profile.toast.successTitle"),
        description: t("provider.profile.toast.resumeDeleted"),
      });
    } catch (error: unknown) {
      toast({
        title: t("provider.profile.toast.deleteFailedTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile resume delete",
        ),
        variant: "destructive",
      });
    } finally {
      setDeletingResume(false);
    }
  };

  const handleDownloadResume = async () => {
    if (!resume?.fileUrl) return;

    try {
      const downloadUrl = await getR2DownloadUrl(resume.fileUrl);
      window.open(downloadUrl.downloadUrl, "_blank");
    } catch (error: unknown) {
      toast({
        title: t("provider.profile.toast.downloadFailedTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile resume download",
        ),
        variant: "destructive",
      });
    }
  };

  // Certification handlers
  const handleAddCertification = () => {
    setEditingCertIndex(null);
    setCertFormData({
      name: "",
      issuer: "",
      issuedDate: "",
      serialNumber: "",
      sourceUrl: "",
    });
    setCertFormErrors({});
    setShowCertDialog(true);
  };

  const handleEditCertification = (index: number) => {
    const cert = certifications[index];
    setEditingCertIndex(index);
    setCertFormData({
      name: cert.name || "",
      issuer: cert.issuer || "",
      issuedDate: cert.issuedDate
        ? new Date(cert.issuedDate).toISOString().split("T")[0]
        : "",
      serialNumber: cert.serialNumber || "",
      sourceUrl: cert.sourceUrl || "",
    });
    setCertFormErrors({});
    setShowCertDialog(true);
  };

  const validateCertification = () => {
    const errors: typeof certFormErrors = {};

    if (!certFormData.name.trim()) {
      errors.name = t("provider.profile.validation.certNameRequired");
    }

    if (!certFormData.issuer.trim()) {
      errors.issuer = t("provider.profile.validation.certIssuerRequired");
    }

    if (!certFormData.issuedDate) {
      errors.issuedDate = t("provider.profile.validation.certDateRequired");
    }

    // At least one of serialNumber or sourceUrl must be provided
    if (!certFormData.serialNumber?.trim() && !certFormData.sourceUrl?.trim()) {
      const serialOrUrl = t("provider.profile.validation.certSerialOrUrl");
      errors.serialNumber = serialOrUrl;
      errors.sourceUrl = serialOrUrl;
    }

    setCertFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveCertification = async () => {
    if (!validateCertification()) {
      return;
    }

    try {
      setSaving(true);
      const certData = {
        name: certFormData.name.trim(),
        issuer: certFormData.issuer.trim(),
        issuedDate: certFormData.issuedDate,
        serialNumber: certFormData.serialNumber?.trim() || undefined,
        sourceUrl: certFormData.sourceUrl?.trim() || undefined,
      };

      if (editingCertIndex !== null) {
        // Update existing certification
        const certId = certifications[editingCertIndex].id;
        const response = await updateCertification(certId, certData);
        if (response.success) {
          toast({
            title: t("provider.profile.toast.successTitle"),
            description: t("provider.profile.toast.certUpdated"),
          });
          // Reload certifications
          const certsResponse = await getMyCertifications();
          if (certsResponse.success && certsResponse.data) {
            setCertifications(certsResponse.data);
          }
          // Reload completion percentage and suggestions
          const completionResponse = await getProviderProfileCompletion();
          if (completionResponse.success) {
            setProfileCompletion(completionResponse.data.completion ?? 0);
            setCompletionSuggestions(completionResponse.data.suggestions || []);
            refetchCompletion();
          }
        }
      } else {
        // Create new certification
        const response = await createCertification(certData);
        if (response.success) {
          toast({
            title: t("provider.profile.toast.successTitle"),
            description: t("provider.profile.toast.certAdded"),
          });
          // Reload certifications
          const certsResponse = await getMyCertifications();
          if (certsResponse.success && certsResponse.data) {
            setCertifications(certsResponse.data);
          }
          // Reload completion percentage and suggestions
          const completionResponse = await getProviderProfileCompletion();
          if (completionResponse.success) {
            refetchCompletion();
            setCompletionSuggestions(completionResponse.data.suggestions || []);
          }
        }
      }

      setShowCertDialog(false);
      setCertFormData({
        name: "",
        issuer: "",
        issuedDate: "",
        serialNumber: "",
        sourceUrl: "",
      });
      setEditingCertIndex(null);
    } catch (error: unknown) {
      toast({
        title: t("provider.profile.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile save certification",
        ),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCertification = async (index: number) => {
    const cert = certifications[index];
    if (!cert.id) return;

    if (!confirm(t("provider.profile.confirm.deleteCert"))) {
      return;
    }

    try {
      setSaving(true);
      const response = await deleteCertification(cert.id);
      if (response.success) {
        toast({
          title: t("provider.profile.toast.successTitle"),
          description: t("provider.profile.toast.certDeleted"),
        });
        // Reload certifications
        const certsResponse = await getMyCertifications();
        if (certsResponse.success && certsResponse.data) {
          setCertifications(certsResponse.data);
        }
        // Reload completion percentage and suggestions
        const completionResponse = await getProviderProfileCompletion();
        if (completionResponse.success) {
          setProfileCompletion(completionResponse.data.completion ?? 0);
          setCompletionSuggestions(completionResponse.data.suggestions || []);
        }
        await refetchCompletion();
      }
    } catch (error: unknown) {
      toast({
        title: t("provider.profile.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile delete certification",
        ),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Portfolio Item Handlers
  const validatePortfolioItem = () => {
    const errors: typeof portfolioFormErrors = {};

    if (!portfolioFormData.title.trim()) {
      errors.title = t("provider.profile.validation.portfolioTitleRequired");
    }

    if (!portfolioFormData.description.trim()) {
      errors.description = t(
        "provider.profile.validation.portfolioDescRequired",
      );
    }

    if (!portfolioFormData.date) {
      errors.date = t("provider.profile.validation.portfolioDateRequired");
    }

    setPortfolioFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePortfolioItem = async () => {
    if (!validatePortfolioItem()) {
      return;
    }

    try {
      setSaving(true);
      const portfolioData = {
        title: portfolioFormData.title.trim(),
        description: portfolioFormData.description.trim(),
        techStack: portfolioFormData.techStack,
        client: portfolioFormData.client?.trim() || undefined,
        date: portfolioFormData.date,
        imageUrl: portfolioFormData.imageUrl?.trim() || undefined,
        externalUrl: portfolioFormData.externalUrl?.trim() || undefined,
      };

      if (editingPortfolioIndex !== null) {
        // Update existing portfolio item
        const itemId = portfolioItems[editingPortfolioIndex].id;
        const response = await updatePortfolioItem(itemId, portfolioData);
        if (response.success) {
          toast({
            title: t("provider.profile.toast.successTitle"),
            description: t("provider.profile.toast.portfolioUpdated"),
          });
          // Reload portfolio items
          const itemsResponse = await getProviderPortfolioItems();
          if (itemsResponse.success && itemsResponse.data) {
            setPortfolioItems(itemsResponse.data);
          }
          // Reload completion percentage and suggestions
          const completionResponse = await getProviderProfileCompletion();
          if (completionResponse.success) {
            setProfileCompletion(completionResponse.data.completion ?? 0);
            setCompletionSuggestions(completionResponse.data.suggestions || []);
            refetchCompletion();
          }
        }
      } else {
        // Create new portfolio item
        const response = await createPortfolioItem(portfolioData);
        if (response.success) {
          toast({
            title: t("provider.profile.toast.successTitle"),
            description: t("provider.profile.toast.portfolioAdded"),
          });
          // Reload portfolio items
          const itemsResponse = await getProviderPortfolioItems();
          if (itemsResponse.success && itemsResponse.data) {
            setPortfolioItems(itemsResponse.data);
          }
          // Reload completion percentage and suggestions
          const completionResponse = await getProviderProfileCompletion();
          if (completionResponse.success) {
            setProfileCompletion(completionResponse.data.completion ?? 0);
            setCompletionSuggestions(completionResponse.data.suggestions || []);
            refetchCompletion();
          }
        }
      }

      setShowPortfolioDialog(false);
      setPortfolioFormData({
        title: "",
        description: "",
        techStack: [],
        client: "",
        date: "",
        imageUrl: "",
        externalUrl: "",
      });
      setNewTechStack("");
      setEditingPortfolioIndex(null);
    } catch (error: unknown) {
      toast({
        title: t("provider.profile.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile save portfolio item",
        ),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddTechStack = () => {
    if (
      newTechStack.trim() &&
      !portfolioFormData.techStack.includes(newTechStack.trim())
    ) {
      setPortfolioFormData((prev) => ({
        ...prev,
        techStack: [...prev.techStack, newTechStack.trim()],
      }));
      setNewTechStack("");
    }
  };

  const handleRemoveTechStack = (tech: string) => {
    setPortfolioFormData((prev) => ({
      ...prev,
      techStack: prev.techStack.filter((entry) => entry !== tech),
    }));
  };

  const handleConfirmDeletePortfolioItem = async () => {
    if (!portfolioItemToDelete) return;

    try {
      setDeletingPortfolioItem(true);
      await deletePortfolioItem(portfolioItemToDelete.id);
      toast({
        title: t("provider.profile.toast.successTitle"),
        description: t("provider.profile.toast.portfolioDeleted"),
      });

      const itemsResponse = await getProviderPortfolioItems();
      if (itemsResponse.success && itemsResponse.data) {
        setPortfolioItems(itemsResponse.data);
      }

      try {
        const completionResponse = await getProviderProfileCompletion();
        if (completionResponse.success) {
          setProfileCompletion(completionResponse.data.completion ?? 0);
          setCompletionSuggestions(completionResponse.data.suggestions || []);
        }
        await refetchCompletion();
      } catch (error) {
        console.error("Failed to fetch completion:", error);
      }
    } catch (error: unknown) {
      toast({
        title: t("provider.profile.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider profile delete portfolio item",
        ),
        variant: "destructive",
      });
    } finally {
      setDeletingPortfolioItem(false);
      setPortfolioItemToDelete(null);
    }
  };

  return (
    <>
      <ProviderProfileTour />
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4"
          data-tour-step="0"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("provider.profile.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t("provider.profile.subtitle")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            {!isEditing && (
              <Button
                onClick={async () => {
                  setIsEditing(true);
                  setProfileFormErrors({});
                  // Refresh completion so "View missing fields" is up to date
                  try {
                    const res = await getProviderProfileCompletion();
                    if (res.success) {
                      setProfileCompletion(res.data.completion ?? 0);
                      setCompletionSuggestions(res.data.suggestions || []);
                    }
                  } catch {
                    // ignore
                  }
                }}
                className="w-full sm:w-auto text-xs sm:text-sm"
                data-tour-step="1"
              >
                <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {t("provider.profile.editProfile")}
              </Button>
            )}
          </div>
        </div>

        {/* Edit-mode banner: clear indicator and actions */}
        {isEditing && (
          <div
            role="status"
            aria-live="polite"
            className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 py-3 px-4 -mx-4 sm:mx-0 sm:rounded-lg bg-amber-50 border border-amber-200 shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <p className="text-sm text-amber-900">
                <strong>{t("provider.profile.editBanner.line1")}</strong>{" "}
                {t("provider.profile.editBanner.line2")}{" "}
                <strong>{t("provider.profile.editBanner.saveCta")}</strong>{" "}
                {t("provider.profile.editBanner.whenDone")}
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
                      {t("provider.profile.viewMissing")}
                      <ChevronDown className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-80 max-h-[60vh] overflow-y-auto"
                  >
                    <div className="px-3 py-2 border-b bg-muted/50">
                      <p className="text-sm font-semibold text-gray-900">
                        {t("provider.profile.missing.title")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t("provider.profile.missing.hint")}
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
                        {t("provider.profile.missing.emptyHint")}
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
                onClick={() => {
                  setIsEditing(false);
                  setProfileFormErrors({});
                  setProfileData((prev) => ({
                    ...prev,
                    email: contactSnapshot.email,
                    phone: contactSnapshot.phone,
                  }));
                }}
              >
                {t("provider.profile.cancel")}
              </Button>
              <Button size="sm" onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("provider.profile.saving")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t("provider.profile.saveChanges")}
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Profile completion: compact strip (full checklist lives in header widget) */}
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
              {t("provider.profile.completion.hintPart1")}{" "}
              <strong>{t("provider.profile.completion.profileWord")}</strong>{" "}
              {t("provider.profile.completion.hintPart2")}
            </span>
          </div>
        )}

        {/* Verification warning: clickable, navigates to Verification tab */}
        {!isProviderVerified && (
          <button
            type="button"
            onClick={() => setActiveTab("verification")}
            className="flex flex-wrap items-center gap-2 sm:gap-3 py-2.5 px-3 rounded-lg border border-amber-200 bg-amber-50/90 hover:bg-amber-100/90 hover:border-amber-300 w-full text-left transition-colors cursor-pointer"
          >
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span className="text-sm font-semibold text-amber-800">
              {t("provider.profile.verifyBanner.title")}
            </span>
            <span className="text-xs text-amber-700">
              {t("provider.profile.verifyBanner.desc")}
            </span>
            <ChevronDown className="w-4 h-4 text-amber-600 rotate-[270deg] flex-shrink-0 ml-auto" />
          </button>
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 sm:space-y-6"
          data-tour-step="3"
        >
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger
              value="overview"
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              {t("provider.profile.tabs.overview")}
            </TabsTrigger>
            <TabsTrigger
              value="portfolio"
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              {t("provider.profile.tabs.portfolio")}
            </TabsTrigger>
            <TabsTrigger
              value="skills"
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              {t("provider.profile.tabs.skills")}
            </TabsTrigger>
            <TabsTrigger
              value="verification"
              className="text-xs sm:text-sm px-2 sm:px-4"
            >
              {t("provider.profile.tabs.verification")}
            </TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
              <div
                className="lg:col-span-2 space-y-4 sm:space-y-6"
                data-tour-step="4"
              >
                {/* Basic Info */}
                <Card
                  className={
                    isEditing
                      ? "ring-2 ring-blue-300 border-blue-200 bg-blue-50/30"
                      : ""
                  }
                >
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      {t("provider.profile.basic.title")}
                      {isEditing && (
                        <span className="text-xs font-normal text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                          {t("provider.profile.basic.editable")}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                          <AvatarImage
                            src={getProfileImageUrl(
                              profileData.profileImageUrl,
                            )}
                          />
                          <AvatarFallback className="text-base sm:text-lg">
                            {profileData.name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "PR"}
                          </AvatarFallback>
                        </Avatar>
                        {isEditing && (
                          <>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={handleImageChange}
                              className="hidden"
                            />
                            <Button
                              size="sm"
                              className="absolute -bottom-2 -right-2 rounded-full w-7 h-7 sm:w-8 sm:h-8 p-0"
                              onClick={handleImageClick}
                              disabled={uploadingImage}
                            >
                              {uploadingImage ? (
                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                              ) : (
                                <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 space-y-3 sm:space-y-4">
                        {isEditing ? (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <Label
                                  htmlFor="name"
                                  className="text-xs sm:text-sm"
                                >
                                  {t("provider.profile.label.fullName")}
                                </Label>
                                <Input
                                  id="name"
                                  value={profileData.name}
                                  disabled={true}
                                  className="bg-gray-50 text-sm sm:text-base"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {t(
                                    "provider.profile.hint.contactSupportName",
                                  )}
                                </p>
                              </div>
                              <div>
                                <Label
                                  htmlFor="email"
                                  className="text-xs sm:text-sm"
                                >
                                  {t("provider.profile.label.email")}
                                </Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={profileData.email}
                                  onChange={(e) =>
                                    handleInputChange("email", e.target.value)
                                  }
                                  className={`text-sm sm:text-base ${profileFormErrors.email ? "border-red-500" : ""}`}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {t("provider.profile.hint.emailVerifyOnSave")}
                                </p>
                                {profileFormErrors.email && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {profileFormErrors.email}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div>
                                <Label
                                  htmlFor="phone"
                                  className="text-xs sm:text-sm"
                                >
                                  {t("provider.profile.label.phone")}
                                </Label>
                                <div
                                  className={
                                    profileFormErrors.phone
                                      ? "mt-1 rounded-md ring-2 ring-red-500 ring-offset-1"
                                      : "mt-1"
                                  }
                                >
                                  <PhoneInputField
                                    id="phone"
                                    label=""
                                    value={profileData.phone || ""}
                                    onChange={(phone) =>
                                      handleInputChange("phone", phone ?? "")
                                    }
                                    placeholder={t(
                                      "provider.profile.phone.placeholder",
                                    )}
                                  />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {t("provider.profile.hint.phoneVerifyOnSave")}
                                </p>
                                {profileData.phone?.trim() && !phoneVerified ? (
                                  profileData.phone.trim() ===
                                    contactSnapshot.phone.trim() &&
                                  contactSnapshot.phone.trim() ? (
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <p className="text-xs text-amber-700">
                                        {t(
                                          "provider.profile.phone.notVerifiedPrompt",
                                        )}
                                      </p>
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-[11px]"
                                        onClick={handleVerifyCurrentPhone}
                                        disabled={contactVerifyOpen}
                                      >
                                        {t("provider.profile.phone.verify")}
                                      </Button>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-amber-600 mt-1">
                                      {t(
                                        "provider.profile.hint.phoneNotVerifiedWhatsApp",
                                      )}
                                    </p>
                                  )
                                ) : null}
                                {profileFormErrors.phone && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {profileFormErrors.phone}
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label
                                  htmlFor="location"
                                  className="text-xs sm:text-sm"
                                >
                                  {t("provider.profile.label.location")}
                                </Label>
                                <Input
                                  id="location"
                                  value={profileData.location}
                                  onChange={(e) =>
                                    handleInputChange(
                                      "location",
                                      e.target.value,
                                    )
                                  }
                                  className={`text-sm sm:text-base ${profileFormErrors.location ? "border-red-500" : ""}`}
                                />
                                {profileFormErrors.location && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {profileFormErrors.location}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div>
                              <Label
                                htmlFor="major"
                                className="text-xs sm:text-sm"
                              >
                                {t("provider.profile.label.major")}
                              </Label>
                              <Input
                                id="major"
                                value={profileData.major}
                                onChange={(e) =>
                                  handleInputChange("major", e.target.value)
                                }
                                placeholder={t(
                                  "provider.profile.major.placeholder",
                                )}
                                className={`text-sm sm:text-base ${profileFormErrors.major ? "border-red-500" : ""}`}
                              />
                              {profileFormErrors.major && (
                                <p className="text-xs text-red-600 mt-1">
                                  {profileFormErrors.major}
                                </p>
                              )}
                            </div>
                            <div>
                              <Label
                                htmlFor="bio"
                                className="text-xs sm:text-sm"
                              >
                                {t("provider.profile.label.bio")}
                              </Label>
                              <Textarea
                                id="bio"
                                value={profileData.bio}
                                onChange={(e) =>
                                  handleInputChange("bio", e.target.value)
                                }
                                placeholder={t(
                                  "provider.profile.bio.placeholder",
                                )}
                                rows={4}
                                className={`text-sm sm:text-base ${profileFormErrors.bio ? "border-red-500" : ""}`}
                              />
                              {profileFormErrors.bio && (
                                <p className="text-xs text-red-600 mt-1">
                                  {profileFormErrors.bio}
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>
                              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                                {profileData.name}
                              </h2>
                              <p className="text-sm sm:text-lg text-gray-600 break-words">
                                {profileData.email}
                              </p>
                              <p className="text-xs sm:text-base text-gray-500 break-words">
                                {profileData.phone}
                              </p>
                              {profileData.phone?.trim() && !phoneVerified ? (
                                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                  <p className="text-xs text-amber-700">
                                    {t(
                                      "provider.profile.phone.notVerifiedPrompt",
                                    )}
                                  </p>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    className="h-6 px-2 text-[11px]"
                                    onClick={handleVerifyCurrentPhone}
                                    disabled={contactVerifyOpen}
                                  >
                                    {t("provider.profile.phone.verify")}
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="break-words">
                                  {profileData.location}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                                {profileStats.rating} (
                                {t("provider.profile.reviewsCount", {
                                  count: profileStats.totalReviews,
                                })}
                                )
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                {t("provider.profile.joinedSample")}
                              </div>
                              <div className="flex items-center gap-1">
                                <CheckCircle
                                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 ${
                                    profileData.availability === "available"
                                      ? "text-green-500"
                                      : profileData.availability === "busy"
                                        ? "text-yellow-500"
                                        : "text-gray-400"
                                  }`}
                                />
                                <span>
                                  {availabilityDisplayLabel(
                                    profileData.availability || "available",
                                  )}
                                </span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {!isEditing && (
                      <>
                        {profileData.major && (
                          <div>
                            <Label className="text-xs sm:text-sm">
                              {t("provider.profile.label.major")}
                            </Label>
                            <p className="text-sm sm:text-base text-gray-600 mt-2 break-words">
                              {profileData.major}
                            </p>
                          </div>
                        )}
                        <div>
                          <Label className="text-xs sm:text-sm">
                            {t("provider.profile.professionalBio")}
                          </Label>
                          <p className="text-sm sm:text-base text-gray-600 mt-2 break-words">
                            {profileData.bio || t("provider.profile.noBio")}
                          </p>
                        </div>

                        <div className="border-t border-gray-200 pt-5 mt-5 space-y-5">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                            {t("provider.profile.overview.pricingSummary")}
                          </p>
                          <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                            <Card className="shadow-none border border-gray-100">
                              <CardContent className="p-4 sm:p-5">
                                <h3 className="font-semibold mb-3 text-sm sm:text-base">
                                  {t("provider.profile.experiencePrefs.title")}
                                </h3>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      {t("provider.profile.yearsExperience")}
                                    </p>
                                    <p className="font-medium">
                                      {t("provider.profile.experiencePrefs.years", {
                                        n: profileData.yearsExperience,
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      {t("provider.profile.hourlyRate")}
                                    </p>
                                    <p className="font-medium">
                                      {t("customer.providers.detail.hourlyRateLine", {
                                        rate: formatProviderMoney(
                                          Number(profileData.hourlyRate) || 0,
                                          profileData.preferredCurrency,
                                          locale,
                                        ),
                                      })}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      {t("provider.profile.availability")}
                                    </p>
                                    <p className="font-medium">
                                      {availabilityDisplayLabel(
                                        profileData.availability || "available",
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      {t("provider.profile.pricingCurrency")}
                                    </p>
                                    <p className="font-medium font-mono">
                                      {profileData.preferredCurrency}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      {t("provider.profile.workPreference")}
                                    </p>
                                    <p className="font-medium">
                                      {workPrefDisplayLabel(
                                        profileData.workPreference,
                                      )}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      {t("provider.profile.teamSize")}
                                    </p>
                                    <p className="font-medium">
                                      {t("provider.profile.teamSizePeople", {
                                        n: profileData.teamSize,
                                      })}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>

                            <Card className="shadow-none border border-gray-100">
                              <CardContent className="p-4 sm:p-5">
                                <h3 className="font-semibold mb-3 text-sm sm:text-base">
                                  {t("provider.profile.projectPrefs.title")}
                                </h3>
                                <div className="space-y-3">
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      {t("provider.profile.budgetRange")}
                                    </p>
                                    <p className="font-medium">
                                      {formatProviderMoney(
                                        Number(profileData.minimumProjectBudget) ||
                                          0,
                                        profileData.preferredCurrency,
                                        locale,
                                      )}{" "}
                                      –{" "}
                                      {formatProviderMoney(
                                        Number(profileData.maximumProjectBudget) ||
                                          0,
                                        profileData.preferredCurrency,
                                        locale,
                                      )}
                                    </p>
                                    {fxSnapshotDate ? (
                                      <p className="text-xs text-gray-500 mt-1">
                                        {t("provider.profile.pricingFxSnapshot", {
                                          date: fxSnapshotDate,
                                        })}
                                      </p>
                                    ) : null}
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">
                                      {t("provider.profile.preferredDurationLabel")}
                                    </p>
                                    <p className="font-medium">
                                      {profileData.preferredProjectDuration ||
                                        t("provider.profile.notSpecified")}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </>
                    )}

                    {isEditing && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label
                            htmlFor="hourlyRate"
                            className="text-xs sm:text-sm"
                          >
                            {t("provider.profile.hourlyRate")}
                          </Label>
                          <Input
                            id="hourlyRate"
                            type="number"
                            min="0"
                            value={profileData.hourlyRate}
                            onChange={(e) =>
                              handleInputChange(
                                "hourlyRate",
                                Number(e.target.value) || 0,
                              )
                            }
                            className={`text-sm sm:text-base ${profileFormErrors.hourlyRate ? "border-red-500" : ""}`}
                          />
                          {profileFormErrors.hourlyRate && (
                            <p className="text-xs text-red-600 mt-1">
                              {profileFormErrors.hourlyRate}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label
                            htmlFor="availability"
                            className="text-xs sm:text-sm"
                          >
                            {t("provider.profile.availability")}
                          </Label>
                          <Select
                            value={profileData.availability}
                            onValueChange={(value) =>
                              handleInputChange("availability", value)
                            }
                          >
                            <SelectTrigger className="text-sm sm:text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="available">
                                {t("provider.profile.availability.available")}
                              </SelectItem>
                              <SelectItem value="busy">
                                {t("provider.profile.availability.busy")}
                              </SelectItem>
                              <SelectItem value="unavailable">
                                {t("provider.profile.availability.unavailable")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="sm:col-span-2">
                          <Label
                            htmlFor="pricingCurrency"
                            className="text-xs sm:text-sm"
                          >
                            {t("provider.profile.pricingCurrency")}
                          </Label>
                          <Select
                            value={profileData.preferredCurrency}
                            onValueChange={(value) =>
                              handleInputChange("preferredCurrency", value)
                            }
                          >
                            <SelectTrigger
                              id="pricingCurrency"
                              className="text-sm sm:text-base"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PREFERRED_CURRENCY_OPTIONS.map((code) => (
                                <SelectItem key={code} value={code}>
                                  {code}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">
                            {t("provider.profile.pricingCurrencyHint")}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Resume Management */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                        {t("provider.profile.resume.title")}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <input
                      ref={resumeInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleResumeChange}
                      className="hidden"
                    />
                    {resume ? (
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 sm:p-4 border rounded-lg">
                          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                            <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm sm:text-base">
                                {t("provider.profile.resume.uploaded")}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-500">
                                {t("provider.profile.resume.uploadedOn")}{" "}
                                {new Date(
                                  resume.uploadedAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleDownloadResume}
                              className="w-full sm:w-auto text-xs sm:text-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                              {t("provider.profile.resume.download")}
                            </Button>
                            {isEditing && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResumeClick}
                                disabled={uploadingResume}
                                className="w-full sm:w-auto text-xs sm:text-sm"
                              >
                                {uploadingResume ? (
                                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                )}
                                {t("provider.profile.resume.replace")}
                              </Button>
                            )}
                            {isEditing && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteResume}
                                disabled={deletingResume}
                                className="w-full sm:w-auto text-xs sm:text-sm"
                              >
                                {deletingResume ? (
                                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                )}
                                {t("provider.profile.resume.delete")}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <FileText className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                        <p className="text-sm sm:text-base text-gray-500 mb-3 sm:mb-4">
                          {t("provider.profile.resume.empty")}
                        </p>
                        {isEditing && (
                          <Button
                            onClick={handleResumeClick}
                            disabled={uploadingResume}
                            className="text-xs sm:text-sm"
                          >
                            {uploadingResume ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                                {t("provider.profile.resume.uploading")}
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                {t("provider.profile.resume.uploadPdf")}
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Certifications */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5" />
                        {t("provider.profile.cert.title")}
                      </CardTitle>
                      {isEditing && (
                        <Button
                          size="sm"
                          onClick={handleAddCertification}
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                          {t("provider.profile.cert.add")}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {loadingCertifications ? (
                      <div
                        className="py-2 sm:py-1"
                        role="status"
                        aria-busy="true"
                        aria-live="polite"
                      >
                        <span className="sr-only">
                          {t("provider.profile.cert.loading")}
                        </span>
                        <ProviderProfileCertificationsSkeleton />
                      </div>
                    ) : certifications.length === 0 ? (
                      <div className="text-center py-6 sm:py-8 text-gray-500">
                        <Award className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                        <p className="text-sm sm:text-base">
                          {t("provider.profile.cert.empty")}
                        </p>
                        {isEditing && (
                          <p className="text-xs sm:text-sm mt-2">
                            {t("provider.profile.cert.emptyHint")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3 sm:space-y-4">
                        {certifications.map((cert, index) => (
                          <div
                            key={cert.id || index}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 p-3 sm:p-4 border rounded-lg"
                          >
                            <div className="flex items-center space-x-3 flex-1 min-w-0 w-full sm:w-auto">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Award className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm sm:text-base break-words">
                                    {cert.name}
                                  </p>
                                  {cert.verified && (
                                    <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs sm:text-sm text-gray-600 break-words">
                                  {cert.issuer}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {t("provider.profile.cert.issued")}{" "}
                                  {cert.issuedDate
                                    ? new Date(
                                        cert.issuedDate,
                                      ).toLocaleDateString()
                                    : t("provider.profile.cert.na")}
                                </p>
                                {cert.serialNumber && (
                                  <p className="text-xs text-gray-500 mt-1 break-words">
                                    {t("provider.profile.cert.serial")}{" "}
                                    {cert.serialNumber}
                                  </p>
                                )}
                                {cert.sourceUrl && (
                                  <a
                                    href={ensureAbsoluteUrl(cert.sourceUrl)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 active:text-blue-800 sm:hover:underline mt-1 inline-block break-all"
                                  >
                                    {t("provider.profile.cert.verifyLink")}
                                  </a>
                                )}
                              </div>
                            </div>
                            {isEditing && (
                              <div className="flex gap-2 w-full sm:w-auto sm:ml-4">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditCertification(index)}
                                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                                >
                                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    handleDeleteCertification(index)
                                  }
                                  className="flex-1 sm:flex-none text-xs sm:text-sm"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-4 sm:space-y-6" data-tour-step="5">
                {/* 
                <Card>
                  <CardHeader>
                    <CardTitle>Performance Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Projects</span>
                      <span className="font-semibold">{profileStats.totalProjects}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Success Rate</span>
                      <span className="font-semibold">{profileStats.successRate}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Total Earnings</span>
                      <span className="font-semibold">RM {profileStats.totalEarnings}</span>
                    </div>
                  </CardContent>
                </Card>
                */}

                {/* Contact Info */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">
                      {t("provider.profile.contact.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    {isEditing ? (
                      <>
                        <div>
                          <Label
                            htmlFor="sidebar-website"
                            className="text-xs sm:text-sm"
                          >
                            {t("provider.profile.label.website")}
                          </Label>
                          <Input
                            id="sidebar-website"
                            value={profileData.website}
                            onChange={(e) =>
                              handleInputChange("website", e.target.value)
                            }
                            className={`text-sm sm:text-base ${profileFormErrors.website ? "border-red-500" : ""}`}
                          />
                          {profileFormErrors.website && (
                            <p className="text-xs text-red-600 mt-1">
                              {profileFormErrors.website}
                            </p>
                          )}
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          <Label className="text-xs sm:text-sm">
                            {t("provider.profile.languages.label")}
                          </Label>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {t("provider.profile.languages.hint")}
                          </p>
                          {profileFormErrors.languages && (
                            <p className="text-xs text-red-600">
                              {profileFormErrors.languages}
                            </p>
                          )}

                          <div className="flex flex-col sm:flex-row gap-2">
                            <Input
                              value={customLanguage}
                              onChange={(e) =>
                                setCustomLanguage(e.target.value)
                              }
                              placeholder={t(
                                "provider.profile.languages.placeholder",
                              )}
                              onKeyPress={(e) =>
                                e.key === "Enter" &&
                                (e.preventDefault(), handleAddCustomLanguage())
                              }
                              className="text-sm sm:text-base"
                            />
                            <Button
                              type="button"
                              onClick={handleAddCustomLanguage}
                              variant="outline"
                              className="w-full sm:w-auto text-xs sm:text-sm"
                            >
                              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </div>

                          {profileData.languages.length > 0 && (
                            <div className="space-y-2">
                              <Label className="text-xs sm:text-sm font-medium">
                                {t("provider.profile.languages.selected", {
                                  count: profileData.languages.length,
                                })}
                              </Label>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2 sm:p-3 border rounded-lg bg-gray-50">
                                {profileData.languages.map((language) => (
                                  <Badge
                                    key={language}
                                    className="bg-green-600 active:bg-green-700 sm:hover:bg-green-700 text-white pr-1 text-xs"
                                  >
                                    {language}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleRemoveLanguage(language)
                                      }
                                      className="ml-1 active:bg-green-800 sm:hover:bg-green-800 rounded-full p-0.5"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium">
                              {t("provider.profile.languages.common")}
                            </Label>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2 sm:p-3 border rounded-lg bg-gray-50">
                              {commonLanguages
                                .filter(
                                  (language) =>
                                    !profileData.languages.includes(language),
                                )
                                .map((language) => (
                                  <Badge
                                    key={language}
                                    variant="outline"
                                    className="cursor-pointer active:bg-green-50 active:border-green-300 sm:hover:bg-green-50 sm:hover:border-green-300 transition-all duration-200 text-xs"
                                    onClick={() =>
                                      handleLanguageToggle(language)
                                    }
                                  >
                                    {language}
                                  </Badge>
                                ))}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {t("provider.profile.label.website")}
                          </p>
                          {profileData.website ? (
                            <a
                              href={ensureAbsoluteUrl(profileData.website)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-sm sm:text-base text-blue-600 active:text-blue-800 sm:hover:underline flex items-center gap-1 break-all"
                            >
                              {profileData.website}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          ) : (
                            <p className="font-medium text-sm sm:text-base text-gray-500">
                              {t("provider.profile.noWebsite")}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-600">
                            {t("provider.profile.label.languages")}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {profileData.languages.map((language, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {language}
                              </Badge>
                            ))}
                            {profileData.languages.length === 0 && (
                              <p className="text-gray-500 text-xs sm:text-sm">
                                {t("provider.profile.languages.none")}
                              </p>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Portfolio URLs */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg">
                      {t("provider.profile.portfolioLinks.title")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    {isEditing ? (
                      <>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {t("provider.profile.portfolioLinks.editHint")}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={newPortfolioLink}
                            onChange={(e) =>
                              setNewPortfolioLink(e.target.value)
                            }
                            placeholder={t(
                              "provider.profile.portfolioLinks.placeholder",
                            )}
                            type="url"
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), handleAddPortfolioLink())
                            }
                            className="text-sm sm:text-base"
                          />
                          <Button
                            type="button"
                            onClick={handleAddPortfolioLink}
                            variant="outline"
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>

                        {profileFormErrors.portfolioLinks && (
                          <p className="text-xs text-red-600">
                            {profileFormErrors.portfolioLinks}
                          </p>
                        )}
                        {profileData.portfolioLinks.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium">
                              {t("provider.profile.portfolioLinks.selected", {
                                count: profileData.portfolioLinks.length,
                              })}
                            </Label>
                            <div className="space-y-2">
                              {profileData.portfolioLinks.map((url, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 border rounded-lg gap-2"
                                >
                                  <a
                                    href={ensureAbsoluteUrl(url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 active:text-blue-800 sm:hover:text-blue-700 text-xs sm:text-sm truncate flex-1 break-all"
                                  >
                                    {url}
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRemovePortfolioLink(url)
                                    }
                                    className="text-red-500 active:text-red-700 sm:hover:text-red-700 flex-shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {profileData.portfolioLinks.length === 0 && (
                          <div className="text-center py-6 sm:py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                            <Globe className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                            <p className="text-sm sm:text-base">
                              {t("provider.profile.portfolioLinks.emptyEdit")}
                            </p>
                            <p className="text-xs sm:text-sm mt-1">
                              {t(
                                "provider.profile.portfolioLinks.emptyEditHint",
                              )}
                            </p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="space-y-2">
                        {profileData.portfolioLinks.length > 0 ? (
                          profileData.portfolioLinks.map((url, index) => (
                            <a
                              key={index}
                              href={ensureAbsoluteUrl(url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 active:text-blue-800 sm:hover:underline break-all"
                            >
                              <span className="break-all">{url}</span>
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          ))
                        ) : (
                          <p className="text-gray-500 text-xs sm:text-sm">
                            {t("provider.profile.portfolioLinks.emptyView")}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Portfolio */}
          <TabsContent value="portfolio">
            <div className="space-y-6 sm:space-y-8">
              {/* Projects Completed Section (Platform Projects) */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">
                      {t("provider.profile.projectsCompleted.title")}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      {t("provider.profile.projectsCompleted.subtitle")}
                    </p>
                  </div>
                </div>

                {loadingPortfolio ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm sm:text-base text-gray-600">
                      {t("provider.profile.projects.loading")}
                    </span>
                  </div>
                ) : portfolioProjects.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 sm:p-12 text-center">
                      <Award className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {t("provider.profile.projects.emptyTitle")}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        {t("provider.profile.projects.emptyDesc")}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {portfolioProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="active:shadow-md sm:hover:shadow-lg transition-shadow"
                      >
                        <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 h-40 sm:h-48 flex items-center justify-center rounded-t-lg">
                          <div className="text-center p-3 sm:p-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                            </div>
                            <Badge variant="secondary" className="text-xs">
                              {project.category ||
                                t("provider.profile.projectFallback")}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-1 break-words">
                            {project.title}
                          </h3>
                          <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2 break-words">
                            {project.description ||
                              t("provider.profile.noDescription")}
                          </p>
                          {project.technologies &&
                            project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {project.technologies
                                  .slice(0, 6)
                                  .map((tech: string, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      {tech}
                                    </Badge>
                                  ))}
                                {project.technologies.length > 6 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {t("provider.profile.moreTech", {
                                      n: project.technologies.length - 6,
                                    })}
                                  </Badge>
                                )}
                              </div>
                            )}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 text-xs sm:text-sm text-gray-500 mb-2">
                            <span className="font-medium break-words">
                              {project.client}
                            </span>
                            {project.completedDate && (
                              <span>
                                {new Date(
                                  project.completedDate,
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {project.approvedPrice && (
                            <div className="text-xs sm:text-sm text-green-600 font-semibold">
                              RM{" "}
                              {Number(project.approvedPrice).toLocaleString()}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio Section (External Work) */}
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold">
                      {t("provider.profile.externalPortfolio.title")}
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 mt-1">
                      {t("provider.profile.externalPortfolio.subtitle")}
                    </p>
                  </div>
                  {isEditing && (
                    <Button
                      onClick={() => {
                        setPortfolioFormData({
                          title: "",
                          description: "",
                          techStack: [],
                          client: "",
                          date: "",
                          imageUrl: "",
                          externalUrl: "",
                        });
                        setNewTechStack("");
                        setPortfolioFormErrors({});
                        setEditingPortfolioIndex(null);
                        setShowPortfolioDialog(true);
                      }}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      {t("provider.profile.externalPortfolio.addItem")}
                    </Button>
                  )}
                </div>

                {loadingPortfolioItems ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-sm sm:text-base text-gray-600">
                      {t("provider.profile.externalPortfolio.loading")}
                    </span>
                  </div>
                ) : portfolioItems.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 sm:p-12 text-center">
                      <Globe className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {t("provider.profile.externalPortfolio.emptyTitle")}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        {isEditing
                          ? t("provider.profile.externalPortfolio.emptyEdit")
                          : t("provider.profile.externalPortfolio.emptyView")}
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {portfolioItems.map((item, index) => (
                      <Card
                        key={item.id}
                        className="active:shadow-md sm:hover:shadow-lg transition-shadow cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedPortfolioItem(item)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPortfolioItem(item);
                          }
                        }}
                      >
                        {item.imageUrl ? (
                          <div className="relative h-40 sm:h-48 overflow-hidden rounded-t-lg bg-gray-100">
                            {(() => {
                              // Use getProfileImageUrl helper for consistent URL handling
                              const imageUrl = getProfileImageUrl(
                                item.imageUrl,
                              );

                              // Check if it's an image file
                              const normalizedUrl = item.imageUrl.replace(
                                /\\/g,
                                "/",
                              );
                              const isImage =
                                /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                  normalizedUrl,
                                );

                              if (isImage) {
                                return (
                                  <Image
                                    src={imageUrl}
                                    alt={
                                      item.title ||
                                      t("provider.profile.alt.portfolioItem")
                                    }
                                    width={400}
                                    height={192}
                                    className="w-full h-full object-cover"
                                    unoptimized
                                  />
                                );
                              } else {
                                // For non-image files, show a file icon
                                return (
                                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                    <div className="text-center p-4">
                                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                                        <FileText className="w-8 h-8 text-gray-400" />
                                      </div>
                                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                        {normalizedUrl.split("/").pop() ||
                                          t("provider.profile.fileFallback")}
                                      </p>
                                    </div>
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        ) : (
                          <div className="relative bg-gradient-to-br from-green-50 to-teal-50 h-40 sm:h-48 flex items-center justify-center rounded-t-lg">
                            <div className="text-center p-3 sm:p-4">
                              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                                <Globe className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {t("provider.profile.portfolioBadge")}
                              </Badge>
                            </div>
                          </div>
                        )}
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <h3 className="font-semibold text-base sm:text-lg line-clamp-1 flex-1 break-words">
                              {item.title}
                            </h3>
                            {isEditing && (
                              <div className="flex gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPortfolioFormData({
                                      title: item.title,
                                      description: item.description || "",
                                      techStack: item.techStack || [],
                                      client: item.client || "",
                                      date: item.date
                                        ? new Date(item.date)
                                            .toISOString()
                                            .split("T")[0]
                                        : "",
                                      imageUrl: item.imageUrl || "",
                                      externalUrl: item.externalUrl || "",
                                    });
                                    setNewTechStack("");
                                    setPortfolioFormErrors({});
                                    setEditingPortfolioIndex(index);
                                    setShowPortfolioDialog(true);
                                  }}
                                  className="text-xs sm:text-sm"
                                >
                                  <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    setPortfolioItemToDelete(item);
                                  }}
                                  className="text-xs sm:text-sm"
                                >
                                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
                                </Button>
                              </div>
                            )}
                          </div>
                          <p className="text-gray-600 text-xs sm:text-sm mb-3 line-clamp-2 break-words">
                            {item.description ||
                              t("provider.profile.noDescription")}
                          </p>
                          {item.techStack && item.techStack.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {item.techStack
                                .slice(0, 6)
                                .map((tech: string, techIndex: number) => (
                                  <Badge
                                    key={techIndex}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {tech}
                                  </Badge>
                                ))}
                              {item.techStack.length > 6 && (
                                <Badge variant="secondary" className="text-xs">
                                  {t("provider.profile.moreTech", {
                                    n: item.techStack.length - 6,
                                  })}
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0 text-xs sm:text-sm text-gray-500 mb-2">
                            {item.client && (
                              <span className="font-medium break-words">
                                {item.client}
                              </span>
                            )}
                            {item.date && (
                              <span>
                                {new Date(item.date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {item.externalUrl && (
                            <a
                              href={ensureAbsoluteUrl(item.externalUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs sm:text-sm text-blue-600 active:text-blue-800 sm:hover:underline flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t("provider.profile.viewProject")}
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                            </a>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <Dialog
            open={Boolean(selectedPortfolioItem)}
            onOpenChange={(open) => {
              if (!open) setSelectedPortfolioItem(null);
            }}
          >
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
              {selectedPortfolioItem && (
                <>
                  <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl">
                      {selectedPortfolioItem.title}
                    </DialogTitle>
                    <DialogDescription className="text-xs sm:text-sm">
                      {t("provider.profile.dialog.portfolioDetails")}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    {selectedPortfolioItem.imageUrl && (
                      <div className="overflow-hidden rounded-lg border bg-gray-50">
                        {(() => {
                          const imageUrl = getProfileImageUrl(
                            selectedPortfolioItem.imageUrl,
                          );
                          const normalizedUrl =
                            selectedPortfolioItem.imageUrl.replace(/\\/g, "/");
                          const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                            normalizedUrl,
                          );

                          return isImage ? (
                            <Image
                              src={imageUrl}
                              alt={
                                selectedPortfolioItem.title ||
                                t("provider.profile.alt.portfolioItem")
                              }
                              width={1200}
                              height={700}
                              className="w-full max-h-[420px] object-contain"
                              unoptimized
                            />
                          ) : (
                            <div className="p-5 flex items-center gap-3">
                              <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                              <p className="text-sm text-gray-700 break-all">
                                {normalizedUrl.split("/").pop() ||
                                  t("provider.profile.dialog.attachmentLabel")}
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="rounded-lg border p-4 space-y-3">
                      <div className="flex flex-wrap gap-4 text-xs sm:text-sm text-gray-600">
                        {selectedPortfolioItem.client && (
                          <span>{selectedPortfolioItem.client}</span>
                        )}
                        {selectedPortfolioItem.date && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(
                              selectedPortfolioItem.date,
                            ).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">
                        {selectedPortfolioItem.description ||
                          t("provider.profile.dialog.noDescriptionEnd")}
                      </p>

                      {selectedPortfolioItem.techStack &&
                        selectedPortfolioItem.techStack.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedPortfolioItem.techStack.map(
                              (tech, techIndex) => (
                                <Badge
                                  key={`${tech}-${techIndex}`}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {tech}
                                </Badge>
                              ),
                            )}
                          </div>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {selectedPortfolioItem.imageUrl && (
                        <a
                          href={getProfileImageUrl(
                            selectedPortfolioItem.imageUrl,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          {t("provider.profile.dialog.openAttachment")}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {selectedPortfolioItem.externalUrl && (
                        <a
                          href={ensureAbsoluteUrl(
                            selectedPortfolioItem.externalUrl,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs sm:text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          {t("provider.profile.dialog.viewExternal")}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          {/* Skills */}
          <TabsContent value="skills">
            <div className="space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold">
                    {t("provider.profile.skills.title")}
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    {t("provider.profile.skills.subtitle")}
                  </p>
                </div>
              </div>

              {isEditing ? (
                <Card>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      <div className="space-y-3 sm:space-y-4">
                        <Label className="text-xs sm:text-sm">
                          {t("provider.profile.skills.technicalLabel")}
                        </Label>
                        <p className="text-xs sm:text-sm text-gray-600">
                          {t("provider.profile.skills.technicalHint")}
                        </p>
                        {profileFormErrors.skills && (
                          <p className="text-xs text-red-600">
                            {profileFormErrors.skills}
                          </p>
                        )}

                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={customSkill}
                            onChange={(e) => setCustomSkill(e.target.value)}
                            placeholder={t(
                              "provider.profile.skills.placeholder",
                            )}
                            onKeyPress={(e) =>
                              e.key === "Enter" &&
                              (e.preventDefault(), handleAddCustomSkill())
                            }
                            className="text-sm sm:text-base"
                          />
                          <Button
                            type="button"
                            onClick={handleAddCustomSkill}
                            variant="outline"
                            className="w-full sm:w-auto text-xs sm:text-sm"
                          >
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </div>

                        {profileData.skills.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-xs sm:text-sm font-medium">
                              {t("provider.profile.skills.selected", {
                                count: profileData.skills.length,
                              })}
                            </Label>
                            <div className="flex flex-wrap gap-1.5 sm:gap-2 p-2 sm:p-3 border rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
                              {profileData.skills.map((skill) => (
                                <Badge
                                  key={skill}
                                  className="bg-blue-600 active:bg-blue-700 sm:hover:bg-blue-700 text-white pr-1 text-xs"
                                >
                                  {skill}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSkill(skill)}
                                    className="ml-1 active:bg-blue-800 sm:hover:bg-blue-800 rounded-full p-0.5"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label className="text-xs sm:text-sm font-medium">
                            {t("provider.profile.skills.popular")}
                          </Label>
                          <div className="flex flex-wrap gap-1.5 sm:gap-2 max-h-40 overflow-y-auto p-2 sm:p-3 border rounded-lg bg-gray-50">
                            {popularSkills
                              .filter(
                                (skill) => !profileData.skills.includes(skill),
                              )
                              .map((skill) => (
                                <Badge
                                  key={skill}
                                  variant="outline"
                                  className="cursor-pointer active:bg-blue-50 active:border-blue-300 sm:hover:bg-blue-50 sm:hover:border-blue-300 transition-all duration-200 text-xs"
                                  onClick={() => handleSkillToggle(skill)}
                                >
                                  {skill}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label
                            htmlFor="yearsExperience"
                            className="text-xs sm:text-sm"
                          >
                            {t("provider.profile.yearsExperience")}
                          </Label>
                          <Input
                            id="yearsExperience"
                            type="number"
                            min="0"
                            value={profileData.yearsExperience}
                            onChange={(e) =>
                              handleInputChange(
                                "yearsExperience",
                                Number(e.target.value) || 0,
                              )
                            }
                            className={`text-sm sm:text-base ${profileFormErrors.yearsExperience ? "border-red-500" : ""}`}
                          />
                          {profileFormErrors.yearsExperience && (
                            <p className="text-xs text-red-600 mt-1">
                              {profileFormErrors.yearsExperience}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label
                            htmlFor="workPreference"
                            className="text-xs sm:text-sm"
                          >
                            {t("provider.profile.workPreference")}
                          </Label>
                          <Select
                            value={profileData.workPreference}
                            onValueChange={(value) =>
                              handleInputChange("workPreference", value)
                            }
                          >
                            <SelectTrigger className="text-sm sm:text-base">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="remote">
                                {t("provider.profile.workPref.remote")}
                              </SelectItem>
                              <SelectItem value="onsite">
                                {t("provider.profile.workPref.onsite")}
                              </SelectItem>
                              <SelectItem value="hybrid">
                                {t("provider.profile.workPref.hybrid")}
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label
                            htmlFor="minimumProjectBudget"
                            className="text-xs sm:text-sm"
                          >
                            {t("provider.profile.minBudget")}
                          </Label>
                          <Input
                            id="minimumProjectBudget"
                            type="number"
                            min="0"
                            value={profileData.minimumProjectBudget}
                            onChange={(e) =>
                              handleInputChange(
                                "minimumProjectBudget",
                                Number(e.target.value) || 0,
                              )
                            }
                            className={`text-sm sm:text-base ${profileFormErrors.minimumProjectBudget ? "border-red-500" : ""}`}
                          />
                          {profileFormErrors.minimumProjectBudget && (
                            <p className="text-xs text-red-600 mt-1">
                              {profileFormErrors.minimumProjectBudget}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label
                            htmlFor="maximumProjectBudget"
                            className="text-xs sm:text-sm"
                          >
                            {t("provider.profile.maxBudget")}
                          </Label>
                          <Input
                            id="maximumProjectBudget"
                            type="number"
                            min="0"
                            value={profileData.maximumProjectBudget}
                            onChange={(e) =>
                              handleInputChange(
                                "maximumProjectBudget",
                                Number(e.target.value) || 0,
                              )
                            }
                            className={`text-sm sm:text-base ${profileFormErrors.maximumProjectBudget ? "border-red-500" : ""}`}
                          />
                          {profileFormErrors.maximumProjectBudget && (
                            <p className="text-xs text-red-600 mt-1">
                              {profileFormErrors.maximumProjectBudget}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                          <Label
                            htmlFor="preferredProjectDuration"
                            className="text-xs sm:text-sm"
                          >
                            {t("provider.profile.preferredDuration")}
                          </Label>
                          <Input
                            id="preferredProjectDuration"
                            value={profileData.preferredProjectDuration}
                            onChange={(e) =>
                              handleInputChange(
                                "preferredProjectDuration",
                                e.target.value,
                              )
                            }
                            placeholder={t(
                              "provider.profile.durationPlaceholder",
                            )}
                            className={`text-sm sm:text-base ${profileFormErrors.preferredProjectDuration ? "border-red-500" : ""}`}
                          />
                          {profileFormErrors.preferredProjectDuration && (
                            <p className="text-xs text-red-600 mt-1">
                              {profileFormErrors.preferredProjectDuration}
                            </p>
                          )}
                        </div>
                        <div>
                          <Label
                            htmlFor="teamSize"
                            className="text-xs sm:text-sm"
                          >
                            {t("provider.profile.teamSize")}
                          </Label>
                          <Input
                            id="teamSize"
                            type="number"
                            min="1"
                            value={profileData.teamSize}
                            onChange={(e) =>
                              handleInputChange(
                                "teamSize",
                                Number(e.target.value) || 1,
                              )
                            }
                            className={`text-sm sm:text-base ${profileFormErrors.teamSize ? "border-red-500" : ""}`}
                          />
                          {profileFormErrors.teamSize && (
                            <p className="text-xs text-red-600 mt-1">
                              {profileFormErrors.teamSize}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">
                        {t("provider.profile.skills.viewTitle")}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {profileData.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-sm"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {profileData.skills.length === 0 && (
                          <p className="text-gray-500">
                            {t("provider.profile.skills.none")}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold mb-4">
                          {t("provider.profile.experiencePrefs.title")}
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("provider.profile.yearsExperience")}
                            </p>
                            <p className="font-medium">
                              {t("provider.profile.experiencePrefs.years", {
                                n: profileData.yearsExperience,
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("provider.profile.hourlyRate")}
                            </p>
                            <p className="font-medium">
                              {t("customer.providers.detail.hourlyRateLine", {
                                rate: formatProviderMoney(
                                  Number(profileData.hourlyRate) || 0,
                                  profileData.preferredCurrency,
                                  locale,
                                ),
                              })}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("provider.profile.workPreference")}
                            </p>
                            <p className="font-medium">
                              {workPrefDisplayLabel(profileData.workPreference)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("provider.profile.teamSize")}
                            </p>
                            <p className="font-medium">
                              {t("provider.profile.teamSizePeople", {
                                n: profileData.teamSize,
                              })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-6">
                        <h3 className="font-semibold mb-4">
                          {t("provider.profile.projectPrefs.title")}
                        </h3>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("provider.profile.budgetRange")}
                            </p>
                            <p className="font-medium">
                              {formatProviderMoney(
                                Number(profileData.minimumProjectBudget) || 0,
                                profileData.preferredCurrency,
                                locale,
                              )}{" "}
                              –{" "}
                              {formatProviderMoney(
                                Number(profileData.maximumProjectBudget) || 0,
                                profileData.preferredCurrency,
                                locale,
                              )}
                            </p>
                            {fxSnapshotDate ? (
                              <p className="text-xs text-gray-500 mt-1">
                                {t("provider.profile.pricingFxSnapshot", {
                                  date: fxSnapshotDate,
                                })}
                              </p>
                            ) : null}
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              {t("provider.profile.preferredDurationLabel")}
                            </p>
                            <p className="font-medium">
                              {profileData.preferredProjectDuration ||
                                t("provider.profile.notSpecified")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="verification" className="space-y-6">
            <VerificationSection
              documents={docs}
              documentType={"PROVIDER_ID"}
              setDocuments={setDocs}
              userId={getUserIdFromToken() || undefined}
            />
          </TabsContent>
        </Tabs>

        {/* Certification Dialog */}
        <Dialog open={showCertDialog} onOpenChange={setShowCertDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingCertIndex !== null
                  ? t("provider.profile.certDialog.editTitle")
                  : t("provider.profile.certDialog.addTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("provider.profile.certDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 font-medium">
                      {t("provider.profile.certDialog.whyTitle")}
                    </p>
                    <p className="text-sm text-blue-700">
                      {t("provider.profile.certDialog.whyBody")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certName">
                    {t("provider.profile.certDialog.nameLabel")}
                  </Label>
                  <Input
                    id="certName"
                    placeholder={t(
                      "provider.profile.certDialog.namePlaceholder",
                    )}
                    value={certFormData.name}
                    onChange={(e) =>
                      setCertFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                  {certFormErrors.name && (
                    <p className="text-xs text-red-600">
                      {certFormErrors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certIssuer">
                    {t("provider.profile.certDialog.issuerLabel")}
                  </Label>
                  <Input
                    id="certIssuer"
                    placeholder={t(
                      "provider.profile.certDialog.issuerPlaceholder",
                    )}
                    value={certFormData.issuer}
                    onChange={(e) =>
                      setCertFormData((prev) => ({
                        ...prev,
                        issuer: e.target.value,
                      }))
                    }
                  />
                  {certFormErrors.issuer && (
                    <p className="text-xs text-red-600">
                      {certFormErrors.issuer}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="certDate">
                  {t("provider.profile.certDialog.dateLabel")}
                </Label>
                <Input
                  id="certDate"
                  type="date"
                  value={certFormData.issuedDate}
                  onChange={(e) =>
                    setCertFormData((prev) => ({
                      ...prev,
                      issuedDate: e.target.value,
                    }))
                  }
                />
                {certFormErrors.issuedDate && (
                  <p className="text-xs text-red-600">
                    {certFormErrors.issuedDate}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certSerial">
                    {t("provider.profile.certDialog.serialLabel")}
                  </Label>
                  <Input
                    id="certSerial"
                    placeholder={t(
                      "provider.profile.certDialog.serialPlaceholder",
                    )}
                    value={certFormData.serialNumber}
                    onChange={(e) =>
                      setCertFormData((prev) => ({
                        ...prev,
                        serialNumber: e.target.value,
                      }))
                    }
                  />
                  {certFormErrors.serialNumber && (
                    <p className="text-xs text-red-600">
                      {certFormErrors.serialNumber}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certLink">
                    {t("provider.profile.certDialog.linkLabel")}
                  </Label>
                  <Input
                    id="certLink"
                    type="url"
                    placeholder={t(
                      "provider.profile.certDialog.linkPlaceholder",
                    )}
                    value={certFormData.sourceUrl}
                    onChange={(e) =>
                      setCertFormData((prev) => ({
                        ...prev,
                        sourceUrl: e.target.value,
                      }))
                    }
                  />
                  {certFormErrors.sourceUrl && (
                    <p className="text-xs text-red-600">
                      {certFormErrors.sourceUrl}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    {t("provider.profile.certDialog.serialOrLinkHint")}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCertDialog(false);
                  setCertFormData({
                    name: "",
                    issuer: "",
                    issuedDate: "",
                    serialNumber: "",
                    sourceUrl: "",
                  });
                  setEditingCertIndex(null);
                  setCertFormErrors({});
                }}
              >
                {t("provider.profile.cancel")}
              </Button>
              <Button onClick={handleSaveCertification} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("provider.profile.saving")}
                  </>
                ) : (
                  <>
                    <Award className="w-4 h-4 mr-2" />
                    {editingCertIndex !== null
                      ? t("provider.profile.certDialog.update")
                      : t("provider.profile.cert.add")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Portfolio Item Dialog */}
        <Dialog
          open={showPortfolioDialog}
          onOpenChange={setShowPortfolioDialog}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {editingPortfolioIndex !== null
                  ? t("provider.profile.portfolioDialog.editTitle")
                  : t("provider.profile.portfolioDialog.addTitle")}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("provider.profile.portfolioDialog.description")}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 sm:space-y-4 py-3 sm:py-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-green-800 font-medium">
                      {t("provider.profile.portfolioDialog.whatTitle")}
                    </p>
                    <p className="text-sm text-green-700">
                      {t("provider.profile.portfolioDialog.whatBody")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portfolioTitle">
                    {t("provider.profile.portfolioDialog.titleLabel")}
                  </Label>
                  <Input
                    id="portfolioTitle"
                    placeholder={t(
                      "provider.profile.portfolioDialog.titlePlaceholder",
                    )}
                    value={portfolioFormData.title}
                    onChange={(e) =>
                      setPortfolioFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                  {portfolioFormErrors.title && (
                    <p className="text-xs text-red-600">
                      {portfolioFormErrors.title}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolioDescription">
                    {t("provider.profile.portfolioDialog.descLabel")}
                  </Label>
                  <Textarea
                    id="portfolioDescription"
                    placeholder={t(
                      "provider.profile.portfolioDialog.descPlaceholder",
                    )}
                    value={portfolioFormData.description}
                    onChange={(e) =>
                      setPortfolioFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={4}
                  />
                  {portfolioFormErrors.description && (
                    <p className="text-xs text-red-600">
                      {portfolioFormErrors.description}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="portfolioClient">
                      {t("provider.profile.portfolioDialog.clientLabel")}
                    </Label>
                    <Input
                      id="portfolioClient"
                      placeholder={t(
                        "provider.profile.portfolioDialog.clientPlaceholder",
                      )}
                      value={portfolioFormData.client}
                      onChange={(e) =>
                        setPortfolioFormData((prev) => ({
                          ...prev,
                          client: e.target.value,
                        }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="portfolioDate">
                      {t("provider.profile.portfolioDialog.dateLabel")}
                    </Label>
                    <Input
                      id="portfolioDate"
                      type="date"
                      value={portfolioFormData.date}
                      onChange={(e) =>
                        setPortfolioFormData((prev) => ({
                          ...prev,
                          date: e.target.value,
                        }))
                      }
                    />
                    {portfolioFormErrors.date && (
                      <p className="text-xs text-red-600">
                        {portfolioFormErrors.date}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolioTechStack">
                    {t("provider.profile.portfolioDialog.techLabel")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="portfolioTechStack"
                      placeholder={t(
                        "provider.profile.portfolioDialog.techPlaceholder",
                      )}
                      value={newTechStack}
                      onChange={(e) => setNewTechStack(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddTechStack())
                      }
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTechStack}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {portfolioFormData.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {portfolioFormData.techStack.map((tech, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {tech}
                          <button
                            type="button"
                            onClick={() => handleRemoveTechStack(tech)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolioImage">
                    {t("provider.profile.portfolioDialog.imageLabel")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="portfolioImageUrl"
                      type="text"
                      placeholder={t(
                        "provider.profile.portfolioDialog.imageUrlPlaceholder",
                      )}
                      value={portfolioFormData.imageUrl}
                      onChange={(e) =>
                        setPortfolioFormData((prev) => ({
                          ...prev,
                          imageUrl: e.target.value,
                        }))
                      }
                      disabled={uploadingPortfolioImage}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => portfolioImageInputRef.current?.click()}
                      disabled={uploadingPortfolioImage}
                    >
                      {uploadingPortfolioImage ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <input
                    ref={portfolioImageInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;

                      // Validate file size (10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast({
                          title: t("provider.profile.toast.fileTooLargeTitle"),
                          description: t(
                            "provider.profile.toast.portfolioFileTooLargeDesc",
                          ),
                          variant: "destructive",
                        });
                        return;
                      }

                      setUploadingPortfolioImage(true);
                      try {
                        const result = await uploadPortfolioImage(file);
                        if (result.success && result.data?.imageUrl) {
                          setPortfolioFormData((prev) => ({
                            ...prev,
                            imageUrl: result.data.imageUrl,
                          }));
                          toast({
                            title: t("provider.profile.toast.successTitle"),
                            description: t(
                              "provider.profile.toast.fileUploaded",
                            ),
                          });
                        }
                      } catch (error: unknown) {
                        toast({
                          title: t("provider.profile.toast.uploadFailedTitle"),
                          description: getUserFriendlyErrorMessage(
                            error,
                            "provider profile portfolio image upload",
                          ),
                          variant: "destructive",
                        });
                      } finally {
                        setUploadingPortfolioImage(false);
                        // Reset file input
                        if (portfolioImageInputRef.current) {
                          portfolioImageInputRef.current.value = "";
                        }
                      }
                    }}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500">
                    {t("provider.profile.portfolioDialog.imageHint")}
                  </p>
                  {portfolioFormData.imageUrl && (
                    <div className="mt-2">
                      {(() => {
                        const normalizedUrl =
                          portfolioFormData.imageUrl.replace(/\\/g, "/");
                        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                          normalizedUrl,
                        );
                        const imageUrl = normalizedUrl.startsWith("http")
                          ? normalizedUrl
                          : normalizedUrl.startsWith("/")
                            ? `${API_BASE}${normalizedUrl}`
                            : `${API_BASE}/${normalizedUrl}`;

                        if (isImage) {
                          return (
                            <Image
                              src={imageUrl}
                              alt={t(
                                "provider.profile.portfolioDialog.previewAlt",
                              )}
                              width={400}
                              height={128}
                              className="w-full h-32 object-cover rounded-lg border bg-gray-100"
                              unoptimized
                            />
                          );
                        } else {
                          return (
                            <div className="p-2 border rounded-lg bg-gray-50 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-gray-400" />
                              <p className="text-sm text-gray-600 truncate">
                                {normalizedUrl.split("/").pop() ||
                                  t("provider.profile.fileFallback")}
                              </p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolioExternalUrl">
                    {t("provider.profile.portfolioDialog.externalLabel")}
                  </Label>
                  <Input
                    id="portfolioExternalUrl"
                    type="url"
                    placeholder={t(
                      "provider.profile.portfolioDialog.externalPlaceholder",
                    )}
                    value={portfolioFormData.externalUrl}
                    onChange={(e) =>
                      setPortfolioFormData((prev) => ({
                        ...prev,
                        externalUrl: e.target.value,
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500">
                    {t("provider.profile.portfolioDialog.externalHint")}
                  </p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowPortfolioDialog(false);
                  setPortfolioFormData({
                    title: "",
                    description: "",
                    techStack: [],
                    client: "",
                    date: "",
                    imageUrl: "",
                    externalUrl: "",
                  });
                  setNewTechStack("");
                  setEditingPortfolioIndex(null);
                  setPortfolioFormErrors({});
                }}
              >
                {t("provider.profile.cancel")}
              </Button>
              <Button onClick={handleSavePortfolioItem} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("provider.profile.saving")}
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {editingPortfolioIndex !== null
                      ? t("provider.profile.portfolioDialog.update")
                      : t("provider.profile.externalPortfolio.addItem")}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog
          open={Boolean(portfolioItemToDelete)}
          onOpenChange={(open) => {
            if (!open) setPortfolioItemToDelete(null);
          }}
        >
          <DialogContent className="max-w-md p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">
                {t("provider.profile.deletePortfolio.title")}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {t("provider.profile.deletePortfolio.desc", {
                  title: portfolioItemToDelete?.title ?? "",
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setPortfolioItemToDelete(null)}
                disabled={deletingPortfolioItem}
              >
                {t("provider.profile.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={handleConfirmDeletePortfolioItem}
                disabled={deletingPortfolioItem}
                className="text-white"
              >
                {deletingPortfolioItem ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t("provider.profile.deleting")}
                  </>
                ) : (
                  t("provider.profile.delete")
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <ProfileImageCropModal
          open={profileCropOpen}
          onOpenChange={setProfileCropOpen}
          imageFile={pendingProfileImageFile}
          onConfirm={handleProfileImageCropConfirm}
          onCancel={() => setPendingProfileImageFile(null)}
        />

        <ProviderContactVerificationDialog
          open={contactVerifyOpen}
          onOpenChange={setContactVerifyOpen}
          needs={contactVerifyNeeds}
          contactSnapshot={contactSnapshot}
          draftEmail={profileData.email}
          draftPhone={profileData.phone}
          apiBase={contactProfileApi}
          onContinueSave={executeProfileSave}
        />
      </div>
    </>
  );
}
