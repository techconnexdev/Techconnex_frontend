"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Globe,
  Upload,
  X,
  Plus,
  Award,
  Building2,
  Calendar,
  Zap,
  CheckCircle,
  Check,
  AlertCircle,
  Edit,
  Link,
  User,
  FileText,
} from "lucide-react";
import { RegistrationFormData, Certification } from "../page";
import { Checkbox, CheckboxIndicator } from "@radix-ui/react-checkbox";
import { PhoneInputField } from "./PhoneInputField";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { toast } from "@/lib/toast";
import { useI18n } from "@/contexts/I18nProvider";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" },
};

const malaysianStates = [
  "Kuala Lumpur",
  "Selangor",
  "Penang",
  "Johor",
  "Perak",
  "Kedah",
  "Kelantan",
  "Terengganu",
  "Pahang",
  "Negeri Sembilan",
  "Melaka",
  "Perlis",
  "Sabah",
  "Sarawak",
];

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

interface ProviderRegistrationProps {
  currentStep: number;
  formData: RegistrationFormData;
  handleInputChange: (key: keyof RegistrationFormData, value: string) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
  emailStatus: "idle" | "checking" | "available" | "used";
  fieldErrors: { email?: string };
  emailRef: React.RefObject<HTMLInputElement>;
  kycFile: File | null;
  setKycFile: (file: File | null) => void;
  kycDocType: "" | "PASSPORT" | "IC" | "COMPANY_REGISTRATION";
  setKycDocType: (
    type: "" | "PASSPORT" | "IC" | "COMPANY_REGISTRATION"
  ) => void;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  selectedSkills: string[];
  setSelectedSkills: React.Dispatch<React.SetStateAction<string[]>>;
  selectedLanguages: string[];
  setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  customSkill: string;
  setCustomSkill: React.Dispatch<React.SetStateAction<string>>;
  customLanguage: string;
  setCustomLanguage: React.Dispatch<React.SetStateAction<string>>;
  portfolioUrls: string[];
  setPortfolioUrls: React.Dispatch<React.SetStateAction<string[]>>;
  newPortfolioUrl: string;
  setNewPortfolioUrl: React.Dispatch<React.SetStateAction<string>>;
  certifications: Certification[];
  setCertifications: React.Dispatch<React.SetStateAction<Certification[]>>;
  newCertification: Certification;
  setNewCertification: React.Dispatch<React.SetStateAction<Certification>>;
  isProcessingCV: boolean;
  setIsProcessingCV: React.Dispatch<React.SetStateAction<boolean>>;
  cvExtractedData: Record<string, unknown> | null;
  setCvExtractedData: React.Dispatch<React.SetStateAction<Record<string, unknown> | null>>;
  showAIResults: boolean;
  setShowAIResults: React.Dispatch<React.SetStateAction<boolean>>;
  aiProcessingComplete: boolean;
  setAiProcessingComplete: React.Dispatch<React.SetStateAction<boolean>>;
  handleBooleanInputChange: (
    key: keyof RegistrationFormData,
    value: boolean
  ) => void;
  // 👇 Add these two new props
  editingIndex: number | null;
  setEditingIndex: React.Dispatch<React.SetStateAction<number | null>>;
  editCertification: Certification | null;
  setEditCertification: React.Dispatch<
    React.SetStateAction<Certification | null>
  >;
}

