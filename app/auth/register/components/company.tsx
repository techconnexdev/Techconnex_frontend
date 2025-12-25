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
  Phone,
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
} from "lucide-react";
import { RegistrationFormData } from "../page";
import { useState } from "react";

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
            <h2 className="text-2xl font-bold text-gray-900">Account Setup</h2>
            <p className="text-gray-600">
              Let&apos;s start with your basic information
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="companyName"
                  placeholder="Enter your company name"
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
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  ref={emailRef}
                  id="email"
                  type="email"
                  placeholder="Enter your email"
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

              {emailStatus === "checking" && (
                <p className="text-xs text-gray-500">Checking email…</p>
              )}
              {(fieldErrors.email || emailStatus === "used") && (
                <p className="text-xs text-red-600">
                  This email is already in use.
                </p>
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
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Company Profile
            </h2>
            <p className="text-gray-600">Tell us about your company</p>
          </div>

          <div className="space-y-4">
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
                    {malaysianStates.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="industry">Industry *</Label>
              <Select
                value={formData.industry}
                onValueChange={(value) => handleInputChange("industry", value)}
              >
                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="finance">Finance & Banking</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="retail">Retail & E-commerce</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="consulting">Consulting</SelectItem>
                  <SelectItem value="media">Media & Entertainment</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="nonprofit">Non-profit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companySize">
                Company Size (number of employees)
              </Label>
              <Input
                id="companySize"
                type="number"
                placeholder="e.g. 150"
                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                value={formData.companySize}
                onChange={(e) =>
                  handleInputChange("companySize", e.target.value)
                }
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Company Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  type="url"
                  placeholder="https://your-company.com"
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
              <Label>Socials URLs</Label>
              <p className="text-sm text-gray-600">
                Add links LinkedIn, Twitter, or other social media profiles
              </p>

              <div className="flex gap-2">
                <Input
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  placeholder="https://linkedin.com/yourusername"
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
                    social Links ({socialUrls.length})
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
                  <p>No portfolio links added yet</p>
                  <p className="text-sm">
                    Add links to showcase your work and professional profiles
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4 mt-8 p-4 border rounded-lg bg-white/50">
            <h3 className="text-lg font-semibold text-gray-900">
              KYC Verification (Company)
            </h3>
            <p className="text-sm text-gray-600">
              Upload your <strong>Company Registration</strong> document (PDF or
              image).
            </p>

            <div className="space-y-2">
              <Label htmlFor="kycFileCompany">
                Company Registration Paper *
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
                  Selected: <span className="font-medium">{kycFile.name}</span>
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
            <h2 className="text-2xl font-bold text-gray-900">
              Company Details
            </h2>
            <p className="text-gray-600">
              Additional information about your company
            </p>
          </div>

          <div className="space-y-6">
            {/* Company Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-1 md:col-span-2">
                <Label htmlFor="companyDescription">
                  Company Description *
                </Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    id="companyDescription"
                    placeholder="Enter your company description"
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
                <Label htmlFor="employeeCount">Employee Count</Label>
                <Input
                  id="employeeCount"
                  type="number"
                  placeholder="e.g. 150"
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.employeeCount}
                  onChange={(e) =>
                    handleInputChange("employeeCount", e.target.value)
                  }
                  min={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="establishedYear">Established Year</Label>
                <Input
                  id="establishedYear"
                  type="number"
                  placeholder="e.g. 2020"
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.establishedYear}
                  onChange={(e) =>
                    handleInputChange("establishedYear", e.target.value)
                  }
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="annualRevenue">Annual Revenue (RM)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="annualRevenue"
                    type="number"
                    placeholder="e.g. 5000000"
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
                <Label htmlFor="fundingStage">Funding Stage</Label>
                <Select
                  value={formData.fundingStage}
                  onValueChange={(value) =>
                    handleInputChange("fundingStage", value)
                  }
                >
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select funding stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {fundingStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {stage}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Hiring Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Hiring Preferences
              </h3>

              <div className="space-y-2">
                <Label>Preferred Contract Types</Label>
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
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="averageBudgetRange">
                  Average Budget Range (RM)
                </Label>
                <Input
                  id="averageBudgetRange"
                  placeholder="e.g. 10,000 - 50,000"
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                  value={formData.averageBudgetRange}
                  onChange={(e) =>
                    handleInputChange("averageBudgetRange", e.target.value)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remotePolicy">Remote Work Policy</Label>
                <Select
                  value={formData.remotePolicy}
                  onValueChange={(value) =>
                    handleInputChange("remotePolicy", value)
                  }
                >
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select remote policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {remotePolicies.map((policy) => (
                      <SelectItem key={policy} value={policy}>
                        {policy}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hiringFrequency">Hiring Frequency</Label>
                <Select
                  value={formData.hiringFrequency}
                  onValueChange={(value) =>
                    handleInputChange("hiringFrequency", value)
                  }
                >
                  <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select hiring frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {hiringFrequencies.map((frequency) => (
                      <SelectItem key={frequency} value={frequency}>
                        {frequency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Categories Hiring For */}
            <div className="space-y-4">
              <Label>Categories Hiring For</Label>
              <p className="text-sm text-gray-600">
                Select the types of roles you typically hire for
              </p>

              <div className="flex gap-2">
                <Input
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type a category and press Add"
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
                    Selected Categories ({formData.categoriesHiringFor.length})
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                    {formData.categoriesHiringFor.map((category) => (
                      <Badge
                        key={category}
                        className="bg-green-600 hover:bg-green-700 text-white pr-1"
                      >
                        {category}
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
                  Popular Categories (click to add)
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
                        {category}
                      </Badge>
                    ))}
                </div>
              </div>
            </div>

            {/* Company Culture */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Company Culture
              </h3>

              <div className="space-y-2">
                <Label htmlFor="mission">Company Mission</Label>
                <Textarea
                  id="mission"
                  placeholder="Describe your company's mission and purpose..."
                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
                  value={formData.mission}
                  onChange={(e) => handleInputChange("mission", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Company Values</Label>
                <p className="text-sm text-gray-600">
                  Select values that represent your company culture
                </p>

                <div className="flex gap-2">
                  <Input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Type a value and press Add"
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
                      Selected Values ({formData.values.length})
                    </Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                      {formData.values.map((value) => (
                        <Badge
                          key={value}
                          className="bg-purple-600 hover:bg-purple-700 text-white pr-1"
                        >
                          <Heart className="w-3 h-3 mr-1" />
                          {value}
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
                    Common Values (click to add)
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
                          {value}
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
          className="space-y-6"
        >
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Review & Submit
            </h2>
            <p className="text-gray-600">
              Please review your information before submitting
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Users className="w-5 h-5 mr-2" />
                Account Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Name:</span>
                  <span className="ml-2 font-medium">
                    {formData.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{formData.email}</span>
                </div>
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <span className="ml-2 font-medium">{formData.phone}</span>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Building className="w-5 h-5 mr-2" />
                Company Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Company:</span>
                  <span className="ml-2 font-medium">
                    {formData.companyName}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Industry:</span>
                  <span className="ml-2 font-medium">{formData.industry}</span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 font-medium">{formData.location}</span>
                </div>
                {formData.companySize && (
                  <div>
                    <span className="text-gray-600">Size:</span>
                    <span className="ml-2 font-medium">
                      {formData.companySize}
                    </span>
                  </div>
                )}
                {formData.website && (
                  <div>
                    <span className="text-gray-600">Website:</span>
                    <a
                      href={formData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-700"
                    >
                      {formData.website}
                    </a>
                  </div>
                )}
                {formData.socialLinks && (
                  <div>
                    <span className="text-gray-600">Social Links:</span>

                    {formData.socialLinks}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-white/50">
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Briefcase className="w-5 h-5 mr-2" />
                Company Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {formData.employeeCount && (
                  <div>
                    <span className="text-gray-600">Employee Count:</span>
                    <span className="ml-2 font-medium">
                      {formData.employeeCount}
                    </span>
                  </div>
                )}
                {formData.establishedYear && (
                  <div>
                    <span className="text-gray-600">Established Year:</span>
                    <span className="ml-2 font-medium">
                      {formData.establishedYear}
                    </span>
                  </div>
                )}
                {formData.annualRevenue && (
                  <div>
                    <span className="text-gray-600">Annual Revenue:</span>
                    <span className="ml-2 font-medium">
                      RM {formData.annualRevenue}
                    </span>
                  </div>
                )}
                {formData.fundingStage && (
                  <div>
                    <span className="text-gray-600">Funding Stage:</span>
                    <span className="ml-2 font-medium">
                      {formData.fundingStage}
                    </span>
                  </div>
                )}
                {formData.averageBudgetRange && (
                  <div>
                    <span className="text-gray-600">Average Budget:</span>
                    <span className="ml-2 font-medium">
                      {formData.averageBudgetRange}
                    </span>
                  </div>
                )}
                {formData.remotePolicy && (
                  <div>
                    <span className="text-gray-600">Remote Policy:</span>
                    <span className="ml-2 font-medium">
                      {formData.remotePolicy}
                    </span>
                  </div>
                )}
                {formData.hiringFrequency && (
                  <div>
                    <span className="text-gray-600">Hiring Frequency:</span>
                    <span className="ml-2 font-medium">
                      {formData.hiringFrequency}
                    </span>
                  </div>
                )}
                {formData.preferredContractTypes.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">
                      Preferred Contract Types:
                    </span>
                    <span className="ml-2 font-medium">
                      {formData.preferredContractTypes.join(", ")}
                    </span>
                  </div>
                )}
                {formData.categoriesHiringFor.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">
                      Categories Hiring For:
                    </span>
                    <span className="ml-2 font-medium">
                      {formData.categoriesHiringFor.join(", ")}
                    </span>
                  </div>
                )}
                {formData.mission && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Mission:</span>
                    <p className="ml-2 font-medium mt-1">{formData.mission}</p>
                  </div>
                )}
                {formData.values.length > 0 && (
                  <div className="md:col-span-2">
                    <span className="text-gray-600">Values:</span>
                    <span className="ml-2 font-medium">
                      {formData.values.join(", ")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-2 p-4 border rounded-lg bg-blue-50">
              <Checkbox
                id="terms"
                className="mt-1"
                checked={formData.acceptedTerms}
                onCheckedChange={(checked) =>
                  handleBooleanInputChange("acceptedTerms", checked as boolean)
                }
                required
              />
              <Label
                htmlFor="terms"
                className="text-sm text-gray-700 leading-relaxed"
              >
                I agree to the{" "}
                <Link
                  href="/terms"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-blue-600 hover:text-blue-700"
                >
                  Privacy Policy
                </Link>
                . I understand that my information will be used in accordance
                with Malaysian data protection laws.
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
          </div>
        </motion.div>
      );

    default:
      return null;
  }
};

export default CustomerRegistration;
