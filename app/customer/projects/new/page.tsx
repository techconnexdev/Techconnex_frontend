"use client";

import { useState } from "react";
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
import { CustomerLayout } from "@/components/customer-layout";
import { createProject, analyzeProjectDocument } from "@/lib/api";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { buildTimelineData } from "@/lib/timeline-utils";
import { RichEditor } from "@/components/markdown/RichTextEditor";

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    budgetMin: "",
    budgetMax: "",
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
  const [fieldSources, setFieldSources] = useState<Record<string, "document" | "ai_suggestion" | "missing" | "manual">>({});
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

  // categories the user can pick from
  const [categories, setCategories] = useState([
    { value: "WEB_DEVELOPMENT", label: "Web Development" },
    { value: "MOBILE_APP_DEVELOPMENT", label: "Mobile App Development" },
    { value: "CLOUD_SERVICES", label: "Cloud Services" },
    { value: "IOT_SOLUTIONS", label: "IoT Solutions" },
    { value: "DATA_ANALYTICS", label: "Data Analytics" },
    { value: "CYBERSECURITY", label: "Cybersecurity" },
    { value: "UI_UX_DESIGN", label: "UI/UX Design" },
    { value: "DEVOPS", label: "DevOps" },
    { value: "AI_ML_SOLUTIONS", label: "AI/ML Solutions" },
    { value: "SYSTEM_INTEGRATION", label: "System Integration" },
  ]);

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
      (s) => s.toLowerCase() === cleaned.toLowerCase()
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
      (c) => c.label.toLowerCase() === cleaned.toLowerCase()
    );
    if (!exists) {
      setCategories((prev) => [...prev, newOption]);
    }

    // Also set this as the active form category
    setFormData((prev) => ({
      ...prev,
      category: newOption.value,
    }));

    // Clear the input
    setNewCategory("");
  };

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    const allowedExtensions = [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt"];
    const fileExt = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt)) {
      toast({
        title: "Invalid file type",
        description: "Please upload PDF, Word, Excel, or TXT files only.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (50MB max for documents)
    const maxSize = 50 * 1024 * 1024; // 50 MB
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: `Maximum file size is ${(maxSize / (1024 * 1024)).toFixed(0)} MB`,
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
        const newSources: Record<string, "document" | "ai_suggestion" | "missing"> = {};

        // Auto-fill form with extracted data
        if (extracted.title?.value) {
          setFormData((prev) => ({ ...prev, title: extracted.title.value }));
          newSources.title = extracted.title.source;
        }

        if (extracted.description?.value) {
          setFormData((prev) => ({ ...prev, description: extracted.description.value }));
          newSources.description = extracted.description.source;
        }

        if (extracted.category?.value) {
          setFormData((prev) => ({ ...prev, category: extracted.category.value }));
          newSources.category = extracted.category.source;
        }

        if (extracted.budgetMin?.value !== null && extracted.budgetMin?.value !== undefined) {
          setFormData((prev) => ({ ...prev, budgetMin: extracted.budgetMin.value.toString() }));
          newSources.budgetMin = extracted.budgetMin.source;
        }

        if (extracted.budgetMax?.value !== null && extracted.budgetMax?.value !== undefined) {
          setFormData((prev) => ({ ...prev, budgetMax: extracted.budgetMax.value.toString() }));
          newSources.budgetMax = extracted.budgetMax.source;
        }

        if (extracted.timelineAmount?.value !== null && extracted.timelineAmount?.value !== undefined) {
          setFormData((prev) => ({ ...prev, timelineAmount: extracted.timelineAmount.value.toString() }));
          newSources.timelineAmount = extracted.timelineAmount.source;
        }

        if (extracted.timelineUnit?.value) {
          setFormData((prev) => ({ ...prev, timelineUnit: extracted.timelineUnit.value }));
          newSources.timelineUnit = extracted.timelineUnit.source;
        }

        if (extracted.skills?.value && Array.isArray(extracted.skills.value)) {
          setFormData((prev) => ({ ...prev, skills: extracted.skills.value }));
          newSources.skills = extracted.skills.source;
        }

        if (extracted.priority?.value) {
          setFormData((prev) => ({ ...prev, priority: extracted.priority.value }));
          newSources.priority = extracted.priority.source;
        }

        if (extracted.requirements?.value) {
          setFormData((prev) => ({ ...prev, requirements: extracted.requirements.value }));
          newSources.requirements = extracted.requirements.source;
        }

        if (extracted.deliverables?.value) {
          setFormData((prev) => ({ ...prev, deliverables: extracted.deliverables.value }));
          newSources.deliverables = extracted.deliverables.source;
        }

        if (extracted.ndaSigned?.value !== null && extracted.ndaSigned?.value !== undefined) {
          setFormData((prev) => ({ ...prev, ndaSigned: extracted.ndaSigned.value }));
          newSources.ndaSigned = extracted.ndaSigned.source;
        }

        setFieldSources(newSources);

        toast({
          title: "Document analyzed successfully",
          description: "Form has been auto-filled. Review and adjust as needed.",
        });
      } else {
        throw new Error(response.error || response.message || "Document analysis failed");
      }
    } catch (error: unknown) {
      console.error("Document analysis error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to analyze document. Please try again.";
      setAnalysisError(errorMessage);
      setUploadedFile(null); // Reset file on error
      toast({
        title: "Analysis failed",
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
      newErrors.title = "Project title is required.";
    }
    if (!formData.category.trim()) {
      newErrors.category = "Please select a category.";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Project description is required.";
    }

    // Budget checks
    const minVal = Number(formData.budgetMin);
    const maxVal = Number(formData.budgetMax);

    if (!formData.budgetMin) {
      newErrors.budgetMin = "Minimum budget is required.";
    } else if (isNaN(minVal) || minVal <= 0) {
      newErrors.budgetMin = "Minimum budget must be a positive number.";
    }

    if (!formData.budgetMax) {
      newErrors.budgetMax = "Maximum budget is required.";
    } else if (isNaN(maxVal) || maxVal <= 0) {
      newErrors.budgetMax = "Maximum budget must be a positive number.";
    }

    // Relationship rule: min < max
    if (!newErrors.budgetMin && !newErrors.budgetMax) {
      if (minVal >= maxVal) {
        newErrors.budgetMax =
          "Maximum budget must be greater than minimum budget.";
      }
    }

    // Timeline check
    const timelineAmountNum = Number(formData.timelineAmount);
    if (!formData.timelineAmount) {
      newErrors.timelineAmount = "Timeline amount is required.";
    } else if (isNaN(timelineAmountNum) || timelineAmountNum <= 0) {
      newErrors.timelineAmount = "Timeline amount must be greater than 0.";
    }

    if (!formData.timelineUnit) {
      newErrors.timelineUnit = "Timeline unit is required.";
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
        title: "Please fix the form",
        description: "Some fields need your attention.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Build timeline data from amount and unit
      const { timeline, timelineInDays } = buildTimelineData(
        Number(formData.timelineAmount),
        formData.timelineUnit
      );

      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        budgetMin: Number(formData.budgetMin),
        budgetMax: Number(formData.budgetMax),
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
          title: "Success",
          description: "Service request created successfully!",
        });
        router.push("/customer/projects");
      } else {
        throw new Error(response.message || "Failed to create service request");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to create service request",
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
  return (
    <CustomerLayout>
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">

          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Create New Project
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Tell us about your ICT project and we&apos;ll find the perfect match
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
                    AI-Powered Document Analysis
                  </CardTitle>
                </div>
                <CardDescription className="text-xs sm:text-sm text-blue-700">
                  Upload your project proposal, requirements document, or project brief (PDF, Word, Excel, TXT) and we&apos;ll auto-fill the form for you
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
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PDF, Word, Excel, or TXT (MAX. 50MB)
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
                                ? "Uploading document to cloud..." 
                                : "AI is analyzing your document..."}
                            </span>
                            <span className="text-sm text-blue-600">
                              {analysisStage === "uploading" 
                                ? "Please wait while we upload your file" 
                                : "This may take a few moments"}
                            </span>
                          </div>
                        </div>
                        <div className="w-full max-w-md">
                          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: analysisStage === "uploading" ? "40%" : "80%" }}></div>
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
                          <p className="text-sm font-medium text-gray-900">{uploadedFile.name}</p>
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
                                ? "Uploading document to cloud..." 
                                : "AI is analyzing your document..."}
                            </span>
                            <span className="text-sm text-blue-600">
                              {analysisStage === "uploading" 
                                ? "Please wait while we upload your file securely" 
                                : "Extracting project information, this may take a few moments"}
                            </span>
                          </div>
                        </div>
                        <div className="w-full max-w-md">
                          <div className="h-2.5 bg-blue-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500 ease-in-out" 
                              style={{ width: analysisStage === "uploading" ? "40%" : "80%" }}
                            ></div>
                          </div>
                        </div>
                        {analysisStage === "analyzing" && (
                          <div className="flex items-center gap-2 text-xs text-blue-600">
                            <Sparkles className="w-4 h-4" />
                            <span>AI is extracting project details, budget, timeline, and requirements...</span>
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
                <CardTitle className="text-lg sm:text-xl">Project Details</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Provide clear information about your project requirements
                  {Object.keys(fieldSources).length > 0 && (
                    <span className="ml-2 text-blue-600">
                      • Fields highlighted in blue are AI suggestions
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                  <Label htmlFor="title" className="text-sm sm:text-base">Project Title</Label>
                    {fieldSources.title === "ai_suggestion" && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Suggestion
                      </Badge>
                    )}
                    {fieldSources.title === "document" && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        From Document
                      </Badge>
                    )}
                  </div>
                  <Input
                    id="title"
                    placeholder="e.g., E-commerce Mobile App Development"
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
                  <Label htmlFor="category" className="text-sm sm:text-base">Category</Label>
                    {fieldSources.category === "ai_suggestion" && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Suggestion
                      </Badge>
                    )}
                    {fieldSources.category === "document" && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        From Document
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
                      <SelectValue placeholder="Select project category" />
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
                    <span>or create your own</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>

                  {/* 2) Add a new custom category */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="e.g. POS Integration for Retail"
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
                    Choose a category OR type a new one. This helps us match you
                    with the right providers.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                  <Label htmlFor="description" className="text-sm sm:text-base">Project Description</Label>
                    {fieldSources.description === "ai_suggestion" && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Suggestion
                      </Badge>
                    )}
                    {fieldSources.description === "document" && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        From Document
                      </Badge>
                    )}
                  </div>
                  <Textarea
                    id="description"
                    placeholder="Describe your project in detail..."
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
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                    <Label htmlFor="budgetMin" className="text-sm sm:text-base">Minimum Budget (RM)</Label>
                      {fieldSources.budgetMin === "ai_suggestion" && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                      {fieldSources.budgetMin === "document" && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Doc
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="budgetMin"
                      type="number"
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
                    <Label htmlFor="budgetMax" className="text-sm sm:text-base">Maximum Budget (RM)</Label>
                      {fieldSources.budgetMax === "ai_suggestion" && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI
                        </Badge>
                      )}
                      {fieldSources.budgetMax === "document" && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Doc
                        </Badge>
                      )}
                    </div>
                    <Input
                      id="budgetMax"
                      type="number"
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
                  <Label htmlFor="timeline" className="text-sm sm:text-base">Project Timeline *</Label>
                    {(fieldSources.timelineAmount === "ai_suggestion" || fieldSources.timelineUnit === "ai_suggestion") && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Suggestion
                      </Badge>
                    )}
                    {(fieldSources.timelineAmount === "document" || fieldSources.timelineUnit === "document") && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        From Document
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="timelineAmount"
                      type="number"
                      placeholder="e.g. 2"
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
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day(s)</SelectItem>
                        <SelectItem value="week">Week(s)</SelectItem>
                        <SelectItem value="month">Month(s)</SelectItem>
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
                  <Label className="text-sm sm:text-base">Required Skills</Label>
                    {fieldSources.skills === "ai_suggestion" && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                        <Sparkles className="w-3 h-3 mr-1" />
                        AI Suggestion
                      </Badge>
                    )}
                    {fieldSources.skills === "document" && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        From Document
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
                          title="Click to remove"
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
                      placeholder="Add a required skill (e.g. Laravel, PenTesting, POS integration)"
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
                      Add
                    </Button>
                  </div>

                  <p className="text-xs text-gray-500">
                    Click a badge to select / unselect. You can also type your
                    own skill and press Enter.
                  </p>
                </div>

                <Separator />

                <div className="space-y-3 sm:space-y-4">
                  <h3 className="font-semibold text-sm sm:text-base">Additional Options</h3>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-sm sm:text-base">Project Priority</Label>
                    <Select
                      onValueChange={(value) =>
                        handleInputChange("priority", value)
                      }
                    >
                      <SelectTrigger className="text-sm sm:text-base">
                        <SelectValue placeholder="Select priority level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">
                          Low - Flexible timeline
                        </SelectItem>
                        <SelectItem value="medium">
                          Medium - Standard timeline
                        </SelectItem>
                        <SelectItem value="high">
                          High - Urgent delivery
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
                    <Label htmlFor="nda" className="text-xs sm:text-sm leading-relaxed">
                      This project requires an NDA (Non-Disclosure Agreement)
                    </Label>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm sm:text-base">Requirements</label>
                      {fieldSources.requirements === "ai_suggestion" && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Suggestion
                        </Badge>
                      )}
                      {fieldSources.requirements === "document" && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          From Document
                        </Badge>
                      )}
                    </div>
                    <div className={`text-sm sm:text-base ${fieldSources.requirements === "ai_suggestion" ? "border-2 border-blue-300 rounded" : fieldSources.requirements === "document" ? "border-2 border-green-300 rounded" : ""}`}>
                      <RichEditor
                        content={formData.requirements}
                        onChange={(html) => handleChange("requirements", html)}
                        placeholder="Enter your requirements …"
                        initialHeight={300}
                        style={{
                          border: fieldSources.requirements === "ai_suggestion" ? "1px solid #93c5fd" : fieldSources.requirements === "document" ? "1px solid #86efac" : "1px solid #ccc",
                          padding: "8px",
                          backgroundColor: fieldSources.requirements === "ai_suggestion" ? "#eff6ff" : fieldSources.requirements === "document" ? "#f0fdf4" : "white",
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-sm sm:text-base">Deliverables</label>
                      {fieldSources.deliverables === "ai_suggestion" && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-300">
                          <Sparkles className="w-3 h-3 mr-1" />
                          AI Suggestion
                        </Badge>
                      )}
                      {fieldSources.deliverables === "document" && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          From Document
                        </Badge>
                      )}
                    </div>
                    <div className={`text-sm sm:text-base ${fieldSources.deliverables === "ai_suggestion" ? "border-2 border-blue-300 rounded" : fieldSources.deliverables === "document" ? "border-2 border-green-300 rounded" : ""}`}>
                      <RichEditor
                        content={formData.deliverables}
                        initialHeight={300}
                        onChange={(html) => handleChange("deliverables", html)}
                        placeholder="Enter your deliverables …"
                        style={{
                          border: fieldSources.deliverables === "ai_suggestion" ? "1px solid #93c5fd" : fieldSources.deliverables === "document" ? "1px solid #86efac" : "1px solid #ccc",
                          padding: "8px",
                          backgroundColor: fieldSources.deliverables === "ai_suggestion" ? "#eff6ff" : fieldSources.deliverables === "document" ? "#f0fdf4" : "white",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

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
                {loading ? "Creating..." : "Find ICT Professionals"}
              </Button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                  Project Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">Escrow Payment</h4>
                    <p className="text-xs text-gray-600">
                      Your payment is held securely until milestones are
                      completed
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">
                      Verified Professionals
                    </h4>
                    <p className="text-xs text-gray-600">
                      All providers undergo KYC and skill verification
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">
                      Dispute Resolution
                    </h4>
                    <p className="text-xs text-gray-600">
                      24/7 support and mediation services
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                  What Happens Next?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">AI Matching</h4>
                    <p className="text-xs text-gray-600">
                      Our AI finds the best professionals for your project
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">Review Proposals</h4>
                    <p className="text-xs text-gray-600">
                      Compare profiles, portfolios, and proposals
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-600 flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm">Start Project</h4>
                    <p className="text-xs text-gray-600">
                      Choose your provider and begin collaboration
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 flex-shrink-0" />
                  Tips for Success
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
                <div className="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                  <p className="font-medium">
                    Be specific about your requirements
                  </p>
                  <p className="text-gray-600 text-xs">
                    Clear project descriptions get better matches and proposals
                  </p>
                </div>
                <div className="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                  <p className="font-medium">Set realistic budgets</p>
                  <p className="text-gray-600 text-xs">
                    Quality work requires fair compensation
                  </p>
                </div>
                <div className="text-xs sm:text-sm space-y-1.5 sm:space-y-2">
                  <p className="font-medium">Include examples or references</p>
                  <p className="text-gray-600 text-xs">
                    Visual references help professionals understand your vision
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