const ProviderRegistration: React.FC<ProviderRegistrationProps> = ({
  currentStep,
  formData,
  handleInputChange,
  showPassword,
  setShowPassword,
  emailStatus,
  fieldErrors,
  emailRef,
  kycFile,
  setKycFile,
  kycDocType,
  setKycDocType,
  resumeFile,
  setResumeFile,
  selectedSkills,
  setSelectedSkills,
  selectedLanguages,
  setSelectedLanguages,
  customSkill,
  setCustomSkill,
  customLanguage,
  setCustomLanguage,
  portfolioUrls,
  setPortfolioUrls,
  newPortfolioUrl,
  setNewPortfolioUrl,
  certifications,
  setCertifications,
  newCertification,
  setNewCertification,
  isProcessingCV,
  setIsProcessingCV,
  cvExtractedData,
  setCvExtractedData,
  showAIResults,
  setShowAIResults,
  aiProcessingComplete,
  setAiProcessingComplete,
  handleBooleanInputChange,

  // 👇 Add these
  editingIndex,
  setEditingIndex,
  editCertification,
  setEditCertification,
}) => {
  const { t } = useI18n();
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

  const isStrongPassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|;:'",.<>/?`~]).{8,}$/.test(
      pwd
    );

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== "application/pdf") {
      toast.error(t("auth.providerRegister.resumePdfOnlyToast"));
      if (e.target) {
        e.target.value = ""; // Reset input
      }
      return;
    }

    // Validate file size (50MB max for documents)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      toast.error(
        t("auth.providerRegister.fileSizeExceeded", {
          mb: (maxSize / (1024 * 1024)).toFixed(0),
        }),
      );
      if (e.target) {
        e.target.value = ""; // Reset input
      }
      return;
    }

    setResumeFile(file);
    setIsProcessingCV(true);

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
        const errorMessage = uploadError instanceof Error ? uploadError.message : String(uploadError);
        if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
          throw new Error(t("auth.providerRegister.error.networkUpload"));
        }
        if (errorMessage.includes("size") || errorMessage.includes("limit")) {
          throw new Error(
            t("auth.providerRegister.error.fileSizeDetail", {
              message: errorMessage,
            }),
          );
        }
        if (errorMessage.includes("type") || errorMessage.includes("format")) {
          throw new Error(
            t("auth.providerRegister.error.fileTypeDetail", {
              message: errorMessage,
            }),
          );
        }
        throw new Error(
          t("auth.providerRegister.error.uploadFailed", {
            message:
              errorMessage ||
              t("auth.providerRegister.error.unknown"),
          }),
        );
      }

      if (!uploadResult.success) {
        throw new Error(
          uploadResult.error || t("auth.providerRegister.error.uploadR2"),
        );
      }

      // Send R2 key to backend for AI analysis
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
      
      let res;
      try {
        res = await fetch(`${API_BASE}/resume/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            key: uploadResult.key,
          }),
        });
      } catch (fetchError: unknown) {
        // Handle network errors
        const errorMessage = fetchError instanceof Error ? fetchError.message : String(fetchError);
        const errorName = fetchError instanceof Error ? fetchError.name : "";
        if (errorMessage.includes("network") || errorMessage.includes("fetch") || errorName === "TypeError") {
          throw new Error(t("auth.providerRegister.error.networkServer"));
        }
        throw new Error(
          t("auth.providerRegister.error.serverConnection", {
            message:
              errorMessage || t("auth.providerRegister.error.unknown"),
          }),
        );
      }

      if (!res.ok) {
        let errorMessage = t("auth.providerRegister.error.resumeAnalysis");
        try {
          const errorText = await res.text();
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          errorMessage = t("auth.providerRegister.error.serverStatus", {
            status: String(res.status),
            statusText: res.statusText,
          });
        }

        if (res.status === 400) {
          throw new Error(
            t("auth.providerRegister.error.validation", { message: errorMessage }),
          );
        } else if (res.status === 401 || res.status === 403) {
          throw new Error(
            t("auth.providerRegister.error.authorization", {
              message: errorMessage,
            }),
          );
        } else if (res.status >= 500) {
          throw new Error(
            t("auth.providerRegister.error.serverWithMessage", {
              message: errorMessage,
            }),
          );
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await res.json();
      } catch {
        throw new Error(t("auth.providerRegister.error.invalidServerResponse"));
      }

      setCvExtractedData(result.data as Record<string, unknown>);
      setShowAIResults(true);
      setAiProcessingComplete(true);
    } catch (err: unknown) {
      toast.error(
        getUserFriendlyErrorMessage(err, "auth register provider resume"),
      );
      setResumeFile(null);
      if (e.target) {
        e.target.value = ""; // Reset input
      }
    } finally {
      setIsProcessingCV(false);
    }
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleLanguageToggle = (language: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((l) => l !== language)
        : [...prev, language]
    );
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills((prev) => [...prev, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const handleAddCustomLanguage = () => {
    if (
      customLanguage.trim() &&
      !selectedLanguages.includes(customLanguage.trim())
    ) {
      setSelectedLanguages((prev) => [...prev, customLanguage.trim()]);
      setCustomLanguage("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleRemoveLanguage = (language: string) => {
    setSelectedLanguages((prev) => prev.filter((l) => l !== language));
  };

  const handleAddPortfolioUrl = () => {
    if (
      newPortfolioUrl.trim() &&
      !portfolioUrls.includes(newPortfolioUrl.trim())
    ) {
      setPortfolioUrls((prev) => [...prev, newPortfolioUrl.trim()]);
      setNewPortfolioUrl("");
    }
  };

  const handleRemovePortfolioUrl = (url: string) => {
    setPortfolioUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleAddCertification = () => {
    const hasSerialOrUrl =
      (newCertification.serialNumber && newCertification.serialNumber.trim()) ||
      (newCertification.sourceUrl && newCertification.sourceUrl.trim());

    if (
      newCertification.name.trim() &&
      newCertification.issuer.trim() &&
      newCertification.issuedDate &&
      hasSerialOrUrl
    ) {
      setCertifications((prev) => [...prev, { ...newCertification }]);
      setNewCertification({
        name: "",
        issuer: "",
        issuedDate: "",
        verified: false,
        serialNumber: "",
        sourceUrl: "",
      });
    }
  };

  // ✅ Remove Certification
  const handleRemoveCertification = (index: number) => {
    setCertifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleEditCertification = (index: number) => {
    setEditingIndex(index);
    setEditCertification(certifications[index]);
  };
  const handleSaveEditedCertification = () => {
    if (editingIndex === null || !editCertification) return;

    setCertifications((prev) =>
      prev.map((cert, i) => (i === editingIndex ? editCertification : cert))
    );
    setEditingIndex(null);
    setEditCertification(null);
  };

  const applyAIExtractedData = () => {
    if (!cvExtractedData) return;

    // 🔹 Basic info
    if (cvExtractedData.bio && typeof cvExtractedData.bio === "string") {
      handleInputChange("bio", cvExtractedData.bio);
    }
    if (cvExtractedData.yearsExperience && typeof cvExtractedData.yearsExperience === "string") {
      handleInputChange("yearsExperience", cvExtractedData.yearsExperience);
    }
    if (cvExtractedData.suggestedHourlyRate && typeof cvExtractedData.suggestedHourlyRate === "string") {
      handleInputChange("hourlyRate", cvExtractedData.suggestedHourlyRate);
    }

    // 🔹 Location
    if (cvExtractedData.location && typeof cvExtractedData.location === "string") {
      handleInputChange("location", cvExtractedData.location);
    }

    // 🔹 Portfolio URLs (AI returns `portfolioUrls`)
    if (
      Array.isArray(cvExtractedData.portfolioUrls) &&
      cvExtractedData.portfolioUrls.length > 0
    ) {
      setPortfolioUrls((prev) => {
        const newLinks = (cvExtractedData.portfolioUrls as string[])
          .map((url: string) => url.trim())
          .filter((url: string) => !prev.includes(url));
        return [...prev, ...newLinks];
      });
    }

    // 🔹 Official Website
    if (cvExtractedData.website && typeof cvExtractedData.website === "string") {
      handleInputChange("website", cvExtractedData.website);
    }

    // 🔹 Skills
    if (Array.isArray(cvExtractedData.skills) && cvExtractedData.skills.length > 0) {
      setSelectedSkills((prev) => {
        const newSkills = (cvExtractedData.skills as string[]).filter(
          (skill: string) => !prev.includes(skill)
        );
        return [...prev, ...newSkills];
      });
    }

    // 🔹 Languages
    if (Array.isArray(cvExtractedData.languages) && cvExtractedData.languages.length > 0) {
      setSelectedLanguages((prev) => {
        const newLanguages = (cvExtractedData.languages as string[]).filter(
          (lang: string) => !prev.includes(lang)
        );
        return [...prev, ...newLanguages];
      });
    }

    // 🔹 Certifications (with certificate link or serial)
    if (
      Array.isArray(cvExtractedData.certifications) &&
      cvExtractedData.certifications.length > 0
    ) {
      setCertifications((prev) => {
        const newCerts = (cvExtractedData.certifications as Array<Record<string, unknown>>).map((cert) => ({
          name: (cert.name as string) || "",
          issuer: (cert.issuer as string) || "",
          issuedDate: (cert.issuedDate as string) || "",
          serialNumber: (cert.serialNumber as string) || "", // ✅ NEW
          verificationLink: (cert.verificationLink as string) || "", // ✅ NEW
        }));
        return [...prev, ...newCerts];
      });
    }

    // ✅ Close the AI results modal
    setShowAIResults(false);
  };

  switch (currentStep) {
    case 1:
      return (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">{t("auth.account.title")}</h2>
            <p className="text-gray-600">
              {t("auth.account.subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("auth.fields.fullNameLabel")}</Label>
              <Input
                id="name"
                placeholder={t("auth.fields.fullNamePlaceholder")}
                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t("auth.fields.emailLabel")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder={t("auth.login.emailPlaceholder")}
                  className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <p className="text-xs text-gray-500">
                {t("auth.fields.emailHint")}
              </p>

              {emailStatus === "checking" && (
                <p className="text-xs text-gray-500">{t("auth.fields.checkingEmail")}</p>
              )}
              {fieldErrors.email && (
                <p className="text-xs text-red-600">{fieldErrors.email}</p>
              )}
              {emailStatus === "available" &&
                !fieldErrors.email &&
                formData.email && (
                  <p className="text-xs text-green-600">{t("auth.fields.emailAvailable")}</p>
                )}
            </div>

            <PhoneInputField
              id="phone"
              label={t("auth.fields.phoneLabel")}
              value={formData.phone}
              onChange={(val) => handleInputChange("phone", val)}
              placeholder={t("auth.fields.phonePlaceholder")}
              required
            />

            <div className="space-y-2">
              <Label htmlFor="password">{t("auth.fields.password")} *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.fields.passwordCreate")}
                  className="pl-10 pr-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.password}
                  onChange={(e) =>
                    handleInputChange("password", e.target.value)
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t("auth.fields.confirmPassword")} *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder={t("auth.fields.passwordConfirmPlaceholder")}
                  className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleInputChange("confirmPassword", e.target.value)
                  }
                  required
                />
              </div>

              {!isStrongPassword(formData.password) &&
                formData.password.length > 0 && (
                  <p className="text-xs text-red-600">
                    {t("auth.fields.passwordRules")}
                  </p>
                )}
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600">
                    {t("auth.fields.passwordMismatch")}
                  </p>
                )}
            </div>
          </div>
        </motion.div>
      );

    case 2:
      return (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          {/* CV Upload Section */}
          <div className="space-y-2 border-t pt-6">
            <Label htmlFor="resume">
              {t("auth.providerRegister.resumePdfLabel")}
            </Label>
            <p className="text-sm text-gray-600 mb-4">
              {t("auth.providerRegister.resumeUploadIntro")}
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white/50 hover:border-blue-400 transition-colors">
              <input
                id="resume"
                type="file"
                accept=".pdf"
                onChange={handleResumeUpload}
                className="hidden"
              />
              <label htmlFor="resume" className="cursor-pointer">
                {isProcessingCV ? (
                  <div>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 2,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "linear",
                      }}
                      className="w-10 h-10 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full"
                    />
                    <p className="text-lg font-medium text-blue-600 mb-2">
                      {t("auth.providerRegister.analyzingResume")}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t("auth.providerRegister.analyzingResumeHint")}
                    </p>
                  </div>
                ) : (
                  <>
                    <Upload className="w-10 h-10 mx-auto mb-4 text-gray-400" />
                    {resumeFile ? (
                      <div>
                        <p className="text-lg font-medium text-green-600 mb-2">
                          {resumeFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t("auth.providerRegister.clickChangeFile")}
                        </p>
                        {aiProcessingComplete && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                              <span className="text-green-700 font-medium">
                                {t("auth.providerRegister.resumeProcessedBadge")}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium text-gray-600 mb-2">
                          {t("auth.providerRegister.uploadResumeTitle")}
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          {t("auth.providerRegister.uploadResumeHintPdf")}
                        </p>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                          <div className="flex items-center justify-center">
                            <Zap className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-blue-700 font-medium text-sm">
                              {t("auth.providerRegister.aiAutoFillHint")}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </label>
            </div>
          </div>

          {/* AI Results Modal/Section */}
          {showAIResults && cvExtractedData && (() => {
            const bio = typeof cvExtractedData.bio === "string" ? cvExtractedData.bio : null;
            const skills = Array.isArray(cvExtractedData.skills) ? (cvExtractedData.skills as string[]) : null;
            const languages = Array.isArray(cvExtractedData.languages) ? (cvExtractedData.languages as string[]) : null;
            const yearsExp = typeof cvExtractedData.yearsExperience === "string" ? cvExtractedData.yearsExperience : null;
            const hourlyRate = typeof cvExtractedData.suggestedHourlyRate === "string" ? cvExtractedData.suggestedHourlyRate : null;
            const location = typeof cvExtractedData.location === "string" ? cvExtractedData.location : null;
            const portfolioUrls = Array.isArray(cvExtractedData.portfolioUrls) ? (cvExtractedData.portfolioUrls as string[]) : null;
            const officialWebsite = typeof cvExtractedData.officialWebsite === "string" ? cvExtractedData.officialWebsite : null;
            const certifications = Array.isArray(cvExtractedData.certifications) ? (cvExtractedData.certifications as Array<Record<string, unknown>>) : null;

            return (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50"
              >
                <div className="flex items-center mb-4">
                  <Zap className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-blue-900">
                    {t("auth.providerRegister.aiExtractedTitle")}
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Bio / Summary */}
                  {bio && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">
                        {t("auth.providerRegister.aiSummaryLabel")}
                      </Label>
                      <p className="text-sm text-blue-700 bg-white/50 p-3 rounded border mt-1">
                        {bio}
                      </p>
                    </div>
                  )}

                  {/* Skills */}
                  {skills && skills.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">
                        {t("auth.providerRegister.aiSkillsFound", {
                          count: skills.length,
                        })}
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {skills.map(
                          (skill: string, i: number) => (
                            <Badge key={i} className="bg-blue-600 text-white">
                              {skill}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {languages && languages.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">
                        {t("auth.providerRegister.aiLanguages", {
                          count: languages.length,
                        })}
                      </Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {languages.map(
                          (lang: string, i: number) => (
                            <Badge key={i} className="bg-green-600 text-white">
                              {lang}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Experience and Rate */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {yearsExp && (
                      <div>
                        <Label className="text-sm font-medium text-blue-800">
                          {t("auth.providerRegister.aiExperienceLabel")}
                        </Label>
                        <p className="text-sm text-blue-700">
                          {yearsExp}
                        </p>
                      </div>
                    )}
                    {hourlyRate && (
                      <div>
                        <Label className="text-sm font-medium text-blue-800">
                          {t("auth.providerRegister.aiSuggestedRate")}
                        </Label>
                        <p className="text-sm text-blue-700">
                          {t("auth.providerRegister.aiSuggestedRateValue", {
                            rate: hourlyRate,
                          })}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {location && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">
                        {t("auth.providerRegister.aiLocationLabel")}
                      </Label>
                      <p className="text-sm text-blue-700 bg-white/50 p-2 rounded border mt-1">
                        {location}
                      </p>
                    </div>
                  )}

                  {/* Portfolio URLs */}
                  {portfolioUrls && portfolioUrls.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">
                        {t("auth.providerRegister.aiPortfolioLinks")}
                      </Label>
                      <ul className="list-disc pl-5 text-sm text-blue-700 mt-1">
                        {portfolioUrls.map(
                          (url: string, i: number) => (
                            <li key={i}>
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-blue-900"
                              >
                                {url}
                              </a>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Official Website */}
                  {officialWebsite && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">
                        {t("auth.providerRegister.aiOfficialWebsite")}
                      </Label>
                      <p className="text-sm text-blue-700">
                        <a
                          href={officialWebsite}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-blue-900"
                        >
                          {officialWebsite}
                        </a>
                      </p>
                    </div>
                  )}

                  {/* Certifications */}
                  {certifications && certifications.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">
                        {t("auth.providerRegister.aiCertifications")}
                      </Label>
                      <div className="space-y-3 mt-2">
                        {certifications.map(
                          (cert, i: number) => {
                            const certName = String(cert.name || "");
                            const certIssuer = String(cert.issuer || "");
                            const certIssuedDate = cert.issuedDate ? String(cert.issuedDate) : null;
                            const certSerial = cert.serialNumber ? String(cert.serialNumber) : null;
                            const certLink = cert.certificateLink ? String(cert.certificateLink) : null;
                            return (
                              <div
                                key={i}
                                className="text-sm text-blue-700 bg-white/50 p-3 rounded border"
                              >
                                <p>
                                  <span className="font-medium">{certName}</span> —{" "}
                                  {certIssuer}
                                  {certIssuedDate && (
                                    <span className="text-blue-600">
                                      {" "}
                                      ({certIssuedDate})
                                    </span>
                                  )}
                                </p>
                                {certSerial && (
                                  <p className="text-xs mt-1 text-blue-800">
                                    {t("auth.providerRegister.aiSerialPrefix")}{" "}
                                    <span className="font-mono">
                                      {certSerial}
                                    </span>
                                  </p>
                                )}
                                {certLink && (
                                  <p className="text-xs mt-1">
                                    <a
                                      href={certLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="underline text-blue-700 hover:text-blue-900"
                                    >
                                      {t("auth.providerRegister.aiViewCertificate")}
                                    </a>
                                  </p>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={applyAIExtractedData}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("auth.providerRegister.applyAiData")}
                </Button>
                <Button
                  onClick={() => setShowAIResults(false)}
                  variant="outline"
                  className="bg-white/50"
                >
                  {t("auth.providerRegister.skipFillManually")}
                </Button>
              </div>

              <p className="text-xs text-blue-600 mt-3">
                {t("auth.providerRegister.aiFooterHint")}
              </p>
            </motion.div>
            );
          })()}

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("auth.providerRegister.profileCvSectionTitle")}
            </h2>
            <p className="text-gray-600">
              {t("auth.providerRegister.profileCvSectionSubtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="major">
                {t("auth.providerRegister.majorLabel")}
              </Label>
              <Input
                id="major"
                placeholder={t("auth.providerRegister.majorPlaceholder")}
                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={formData.major}
                onChange={(e) => handleInputChange("major", e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                {t("auth.providerRegister.majorHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">
                {t("auth.providerRegister.bioLabel")}
              </Label>
              <Textarea
                id="bio"
                placeholder={t("auth.providerRegister.bioPlaceholder")}
                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                maxLength={500}
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
              />
              <p className="text-xs text-gray-500">
                {t("auth.providerRegister.bioCharCount", {
                  count: formData.bio.length,
                })}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">
                {t("auth.providerRegister.locationStateLabel")}
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Select
                  value={formData.location}
                  onValueChange={(value) =>
                    handleInputChange("location", value)
                  }
                >
                  <SelectTrigger className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue
                      placeholder={t(
                        "auth.providerRegister.selectStatePlaceholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Always show predefined Malaysian states */}
                    {malaysianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}

                    {/* Dynamically show the AI-extracted value if it's not already included */}
                    {formData.location &&
                      !malaysianStates.includes(formData.location) && (
                        <SelectItem
                          key={formData.location}
                          value={formData.location}
                        >
                          {formData.location}
                        </SelectItem>
                      )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                {t("auth.providerRegister.websitePortfolioLabel")}
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  type="url"
                  placeholder={t("auth.providerRegister.websitePlaceholder")}
                  className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* KYC Section */}
          <div className="space-y-4 mt-8 p-4 border rounded-lg bg-white/50">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("auth.providerRegister.kycSectionProviderTitle")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("auth.providerRegister.kycUploadIntro")}
            </p>

            <div className="space-y-2">
              <Label htmlFor="kycDocType">
                {t("auth.providerRegister.kycDocTypeLabel")}
              </Label>
              <Select
                value={kycDocType}
                onValueChange={(v) => setKycDocType(v as "PASSPORT" | "IC")}
              >
                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue
                    placeholder={t(
                      "auth.providerRegister.selectKycTypePlaceholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSPORT">
                    {t("auth.providerRegister.kycTypePassport")}
                  </SelectItem>
                  <SelectItem value="IC">
                    {t("auth.providerRegister.kycTypeIc")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {t("auth.providerRegister.kycFileTypesHint")}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kycFile">
                {t("auth.providerRegister.kycFileLabel")}
              </Label>
              <Input
                id="kycFile"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setKycFile(e.target.files?.[0] ?? null)}
                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {kycFile && (
                <p className="text-xs text-green-700">
                  {t("auth.companyRegister.selectedFile")}{" "}
                  <span className="font-medium">{kycFile.name}</span>
                </p>
              )}
            </div>

            {kycDocType === "" && (
              <p className="text-xs text-amber-600">
                {t("auth.providerRegister.kycChooseTypeHint")}
              </p>
            )}
          </div>
        </motion.div>
      );

    case 3:
      return (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("auth.providerRegister.skillsStepTitle")}
            </h2>
            <p className="text-gray-600">
              {t("auth.providerRegister.skillsSectionTitle")}
            </p>
          </div>

          <div className="space-y-6">
            {/* Skills Section */}
            <div className="space-y-4">
              <Label>{t("auth.providerRegister.skillsLabel")}</Label>

              <div className="flex gap-2">
                <Input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder={t("auth.providerRegister.skillTypePlaceholder")}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddCustomSkill())
                  }
                />
                <Button
                  type="button"
                  onClick={handleAddCustomSkill}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {selectedSkills.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("auth.providerRegister.selectedSkillsHeading", {
                      count: selectedSkills.length,
                    })}
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50 max-h-32 overflow-y-auto">
                    {selectedSkills.map((skill) => (
                      <Badge
                        key={skill}
                        className="bg-blue-600 hover:bg-blue-700 text-white pr-1"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1 hover:bg-blue-800 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("auth.providerRegister.popularSkillsHint")}
                </Label>
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-white/50">
                  {popularSkills
                    .filter((skill) => !selectedSkills.includes(skill))
                    .map((skill) => (
                      <Badge
                        key={skill}
                        variant="outline"
                        className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                        onClick={() => handleSkillToggle(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            {/* Languages Section */}
            <div className="space-y-4">
              <Label>{t("auth.providerRegister.languagesLabel")}</Label>

              <div className="flex gap-2">
                <Input
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  placeholder={t(
                    "auth.providerRegister.languageTypePlaceholder",
                  )}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddCustomLanguage())
                  }
                />
                <Button
                  type="button"
                  onClick={handleAddCustomLanguage}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {selectedLanguages.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("auth.providerRegister.selectedLanguagesHeading", {
                      count: selectedLanguages.length,
                    })}
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                    {selectedLanguages.map((language) => (
                      <Badge
                        key={language}
                        className="bg-green-600 hover:bg-green-700 text-white pr-1"
                      >
                        {language}
                        <button
                          type="button"
                          onClick={() => handleRemoveLanguage(language)}
                          className="ml-1 hover:bg-green-800 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  {t("auth.providerRegister.commonLanguagesHint")}
                </Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                  {commonLanguages
                    .filter((language) => !selectedLanguages.includes(language))
                    .map((language) => (
                      <Badge
                        key={language}
                        variant="outline"
                        className="cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                        onClick={() => handleLanguageToggle(language)}
                      >
                        {language}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            {/* Experience and Rate */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="experience">
                  {t("auth.providerRegister.experienceLabel")}
                </Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={50}
                  placeholder={t("auth.providerRegister.experiencePlaceholder")}
                  value={formData.yearsExperience}
                  onChange={(e) =>
                    handleInputChange("yearsExperience", e.target.value)
                  }
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">
                  {t("auth.providerRegister.hourlyRateLabel")}
                </Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder={t("auth.providerRegister.hourlyPlaceholder")}
                  min="10"
                  max="1000"
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.hourlyRate}
                  onChange={(e) =>
                    handleInputChange("hourlyRate", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </motion.div>
      );

    case 4:
      return (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {t("auth.providerRegister.portfolioStepTitle")}
            </h2>
            <p className="text-gray-600">
              {t("auth.providerRegister.portfolioStepSubtitle")}
            </p>
          </div>

          <div className="space-y-6">
            {/* Portfolio URLs */}
            <div className="space-y-4">
              <Label>{t("auth.providerRegister.portfolioUrlsLabel")}</Label>
              <p className="text-sm text-gray-600">
                {t("auth.providerRegister.portfolioIntro")}
              </p>

              <div className="flex gap-2">
                <Input
                  value={newPortfolioUrl}
                  onChange={(e) => setNewPortfolioUrl(e.target.value)}
                  placeholder={t(
                    "auth.providerRegister.portfolioUrlPlaceholder",
                  )}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  type="url"
                />
                <Button
                  type="button"
                  onClick={handleAddPortfolioUrl}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {portfolioUrls.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("auth.providerRegister.portfolioLinksHeading", {
                      count: portfolioUrls.length,
                    })}
                  </Label>
                  <div className="space-y-2">
                    {portfolioUrls.map((url, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-white/50 border rounded-lg"
                      >
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 text-sm truncate flex-1"
                        >
                          {url}
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemovePortfolioUrl(url)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {portfolioUrls.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>{t("auth.providerRegister.noPortfolioLinks")}</p>
                  <p className="text-sm">
                    {t("auth.companyRegister.portfolioEmptyHint")}
                  </p>
                </div>
              )}
            </div>

            {/* Popular Portfolio Platforms */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">
                {t("auth.providerRegister.popularPlatforms")}
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    name: "GitHub",
                    placeholder: "https://github.com/username",
                  },
                  {
                    name: "LinkedIn",
                    placeholder: "https://linkedin.com/in/username",
                  },
                  {
                    name: "Behance",
                    placeholder: "https://behance.net/username",
                  },
                  {
                    name: "Dribbble",
                    placeholder: "https://dribbble.com/username",
                  },
                ].map((platform) => (
                  <Button
                    key={platform.name}
                    type="button"
                    variant="outline"
                    className="h-auto p-3 bg-white/50 hover:bg-blue-50 hover:border-blue-300"
                    onClick={() => setNewPortfolioUrl(platform.placeholder)}
                  >
                    <div className="text-center">
                      <Globe className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                      <span className="text-sm">{platform.name}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      );

    case 5:
      return (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="space-y-5"
        >
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("auth.providerRegister.certificationsTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("auth.providerRegister.certificationsIntro")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-blue-600 mr-2 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {t("auth.providerRegister.certificationsWhyTitle")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("auth.providerRegister.certificationsWhyBody")}
                  </p>
                </div>
              </div>
            </div>

            {/* Add New Certification */}
            <div className="space-y-4 p-4 border rounded-lg bg-white/50">
              <h3 className="text-sm font-semibold text-gray-900">
                {t("auth.providerRegister.addCertTitle")}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certName">
                    {t("auth.providerRegister.certNameLabel")}
                  </Label>
                  <Input
                    id="certName"
                    placeholder={t("auth.providerRegister.certNameExample")}
                    className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={newCertification.name}
                    onChange={(e) =>
                      setNewCertification((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certIssuer">
                    {t("auth.providerRegister.certIssuerLabel")}
                  </Label>
                  <Input
                    id="certIssuer"
                    placeholder={t("auth.providerRegister.certIssuerExample")}
                    className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={newCertification.issuer}
                    onChange={(e) =>
                      setNewCertification((prev) => ({
                        ...prev,
                        issuer: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certDate">
                    {t("auth.providerRegister.certDateLabel")}
                  </Label>
                  <Input
                    id="certDate"
                    type="date"
                    className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={newCertification.issuedDate}
                    onChange={(e) =>
                      setNewCertification((prev) => ({
                        ...prev,
                        issuedDate: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="certSerial">
                      {t("auth.providerRegister.certSerialOptionalLabel")}
                    </Label>
                    <Input
                      id="certSerial"
                      placeholder={t(
                        "auth.providerRegister.certSerialPlaceholder",
                      )}
                      className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={newCertification.serialNumber || ""}
                      onChange={(e) =>
                        setNewCertification((prev) => ({
                          ...prev,
                          serialNumber: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certLink">
                      {t("auth.providerRegister.certLinkOptionalLabel")}
                    </Label>
                    <Input
                      id="certLink"
                      type="url"
                      placeholder={t(
                        "auth.providerRegister.certVerifyUrlPlaceholder",
                      )}
                      className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={newCertification.sourceUrl || ""}
                      onChange={(e) =>
                        setNewCertification((prev) => ({
                          ...prev,
                          sourceUrl: e.target.value,
                        }))
                      }
                    />
                    <p className="text-xs text-gray-500">
                      {t("auth.providerRegister.certSerialOrLinkHint")}
                    </p>
                  </div>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    onClick={handleAddCertification}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={
                      !newCertification.name ||
                      !newCertification.issuer ||
                      !newCertification.issuedDate ||
                      !(
                        newCertification.serialNumber?.trim() ||
                        newCertification.sourceUrl?.trim()
                      )
                    }
                  >
                    <Award className="w-4 h-4 mr-2" />
                    {t("auth.providerRegister.addCertificationButton")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Certifications List */}
            {certifications.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("auth.providerRegister.yourCertifications", {
                    count: certifications.length,
                  })}
                </h3>
                <div className="space-y-2">
                  {certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg bg-white/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Award className="w-4 h-4 text-gray-500 shrink-0" />
                            <span className="text-sm font-medium text-gray-900">
                              {cert.name}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <Building2 className="w-4 h-4 inline mr-1" />
                            {cert.issuer}
                          </p>
                          <p className="text-sm text-gray-600">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {cert.issuedDate && !Number.isNaN(new Date(cert.issuedDate).getTime())
                              ? new Date(cert.issuedDate).toLocaleDateString()
                              : cert.issuedDate ||
                                t("auth.providerRegister.review.emDash")}
                          </p>
                          {cert.serialNumber && (
                            <p className="text-sm text-gray-500 mt-1">
                              <span className="font-medium">
                                {t("auth.providerRegister.certSerialLabel")}
                              </span>{" "}
                              {cert.serialNumber}
                            </p>
                          )}

                          {cert.sourceUrl && (
                            <a
                              href={cert.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline text-sm mt-1 inline-block"
                            >
                              {t("auth.providerRegister.verifyCertificateLink")}
                            </a>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditCertification(index)}
                            className="text-blue-600 hover:text-blue-800 p-1"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveCertification(index)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {certifications.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>{t("auth.providerRegister.noCertsYet")}</p>
                <p className="text-sm">
                  {t("auth.providerRegister.noCertsSubtitle")}
                </p>
              </div>
            )}
          </div>
          {editCertification && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-lg font-semibold mb-4">
                  {t("auth.providerRegister.certEditTitle")}
                </h3>

                <div className="space-y-3">
                  <Input
                    placeholder={t("auth.providerRegister.certNamePlaceholder")}
                    value={editCertification.name}
                    onChange={(e) =>
                      setEditCertification((prev) => prev ? ({
                        ...prev,
                        name: e.target.value,
                      }) : null)
                    }
                  />
                  <Input
                    placeholder={t("auth.providerRegister.issuerPlaceholder")}
                    value={editCertification.issuer}
                    onChange={(e) =>
                      setEditCertification((prev) => prev ? ({
                        ...prev,
                        issuer: e.target.value,
                      }) : null)
                    }
                  />
                  <Input
                    type="date"
                    value={editCertification.issuedDate}
                    onChange={(e) =>
                      setEditCertification((prev) => prev ? ({
                        ...prev,
                        issuedDate: e.target.value,
                      }) : null)
                    }
                  />
                  <Input
                    placeholder={t(
                      "auth.providerRegister.certSerialPlaceholder",
                    )}
                    value={editCertification.serialNumber || ""}
                    onChange={(e) =>
                      setEditCertification((prev) => prev ? ({
                        ...prev,
                        serialNumber: e.target.value,
                      }) : null)
                    }
                  />
                  <Input
                    type="url"
                    placeholder={t("auth.providerRegister.certLinkPlaceholder")}
                    value={editCertification.sourceUrl || ""}
                    onChange={(e) =>
                      setEditCertification((prev) => prev ? ({
                        ...prev,
                        sourceUrl: e.target.value,
                      }) : null)
                    }
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditCertification(null);
                      setEditingIndex(null);
                    }}
                  >
                    {t("auth.providerRegister.cancelButton")}
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSaveEditedCertification}
                  >
                    {t("auth.providerRegister.saveChangesButton")}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      );
    case 6:
      return (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="space-y-5"
        >
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("auth.providerRegister.reviewTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("auth.providerRegister.reviewSubtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2" />
                {t("auth.providerRegister.review.accountSection")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">
                    {t("auth.providerRegister.reviewFullName")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.name || t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.email")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.email || t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.phone")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.phone || t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2" />
                {t("auth.providerRegister.review.profileCvStep")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">
                    {t("auth.providerRegister.review.location")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.location || t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.providerRegister.review.major")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.major || t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
                {formData.bio?.trim() && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">
                      {t("auth.providerRegister.review.bio")}
                    </span>
                    <p className="ml-2 mt-0.5 font-medium">{formData.bio}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">
                    {t("auth.providerRegister.review.resume")}
                  </span>
                  <span className="ml-2 font-medium">
                    {resumeFile
                      ? resumeFile.name
                      : t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.providerRegister.review.kycLabel")}
                  </span>
                  <span className="ml-2 font-medium">
                    {kycDocType && kycFile
                      ? `${
                          kycDocType === "PASSPORT"
                            ? t("auth.providerRegister.kycTypePassport")
                            : kycDocType === "IC"
                              ? t("auth.providerRegister.kycTypeIc")
                              : kycDocType
                        } (${kycFile.name})`
                      : t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <Award className="w-4 h-4 mr-2" />
                {t("auth.providerRegister.review.skillsExpStep")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">
                    {t("auth.providerRegister.review.yearsExperience")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.yearsExperience ||
                      t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.providerRegister.review.hourlyRate")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.hourlyRate
                      ? t("auth.providerRegister.review.hourlyDisplay", {
                          rate: formData.hourlyRate,
                        })
                      : t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.providerRegister.review.availability")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.availability ||
                      t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.providerRegister.review.workPreference")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.workPreference ||
                      t("auth.providerRegister.review.emDash")}
                  </span>
                </div>
                {selectedSkills.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">
                      {t("auth.providerRegister.review.skills")}
                    </span>
                    <span className="ml-2 font-medium">
                      {selectedSkills.join(", ")}
                    </span>
                  </div>
                )}
                {selectedLanguages.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">
                      {t("auth.providerRegister.review.languages")}
                    </span>
                    <span className="ml-2 font-medium">
                      {selectedLanguages.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <Link className="w-4 h-4 mr-2" />
                {t("auth.providerRegister.review.portfolioStep")}
              </h3>
              <div className="text-sm">
                {portfolioUrls.length > 0 ? (
                  <ul className="list-disc list-inside mt-0.5">
                    {portfolioUrls.map((url, idx) => (
                      <li key={idx}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          {url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-600">
                    {t("auth.providerRegister.review.emDash")}
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <Award className="w-4 h-4 mr-2" />
                {t("auth.providerRegister.review.certificationsStep")}
              </h3>
              <div className="text-sm">
                {certifications.length > 0 ? (
                  <ul className="space-y-2">
                    {certifications.map((cert, idx) => (
                      <li key={idx} className="p-2 border rounded bg-gray-50/80">
                        <span className="font-medium">{cert.name}</span>
                        <span className="text-gray-600"> — {cert.issuer}</span>
                        {cert.issuedDate && (
                          <span className="text-gray-600"> ({cert.issuedDate})</span>
                        )}
                        {cert.serialNumber?.trim() && (
                          <p className="mt-0.5 text-gray-600">
                            {t("auth.providerRegister.review.serialInList")}{" "}
                            {cert.serialNumber}
                          </p>
                        )}
                        {cert.sourceUrl?.trim() && (
                          <a
                            href={cert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 text-xs"
                          >
                            {t("auth.providerRegister.review.verificationLink")}
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-600">
                    {t("auth.providerRegister.review.emDash")}
                  </span>
                )}
              </div>
            </div>

            {showAIResults && aiProcessingComplete && cvExtractedData && (
              <div className="p-4 border rounded-lg bg-white/50">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2" />
                  {t("auth.providerRegister.review.aiCvInsights")}
                </h3>
                <pre className="bg-gray-50 p-2 rounded border text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-auto">
                  {JSON.stringify(cvExtractedData, null, 2)}
                </pre>
              </div>
            )}

            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <p className="mb-3 text-sm font-medium text-gray-900">
                {t("auth.companyRegister.agreementTitle")}
              </p>
              <div className="flex items-start gap-4">
                <Checkbox
                  id="terms"
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-2 border-gray-400 bg-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
                  checked={formData.acceptedTerms}
                  onCheckedChange={(checked) =>
                    handleBooleanInputChange("acceptedTerms", checked as boolean)
                  }
                  required
                >
                  <CheckboxIndicator className="flex items-center justify-center text-white">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </CheckboxIndicator>
                </Checkbox>
                <Label
                  htmlFor="terms"
                  className="cursor-pointer text-sm leading-snug text-gray-700"
                >
                  {t("auth.agreeTo")}{" "}
                  <a
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 underline hover:text-blue-700"
                  >
                    {t("auth.register.termsLink")}
                  </a>
                  ,{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 underline hover:text-blue-700"
                  >
                    {t("auth.register.privacyLink")}
                  </a>
                  {t("auth.register.agreeTermsCookies")}
                  <a
                    href="/cookies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 underline hover:text-blue-700"
                  >
                    {t("auth.register.cookieLink")}
                  </a>
                  .
                </Label>
              </div>
            </div>
            {!formData.acceptedTerms && (
              <p className="text-sm text-red-600">
                {t("auth.companyRegister.mustAcceptTerms")}
              </p>
            )}
          </div>
        </motion.div>
      );

    default:
      return (
        <div>
          {t("auth.providerRegister.devPlaceholderStep", {
            step: String(currentStep),
          })}
        </div>
      );
  }
};

export default ProviderRegistration;
