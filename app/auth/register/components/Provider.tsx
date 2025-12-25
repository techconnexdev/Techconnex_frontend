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
  Phone,
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
} from "lucide-react";
import { RegistrationFormData, Certification } from "../page";
import { Checkbox, CheckboxIndicator } from "@radix-ui/react-checkbox";

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
      alert("Invalid file type: Only PDF files are allowed for resumes.");
      if (e.target) {
        e.target.value = ""; // Reset input
      }
      return;
    }

    // Validate file size (50MB max for documents)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      alert(`File size exceeds limit. Maximum size is ${(maxSize / (1024 * 1024)).toFixed(0)} MB`);
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
          throw new Error("Network error: Unable to connect to upload service. Please check your internet connection and try again.");
        }
        if (errorMessage.includes("size") || errorMessage.includes("limit")) {
          throw new Error(`File size error: ${errorMessage}`);
        }
        if (errorMessage.includes("type") || errorMessage.includes("format")) {
          throw new Error(`File type error: ${errorMessage}`);
        }
        throw new Error(`Upload failed: ${errorMessage || "Unknown error occurred during file upload"}`);
      }

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload resume to R2");
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
          throw new Error("Network error: Unable to connect to server. Please check your internet connection and try again.");
        }
        throw new Error(`Server connection failed: ${errorMessage || "Unknown error"}`);
      }

      if (!res.ok) {
        let errorMessage = "Resume analysis failed";
        try {
          const errorText = await res.text();
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch {
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }

        if (res.status === 400) {
          throw new Error(`Validation error: ${errorMessage}`);
        } else if (res.status === 401 || res.status === 403) {
          throw new Error(`Authorization error: ${errorMessage}`);
        } else if (res.status >= 500) {
          throw new Error(`Server error: ${errorMessage}. Please try again later.`);
        }
        throw new Error(errorMessage);
      }

      let result;
      try {
        result = await res.json();
      } catch {
        throw new Error("Server response error: Invalid response from server. Please try again.");
      }

      setCvExtractedData(result.data as Record<string, unknown>);
      setShowAIResults(true);
      setAiProcessingComplete(true);
    } catch (err: unknown) {
      console.error("Resume upload failed:", err);
      const errorMessage = err instanceof Error ? err.message : "Resume analysis failed. Please try again.";
      alert(errorMessage);
      // Reset file on error
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
            <h2 className="text-2xl font-bold text-gray-900">Account Setup</h2>
            <p className="text-gray-600">
              Let&apos;s start with your basic information
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="Enter your full name"
                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <p className="text-xs text-gray-500">
                We&apos;ll use this email <strong>now</strong> when you click{" "}
                <em>Next</em> to check availability.
              </p>

              {emailStatus === "checking" && (
                <p className="text-xs text-gray-500">Checking email…</p>
              )}
              {fieldErrors.email && (
                <p className="text-xs text-red-600">{fieldErrors.email}</p>
              )}
              {emailStatus === "available" &&
                !fieldErrors.email &&
                formData.email && (
                  <p className="text-xs text-green-600">Email is available.</p>
                )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+60 12-345 6789"
                  className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
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
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
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
                    Use at least 8 characters with uppercase, lowercase, number,
                    and symbol.
                  </p>
                )}
              {formData.confirmPassword &&
                formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-600">
                    Passwords do not match.
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
            <Label htmlFor="resume">Resume (PDF only) *</Label>
            <p className="text-sm text-gray-600 mb-4">
              Upload your CV to get AI-powered assistance filling out your
              profile
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
                      AI is analyzing your resume...
                    </p>
                    <p className="text-sm text-gray-500">
                      This will help fill your profile automatically
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
                          Click to change file
                        </p>
                        {aiProcessingComplete && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-center justify-center">
                              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                              <span className="text-green-700 font-medium">
                                Resume uploaded & AI processed!
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="text-lg font-medium text-gray-600 mb-2">
                          Upload your resume
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                          PDF files only, max 5MB
                        </p>
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                          <div className="flex items-center justify-center">
                            <Zap className="w-5 h-5 text-blue-600 mr-2" />
                            <span className="text-blue-700 font-medium text-sm">
                              AI will auto-fill your profile from your CV!
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
                    AI Extracted Information
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Bio / Summary */}
                  {bio && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">
                        Professional Summary:
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
                        Skills Found ({skills.length}):
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
                        Languages ({languages.length}):
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
                          Experience:
                        </Label>
                        <p className="text-sm text-blue-700">
                          {yearsExp}
                        </p>
                      </div>
                    )}
                    {hourlyRate && (
                      <div>
                        <Label className="text-sm font-medium text-blue-800">
                          Suggested Rate:
                        </Label>
                        <p className="text-sm text-blue-700">
                          RM {hourlyRate}/hour
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {location && (
                    <div>
                      <Label className="text-sm font-medium text-blue-800">
                        Location:
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
                        Portfolio Links:
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
                        Official Website:
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
                        Certifications:
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
                                    Serial:{" "}
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
                                      View Certificate
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
                  Apply This Information
                </Button>
                <Button
                  onClick={() => setShowAIResults(false)}
                  variant="outline"
                  className="bg-white/50"
                >
                  Skip & Fill Manually
                </Button>
              </div>

              <p className="text-xs text-blue-600 mt-3">
                💡 You can review and edit all information in the next steps
              </p>
            </motion.div>
            );
          })()}

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Profile & CV Upload
            </h2>
            <p className="text-gray-600">
              Tell clients about yourself and upload your resume for AI
              assistance
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="major">Major/Title *</Label>
              <Input
                id="major"
                placeholder="e.g., Full Stack Developer, UI/UX Designer, Data Scientist..."
                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={formData.major}
                onChange={(e) => handleInputChange("major", e.target.value)}
                required
              />
              <p className="text-xs text-gray-500">
                Your professional title or major specialization
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Professional Bio *</Label>
              <Textarea
                id="bio"
                placeholder="Tell clients about your experience, expertise, and what makes you unique..."
                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[120px]"
                maxLength={500}
                value={formData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
              />
              <p className="text-xs text-gray-500">
                {formData.bio.length}/500 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (State) *</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Select
                  value={formData.location}
                  onValueChange={(value) =>
                    handleInputChange("location", value)
                  }
                >
                  <SelectTrigger className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select your state" />
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
              <Label htmlFor="website">Website/Portfolio URL</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  type="url"
                  placeholder="https://your-website.com"
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
              KYC Verification (Provider)
            </h3>
            <p className="text-sm text-gray-600">
              Upload a valid <strong>Passport</strong> or <strong>IC</strong>{" "}
              image for verification.
            </p>

            <div className="space-y-2">
              <Label htmlFor="kycDocType">Document Type *</Label>
              <Select
                value={kycDocType}
                onValueChange={(v) => setKycDocType(v as "PASSPORT" | "IC")}
              >
                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select KYC document type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSPORT">Passport</SelectItem>
                  <SelectItem value="IC">IC</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Accepted types: JPG, PNG, or PDF (max ~10MB)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kycFile">KYC Document *</Label>
              <Input
                id="kycFile"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => setKycFile(e.target.files?.[0] ?? null)}
                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
              {kycFile && (
                <p className="text-xs text-green-700">
                  Selected: <span className="font-medium">{kycFile.name}</span>
                </p>
              )}
            </div>

            {kycDocType === "" && (
              <p className="text-xs text-amber-600">
                Please choose <strong>Passport</strong> or <strong>IC</strong>.
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
              Skills & Experience
            </h2>
            <p className="text-gray-600">Showcase your technical expertise</p>
          </div>

          <div className="space-y-6">
            {/* Skills Section */}
            <div className="space-y-4">
              <Label>Technical Skills *</Label>

              <div className="flex gap-2">
                <Input
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Type a skill and press Add"
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
                    Selected Skills ({selectedSkills.length})
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
                  Popular Skills (click to add)
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
              <Label>Languages *</Label>

              <div className="flex gap-2">
                <Input
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  placeholder="Type a language and press Add"
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
                    Selected Languages ({selectedLanguages.length})
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
                  Common Languages (click to add)
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
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={50}
                  placeholder="e.g. 4"
                  value={formData.yearsExperience}
                  onChange={(e) =>
                    handleInputChange("yearsExperience", e.target.value)
                  }
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hourlyRate">Hourly Rate (RM)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  placeholder="e.g., 50"
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
              Portfolio & Links
            </h2>
            <p className="text-gray-600">
              Showcase your work and professional profiles
            </p>
          </div>

          <div className="space-y-6">
            {/* Portfolio URLs */}
            <div className="space-y-4">
              <Label>Portfolio URLs</Label>
              <p className="text-sm text-gray-600">
                Add links to your GitHub, LinkedIn, or other professional
                profiles
              </p>

              <div className="flex gap-2">
                <Input
                  value={newPortfolioUrl}
                  onChange={(e) => setNewPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/yourusername"
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
                    Portfolio Links ({portfolioUrls.length})
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
                  <p>No portfolio links added yet</p>
                  <p className="text-sm">
                    Add links to showcase your work and professional profiles
                  </p>
                </div>
              )}
            </div>

            {/* Popular Portfolio Platforms */}
            <div className="space-y-4">
              <Label className="text-sm font-medium">Popular Platforms</Label>
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
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Certifications</h2>
            <p className="text-gray-600">
              Add your professional certifications (optional but recommended)
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">
                    Why add certifications?
                  </p>
                  <p className="text-sm text-blue-700">
                    Certifications help build trust with clients and showcase
                    your expertise in specific technologies.
                  </p>
                </div>
              </div>
            </div>

            {/* Add New Certification */}
            <div className="space-y-4 p-4 border rounded-lg bg-white/50">
              <h3 className="font-medium text-gray-900">Add Certification</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="certName">Certification Name</Label>
                  <Input
                    id="certName"
                    placeholder="e.g., AWS Certified Solutions Architect"
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
                  <Label htmlFor="certIssuer">Issuing Organization</Label>
                  <Input
                    id="certIssuer"
                    placeholder="e.g., Amazon Web Services"
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
                  <Label htmlFor="certDate">Issue Date</Label>
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
                      Serial Number (optional*)
                    </Label>
                    <Input
                      id="certSerial"
                      placeholder="e.g. ABC-123-XYZ"
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
                      Verification Link (optional*)
                    </Label>
                    <Input
                      id="certLink"
                      type="url"
                      placeholder="https://verify.issuer.com/cert/ABC-123"
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
                      *At least one of Serial Number or Verification Link is
                      required.
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
                    Add Certification
                  </Button>
                </div>
              </div>
            </div>

            {/* Certifications List */}
            {certifications.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">
                  Your Certifications ({certifications.length})
                </h3>
                <div className="space-y-3">
                  {certifications.map((cert, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg bg-white/50"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <Award className="w-5 h-5 text-blue-600 mr-2" />
                            <h4 className="font-medium text-gray-900">
                              {cert.name}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">
                            <Building2 className="w-4 h-4 inline mr-1" />
                            {cert.issuer}
                          </p>
                          <p className="text-sm text-gray-600">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            {new Date(cert.issuedDate).toLocaleDateString()}
                          </p>
                          {cert.serialNumber && (
                            <p className="text-sm text-gray-500 mt-1">
                              <span className="font-medium">Serial No:</span>{" "}
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
                              Verify Certificate ↗
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
                <p>No certifications added yet</p>
                <p className="text-sm">
                  Add your professional certifications to stand out to clients
                </p>
              </div>
            )}
          </div>
          {editCertification && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <h3 className="text-lg font-semibold mb-4">
                  Edit Certification
                </h3>

                <div className="space-y-3">
                  <Input
                    placeholder="Certification Name"
                    value={editCertification.name}
                    onChange={(e) =>
                      setEditCertification((prev) => prev ? ({
                        ...prev,
                        name: e.target.value,
                      }) : null)
                    }
                  />
                  <Input
                    placeholder="Issuer"
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
                    placeholder="Serial Number"
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
                    placeholder="Verification Link"
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
                    Cancel
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={handleSaveEditedCertification}
                  >
                    Save Changes
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
          className="space-y-6"
        >
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
            Review & Submit
          </h2>

          <p className="text-gray-600 text-center">
            Please review your profile details carefully before submission.
          </p>

          <div className="bg-white/50 p-6 rounded-lg border space-y-4 text-gray-800">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                Personal Information
              </h3>
              <p>
                <strong>Full Name:</strong> {formData.name}
              </p>
              <p>
                <strong>Email:</strong> {formData.email}
              </p>
              <p>
                <strong>Phone:</strong> {formData.phone}
              </p>
              <p>
                <strong>Location:</strong> {formData.location}
              </p>
              <p>
                <strong>Major/Title:</strong> {formData.major || "Not provided"}
              </p>
              <p>
                <strong>Bio:</strong> {formData.bio}
              </p>
            </div>

            {/* Professional Details */}
            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                Professional Details
              </h3>
              <p>
                <strong>Years of Experience:</strong> {formData.yearsExperience}
              </p>
              <p>
                <strong>Hourly Rate:</strong> RM {formData.hourlyRate}
              </p>
              <p>
                <strong>Skills:</strong>{" "}
                {selectedSkills.length > 0
                  ? selectedSkills.join(", ")
                  : "Not provided"}
              </p>
              <p>
                <strong>Languages:</strong>{" "}
                {selectedLanguages.length > 0
                  ? selectedLanguages.join(", ")
                  : "Not provided"}
              </p>
            </div>

            {/* Portfolio Section */}
            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                Portfolio Links
              </h3>
              {portfolioUrls.length > 0 ? (
                <ul className="list-disc list-inside text-gray-700">
                  {portfolioUrls.map((url, idx) => (
                    <li key={idx}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>None added</p>
              )}
            </div>

            {/* Resume / KYC Section */}
            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                Documents
              </h3>
              <p>
                <strong>Resume:</strong>{" "}
                {resumeFile ? resumeFile.name : "Not uploaded"}
              </p>
              <p>
                <strong>KYC Document:</strong>{" "}
                {kycDocType
                  ? `${kycDocType} (${kycFile ? kycFile.name : "Not uploaded"})`
                  : "Not provided"}
              </p>
            </div>

            {/* Certifications Section */}
            <div>
              <h3 className="text-lg font-semibold text-blue-700 mb-2">
                Certifications
              </h3>
              {certifications.length > 0 ? (
                <ul className="space-y-3">
                  {certifications.map((cert, idx) => (
                    <li
                      key={idx}
                      className="p-3 border rounded-lg bg-white/70 shadow-sm"
                    >
                      <p>
                        <strong>Name:</strong> {cert.name}
                      </p>
                      <p>
                        <strong>Issuer:</strong> {cert.issuer}
                      </p>
                      <p>
                        <strong>Issued Date:</strong>{" "}
                        {new Date(cert.issuedDate).toLocaleDateString()}
                      </p>
                      {cert.serialNumber && (
                        <p>
                          <strong>Serial Number:</strong> {cert.serialNumber}
                        </p>
                      )}
                      {cert.sourceUrl && (
                        <p>
                          <strong>Verification Link:</strong>{" "}
                          <a
                            href={cert.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {cert.sourceUrl}
                          </a>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No certifications added</p>
              )}
            </div>

            {/* AI CV Extraction Results (if available) */}
            {showAIResults && aiProcessingComplete && cvExtractedData && (
              <div>
                <h3 className="text-lg font-semibold text-blue-700 mb-2">
                  AI CV Extracted Insights
                </h3>
                <pre className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-700 whitespace-pre-wrap">
                  {JSON.stringify(cvExtractedData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="flex items-start space-x-2 p-4 border rounded-lg bg-blue-50">
            <Checkbox
              id="terms"
              className="w-5 h-5 border rounded bg-white focus:ring-blue-500"
              checked={formData.acceptedTerms}
              onCheckedChange={(checked) =>
                handleBooleanInputChange("acceptedTerms", checked as boolean)
              }
              required
            >
              <CheckboxIndicator className="flex items-center justify-center">
                <Check className="w-4 h-4 text-blue-600" />
              </CheckboxIndicator>
            </Checkbox>
            <Label
              htmlFor="terms"
              className="text-sm text-gray-700 leading-relaxed"
            >
              I agree to the{" "}
              <Link href="/terms" className="text-blue-600 hover:text-blue-700">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy"
                className="text-blue-600 hover:text-blue-700"
              >
                Privacy Policy
              </Link>
              . I understand that my information will be used in accordance with
              Malaysian data protection laws.
            </Label>
          </div>
          {!formData.acceptedTerms && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">
                You must accept the Terms of Service and Privacy Policy to
                continue.
              </p>
            </div>
          )}
        </motion.div>
      );

    default:
      return <div>Provider step {currentStep} content</div>;
  }
};

export default ProviderRegistration;
