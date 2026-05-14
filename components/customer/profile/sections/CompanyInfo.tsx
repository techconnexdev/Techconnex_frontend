"use client";

import Image from "next/image";
import {
  Heart,
  Image as ImageIcon,
  X,
  Plus,
  Download,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "@/lib/toast";
import {
  uploadCompanyMediaGalleryImages,
  getCompanyProfileCompletion,
  getProfileImageUrl,
} from "@/lib/api";
import { MediaImage } from "@/components/ui/media-image";
import type { ProfileData } from "../types";
import { useI18n } from "@/contexts/I18nProvider";
import {
  PROFILE_COMPANY_SIZE,
  PROFILE_CONTRACT,
  PROFILE_CORE_VALUE,
  PROFILE_FUNDING,
  PROFILE_HIRE_CATEGORY,
  PROFILE_HIRING_FREQ,
  PROFILE_INDUSTRY,
  PROFILE_REMOTE,
  profileStoredLabel,
} from "@/lib/i18n/customerProfileOptionMaps";

type Props = {
  value: ProfileData;
  onChange: (next: ProfileData) => void;
  isEditing: boolean;
  onCompletionUpdate?: (completion: number, suggestions: string[]) => void;
};

export default function CompanyInfo({
  value,
  onChange,
  isEditing,
  onCompletionUpdate,
}: Props) {
  // State for input fields
  const [customCategory, setCustomCategory] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [newMediaUrl, setNewMediaUrl] = useState("");
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { t } = useI18n();

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Helper to handle array inputs
  const handleArrayInput = (
    field:
      | "preferredContractTypes"
      | "categoriesHiringFor"
      | "values"
      | "mediaGallery"
      | "socialLinks",
    newValue: string[]
  ) => {
    onChange({
      ...value,
      customerProfile: {
        ...(value.customerProfile || {}),
        [field]: newValue,
      },
    });
  };

  const addArrayItem = (
    field:
      | "preferredContractTypes"
      | "categoriesHiringFor"
      | "values"
      | "mediaGallery"
      | "socialLinks",
    item: string
  ) => {
    if (!item.trim()) return;
    const current = value.customerProfile?.[field] || [];
    if (!current.includes(item.trim())) {
      handleArrayInput(field, [...current, item.trim()]);
    }
    // Clear input after adding
    if (field === "categoriesHiringFor") setCustomCategory("");
    if (field === "values") setCustomValue("");
    if (field === "mediaGallery") setNewMediaUrl("");
  };

  const removeArrayItem = (
    field:
      | "preferredContractTypes"
      | "categoriesHiringFor"
      | "values"
      | "mediaGallery"
      | "socialLinks",
    index: number
  ) => {
    const current = value.customerProfile?.[field] || [];
    handleArrayInput(
      field,
      current.filter((_, i) => i !== index)
    );
  };

  const toggleArrayItem = (
    field: "preferredContractTypes" | "categoriesHiringFor" | "values",
    item: string
  ) => {
    const current = value.customerProfile?.[field] || [];
    if (current.includes(item)) {
      handleArrayInput(
        field,
        current.filter((i) => i !== item)
      );
    } else {
      handleArrayInput(field, [...current, item]);
    }
  };

  const handleAddCustomCategory = () => {
    if (
      customCategory.trim() &&
      !value.customerProfile?.categoriesHiringFor?.includes(
        customCategory.trim()
      )
    ) {
      addArrayItem("categoriesHiringFor", customCategory.trim());
    }
  };

  const handleAddCustomValue = () => {
    if (
      customValue.trim() &&
      !value.customerProfile?.values?.includes(customValue.trim())
    ) {
      addArrayItem("values", customValue.trim());
    }
  };

  const handleAddMediaUrl = () => {
    const MAX_IMAGES = 10;
    const currentCount = value.customerProfile?.mediaGallery?.length || 0;

    if (currentCount >= MAX_IMAGES) {
      toast.error(
        t("customer.profile.company.toast.maxImages", { max: MAX_IMAGES }),
      );
      setNewMediaUrl("");
      return;
    }

    if (
      newMediaUrl.trim() &&
      !value.customerProfile?.mediaGallery?.includes(newMediaUrl.trim())
    ) {
      addArrayItem("mediaGallery", newMediaUrl.trim());
    }
  };

  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const MAX_MEDIA_IMAGES = 10;
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  const processMediaFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const currentCount = value.customerProfile?.mediaGallery?.length || 0;

    if (currentCount >= MAX_MEDIA_IMAGES) {
      toast.error(
        t("customer.profile.company.toast.maxImages", {
          max: MAX_MEDIA_IMAGES,
        }),
      );
      return;
    }

    if (currentCount + files.length > MAX_MEDIA_IMAGES) {
      const allowed = MAX_MEDIA_IMAGES - currentCount;
      toast.error(
        t("customer.profile.company.toast.addMore", {
          n: allowed,
          max: MAX_MEDIA_IMAGES,
        }),
      );
      return;
    }

    const invalidFiles = files.filter(
      (file) => !ALLOWED_IMAGE_TYPES.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      toast.error(t("customer.profile.company.toast.imagesOnly"));
      return;
    }

    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error(t("customer.profile.company.toast.exceeds10mb"));
      return;
    }

    try {
      setUploadingMedia(true);
      const response = await uploadCompanyMediaGalleryImages(files);

      if (response.success && response.data?.mediaGallery) {
        onChange({
          ...value,
          customerProfile: {
            ...(value.customerProfile || {}),
            mediaGallery: response.data.mediaGallery,
          },
        });
        toast.success(
          t("customer.profile.company.toast.uploadedCount", {
            n: files.length,
          }),
        );
        if (onCompletionUpdate) {
          try {
            const completionResponse = await getCompanyProfileCompletion();
            if (completionResponse.success) {
              onCompletionUpdate(
                completionResponse.data.completion || 0,
                completionResponse.data.suggestions || []
              );
            }
          } catch (error) {
            console.error("Failed to fetch completion:", error);
          }
        }
      } else {
        toast.error(
          response.message || t("customer.profile.company.toast.uploadFailed"),
        );
      }
    } catch (error: unknown) {
      toast.error(
        getUserFriendlyErrorMessage(error, "customer profile company images"),
      );
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleMediaImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    await processMediaFiles(files);
    event.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadingMedia || (value.customerProfile?.mediaGallery?.length || 0) >= MAX_MEDIA_IMAGES) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (uploadingMedia || (value.customerProfile?.mediaGallery?.length || 0) >= MAX_MEDIA_IMAGES) return;
    const items = e.dataTransfer?.items;
    const files: File[] = [];
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file && ALLOWED_IMAGE_TYPES.includes(file.type)) files.push(file);
        }
      }
    } else {
      const dropped = Array.from(e.dataTransfer?.files || []);
      files.push(...dropped.filter((f) => ALLOWED_IMAGE_TYPES.includes(f.type)));
    }
    if (files.length > 0) await processMediaFiles(files);
  };

  const handleRemoveMediaItem = (index: number) => {
    const current = value.customerProfile?.mediaGallery || [];
    const updated = current.filter((_, i) => i !== index);
    handleArrayInput("mediaGallery", updated);

    // Optionally, we could also delete the file from the server here
    // For now, we just remove it from the array
  };

  const handleDownloadMedia = (url: string) => {
    // Check if it's a local file path or external URL
    const isLocalPath =
      url.startsWith("/uploads/") || url.startsWith("uploads/");
    const downloadUrl = isLocalPath
      ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${
          url.startsWith("/") ? "" : "/"
        }${url}`
      : url;

    // Create a temporary anchor element to trigger download
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = url.split("/").pop() || "image";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getMediaUrl = (url: string) => {
    // Use the same helper as profile images for consistency
    return getProfileImageUrl(url);
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    const images = value.customerProfile?.mediaGallery || [];
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    const images = value.customerProfile?.mediaGallery || [];
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        const images = value.customerProfile?.mediaGallery || [];
        setCurrentImageIndex((prev) =>
          prev > 0 ? prev - 1 : images.length - 1
        );
      } else if (e.key === "ArrowRight") {
        const images = value.customerProfile?.mediaGallery || [];
        setCurrentImageIndex((prev) =>
          prev < images.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, value.customerProfile?.mediaGallery]);

  const isImageUrl = (url: string) => {
    if (!url) return false;
    // Check if it's an image file extension or data URL
    return (
      /\.(jpg|jpeg|png|gif|webp)$/i.test(url) ||
      url.includes("image") ||
      url.startsWith("data:image")
    );
  };

  // Popular categories and values (same as registration form)
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

  const contractTypeOptions = [
    "Fixed Price",
    "Time & Materials",
    "Monthly Retainer",
    "Milestone-based",
    "Hourly",
  ];

  const fundingStageOptions = [
    "Bootstrap",
    "Seed",
    "Series A",
    "Series B",
    "Series C",
    "Private Equity",
    "Public",
    "Other",
  ];

  const remotePolicyOptions = ["Fully Remote", "Hybrid", "On-site", "Flexible"];

  const hiringFrequencyOptions = [
    "Occasional",
    "Regular",
    "Project-based",
    "Enterprise",
    "One-time",
  ];

  const industryOptions = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Manufacturing",
    "Retail",
    "Government",
    "Consulting",
    "Real Estate",
    "Other",
  ];

  const companySizeValues = [
    "1-10",
    "11-50",
    "51-200",
    "201-1000",
    "1000+",
    "150",
  ] as const;

  const editableCardClass = isEditing
    ? "ring-2 ring-blue-300 border-blue-200 bg-blue-50/30"
    : "";
  const editableBadge = isEditing ? (
    <span className="text-xs font-normal text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
      {t("customer.profile.company.editableBadge")}
    </span>
  ) : null;

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Business Profile */}
      <Card className={editableCardClass}>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            {t("customer.profile.company.card.businessTitle")}
            {editableBadge}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t("customer.profile.company.card.businessDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label>{t("customer.profile.company.label.industry")}</Label>
              {isEditing ? (
                <Select
                  value={value.customerProfile?.industry || ""}
                  onValueChange={(v) =>
                    onChange({
                      ...value,
                      customerProfile: {
                        ...(value.customerProfile || {}),
                        industry: v,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("customer.profile.company.ph.industry")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {industryOptions.map((i) => (
                      <SelectItem key={i} value={i}>
                        {profileStoredLabel(PROFILE_INDUSTRY, i, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2">
                  {value.customerProfile?.industry
                    ? profileStoredLabel(
                        PROFILE_INDUSTRY,
                        value.customerProfile.industry,
                        t,
                      )
                    : t("customer.profile.na")}
                </p>
              )}
            </div>
            <div>
              <Label>{t("customer.profile.company.label.companySize")}</Label>
              {isEditing ? (
                <Select
                  value={value.customerProfile?.companySize || ""}
                  onValueChange={(v) =>
                    onChange({
                      ...value,
                      customerProfile: {
                        ...(value.customerProfile || {}),
                        companySize: v,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("customer.profile.company.ph.companySize")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizeValues.map((size) => (
                      <SelectItem key={size} value={size}>
                        {profileStoredLabel(PROFILE_COMPANY_SIZE, size, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2">
                  {value.customerProfile?.companySize
                    ? profileStoredLabel(
                        PROFILE_COMPANY_SIZE,
                        value.customerProfile.companySize,
                        t,
                      )
                    : t("customer.profile.na")}
                </p>
              )}
            </div>
            <div>
              <Label>{t("customer.profile.company.label.employeeCount")}</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={value.customerProfile?.employeeCount || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      customerProfile: {
                        ...(value.customerProfile || {}),
                        employeeCount: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="150"
                />
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2">
                  {value.customerProfile?.employeeCount || t("customer.profile.na")}
                </p>
              )}
            </div>
            <div>
              <Label>{t("customer.profile.company.label.establishedYear")}</Label>
              {isEditing ? (
                <Input
                  type="number"
                  min="1800"
                  max={new Date().getFullYear()}
                  value={value.customerProfile?.establishedYear || ""}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      customerProfile: {
                        ...(value.customerProfile || {}),
                        establishedYear: parseInt(e.target.value) || 0,
                      },
                    })
                  }
                  placeholder="2025"
                />
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2">
                  {value.customerProfile?.establishedYear ||
                    t("customer.profile.na")}
                </p>
              )}
            </div>
            <div>
              <Label>{t("customer.profile.company.label.annualRevenue")}</Label>
              {isEditing ? (
                <>
                  <Input
                    type="text"
                    value={value.customerProfile?.annualRevenue || ""}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        customerProfile: {
                          ...(value.customerProfile || {}),
                          annualRevenue: e.target.value,
                        },
                      })
                    }
                    placeholder="500000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t("customer.profile.company.hint.revenueCurrency")}
                  </p>
                </>
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2">
                  {value.customerProfile?.annualRevenue || t("customer.profile.na")}
                </p>
              )}
            </div>
            <div>
              <Label>{t("customer.profile.company.label.fundingStage")}</Label>
              {isEditing ? (
                <Select
                  value={value.customerProfile?.fundingStage || ""}
                  onValueChange={(v) =>
                    onChange({
                      ...value,
                      customerProfile: {
                        ...(value.customerProfile || {}),
                        fundingStage: v,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("customer.profile.company.ph.fundingStage")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {fundingStageOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {profileStoredLabel(PROFILE_FUNDING, option, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2">
                  {value.customerProfile?.fundingStage
                    ? profileStoredLabel(
                        PROFILE_FUNDING,
                        value.customerProfile.fundingStage,
                        t,
                      )
                    : t("customer.profile.na")}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hiring Preferences */}
      <Card className={editableCardClass}>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            {t("customer.profile.company.card.hiringTitle")}
            {editableBadge}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t("customer.profile.company.card.hiringDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Average Budget Range</Label>
              {isEditing ? (
                <>
                  <Input
                    type="text"
                    value={value.customerProfile?.averageBudgetRange || ""}
                    onChange={(e) =>
                      onChange({
                        ...value,
                        customerProfile: {
                          ...(value.customerProfile || {}),
                          averageBudgetRange: e.target.value,
                        },
                      })
                    }
                    placeholder="20000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Average project budget
                  </p>
                </>
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2">
                  {value.customerProfile?.averageBudgetRange || "N/A"}
                </p>
              )}
            </div>
            <div>
              <Label>Remote Policy</Label>
              {isEditing ? (
                <Select
                  value={value.customerProfile?.remotePolicy || ""}
                  onValueChange={(v) =>
                    onChange({
                      ...value,
                      customerProfile: {
                        ...(value.customerProfile || {}),
                        remotePolicy: v,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("customer.profile.company.ph.remotePolicy")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {remotePolicyOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {profileStoredLabel(PROFILE_REMOTE, option, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2">
                  {value.customerProfile?.remotePolicy
                    ? profileStoredLabel(
                        PROFILE_REMOTE,
                        value.customerProfile.remotePolicy,
                        t,
                      )
                    : t("customer.profile.na")}
                </p>
              )}
            </div>
            <div>
              <Label>{t("customer.profile.company.label.hiringFrequency")}</Label>
              {isEditing ? (
                <Select
                  value={value.customerProfile?.hiringFrequency || ""}
                  onValueChange={(v) =>
                    onChange({
                      ...value,
                      customerProfile: {
                        ...(value.customerProfile || {}),
                        hiringFrequency: v,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t(
                        "customer.profile.company.ph.hiringFrequency",
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {hiringFrequencyOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {profileStoredLabel(PROFILE_HIRING_FREQ, option, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm sm:text-base text-gray-900 mt-2">
                  {value.customerProfile?.hiringFrequency
                    ? profileStoredLabel(
                        PROFILE_HIRING_FREQ,
                        value.customerProfile.hiringFrequency,
                        t,
                      )
                    : t("customer.profile.na")}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Preferred Contract Types */}
          <div className="space-y-4">
            <Label>{t("customer.profile.company.label.contractTypes")}</Label>
            {isEditing ? (
              <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                {contractTypeOptions.map((type) => (
                  <Badge
                    key={type}
                    variant={
                      value.customerProfile?.preferredContractTypes?.includes(
                        type
                      )
                        ? "default"
                        : "outline"
                    }
                    className={`cursor-pointer ${
                      value.customerProfile?.preferredContractTypes?.includes(
                        type
                      )
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "hover:bg-blue-50 hover:border-blue-300"
                    }`}
                    onClick={() =>
                      toggleArrayItem("preferredContractTypes", type)
                    }
                  >
                    {profileStoredLabel(PROFILE_CONTRACT, type, t)}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {value.customerProfile?.preferredContractTypes &&
                value.customerProfile.preferredContractTypes.length > 0 ? (
                  value.customerProfile.preferredContractTypes.map(
                    (type, index) => (
                      <Badge key={index} variant="secondary">
                        {profileStoredLabel(PROFILE_CONTRACT, type, t)}
                      </Badge>
                    )
                  )
                ) : (
                  <span className="text-sm text-gray-500">
                    {t("customer.profile.company.empty.contractTypes")}
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Categories Hiring For */}
          <div className="space-y-4">
            <Label>{t("customer.profile.company.label.categoriesHiring")}</Label>
            <p className="text-sm text-gray-600">
              {t("customer.profile.company.hint.categoriesHiring")}
            </p>
            {isEditing ? (
              <>
                <div className="flex gap-2">
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder={t("customer.profile.company.ph.category")}
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

                {value.customerProfile?.categoriesHiringFor &&
                  value.customerProfile.categoriesHiringFor.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("customer.profile.company.label.selectedCategories", {
                          n: value.customerProfile.categoriesHiringFor.length,
                        })}
                      </Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                        {value.customerProfile.categoriesHiringFor.map(
                          (category, index) => (
                            <Badge
                              key={index}
                              className="bg-green-600 hover:bg-green-700 text-white pr-1"
                            >
                              {profileStoredLabel(
                                PROFILE_HIRE_CATEGORY,
                                category,
                                t,
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  removeArrayItem("categoriesHiringFor", index)
                                }
                                className="ml-1 hover:bg-green-800 rounded-full p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("customer.profile.company.label.popularCategories")}
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                    {popularHiringCategories
                      .filter(
                        (category) =>
                          !value.customerProfile?.categoriesHiringFor?.includes(
                            category
                          )
                      )
                      .map((category) => (
                        <Badge
                          key={category}
                          variant="outline"
                          className="cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all duration-200"
                          onClick={() =>
                            toggleArrayItem("categoriesHiringFor", category)
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
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {value.customerProfile?.categoriesHiringFor &&
                value.customerProfile.categoriesHiringFor.length > 0 ? (
                  value.customerProfile.categoriesHiringFor.map(
                    (cat, index) => (
                      <Badge key={index} variant="secondary">
                        {profileStoredLabel(PROFILE_HIRE_CATEGORY, cat, t)}
                      </Badge>
                    )
                  )
                ) : (
                  <span className="text-sm text-gray-500">
                    {t("customer.profile.company.empty.categories")}
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branding & Culture */}
      <Card className={editableCardClass}>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            {t("customer.profile.company.card.cultureTitle")}
            {editableBadge}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t("customer.profile.company.card.cultureDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mission">
              {t("customer.profile.company.label.mission")}
            </Label>
            {isEditing ? (
              <Textarea
                id="mission"
                rows={4}
                value={value.customerProfile?.mission || ""}
                onChange={(e) =>
                  onChange({
                    ...value,
                    customerProfile: {
                      ...(value.customerProfile || {}),
                      mission: e.target.value,
                    },
                  })
                }
                placeholder={t("customer.profile.company.ph.mission")}
              />
            ) : (
              <p className="text-sm sm:text-base text-gray-900 mt-2 whitespace-pre-wrap">
                {value.customerProfile?.mission || t("customer.profile.na")}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>{t("customer.profile.company.label.values")}</Label>
            <p className="text-sm text-gray-600">
              {t("customer.profile.company.hint.values")}
            </p>
            {isEditing ? (
              <>
                <div className="flex gap-2">
                  <Input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder={t("customer.profile.company.ph.value")}
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

                {value.customerProfile?.values &&
                  value.customerProfile.values.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("customer.profile.company.label.selectedValues", {
                          n: value.customerProfile.values.length,
                        })}
                      </Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                        {value.customerProfile.values.map((val, index) => (
                          <Badge
                            key={index}
                            className="bg-purple-600 hover:bg-purple-700 text-white pr-1"
                          >
                            <Heart className="w-3 h-3 mr-1" />
                            {profileStoredLabel(PROFILE_CORE_VALUE, val, t)}
                            <button
                              type="button"
                              onClick={() => removeArrayItem("values", index)}
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
                    {t("customer.profile.company.label.commonValues")}
                  </Label>
                  <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                    {companyValues
                      .filter(
                        (val) => !value.customerProfile?.values?.includes(val)
                      )
                      .map((val) => (
                        <Badge
                          key={val}
                          variant="outline"
                          className="cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all duration-200"
                          onClick={() => toggleArrayItem("values", val)}
                        >
                          <Heart className="w-3 h-3 mr-1" />
                          {profileStoredLabel(PROFILE_CORE_VALUE, val, t)}
                        </Badge>
                      ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {value.customerProfile?.values &&
                value.customerProfile.values.length > 0 ? (
                  value.customerProfile.values.map((val, index) => (
                    <Badge key={index} variant="secondary">
                      {profileStoredLabel(PROFILE_CORE_VALUE, val, t)}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">
                    {t("customer.profile.company.empty.values")}
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <Label htmlFor="benefits">
              {t("customer.profile.company.label.benefits")}
            </Label>
            {isEditing ? (
              <>
                <Textarea
                  id="benefits"
                  rows={4}
                  value={
                    typeof value.customerProfile?.benefits === "string"
                      ? value.customerProfile.benefits
                      : value.customerProfile?.benefits
                      ? JSON.stringify(value.customerProfile.benefits, null, 2)
                      : ""
                  }
                  onChange={(e) =>
                    onChange({
                      ...value,
                      customerProfile: {
                        ...(value.customerProfile || {}),
                        benefits: e.target.value,
                      },
                    })
                  }
                  placeholder={t("customer.profile.company.ph.benefits")}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t("customer.profile.company.hint.benefitsJson")}
                </p>
              </>
            ) : (
              <p className="text-sm sm:text-base text-gray-900 mt-2 whitespace-pre-wrap">
                {typeof value.customerProfile?.benefits === "string"
                  ? value.customerProfile.benefits
                  : value.customerProfile?.benefits
                  ? JSON.stringify(value.customerProfile.benefits, null, 2)
                  : t("customer.profile.na")}
              </p>
            )}
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>{t("customer.profile.company.label.mediaGallery")}</Label>
            <p className="text-sm text-gray-600">
              {t("customer.profile.company.hint.mediaGallery")}
            </p>
            {isEditing ? (
              <>
                {/* File Upload Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">
                      {t("customer.profile.company.label.uploadImages")}
                    </Label>
                    <span className="text-xs text-gray-500">
                      {t("customer.profile.company.label.imageCount", {
                        n: value.customerProfile?.mediaGallery?.length || 0,
                      })}
                    </span>
                  </div>
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-gray-300"
                    } ${
                      (value.customerProfile?.mediaGallery?.length || 0) >= 10
                        ? "opacity-60"
                        : ""
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      multiple
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleMediaImageUpload}
                      className="hidden"
                      id="media-upload"
                      disabled={
                        uploadingMedia ||
                        (value.customerProfile?.mediaGallery?.length || 0) >= 10
                      }
                    />
                    <label
                      htmlFor="media-upload"
                      className={`cursor-pointer block ${
                        (value.customerProfile?.mediaGallery?.length || 0) >= 10
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {uploadingMedia ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            {t("customer.profile.company.media.uploading")}
                          </p>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            {(value.customerProfile?.mediaGallery?.length ||
                              0) >= 10
                              ? t("customer.profile.company.media.maxReached")
                              : t("customer.profile.company.media.dropHint")}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {t("customer.profile.company.media.fileHint")}
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* URL Input Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    {t("customer.profile.company.label.orUrl")}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      type="url"
                      placeholder={t("customer.profile.company.ph.mediaUrl")}
                      disabled={
                        (value.customerProfile?.mediaGallery?.length || 0) >= 10
                      }
                      onKeyPress={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddMediaUrl())
                      }
                    />
                    <Button
                      type="button"
                      onClick={handleAddMediaUrl}
                      variant="outline"
                      disabled={
                        (value.customerProfile?.mediaGallery?.length || 0) >= 10
                      }
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {(value.customerProfile?.mediaGallery?.length || 0) >= 10 && (
                    <p className="text-xs text-red-600">
                      {t("customer.profile.company.media.removeToAdd")}
                    </p>
                  )}
                </div>

                {/* Media Gallery Display */}
                {value.customerProfile?.mediaGallery &&
                  value.customerProfile.mediaGallery.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("customer.profile.company.label.galleryCount", {
                          n: value.customerProfile.mediaGallery.length,
                        })}
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {value.customerProfile.mediaGallery.map(
                          (url, index) => (
                            <div
                              key={index}
                              className="relative group border rounded-lg overflow-hidden bg-white"
                            >
                              <div
                                className="w-full h-40 bg-gray-50 relative overflow-hidden cursor-pointer"
                                onClick={() =>
                                  isImageUrl(url) && openLightbox(index)
                                }
                              >
                                {isImageUrl(url) ? (
                                  <>
                                    <MediaImage
                                      src={url}
                                      alt={`Media ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                    {isEditing && (
                                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveMediaItem(index);
                                          }}
                                          className="opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-opacity pointer-events-auto"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <ImageIcon className="w-8 h-8 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="p-2 bg-white border-t">
                                <p
                                  className="text-xs text-gray-600 truncate"
                                  title={url}
                                >
                                  {url.split("/").pop() || `Media ${index + 1}`}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {(!value.customerProfile?.mediaGallery ||
                  value.customerProfile.mediaGallery.length === 0) && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{t("customer.profile.company.media.emptyEdit")}</p>
                    <p className="text-sm">
                      {t("customer.profile.company.media.emptyEditHint")}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-4">
                {value.customerProfile?.mediaGallery &&
                value.customerProfile.mediaGallery.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {value.customerProfile.mediaGallery.map((url, index) => (
                      <div
                        key={index}
                        className="relative group border rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow"
                      >
                        <div
                          className="w-full h-64 bg-gray-50 relative overflow-hidden cursor-pointer"
                          onClick={() => isImageUrl(url) && openLightbox(index)}
                        >
                          {isImageUrl(url) ? (
                            <>
                              <MediaImage
                                src={url}
                                alt={`Media ${index + 1}`}
                                className="w-full h-full"
                                onClick={() => openLightbox(index)}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center pointer-events-none">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadMedia(url);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto"
                                >
                                  <Download className="w-4 h-4 mr-2" />
                                  {t("customer.profile.company.download")}
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-2 bg-white border-t">
                          <p
                            className="text-xs text-gray-600 truncate"
                            title={url}
                          >
                            {url.split("/").pop() || `Media ${index + 1}`}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                    <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>{t("customer.profile.company.media.emptyView")}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lightbox Dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] p-0 bg-black/95 border-none">
          {value.customerProfile?.mediaGallery &&
            value.customerProfile.mediaGallery.length > 0 && (
              <div className="relative w-full h-full flex items-center justify-center min-h-[500px]">
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-50 text-white hover:bg-white/20 rounded-full"
                  onClick={closeLightbox}
                >
                  <X className="w-5 h-5" />
                </Button>

                {/* Previous Button - Always visible when multiple images */}
                {value.customerProfile.mediaGallery.length > 1 && (
                  <Button
                    variant="default"
                    size="icon"
                    className="absolute left-2 z-50 bg-white/90 hover:bg-white text-gray-900 shadow-lg rounded-full w-12 h-12"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                )}

                {/* Next Button - Always visible when multiple images */}
                {value.customerProfile.mediaGallery.length > 1 && (
                  <Button
                    variant="default"
                    size="icon"
                    className="absolute right-2 z-50 bg-white/90 hover:bg-white text-gray-900 shadow-lg rounded-full w-12 h-12"
                    onClick={goToNext}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                )}

                {/* Image Display */}
                <div className="w-full h-full flex items-center justify-center p-4 md:p-8 relative">
                  {isImageUrl(
                    value.customerProfile.mediaGallery[currentImageIndex]
                  ) ? (
                    <div className="relative w-full h-full max-w-full max-h-[70vh] flex items-center justify-center">
                      <Image
                        src={getMediaUrl(
                          value.customerProfile.mediaGallery[currentImageIndex]
                        )}
                        alt={`Media ${currentImageIndex + 1}`}
                        fill
                        className="object-contain rounded-lg bg-white"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          const parent = target.parentElement;
                          if (
                            parent &&
                            !parent.querySelector(".image-placeholder")
                          ) {
                            const placeholder = document.createElement("div");
                            placeholder.className =
                              "image-placeholder absolute inset-0 w-full h-full flex items-center justify-center text-white";
                            placeholder.innerHTML =
                              '<svg class="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                            parent.appendChild(placeholder);
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <ImageIcon className="w-24 h-24 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Image Counter */}
                {value.customerProfile.mediaGallery.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {currentImageIndex + 1} /{" "}
                    {value.customerProfile.mediaGallery.length}
                  </div>
                )}
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
