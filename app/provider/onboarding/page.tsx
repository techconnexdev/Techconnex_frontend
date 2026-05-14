"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Target,
  Link2,
  Award,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Sparkles,
  Upload,
  FileCheck,
  Zap,
  MapPin,
  Globe,
  X,
  Building2,
  Calendar,
  Edit,
} from "lucide-react";
import {
  API_BASE,
  getProviderProfile,
  getProviderProfileCompletion,
  getMyResume,
  upsertProviderProfile,
  createCertification,
  getMyCertifications,
  uploadResume as apiUploadResume,
} from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useToast } from "@/hooks/use-toast";
import { setOnboardingCompleted } from "@/components/provider/ProviderOnboardingPromptDialog";
import { useProviderCompletion } from "@/contexts/ProviderCompletionContext";
import { useI18n } from "@/contexts/I18nProvider";
import { PREFERRED_CURRENCY_OPTIONS } from "@/lib/currency-options";
import { Switch } from "@/components/ui/switch";

const ONBOARDING_MAX_COMPLETION = 50; // Don't show form if profile is already > 50% complete

const MALAYSIAN_STATES = [
  "Kuala Lumpur", "Selangor", "Penang", "Johor", "Perak", "Kedah",
  "Kelantan", "Terengganu", "Pahang", "Negeri Sembilan", "Melaka",
  "Perlis", "Sabah", "Sarawak",
];
const OTHER_LOCATION = "Other";

const POPULAR_SKILLS = [
  "React", "Next.js", "Node.js", "Python", "Java", "PHP", "TypeScript",
  "AWS", "UI/UX Design", "Mobile Development", "DevOps", "Database",
];

