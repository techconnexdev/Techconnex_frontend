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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  uploadCompanyMediaGalleryImages,
  getCompanyProfileCompletion,
  getProfileImageUrl,
} from "@/lib/api";
import { MediaImage } from "@/components/ui/media-image";
import type { ProfileData } from "../types";

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
        `Maximum ${MAX_IMAGES} images allowed. Please remove some images first.`
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

  const handleMediaImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check current media gallery count
    const currentCount = value.customerProfile?.mediaGallery?.length || 0;
    const MAX_IMAGES = 10;

    if (currentCount >= MAX_IMAGES) {
      toast.error(
        `Maximum ${MAX_IMAGES} images allowed. Please remove some images first.`
      );
      event.target.value = "";
      return;
    }

    // Check if adding these files would exceed the limit
    if (currentCount + files.length > MAX_IMAGES) {
      const allowed = MAX_IMAGES - currentCount;
      toast.error(
        `You can only add ${allowed} more image(s). Maximum ${MAX_IMAGES} images allowed.`
      );
      event.target.value = "";
      return;
    }

    // Validate file types
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const invalidFiles = files.filter(
      (file) => !allowedTypes.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      toast.error("Only image files are allowed (JPEG, PNG, GIF, WebP)");
      event.target.value = "";
      return;
    }

    // Validate file sizes (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      toast.error("Some files exceed 10MB limit");
      event.target.value = "";
      return;
    }

    try {
      setUploadingMedia(true);
      const response = await uploadCompanyMediaGalleryImages(files);

      if (response.success && response.data?.mediaGallery) {
        // Update the profile with new media gallery URLs
        onChange({
          ...value,
          customerProfile: {
            ...(value.customerProfile || {}),
            mediaGallery: response.data.mediaGallery,
          },
        });
        toast.success(`${files.length} image(s) uploaded successfully`);
        // Reload completion percentage and suggestions
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
        toast.error(response.message || "Failed to upload images");
      }
    } catch (error: unknown) {
      console.error("Error uploading media images:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload images";
      toast.error(errorMessage);
    } finally {
      setUploadingMedia(false);
      // Reset file input
      event.target.value = "";
    }
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
      ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}${
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

  return (
    <div className="space-y-4 sm:space-y-5 lg:space-y-6">
      {/* Business Profile */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">
            Business Profile
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Core information about your company
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <Label>Industry</Label>
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
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  {[
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
                  ].map((i) => (
                    <SelectItem key={i} value={i}>
                      {i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Company Size</Label>
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
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select company size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-10">Startup (1-10 employees)</SelectItem>
                  <SelectItem value="11-50">Small (11-50 employees)</SelectItem>
                  <SelectItem value="51-200">
                    Medium (51-200 employees)
                  </SelectItem>
                  <SelectItem value="201-1000">
                    Large (201-1000 employees)
                  </SelectItem>
                  <SelectItem value="1000+">
                    Enterprise (1000+ employees)
                  </SelectItem>
                  <SelectItem value="150">150 employees</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Employee Count</Label>
              <Input
                type="number"
                value={value.customerProfile?.employeeCount || ""}
                disabled={!isEditing}
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
            </div>
            <div>
              <Label>Established Year</Label>
              <Input
                type="number"
                min="1800"
                max={new Date().getFullYear()}
                value={value.customerProfile?.establishedYear || ""}
                disabled={!isEditing}
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
            </div>
            <div>
              <Label>Annual Revenue</Label>
              <Input
                type="text"
                value={value.customerProfile?.annualRevenue || ""}
                disabled={!isEditing}
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
                Enter revenue in your currency
              </p>
            </div>
            <div>
              <Label>Funding Stage</Label>
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
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select funding stage" />
                </SelectTrigger>
                <SelectContent>
                  {fundingStageOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hiring Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Hiring Preferences</CardTitle>
          <CardDescription>
            Your company&apos;s hiring and contract preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Average Budget Range</Label>
              <Input
                type="text"
                value={value.customerProfile?.averageBudgetRange || ""}
                disabled={!isEditing}
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
            </div>
            <div>
              <Label>Remote Policy</Label>
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
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select remote policy" />
                </SelectTrigger>
                <SelectContent>
                  {remotePolicyOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Hiring Frequency</Label>
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
                disabled={!isEditing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hiring frequency" />
                </SelectTrigger>
                <SelectContent>
                  {hiringFrequencyOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Preferred Contract Types */}
          <div className="space-y-4">
            <Label>Preferred Contract Types</Label>
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
                    {type}
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
                        {type}
                      </Badge>
                    )
                  )
                ) : (
                  <span className="text-sm text-gray-500">
                    No contract types specified
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Categories Hiring For */}
          <div className="space-y-4">
            <Label>Categories Hiring For</Label>
            <p className="text-sm text-gray-600">
              Select the types of roles you typically hire for
            </p>
            {isEditing ? (
              <>
                <div className="flex gap-2">
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Type a category and press Add"
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
                        Selected Categories (
                        {value.customerProfile.categoriesHiringFor.length})
                      </Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                        {value.customerProfile.categoriesHiringFor.map(
                          (category, index) => (
                            <Badge
                              key={index}
                              className="bg-green-600 hover:bg-green-700 text-white pr-1"
                            >
                              {category}
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
                    Popular Categories (click to add)
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
                          {category}
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
                        {cat}
                      </Badge>
                    )
                  )
                ) : (
                  <span className="text-sm text-gray-500">
                    No categories specified
                  </span>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branding & Culture */}
      <Card>
        <CardHeader>
          <CardTitle>Branding & Culture</CardTitle>
          <CardDescription>
            Mission, values, and company culture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mission">Mission</Label>
            <Textarea
              id="mission"
              rows={4}
              value={value.customerProfile?.mission || ""}
              disabled={!isEditing}
              onChange={(e) =>
                onChange({
                  ...value,
                  customerProfile: {
                    ...(value.customerProfile || {}),
                    mission: e.target.value,
                  },
                })
              }
              placeholder="Describe your company's mission..."
            />
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Company Values</Label>
            <p className="text-sm text-gray-600">
              Select values that represent your company culture
            </p>
            {isEditing ? (
              <>
                <div className="flex gap-2">
                  <Input
                    value={customValue}
                    onChange={(e) => setCustomValue(e.target.value)}
                    placeholder="Type a value and press Add"
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
                        Selected Values ({value.customerProfile.values.length})
                      </Label>
                      <div className="flex flex-wrap gap-2 p-3 border rounded-lg bg-gray-50">
                        {value.customerProfile.values.map((val, index) => (
                          <Badge
                            key={index}
                            className="bg-purple-600 hover:bg-purple-700 text-white pr-1"
                          >
                            <Heart className="w-3 h-3 mr-1" />
                            {val}
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
                    Common Values (click to add)
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
                          {val}
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
                      {val}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">
                    No values specified
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />

          <div>
            <Label htmlFor="benefits">Benefits</Label>
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
              disabled={!isEditing}
              onChange={(e) =>
                onChange({
                  ...value,
                  customerProfile: {
                    ...(value.customerProfile || {}),
                    benefits: e.target.value,
                  },
                })
              }
              placeholder="Describe employee benefits or company benefits..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Can be plain text or JSON format
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <Label>Media Gallery</Label>
            <p className="text-sm text-gray-600">
              Upload images or add URLs to showcase your company
            </p>
            {isEditing ? (
              <>
                {/* File Upload Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Upload Images</Label>
                    <span className="text-xs text-gray-500">
                      {value.customerProfile?.mediaGallery?.length || 0} / 10
                      images
                    </span>
                  </div>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
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
                      className={`cursor-pointer ${
                        (value.customerProfile?.mediaGallery?.length || 0) >= 10
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                    >
                      {uploadingMedia ? (
                        <div className="flex flex-col items-center">
                          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            Uploading images...
                          </p>
                        </div>
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600">
                            {(value.customerProfile?.mediaGallery?.length ||
                              0) >= 10
                              ? "Maximum 10 images reached"
                              : "Click to upload images or drag and drop"}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            JPEG, PNG, GIF, WebP (Max 10MB each, Max 10 images)
                          </p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                {/* URL Input Section */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Or Add URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      type="url"
                      placeholder="https://example.com/image1.jpg"
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
                      Maximum 10 images reached. Remove some images to add more.
                    </p>
                  )}
                </div>

                {/* Media Gallery Display */}
                {value.customerProfile?.mediaGallery &&
                  value.customerProfile.mediaGallery.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Media Gallery (
                        {value.customerProfile.mediaGallery.length})
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
                                  !isEditing &&
                                  isImageUrl(url) &&
                                  openLightbox(index)
                                }
                              >
                                {isImageUrl(url) ? (
                                  <>
                                    <MediaImage
                                      src={url}
                                      alt={`Media ${index + 1}`}
                                      className="w-full h-full"
                                      onClick={() =>
                                        !isEditing && openLightbox(index)
                                      }
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
                    <p>No media added yet</p>
                    <p className="text-sm">
                      Upload images or add URLs to showcase your company&apos;s
                      visual content
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
                                  Download
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
                    <p>No media added</p>
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
