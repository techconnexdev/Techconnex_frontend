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
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useI18n } from "@/contexts/I18nProvider";
import type { MessageKey } from "@/lib/i18n/messages";
import {
  ONBOARDING_CONTRACT,
  ONBOARDING_FUNDING,
  ONBOARDING_HIRING_FREQ,
  ONBOARDING_REMOTE,
  ONBOARDING_STATE,
  formatOnboardingIndustry,
  profileStoredLabel,
} from "@/lib/i18n/customerOnboardingMaps";
import {
  PROFILE_CORE_VALUE,
  PROFILE_HIRE_CATEGORY,
} from "@/lib/i18n/customerProfileOptionMaps";

const ONBOARDING_MAX_COMPLETION = 60;

const STEP_META: {
  id: number;
  titleKey: MessageKey;
  icon: typeof Building;
}[] = [
  { id: 1, titleKey: "customer.onboarding.steps.profile", icon: Building },
  { id: 2, titleKey: "customer.onboarding.steps.details", icon: Briefcase },
  { id: 3, titleKey: "customer.onboarding.steps.review", icon: CheckCircle2 },
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

const INDUSTRY_VALUES = [
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
] as const;

export default function CustomerOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
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
            const rawInd = String(p.industry ?? "").trim();
            const indLower = rawInd.toLowerCase();
            setIndustry(
              (INDUSTRY_VALUES as readonly string[]).includes(indLower)
                ? indLower
                : rawInd,
            );
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
    if (!companyName?.trim())
      errs.companyName = t("customer.onboarding.error.companyName");
    const loc = locationIsOther ? location : location;
    if (!loc?.trim()) errs.location = t("customer.onboarding.error.location");
    if (!industry?.trim()) errs.industry = t("customer.onboarding.error.industry");
    setFieldErrors(errs);
    return errs;
  };

  const validateStep2 = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!description?.trim() || description.trim().length < 10)
      errs.description = t("customer.onboarding.error.description");
    if (!employeeCount?.trim())
      errs.employeeCount = t("customer.onboarding.error.employeeCount");
    if (!establishedYear?.trim())
      errs.establishedYear = t("customer.onboarding.error.establishedYear");
    if (!mission?.trim()) errs.mission = t("customer.onboarding.error.mission");
    if (!values.length) errs.values = t("customer.onboarding.error.values");
    setFieldErrors(errs);
    return errs;
  };

  const saveStep1 = async () => {
    if (!validateStep(1)) {
      validateStep1();
      setError(t("customer.onboarding.error.fillRequired"));
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
      setError(getUserFriendlyErrorMessage(e, "customer onboarding save step1"));
    } finally {
      setSaving(false);
    }
  };

  const saveStep2 = async () => {
    if (!validateStep(2)) {
      validateStep2();
      setError(t("customer.onboarding.error.fillRequired"));
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
      setError(getUserFriendlyErrorMessage(e, "customer onboarding save step2"));
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
      toast({
        title: t("customer.onboarding.toast.successTitle"),
        description: t("customer.onboarding.toast.successDesc"),
      });
      router.push("/customer/dashboard");
    } catch (err) {
      const message = getUserFriendlyErrorMessage(
        err,
        "customer onboarding submit",
      );
      setError(message);
      toast({
        title: t("customer.onboarding.toast.errorTitle"),
        description: message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / STEP_META.length) * 100;
  const currentStep = STEP_META[step - 1];
  const StepIcon = currentStep.icon;

  // While completion is loading, show spinner to avoid flashing the form then the gate
  if (completionLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
      
    );
  }

  // Profile already > 60% complete — onboarding form not needed; direct to profile to edit
  if (completion > ONBOARDING_MAX_COMPLETION) {
    return (
      
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  {t("customer.onboarding.gate.title")}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {t("customer.onboarding.gate.desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  {t("customer.onboarding.gate.body")}
                </p>
                <Button
                  onClick={() => router.push("/customer/profile/company")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {t("customer.onboarding.gate.ctaProfile")}
                </Button>
                <div className="text-center">
                  <Link href="/customer/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                    {t("customer.onboarding.backDashboard")}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      
    );
  }

  return (
    <>
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
                {t("customer.onboarding.backDashboard")}
              </Link>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  {t("customer.onboarding.title")}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {t("customer.onboarding.subtitle")}
                </CardDescription>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {t("customer.onboarding.stepProgress", {
                        current: step,
                        total: STEP_META.length,
                      })}
                    </span>
                    <span className="text-sm text-gray-500">
                      {t("customer.onboarding.percentComplete", {
                        n: Math.round(progress),
                      })}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                <div className="flex justify-between mt-4 text-xs">
                  {STEP_META.map((s) => (
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
                        {t(s.titleKey)}
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
                        {t(currentStep.titleKey)}
                      </h3>
                    </div>
                    {step === 1 && (
                      <>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="companyName">
                              {t("customer.onboarding.companyName")}
                            </Label>
                            <div className="relative">
                              <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10" />
                              <Input
                                id="companyName"
                                placeholder={t("customer.onboarding.ph.companyName")}
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
                            <Label htmlFor="location">
                              {t("customer.onboarding.location")}
                            </Label>
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
                                  <SelectValue
                                    placeholder={t("customer.onboarding.ph.state")}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {MALAYSIAN_STATES.map((s) => (
                                    <SelectItem key={s} value={s}>
                                      {profileStoredLabel(ONBOARDING_STATE, s, t)}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value={LOCATION_OTHER}>
                                    {t("customer.onboarding.location.other")}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {locationIsOther && (
                              <div className="relative mt-2">
                                <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                                <Input
                                  placeholder={t(
                                    "customer.onboarding.ph.locationOther",
                                  )}
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
                            <Label htmlFor="industry">
                              {t("customer.onboarding.industry")}
                            </Label>
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
                                <SelectValue
                                  placeholder={t("customer.onboarding.ph.industry")}
                                />
                              </SelectTrigger>
                              <SelectContent>
                                {INDUSTRY_VALUES.map((v) => (
                                  <SelectItem key={v} value={v}>
                                    {t(
                                      `customer.onboarding.industryOption.${v}` as MessageKey,
                                    )}
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
                              {t("customer.onboarding.companySize")}
                            </Label>
                            <Input
                              id="companySize"
                              type="number"
                              placeholder={t("customer.onboarding.ph.companySize")}
                              className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                              value={companySize}
                              onChange={(e) => setCompanySize(e.target.value)}
                              min={1}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="website">
                              {t("customer.onboarding.website")}
                            </Label>
                            <div className="relative">
                              <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                              <Input
                                id="website"
                                type="url"
                                placeholder={t("customer.onboarding.ph.website")}
                                className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>{t("customer.onboarding.socials")}</Label>
                            <p className="text-sm text-gray-600">
                              {t("customer.onboarding.socialsHint")}
                            </p>
                            <div className="flex gap-2">
                              <Input
                                value={newSocialUrl}
                                onChange={(e) =>
                                  setNewSocialUrl(e.target.value)
                                }
                                placeholder={t("customer.onboarding.ph.social")}
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
                                  {t("customer.onboarding.socialsCount", {
                                    n: socialLinks.length,
                                  })}
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
                                <p>{t("customer.onboarding.socialsEmpty")}</p>
                                <p className="text-sm">
                                  {t("customer.onboarding.socialsEmptyHint")}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4 mt-8 p-4 border rounded-lg bg-white/50">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {t("customer.onboarding.kyc.title")}
                          </h3>
                          {hasExistingKyc ? (
                            <div className="flex items-center gap-2 rounded-lg bg-green-50 border border-green-200 p-3">
                              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                              <p className="text-sm text-green-800 font-medium">
                                {t("customer.onboarding.kyc.uploaded")}
                              </p>
                            </div>
                          ) : (
                            <>
                              <p className="text-sm text-gray-600">
                                {t("customer.onboarding.kyc.desc")}
                              </p>
                              <div className="space-y-2">
                                <Label htmlFor="kycFileCompany">
                                  {t("customer.onboarding.kyc.fileLabel")}
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
                                    {t("customer.onboarding.kyc.selected", {
                                      name: kycFile.name,
                                    })}
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
                                {t("customer.onboarding.description")}
                              </Label>
                              <div className="relative">
                                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Textarea
                                  id="companyDescription"
                                  placeholder={t(
                                    "customer.onboarding.ph.description",
                                  )}
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
                                {t("customer.onboarding.employeeCount")}
                              </Label>
                              <Input
                                id="employeeCount"
                                type="number"
                                placeholder={t("customer.onboarding.ph.companySize")}
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
                                {t("customer.onboarding.establishedYear")}
                              </Label>
                              <Input
                                id="establishedYear"
                                type="number"
                                placeholder={t("customer.onboarding.ph.year")}
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
                                {t("customer.onboarding.annualRevenue")}
                              </Label>
                              <div className="relative">
                                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <Input
                                  id="annualRevenue"
                                  type="number"
                                  placeholder={t("customer.onboarding.ph.revenue")}
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
                                {t("customer.onboarding.fundingStage")}
                              </Label>
                              <Select
                                value={fundingStage}
                                onValueChange={setFundingStage}
                              >
                                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                  <SelectValue
                                    placeholder={t("customer.onboarding.ph.funding")}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {FUNDING_STAGES.map((f) => (
                                    <SelectItem key={f} value={f}>
                                      {profileStoredLabel(ONBOARDING_FUNDING, f, t)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {t("customer.onboarding.hiring.title")}
                            </h3>
                            <div className="space-y-2">
                              <Label>
                                {t("customer.onboarding.contractTypes")}
                              </Label>
                              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                                {CONTRACT_TYPES.map((contractType) => (
                                  <Badge
                                    key={contractType}
                                    variant={
                                      preferredContractTypes.includes(
                                        contractType,
                                      )
                                        ? "default"
                                        : "outline"
                                    }
                                    className={`cursor-pointer ${preferredContractTypes.includes(contractType) ? "bg-blue-600 text-white" : "hover:bg-blue-50 hover:border-blue-300"}`}
                                    onClick={() =>
                                      toggleArray(
                                        "preferredContractTypes",
                                        contractType,
                                      )
                                    }
                                  >
                                    {profileStoredLabel(
                                      ONBOARDING_CONTRACT,
                                      contractType,
                                      t,
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="averageBudgetRange">
                                {t("customer.onboarding.avgBudget")}
                              </Label>
                              <Input
                                id="averageBudgetRange"
                                placeholder={t("customer.onboarding.ph.budget")}
                                className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                                value={averageBudgetRange}
                                onChange={(e) =>
                                  setAverageBudgetRange(e.target.value)
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="remotePolicy">
                                {t("customer.onboarding.remotePolicy")}
                              </Label>
                              <Select
                                value={remotePolicy}
                                onValueChange={setRemotePolicy}
                              >
                                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                  <SelectValue
                                    placeholder={t("customer.onboarding.ph.remote")}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {REMOTE_POLICIES.map((r) => (
                                    <SelectItem key={r} value={r}>
                                      {profileStoredLabel(ONBOARDING_REMOTE, r, t)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="hiringFrequency">
                                {t("customer.onboarding.hiringFrequency")}
                              </Label>
                              <Select
                                value={hiringFrequency}
                                onValueChange={setHiringFrequency}
                              >
                                <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                                  <SelectValue
                                    placeholder={t(
                                      "customer.onboarding.ph.hiringFreq",
                                    )}
                                  />
                                </SelectTrigger>
                                <SelectContent>
                                  {HIRING_FREQUENCIES.map((h) => (
                                    <SelectItem key={h} value={h}>
                                      {profileStoredLabel(
                                        ONBOARDING_HIRING_FREQ,
                                        h,
                                        t,
                                      )}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <Label>{t("customer.onboarding.categories")}</Label>
                            <p className="text-sm text-gray-600">
                              {t("customer.onboarding.categoriesHint")}
                            </p>
                            <div className="flex gap-2">
                              <Input
                                value={customCategory}
                                onChange={(e) =>
                                  setCustomCategory(e.target.value)
                                }
                                placeholder={t("customer.onboarding.ph.category")}
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
                                  {t("customer.onboarding.selectedCategories", {
                                    n: categoriesHiringFor.length,
                                  })}
                                </Label>
                                <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                                  {categoriesHiringFor.map((c) => (
                                    <Badge
                                      key={c}
                                      className="bg-green-600 hover:bg-green-700 text-white pr-1"
                                    >
                                      {profileStoredLabel(
                                        PROFILE_HIRE_CATEGORY,
                                        c,
                                        t,
                                      )}
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
                                {t("customer.onboarding.popularCategories")}
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
                                    {profileStoredLabel(
                                      PROFILE_HIRE_CATEGORY,
                                      c,
                                      t,
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {t("customer.onboarding.culture.title")}
                            </h3>
                            <div className="space-y-2">
                              <Label htmlFor="mission">
                                {t("customer.onboarding.mission")}
                              </Label>
                              <Textarea
                                id="mission"
                                placeholder={t("customer.onboarding.ph.mission")}
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
                              <Label>{t("customer.onboarding.values")}</Label>
                              <p className="text-sm text-gray-600">
                                {t("customer.onboarding.valuesHint")}
                              </p>
                              <div className="flex gap-2">
                                <Input
                                  value={customValue}
                                  onChange={(e) =>
                                    setCustomValue(e.target.value)
                                  }
                                  placeholder={t("customer.onboarding.ph.value")}
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
                                    {t("customer.onboarding.selectedValues", {
                                      n: values.length,
                                    })}
                                  </Label>
                                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                                    {values.map((v) => (
                                      <Badge
                                        key={v}
                                        className="bg-purple-600 hover:bg-purple-700 text-white pr-1"
                                      >
                                        <Heart className="w-3 h-3 mr-1" />
                                        {profileStoredLabel(
                                          PROFILE_CORE_VALUE,
                                          v,
                                          t,
                                        )}
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
                                  {t("customer.onboarding.commonValues")}
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
                                      {profileStoredLabel(
                                        PROFILE_CORE_VALUE,
                                        v,
                                        t,
                                      )}
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
                              {t("customer.onboarding.review.companyInfo")}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">
                                  {t("customer.onboarding.review.companyName")}
                                </span>
                                <span className="ml-2 font-medium">
                                  {companyName ||
                                    t("customer.onboarding.review.dash")}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  {t("customer.onboarding.review.industry")}
                                </span>
                                <span className="ml-2 font-medium">
                                  {formatOnboardingIndustry(industry, t) ||
                                    t("customer.onboarding.review.dash")}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">
                                  {t("customer.onboarding.review.location")}
                                </span>
                                <span className="ml-2 font-medium">
                                  {location
                                    ? profileStoredLabel(
                                        ONBOARDING_STATE,
                                        location,
                                        t,
                                      )
                                    : t("customer.onboarding.review.dash")}
                                </span>
                              </div>
                              {companySize && (
                                <div>
                                  <span className="text-gray-600">
                                    {t("customer.onboarding.review.size")}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {companySize}
                                  </span>
                                </div>
                              )}
                              {website && (
                                <div>
                                  <span className="text-gray-600">
                                    {t("customer.onboarding.review.website")}
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
                                    {t("customer.onboarding.review.companyReg")}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {kycFile
                                      ? kycFile.name
                                      : t(
                                          "customer.onboarding.review.alreadyUploaded",
                                        )}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-4 border rounded-lg bg-white/50">
                            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                              <Briefcase className="w-5 h-5 mr-2" />
                              {t("customer.onboarding.review.companyDetails")}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              {employeeCount && (
                                <div>
                                  <span className="text-gray-600">
                                    {t(
                                      "customer.onboarding.review.employeeCount",
                                    )}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {employeeCount}
                                  </span>
                                </div>
                              )}
                              {establishedYear && (
                                <div>
                                  <span className="text-gray-600">
                                    {t(
                                      "customer.onboarding.review.establishedYear",
                                    )}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {establishedYear}
                                  </span>
                                </div>
                              )}
                              {annualRevenue && (
                                <div>
                                  <span className="text-gray-600">
                                    {t(
                                      "customer.onboarding.review.annualRevenue",
                                    )}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {t("customer.onboarding.review.rmAmount", {
                                      amount: annualRevenue,
                                    })}
                                  </span>
                                </div>
                              )}
                              {fundingStage && (
                                <div>
                                  <span className="text-gray-600">
                                    {t(
                                      "customer.onboarding.review.fundingStage",
                                    )}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {profileStoredLabel(
                                      ONBOARDING_FUNDING,
                                      fundingStage,
                                      t,
                                    )}
                                  </span>
                                </div>
                              )}
                              {averageBudgetRange && (
                                <div>
                                  <span className="text-gray-600">
                                    {t(
                                      "customer.onboarding.review.averageBudget",
                                    )}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {averageBudgetRange}
                                  </span>
                                </div>
                              )}
                              {remotePolicy && (
                                <div>
                                  <span className="text-gray-600">
                                    {t(
                                      "customer.onboarding.review.remotePolicy",
                                    )}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {profileStoredLabel(
                                      ONBOARDING_REMOTE,
                                      remotePolicy,
                                      t,
                                    )}
                                  </span>
                                </div>
                              )}
                              {hiringFrequency && (
                                <div>
                                  <span className="text-gray-600">
                                    {t(
                                      "customer.onboarding.review.hiringFrequency",
                                    )}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {profileStoredLabel(
                                      ONBOARDING_HIRING_FREQ,
                                      hiringFrequency,
                                      t,
                                    )}
                                  </span>
                                </div>
                              )}
                              {preferredContractTypes.length > 0 && (
                                <div className="md:col-span-2">
                                  <span className="text-gray-600">
                                    {t(
                                      "customer.onboarding.review.contractTypes",
                                    )}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {preferredContractTypes
                                      .map((ct) =>
                                        profileStoredLabel(
                                          ONBOARDING_CONTRACT,
                                          ct,
                                          t,
                                        ),
                                      )
                                      .join(", ")}
                                  </span>
                                </div>
                              )}
                              {categoriesHiringFor.length > 0 && (
                                <div className="md:col-span-2">
                                  <span className="text-gray-600">
                                    {t(
                                      "customer.onboarding.review.categoriesHiring",
                                    )}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {categoriesHiringFor
                                      .map((c) =>
                                        profileStoredLabel(
                                          PROFILE_HIRE_CATEGORY,
                                          c,
                                          t,
                                        ),
                                      )
                                      .join(", ")}
                                  </span>
                                </div>
                              )}
                              {mission && (
                                <div className="md:col-span-2">
                                  <span className="text-gray-600">
                                    {t("customer.onboarding.review.mission")}
                                  </span>
                                  <p className="ml-2 font-medium mt-1">
                                    {mission}
                                  </p>
                                </div>
                              )}
                              {values.length > 0 && (
                                <div className="md:col-span-2">
                                  <span className="text-gray-600">
                                    {t("customer.onboarding.review.values")}
                                  </span>
                                  <span className="ml-2 font-medium">
                                    {values
                                      .map((v) =>
                                        profileStoredLabel(
                                          PROFILE_CORE_VALUE,
                                          v,
                                          t,
                                        ),
                                      )
                                      .join(", ")}
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
                    {t("customer.onboarding.nav.previous")}
                  </Button>
                  {step < STEP_META.length ? (
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
                      {t("customer.onboarding.nav.next")}
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
                      {saving
                        ? t("customer.onboarding.nav.saving")
                        : t("customer.onboarding.nav.saveDashboard")}
                    </Button>
                  )}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    <Link
                      href="/customer/profile/company"
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {t("customer.onboarding.footer.editFull")}
                    </Link>{" "}
                    {t("customer.onboarding.footer.anytime")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </>
  );
}
