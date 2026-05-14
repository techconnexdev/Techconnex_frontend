"use client";

import type React from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  MapPin,
  Globe,
  Building,
  Users,
  Briefcase,
  DollarSign,
  Heart,
  Link,
  X,
  Plus,
  Check,
} from "lucide-react";
import { RegistrationFormData } from "../page";
import { useState } from "react";
import { PhoneInputField } from "./PhoneInputField";
import { useI18n } from "@/contexts/I18nProvider";
import { CheckboxIndicator } from "@radix-ui/react-checkbox";
import {
  AUTH_COMPANY_REGISTER_INDUSTRY,
  profileStoredLabel,
  PROFILE_CONTRACT,
  PROFILE_CORE_VALUE,
  PROFILE_FUNDING,
  PROFILE_HIRE_CATEGORY,
  PROFILE_HIRING_FREQ,
  PROFILE_REMOTE,
} from "@/lib/i18n/customerProfileOptionMaps";

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

const LOCATION_OTHER = "Others";

const fundingStages = [
  "Pre-seed",
  "Seed",
  "Series A",
  "Series B",
  "Series C",
  "Series D+",
  "Bootstrapped",
  "Public",
  "Private Equity",
  "Non-profit",
];

const contractTypes = [
  "Fixed Price",
  "Time & Materials",
  "Monthly Retainer",
  "Hourly",
  "Milestone-based",
  "Dedicated Team",
];

const hiringFrequencies = [
  "One-time",
  "Ongoing",
  "Project-based",
  "Seasonal",
  "As needed",
];

const remotePolicies = [
  "Fully Remote",
  "Hybrid",
  "Office-based with remote options",
  "Fully Office-based",
];

const popularHiringCategories = [
  "Web Development",
  "Mobile Development",
  "UI/UX Design",
  "DevOps",
  "Data Science",
  "AI/ML",
  "Cloud Computing",
  "Cybersecurity",
  "Blockchain",
  "IoT",
  "Software Architecture",
  "Quality Assurance",
  "Project Management",
  "Product Management",
  "Technical Writing",
];

const companyValues = [
  "Innovation",
  "Quality",
  "Customer Focus",
  "Teamwork",
  "Integrity",
  "Transparency",
  "Sustainability",
  "Diversity & Inclusion",
  "Agility",
  "Excellence",
  "Collaboration",
  "Accountability",
  "Growth Mindset",
  "Work-Life Balance",
  "Social Responsibility",
];

interface CustomerRegistrationProps {
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
  selectedLanguages: string[];
  setSelectedLanguages: React.Dispatch<React.SetStateAction<string[]>>;
  socialUrls: string[];
  setSocialUrls: React.Dispatch<React.SetStateAction<string[]>>;
  newSocialUrl: string;
  setNewSocialUrl: React.Dispatch<React.SetStateAction<string>>;
  handleBooleanInputChange: (
    key: keyof RegistrationFormData,
    value: boolean
  ) => void;
}

