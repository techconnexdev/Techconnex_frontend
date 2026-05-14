"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  Clock,
  Shield,
  FileText,
  Sparkles,
  Loader2,
  Upload,
  File,
  X,
  CheckCircle,
} from "lucide-react";
import { createProject, analyzeProjectDocument } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { buildTimelineData } from "@/lib/timeline-utils";
import { RichEditor } from "@/components/markdown/RichTextEditor";
import {
  useCustomerCompletion,
  POST_PROJECT_REQUIRED,
} from "@/contexts/CustomerCompletionContext";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useI18n } from "@/contexts/I18nProvider";
import { MIN_MONETARY_AMOUNT } from "@/lib/amount-constraints";

export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { canPostProject, loading: completionLoading } =
    useCustomerCompletion();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budgetMin: "",
    budgetMax: "",
    currencyCode: "MYR",
    timelineAmount: "",
    timelineUnit: "" as "day" | "week" | "month" | "",
    skills: [] as string[],
    ndaSigned: false,
    priority: "medium",
    requirements: "<p></p>",
    deliverables: "<p></p>",
  });

  const [newSkill, setNewSkill] = useState("");

  // Track which fields are AI suggestions vs from document
  const [fieldSources, setFieldSources] = useState<
    Record<string, "document" | "ai_suggestion" | "missing" | "manual">
  >({});
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisStage, setAnalysisStage] = useState<string>(""); // Track current stage: "uploading" | "analyzing"

  const [errors, setErrors] = useState<{
    title?: string;
    category?: string;
    description?: string;
    budgetMin?: string;
    budgetMax?: string;
    timelineAmount?: string;
    timelineUnit?: string;
  }>({});

  const baseCategories = useMemo(
    () => [
      { value: "WEB_DEVELOPMENT", label: t("customer.projects.new.cat.web") },
      {
        value: "MOBILE_APP_DEVELOPMENT",
        label: t("customer.projects.new.cat.mobile"),
      },
      { value: "CLOUD_SERVICES", label: t("customer.projects.new.cat.cloud") },
      { value: "IOT_SOLUTIONS", label: t("customer.projects.new.cat.iot") },
      { value: "DATA_ANALYTICS", label: t("customer.projects.new.cat.data") },
      {
        value: "CYBERSECURITY",
        label: t("customer.projects.new.cat.security"),
      },
      { value: "UI_UX_DESIGN", label: t("customer.projects.new.cat.uiux") },
      { value: "DEVOPS", label: t("customer.projects.new.cat.devops") },
      { value: "AI_ML_SOLUTIONS", label: t("customer.projects.new.cat.aiMl") },
      {
        value: "SYSTEM_INTEGRATION",
        label: t("customer.projects.new.cat.integration"),
      },
    ],
    [t],
  );
  const [customCategories, setCustomCategories] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const categories = useMemo(
    () => [...baseCategories, ...customCategories],
    [baseCategories, customCategories],
  );

  // temporary text field for custom category
  const [newCategory, setNewCategory] = useState("");

  const skillOptions = [
    "React",
    "Next.js",
    "Vue.js",
    "Angular",
    "React Native",
    "Flutter",
    "iOS",
    "Android",
    "Node.js",
    "Python",
    "Java",
    "PHP",
    "AWS",
    "Azure",
    "Google Cloud",
    "Docker",
    "Kubernetes",
    "MongoDB",
    "PostgreSQL",
    "MySQL",
    "UI/UX Design",
    "Figma",
    "Adobe XD",
  ];
  const currencyOptions = [
    "MYR",
    "USD",
    "EUR",
    "GBP",
    "SGD",
    "AUD",
    "JPY",
    "AED",
    "IDR",
  ];

  const handleInputChange = (field: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Mark as manually edited if user changes a field
    if (fieldSources[field] !== "manual") {
      setFieldSources((prev) => ({ ...prev, [field]: "manual" }));
    }
  };

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleAddCustomSkill = () => {
    const cleaned = newSkill.trim();

    // block empty, block duplicates (case-insensitive)
    if (!cleaned) return;

    const alreadyExists = formData.skills.some(
      (s) => s.toLowerCase() === cleaned.toLowerCase(),
    );

    if (!alreadyExists) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, cleaned],
      }));
    }

    setNewSkill("");
  };

  const handleAddCustomCategory = () => {
    const cleaned = newCategory.trim();
    if (!cleaned) return;

    // We'll store custom category using the raw text as both value and label.
    // Why? Because backend already falls back to using the provided string
    // if it doesn't match a known map. :contentReference[oaicite:2]{index=2}
    const newOption = {
      value: cleaned,
      label: cleaned,
    };

    // Check if it already exists (case-insensitive compare on label)
    const exists = categories.some(
      (c) => c.label.toLowerCase() === cleaned.toLowerCase(),
    );
    if (!exists) {
      setCustomCategories((prev) => [...prev, newOption]);
    }

    // Also set this as the active form category
    setFormData((prev) => ({
      ...prev,
      category: newOption.value,
    }));

    // Clear the input
    setNewCategory("");
  };

  const handleDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
    ];

    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".txt",
    ];
    const fileExt = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExt)
    ) {
      toast({
        title: t("customer.projects.new.toast.invalidFileTitle"),
        description: t("customer.projects.new.toast.invalidFileDesc"),
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB max for documents)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      toast({
        title: t("customer.projects.new.toast.fileTooLargeTitle"),
        description: t("customer.projects.new.toast.fileTooLargeDesc", {
          mb: (maxSize / (1024 * 1024)).toFixed(0),
        }),
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisStage("uploading");

    try {
      // The analyzeProjectDocument function handles R2 upload internally
      // We'll update the stage when analysis starts
      setAnalysisStage("analyzing");
      const response = await analyzeProjectDocument(file);

      if (response.success && response.data) {
        const extracted = response.data;
        const newSources: Record<
          string,
          "document" | "ai_suggestion" | "missing"
        > = {};

        // Auto-fill form with extracted data
        if (extracted.title?.value) {
          setFormData((prev) => ({ ...prev, title: extracted.title.value }));
          newSources.title = extracted.title.source;
        }

        if (extracted.description?.value) {
          setFormData((prev) => ({
            ...prev,
            description: extracted.description.value,
          }));
          newSources.description = extracted.description.source;
        }

        if (extracted.category?.value) {
          setFormData((prev) => ({
            ...prev,
            category: extracted.category.value,
          }));
          newSources.category = extracted.category.source;
        }

        if (
          extracted.budgetMin?.value !== null &&
          extracted.budgetMin?.value !== undefined
        ) {
          setFormData((prev) => ({
            ...prev,
            budgetMin: extracted.budgetMin.value.toString(),
          }));
          newSources.budgetMin = extracted.budgetMin.source;
        }

        if (
          extracted.budgetMax?.value !== null &&
          extracted.budgetMax?.value !== undefined
        ) {
          setFormData((prev) => ({
            ...prev,
            budgetMax: extracted.budgetMax.value.toString(),
          }));
          newSources.budgetMax = extracted.budgetMax.source;
        }

        if (
          extracted.timelineAmount?.value !== null &&
          extracted.timelineAmount?.value !== undefined
        ) {
          setFormData((prev) => ({
            ...prev,
            timelineAmount: extracted.timelineAmount.value.toString(),
          }));
          newSources.timelineAmount = extracted.timelineAmount.source;
        }

        if (extracted.timelineUnit?.value) {
          setFormData((prev) => ({
            ...prev,
            timelineUnit: extracted.timelineUnit.value,
          }));
          newSources.timelineUnit = extracted.timelineUnit.source;
        }

        if (extracted.skills?.value && Array.isArray(extracted.skills.value)) {
          setFormData((prev) => ({ ...prev, skills: extracted.skills.value }));
          newSources.skills = extracted.skills.source;
        }

        if (extracted.priority?.value) {
          setFormData((prev) => ({
            ...prev,
            priority: extracted.priority.value,
          }));
          newSources.priority = extracted.priority.source;
        }

        if (extracted.requirements?.value) {
          setFormData((prev) => ({
            ...prev,
            requirements: extracted.requirements.value,
          }));
          newSources.requirements = extracted.requirements.source;
        }

        if (extracted.deliverables?.value) {
          setFormData((prev) => ({
            ...prev,
            deliverables: extracted.deliverables.value,
          }));
          newSources.deliverables = extracted.deliverables.source;
        }

        if (
          extracted.ndaSigned?.value !== null &&
          extracted.ndaSigned?.value !== undefined
        ) {
          setFormData((prev) => ({
            ...prev,
            ndaSigned: extracted.ndaSigned.value,
          }));
          newSources.ndaSigned = extracted.ndaSigned.source;
        }

        setFieldSources(newSources);

        toast({
          title: t("customer.projects.new.toast.analysisOkTitle"),
          description: t("customer.projects.new.toast.analysisOkDesc"),
        });
      } else {
        throw new Error(
          response.error || response.message || "Document analysis failed",
        );
      }
    } catch (error: unknown) {
      const errorMessage = getUserFriendlyErrorMessage(
        error,
        "customer projects new document analysis",
      );
      setAnalysisError(errorMessage);
      setUploadedFile(null);
      toast({
        title: t("customer.projects.new.toast.analysisFailTitle"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisStage("");
    }
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setFieldSources({});
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    // Required text fields
    if (!formData.title.trim()) {
      newErrors.title = t("customer.projects.new.err.titleRequired");
    }
    if (!formData.category.trim()) {
      newErrors.category = t("customer.projects.new.err.categoryRequired");
    }
    if (!formData.description.trim()) {
      newErrors.description = t(
        "customer.projects.new.err.descriptionRequired",
      );
    }

    // Budget checks
    const minVal = Number(formData.budgetMin);
    const maxVal = Number(formData.budgetMax);

    if (!formData.budgetMin) {
      newErrors.budgetMin = t("customer.projects.new.err.budgetMinRequired");
    } else if (isNaN(minVal) || minVal <= 0) {
      newErrors.budgetMin = t("customer.projects.new.err.budgetMinPositive");
    } else if (minVal < MIN_MONETARY_AMOUNT) {
      newErrors.budgetMin = t("customer.projects.new.err.budgetMinAtLeast", {
        min: MIN_MONETARY_AMOUNT,
      });
    }

    if (!formData.budgetMax) {
      newErrors.budgetMax = t("customer.projects.new.err.budgetMaxRequired");
    } else if (isNaN(maxVal) || maxVal <= 0) {
      newErrors.budgetMax = t("customer.projects.new.err.budgetMaxPositive");
    } else if (maxVal < MIN_MONETARY_AMOUNT) {
      newErrors.budgetMax = t("customer.projects.new.err.budgetMaxAtLeast", {
        min: MIN_MONETARY_AMOUNT,
      });
    }

    // Relationship rule: min < max
    if (!newErrors.budgetMin && !newErrors.budgetMax) {
      if (minVal >= maxVal) {
        newErrors.budgetMax = t("customer.projects.new.err.budgetOrder");
      }
    }

    // Timeline check
    const timelineAmountNum = Number(formData.timelineAmount);
    if (!formData.timelineAmount) {
      newErrors.timelineAmount = t(
        "customer.projects.new.err.timelineAmountRequired",
      );
    } else if (isNaN(timelineAmountNum) || timelineAmountNum <= 0) {
      newErrors.timelineAmount = t(
        "customer.projects.new.err.timelineAmountPositive",
      );
    }

    if (!formData.timelineUnit) {
      newErrors.timelineUnit = t(
        "customer.projects.new.err.timelineUnitRequired",
      );
    }

    setErrors(newErrors);

    // valid if no keys in newErrors
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // Run client validation
    const isValid = validateForm();
    if (!isValid) {
      toast({
        title: t("customer.projects.new.toast.fixFormTitle"),
        description: t("customer.projects.new.toast.fixFormDesc"),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Build timeline data from amount and unit
      const { timeline, timelineInDays } = buildTimelineData(
        Number(formData.timelineAmount),
        formData.timelineUnit,
      );

      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        budgetMin: Number(formData.budgetMin),
        budgetMax: Number(formData.budgetMax),
        currencyCode: formData.currencyCode,
        timeline,
        timelineInDays,
        priority: formData.priority,
        skills: formData.skills,
        ndaSigned: formData.ndaSigned,
        requirements: formData.requirements.trim() || undefined, // Markdown string
        deliverables: formData.deliverables.trim() || undefined, // Markdown string
      };

      const response = await createProject(projectData);

      if (response.success) {
        toast({
          title: t("customer.projects.new.toast.createSuccessTitle"),
          description: t("customer.projects.new.toast.createSuccessDesc"),
        });
        router.push("/customer/projects");
      } else {
        throw new Error(response.message || "Failed to create service request");
      }
    } catch (error) {
      toast({
        title: t("customer.projects.new.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer projects new create",
        ),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  const handleChange = (field: keyof typeof formData, html: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: html,
    }));
    // Mark as manually edited if user changes a field
    if (fieldSources[field] !== "manual") {
      setFieldSources((prev) => ({ ...prev, [field]: "manual" }));
    }
  };
  // Soft gate: require 60% profile completion to create projects
  if (!completionLoading && !canPostProject) {
    return (
      
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl text-amber-900">
                {t("customer.projects.new.gate.title")}
              </CardTitle>
              <CardDescription>
                {t("customer.projects.new.gate.description", {
                  percent: String(POST_PROJECT_REQUIRED),
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => router.push("/customer/profile/onboarding")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {t("customer.projects.new.gate.cta")}
              </Button>
            </CardContent>
          </Card>
        </div>
      
    );
  }

  return (
    
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("customer.projects.new.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t("customer.projects.new.subtitle")}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Document Upload Section */}
            <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="p-4 sm:p-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg sm:text-xl text-blue-900">
                    {t("customer.projects.new.aiCard.title")}
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm text-blue-700">
                  {t("customer.projects.new.aiCard.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                {!uploadedFile ? (
                  <div className="space-y-4">
                    <label
                      htmlFor="document-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-blue-600" />
                        <p className="mb-2 text-sm text-gray-700">
                          <span className="font-semibold">
                            {t("customer.projects.new.upload.click")}
                          </span>{" "}
                          {t("customer.projects.new.upload.orDrag")}
                        </p>
                        <p className="text-xs text-gray-500">
                          {t("customer.projects.new.upload.hint")}
                        </p>
                      </div>
                      <input
                        id="document-upload"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                        onChange={handleDocumentUpload}
                        disabled={isAnalyzing}
                      />
                    </label>
                    {isAnalyzing && (
                      <div className="flex flex-col items-center justify-center gap-4 p-6 bg-white border-2 border-blue-200 rounded-lg">
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                          <div className="flex flex-col">
                            <span className="text-base font-semibold text-blue-900">
                              {analysisStage === "uploading"
                                ? t(
                                    "customer.projects.new.analysis.uploadingTitle",
                                  )
                                : t(
                                    "customer.projects.new.analysis.analyzingTitle",
                                  )}
                            </span>
                            <span className="text-sm text-blue-600">
                              {analysisStage === "uploading"
                                ? t(
                                    "customer.projects.new.analysis.uploadingSub",
                                  )
                                : t(
                                    "customer.projects.new.analysis.analyzingSub",
                                  )}
                            </span>
                          </div>
                        </div>
                        <div className="w-full max-w-md">
                          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full animate-pulse"
                              style={{
                                width:
                                  analysisStage === "uploading" ? "40%" : "80%",
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {analysisError && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{analysisError}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {uploadedFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      {!isAnalyzing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemoveFile}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    {isAnalyzing && (
                      <div className="flex flex-col items-center justify-center gap-4 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg">
                        <div className="flex items-center justify-center gap-3">
                          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                          <div className="flex flex-col">
                            <span className="text-lg font-semibold text-blue-900">
                              {analysisStage === "uploading"
                                ? t(
                                    "customer.projects.new.analysis.uploadingTitle",
                                  )
                                : t(
                                    "customer.projects.new.analysis.analyzingTitle",
                                  )}
                            </span>
                            <span className="text-sm text-blue-600">
                              {analysisStage === "uploading"
                                ? t(
                                    "customer.projects.new.analysis.uploadingSubSecure",
                                  )
                                : t(
                                    "customer.projects.new.analysis.analyzingSubLong",
                                  )}
                            </span>
                          </div>
                        </div>
                        <div className="w-full max-w-md">
                          <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-in-out"
                              style={{
                                width:
                                  analysisStage === "uploading" ? "40%" : "80%",
                              }}
                            ></div>
                          </div>
                        </div>
                        {analysisStage === "analyzing" && (
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <Sparkles className="w-4 h-4" />
                            <span>
                              {t(
                                "customer.projects.new.analysis.extractingHint",
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    {analysisError && !isAnalyzing && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-600">{analysisError}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  {t("customer.projects.new.form.sectionTitle")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t("customer.projects.new.form.sectionHint")}
                  {Object.keys(fieldSources).length > 0 && (
                    <span className="ml-2 text-blue-600">
                      {t("customer.projects.new.form.aiFieldsHint")}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="title" className="text-sm sm:text-base">
                      {t("customer.projects.new.field.title")}
                    </Label>
                    {fieldSources.title === "ai_suggestion" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {t("customer.projects.new.badge.aiSuggestion")}
                      </Badge>
                    )}
                    {fieldSources.title === "document" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("customer.projects.new.badge.fromDocument")}
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="title"
                    placeholder={t(
                      "customer.projects.new.placeholder.titleExample",
                    )}
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className={`text-sm sm:text-base ${
                      errors.title
                        ? "border-red-500 focus-visible:ring-red-500"
                        : fieldSources.title === "ai_suggestion"
                          ? "border-blue-300 bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500"
                          : fieldSources.title === "document"
                            ? "border-green-300 bg-green-50/50"
                            : ""
                    }`}
                  />
                  {errors.title && (
                    <p className="text-xs text-red-600">{errors.title}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="category" className="text-sm sm:text-base">
                      {t("customer.projects.new.field.category")}
                    </Label>
                    {fieldSources.category === "ai_suggestion" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {t("customer.projects.new.badge.aiSuggestion")}
                      </Badge>
                    )}
                    {fieldSources.category === "document" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("customer.projects.new.badge.fromDocument")}
                      </Badge>
                    )}
                  </div>

                  {/* 1) Pick an existing category */}
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      handleInputChange("category", value)
                    }
                  >
                    <SelectTrigger
                      className={`text-sm sm:text-base ${
                        errors.category
                          ? "border-red-500 focus:ring-red-500"
                          : fieldSources.category === "ai_suggestion"
                            ? "border-blue-300 bg-blue-50/50"
                            : fieldSources.category === "document"
                              ? "border-green-300 bg-green-50/50"
                              : ""
                      }`}
                    >
                      <SelectValue
                        placeholder={t(
                          "customer.projects.new.category.placeholder",
                        )}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-gray-500">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span>{t("customer.projects.new.category.orCreate")}</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* 2) Add a new custom category */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder={t(
                        "customer.projects.new.category.customPlaceholder",
                      )}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomCategory();
                        }
                      }}
                      className="flex-1 text-sm sm:text-base"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddCustomCategory}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      Add
                    </Button>
                  </div>

                  {errors.category && (
                    <p className="text-xs text-red-600">{errors.category}</p>
                  )}

                  <p className="text-xs text-gray-500">
                    {t("customer.projects.new.category.help")}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="description"
                      className="text-sm sm:text-base"
                    >
                      {t("customer.projects.new.field.description")}
                    </Label>
                    {fieldSources.description === "ai_suggestion" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {t("customer.projects.new.badge.aiSuggestion")}
                      </Badge>
                    )}
                    {fieldSources.description === "document" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("customer.projects.new.badge.fromDocument")}
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    id="description"
                    placeholder={t(
                      "customer.projects.new.placeholder.description",
                    )}
                    className={`min-h-[120px] text-sm sm:text-base ${
                      errors.description
                        ? "border-red-500 focus-visible:ring-red-500"
                        : fieldSources.description === "ai_suggestion"
                          ? "border-blue-300 bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500"
                          : fieldSources.description === "document"
                            ? "border-green-300 bg-green-50/50"
                            : ""
                    }`}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                  />
                  {errors.description && (
                    <p className="text-xs text-red-600">{errors.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label
                      htmlFor="currencyCode"
                      className="text-sm sm:text-base"
                    >
                      Currency
                    </Label>
                    <Select
                      value={formData.currencyCode}
                      onValueChange={(value) =>
                        handleInputChange("currencyCode", value)
                      }
                    >
                      <SelectTrigger
                        id="currencyCode"
                        className="text-sm sm:text-base w-full sm:w-56"
                      >
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        {currencyOptions.map((code) => (
                          <SelectItem key={code} value={code}>
                            {code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="budgetMin"
                        className="text-sm sm:text-base"
                      >
                        {t("customer.projects.new.field.budgetMin")}
                      </Label>
                      {fieldSources.budgetMin === "ai_suggestion" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t("customer.projects.new.badge.aiShort")}
                        </Badge>
                      )}
                      {fieldSources.budgetMin === "document" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-300"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t("customer.projects.new.badge.docShort")}
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="budgetMin"
                      type="number"
                      min={MIN_MONETARY_AMOUNT}
                      step="0.01"
                      placeholder="5000"
                      value={formData.budgetMin}
                      onChange={(e) =>
                        handleInputChange("budgetMin", e.target.value)
                      }
                      className={`text-sm sm:text-base ${
                        errors.budgetMin
                          ? "border-red-500 focus-visible:ring-red-500"
                          : fieldSources.budgetMin === "ai_suggestion"
                            ? "border-blue-300 bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500"
                            : fieldSources.budgetMin === "document"
                              ? "border-green-300 bg-green-50/50"
                              : ""
                      }`}
                    />
                    {errors.budgetMin && (
                      <p className="text-xs text-red-600">{errors.budgetMin}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor="budgetMax"
                        className="text-sm sm:text-base"
                      >
                        {t("customer.projects.new.field.budgetMax")}
                      </Label>
                      {fieldSources.budgetMax === "ai_suggestion" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t("customer.projects.new.badge.aiShort")}
                        </Badge>
                      )}
                      {fieldSources.budgetMax === "document" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-300"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t("customer.projects.new.badge.docShort")}
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="budgetMax"
                      type="number"
                      min={MIN_MONETARY_AMOUNT}
                      step="0.01"
                      placeholder="15000"
                      value={formData.budgetMax}
                      onChange={(e) =>
                        handleInputChange("budgetMax", e.target.value)
                      }
                      className={`text-sm sm:text-base ${
                        errors.budgetMax
                          ? "border-red-500 focus-visible:ring-red-500"
                          : fieldSources.budgetMax === "ai_suggestion"
                            ? "border-blue-300 bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500"
                            : fieldSources.budgetMax === "document"
                              ? "border-green-300 bg-green-50/50"
                              : ""
                      }`}
                    />
                    {errors.budgetMax && (
                      <p className="text-xs text-red-600">{errors.budgetMax}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="timeline" className="text-sm sm:text-base">
                      {t("customer.projects.new.field.timeline")}
                    </Label>
                    {(fieldSources.timelineAmount === "ai_suggestion" ||
                      fieldSources.timelineUnit === "ai_suggestion") && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {t("customer.projects.new.badge.aiSuggestion")}
                      </Badge>
                    )}
                    {(fieldSources.timelineAmount === "document" ||
                      fieldSources.timelineUnit === "document") && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("customer.projects.new.badge.fromDocument")}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {t("customer.projects.new.timeline.byMax")}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="timelineAmount"
                      type="number"
                      placeholder={t(
                        "customer.projects.new.timeline.placeholderAmount",
                      )}
                      min="1"
                      value={formData.timelineAmount}
                      onChange={(e) =>
                        handleInputChange("timelineAmount", e.target.value)
                      }
                      className={`text-sm sm:text-base ${
                        errors.timelineAmount
                          ? "border-red-500 focus-visible:ring-red-500"
                          : fieldSources.timelineAmount === "ai_suggestion"
                            ? "border-blue-300 bg-blue-50/50 focus:border-blue-500 focus:ring-blue-500"
                            : fieldSources.timelineAmount === "document"
                              ? "border-green-300 bg-green-50/50"
                              : ""
                      }`}
                    />
                    <Select
                      value={formData.timelineUnit}
                      onValueChange={(value: "day" | "week" | "month") =>
                        handleInputChange("timelineUnit", value)
                      }
                    >
                      <SelectTrigger
                        className={`text-sm sm:text-base w-full sm:w-auto ${
                          errors.timelineUnit
                            ? "border-red-500 focus:ring-red-500"
                            : fieldSources.timelineUnit === "ai_suggestion"
                              ? "border-blue-300 bg-blue-50/50"
                              : fieldSources.timelineUnit === "document"
                                ? "border-green-300 bg-green-50/50"
                                : ""
                        }`}
                      >
                        <SelectValue
                          placeholder={t(
                            "customer.projects.new.timeline.unitPlaceholder",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">
                          {t("customer.projects.new.timeline.day")}
                        </SelectItem>
                        <SelectItem value="week">
                          {t("customer.projects.new.timeline.week")}
                        </SelectItem>
                        <SelectItem value="month">
                          {t("customer.projects.new.timeline.month")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {errors.timelineAmount && (
                    <p className="text-xs text-red-600">
                      {errors.timelineAmount}
                    </p>
                  )}
                  {errors.timelineUnit && (
                    <p className="text-xs text-red-600">
                      {errors.timelineUnit}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm sm:text-base">
                      {t("customer.projects.new.field.skills")}
                    </Label>
                    {fieldSources.skills === "ai_suggestion" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {t("customer.projects.new.badge.aiSuggestion")}
                      </Badge>
                    )}
                    {fieldSources.skills === "document" && (
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-50 text-green-700 border-green-300"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {t("customer.projects.new.badge.fromDocument")}
                      </Badge>
                    )}
                  </div>

                  {/* Selected skills preview */}
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {formData.skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="default"
                          className="cursor-pointer text-xs"
                          onClick={() => handleSkillToggle(skill)}
                          title={t("customer.projects.new.skills.removeTitle")}
                        >
                          {skill} ✕
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Preset skills to click/toggle */}
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {skillOptions.map((skill) => (
                      <Badge
                        key={skill}
                        variant={
                          formData.skills.includes(skill)
                            ? "default"
                            : "outline"
                        }
                        className="cursor-pointer text-xs"
                        onClick={() => handleSkillToggle(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  {/* Add custom skill */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <Input
                      value={newSkill}
                      placeholder={t(
                        "customer.projects.new.skills.addPlaceholder",
                      )}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomSkill();
                        }
                      }}
                      className="flex-1 text-sm sm:text-base"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddCustomSkill}
                      className="w-full sm:w-auto text-xs sm:text-sm"
                    >
                      {t("customer.projects.new.skills.add")}
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500">
                    {t("customer.projects.new.skills.help")}
                  </p>
                </div>

                <Separator />

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-sm sm:text-base">
                    {t("customer.projects.new.additionalOptions")}
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm sm:text-base">
                      {t("customer.projects.new.field.priority")}
                    </Label>
                    <Select
                      value={formData.priority}
                      onValueChange={(value) =>
                        handleInputChange("priority", value)
                      }
                    >
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue
                          placeholder={t(
                            "customer.projects.new.priority.placeholder",
                          )}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          {t("customer.projects.new.priority.low")}
                        </SelectItem>
                        <SelectItem value="medium">
                          {t("customer.projects.new.priority.medium")}
                        </SelectItem>
                        <SelectItem value="high">
                          {t("customer.projects.new.priority.high")}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="nda"
                      checked={formData.ndaSigned}
                      onCheckedChange={(checked) =>
                        handleInputChange("ndaSigned", checked)
                      }
                      className="mt-1"
                    />
                    <Label
                      htmlFor="nda"
                      className="text-xs sm:text-sm leading-relaxed"
                    >
                      {t("customer.projects.new.nda")}
                    </Label>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm sm:text-base">
                        {t("customer.projects.new.field.requirements")}
                      </label>
                      {fieldSources.requirements === "ai_suggestion" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t("customer.projects.new.badge.aiSuggestion")}
                        </Badge>
                      )}
                      {fieldSources.requirements === "document" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-300"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t("customer.projects.new.badge.fromDocument")}
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`text-sm sm:text-base ${fieldSources.requirements === "ai_suggestion" ? "border-2 border-blue-300 rounded" : fieldSources.requirements === "document" ? "border-2 border-green-300 rounded" : ""}`}
                    >
                      <RichEditor
                        content={formData.requirements}
                        onChange={(html) => handleChange("requirements", html)}
                        placeholder={t(
                          "customer.projects.new.editor.placeholder.requirements",
                        )}
                        initialHeight={300}
                        style={{
                          border:
                            fieldSources.requirements === "ai_suggestion"
                              ? "1px solid #93c5fd"
                              : fieldSources.requirements === "document"
                                ? "1px solid #86efac"
                                : "1px solid #ccc",
                          padding: "8px",
                          backgroundColor:
                            fieldSources.requirements === "ai_suggestion"
                              ? "#eff6ff"
                              : fieldSources.requirements === "document"
                                ? "#f0fdf4"
                                : "white",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm sm:text-base">
                        Deliverables
                      </label>
                      {fieldSources.deliverables === "ai_suggestion" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-blue-50 text-blue-700 border-blue-300"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          {t("customer.projects.new.badge.aiSuggestion")}
                        </Badge>
                      )}
                      {fieldSources.deliverables === "document" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-300"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          {t("customer.projects.new.badge.fromDocument")}
                        </Badge>
                      )}
                    </div>
                    <div
                      className={`text-sm sm:text-base ${fieldSources.deliverables === "ai_suggestion" ? "border-2 border-blue-300 rounded" : fieldSources.deliverables === "document" ? "border-2 border-green-300 rounded" : ""}`}
                    >
                      <RichEditor
                        content={formData.deliverables}
                        initialHeight={300}
                        onChange={(html) => handleChange("deliverables", html)}
                        placeholder={t(
                          "customer.projects.new.editor.placeholder.deliverables",
                        )}
                        style={{
                          border:
                            fieldSources.deliverables === "ai_suggestion"
                              ? "1px solid #93c5fd"
                              : fieldSources.deliverables === "document"
                                ? "1px solid #86efac"
                                : "1px solid #ccc",
                          padding: "8px",
                          backgroundColor:
                            fieldSources.deliverables === "ai_suggestion"
                              ? "#eff6ff"
                              : fieldSources.deliverables === "document"
                                ? "#f0fdf4"
                                : "white",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {Object.keys(errors).length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm font-medium">
                  {t("customer.projects.new.validation.banner")}
                </p>
                <p className="text-red-600 text-sm mt-0.5">
                  {t("customer.projects.new.validation.fix")}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                onClick={handleSubmit}
                className="flex-1 text-xs sm:text-sm"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                )}
                {loading
                  ? t("customer.projects.new.submit.creating")
                  : t("customer.projects.new.submit.cta")}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                  {t("customer.projects.new.sidebar.protection")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">
                      {t("customer.projects.new.sidebar.escrowTitle")}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {t("customer.projects.new.sidebar.escrowBody")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">
                      {t("customer.projects.new.sidebar.verifiedTitle")}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {t("customer.projects.new.sidebar.verifiedBody")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">
                      {t("customer.projects.new.sidebar.disputeTitle")}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {t("customer.projects.new.sidebar.disputeBody")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  {t("customer.projects.new.sidebar.nextTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">
                      {t("customer.projects.new.sidebar.step1Title")}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {t("customer.projects.new.sidebar.step1Body")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">
                      {t("customer.projects.new.sidebar.step2Title")}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {t("customer.projects.new.sidebar.step2Body")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">
                      {t("customer.projects.new.sidebar.step3Title")}
                    </h4>
                    <p className="text-xs text-gray-600">
                      {t("customer.projects.new.sidebar.step3Body")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                  {t("customer.projects.new.sidebar.tipsTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                <div className="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                  <p className="font-medium">
                    {t("customer.projects.new.sidebar.tip1Title")}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {t("customer.projects.new.sidebar.tip1Body")}
                  </p>
                </div>
                <div className="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                  <p className="font-medium">
                    {t("customer.projects.new.sidebar.tip2Title")}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {t("customer.projects.new.sidebar.tip2Body")}
                  </p>
                </div>
                <div className="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                  <p className="font-medium">
                    {t("customer.projects.new.sidebar.tip3Title")}
                  </p>
                  <p className="text-gray-600 text-xs">
                    {t("customer.projects.new.sidebar.tip3Body")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    
  );
}
