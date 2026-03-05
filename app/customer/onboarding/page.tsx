"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CustomerLayout } from "@/components/customer-layout";
import {
  Building,
  MapPin,
  Globe,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  X,
  Heart,
  Briefcase,
  CheckCircle2,
  DollarSign,
  FileCheck,
  Sparkles,
} from "lucide-react";
import {
  getCompanyProfile,
  getCompanyProfileCompletion,
  getKycDocuments,
  upsertCompanyProfile,
  uploadKyc,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const ONBOARDING_MAX_COMPLETION = 60;

const STEPS = [
  { id: 1, title: "Company Profile", icon: Building },
  { id: 2, title: "Company Details", icon: Briefcase },
  { id: 3, title: "Review & Submit", icon: CheckCircle2 },
];

const MALAYSIAN_STATES = [
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

const FUNDING_STAGES = [
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

const CONTRACT_TYPES = [
  "Fixed Price",
  "Time & Materials",
  "Monthly Retainer",
  "Hourly",
  "Milestone-based",
  "Dedicated Team",
];

const HIRING_FREQUENCIES = [
  "One-time",
  "Ongoing",
  "Project-based",
  "Seasonal",
  "As needed",
];

const REMOTE_POLICIES = [
  "Fully Remote",
  "Hybrid",
  "Office-based with remote options",
  "Fully Office-based",
];

const POPULAR_HIRING_CATEGORIES = [
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

const COMPANY_VALUES = [
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

const INDUSTRIES: { value: string; label: string }[] = [
  { value: "technology", label: "Technology" },
  { value: "finance", label: "Finance & Banking" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "retail", label: "Retail & E-commerce" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "consulting", label: "Consulting" },
  { value: "media", label: "Media & Entertainment" },
  { value: "government", label: "Government" },
  { value: "nonprofit", label: "Non-profit" },
  { value: "other", label: "Other" },
];

export default function CustomerOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [completion, setCompletion] = useState(0);
  const [completionLoading, setCompletionLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locationIsOther, setLocationIsOther] = useState(false);

  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [website, setWebsite] = useState("");
  const [socialLinks, setSocialLinks] = useState<string[]>([]);
  const [newSocialUrl, setNewSocialUrl] = useState("");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [hasExistingKyc, setHasExistingKyc] = useState(false);

  const [description, setDescription] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [establishedYear, setEstablishedYear] = useState("");
  const [annualRevenue, setAnnualRevenue] = useState("");
  const [fundingStage, setFundingStage] = useState("");
  const [preferredContractTypes, setPreferredContractTypes] = useState<
    string[]
  >([]);
  const [averageBudgetRange, setAverageBudgetRange] = useState("");
  const [remotePolicy, setRemotePolicy] = useState("");
  const [hiringFrequency, setHiringFrequency] = useState("");
  const [categoriesHiringFor, setCategoriesHiringFor] = useState<string[]>([]);
  const [customCategory, setCustomCategory] = useState("");
  const [mission, setMission] = useState("");
  const [values, setValues] = useState<string[]>([]);
  const [customValue, setCustomValue] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch profile completion on mount to decide whether to show onboarding or gate
  useEffect(() => {
    let cancelled = false;
    const fetchCompletion = async () => {
      try {
        const res = await getCompanyProfileCompletion();
        if (cancelled) return;
        const data = res?.data ?? res;
        const value = typeof (data as { completion?: number })?.completion === "number"
          ? (data as { completion: number }).completion
          : 0;
        setCompletion(value);
      } catch {
        if (!cancelled) setCompletion(0);
      } finally {
        if (!cancelled) setCompletionLoading(false);
      }
    };
    fetchCompletion();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        // Load company profile (may 404 if no profile yet)
        try {
          const res = await getCompanyProfile();
          const raw = res?.data ?? res;
          if (raw && typeof raw === "object") {
            const R = raw as Record<string, unknown>;
            const p: Record<string, unknown> =
              R.customerProfile != null && typeof R.customerProfile === "object"
                ? (R.customerProfile as Record<string, unknown>)
                : R;

            setCompanyName((R.name as string) || "");
            setLocation((p.location as string) || "");
            setLocationIsOther(
              !!(p.location as string) &&
                !MALAYSIAN_STATES.includes((p.location as string) || ""),
            );
            setIndustry((p.industry as string) || "");
            setCompanySize(String(p.companySize ?? ""));
            setWebsite((p.website as string) || "");
            setSocialLinks(
              Array.isArray(p.socialLinks) ? (p.socialLinks as string[]) : [],
            );
            setDescription((p.description as string) || "");
            setEmployeeCount(
              p.employeeCount != null ? String(p.employeeCount) : "",
            );
            setEstablishedYear(
              p.establishedYear != null ? String(p.establishedYear) : "",
            );
            setAnnualRevenue(
              p.annualRevenue != null ? String(p.annualRevenue) : "",
            );
            setFundingStage((p.fundingStage as string) || "");
            setPreferredContractTypes(
              Array.isArray(p.preferredContractTypes)
                ? (p.preferredContractTypes as string[])
                : [],
            );
            setAverageBudgetRange((p.averageBudgetRange as string) || "");
            setRemotePolicy((p.remotePolicy as string) || "");
            setHiringFrequency((p.hiringFrequency as string) || "");
            setCategoriesHiringFor(
              Array.isArray(p.categoriesHiringFor)
                ? (p.categoriesHiringFor as string[])
                : [],
            );
            setMission((p.mission as string) || "");
            setValues(Array.isArray(p.values) ? (p.values as string[]) : []);

            // From profile response if present
            const profileKyc = Array.isArray(R.kycDocuments)
              ? R.kycDocuments
              : [];
            if (
              profileKyc.some(
                (d: { type?: string }) => d?.type === "COMPANY_REG",
              )
            ) {
              setHasExistingKyc(true);
            }
          }
        } catch {
          // No company profile yet; continue
        }

        // Always fetch KYC documents so we know if COMPANY_REG exists (even without profile)
        try {
          const kycRes = await getKycDocuments();
          const data = kycRes?.data ?? kycRes;
          const docs = Array.isArray(data?.documents) ? data.documents : [];
          const hasCompanyReg = docs.some(
            (d: { type?: string }) => d?.type === "COMPANY_REG",
          );
          if (hasCompanyReg) setHasExistingKyc(true);
        } catch {
          // Ignore KYC fetch errors
        }
      } catch {
        // New user may have no profile yet; continue with empty form
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    setError("");
    setFieldErrors({});
  }, [step]);

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 1: {
        if (!companyName?.trim()) return false;
        const loc = locationIsOther ? location : location;
        if (!loc?.trim()) return false;
        if (!industry?.trim()) return false;
        return true;
      }
      case 2: {
        if (!description?.trim() || description.trim().length < 10)
          return false;
        if (!employeeCount?.trim()) return false;
        if (!establishedYear?.trim()) return false;
        if (!mission?.trim()) return false;
        if (!values.length) return false;
        return true;
      }
      default:
        return true;
    }
  };

  const validateStep1 = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!companyName?.trim()) errs.companyName = "Company name is required.";
    const loc = locationIsOther ? location : location;
    if (!loc?.trim()) errs.location = "Location (State) is required.";
    if (!industry?.trim()) errs.industry = "Industry is required.";
    setFieldErrors(errs);
    return errs;
  };

  const validateStep2 = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!description?.trim() || description.trim().length < 10)
      errs.description = "Description must be at least 10 characters.";
    if (!employeeCount?.trim())
      errs.employeeCount = "Employee count is required.";
    if (!establishedYear?.trim())
      errs.establishedYear = "Established year is required.";
    if (!mission?.trim()) errs.mission = "Company mission is required.";
    if (!values.length) errs.values = "Select at least one company value.";
    setFieldErrors(errs);
    return errs;
  };

  const saveStep1 = async () => {
    if (!validateStep(1)) {
      validateStep1();
      setError("Please fill in all required fields before proceeding.");
      return;
    }
    setError("");
    setSaving(true);
    setFieldErrors({});
    try {
      await upsertCompanyProfile({
        name: companyName?.trim() || undefined,
        location: location?.trim() || undefined,
        industry: industry || undefined,
        companySize: companySize || undefined,
        website: website || undefined,
        socialLinks: socialLinks.length ? socialLinks : undefined,
      });
      setStep(2);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const saveStep2 = async () => {
    if (!validateStep(2)) {
      validateStep2();
      setError("Please fill in all required fields before proceeding.");
      return;
    }
    setError("");
    setSaving(true);
    setFieldErrors({});
    try {
      await upsertCompanyProfile({
        description: description || undefined,
        employeeCount: employeeCount ? parseInt(employeeCount, 10) : undefined,
        establishedYear: establishedYear
          ? parseInt(establishedYear, 10)
          : undefined,
        annualRevenue: annualRevenue ? parseFloat(annualRevenue) : undefined,
        fundingStage: fundingStage || undefined,
        preferredContractTypes,
        averageBudgetRange: averageBudgetRange || undefined,
        remotePolicy: remotePolicy || undefined,
        hiringFrequency: hiringFrequency || undefined,
        categoriesHiringFor,
        mission: mission || undefined,
        values,
      });
      setStep(3);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocialUrl = () => {
    const trimmed = newSocialUrl.trim();
    if (trimmed && !socialLinks.includes(trimmed)) {
      setSocialLinks((prev) => [...prev, trimmed]);
      setNewSocialUrl("");
    }
  };

  const handleRemoveSocialUrl = (url: string) => {
    setSocialLinks((prev) => prev.filter((u) => u !== url));
  };

  const toggleArray = (
    key: "preferredContractTypes" | "categoriesHiringFor" | "values",
    value: string,
  ) => {
    if (key === "preferredContractTypes") {
      setPreferredContractTypes((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value],
      );
    } else if (key === "categoriesHiringFor") {
      setCategoriesHiringFor((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value],
      );
    } else {
      setValues((prev) =>
        prev.includes(value)
          ? prev.filter((v) => v !== value)
          : [...prev, value],
      );
    }
  };

  const handleAddCustomCategory = () => {
    if (
      customCategory.trim() &&
      !categoriesHiringFor.includes(customCategory.trim())
    ) {
      setCategoriesHiringFor((prev) => [...prev, customCategory.trim()]);
      setCustomCategory("");
    }
  };

  const handleAddCustomValue = () => {
    if (customValue.trim() && !values.includes(customValue.trim())) {
      setValues((prev) => [...prev, customValue.trim()]);
      setCustomValue("");
    }
  };

  const prevStep = () => {
    setStep((s) => Math.max(1, s - 1));
    setError("");
  };

  const buildProfilePayload = (): Record<string, unknown> => {
    return {
      name: companyName?.trim() || undefined,
      location: location?.trim() || undefined,
      industry: industry || undefined,
      companySize: companySize || undefined,
      website: website || undefined,
      socialLinks: socialLinks.length ? socialLinks : undefined,
      description: description || undefined,
      employeeCount: employeeCount ? parseInt(employeeCount, 10) : undefined,
      establishedYear: establishedYear
        ? parseInt(establishedYear, 10)
        : undefined,
      annualRevenue: annualRevenue ? parseFloat(annualRevenue) : undefined,
      fundingStage: fundingStage || undefined,
      preferredContractTypes,
      averageBudgetRange: averageBudgetRange || undefined,
      remotePolicy: remotePolicy || undefined,
      hiringFrequency: hiringFrequency || undefined,
      categoriesHiringFor,
      mission: mission || undefined,
      values,
    };
  };

  const handleSubmit = async () => {
    setError("");
    if (!validateStep1() || !validateStep2()) {
      setStep(1);
      return;
    }
    setSaving(true);
    try {
      const payload = buildProfilePayload();
      await upsertCompanyProfile(payload);
      if (kycFile) {
        await uploadKyc([kycFile], "COMPANY_REG");
      }
      toast({ title: "Success", description: "Company profile saved." });
      router.push("/customer/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
      toast({
        title: "Error",
        description: "Could not save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / STEPS.length) * 100;
  const currentStep = STEPS[step - 1];
  const StepIcon = currentStep.icon;

  // While completion is loading, show spinner to avoid flashing the form then the gate
  if (completionLoading) {
    return (
      <CustomerLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
      </CustomerLayout>
    );
  }

  // Profile already > 60% complete — onboarding form not needed; direct to profile to edit
  if (completion > ONBOARDING_MAX_COMPLETION) {
    return (
      <CustomerLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  Onboarding no longer available
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Your profile is almost ready. This onboarding flow is for new users with minimal profile data.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Go to your profile page to modify or add missing fields.
                </p>
                <Button
                  onClick={() => router.push("/customer/profile/company")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Go to profile page
                </Button>
                <div className="text-center">
                  <Link href="/customer/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                    Back to dashboard
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
          <div className="fixed inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"
              animate={{ rotate: -360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
            />
          </div>

          <motion.div
            className="w-full max-w-4xl relative z-10"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="text-center mb-6">
              <Link
                href="/customer/dashboard"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to dashboard
              </Link>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  Complete your company profile
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Add your company details so providers can find you — about
                  5–10 minutes
                </CardDescription>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Step {step} of {STEPS.length}
                    </span>
                    <span className="text-sm text-gray-500">
                      {Math.round(progress)}% Complete
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex justify-between mt-4 text-xs">
                  {STEPS.map((s) => (
                    <div
                      key={s.id}
                      className={`flex flex-col items-center ${step >= s.id ? "text-blue-600" : "text-gray-400"}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${
                          step > s.id
                            ? "bg-blue-600 text-white"
                            : step === s.id
                              ? "bg-blue-100 text-blue-600 border-2 border-blue-600"
                              : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {step > s.id ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : (
                          s.id
                        )}
                      </div>
                      <span className="hidden sm:block text-center max-w-[72px] leading-tight">
                        {s.title}
                      </span>
                    </div>
                  ))}
                </div>
              </CardHeader>

              <CardContent>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <StepIcon className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">
                        {currentStep.title}
                      </h3>
                    </div>
                    {step === 1 && (
                      <>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name *</Label>
                            <div className="relative">
                              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                              <Input
                                id="companyName"
                                placeholder="e.g. Acme Solutions Sdn Bhd"
                                className={`pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.companyName ? "border-red-500" : ""}`}
                                value={companyName}
                                onChange={(e) => {
                                  setCompanyName(e.target.value);
                                  setFieldErrors((p) => ({
                                    ...p,
                                    companyName: "",
                                  }));
                                  setError("");
                                }}
                              />
                            </div>
                            {fieldErrors.companyName && (
                              <p className="text-xs text-red-600 mt-1">
                                {fieldErrors.companyName}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="location">Location (State) *</Label>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                              <Select
                                value={
                                  locationIsOther
                                    ? LOCATION_OTHER
                                    : MALAYSIAN_STATES.includes(location)
                                      ? location
                                      : ""
                                }
                                onValueChange={(v) => {
                                  if (v === LOCATION_OTHER) {
                                    setLocationIsOther(true);
                                    setLocation("");
                                  } else {
                                    setLocationIsOther(false);
                                    setLocation(v);
                                  }
                                  setFieldErrors((p) => ({
                                    ...p,
                                    location: "",
                                  }));
                                  setError("");
                                }}
                              >
                                <SelectTrigger
                                  className={`pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.location ? "border-red-500" : ""}`}
                                >
                                  <SelectValue placeholder="Select your state" />
                                </SelectTrigger>
                                <SelectContent>
                                  {MALAYSIAN_STATES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {s}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value={LOCATION_OTHER}>
                                    {LOCATION_OTHER}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {locationIsOther && (
                              <div className="relative mt-2">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                <Input
                                  placeholder="Specify your location (e.g. city or country)"
                                  className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                  value={location}
                                  onChange={(e) => {
                                    setLocation(e.target.value);
                                    setFieldErrors((p) => ({
                                      ...p,
                                      location: "",
                                    }));
                                    setError("");
                                  }}
                                />
                              </div>
                            )}
                            {fieldErrors.location && (
                              <p className="text-xs text-red-600 mt-1">
                                {fieldErrors.location}
                              </p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="industry">Industry *</Label>
                            <Select
                              value={industry}
                              onValueChange={(v) => {
                                setIndustry(v);
                                setFieldErrors((p) => ({ ...p, industry: "" }));
                                setError("");
                              }}
                            >
                              <SelectTrigger
                                className={`bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.industry ? "border-red-500" : ""}`}
                              >
                                <SelectValue placeholder="Select your industry" />
                              </SelectTrigger>
                              <SelectContent>
                                {INDUSTRIES.map((i) => (
                                  <SelectItem key={i.value} value={i.value}>
                                    {i.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {fieldErrors.industry && (
                              <p className="text-xs text-red-600 mt-1">
                                {fieldErrors.industry}
                              </p>
                            )}
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
                              value={companySize}
                              onChange={(e) => setCompanySize(e.target.value)}
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
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>Socials URLs</Label>
                            <p className="text-sm text-gray-600">
                              Add links LinkedIn, Twitter, or other social media
                              profiles
                            </p>
                            <div className="flex gap-2">
                              <Input
                                value={newSocialUrl}
                                onChange={(e) =>
                                  setNewSocialUrl(e.target.value)
                                }
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
                            {socialLinks.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Social Links ({socialLinks.length})
                                </Label>
                                <div className="space-y-2">
                                  {socialLinks.map((url) => (
                                    <div
                                      key={url}
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
                                        onClick={() =>
                                          handleRemoveSocialUrl(url)
                                        }
                                        className="ml-2 text-red-500 hover:text-red-700"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {socialLinks.length === 0 && (
                              <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                                <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>No links added yet</p>
                                <p className="text-sm">
                                  Add links to your professional profiles
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 mt-8 p-4 border rounded-lg bg-white/50">
                          <h3 className="text-lg font-semibold text-gray-900">
                            KYC Verification (Company) — optional
                          </h3>
                          {hasExistingKyc ? (
                            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
                              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                              <p className="text-sm text-green-800 font-medium">
                                Company registration document already uploaded.
                                No need to re-upload.
                              </p>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-gray-600">
                                Upload your{" "}
                                <strong>Company Registration</strong> document
                                (PDF or image).
                              </p>
                              <div className="space-y-2">
                                <Label htmlFor="kycFileCompany">
                                  Company Registration Paper (optional)
                                </Label>
                                <Input
                                  id="kycFileCompany"
                                  type="file"
                                  accept=".jpg,.jpeg,.png,.pdf"
                                  onChange={(e) => {
                                    setKycFile(e.target.files?.[0] ?? null);
                                    setFieldErrors((p) => ({ ...p, kyc: "" }));
                                    setError("");
                                  }}
                                  className={`bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.kyc ? "border-red-500" : ""}`}
                                />
                                {kycFile && (
                                  <p className="text-xs text-green-700">
                                    Selected:{" "}
                                    <span className="font-medium">
                                      {kycFile.name}
                                    </span>
                                  </p>
                                )}
                                {fieldErrors.kyc && (
                                  <p className="text-xs text-red-600 mt-1">
                                    {fieldErrors.kyc}
                                  </p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    )}

                    {step === 2 && (
                      <>
                        <div className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-1 md:col-span-2">
                              <Label htmlFor="companyDescription">
                                Company Description *
                              </Label>
                              <div className="relative">
                                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Textarea
                                  id="companyDescription"
                                  placeholder="Enter your company description"
                                  className={`pl-10 pt-3 pb-3 bg-white/50 border w-full rounded-md text-sm resize-none focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.description ? "border-red-500" : "border-gray-200"}`}
                                  value={description}
                                  onChange={(e) => {
                                    setDescription(e.target.value);
                                    setFieldErrors((p) => ({
                                      ...p,
                                      description: "",
                                    }));
                                    setError("");
                                  }}
                                  rows={4}
                                />
                              </div>
                              {fieldErrors.description && (
                                <p className="text-xs text-red-600 mt-1">
                                  {fieldErrors.description}
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="employeeCount">
                                Employee Count *
                              </Label>
                              <Input
                                id="employeeCount"
                                type="number"
                                placeholder="e.g. 150"
                                className={`bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.employeeCount ? "border-red-500" : ""}`}
                                value={employeeCount}
                                onChange={(e) => {
                                  setEmployeeCount(e.target.value);
                                  setFieldErrors((p) => ({
                                    ...p,
                                    employeeCount: "",
                                  }));
                                  setError("");
                                }}
                                min={1}
                              />
                              {fieldErrors.employeeCount && (
                                <p className="text-xs text-red-600 mt-1">
                                  {fieldErrors.employeeCount}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="establishedYear">
                                Established Year *
                              </Label>
                              <Input
                                id="establishedYear"
                                type="number"
                                placeholder="e.g. 2020"
                                className={`bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.establishedYear ? "border-red-500" : ""}`}
                                value={establishedYear}
                                onChange={(e) => {
                                  setEstablishedYear(e.target.value);
                                  setFieldErrors((p) => ({
                                    ...p,
                                    establishedYear: "",
                                  }));
                                  setError("");
                                }}
                                min={1900}
                                max={new Date().getFullYear()}
                              />
                              {fieldErrors.establishedYear && (
                                <p className="text-xs text-red-600 mt-1">
                                  {fieldErrors.establishedYear}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="annualRevenue">
                                Annual Revenue (RM)
                              </Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="annualRevenue"
                                  type="number"
                                  placeholder="e.g. 5000000"
                                  className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                  value={annualRevenue}
                                  onChange={(e) =>
                                    setAnnualRevenue(e.target.value)
                                  }
                                  min={0}
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="fundingStage">
                                Funding Stage
                              </Label>
                              <Select
                                value={fundingStage}
                                onValueChange={setFundingStage}
                              >
                                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                  <SelectValue placeholder="Select funding stage" />
                                </SelectTrigger>
                                <SelectContent>
                                  {FUNDING_STAGES.map((f) => (
                                    <SelectItem key={f} value={f}>
                                      {f}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Hiring Preferences
                            </h3>
                            <div className="space-y-2">
                              <Label>Preferred Contract Types</Label>
                              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                                {CONTRACT_TYPES.map((t) => (
                                  <Badge
                                    key={t}
                                    variant={
                                      preferredContractTypes.includes(t)
                                        ? "default"
                                        : "outline"
                                    }
                                    className={`cursor-pointer ${preferredContractTypes.includes(t) ? "bg-blue-600 text-white" : "hover:bg-blue-50 hover:border-blue-300"}`}
                                    onClick={() =>
                                      toggleArray("preferredContractTypes", t)
                                    }
                                  >
                                    {t}
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
                                value={averageBudgetRange}
                                onChange={(e) =>
                                  setAverageBudgetRange(e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="remotePolicy">
                                Remote Work Policy
                              </Label>
                              <Select
                                value={remotePolicy}
                                onValueChange={setRemotePolicy}
                              >
                                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                  <SelectValue placeholder="Select remote policy" />
                                </SelectTrigger>
                                <SelectContent>
                                  {REMOTE_POLICIES.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {r}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="hiringFrequency">
                                Hiring Frequency
                              </Label>
                              <Select
                                value={hiringFrequency}
                                onValueChange={setHiringFrequency}
                              >
                                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                  <SelectValue placeholder="Select hiring frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                  {HIRING_FREQUENCIES.map((h) => (
                                    <SelectItem key={h} value={h}>
                                      {h}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>Categories Hiring For</Label>
                            <p className="text-sm text-gray-600">
                              Select the types of roles you typically hire for
                            </p>
                            <div className="flex gap-2">
                              <Input
                                value={customCategory}
                                onChange={(e) =>
                                  setCustomCategory(e.target.value)
                                }
                                placeholder="Type a category and press Add"
                                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  (e.preventDefault(),
                                  handleAddCustomCategory())
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
                            {categoriesHiringFor.length > 0 && (
                              <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                  Selected Categories (
                                  {categoriesHiringFor.length})
                                </Label>
                                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                                  {categoriesHiringFor.map((c) => (
                                    <Badge
                                      key={c}
                                      className="bg-green-600 hover:bg-green-700 text-white pr-1"
                                    >
                                      {c}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          toggleArray("categoriesHiringFor", c)
                                        }
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
                                {POPULAR_HIRING_CATEGORIES.filter(
                                  (c) => !categoriesHiringFor.includes(c),
                                ).map((c) => (
                                  <Badge
                                    key={c}
                                    variant="outline"
                                    className="cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                                    onClick={() =>
                                      toggleArray("categoriesHiringFor", c)
                                    }
                                  >
                                    {c}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Company Culture
                            </h3>
                            <div className="space-y-2">
                              <Label htmlFor="mission">Company Mission *</Label>
                              <Textarea
                                id="mission"
                                placeholder="Describe your company's mission and purpose..."
                                className={`bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[100px] ${fieldErrors.mission ? "border-red-500" : ""}`}
                                value={mission}
                                onChange={(e) => {
                                  setMission(e.target.value);
                                  setFieldErrors((p) => ({
                                    ...p,
                                    mission: "",
                                  }));
                                  setError("");
                                }}
                              />
                              {fieldErrors.mission && (
                                <p className="text-xs text-red-600 mt-1">
                                  {fieldErrors.mission}
                                </p>
                              )}
                            </div>
                            <div className="space-y-2">
                              <Label>Company Values *</Label>
                              <p className="text-sm text-gray-600">
                                Select at least one value that represents your
                                company culture
                              </p>
                              <div className="flex gap-2">
                                <Input
                                  value={customValue}
                                  onChange={(e) =>
                                    setCustomValue(e.target.value)
                                  }
                                  placeholder="Type a value and press Add"
                                  className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                  onKeyDown={(e) =>
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
                              {values.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Selected Values ({values.length})
                                  </Label>
                                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                                    {values.map((v) => (
                                      <Badge
                                        key={v}
                                        className="bg-purple-600 hover:bg-purple-700 text-white pr-1"
                                      >
                                        <Heart className="w-3 h-3 mr-1" />
                                        {v}
                                        <button
                                          type="button"
                                          onClick={() =>
                                            toggleArray("values", v)
                                          }
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
                                  {COMPANY_VALUES.filter(
                                    (v) => !values.includes(v),
                                  ).map((v) => (
                                    <Badge
                                      key={v}
                                      variant="outline"
                                      className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                                      onClick={() => toggleArray("values", v)}
                                    >
                                      <Heart className="w-3 h-3 mr-1" />
                                      {v}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                              {fieldErrors.values && (
                                <p className="text-xs text-red-600 mt-1">
                                  {fieldErrors.values}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {step === 3 && (
                      <>
                        <div className="space-y-6">
                          <div className="p-4 border rounded-lg bg-white/50">
                            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                              <Building className="w-5 h-5 mr-2" />
                              Company Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">
                                  Company Name:
                                </span>
                                <span className="ml-2 font-medium">
                                  {companyName || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Industry:</span>
                                <span className="ml-2 font-medium">
                                  {industry || "—"}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Location:</span>
                                <span className="ml-2 font-medium">
                                  {location || "—"}
                                </span>
                              </div>
                              {companySize && (
                                <div>
                                  <span className="text-gray-600">Size:</span>
                                  <span className="ml-2 font-medium">
                                    {companySize}
                                  </span>
                                </div>
                              )}
                              {website && (
                                <div>
                                  <span className="text-gray-600">
                                    Website:
                                  </span>
                                  <a
                                    href={website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-blue-600 hover:text-blue-700"
                                  >
                                    {website}
                                  </a>
                                </div>
                              )}
                              {(kycFile || hasExistingKyc) && (
                                <div>
                                  <span className="text-gray-600">
                                    Company registration:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {kycFile
                                      ? kycFile.name
                                      : "Already uploaded"}
                                  </span>
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
                              {employeeCount && (
                                <div>
                                  <span className="text-gray-600">
                                    Employee Count:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {employeeCount}
                                  </span>
                                </div>
                              )}
                              {establishedYear && (
                                <div>
                                  <span className="text-gray-600">
                                    Established Year:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {establishedYear}
                                  </span>
                                </div>
                              )}
                              {annualRevenue && (
                                <div>
                                  <span className="text-gray-600">
                                    Annual Revenue:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    RM {annualRevenue}
                                  </span>
                                </div>
                              )}
                              {fundingStage && (
                                <div>
                                  <span className="text-gray-600">
                                    Funding Stage:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {fundingStage}
                                  </span>
                                </div>
                              )}
                              {averageBudgetRange && (
                                <div>
                                  <span className="text-gray-600">
                                    Average Budget:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {averageBudgetRange}
                                  </span>
                                </div>
                              )}
                              {remotePolicy && (
                                <div>
                                  <span className="text-gray-600">
                                    Remote Policy:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {remotePolicy}
                                  </span>
                                </div>
                              )}
                              {hiringFrequency && (
                                <div>
                                  <span className="text-gray-600">
                                    Hiring Frequency:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {hiringFrequency}
                                  </span>
                                </div>
                              )}
                              {preferredContractTypes.length > 0 && (
                                <div className="md:col-span-2">
                                  <span className="text-gray-600">
                                    Preferred Contract Types:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {preferredContractTypes.join(", ")}
                                  </span>
                                </div>
                              )}
                              {categoriesHiringFor.length > 0 && (
                                <div className="md:col-span-2">
                                  <span className="text-gray-600">
                                    Categories Hiring For:
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {categoriesHiringFor.join(", ")}
                                  </span>
                                </div>
                              )}
                              {mission && (
                                <div className="md:col-span-2">
                                  <span className="text-gray-600">
                                    Mission:
                                  </span>
                                  <p className="ml-2 font-medium mt-1">
                                    {mission}
                                  </p>
                                </div>
                              )}
                              {values.length > 0 && (
                                <div className="md:col-span-2">
                                  <span className="text-gray-600">Values:</span>
                                  <span className="ml-2 font-medium">
                                    {values.join(", ")}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>

                {error && (
                  <div className="my-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      prevStep();
                    }}
                    disabled={step === 1}
                    className="bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  {step < STEPS.length ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (step === 1) saveStep1();
                        else if (step === 2) saveStep2();
                      }}
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      {saving ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                      ) : null}
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                    >
                      {saving ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                      )}
                      {saving ? "Saving…" : "Save & go to dashboard"}
                    </Button>
                  )}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    <Link
                      href="/customer/profile/company"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Edit full profile
                    </Link>{" "}
                    anytime
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </CustomerLayout>
  );
}