const CustomerRegistration: React.FC<CustomerRegistrationProps> = ({
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
  socialUrls,
  setSocialUrls,
  newSocialUrl,
  setNewSocialUrl,
  handleBooleanInputChange,
}) => {
  const { t } = useI18n();
  const [locationIsOther, setLocationIsOther] = useState(
    !!formData.location && !malaysianStates.includes(formData.location)
  );

  const isStrongPassword = (pwd: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|;:'",.<>/?`~]).{8,}$/.test(
      pwd
    );

  // Handler for array fields (preferredContractTypes, categoriesHiringFor, values)
  const handleArrayToggle = (
    key: "preferredContractTypes" | "categoriesHiringFor" | "values",
    value: string
  ) => {
    const currentArray = formData[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];

    // Type assertion needed due to handleInputChange signature mismatch (expects string but field is string[])
    handleInputChange(key, newArray as unknown as string);
  };

  // Handler for adding custom values
  const [customCategory, setCustomCategory] = useState("");
  const [customValue, setCustomValue] = useState("");

  const handleAddCustomCategory = () => {
    if (
      customCategory.trim() &&
      !formData.categoriesHiringFor.includes(customCategory.trim())
    ) {
      const newCategories = [
        ...formData.categoriesHiringFor,
        customCategory.trim(),
      ];
      // Type assertion needed due to handleInputChange signature mismatch (expects string but field is string[])
      handleInputChange("categoriesHiringFor", newCategories as unknown as string);
      setCustomCategory("");
    }
  };

  const handleAddCustomValue = () => {
    if (customValue.trim() && !formData.values.includes(customValue.trim())) {
      const newValues = [...formData.values, customValue.trim()];
      // Type assertion needed due to handleInputChange signature mismatch (expects string but field is string[])
      handleInputChange("values", newValues as unknown as string);
      setCustomValue("");
    }
  };

  const handleRemoveCategory = (category: string) => {
    const newCategories = formData.categoriesHiringFor.filter(
      (item) => item !== category
    );
    // Type assertion needed due to handleInputChange signature mismatch (expects string but field is string[])
    handleInputChange("categoriesHiringFor", newCategories as unknown as string);
  };

  const handleRemoveValue = (value: string) => {
    const newValues = formData.values.filter((item) => item !== value);
    // Type assertion needed due to handleInputChange signature mismatch (expects string but field is string[])
    handleInputChange("values", newValues as unknown as string);
  };

  const handleAddSocialUrl = () => {
    const trimmedUrl = newSocialUrl.trim();
    if (trimmedUrl && !formData.socialLinks.includes(trimmedUrl)) {
      setSocialUrls((prev) => [...prev, trimmedUrl]);
      // Type assertion needed due to handleInputChange signature mismatch (expects string but field is string[])
      handleInputChange("socialLinks", [
        ...formData.socialLinks,
        trimmedUrl,
      ] as unknown as string);
      setNewSocialUrl("");
    }
  };

  const handleRemoveSocialUrl = (urlToRemove: string) => {
    const newLinks = formData.socialLinks.filter((url) => url !== urlToRemove);
    setSocialUrls(newLinks);
    // Type assertion needed due to handleInputChange signature mismatch (expects string but field is string[])
    handleInputChange("socialLinks", newLinks as unknown as string);
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
            <h2 className="text-lg font-semibold text-gray-900">{t("auth.account.title")}</h2>
            <p className="text-sm text-gray-600">
              {t("auth.account.subtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">{t("auth.fields.companyNameLabel")}</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="companyName"
                  placeholder={t("auth.fields.companyPlaceholder")}
                  className={`pl-10 bg-white/50 ${"border-gray-200 focus:border-blue-500 focus:ring-blue-500"}`}
                  value={formData.companyName}
                  onChange={(e) =>
                    handleInputChange("companyName", e.target.value)
                  }
                  required
                />
              </div>
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
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  aria-invalid={Boolean(
                    fieldErrors.email || emailStatus === "used"
                  )}
                  className={`pl-10 bg-white/50 ${
                    fieldErrors.email || emailStatus === "used"
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  }`}
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
              {(fieldErrors.email || emailStatus === "used") && (
                <p className="text-xs text-red-600">
                  {fieldErrors.email || t("auth.register.error.emailInUse")}
                </p>
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

            <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4">
              <div className="flex items-start gap-4">
                <Checkbox
                  id="terms-step1"
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
                  htmlFor="terms-step1"
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
                  {t("auth.register.agreeTermsCookies")}{" "}
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
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("auth.companyRegister.profileTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("auth.companyRegister.aboutTitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">
                {t("auth.companyRegister.locationStateLabel")}
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                <Select
                  value={
                    locationIsOther
                      ? LOCATION_OTHER
                      : malaysianStates.includes(formData.location)
                        ? formData.location
                        : ""
                  }
                  onValueChange={(value) => {
                    if (value === LOCATION_OTHER) {
                      setLocationIsOther(true);
                      handleInputChange("location", "");
                    } else {
                      setLocationIsOther(false);
                      handleInputChange("location", value);
                    }
                  }}
                >
                  <SelectTrigger className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    {locationIsOther && formData.location ? (
                      <span className="text-left truncate">
                        {formData.location}
                      </span>
                    ) : (
                      <SelectValue
                        placeholder={t(
                          "auth.companyRegister.selectStatePlaceholder",
                        )}
                      />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {malaysianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                    <SelectItem value={LOCATION_OTHER}>
                      {t("auth.companyRegister.othersLocation")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {locationIsOther && (
                <div className="relative mt-2">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="location-other"
                    type="text"
                    placeholder={t(
                      "auth.companyRegister.locationOtherPlaceholder",
                    )}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">
                {t("auth.companyRegister.industryLabel")}
              </Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => handleInputChange("industry", value)}
              >
                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue
                    placeholder={t(
                      "auth.companyRegister.selectIndustryPlaceholder",
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(
                    [
                      "technology",
                      "finance",
                      "healthcare",
                      "education",
                      "retail",
                      "manufacturing",
                      "consulting",
                      "media",
                      "government",
                      "nonprofit",
                      "other",
                    ] as const
                  ).map((value) => (
                    <SelectItem key={value} value={value}>
                      {t(AUTH_COMPANY_REGISTER_INDUSTRY[value])}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">
                {t("auth.companyRegister.companySizeLabel")}
              </Label>
              <Input
                id="companySize"
                type="number"
                placeholder={t("auth.companyRegister.companySizePlaceholder")}
                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={formData.companySize}
                onChange={(e) =>
                  handleInputChange("companySize", e.target.value)
                }
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                {t("auth.companyRegister.websiteLabel")}
              </Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  type="url"
                  placeholder={t("auth.companyRegister.websitePlaceholder")}
                  className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                />
              </div>
            </div>

            {/* <div className="space-y-2">
              <Label htmlFor="socialLinks">Social Media Links</Label>
              <div className="relative">
                <Link className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="socialLinks"
                  type="url"
                  placeholder="https://linkedin.com/company/your-company"
                  className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.socialLinks}
                  onChange={(e) =>
                    handleInputChange("socialLinks", e.target.value)
                  }
                />
              </div>
              <p className="text-xs text-gray-500">
                LinkedIn, Twitter, or other social media profiles
              </p>
            </div> */}
            {/* Portfolio URLs */}
            <div className="space-y-4">
              <Label>{t("auth.companyRegister.socialsUrlsLabel")}</Label>
              <p className="text-sm text-gray-600">
                {t("auth.companyRegister.socialUrlsIntro")}
              </p>

              <div className="flex gap-2">
                <Input
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  placeholder={t("auth.companyRegister.socialUrlPlaceholder")}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  type="url"
                />
                <Button
                  type="button"
                  onClick={handleAddSocialUrl}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {socialUrls.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("auth.companyRegister.socialLinksHeading", {
                      count: socialUrls.length,
                    })}
                  </Label>
                  <div className="space-y-2">
                    {socialUrls.map((url, index) => (
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
                          onClick={() => handleRemoveSocialUrl(url)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {socialUrls.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                  <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>{t("auth.companyRegister.noPortfolioLinks")}</p>
                  <p className="text-sm">
                    {t("auth.companyRegister.portfolioEmptyHint")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 mt-8 p-4 border rounded-lg bg-white/50">
            <h3 className="text-lg font-semibold text-gray-900">
              {t("auth.companyRegister.kycSectionTitle")}
            </h3>
            <p className="text-sm text-gray-600">
              {t("auth.companyRegister.kycUploadLine1")}
              <br />
              {t("auth.companyRegister.kycUploadLine2")}
            </p>

            <div className="space-y-2">
              <Label htmlFor="kycFileCompany">
                {t("auth.companyRegister.companyRegPaperLabel")}
              </Label>
              <Input
                id="kycFileCompany"
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
            <h2 className="text-lg font-semibold text-gray-900">
              {t("auth.companyRegister.companyDetailsTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("auth.companyRegister.companyDetailsSubtitle")}
            </p>
          </div>

          <div className="space-y-6">
            {/* Company Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="companyDescription">
                  {t("auth.companyRegister.companyDescriptionLabel")}
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="companyDescription"
                    placeholder={t(
                      "auth.companyRegister.descriptionPlaceholder",
                    )}
                    className="
        pl-10 pt-3 pb-3
        bg-white/50 
        border border-gray-200 
        focus:border-blue-500 focus:ring-blue-500 
        w-full rounded-md
        text-sm
        resize-none
      "
                    value={formData.companyDescription}
                    onChange={(e) =>
                      handleInputChange("companyDescription", e.target.value)
                    }
                    rows={4} // 3 lines of text
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employeeCount">
                  {t("auth.companyRegister.employeeCountLabel")}
                </Label>
                <Input
                  id="employeeCount"
                  type="number"
                  placeholder={t("auth.companyRegister.companySizePlaceholder")}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.employeeCount}
                  onChange={(e) =>
                    handleInputChange("employeeCount", e.target.value)
                  }
                  min={1}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="establishedYear">
                  {t("auth.companyRegister.establishedYearLabel")}
                </Label>
                <Input
                  id="establishedYear"
                  type="number"
                  placeholder={t("auth.companyRegister.yearPlaceholder")}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.establishedYear}
                  onChange={(e) =>
                    handleInputChange("establishedYear", e.target.value)
                  }
                  min={1900}
                  max={new Date().getFullYear()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualRevenue">
                  {t("auth.companyRegister.annualRevenueLabel")}
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="annualRevenue"
                    type="number"
                    placeholder={t("auth.companyRegister.revenuePlaceholder")}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    value={formData.annualRevenue}
                    onChange={(e) =>
                      handleInputChange("annualRevenue", e.target.value)
                    }
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fundingStage">
                  {t("auth.companyRegister.fundingStageLabel")}
                </Label>
                <Select
                  value={formData.fundingStage}
                  onValueChange={(value) =>
                    handleInputChange("fundingStage", value)
                  }
                >
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue
                      placeholder={t(
                        "auth.companyRegister.selectFundingPlaceholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {fundingStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {profileStoredLabel(PROFILE_FUNDING, stage, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hiring Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("auth.companyRegister.hiringPreferencesTitle")}
              </h3>

              <div className="space-y-2">
                <Label>
                  {t("auth.companyRegister.preferredContractTypes")}
                </Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                  {contractTypes.map((type) => (
                    <Badge
                      key={type}
                      variant={
                        formData.preferredContractTypes.includes(type)
                          ? "default"
                          : "outline"
                      }
                      className={`cursor-pointer ${
                        formData.preferredContractTypes.includes(type)
                          ? "bg-blue-600 text-white"
                          : "hover:bg-blue-50 hover:border-blue-300"
                      }`}
                      onClick={() =>
                        handleArrayToggle("preferredContractTypes", type)
                      }
                    >
                      {profileStoredLabel(PROFILE_CONTRACT, type, t)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="averageBudgetRange">
                  {t("auth.companyRegister.averageBudgetRangeLabel")}
                </Label>
                <Input
                  id="averageBudgetRange"
                  placeholder={t("auth.companyRegister.budgetRangePlaceholder")}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.averageBudgetRange}
                  onChange={(e) =>
                    handleInputChange("averageBudgetRange", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remotePolicy">
                  {t("auth.companyRegister.remotePolicyLabel")}
                </Label>
                <Select
                  value={formData.remotePolicy}
                  onValueChange={(value) =>
                    handleInputChange("remotePolicy", value)
                  }
                >
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue
                      placeholder={t(
                        "auth.companyRegister.selectRemotePlaceholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {remotePolicies.map((policy) => (
                      <SelectItem key={policy} value={policy}>
                        {profileStoredLabel(PROFILE_REMOTE, policy, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hiringFrequency">
                  {t("auth.companyRegister.hiringFrequencyLabel")}
                </Label>
                <Select
                  value={formData.hiringFrequency}
                  onValueChange={(value) =>
                    handleInputChange("hiringFrequency", value)
                  }
                >
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue
                      placeholder={t(
                        "auth.companyRegister.selectHiringPlaceholder",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {hiringFrequencies.map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>
                        {profileStoredLabel(PROFILE_HIRING_FREQ, frequency, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categories Hiring For */}
            <div className="space-y-4">
              <Label>{t("auth.companyRegister.categoriesHiringLabel")}</Label>
              <p className="text-sm text-gray-600">
                {t("auth.companyRegister.categoriesHiringHint")}
              </p>

              <div className="flex gap-2">
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder={t(
                    "auth.companyRegister.categoryTypeAddPlaceholder",
                  )}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(), handleAddCustomCategory())
                  }
                />
                <Button
                  type="button"
                  onClick={handleAddCustomCategory}
                  variant="outline"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {formData.categoriesHiringFor.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("auth.companyRegister.selectedCategoriesHeading", {
                      count: formData.categoriesHiringFor.length,
                    })}
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                    {formData.categoriesHiringFor.map((category) => (
                      <Badge
                        key={category}
                        className="bg-green-600 hover:bg-green-700 text-white pr-1"
                      >
                        {profileStoredLabel(
                          PROFILE_HIRE_CATEGORY,
                          category,
                          t,
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveCategory(category)}
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
                  {t("auth.companyRegister.popularCategoriesHint")}
                </Label>
                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                  {popularHiringCategories
                    .filter(
                      (category) =>
                        !formData.categoriesHiringFor.includes(category)
                    )
                    .map((category) => (
                      <Badge
                        key={category}
                        variant="outline"
                        className="cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                        onClick={() =>
                          handleArrayToggle("categoriesHiringFor", category)
                        }
                      >
                        {profileStoredLabel(
                          PROFILE_HIRE_CATEGORY,
                          category,
                          t,
                        )}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            {/* Company Culture */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {t("auth.companyRegister.companyCultureTitle")}
              </h3>

              <div className="space-y-2">
                <Label htmlFor="mission">
                  {t("auth.companyRegister.missionLabel")}
                </Label>
                <Textarea
                  id="mission"
                  placeholder={t("auth.companyRegister.missionPlaceholder")}
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                  value={formData.mission}
                  onChange={(e) => handleInputChange("mission", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>{t("auth.companyRegister.valuesLabel")}</Label>
                <p className="text-sm text-gray-600">
                  {t("auth.companyRegister.valuesHint")}
                </p>

                <div className="flex gap-2">
                  <Input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={t(
                      "auth.companyRegister.valueTypeAddPlaceholder",
                    )}
                    className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), handleAddCustomValue())
                    }
                  />
                  <Button
                    type="button"
                    onClick={handleAddCustomValue}
                    variant="outline"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {formData.values.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      {t("auth.companyRegister.selectedValuesHeading", {
                        count: formData.values.length,
                      })}
                    </Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                      {formData.values.map((value) => (
                        <Badge
                          key={value}
                          className="bg-purple-600 hover:bg-purple-700 text-white pr-1"
                        >
                          <Heart className="w-3 h-3 mr-1" />
                          {profileStoredLabel(PROFILE_CORE_VALUE, value, t)}
                          <button
                            type="button"
                            onClick={() => handleRemoveValue(value)}
                            className="ml-1 hover:bg-purple-800 rounded-full p-0.5"
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
                    {t("auth.companyRegister.commonValuesHint")}
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                    {companyValues
                      .filter((value) => !formData.values.includes(value))
                      .map((value) => (
                        <Badge
                          key={value}
                          variant="outline"
                          className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                          onClick={() => handleArrayToggle("values", value)}
                        >
                          <Heart className="w-3 h-3 mr-1" />
                          {profileStoredLabel(PROFILE_CORE_VALUE, value, t)}
                        </Badge>
                      ))}
                  </div>
                </div>
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
          className="space-y-5"
        >
          <div className="text-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t("auth.companyRegister.reviewTitle")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("auth.companyRegister.reviewSubtitle")}
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {t("auth.companyRegister.review.accountSection")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.companyName")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.companyName || t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.email")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.email || t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.phone")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.phone || t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <Building className="w-4 h-4 mr-2" />
                {t("auth.companyRegister.review.profileSection")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.location")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.location || t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.industry")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.industry
                      ? profileStoredLabel(
                          AUTH_COMPANY_REGISTER_INDUSTRY,
                          formData.industry,
                          t,
                        )
                      : t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.companySize")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.companySize || t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.website")}
                  </span>
                  {formData.website ? (
                    <a
                      href={formData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-700"
                    >
                      {formData.website}
                    </a>
                  ) : (
                    <span className="ml-2">
                      {t("auth.companyRegister.review.emDash")}
                    </span>
                  )}
                </div>
                {Array.isArray(formData.socialLinks) && formData.socialLinks.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">
                      {t("auth.companyRegister.review.socialLinks")}
                    </span>
                    <ul className="ml-2 mt-0.5 list-disc list-inside">
                      {formData.socialLinks.map((url, i) => (
                        <li key={i}>
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
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center">
                <Briefcase className="w-4 h-4 mr-2" />
                {t("auth.companyRegister.review.detailsSection")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="md:col-span-2">
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.description")}
                  </span>
                  <p className="ml-2 mt-0.5 font-medium">
                    {formData.companyDescription?.trim() ||
                      t("auth.companyRegister.review.emDash")}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.employeeCount")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.employeeCount || t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.establishedYear")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.establishedYear || t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.annualRevenue")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.annualRevenue
                      ? t("auth.companyRegister.review.annualRevenueRm", {
                          amount: formData.annualRevenue,
                        })
                      : t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.fundingStage")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.fundingStage
                      ? profileStoredLabel(
                          PROFILE_FUNDING,
                          formData.fundingStage,
                          t,
                        )
                      : t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.averageBudget")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.averageBudgetRange ||
                      t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.remotePolicy")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.remotePolicy
                      ? profileStoredLabel(
                          PROFILE_REMOTE,
                          formData.remotePolicy,
                          t,
                        )
                      : t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">
                    {t("auth.companyRegister.review.hiringFrequency")}
                  </span>
                  <span className="ml-2 font-medium">
                    {formData.hiringFrequency
                      ? profileStoredLabel(
                          PROFILE_HIRING_FREQ,
                          formData.hiringFrequency,
                          t,
                        )
                      : t("auth.companyRegister.review.emDash")}
                  </span>
                </div>
                {formData.preferredContractTypes?.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">
                      {t("auth.companyRegister.review.preferredContractTypes")}
                    </span>
                    <span className="ml-2 font-medium">
                      {formData.preferredContractTypes
                        .map((ct) => profileStoredLabel(PROFILE_CONTRACT, ct, t))
                        .join(", ")}
                    </span>
                  </div>
                )}
                {formData.categoriesHiringFor?.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">
                      {t("auth.companyRegister.review.categoriesHiringFor")}
                    </span>
                    <span className="ml-2 font-medium">
                      {formData.categoriesHiringFor
                        .map((c) =>
                          profileStoredLabel(PROFILE_HIRE_CATEGORY, c, t),
                        )
                        .join(", ")}
                    </span>
                  </div>
                )}
                {formData.mission?.trim() && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">
                      {t("auth.companyRegister.review.mission")}
                    </span>
                    <p className="ml-2 mt-0.5 font-medium">{formData.mission}</p>
                  </div>
                )}
                {formData.values?.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">
                      {t("auth.companyRegister.review.values")}
                    </span>
                    <span className="ml-2 font-medium">
                      {formData.values
                        .map((v) => profileStoredLabel(PROFILE_CORE_VALUE, v, t))
                        .join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

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
      return null;
  }
};

export default CustomerRegistration;
