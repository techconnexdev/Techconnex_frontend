"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Zap,
  ArrowRight,
  ChevronLeft,
  CheckCircle,
  Building,
  Users,
  Briefcase,
  User,
  Upload,
  Globe,
  ChevronRight,
  Mail,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import CustomerRegistration from "./components/company";
import ProviderRegistration from "./components/Provider";
import Image from "next/image";
import Cookies from "js-cookie";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@radix-ui/react-checkbox";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

// Registration steps for providers (minimal: account + OTP only; rest in profile later)
const PROVIDER_STEPS = [
  { id: 1, title: "Account Setup", description: "Basic account information" },
  {
    id: 2,
    title: "Email Verification",
    description: "Verify your email address",
  },
];

// Registration steps for customers (minimal: account + OTP only; rest in onboarding)
const CUSTOMER_STEPS = [
  { id: 1, title: "Account Setup", description: "Basic account information" },
  {
    id: 2,
    title: "Email Verification",
    description: "Verify your email address",
  },
];

export type Certification = {
  name: string;
  issuer: string;
  issuedDate: string;
  verified?: boolean;
  serialNumber?: string;
  sourceUrl?: string;
};

export type RegistrationFormData = {
  // Step 1: Account Setup
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;

  // Step 2: Profile Details
  bio: string;
  major: string;
  location: string;
  website: string;
  companyName: string;
  companyDescription: string;
  companySize: string;
  industry: string;

  // Step 3: Skills & Experience (Provider only)
  yearsExperience: string;
  hourlyRate: string;
  availability: string;
  minimumProjectBudget: string;
  maximumProjectBudget: string;
  preferredProjectDuration: string;
  workPreference: string;
  teamSize: string;

  // Company-specific fields
  employeeCount: string;
  establishedYear: string;
  annualRevenue: string;
  fundingStage: string;
  preferredContractTypes: string[];
  averageBudgetRange: string;
  remotePolicy: string;
  hiringFrequency: string;
  categoriesHiringFor: string[];
  mission: string;
  values: string[];
  socialLinks: string[];
  acceptedTerms: boolean; // Change from string to boolean
};

