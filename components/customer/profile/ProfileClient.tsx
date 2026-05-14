"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  UploadedDocument,
  ProfileData,
  Stats,
  DocumentType,
} from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Save,
  Edit,
  Lock,
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
import { useInvalidateCustomerLayoutProfile } from "@/hooks/useInvalidateCustomerLayoutProfile";
import {
  upsertCompanyProfile,
  getCompanyProfile,
  getKycDocuments,
  getCompanyProfileCompletion,
  getUserIdFromToken,
  API_BASE,
} from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useI18n } from "@/contexts/I18nProvider";

import ProfileOverview from "./sections/ProfileOverview";
import CompanyInfo from "./sections/CompanyInfo";
import VerificationSection from "./sections/VerificationSection";
import { CustomerProfileTour } from "../CustomerProfileTour";
import { CustomerProfilePageSkeleton } from "@/components/customer/CustomerPageSkeletons";

type TabValue = "profile" | "company" | "verification";
type GoogleAccountsId = {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  renderButton: (
    el: HTMLElement,
    opts: {
      type?: string;
      theme?: string;
      size?: string;
      text?: string;
      width?: number;
    },
  ) => void;
};

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
  const invalidateCustomerLayoutProfile = useInvalidateCustomerLayoutProfile();
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
  const [contactSnapshot, setContactSnapshot] = useState({
    email: "",
    phone: "",
  });
  const [contactVerificationOpen, setContactVerificationOpen] = useState(false);
  const [requiresEmailVerification, setRequiresEmailVerification] =
    useState(false);
  const [
    requiresEmailCurrentVerification,
    setRequiresEmailCurrentVerification,
  ] = useState(false);
  const [requiresEmailNewVerification, setRequiresEmailNewVerification] =
    useState(false);
  const [requiresPhoneVerification, setRequiresPhoneVerification] =
    useState(false);
  const [
    requiresPhoneCurrentVerification,
    setRequiresPhoneCurrentVerification,
  ] = useState(false);
  const [requiresPhoneNewVerification, setRequiresPhoneNewVerification] =
    useState(false);
  const [emailVerifiedForChange, setEmailVerifiedForChange] = useState(false);
  const [emailNewVerifiedForChange, setEmailNewVerifiedForChange] =
    useState(false);
  const [phoneVerifiedForChange, setPhoneVerifiedForChange] = useState(false);
  const [phoneNewVerifiedForChange, setPhoneNewVerifiedForChange] =
    useState(false);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailNewOtpSent, setEmailNewOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneNewOtpSent, setPhoneNewOtpSent] = useState(false);
  const [emailOtp, setEmailOtp] = useState("");
  const [emailNewOtp, setEmailNewOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneNewOtp, setPhoneNewOtp] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [verificationStepIndex, setVerificationStepIndex] = useState(0);
  const [emailCurrentVerificationMethod, setEmailCurrentVerificationMethod] =
    useState<"otp" | "password" | "google">("otp");
  const [currentPassword, setCurrentPassword] = useState("");
  const [identityBusy, setIdentityBusy] = useState(false);
  const [phoneVerifiedStatus, setPhoneVerifiedStatus] = useState(false);

  const { t, locale } = useI18n();
  const dateLocale =
    locale === "ar" ? "ar" : locale === "id" ? "id-ID" : "en-US";

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
    const cp = frontendProfile.customerProfile;
    const asTrimmed = (value: unknown): string | undefined => {
      if (typeof value !== "string") return undefined;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };
    const asPositiveNumber = (value: unknown): number | undefined => {
      if (typeof value !== "number" || !Number.isFinite(value))
        return undefined;
      return value > 0 ? value : undefined;
    };

    const payload: Record<string, unknown> = {
      ...(asTrimmed(cp?.description) !== undefined
        ? { description: asTrimmed(cp?.description) }
        : {}),
      ...(asTrimmed(cp?.industry) !== undefined
        ? { industry: asTrimmed(cp?.industry) }
        : {}),
      ...(asTrimmed(cp?.location) !== undefined
        ? { location: asTrimmed(cp?.location) }
        : {}),
      ...(asTrimmed(cp?.website) !== undefined
        ? { website: asTrimmed(cp?.website) }
        : {}),
      socialLinks: cp?.socialLinks || [],
      languages: cp?.languages || [],
      ...(asTrimmed(cp?.companySize) !== undefined
        ? { companySize: asTrimmed(cp?.companySize) }
        : {}),
      ...(asPositiveNumber(cp?.employeeCount) !== undefined
        ? { employeeCount: asPositiveNumber(cp?.employeeCount) }
        : {}),
      ...(asPositiveNumber(cp?.establishedYear) !== undefined
        ? { establishedYear: asPositiveNumber(cp?.establishedYear) }
        : {}),
      ...(asPositiveNumber(cp?.annualRevenue) !== undefined
        ? { annualRevenue: asPositiveNumber(cp?.annualRevenue) }
        : {}),
      ...(asTrimmed(cp?.fundingStage) !== undefined
        ? { fundingStage: asTrimmed(cp?.fundingStage) }
        : {}),
      preferredContractTypes: cp?.preferredContractTypes || [],
      ...(asTrimmed(cp?.averageBudgetRange) !== undefined
        ? { averageBudgetRange: asTrimmed(cp?.averageBudgetRange) }
        : {}),
      ...(asTrimmed(cp?.remotePolicy) !== undefined
        ? { remotePolicy: asTrimmed(cp?.remotePolicy) }
        : {}),
      ...(asTrimmed(cp?.hiringFrequency) !== undefined
        ? { hiringFrequency: asTrimmed(cp?.hiringFrequency) }
        : {}),
      categoriesHiringFor: cp?.categoriesHiringFor || [],
      ...(asTrimmed(cp?.mission) !== undefined
        ? { mission: asTrimmed(cp?.mission) }
        : {}),
      values: cp?.values || [],
      ...(asTrimmed(cp?.benefits) !== undefined
        ? { benefits: asTrimmed(cp?.benefits) }
        : {}),
      mediaGallery: cp?.mediaGallery || [],
    };
    // Send phone so backend can set it once when not yet assigned (same as provider profile)
    if (
      frontendProfile.phone != null &&
      String(frontendProfile.phone).trim() !== ""
    ) {
      payload.phone = String(frontendProfile.phone).trim();
    }
    if (
      frontendProfile.email != null &&
      String(frontendProfile.email).trim() !== ""
    ) {
      payload.email = String(frontendProfile.email).trim();
    }
    return payload;
  };

  const hasEmailChanged = () =>
    (profile?.email || "").trim().toLowerCase() !==
    (contactSnapshot.email || "").trim().toLowerCase();
  const hasPhoneChanged = () =>
    (profile?.phone || "").trim() !== (contactSnapshot.phone || "").trim();
  const verificationSteps = useMemo(() => {
    const steps: Array<
      "emailCurrent" | "emailNew" | "phoneCurrent" | "phoneNew"
    > = [];
    if (requiresEmailVerification && requiresEmailCurrentVerification) {
      steps.push("emailCurrent");
    }
    if (requiresEmailVerification && requiresEmailNewVerification) {
      steps.push("emailNew");
    }
    if (requiresPhoneVerification && requiresPhoneCurrentVerification) {
      steps.push("phoneCurrent");
    }
    if (requiresPhoneVerification && requiresPhoneNewVerification) {
      steps.push("phoneNew");
    }
    return steps;
  }, [
    requiresEmailVerification,
    requiresEmailCurrentVerification,
    requiresEmailNewVerification,
    requiresPhoneVerification,
    requiresPhoneCurrentVerification,
    requiresPhoneNewVerification,
  ]);
  const currentVerificationStep =
    verificationSteps[verificationStepIndex] || null;
  const currentStepVerified =
    currentVerificationStep === "emailCurrent"
      ? emailVerifiedForChange
      : currentVerificationStep === "emailNew"
        ? emailNewVerifiedForChange
        : currentVerificationStep === "phoneCurrent"
          ? phoneVerifiedForChange
          : currentVerificationStep === "phoneNew"
            ? phoneNewVerifiedForChange
            : true;
  const isLastVerificationStep =
    verificationSteps.length === 0 ||
    verificationStepIndex >= verificationSteps.length - 1;

  const markPhoneVerifiedInStorage = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const updated = {
        ...parsed,
        phoneVerified: true,
        isPhoneVerified: true,
        whatsappVerified: true,
      };
      localStorage.setItem("user", JSON.stringify(updated));
      setPhoneVerifiedStatus(true);
    } catch {
      // ignore storage parse errors
    }
  };

  const handleVerifyCurrentPhone = () => {
    if (!contactSnapshot.phone?.trim()) {
      toast({
        title: t("customer.profile.toast.error"),
        description: "No current phone number found on your account.",
        variant: "destructive",
      });
      return;
    }

    setRequiresEmailVerification(false);
    setRequiresEmailCurrentVerification(false);
    setRequiresEmailNewVerification(false);
    setRequiresPhoneVerification(true);
    setRequiresPhoneCurrentVerification(true);
    setRequiresPhoneNewVerification(false);
    setVerificationStepIndex(0);
    setPhoneOtp("");
    setPhoneOtpSent(false);
    setContactVerificationOpen(true);
  };

  const sendEmailChangeOtp = async () => {
    if (!contactSnapshot.email?.trim()) {
      toast({
        title: t("customer.profile.toast.error"),
        description: "No current email found on your account.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${API_BASE}/company/profile/contact-otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "email",
          target: "current",
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to send email OTP",
        );
      setEmailOtpSent(true);
      toast({
        title: "OTP sent",
        description: "Verification code has been sent to your current email.",
      });
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile email otp send",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyEmailChangeOtp = async () => {
    if (!contactSnapshot.email?.trim() || emailOtp.trim().length !== 6) {
      toast({
        title: t("customer.profile.toast.error"),
        description: "Enter the 6-digit email OTP first.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(
        `${API_BASE}/company/profile/contact-otp/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            channel: "email",
            target: "current",
            otp: emailOtp.trim(),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Email OTP verification failed",
        );
      setEmailVerifiedForChange(true);
      toast({
        title: "Email verified",
        description: "Current email verified. You can now save your new email.",
      });
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile email otp verify",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyCurrentEmailWithPassword = async () => {
    if (!currentPassword.trim()) {
      toast({
        title: t("customer.profile.toast.error"),
        description: "Please enter your current password.",
        variant: "destructive",
      });
      return;
    }
    setIdentityBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(
        `${API_BASE}/company/profile/contact-identity/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            method: "password",
            password: currentPassword,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Password verification failed.",
        );
      }
      setEmailVerifiedForChange(true);
      toast({
        title: "Verified",
        description:
          "Current email verified with password. You can proceed to next step.",
      });
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile current email password verify",
        ),
        variant: "destructive",
      });
    } finally {
      setIdentityBusy(false);
    }
  };

  const verifyCurrentEmailWithGoogleToken = async (idToken: string) => {
    setIdentityBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(
        `${API_BASE}/company/profile/contact-identity/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            method: "google",
            idToken,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          data?.message || data?.error || "Google verification failed.",
        );
      }
      setEmailVerifiedForChange(true);
      toast({
        title: "Verified",
        description:
          "Current email verified with Google. You can proceed to next step.",
      });
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile current email google verify",
        ),
        variant: "destructive",
      });
    } finally {
      setIdentityBusy(false);
    }
  };

  const sendNewEmailChangeOtp = async () => {
    if (!profile?.email?.trim()) {
      toast({
        title: t("customer.profile.toast.error"),
        description: "Please enter a new email first.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${API_BASE}/company/profile/contact-otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "email",
          target: "new",
          email: profile.email.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to send OTP to new email",
        );
      setEmailNewOtpSent(true);
      toast({
        title: "OTP sent",
        description: "Verification code has been sent to your new email.",
      });
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile new email otp send",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyNewEmailChangeOtp = async () => {
    if (!profile?.email?.trim() || emailNewOtp.trim().length !== 6) {
      toast({
        title: t("customer.profile.toast.error"),
        description: "Enter the 6-digit OTP sent to your new email.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(
        `${API_BASE}/company/profile/contact-otp/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            channel: "email",
            target: "new",
            email: profile.email.trim(),
            otp: emailNewOtp.trim(),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "New email OTP verification failed",
        );
      setEmailNewVerifiedForChange(true);
      toast({
        title: "New email verified",
        description: "New email verified. You can now continue saving.",
      });
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile new email otp verify",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const sendPhoneChangeOtp = async () => {
    if (!contactSnapshot.phone?.trim()) {
      toast({
        title: t("customer.profile.toast.error"),
        description: "No current phone number found on your account.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${API_BASE}/company/profile/contact-otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "phone",
          target: "current",
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to send WhatsApp OTP",
        );
      setPhoneOtpSent(true);
      toast({
        title: "OTP sent",
        description: "Verification code has been sent to your current phone.",
      });
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile phone otp send",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyPhoneChangeOtp = async () => {
    if (!contactSnapshot.phone?.trim() || phoneOtp.trim().length !== 6) {
      toast({
        title: t("customer.profile.toast.error"),
        description: "Enter the 6-digit phone OTP first.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(
        `${API_BASE}/company/profile/contact-otp/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            channel: "phone",
            target: "current",
            otp: phoneOtp.trim(),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Phone OTP verification failed",
        );
      setPhoneVerifiedForChange(true);
      markPhoneVerifiedInStorage();
      toast({
        title: "Phone verified",
        description: "Current phone verified. You can now save your new phone.",
      });
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile phone otp verify",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const sendNewPhoneChangeOtp = async () => {
    if (!profile?.phone?.trim()) {
      toast({
        title: t("customer.profile.toast.error"),
        description: "Please enter a new phone number first.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(`${API_BASE}/company/profile/contact-otp/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          channel: "phone",
          target: "new",
          phone: profile.phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "Failed to send OTP to new phone",
        );
      setPhoneNewOtpSent(true);
      toast({
        title: "OTP sent",
        description: "Verification code has been sent to your new phone.",
      });
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile new phone otp send",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const verifyNewPhoneChangeOtp = async () => {
    if (!profile?.phone?.trim() || phoneNewOtp.trim().length !== 6) {
      toast({
        title: t("customer.profile.toast.error"),
        description: "Enter the 6-digit OTP sent to your new phone.",
        variant: "destructive",
      });
      return;
    }
    setOtpBusy(true);
    try {
      const token = localStorage.getItem("token");
      if (!token)
        throw new Error("You must be logged in to verify contact changes.");
      const res = await fetch(
        `${API_BASE}/company/profile/contact-otp/verify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            channel: "phone",
            target: "new",
            phone: profile.phone.trim(),
            otp: phoneNewOtp.trim(),
          }),
        },
      );
      const data = await res.json();
      if (!res.ok)
        throw new Error(
          data?.message || data?.error || "New phone OTP verification failed",
        );
      setPhoneNewVerifiedForChange(true);
      markPhoneVerifiedInStorage();
      toast({
        title: "New phone verified",
        description: "New phone verified. You can now continue saving.",
      });
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile new phone otp verify",
        ),
        variant: "destructive",
      });
    } finally {
      setOtpBusy(false);
    }
  };

  const handleSave = async () => {
    const changedEmail = hasEmailChanged();
    const changedPhone = hasPhoneChanged();
    const needEmailVerification = changedEmail;
    const needEmailCurrentVerification =
      changedEmail && !!contactSnapshot.email?.trim();
    const needEmailNewVerification = changedEmail;
    const needPhoneVerification = changedPhone;
    const needPhoneCurrentVerification =
      changedPhone && !!contactSnapshot.phone?.trim();
    const needPhoneNewVerification = changedPhone;
    if (
      (needEmailCurrentVerification && !emailVerifiedForChange) ||
      (needEmailNewVerification && !emailNewVerifiedForChange) ||
      (needPhoneCurrentVerification && !phoneVerifiedForChange) ||
      (needPhoneNewVerification && !phoneNewVerifiedForChange)
    ) {
      setRequiresEmailVerification(needEmailVerification);
      setRequiresEmailCurrentVerification(needEmailCurrentVerification);
      setRequiresEmailNewVerification(needEmailNewVerification);
      setRequiresPhoneVerification(needPhoneVerification);
      setRequiresPhoneCurrentVerification(needPhoneCurrentVerification);
      setRequiresPhoneNewVerification(needPhoneNewVerification);
      setVerificationStepIndex(0);
      setContactVerificationOpen(true);
      return;
    }

    setIsSaving(true);
    try {
      const backendData = transformToBackendFormat(profile);
      const response = await upsertCompanyProfile(backendData);

      if (response?.data) {
        setProfile(response.data);
      }

      setContactSnapshot({
        email: (profile?.email || "").trim(),
        phone: (profile?.phone || "").trim(),
      });
      setEmailVerifiedForChange(false);
      setEmailNewVerifiedForChange(false);
      setPhoneVerifiedForChange(false);
      setPhoneNewVerifiedForChange(false);
      setEmailOtpSent(false);
      setEmailNewOtpSent(false);
      setPhoneOtpSent(false);
      setPhoneNewOtpSent(false);
      setEmailOtp("");
      setEmailNewOtp("");
      setPhoneOtp("");
      setPhoneNewOtp("");
      setRequiresEmailVerification(false);
      setRequiresEmailCurrentVerification(false);
      setRequiresEmailNewVerification(false);
      setRequiresPhoneVerification(false);
      setRequiresPhoneCurrentVerification(false);
      setRequiresPhoneNewVerification(false);
      invalidateCustomerLayoutProfile();
      setIsEditing(false);
      toast({
        title: t("customer.profile.toast.updatedTitle"),
        description: t("customer.profile.toast.updatedDesc"),
      });
      // Reload completion percentage and suggestions
      try {
        const completionResponse = await getCompanyProfileCompletion();
        if (completionResponse.success) {
          setProfileCompletion(completionResponse.data.completion || 0);
          setCompletionSuggestions(completionResponse.data.suggestions || []);
        }
      } catch (error) {
        getUserFriendlyErrorMessage(
          error,
          "customer profile completion after save",
        );
      }
    } catch (error) {
      toast({
        title: t("customer.profile.toast.error"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer profile save",
        ),
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
            memberSince: new Date(pd.createdAt).toLocaleDateString(dateLocale, {
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
                ? new Date(String(item.reviewedAt)).toLocaleString(dateLocale, {
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
          getUserFriendlyErrorMessage(err, "customer profile kyc fetch");
        }
      } catch (error) {
        toast({
          title: t("customer.profile.toast.error"),
          description: getUserFriendlyErrorMessage(
            error,
            "customer profile load",
          ),
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateLocale, t]); // initialProfileData and toast are intentionally excluded

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
      memberSince: new Date(pd.createdAt).toLocaleDateString(dateLocale, {
        year: "numeric",
        month: "long",
      }),
    };
    setStatsState(computed);
  }, [profile, dateLocale]);

  useEffect(() => {
    if (!profile || isEditing) return;
    setContactSnapshot({
      email: (profile.email || "").trim(),
      phone: (profile.phone || "").trim(),
    });
  }, [profile?.email, profile?.phone, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const verified = Boolean(
        parsed?.phoneVerified ??
        parsed?.isPhoneVerified ??
        parsed?.whatsappVerified,
      );
      setPhoneVerifiedStatus(verified);
    } catch {
      setPhoneVerifiedStatus(false);
    }
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    if (hasEmailChanged()) {
      setEmailVerifiedForChange(false);
      setEmailNewVerifiedForChange(false);
      setEmailOtpSent(false);
      setEmailNewOtpSent(false);
      setEmailOtp("");
      setEmailNewOtp("");
    }
    if (hasPhoneChanged()) {
      setPhoneVerifiedForChange(false);
      setPhoneNewVerifiedForChange(false);
      setPhoneOtpSent(false);
      setPhoneNewOtpSent(false);
      setPhoneOtp("");
      setPhoneNewOtp("");
    }
  }, [profile?.email, profile?.phone, isEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!contactVerificationOpen) return;
    setVerificationStepIndex(0);
    setEmailCurrentVerificationMethod("otp");
    setCurrentPassword("");
  }, [
    contactVerificationOpen,
    requiresEmailVerification,
    requiresEmailCurrentVerification,
    requiresEmailNewVerification,
    requiresPhoneVerification,
    requiresPhoneCurrentVerification,
    requiresPhoneNewVerification,
  ]);

  useEffect(() => {
    if (
      !contactVerificationOpen ||
      currentVerificationStep !== "emailCurrent" ||
      emailCurrentVerificationMethod !== "google" ||
      emailVerifiedForChange
    ) {
      return;
    }

    const container = document.getElementById(
      "google-contact-verify-button-container",
    );
    if (!container) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      container.innerHTML =
        '<p class="text-xs text-amber-700">Google verification is not configured.</p>';
      return;
    }

    const initGoogle = () => {
      const win = window as unknown as {
        google?: { accounts?: { id?: GoogleAccountsId } };
      };
      const g = win.google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response?.credential) {
            void verifyCurrentEmailWithGoogleToken(response.credential);
          }
        },
      });
      container.innerHTML = "";
      g.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "medium",
        text: "continue_with",
        width: 260,
      });
    };

    const win = window as unknown as {
      google?: { accounts?: { id?: GoogleAccountsId } };
    };

    if (win.google?.accounts?.id) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
    return () => {
      container.innerHTML = "";
    };
  }, [
    contactVerificationOpen,
    currentVerificationStep,
    emailCurrentVerificationMethod,
    emailVerifiedForChange,
  ]);

  if (isLoading && !profile) {
    return (
      <>
        <CustomerProfileTour />
        <CustomerProfilePageSkeleton
          loadingLabel={t("customer.profile.page.loading")}
        />
      </>
    );
  }

  if (!profile) {
    return (
      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-0">
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="text-sm sm:text-base text-gray-700">
            {t("customer.profile.page.notFound")}
          </div>
          <div>
            <Button
              onClick={() => {
                setProfile(defaultProfile);
                setIsEditing(true);
              }}
              className="text-xs sm:text-sm"
            >
              {t("customer.profile.page.create")}
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
            {t("customer.profile.title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {t("customer.profile.subtitle")}
          </p>
        </div>
        {!isEditing && (
          <Button
            onClick={() => {
              setEmailVerifiedForChange(false);
              setEmailNewVerifiedForChange(false);
              setPhoneVerifiedForChange(false);
              setPhoneNewVerifiedForChange(false);
              setEmailOtpSent(false);
              setEmailNewOtpSent(false);
              setPhoneOtpSent(false);
              setPhoneNewOtpSent(false);
              setEmailOtp("");
              setEmailNewOtp("");
              setPhoneOtp("");
              setPhoneNewOtp("");
              setIsEditing(true);
            }}
            className="w-full sm:w-auto text-xs sm:text-sm"
            data-tour-step="1"
          >
            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            {t("customer.profile.editProfile")}
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
              {t("customer.profile.editBanner.lead")}{" "}
              <strong>{t("customer.profile.editBanner.saveWord")}</strong>{" "}
              {t("customer.profile.editBanner.whenDone")}
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
                    {t("customer.profile.viewMissing")}
                    <ChevronDown className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-80 max-h-[60vh] overflow-y-auto"
                >
                  <div className="px-3 py-2 border-b bg-muted/50">
                    <p className="text-sm font-semibold text-gray-900">
                      {t("customer.profile.incompleteTitle")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {t("customer.profile.incompleteSubtitle")}
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
                      {t("customer.profile.incompleteHint")}
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
                setContactVerificationOpen(false);
                setIsEditing(false);
              }}
            >
              {t("customer.profile.cancel")}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t("customer.profile.saving")}
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("customer.profile.saveChanges")}
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
            {t("customer.profile.incompleteStrip")}
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
            {t("customer.profile.completeStrip")}
          </span>
        </div>
      )}

      <div data-tour-step="3">
        <Tabs
          defaultValue={defaultTab}
          className="space-y-4 sm:space-y-5 lg:space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
            <TabsTrigger value="profile">
              {t("customer.profile.tab.profile")}
            </TabsTrigger>
            <TabsTrigger value="company">
              {t("customer.profile.tab.company")}
            </TabsTrigger>
            <TabsTrigger value="verification">
              {t("customer.profile.tab.verification")}
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="profile"
            className="space-y-4 sm:space-y-5 lg:space-y-6"
          >
            <ProfileOverview
              value={profile as ProfileData}
              onChange={setProfile}
              isEditing={isEditing}
              isPhoneVerified={phoneVerifiedStatus}
              onVerifyPhoneNumber={handleVerifyCurrentPhone}
              phoneVerificationBusy={otpBusy}
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

      <Dialog
        open={contactVerificationOpen}
        onOpenChange={setContactVerificationOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify contact changes</DialogTitle>
            <DialogDescription>
              To protect your account, we first send OTP to your current contact
              before applying your new email or phone number.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {verificationSteps.length > 0 && (
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>
                    Step{" "}
                    {Math.min(
                      verificationStepIndex + 1,
                      verificationSteps.length,
                    )}{" "}
                    of {verificationSteps.length}
                  </span>
                  <span>
                    {currentVerificationStep === "emailCurrent"
                      ? "Verify current email"
                      : currentVerificationStep === "emailNew"
                        ? "Verify new email"
                        : currentVerificationStep === "phoneCurrent"
                          ? "Verify current phone"
                          : "Verify new phone"}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200">
                  <div
                    className="h-1.5 rounded-full bg-blue-600 transition-all"
                    style={{
                      width: `${((verificationStepIndex + 1) / verificationSteps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {currentVerificationStep === "emailCurrent" && (
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>Current email verification</Label>
                  {emailVerifiedForChange ? (
                    <span className="text-xs text-green-700">
                      Step completed
                    </span>
                  ) : (
                    <span className="text-xs text-amber-700">
                      Verification required
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 break-all">
                  Current email: {contactSnapshot.email || "-"}
                </p>
                <p className="text-xs text-gray-500 break-all">
                  New email: {profile?.email || "-"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant={
                      emailCurrentVerificationMethod === "otp"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setEmailCurrentVerificationMethod("otp")}
                  >
                    OTP
                  </Button>
                  <Button
                    type="button"
                    variant={
                      emailCurrentVerificationMethod === "password"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() =>
                      setEmailCurrentVerificationMethod("password")
                    }
                  >
                    <Lock className="w-3.5 h-3.5 mr-1.5" />
                    Password
                  </Button>
                  <Button
                    type="button"
                    variant={
                      emailCurrentVerificationMethod === "google"
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setEmailCurrentVerificationMethod("google")}
                  >
                    Google
                  </Button>
                </div>

                {emailCurrentVerificationMethod === "otp" && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendEmailChangeOtp}
                      disabled={otpBusy}
                    >
                      {emailOtpSent ? "Resend OTP" : "Send OTP"}
                    </Button>
                    <Input
                      value={emailOtp}
                      onChange={(e) =>
                        setEmailOtp(
                          e.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      placeholder="6-digit code"
                      className="sm:max-w-[180px]"
                    />
                    <Button
                      type="button"
                      onClick={verifyEmailChangeOtp}
                      disabled={otpBusy || emailOtp.trim().length !== 6}
                    >
                      Verify
                    </Button>
                  </div>
                )}

                {emailCurrentVerificationMethod === "password" && (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter your current password"
                      className="sm:max-w-[260px]"
                    />
                    <Button
                      type="button"
                      onClick={verifyCurrentEmailWithPassword}
                      disabled={identityBusy || !currentPassword.trim()}
                    >
                      {identityBusy ? "Verifying..." : "Verify password"}
                    </Button>
                  </div>
                )}

                {emailCurrentVerificationMethod === "google" && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500">
                      If your account uses Google sign-in, verify with your
                      Google account.
                    </p>
                    <div
                      id="google-contact-verify-button-container"
                      className="min-h-[40px]"
                    />
                  </div>
                )}
              </div>
            )}

            {currentVerificationStep === "emailNew" && (
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>New email verification</Label>
                  {emailNewVerifiedForChange ? (
                    <span className="text-xs text-green-700">
                      Step completed
                    </span>
                  ) : (
                    <span className="text-xs text-amber-700">
                      Verification required
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 break-all">
                  Current email: {contactSnapshot.email || "-"}
                </p>
                <p className="text-xs text-gray-500 break-all">
                  New email: {profile?.email || "-"}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendNewEmailChangeOtp}
                    disabled={otpBusy}
                  >
                    {emailNewOtpSent ? "Resend OTP" : "Send OTP"}
                  </Button>
                  <Input
                    value={emailNewOtp}
                    onChange={(e) =>
                      setEmailNewOtp(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder="6-digit code"
                    className="sm:max-w-[180px]"
                  />
                  <Button
                    type="button"
                    onClick={verifyNewEmailChangeOtp}
                    disabled={otpBusy || emailNewOtp.trim().length !== 6}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {currentVerificationStep === "phoneCurrent" && (
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>Phone verification</Label>
                  {phoneVerifiedForChange ? (
                    <span className="text-xs text-green-700">
                      Step completed
                    </span>
                  ) : (
                    <span className="text-xs text-amber-700">
                      Verification required
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 break-all">
                  Current phone: {contactSnapshot.phone || "-"}
                </p>
                <p className="text-xs text-gray-500 break-all">
                  New phone: {profile?.phone || "-"}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendPhoneChangeOtp}
                    disabled={otpBusy}
                  >
                    {phoneOtpSent ? "Resend OTP" : "Send OTP"}
                  </Button>
                  <Input
                    value={phoneOtp}
                    onChange={(e) =>
                      setPhoneOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    placeholder="6-digit code"
                    className="sm:max-w-[180px]"
                  />
                  <Button
                    type="button"
                    onClick={verifyPhoneChangeOtp}
                    disabled={otpBusy || phoneOtp.trim().length !== 6}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {currentVerificationStep === "phoneNew" && (
              <div className="rounded-md border p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>New phone verification</Label>
                  {phoneNewVerifiedForChange ? (
                    <span className="text-xs text-green-700">
                      Step completed
                    </span>
                  ) : (
                    <span className="text-xs text-amber-700">
                      Verification required
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 break-all">
                  Current phone: {contactSnapshot.phone || "-"}
                </p>
                <p className="text-xs text-gray-500 break-all">
                  New phone: {profile?.phone || "-"}
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={sendNewPhoneChangeOtp}
                    disabled={otpBusy}
                  >
                    {phoneNewOtpSent ? "Resend OTP" : "Send OTP"}
                  </Button>
                  <Input
                    value={phoneNewOtp}
                    onChange={(e) =>
                      setPhoneNewOtp(
                        e.target.value.replace(/\D/g, "").slice(0, 6),
                      )
                    }
                    placeholder="6-digit code"
                    className="sm:max-w-[180px]"
                  />
                  <Button
                    type="button"
                    onClick={verifyNewPhoneChangeOtp}
                    disabled={otpBusy || phoneNewOtp.trim().length !== 6}
                  >
                    Verify
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setContactVerificationOpen(false)}
            >
              Cancel
            </Button>
            {verificationStepIndex > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setVerificationStepIndex((prev) => Math.max(0, prev - 1))
                }
              >
                Previous
              </Button>
            )}
            {!isLastVerificationStep && (
              <Button
                type="button"
                onClick={() =>
                  setVerificationStepIndex((prev) =>
                    Math.min(prev + 1, verificationSteps.length - 1),
                  )
                }
                disabled={!currentStepVerified}
              >
                Next step
              </Button>
            )}
            <Button
              type="button"
              onClick={async () => {
                if (
                  (requiresEmailCurrentVerification &&
                    !emailVerifiedForChange) ||
                  (requiresEmailNewVerification &&
                    !emailNewVerifiedForChange) ||
                  (requiresPhoneCurrentVerification &&
                    !phoneVerifiedForChange) ||
                  (requiresPhoneNewVerification && !phoneNewVerifiedForChange)
                ) {
                  return;
                }
                setContactVerificationOpen(false);
                await handleSave();
              }}
              disabled={
                !isLastVerificationStep ||
                (requiresEmailCurrentVerification && !emailVerifiedForChange) ||
                (requiresEmailNewVerification && !emailNewVerifiedForChange) ||
                (requiresPhoneCurrentVerification && !phoneVerifiedForChange) ||
                (requiresPhoneNewVerification && !phoneNewVerifiedForChange)
              }
            >
              Continue save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