const COMMON_LANGUAGES = [
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

type CertForm = { name: string; issuer: string; issuedDate: string; serialNumber?: string; sourceUrl?: string };

export default function ProviderOnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { t } = useI18n();
  const { refetch: refetchCompletion } = useProviderCompletion();
  const STEPS = useMemo(
    () => [
      { id: 1, title: t("provider.onboarding.steps.profileCv"), icon: FileText },
      { id: 2, title: t("provider.onboarding.steps.skillsExperience"), icon: Target },
      { id: 3, title: t("provider.onboarding.steps.portfolioLinks"), icon: Link2 },
      { id: 4, title: t("provider.onboarding.steps.certifications"), icon: Award },
      { id: 5, title: t("provider.onboarding.steps.reviewSummary"), icon: CheckCircle2 },
    ],
    [t],
  );
  const [completion, setCompletion] = useState(0);
  const [completionLoading, setCompletionLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [bio, setBio] = useState("");
  const [major, setMajor] = useState("");
  const [location, setLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [website, setWebsite] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [yearsExperience, setYearsExperience] = useState<string>("");
  const [hourlyRate, setHourlyRate] = useState<string>("");
  const [pricingCurrency, setPricingCurrency] = useState<string>("MYR");
  const [availability, setAvailability] = useState<string>("available");
  const [workPreference, setWorkPreference] = useState<string>("remote");
  const [languages, setLanguages] = useState<string[]>([]);
  const [customLanguage, setCustomLanguage] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState<string[]>([]);
  const [newPortfolioLink, setNewPortfolioLink] = useState("");
  const [certifications, setCertifications] = useState<CertForm[]>([]);
  const [newCertifications, setNewCertifications] = useState<CertForm[]>([]);
  const [certForm, setCertForm] = useState<CertForm>({ name: "", issuer: "", issuedDate: "" });
  const [editingCertIndex, setEditingCertIndex] = useState<number | null>(null);
  const [editCertification, setEditCertification] = useState<CertForm | null>(null);

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploadedKey, setResumeUploadedKey] = useState<string | null>(null);
  const [analyzeCvWithAI, setAnalyzeCvWithAI] = useState(true);
  const [isProcessingCV, setIsProcessingCV] = useState(false);
  const [cvExtractedData, setCvExtractedData] = useState<Record<string, unknown> | null>(null);
  const [showAIResults, setShowAIResults] = useState(false);

  const progress = (step / STEPS.length) * 100;
  const currentStep = STEPS[step - 1];
  const StepIcon = currentStep.icon;

  // Fetch profile completion on mount to decide whether to show onboarding form or gate
  useEffect(() => {
    let cancelled = false;
    getProviderProfileCompletion()
      .then((res) => {
        if (cancelled) return;
        const data = res?.data ?? res;
        const value = typeof (data as { completion?: number })?.completion === "number"
          ? (data as { completion: number }).completion
          : 0;
        setCompletion(value);
      })
      .catch(() => {
        if (!cancelled) setCompletion(0);
      })
      .finally(() => {
        if (!cancelled) setCompletionLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getProviderProfile();
        if (res?.success && res?.data) {
          const p = res.data as Record<string, unknown>;
          setBio((p.bio as string) || "");
          setMajor((p.major as string) || "");
          const loc = (p.location as string) || "";
          if (loc && !MALAYSIAN_STATES.includes(loc)) {
            setLocation(OTHER_LOCATION);
            setCustomLocation(loc);
          } else {
            setLocation(loc);
            setCustomLocation("");
          }
          setWebsite((p.website as string) || "");
          setSkills(Array.isArray(p.skills) ? (p.skills as string[]) : []);
          setYearsExperience(String(p.yearsExperience ?? ""));
          setHourlyRate(String(p.hourlyRate ?? ""));
          setPricingCurrency(
            String(
              (p as { preferredCurrency?: string }).preferredCurrency || "MYR",
            ),
          );
          setAvailability((p.availability as string) || "available");
          setWorkPreference((p.workPreference as string) || "remote");
          setLanguages(Array.isArray(p.languages) ? (p.languages as string[]) : []);
          setPortfolioLinks(Array.isArray(p.portfolioLinks) ? (p.portfolioLinks as string[]) : []);
        }
        const certRes = await getMyCertifications();
        if (certRes?.success && Array.isArray(certRes.data)) {
          setCertifications(
            (certRes.data as Array<{ name?: string; issuer?: string; issuedDate?: string; serialNumber?: string; sourceUrl?: string }>).map(
              (c) => ({
                name: c.name || "",
                issuer: c.issuer || "",
                issuedDate: c.issuedDate || "",
                serialNumber: c.serialNumber,
                sourceUrl: c.sourceUrl,
              })
            )
          );
        }
        try {
          const resumeRes = await getMyResume();
          if (resumeRes?.data?.fileUrl) {
            setResumeUploadedKey((resumeRes.data as { fileUrl?: string }).fileUrl ?? null);
          }
        } catch {
          // No resume yet
        }
      } catch {
        toast({
          title: t("provider.onboarding.toast.errorTitle"),
          description: getUserFriendlyErrorMessage(
            undefined,
            "provider onboarding load profile",
          ),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast, t]);

  useEffect(() => {
    setFieldErrors({});
    setError("");
    setEditCertification(null);
    setEditingCertIndex(null);
  }, [step]);

  const getLocationValue = () => (location === OTHER_LOCATION ? customLocation.trim() : location || undefined);

  const validateStep = (s: number): boolean => {
    switch (s) {
      case 1: {
        if (!major.trim()) return false;
        const locVal = location === OTHER_LOCATION ? customLocation.trim() : location;
        if (!locVal) return false;
        if (bio.trim().length > 0 && bio.trim().length < 10) return false;
        return true;
      }
      case 2:
        return skills.length >= 1;
      case 3:
        return true;
      case 4: {
        if (newCertifications.length === 0) return true;
        return newCertifications.every((c) => hasSerialOrLink(c));
      }
      default:
        return true;
    }
  };

  const hasSerialOrLink = (c: CertForm) => (c.serialNumber ?? "").trim() || (c.sourceUrl ?? "").trim();

  const ensureAbsoluteUrl = (url: string): string => {
    const u = (url || "").trim();
    if (!u) return u;
    if (/^https?:\/\//i.test(u)) return u;
    return `https://${u}`;
  };

  const isValidIssueDate = (dateStr: string): boolean => {
    if (!dateStr || !dateStr.trim()) return false;
    const d = new Date(dateStr.trim());
    return !Number.isNaN(d.getTime());
  };

  const validateStep1 = (): Record<string, string> => {
    const err: Record<string, string> = {};
    if (!major.trim()) err.major = t("provider.onboarding.error.majorRequired");
    if (bio.trim().length > 0 && bio.trim().length < 10) err.bio = t("provider.onboarding.error.bioMin");
    const locVal = location === OTHER_LOCATION ? customLocation.trim() : location;
    if (!locVal) err.location = t("provider.onboarding.error.locationRequired");
    setFieldErrors(err);
    return err;
  };

  const saveStep1 = async () => {
    if (!validateStep(1)) {
      validateStep1();
      setError(t("provider.onboarding.error.fillRequired"));
      return;
    }
    setError("");
    setSaving(true);
    setFieldErrors({});
    try {
      await upsertProviderProfile({
        bio: bio.trim() || undefined,
        major: major.trim() || undefined,
        location: getLocationValue(),
        website: website.trim() || undefined,
      });
      setStep(2);
    } catch (e) {
      setError(getUserFriendlyErrorMessage(e, "provider onboarding save step1"));
    } finally {
      setSaving(false);
    }
  };

  const validateStep2 = (): Record<string, string> => {
    const err: Record<string, string> = {};
    if (skills.length === 0) err.skills = t("provider.onboarding.error.skillsRequired");
    setFieldErrors(err);
    return err;
  };

  const saveStep2 = async () => {
    if (!validateStep(2)) {
      validateStep2();
      setError(t("provider.onboarding.error.fillRequired"));
      return;
    }
    setError("");
    setSaving(true);
    setFieldErrors({});
    try {
      await upsertProviderProfile({
        skills: Array.isArray(skills) ? [...skills] : [],
        yearsExperience: yearsExperience ? parseInt(yearsExperience, 10) : undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        availability: availability || undefined,
        workPreference: workPreference || undefined,
        languages: Array.isArray(languages) ? [...languages] : [],
        preferredCurrency: pricingCurrency,
      });
      setStep(3);
    } catch (e) {
      setError(getUserFriendlyErrorMessage(e, "provider onboarding save step2"));
    } finally {
      setSaving(false);
    }
  };

  const saveStep3 = async () => {
    setError("");
    setSaving(true);
    setFieldErrors({});
    try {
      await upsertProviderProfile({ portfolioLinks });
      setStep(4);
    } catch (e) {
      setError(getUserFriendlyErrorMessage(e, "provider onboarding save step3"));
    } finally {
      setSaving(false);
    }
  };

  const addCertification = () => {
    if (!certForm.name.trim() || !certForm.issuer.trim()) {
      setFieldErrors((p) => ({ ...p, cert: t("provider.onboarding.error.certNameIssuer") }));
      return;
    }
    if (!certForm.issuedDate.trim()) {
      setFieldErrors((p) => ({ ...p, cert: t("provider.onboarding.error.certDate") }));
      return;
    }
    if (!isValidIssueDate(certForm.issuedDate)) {
      const msg = t("provider.onboarding.error.certDateFormat");
      setFieldErrors((p) => ({ ...p, cert: msg, issuedDate: msg }));
      return;
    }
    if (!hasSerialOrLink(certForm)) {
      setFieldErrors((p) => ({ ...p, cert: t("provider.onboarding.error.certSerialOrLink") }));
      return;
    }
    setNewCertifications((prev) => [...prev, { ...certForm }]);
    setCertForm({ name: "", issuer: "", issuedDate: "", serialNumber: "", sourceUrl: "" });
    setFieldErrors((p) => ({ ...p, cert: "" }));
    setError("");
  };

  const handleEditCertification = (index: number) => {
    setEditingCertIndex(index);
    setEditCertification({ ...newCertifications[index] });
  };

  const handleSaveEditedCertification = () => {
    if (editingCertIndex === null || !editCertification) return;
    if (!editCertification.issuedDate.trim()) {
      setFieldErrors((p) => ({ ...p, cert: t("provider.onboarding.error.certDate") }));
      return;
    }
    if (!isValidIssueDate(editCertification.issuedDate)) {
      const msg = t("provider.onboarding.error.certDateFormat");
      setFieldErrors((p) => ({ ...p, cert: msg, issuedDate: msg }));
      return;
    }
    if (!hasSerialOrLink(editCertification)) {
      setFieldErrors((p) => ({ ...p, cert: t("provider.onboarding.error.certSerialOrLink") }));
      return;
    }
    setNewCertifications((prev) =>
      prev.map((cert, i) => (i === editingCertIndex ? editCertification : cert))
    );
    setEditingCertIndex(null);
    setEditCertification(null);
    setFieldErrors((p) => ({ ...p, cert: "" }));
    setError("");
  };

  const saveStep4 = async () => {
    if (!validateStep(4)) {
      setFieldErrors({ cert: t("provider.onboarding.error.certEachLink") });
      setError(t("provider.onboarding.error.fillRequired"));
      return;
    }
    const invalidDateCert = newCertifications.find((c) => !c.issuedDate?.trim() || !isValidIssueDate(c.issuedDate));
    if (invalidDateCert) {
      setError(t("provider.onboarding.error.certInvalidDates"));
      setFieldErrors({ cert: t("provider.onboarding.error.certInvalidDateSummary") });
      return;
    }
    setError("");
    setSaving(true);
    setFieldErrors({});
    try {
      for (const cert of newCertifications) {
        await createCertification({
          name: cert.name,
          issuer: cert.issuer,
          issuedDate: cert.issuedDate,
          serialNumber: (cert.serialNumber ?? "").trim() || undefined,
          sourceUrl: (cert.sourceUrl ?? "").trim() || undefined,
        });
      }
      setStep(5);
    } catch (e) {
      setError(
        getUserFriendlyErrorMessage(e, "provider onboarding save step4 certifications"),
      );
    } finally {
      setSaving(false);
    }
  };

  const finishOnboarding = async () => {
    setOnboardingCompleted();
    if (typeof window !== "undefined") {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        const userId = user?.id ?? "anonymous";
        localStorage.removeItem(`provider-dashboard-tour-done-${userId}`);
      } catch {
        // ignore
      }
    }
    await refetchCompletion();
    toast({
      title: t("provider.onboarding.toast.finishTitle"),
      description: t("provider.onboarding.toast.finishDesc"),
    });
    router.push("/provider/dashboard");
  };

  const toggleSkill = (s: string) => {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
    setFieldErrors((p) => ({ ...p, skills: "" }));
    setError("");
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills((prev) => [...prev, trimmed]);
      setCustomSkill("");
      setFieldErrors((p) => ({ ...p, skills: "" }));
        setError("");
    }
  };

  const removeSkill = (s: string) => {
    setSkills((prev) => prev.filter((x) => x !== s));
  };

  const toggleLanguage = (language: string) => {
    setLanguages((prev) =>
      prev.includes(language) ? prev.filter((l) => l !== language) : [...prev, language]
    );
  };

  const addCustomLanguage = () => {
    const trimmed = customLanguage.trim();
    if (trimmed && !languages.includes(trimmed)) {
      setLanguages((prev) => [...prev, trimmed]);
      setCustomLanguage("");
    }
  };

  const removeLanguage = (language: string) => {
    setLanguages((prev) => prev.filter((l) => l !== language));
  };

  const addPortfolioLink = () => {
    const trimmed = newPortfolioLink.trim();
    if (trimmed && !portfolioLinks.includes(trimmed)) {
      setPortfolioLinks((prev) => [...prev, trimmed]);
      setNewPortfolioLink("");
    }
  };

  const applyCvExtractedData = (data: Record<string, unknown>) => {
    if (data.bio && typeof data.bio === "string") setBio(data.bio);
    if (data.major && typeof data.major === "string") setMajor(data.major);
    if (data.location && typeof data.location === "string") {
      const loc = data.location as string;
      if (MALAYSIAN_STATES.includes(loc)) {
        setLocation(loc);
        setCustomLocation("");
      } else {
        setLocation(OTHER_LOCATION);
        setCustomLocation(loc);
      }
    }
    if (data.website && typeof data.website === "string") setWebsite(data.website);
    if (data.yearsExperience != null) setYearsExperience(String(data.yearsExperience));
    if (data.suggestedHourlyRate != null) setHourlyRate(String(data.suggestedHourlyRate));
    if (Array.isArray(data.portfolioUrls) && data.portfolioUrls.length > 0) {
      setPortfolioLinks((prev) => {
        const added = (data.portfolioUrls as string[]).map((u) => String(u).trim()).filter((u) => u && !prev.includes(u));
        return [...prev, ...added];
      });
    }
    if (Array.isArray(data.skills) && data.skills.length > 0) {
      setSkills((prev) => {
        const added = (data.skills as string[]).filter((s) => !prev.includes(s));
        return [...prev, ...added];
      });
    }
    if (Array.isArray(data.languages) && data.languages.length > 0) {
      setLanguages((prev) => {
        const added = (data.languages as string[]).filter((l) => !prev.includes(l));
        return [...prev, ...added];
      });
    }
    if (Array.isArray(data.certifications) && data.certifications.length > 0) {
      const certs = (data.certifications as Array<Record<string, unknown>>).map((c) => {
        const serial = (c.serialNumber as string) || "";
        const url = (c.sourceUrl as string) || (c.verificationLink as string) || "";
        return {
          name: (c.name as string) || "",
          issuer: (c.issuer as string) || "",
          issuedDate: (c.issuedDate as string) || "",
          serialNumber: serial.trim() ? serial : url.trim() ? "" : t("provider.onboarding.fromCv"),
          sourceUrl: url.trim() || "",
        };
      });
      setNewCertifications((prev) => [...prev, ...certs]);
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast({
        title: t("provider.onboarding.toast.invalidFile"),
        description: t("provider.onboarding.toast.pdfOnly"),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: t("provider.onboarding.toast.fileTooLargeTitle"),
        description: t("provider.onboarding.toast.fileTooLarge"),
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }
    setResumeFile(file);
    setIsProcessingCV(true);
    setCvExtractedData(null);
    try {
      const { uploadFile } = await import("@/lib/upload");
      const uploadResult = await uploadFile({
        file,
        prefix: "resumes",
        visibility: "private",
        category: "document",
      });
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload CV");
      }
      const key = uploadResult.key;
      setResumeUploadedKey(key);
      if (analyzeCvWithAI) {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;
        const res = await fetch(`${API_BASE}/resume/analyze`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ key }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error((err.error as string) || "AI analysis failed");
        }
        const result = await res.json();
        const data = (result.data ?? result) as Record<string, unknown>;
        setCvExtractedData(data);
        setShowAIResults(true);
      } else {
        toast({
          title: t("provider.onboarding.toast.cvUploadedTitle"),
          description: t("provider.onboarding.toast.cvUploadedDesc"),
        });
      }
      await apiUploadResume(key, uploadResult.url);
    } catch (err) {
      toast({
        title: t("provider.onboarding.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          err,
          "provider onboarding resume upload",
        ),
        variant: "destructive",
      });
      setResumeFile(null);
      setResumeUploadedKey(null);
      e.target.value = "";
    } finally {
      setIsProcessingCV(false);
      e.target.value = "";
    }
  };

  const removeResume = () => {
    setResumeFile(null);
    setResumeUploadedKey(null);
    setCvExtractedData(null);
    setShowAIResults(false);
  };

  const confirmApplyCvData = () => {
    if (cvExtractedData) {
      applyCvExtractedData(cvExtractedData);
      setShowAIResults(false);
      toast({
        title: t("provider.onboarding.toast.appliedTitle"),
        description: t("provider.onboarding.toast.appliedDesc"),
      });
    }
  };

  // While completion is loading, show spinner to avoid flashing the form then the gate
  if (completionLoading) {
    return (
      
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
        </div>
      
    );
  }

  // Profile already > 50% complete — onboarding form not needed; direct to profile to edit
  if (completion > ONBOARDING_MAX_COMPLETION) {
    return (
      
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg">
            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  {t("provider.onboarding.gate.title")}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {t("provider.onboarding.gate.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  {t("provider.onboarding.gate.body")}
                </p>
                <Button
                  onClick={() => router.push("/provider/profile")}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {t("provider.onboarding.gate.goProfile")}
                </Button>
                <div className="text-center">
                  <Link href="/provider/dashboard" className="text-sm text-gray-600 hover:text-gray-900">
                    {t("provider.onboarding.gate.backDashboard")}
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
              <Link href="/provider/dashboard" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
                <ChevronLeft className="w-4 h-4" />
                {t("provider.onboarding.backDashboard")}
              </Link>
            </div>

            <Card className="bg-white/80 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center justify-center gap-2">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  {t("provider.onboarding.title")}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {t("provider.onboarding.subtitle")}
                </CardDescription>

                <div className="mt-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {t("provider.onboarding.stepProgress", { current: step, total: STEPS.length })}
                    </span>
                    <span className="text-sm text-gray-500">
                      {t("provider.onboarding.percentComplete", { pct: Math.round(progress) })}
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
                      <h3 className="font-semibold text-lg">{currentStep.title}</h3>
                    </div>
            {step === 1 && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="major">{t("provider.onboarding.step1.majorLabel")}</Label>
                  <Input
                    id="major"
                    placeholder={t("provider.onboarding.step1.majorPlaceholder")}
                    className={`bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.major ? "border-red-500" : ""}`}
                    value={major}
                    onChange={(e) => { setMajor(e.target.value); setFieldErrors((p) => ({ ...p, major: "" })); setError(""); }}
                  />
                  {fieldErrors.major && <p className="text-xs text-red-600">{fieldErrors.major}</p>}
                  <p className="text-xs text-gray-500">{t("provider.onboarding.step1.majorHint")}</p>
                </div>

                {/* CV Upload — same structure as old provider registration */}
                <div className="space-y-2 border-t pt-6">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label htmlFor="onboarding-cv">{t("provider.onboarding.step1.resumeLabel")}</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{t("provider.onboarding.step1.analyzeAi")}</span>
                      <Switch
                        checked={analyzeCvWithAI}
                        onCheckedChange={setAnalyzeCvWithAI}
                        disabled={isProcessingCV}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {t("provider.onboarding.step1.resumeHelp")}
                  </p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white/50 hover:border-blue-400 transition-colors">
                    <input
                      id="onboarding-cv"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                      disabled={isProcessingCV}
                    />
                    <label htmlFor="onboarding-cv" className="cursor-pointer block">
                      {isProcessingCV ? (
                        <div>
                          <div className="w-10 h-10 mx-auto mb-4 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <p className="text-lg font-medium text-blue-600 mb-2">
                            {analyzeCvWithAI
                              ? t("provider.onboarding.step1.processingAi")
                              : t("provider.onboarding.step1.processingUpload")}
                          </p>
                          <p className="text-sm text-gray-500">
                            {analyzeCvWithAI
                              ? t("provider.onboarding.step1.processingHintAi")
                              : t("provider.onboarding.step1.processingHintSave")}
                          </p>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto mb-4 text-gray-400" />
                          {(resumeFile || resumeUploadedKey) ? (
                            <div>
                              <p className="text-lg font-medium text-green-600 mb-2">
                                {resumeFile
                                  ? t("provider.onboarding.step1.resumeFileName", { name: resumeFile.name })
                                  : t("provider.onboarding.step1.resumeOnFile")}
                              </p>
                              <p className="text-sm text-gray-500 mb-2">{t("provider.onboarding.step1.clickChange")}</p>
                              {showAIResults && cvExtractedData && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg inline-block">
                                  <div className="flex items-center justify-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                    <span className="text-green-700 font-medium text-sm">
                                      {t("provider.onboarding.step1.aiProcessedBanner")}
                                    </span>
                                  </div>
                                </div>
                              )}
                              {resumeUploadedKey && !showAIResults && !analyzeCvWithAI && (
                                <div className="mt-4 p-3 bg-gray-100 border border-gray-200 rounded-lg inline-block">
                                  <span className="text-gray-700 text-sm">{t("provider.onboarding.step1.cvSavedManual")}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-lg font-medium text-gray-600 mb-2">{t("provider.onboarding.step1.uploadPrompt")}</p>
                              <p className="text-sm text-gray-500 mb-4">{t("provider.onboarding.step1.pdfMax")}</p>
                              {analyzeCvWithAI && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4 max-w-sm mx-auto">
                                  <div className="flex items-center justify-center gap-2">
                                    <Zap className="w-5 h-5 text-blue-600 shrink-0" />
                                    <span className="text-blue-700 font-medium text-sm">
                                      {t("provider.onboarding.step1.aiAutofillBanner")}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </label>
                  </div>
                  {(resumeFile || resumeUploadedKey) && !isProcessingCV && (
                    <div className="flex justify-center">
                      <Button type="button" variant="ghost" size="sm" onClick={removeResume}>
                        {resumeUploadedKey && !resumeFile
                          ? t("provider.onboarding.step1.replaceCv")
                          : t("provider.onboarding.step1.removeCv")}
                      </Button>
                    </div>
                  )}
                </div>

                {/* AI Extracted Information — confirm or skip */}
                {showAIResults && cvExtractedData && (() => {
                  const bioVal = typeof cvExtractedData.bio === "string" ? cvExtractedData.bio : null;
                  const skillsVal = Array.isArray(cvExtractedData.skills) ? (cvExtractedData.skills as string[]) : null;
                  const languagesVal = Array.isArray(cvExtractedData.languages) ? (cvExtractedData.languages as string[]) : null;
                  const yearsExp = cvExtractedData.yearsExperience != null ? String(cvExtractedData.yearsExperience) : null;
                  const hourlyRateVal = cvExtractedData.suggestedHourlyRate != null ? String(cvExtractedData.suggestedHourlyRate) : null;
                  const locationVal = typeof cvExtractedData.location === "string" ? cvExtractedData.location : null;
                  const portfolioUrlsVal = Array.isArray(cvExtractedData.portfolioUrls) ? (cvExtractedData.portfolioUrls as string[]) : null;
                  const websiteVal = typeof cvExtractedData.website === "string" ? cvExtractedData.website : typeof cvExtractedData.officialWebsite === "string" ? cvExtractedData.officialWebsite : null;
                  const majorVal = typeof cvExtractedData.major === "string" ? cvExtractedData.major : null;
                  const certsVal = Array.isArray(cvExtractedData.certifications) ? (cvExtractedData.certifications as Array<Record<string, unknown>>) : null;
                  return (
                    <div className="p-6 border-2 border-blue-200 rounded-lg bg-blue-50 space-y-4">
                      <div className="flex items-center gap-2">
                        <Zap className="w-6 h-6 text-blue-600 shrink-0" />
                        <h3 className="text-lg font-semibold text-blue-900">{t("provider.onboarding.aiExtracted.title")}</h3>
                      </div>
                      <p className="text-sm text-blue-800">{t("provider.onboarding.aiExtracted.intro")}</p>

                      <div className="space-y-4">
                        {majorVal && (
                          <div>
                            <Label className="text-sm font-medium text-blue-800">{t("provider.onboarding.aiExtracted.titleMajor")}</Label>
                            <p className="text-sm text-blue-700 bg-white/50 p-2 rounded border mt-1">{majorVal}</p>
                          </div>
                        )}
                        {bioVal && (
                          <div>
                            <Label className="text-sm font-medium text-blue-800">{t("provider.onboarding.aiExtracted.summary")}</Label>
                            <p className="text-sm text-blue-700 bg-white/50 p-3 rounded border mt-1">{bioVal}</p>
                          </div>
                        )}
                        {skillsVal && skillsVal.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-blue-800">
                              {t("provider.onboarding.aiExtracted.skills", { count: skillsVal.length })}
                            </Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {skillsVal.map((s, i) => (
                                <Badge key={i} className="bg-blue-600 text-white">{s}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {languagesVal && languagesVal.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-blue-800">
                              {t("provider.onboarding.aiExtracted.languages", { count: languagesVal.length })}
                            </Label>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {languagesVal.map((l, i) => (
                                <Badge key={i} className="bg-green-600 text-white">{l}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {yearsExp && (
                            <div>
                              <Label className="text-sm font-medium text-blue-800">{t("provider.onboarding.aiExtracted.experience")}</Label>
                              <p className="text-sm text-blue-700">{yearsExp}</p>
                            </div>
                          )}
                          {hourlyRateVal && (
                            <div>
                              <Label className="text-sm font-medium text-blue-800">{t("provider.onboarding.aiExtracted.suggestedRate")}</Label>
                              <p className="text-sm text-blue-700">
                                {t("provider.onboarding.aiExtracted.rateValue", { rate: hourlyRateVal })}
                              </p>
                            </div>
                          )}
                        </div>
                        {locationVal && (
                          <div>
                            <Label className="text-sm font-medium text-blue-800">{t("provider.onboarding.aiExtracted.location")}</Label>
                            <p className="text-sm text-blue-700 bg-white/50 p-2 rounded border mt-1">{locationVal}</p>
                          </div>
                        )}
                        {portfolioUrlsVal && portfolioUrlsVal.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-blue-800">{t("provider.onboarding.aiExtracted.portfolioLinks")}</Label>
                            <ul className="list-disc pl-5 text-sm text-blue-700 mt-1 space-y-1">
                              {portfolioUrlsVal.map((url, i) => (
                                <li key={i}>
                                  <a href={ensureAbsoluteUrl(url)} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">{url}</a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {websiteVal && (
                          <div>
                            <Label className="text-sm font-medium text-blue-800">{t("provider.onboarding.aiExtracted.website")}</Label>
                            <p className="text-sm text-blue-700">
                              <a href={ensureAbsoluteUrl(websiteVal)} target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">{websiteVal}</a>
                            </p>
                          </div>
                        )}
                        {certsVal && certsVal.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-blue-800">{t("provider.onboarding.aiExtracted.certifications")}</Label>
                            <div className="space-y-2 mt-2">
                              {certsVal.map((c, i) => (
                                <div key={i} className="text-sm text-blue-700 bg-white/50 p-3 rounded border">
                                  <p><span className="font-medium">{String(c.name || "")}</span> — {String(c.issuer || "")}{c.issuedDate ? ` (${String(c.issuedDate)})` : ""}</p>
                                  {(c.serialNumber as string) && (
                                    <p className="text-xs mt-1 text-blue-800">
                                      {t("provider.onboarding.aiExtracted.serial", { serial: String(c.serialNumber) })}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button onClick={confirmApplyCvData} className="bg-blue-600 hover:bg-blue-700 text-white">
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {t("provider.onboarding.aiExtracted.apply")}
                        </Button>
                        <Button onClick={() => setShowAIResults(false)} variant="outline" className="bg-white/50">
                          {t("provider.onboarding.aiExtracted.skipManual")}
                        </Button>
                      </div>
                      <p className="text-xs text-blue-600">{t("provider.onboarding.aiExtracted.footerHint")}</p>
                    </div>
                  );
                })()}

                <div className="space-y-2">
                  <Label htmlFor="bio">{t("provider.onboarding.step1.bioLabel")}</Label>
                  <Textarea
                    id="bio"
                    placeholder={t("provider.onboarding.step1.bioPlaceholder")}
                    className={`bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 min-h-[120px] resize-none ${fieldErrors.bio ? "border-red-500" : ""}`}
                    maxLength={500}
                    value={bio}
                    onChange={(e) => { setBio(e.target.value); setFieldErrors((p) => ({ ...p, bio: "" })); setError(""); }}
                    rows={4}
                  />
                  {fieldErrors.bio && <p className="text-xs text-red-600">{fieldErrors.bio}</p>}
                  <p className="text-xs text-gray-500">{t("provider.onboarding.step1.charCount", { count: bio.length })}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">{t("provider.onboarding.step1.locationLabel")}</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                    <Select
                      value={location}
                      onValueChange={(v) => {
                        setLocation(v);
                        if (v !== OTHER_LOCATION) setCustomLocation("");
                        setFieldErrors((p) => ({ ...p, location: "" }));
                        setError("");
                      }}
                    >
                      <SelectTrigger className={`pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.location ? "border-red-500" : ""}`}>
                        <SelectValue placeholder={t("provider.onboarding.step1.locationPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        {MALAYSIAN_STATES.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                        <SelectItem value={OTHER_LOCATION}>{t("provider.onboarding.location.otherOption")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {location === OTHER_LOCATION && (
                    <div className="pt-1">
                      <Input
                        id="customLocation"
                        placeholder={t("provider.onboarding.step1.customLocationPlaceholder")}
                        className={`bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 ${fieldErrors.location ? "border-red-500" : ""}`}
                        value={customLocation}
                        onChange={(e) => { setCustomLocation(e.target.value); setFieldErrors((p) => ({ ...p, location: "" })); setError(""); }}
                      />
                    </div>
                  )}
                  {fieldErrors.location && <p className="text-xs text-red-600">{fieldErrors.location}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">{t("provider.onboarding.step1.websiteLabel")}</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-gray-400 z-10 pointer-events-none" />
                    <Input
                      id="website"
                      type="url"
                      placeholder={t("provider.onboarding.step1.websitePlaceholder")}
                      className="pl-10 bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div className="space-y-4">
                  <Label>{t("provider.onboarding.step2.skillsLabel")}</Label>
                  {fieldErrors.skills && <p className="text-xs text-red-600">{fieldErrors.skills}</p>}
                  <div className="flex gap-2">
                    <Input
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      placeholder={t("provider.onboarding.step2.skillInputPlaceholder")}
                      className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomSkill())}
                    />
                    <Button type="button" onClick={addCustomSkill} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {skills.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("provider.onboarding.step2.selectedSkills", { count: skills.length })}
                      </Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50 max-h-32 overflow-y-auto">
                        {skills.map((skill) => (
                          <Badge key={skill} className="bg-blue-600 hover:bg-blue-700 text-white pr-1">
                            {skill}
                            <button
                              type="button"
                              onClick={() => removeSkill(skill)}
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
                    <Label className="text-sm font-medium">{t("provider.onboarding.step2.popularSkills")}</Label>
                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-3 border rounded-lg bg-white/50">
                      {POPULAR_SKILLS.filter((s) => !skills.includes(s)).map((s) => (
                        <Badge
                          key={s}
                          variant="outline"
                          className="cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all duration-200"
                          onClick={() => toggleSkill(s)}
                        >
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Languages Section */}
                <div className="space-y-4">
                  <Label>{t("provider.onboarding.step2.languagesLabel")}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={customLanguage}
                      onChange={(e) => setCustomLanguage(e.target.value)}
                      placeholder={t("provider.onboarding.step2.languageInputPlaceholder")}
                      className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      onKeyDown={(e) =>
                        e.key === "Enter" && (e.preventDefault(), addCustomLanguage())
                      }
                    />
                    <Button type="button" onClick={addCustomLanguage} variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {languages.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("provider.onboarding.step2.selectedLanguages", { count: languages.length })}
                      </Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                        {languages.map((language) => (
                          <Badge
                            key={language}
                            className="bg-green-600 hover:bg-green-700 text-white pr-1"
                          >
                            {language}
                            <button
                              type="button"
                              onClick={() => removeLanguage(language)}
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
                      {t("provider.onboarding.step2.commonLanguages")}
                    </Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-white/50">
                      {COMMON_LANGUAGES.filter((l) => !languages.includes(l)).map((language) => (
                        <Badge
                          key={language}
                          variant="outline"
                          className="cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                          onClick={() => toggleLanguage(language)}
                        >
                          {language}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="experience">{t("provider.onboarding.step2.yearsExperience")}</Label>
                    <Input
                      id="experience"
                      type="number"
                      min={0}
                      max={50}
                      placeholder={t("provider.onboarding.step2.yearsPlaceholder")}
                      className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyRate">{t("provider.onboarding.step2.hourlyRate")}</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      min={10}
                      max={1000}
                      placeholder={t("provider.onboarding.step2.ratePlaceholder")}
                      className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("provider.profile.pricingCurrency")}</Label>
                  <Select
                    value={pricingCurrency}
                    onValueChange={setPricingCurrency}
                  >
                    <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
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
                  <p className="text-xs text-gray-600">
                    {t("provider.profile.pricingCurrencyHint")}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t("provider.profile.availability")}</Label>
                    <Select value={availability} onValueChange={setAvailability}>
                      <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={t("provider.onboarding.step2.availabilityPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">{t("provider.profile.availability.available")}</SelectItem>
                        <SelectItem value="busy">{t("provider.profile.availability.busy")}</SelectItem>
                        <SelectItem value="unavailable">{t("provider.profile.availability.unavailable")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>{t("provider.profile.workPreference")}</Label>
                    <Select value={workPreference} onValueChange={setWorkPreference}>
                      <SelectTrigger className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
                        <SelectValue placeholder={t("provider.onboarding.step2.workPrefPlaceholder")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="remote">{t("provider.profile.workPref.remote")}</SelectItem>
                        <SelectItem value="onsite">{t("provider.profile.workPref.onsite")}</SelectItem>
                        <SelectItem value="hybrid">{t("provider.profile.workPref.hybrid")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div className="space-y-4">
                  <Label>{t("provider.onboarding.step3.urlsLabel")}</Label>
                  <p className="text-sm text-gray-600">
                    {t("provider.onboarding.step3.urlsHelp")}
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="url"
                      placeholder={t("provider.onboarding.step3.urlPlaceholder")}
                      className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 flex-1"
                      value={newPortfolioLink}
                      onChange={(e) => setNewPortfolioLink(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPortfolioLink())}
                    />
                    <Button type="button" variant="outline" onClick={addPortfolioLink}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {portfolioLinks.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("provider.onboarding.step3.linksHeading", { count: portfolioLinks.length })}
                      </Label>
                      <div className="space-y-2">
                        {portfolioLinks.map((url, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-white/50 border rounded-lg"
                          >
                            <a
                              href={ensureAbsoluteUrl(url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-700 text-sm truncate flex-1"
                            >
                              {url}
                            </a>
                            <button
                              type="button"
                              onClick={() => setPortfolioLinks((p) => p.filter((_, j) => j !== i))}
                              className="ml-2 text-red-500 hover:text-red-700 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {portfolioLinks.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                      <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>{t("provider.onboarding.step3.emptyTitle")}</p>
                      <p className="text-sm">{t("provider.onboarding.step3.emptyHint")}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-medium">{t("provider.onboarding.step3.platformsTitle")}</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { name: "GitHub", placeholder: "https://github.com/username" },
                      { name: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
                      { name: "Behance", placeholder: "https://behance.net/username" },
                      { name: "Dribbble", placeholder: "https://dribbble.com/username" },
                    ].map((platform) => (
                      <Button
                        key={platform.name}
                        type="button"
                        variant="outline"
                        className="h-auto p-3 bg-white/50 hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => setNewPortfolioLink(platform.placeholder)}
                      >
                        <div className="text-center w-full">
                          <Globe className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                          <span className="text-sm">{platform.name}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Award className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm text-blue-800 font-medium">{t("provider.onboarding.step4.whyTitle")}</p>
                      <p className="text-sm text-blue-700">
                        {t("provider.onboarding.step4.whyBody")}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 p-4 border rounded-lg bg-white/50">
                  <h3 className="font-medium text-gray-900">{t("provider.onboarding.step4.formTitle")}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="certName">{t("provider.onboarding.step4.certName")}</Label>
                      <Input
                        id="certName"
                        placeholder={t("provider.onboarding.step4.certNamePh")}
                        className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={certForm.name}
                        onChange={(e) => setCertForm((c) => ({ ...c, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certIssuer">{t("provider.onboarding.step4.issuer")}</Label>
                      <Input
                        id="certIssuer"
                        placeholder={t("provider.onboarding.step4.issuerPh")}
                        className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={certForm.issuer}
                        onChange={(e) => setCertForm((c) => ({ ...c, issuer: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="certDate">{t("provider.onboarding.step4.issueDate")}</Label>
                      <Input
                        id="certDate"
                        type="date"
                        className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={certForm.issuedDate}
                        onChange={(e) => {
                          setCertForm((c) => ({ ...c, issuedDate: e.target.value }));
                          setFieldErrors((p) => ({ ...p, cert: "", issuedDate: "" }));
                        }}
                      />
                      {fieldErrors.issuedDate && <p className="text-xs text-red-600">{fieldErrors.issuedDate}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="certSerial">{t("provider.onboarding.step4.serial")}</Label>
                      <Input
                        id="certSerial"
                        placeholder={t("provider.onboarding.step4.serialPh")}
                        className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                        value={certForm.serialNumber || ""}
                        onChange={(e) => { setCertForm((c) => ({ ...c, serialNumber: e.target.value })); setFieldErrors((p) => ({ ...p, cert: "" })); }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="certLink">{t("provider.onboarding.step4.verifyLink")}</Label>
                    <Input
                      id="certLink"
                      type="url"
                      placeholder={t("provider.onboarding.step4.verifyLinkPh")}
                      className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                      value={certForm.sourceUrl || ""}
                      onChange={(e) => { setCertForm((c) => ({ ...c, sourceUrl: e.target.value })); setFieldErrors((p) => ({ ...p, cert: "" })); }}
                    />
                    <p className="text-xs text-gray-500">{t("provider.onboarding.step4.serialOrLinkHint")}</p>
                  </div>
                  {fieldErrors.cert && <p className="text-xs text-red-600">{fieldErrors.cert}</p>}
                  <Button
                    type="button"
                    onClick={addCertification}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={
                      !certForm.name.trim() ||
                      !certForm.issuer.trim() ||
                      !certForm.issuedDate ||
                      (!(certForm.serialNumber ?? "").trim() && !(certForm.sourceUrl ?? "").trim())
                    }
                  >
                    <Award className="w-4 h-4 mr-2" />
                    {t("provider.onboarding.step4.addButton")}
                  </Button>
                </div>

                {(certifications.length > 0 || newCertifications.length > 0) && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                      {t("provider.onboarding.step4.yourCerts", {
                        count: certifications.length + newCertifications.length,
                      })}
                    </h3>
                    <div className="space-y-3">
                      {certifications.map((c, i) => (
                        <div key={`existing-${i}`} className="p-4 border rounded-lg bg-white/50">
                          <div className="flex items-start gap-2">
                            <Award className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{c.name}</h4>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Building2 className="w-4 h-4" /> {c.issuer}
                              </p>
                              <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                <Calendar className="w-4 h-4" />{" "}
                                {c.issuedDate ? new Date(c.issuedDate).toLocaleDateString() : t("provider.onboarding.review.dash")}
                              </p>
                              {c.serialNumber && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {t("provider.onboarding.step4.serialLabel", { serial: c.serialNumber })}
                                </p>
                              )}
                              {c.sourceUrl && (
                                <a href={ensureAbsoluteUrl(c.sourceUrl)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mt-1 inline-block">
                                  {t("provider.onboarding.step4.verifyCert")}
                                </a>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">{t("provider.onboarding.step4.saved")}</span>
                          </div>
                        </div>
                      ))}
                      {newCertifications.map((c, i) => (
                        <div key={`new-${i}`} className="p-4 border rounded-lg bg-white/50">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 flex-1">
                              <Award className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                              <div>
                                <h4 className="font-medium text-gray-900">{c.name}</h4>
                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                  <Building2 className="w-4 h-4" /> {c.issuer}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                                  <Calendar className="w-4 h-4" />{" "}
                                  {c.issuedDate ? new Date(c.issuedDate).toLocaleDateString() : t("provider.onboarding.review.dash")}
                                </p>
                                {c.serialNumber && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {t("provider.onboarding.step4.serialLabel", { serial: c.serialNumber })}
                                  </p>
                                )}
                                {c.sourceUrl && (
                                  <a href={ensureAbsoluteUrl(c.sourceUrl)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm mt-1 inline-block">
                                    {t("provider.onboarding.step4.verifyCert")}
                                  </a>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditCertification(i)}
                                className="text-blue-600 hover:text-blue-800 p-1"
                                title={t("provider.onboarding.step4.editTitleAttr")}
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setNewCertifications((p) => p.filter((_, j) => j !== i))}
                                className="text-red-500 hover:text-red-700 p-1"
                                title={t("provider.onboarding.step4.removeTitleAttr")}
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
                {certifications.length === 0 && newCertifications.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{t("provider.onboarding.step4.emptyTitle")}</p>
                    <p className="text-sm">{t("provider.onboarding.step4.emptyHint")}</p>
                  </div>
                )}

                {editCertification && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                      <h3 className="text-lg font-semibold mb-4">{t("provider.onboarding.step4.editModalTitle")}</h3>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label>{t("provider.onboarding.step4.certName")}</Label>
                          <Input
                            placeholder={t("provider.onboarding.step4.editNamePh")}
                            className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            value={editCertification.name}
                            onChange={(e) =>
                              setEditCertification((prev) => prev ? { ...prev, name: e.target.value } : null)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t("provider.onboarding.step4.issuer")}</Label>
                          <Input
                            placeholder={t("provider.onboarding.step4.editIssuerPh")}
                            className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            value={editCertification.issuer}
                            onChange={(e) =>
                              setEditCertification((prev) => prev ? { ...prev, issuer: e.target.value } : null)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t("provider.onboarding.step4.issueDate")}</Label>
                          <Input
                            type="date"
                            className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            value={editCertification.issuedDate}
                            onChange={(e) => {
                              setEditCertification((prev) => prev ? { ...prev, issuedDate: e.target.value } : null);
                              setFieldErrors((p) => ({ ...p, issuedDate: "", cert: "" }));
                            }}
                          />
                          {fieldErrors.issuedDate && <p className="text-xs text-red-600">{fieldErrors.issuedDate}</p>}
                        </div>
                        <div className="space-y-1">
                          <Label>{t("provider.onboarding.step4.serial")}</Label>
                          <Input
                            placeholder={t("provider.onboarding.step4.serial")}
                            className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            value={editCertification.serialNumber || ""}
                            onChange={(e) =>
                              setEditCertification((prev) => prev ? { ...prev, serialNumber: e.target.value } : null)
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label>{t("provider.onboarding.step4.verifyLink")}</Label>
                          <Input
                            type="url"
                            placeholder={t("provider.onboarding.step4.editVerifyPh")}
                            className="bg-white/50 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                            value={editCertification.sourceUrl || ""}
                            onChange={(e) =>
                              setEditCertification((prev) => prev ? { ...prev, sourceUrl: e.target.value } : null)
                            }
                          />
                          <p className="text-xs text-gray-500">{t("provider.onboarding.step4.serialOrLinkHint")}</p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 mt-6">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditCertification(null);
                            setEditingCertIndex(null);
                            setFieldErrors((p) => ({ ...p, cert: "", issuedDate: "" }));
                          }}
                        >
                          {t("provider.profile.cancel")}
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSaveEditedCertification}>
                          {t("provider.onboarding.step4.saveChanges")}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 5 && (
              <div className="space-y-6">
                <p className="text-sm text-gray-600">
                  {t("provider.onboarding.review.intro")}
                </p>
                <div className="p-4 border rounded-lg bg-white/50 space-y-4">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("provider.onboarding.review.titleMajor")}</dt>
                    <dd className="mt-1 font-medium text-gray-900">{major || t("provider.onboarding.review.dash")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("provider.onboarding.review.bio")}</dt>
                    <dd className="mt-1 text-sm text-gray-700 line-clamp-3">{bio || t("provider.onboarding.review.dash")}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("provider.onboarding.review.location")}</dt>
                    <dd className="mt-1 text-gray-900">
                      {(location === OTHER_LOCATION ? customLocation : location) || t("provider.onboarding.review.dash")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("provider.onboarding.review.website")}</dt>
                    <dd className="mt-1 text-gray-900">
                      {website ? (
                        <a href={ensureAbsoluteUrl(website)} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{website}</a>
                      ) : t("provider.onboarding.review.dash")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("provider.onboarding.review.skills")}</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {skills.length > 0 ? skills.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>) : t("provider.onboarding.review.dash")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("provider.onboarding.review.languages")}</dt>
                    <dd className="mt-1 flex flex-wrap gap-1.5">
                      {languages.length > 0 ? languages.map((l) => <Badge key={l} variant="secondary" className="text-xs">{l}</Badge>) : t("provider.onboarding.review.dash")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("provider.onboarding.review.experienceRate")}</dt>
                    <dd className="mt-1 text-gray-900">
                      {yearsExperience && hourlyRate
                        ? t("provider.onboarding.review.yearsRate", { years: yearsExperience, rate: hourlyRate })
                        : yearsExperience
                          ? t("provider.onboarding.review.yearsOnly", { years: yearsExperience })
                          : hourlyRate
                            ? t("provider.onboarding.review.rateOnly", { rate: hourlyRate })
                            : t("provider.onboarding.review.dash")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("provider.onboarding.review.portfolioLinks")}</dt>
                    <dd className="mt-1 text-sm text-gray-700">
                      {portfolioLinks.length > 0 ? portfolioLinks.length : t("provider.onboarding.review.dash")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("provider.onboarding.review.certifications")}</dt>
                    <dd className="mt-1 text-gray-900">
                      {certifications.length + newCertifications.length > 0
                        ? certifications.length + newCertifications.length
                        : t("provider.onboarding.review.dash")}
                    </dd>
                  </div>
                </div>
              </div>
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
                      setStep((s) => Math.max(1, s - 1));
                      setError("");
                    }}
                    disabled={step === 1}
                    className="bg-transparent"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    {t("provider.onboarding.nav.previous")}
                  </Button>
                  {step < 5 ? (
                    <Button
                      type="button"
                      onClick={() => {
                        if (step === 1) saveStep1();
                        else if (step === 2) saveStep2();
                        else if (step === 3) saveStep3();
                        else if (step === 4) saveStep4();
                      }}
                      disabled={saving}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      {saving ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                      ) : null}
                      {saving ? t("provider.onboarding.nav.saving") : t("provider.onboarding.nav.next")}
                      {!saving ? <ChevronRight className="w-4 h-4 ml-2" /> : null}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={finishOnboarding}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {t("provider.onboarding.nav.finish")}
                    </Button>
                  )}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    <Link href="/provider/profile" className="text-blue-600 hover:text-blue-700 font-medium">
                      {t("provider.onboarding.footer.editProfile")}
                    </Link>
                    {" "}
                    {t("provider.onboarding.footer.anytime")}
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