export default function SignupPage() {
  const emailRef = useRef<HTMLInputElement>(null!);
  const [roleSelected, setRoleSelected] = useState(false);
  /** 'email' = use website form; 'google' = use Google (button on same screen); null = show method choice */
  const [registrationMethod, setRegistrationMethod] = useState<
    "email" | "google" | null
  >(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [customLanguage, setCustomLanguage] = useState("");
  const [userRole, setUserRole] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [portfolioUrls, setPortfolioUrls] = useState<string[]>([]);
  const [newPortfolioUrl, setNewPortfolioUrl] = useState("");
  const [socialUrls, setSocialUrls] = useState<string[]>([]);
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [newCertification, setNewCertification] = useState<Certification>({
    name: "",
    issuer: "",
    issuedDate: "",
    verified: false,
    serialNumber: "",
    sourceUrl: "",
  });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editCertification, setEditCertification] =
    useState<Certification | null>(null);

  const [isProcessingCV, setIsProcessingCV] = useState(false);
  const [cvExtractedData, setCvExtractedData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [showAIResults, setShowAIResults] = useState(false);
  const [aiProcessingComplete, setAiProcessingComplete] = useState(false);

  const [formData, setFormData] = useState<RegistrationFormData>({
    // Step 1: Account Setup
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",

    // Step 2: Profile Details
    bio: "",
    major: "",
    location: "",
    website: "",
    companyName: "",
    companyDescription: "",
    companySize: "",
    industry: "",

    // Step 3: Skills & Experience (Provider only)
    yearsExperience: "",
    hourlyRate: "",
    availability: "",
    minimumProjectBudget: "",
    maximumProjectBudget: "",
    preferredProjectDuration: "",
    workPreference: "remote",
    teamSize: "1",

    // Company-specific fields
    employeeCount: "",
    establishedYear: "",
    annualRevenue: "",
    fundingStage: "",
    preferredContractTypes: [],
    averageBudgetRange: "",
    remotePolicy: "",
    hiringFrequency: "",
    categoriesHiringFor: [],
    mission: "",
    values: [],
    socialLinks: [],

    acceptedTerms: false, // Change from "false" to false
  });

  const [kycDocType, setKycDocType] = useState<
    "" | "PASSPORT" | "IC" | "COMPANY_REGISTRATION"
  >("");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [emailStatus, setEmailStatus] = useState<
    "idle" | "checking" | "available" | "used"
  >("idle");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  // Helper functions
  const isStrongPassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|;:'",.<>/?`~]).{8,}$/.test(
      pwd,
    );

  const checkEmailAvailability = async (email: string) => {
    try {
      setEmailStatus("checking");
      // Add cache-busting parameter to prevent browser caching
      const timestamp = Date.now();
      const res = await fetch(
        `${API_BASE}/auth/check-email?email=${encodeURIComponent(
          email,
        )}&_t=${timestamp}`,
        {
          method: "GET",
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        },
      );
      const data = await res.json();
      console.log(`🔍 Checking email availability for: ${email}`);
      console.log(`📧 Email check response:`, data);
      if (!res.ok || typeof data.available !== "boolean")
        throw new Error(data?.error || "Failed");
      setEmailStatus(data.available ? "available" : "used");
      console.log(
        `✅ Email status set to: ${data.available ? "available" : "used"}`,
      );
      return data.available;
    } catch (error) {
      console.error(`❌ Email check error:`, error);
      setEmailStatus("idle");
      setFieldErrors((p) => ({
        ...p,
        email: "Could not verify email right now.",
      }));
      return null;
    }
  };

  const sendEmailOtp = async () => {
    const email = formData.email?.trim();
    if (!email) {
      setOtpError("Please enter your email first.");
      return;
    }
    setOtpError("");
    setIsSendingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/auth/send-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send code");
      setEmailOtpSent(true);
      setResendCooldown(60);
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Failed to send code.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    const email = formData.email?.trim();
    if (!email || otpCode.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }
    setOtpError("");
    setIsVerifyingOtp(true);
    try {
      const res = await fetch(`${API_BASE}/auth/verify-email-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Verification failed");
      setEmailOtpVerified(true);
    } catch (e) {
      setOtpError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(
      () => setResendCooldown((c) => (c <= 1 ? 0 : c - 1)),
      1000,
    );
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Auto-send OTP when user lands on verification step
  useEffect(() => {
    if (
      currentStep === 2 &&
      formData.email?.trim() &&
      !emailOtpSent &&
      !isSendingOtp &&
      emailStatus === "available"
    ) {
      sendEmailOtp();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep]);

  // Load Google Sign-In and render button when on method choice screen
  useEffect(() => {
    if (!roleSelected || registrationMethod !== null || !userRole) return;
    const container = document.getElementById(
      "google-register-button-container",
    );
    if (!container) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      container.innerHTML =
        '<p class="text-sm text-amber-600">Google sign-in not configured</p>';
      return;
    }

    const doGoogleAuth = (idToken: string) => {
      setError("");
      setIsLoading(true);
      fetch(`${API_BASE}/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, role: userRole }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.token || !data.user)
            throw new Error(
              data.message || data.error || "Google sign-in failed",
            );
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          Cookies.set("token", data.token, {
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
          });
          const roles: string[] = data.user?.role || [];
          if (roles.includes("CUSTOMER")) router.push("/customer/onboarding");
          else if (roles.includes("PROVIDER"))
            router.push("/provider/dashboard");
          else router.push("/dashboard");
        })
        .catch((err) => {
          setError(
            err instanceof Error ? err.message : "Google sign-in failed",
          );
        })
        .finally(() => setIsLoading(false));
    };

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
    const initGoogle = () => {
      const g = (
        window as unknown as {
          google?: { accounts?: { id?: GoogleAccountsId } };
        }
      ).google;
      if (!g?.accounts?.id) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (response: { credential?: string }) => {
          if (response?.credential) doGoogleAuth(response.credential);
        },
      });
      container.innerHTML = "";
      g.accounts.id.renderButton(container, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "continue_with",
        width: 320,
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
  }, [roleSelected, registrationMethod, userRole, router]);

  const uploadResume = async (
    userId: string,
    file: File,
    options?: { forRegistration?: boolean },
  ) => {
    // Validate file type
    if (file.type !== "application/pdf") {
      throw new Error(
        "Invalid file type: Only PDF files are allowed for resumes.",
      );
    }

    // Validate file size (50MB max for documents)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      throw new Error(
        `File size exceeds limit. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)} MB`,
      );
    }

    try {
      // Upload to R2 first
      const { uploadFile } = await import("@/lib/upload");

      let uploadResult;
      try {
        uploadResult = await uploadFile({
          file: file,
          prefix: "resumes",
          visibility: "private", // Resumes should be private
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

      // During registration, do not send token so backend uses body.userId (avoids FK error).
      const token =
        options?.forRegistration === true
          ? undefined
          : typeof window !== "undefined"
            ? localStorage.getItem("token")
            : undefined;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let res;
      try {
        res = await fetch(`${API_BASE}/resume/upload`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId,
            key: uploadResult.key,
            url: uploadResult.url || uploadResult.key, // Use key if URL is empty (private files)
          }),
        });
      } catch (fetchError: unknown) {
        // Handle network errors
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorName = fetchError instanceof Error ? fetchError.name : "";
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("fetch") ||
          errorName === "TypeError"
        ) {
          throw new Error(
            "Network error: Unable to connect to server. Please check your internet connection and try again.",
          );
        }
        throw new Error(
          `Server connection failed: ${errorMessage || "Unknown error"}`,
        );
      }

      if (!res.ok) {
        let errorMessage = "Resume upload failed";
        try {
          const errorData = await res.json();
          errorMessage = errorData?.error || errorData?.message || errorMessage;
        } catch {
          errorMessage = `Resume upload failed (${res.status} ${res.statusText})`;
        }

        if (res.status === 400) {
          throw new Error(`Validation error: ${errorMessage}`);
        } else if (res.status === 401 || res.status === 403) {
          throw new Error(`Authorization error: ${errorMessage}`);
        } else if (res.status >= 500) {
          throw new Error(
            `Server error: ${errorMessage}. Please try again later.`,
          );
        }
        throw new Error(errorMessage);
      }

      return res;
    } catch (error: unknown) {
      console.error("Resume upload error:", error);
      throw error;
    }
  };

  const uploadCertifications = async (
    userId: string,
    certs: Certification[],
  ) => {
    return fetch(`${API_BASE}/certifications/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, certifications: certs }),
    });
  };

  const uploadKyc = async (userId: string) => {
    if (!kycFile) return { ok: true }; // skip if no file

    // ✅ Check if user accidentally selected a folder
    if (kycFile.type === "" && kycFile.size === 0) {
      const errorMsg =
        "You cannot upload a folder. Please select a valid file.";
      setError(errorMsg);
      return { ok: false, error: errorMsg };
    }

    // Validate file size (50MB max for documents)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (kycFile.size > maxSize) {
      const errorMsg = `File size exceeds limit. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)} MB`;
      setError(errorMsg);
      return { ok: false, error: errorMsg };
    }

    try {
      // Upload to R2 first
      // Category will be auto-detected from file type (image, document, or video)
      const { uploadFile } = await import("@/lib/upload");

      let uploadResult;
      try {
        uploadResult = await uploadFile({
          file: kycFile,
          prefix: "kyc",
          visibility: "private", // KYC documents should be private
          // Don't specify category - let it auto-detect from file.type
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
        throw new Error(
          uploadResult.error || "Failed to upload KYC document to R2",
        );
      }

      // Send R2 key/URL to backend
      // Token is optional (for registration flows)
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("token")
          : undefined;

      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      // Add authorization header only if token exists
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      let res;
      try {
        res = await fetch(`${API_BASE}/kyc`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            userId,
            type: userRole === "provider" ? "PROVIDER_ID" : "COMPANY_REG",
            key: uploadResult.key,
            url: uploadResult.url || uploadResult.key, // Use key if URL is empty (private files)
            filename: kycFile.name,
            mimeType: kycFile.type || "application/octet-stream",
          }),
        });
      } catch (fetchError: unknown) {
        // Handle network errors
        const errorMessage =
          fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorName = fetchError instanceof Error ? fetchError.name : "";
        if (
          errorMessage.includes("network") ||
          errorMessage.includes("fetch") ||
          errorName === "TypeError"
        ) {
          throw new Error(
            "Network error: Unable to connect to server. Please check your internet connection and try again.",
          );
        }
        throw new Error(
          `Server connection failed: ${errorMessage || "Unknown error"}`,
        );
      }

      let payload;
      try {
        payload = await res.json();
      } catch {
        throw new Error(
          `Server response error: Invalid response from server. Please try again.`,
        );
      }

      if (!res.ok) {
        const errorMsg =
          payload?.error ||
          payload?.message ||
          `KYC upload failed (${res.status})`;
        if (res.status === 400) {
          throw new Error(`Validation error: ${errorMsg}`);
        } else if (res.status === 401 || res.status === 403) {
          throw new Error(`Authorization error: ${errorMsg}`);
        } else if (res.status >= 500) {
          throw new Error(`Server error: ${errorMsg}. Please try again later.`);
        }
        throw new Error(errorMsg);
      }

      return { ok: true, data: payload.data };
    } catch (e: unknown) {
      console.error("KYC upload error:", e);
      const errorMessage =
        e instanceof Error ? e.message : "KYC upload failed. Please try again.";
      setError(errorMessage);
      return { ok: false, error: errorMessage };
    }
  };

  const getCurrentSteps = () => {
    return userRole === "provider" ? PROVIDER_STEPS : CUSTOMER_STEPS;
  };

  const getStepProgress = () => (currentStep / getCurrentSteps().length) * 100;

  useEffect(() => {
    const qp = (searchParams.get("role") || "").toLowerCase();
    if (qp === "customer" || qp === "provider") {
      setUserRole(qp);
      setRoleSelected(true);
      setCurrentStep(1);
    }
  }, [searchParams]);

  useEffect(() => {
    if (userRole === "customer") setKycDocType("COMPANY_REGISTRATION");
  }, [userRole]);

  const handleRoleSelection = (role: "customer" | "provider") => {
    setUserRole(role);
    setRoleSelected(true);
    setRegistrationMethod(null);
    setCurrentStep(1);
    router.replace(`/auth/register?role=${role}`);
  };

  const handleChangeRole = () => {
    setRoleSelected(false);
    setRegistrationMethod(null);
    setUserRole("");
    setCurrentStep(1);
    router.replace(`/auth/register`);
  };

  const handleContinueWithRole = () => {
    if (userRole) {
      setRoleSelected(true);
    }
  };

  const handleChooseEmailRegistration = () => {
    setRegistrationMethod("email");
  };

  const handleInputChange = (
    key: keyof RegistrationFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (key === "email") {
      setEmailStatus("idle");
      setFieldErrors((p) => ({ ...p, email: undefined }));
      setError("");
      setEmailOtpSent(false);
      setEmailOtpVerified(false);
      setOtpCode("");
      setOtpError("");
    }
  };
  const handleBooleanInputChange = (
    key: keyof RegistrationFormData,
    value: boolean,
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  /** Returns a clear message listing exactly which required fields are missing for the current step. */
  const getMissingRequiredFields = (step: number): string => {
    if (userRole === "customer") {
      switch (step) {
        case 1: {
          const missing: string[] = [];
          if (!formData.companyName?.trim()) missing.push("Company name");
          if (!formData.email?.trim()) missing.push("Email");
          if (!formData.password) missing.push("Password");
          if (!formData.confirmPassword) missing.push("Confirm password");
          if (!formData.phone?.trim()) missing.push("Phone number");
          if (!formData.acceptedTerms) missing.push("Accept Terms of Service");
          if (formData.password && !isStrongPassword(formData.password))
            missing.push(
              "Password must be strong (8+ chars, upper, lower, number, symbol)",
            );
          if (
            formData.password &&
            formData.confirmPassword &&
            formData.password !== formData.confirmPassword
          )
            missing.push("Passwords must match");
          if (missing.length)
            return `Account Setup: please fill in ${missing.join(", ")}.`;
          return "Please fill in all required account fields before proceeding.";
        }
        case 2:
          return "Please verify your email with the 6-digit code we sent before continuing.";
        default:
          return "Please complete the required fields for this step before proceeding.";
      }
    }
    // Provider
    switch (step) {
      case 1: {
        const missing: string[] = [];
        if (!formData.name?.trim()) missing.push("Full name");
        if (!formData.email?.trim()) missing.push("Email");
        if (!formData.password) missing.push("Password");
        if (!formData.confirmPassword) missing.push("Confirm password");
        if (!formData.phone?.trim()) missing.push("Phone number");
        if (formData.password && !isStrongPassword(formData.password))
          missing.push(
            "Password must be strong (8+ chars, upper, lower, number, symbol)",
          );
        if (
          formData.password &&
          formData.confirmPassword &&
          formData.password !== formData.confirmPassword
        )
          missing.push("Passwords must match");
        if (missing.length)
          return `Account Setup: please fill in ${missing.join(", ")}.`;
        return "Please fill in all required account fields before proceeding.";
      }
      case 2:
        return "Please verify your email with the 6-digit code we sent before continuing.";
      case 3: {
        const missing: string[] = [];
        if (!formData.bio?.trim()) missing.push("Bio");
        if (!formData.location?.trim()) missing.push("Location");
        if (!resumeFile) missing.push("Resume (upload a file)");
        if (!kycDocType || !kycFile)
          missing.push("KYC document (select type and upload file)");
        if (missing.length)
          return `Profile & CV: please fill in ${missing.join(", ")}.`;
        return "Please complete all required Profile & CV fields before proceeding.";
      }
      case 6: {
        if (certifications.length === 0)
          return "Please complete the required fields for this step before proceeding.";
        const invalid: string[] = [];
        const isValidDate = (s: string) => {
          const t = (s || "").trim();
          if (!t) return false;
          return !Number.isNaN(new Date(t).getTime());
        };
        certifications.forEach((cert, i) => {
          const serial = (cert.serialNumber || "").trim().toLowerCase();
          const link = (cert.sourceUrl || "").trim().toLowerCase();
          const hasSerial =
            serial && serial !== "not specified" && serial !== "n/a";
          const hasLink = link && link !== "not specified" && link !== "n/a";
          if (!hasSerial && !hasLink)
            invalid.push(
              `Cert "${cert.name || "Unnamed"}" needs serial number or verification link`,
            );
          else if (!isValidDate(cert.issuedDate || ""))
            invalid.push(
              `Cert "${cert.name || "Unnamed"}" needs a valid issue date`,
            );
        });
        if (invalid.length) return `Certifications: ${invalid.join(". ")}`;
        return "Please complete the required fields for this step before proceeding.";
      }
      case 7:
        return "You must accept the Terms of Service, Privacy Policy, and Cookie Policy to proceed.";
      default:
        return "Please complete the required fields for this step before proceeding.";
    }
  };

  const validateStep = (step: number): boolean => {
    if (userRole === "customer") {
      switch (step) {
        case 1: {
          const requiredFilled =
            !!formData.companyName &&
            !!formData.email &&
            !!formData.password &&
            !!formData.confirmPassword &&
            !!formData.phone &&
            Boolean(formData.acceptedTerms);

          const strongAndMatch =
            isStrongPassword(formData.password) &&
            formData.password === formData.confirmPassword;

          return requiredFilled && strongAndMatch;
        }
        case 2:
          return emailOtpVerified;
        default:
          return true;
      }
    } else {
      switch (step) {
        case 1: {
          const requiredFilled =
            !!formData.name &&
            !!formData.email &&
            !!formData.password &&
            !!formData.confirmPassword &&
            !!formData.phone;
          const strongAndMatch =
            isStrongPassword(formData.password) &&
            formData.password === formData.confirmPassword;
          return requiredFilled && strongAndMatch;
        }
        case 2:
          return emailOtpVerified;
        case 3: {
          const bioOk = !!formData.bio?.trim();
          const locOk = !!formData.location;
          const resumeOk = Boolean(resumeFile);
          const kycOk = Boolean(kycDocType) && Boolean(kycFile);
          return bioOk && locOk && resumeOk && kycOk;
        }
        case 6: {
          // If any certification is added, each must have (serial or link) and valid date
          if (certifications.length === 0) return true;
          const isValidDate = (s: string) => {
            const t = (s || "").trim();
            if (!t) return false;
            const d = new Date(t);
            return !Number.isNaN(d.getTime());
          };
          const hasSerialOrLink = (cert: {
            serialNumber?: string;
            sourceUrl?: string;
          }) => {
            const serial = (cert.serialNumber || "").trim().toLowerCase();
            const link = (cert.sourceUrl || "").trim().toLowerCase();
            const noSerial =
              !serial || serial === "not specified" || serial === "n/a";
            const noLink = !link || link === "not specified" || link === "n/a";
            return !noSerial || !noLink;
          };
          const allValid = certifications.every(
            (cert) =>
              hasSerialOrLink(cert) && isValidDate(cert.issuedDate || ""),
          );
          return allValid;
        }
        case 7:
          return Boolean(formData.acceptedTerms);

        default:
          return true;
      }
    }
  };

  const nextStep = async () => {
    if (!validateStep(currentStep)) {
      setError(getMissingRequiredFields(currentStep));
      return;
    }

    if (currentStep === 1) {
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
      setError("");
      const available = await checkEmailAvailability(formData.email);

      if (available === false) {
        setEmailStatus("used");
        setFieldErrors((prev) => ({
          ...prev,
          email: "This email is already in use.",
        }));
        setError("This email is already in use. Please use a different email.");
        emailRef?.current?.focus();
        emailRef?.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        return;
      }
      if (available === null) {
        setError("We couldn't verify your email right now. Please try again.");
        return;
      }

      setEmailStatus("available");
      setFieldErrors((prev) => ({ ...prev, email: undefined }));
      setError("");
    }

    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, getCurrentSteps().length));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // 1️⃣ Register user
      const endpoint =
        userRole === "provider"
          ? `${API_BASE}/auth/provider/register`
          : `${API_BASE}/auth/company/register`;

      const requestData: Record<string, unknown> = {
        email: formData.email,
        password: formData.password,
        name: userRole === "customer" ? formData.companyName : formData.name,
        phone: formData.phone || null,
      };

      if (userRole === "customer") {
        // Minimal profile at registration; rest completed in customer onboarding
        requestData.customerProfile = {};
      } else if (userRole === "provider") {
        // Minimal profile at registration; rest can be completed in profile later
        requestData.providerProfile = {};
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Registration failed");

      // Provider: minimal flow → auto-login and redirect to dashboard
      if (userRole === "provider" && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        Cookies.set("token", data.token, {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        setSuccess("Account created! Redirecting to dashboard...");
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/provider/dashboard");
        return;
      }

      // Customer: minimal flow → auto-login and redirect to onboarding
      if (userRole === "customer" && data.token && data.user) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        Cookies.set("token", data.token, {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
        });
        setSuccess(
          "Account created! Redirecting to complete your company profile...",
        );
        await new Promise((resolve) => setTimeout(resolve, 500));
        router.push("/customer/onboarding");
        return;
      }

      throw new Error("Registration succeeded but no token received");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  // Role Selection Screen
  if (!roleSelected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
            animate={{ rotate: -360 }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        </div>

        <motion.div
          className="w-full max-w-4xl relative z-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <motion.div
            className="text-center mb-8"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <Link href="/" className="inline-flex items-center space-x-2 group">
              <Image
                src="/logo.png"
                alt="TechConnex"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-contain"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Techconnex
              </span>
            </Link>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  Join Techconnex
                </CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Choose how you want to use our platform
                </CardDescription>
              </CardHeader>
              <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Customer Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 h-full ${
                        userRole === "customer"
                          ? "ring-2 ring-blue-500 bg-blue-50/50 border-blue-300"
                          : "hover:bg-blue-50/30 hover:border-blue-300 border-gray-200"
                      }`}
                      onClick={() => handleRoleSelection("customer")}
                    >
                      <CardContent className="p-8 text-center h-full flex flex-col justify-between">
                        <div>
                          <div className="mb-6">
                            <Building className="w-16 h-16 mx-auto text-blue-600" />
                          </div>
                          <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                            Hire Freelancers
                          </h3>
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            I&apos;m a company looking to hire talented ICT
                            professionals for my projects
                          </p>
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center text-sm text-gray-600">
                              <Users className="w-4 h-4 mr-2 text-blue-500" />
                              <span>Access to verified freelancers</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Briefcase className="w-4 h-4 mr-2 text-blue-500" />
                              <span>Post unlimited projects</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 mr-2 text-blue-500" />
                              <span>Simple 3-step setup</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${
                            userRole === "customer"
                              ? "bg-blue-100 text-blue-700 border-blue-300"
                              : "bg-blue-50 text-blue-600 border-blue-200"
                          }`}
                        >
                          Quick Setup
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Provider Option */}
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`cursor-pointer transition-all duration-300 h-full ${
                        userRole === "provider"
                          ? "ring-2 ring-purple-500 bg-purple-50/50 border-purple-300"
                          : "hover:bg-purple-50/30 hover:border-purple-300 border-gray-200"
                      }`}
                      onClick={() => handleRoleSelection("provider")}
                    >
                      <CardContent className="p-8 text-center h-full flex flex-col justify-between">
                        <div>
                          <div className="mb-6">
                            <User className="w-16 h-16 mx-auto text-purple-600" />
                          </div>
                          <h3 className="text-2xl font-semibold mb-4 text-gray-900">
                            Work as Freelancer
                          </h3>
                          <p className="text-gray-600 mb-6 leading-relaxed">
                            I&apos;m a freelancer offering ICT services and want
                            to find exciting projects
                          </p>
                          <div className="space-y-3 mb-6">
                            <div className="flex items-center text-sm text-gray-600">
                              <Zap className="w-4 h-4 mr-2 text-purple-500" />
                              <span>AI-powered profile setup</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Upload className="w-4 h-4 mr-2 text-purple-500" />
                              <span>CV auto-fill with AI</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Globe className="w-4 h-4 mr-2 text-purple-500" />
                              <span>Showcase your portfolio</span>
                            </div>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`${
                            userRole === "provider"
                              ? "bg-purple-100 text-purple-700 border-purple-300"
                              : "bg-purple-50 text-purple-600 border-purple-200"
                          }`}
                        >
                          AI-Powered Setup
                        </Badge>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                <div className="mt-8 text-center">
                  <Button
                    onClick={handleContinueWithRole}
                    disabled={!userRole}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue as{" "}
                    {userRole === "customer"
                      ? "Company"
                      : userRole === "provider"
                        ? "Freelancer"
                        : "..."}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <Link
                      href="/auth/login"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Sign in here
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Choose registration method: Email vs Google (after role is selected)
  if (roleSelected && registrationMethod === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
            animate={{ rotate: 360 }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
            animate={{ rotate: -360 }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        </div>

        <motion.div
          className="w-full max-w-lg relative z-10"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <motion.div
            className="text-center mb-6"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
          >
            <Link href="/" className="inline-flex items-center space-x-2 group">
              <Image
                src="/logo.png"
                alt="TechConnex"
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl object-contain"
              />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Techconnex
              </span>
            </Link>
          </motion.div>

          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl overflow-hidden relative">
            <CardHeader className="text-center pb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRoleSelected(false)}
                className="absolute top-4 left-4 text-gray-500 hover:text-gray-700 z-10"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <CardTitle className="text-xl font-bold text-gray-900 mt-6">
                How do you want to sign up?
              </CardTitle>
              <CardDescription className="text-gray-600">
                {userRole === "provider"
                  ? "Create your freelancer account with email or use Google for a one-click sign up."
                  : "Create your company account with email or use Google for a one-click sign up."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-4">
              {error && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm p-3">
                  {error}
                </div>
              )}
              {isLoading && (
                <p className="text-center text-sm text-gray-500">
                  Signing you in...
                </p>
              )}
              <div
                id="google-register-button-container"
                className="flex justify-center min-h-[44px]"
              />
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-gray-500">
                    Or register with email
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50/50 font-medium"
                onClick={handleChooseEmailRegistration}
              >
                <Mail className="w-5 h-5 mr-2 text-gray-600" />
                Register with Email
              </Button>
              <p className="text-center text-sm text-gray-500 mt-4">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Sign in
                </Link>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Main Registration Flow (email registration only)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          animate={{ rotate: 360 }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
          animate={{ rotate: -360 }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
        />
      </div>

      <motion.div
        className="w-full max-w-4xl relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <motion.div
          className="text-center mb-8"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <Link href="/" className="inline-flex items-center space-x-2 group">
            <Image
              src="/logo.png"
              alt="TechConnex"
              width={40}
              height={40}
              className="h-10 w-10 rounded-xl object-contain"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Techconnex
            </span>
          </Link>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center mb-4">
                <Button
                  variant="ghost"
                  onClick={handleChangeRole}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Change Role
                </Button>
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {userRole === "customer"
                  ? "Company Registration"
                  : "Freelancer Registration"}
              </CardTitle>
              <CardDescription className="text-gray-600">
                {userRole === "customer"
                  ? "Create your company account to start hiring freelancers"
                  : "Complete your profile to start offering your ICT services"}
              </CardDescription>

              <div className="mt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Step {currentStep} of {getCurrentSteps().length}
                  </span>
                  <span className="text-sm text-gray-500">
                    {Math.round(getStepProgress())}% Complete
                  </span>
                </div>
                <Progress value={getStepProgress()} className="h-2" />
              </div>

              <div className="flex justify-between mt-4 text-xs">
                {getCurrentSteps().map((step) => (
                  <div
                    key={step.id}
                    className={`flex flex-col items-center ${
                      step.id <= currentStep ? "text-blue-600" : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                        step.id < currentStep
                          ? "bg-blue-600 text-white"
                          : step.id === currentStep
                            ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                            : "bg-gray-200 text-gray-400"
                      }`}
                    >
                      {step.id < currentStep ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        step.id
                      )}
                    </div>
                    <span className="hidden sm:block text-center">
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {currentStep === 2 ? (
                    <motion.div
                      variants={fadeInUp}
                      initial="initial"
                      animate="animate"
                      className="space-y-6"
                    >
                      <div className="text-center mb-6">
                        <div className="mx-auto w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                          <ShieldCheck className="w-7 h-7 text-blue-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          Verify your email
                        </h2>
                        <p className="text-gray-600 mt-1">
                          We sent a 6-digit code to
                        </p>
                        <p className="font-medium text-gray-900 flex items-center justify-center gap-2 mt-1">
                          <Mail className="w-4 h-4 text-gray-500" />
                          {formData.email}
                        </p>
                      </div>

                      {emailOtpVerified ? (
                        <div className="space-y-4">
                          <div className="rounded-xl border border-green-200 bg-green-50/80 p-6 text-center">
                            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                            <p className="text-green-800 font-medium">
                              Email verified
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              {userRole === "provider"
                                ? "Accept the terms below and create your account to go to your dashboard."
                                : "Click Next to continue your registration."}
                            </p>
                          </div>
                          {userRole === "provider" && (
                            <div className="rounded-lg border-2 border-gray-300 bg-white p-4 shadow-sm">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  id="provider-terms"
                                  checked={formData.acceptedTerms}
                                  onCheckedChange={(checked) =>
                                    handleBooleanInputChange(
                                      "acceptedTerms",
                                      checked === true,
                                    )
                                  }
                                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-gray-500 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                                />
                                <label
                                  htmlFor="provider-terms"
                                  className="cursor-pointer text-sm font-medium text-gray-800 leading-snug"
                                >
                                  I accept the{" "}
                                  <Link
                                    href="/terms"
                                    className="text-blue-600 underline hover:text-blue-700"
                                    target="_blank"
                                  >
                                    Terms of Service
                                  </Link>{" "}
                                  and{" "}
                                  <Link
                                    href="/privacy"
                                    className="text-blue-600 underline hover:text-blue-700"
                                    target="_blank"
                                  >
                                    Privacy Policy
                                  </Link>
                                  .
                                </label>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-5 max-w-sm mx-auto">
                          <div className="space-y-2">
                            <Label className="text-center block">
                              Enter verification code
                            </Label>
                            <div className="flex justify-center">
                              <InputOTP
                                maxLength={6}
                                value={otpCode}
                                onChange={(value) => setOtpCode(value)}
                                containerClassName="justify-center gap-1 sm:gap-2"
                              >
                                <InputOTPGroup className="bg-white/80 border-gray-200 rounded-lg p-2 gap-1 sm:gap-2">
                                  {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <InputOTPSlot
                                      key={i}
                                      index={i}
                                      className="h-12 w-10 sm:w-12 text-lg border-gray-300 rounded-md"
                                    />
                                  ))}
                                </InputOTPGroup>
                              </InputOTP>
                            </div>
                            {otpError && (
                              <p className="text-center text-sm text-red-600">
                                {otpError}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Button
                              type="button"
                              onClick={verifyEmailOtp}
                              disabled={otpCode.length !== 6 || isVerifyingOtp}
                              className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]"
                            >
                              {isVerifyingOtp ? "Verifying…" : "Verify code"}
                            </Button>
                            {resendCooldown > 0 ? (
                              <span className="text-sm text-gray-500">
                                Resend in {resendCooldown}s
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={sendEmailOtp}
                                disabled={isSendingOtp}
                                className="border-gray-300"
                              >
                                {isSendingOtp ? "Sending…" : "Resend code"}
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ) : userRole === "customer" ? (
                    <CustomerRegistration
                      currentStep={currentStep === 1 ? 1 : currentStep - 1}
                      formData={formData}
                      handleInputChange={handleInputChange}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      emailStatus={emailStatus}
                      fieldErrors={fieldErrors}
                      emailRef={emailRef}
                      kycFile={kycFile}
                      setKycFile={setKycFile}
                      selectedLanguages={selectedLanguages}
                      setSelectedLanguages={setSelectedLanguages}
                      socialUrls={socialUrls}
                      setSocialUrls={setSocialUrls}
                      newSocialUrl={newSocialUrl}
                      setNewSocialUrl={setNewSocialUrl}
                      handleBooleanInputChange={handleBooleanInputChange}
                    />
                  ) : (
                    <ProviderRegistration
                      currentStep={currentStep === 1 ? 1 : currentStep - 1}
                      formData={formData}
                      handleInputChange={handleInputChange}
                      showPassword={showPassword}
                      setShowPassword={setShowPassword}
                      emailStatus={emailStatus}
                      fieldErrors={fieldErrors}
                      emailRef={emailRef}
                      kycFile={kycFile}
                      setKycFile={setKycFile}
                      kycDocType={kycDocType}
                      setKycDocType={setKycDocType}
                      resumeFile={resumeFile}
                      setResumeFile={setResumeFile}
                      selectedSkills={selectedSkills}
                      setSelectedSkills={setSelectedSkills}
                      selectedLanguages={selectedLanguages}
                      setSelectedLanguages={setSelectedLanguages}
                      customSkill={customSkill}
                      setCustomSkill={setCustomSkill}
                      customLanguage={customLanguage}
                      setCustomLanguage={setCustomLanguage}
                      portfolioUrls={portfolioUrls}
                      setPortfolioUrls={setPortfolioUrls}
                      newPortfolioUrl={newPortfolioUrl}
                      setNewPortfolioUrl={setNewPortfolioUrl}
                      certifications={certifications}
                      setCertifications={setCertifications}
                      editCertification={editCertification}
                      editingIndex={editingIndex}
                      setEditCertification={setEditCertification}
                      setEditingIndex={setEditingIndex}
                      newCertification={newCertification}
                      setNewCertification={setNewCertification}
                      isProcessingCV={isProcessingCV}
                      setIsProcessingCV={setIsProcessingCV}
                      cvExtractedData={cvExtractedData}
                      setCvExtractedData={setCvExtractedData}
                      showAIResults={showAIResults}
                      setShowAIResults={setShowAIResults}
                      aiProcessingComplete={aiProcessingComplete}
                      setAiProcessingComplete={setAiProcessingComplete}
                      handleBooleanInputChange={handleBooleanInputChange}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              {error && (
                <div className="my-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}
              {success && (
                <div className="my-6 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="bg-transparent"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>

                {currentStep < getCurrentSteps().length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    disabled={
                      emailStatus === "checking" ||
                      isLoading ||
                      (currentStep === 2 && !emailOtpVerified)
                    }
                    className={`bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white
              ${
                emailStatus === "checking" ||
                (currentStep === 2 && !emailOtpVerified)
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
                  >
                    {emailStatus === "checking"
                      ? "Checking..."
                      : currentStep === 2 && !emailOtpVerified
                        ? "Verify email to continue"
                        : "Next"}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                    disabled={isLoading || !formData.acceptedTerms}
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Number.POSITIVE_INFINITY,
                          ease: "linear",
                        }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    {isLoading
                      ? "Creating Account..."
                      : userRole === "provider"
                        ? "Create account & go to dashboard"
                        : "Create account & continue"}
                  </Button>
                )}
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{" "}
                  <Link
                    href="/auth/login"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Sign in here
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
