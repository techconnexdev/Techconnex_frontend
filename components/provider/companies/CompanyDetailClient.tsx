"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  MapPin,
  Star,
  CheckCircle2,
  Heart,
  Building2,
  Globe,
  Users,
  Calendar,
  DollarSign,
  Clock,
  ThumbsUp,
  Send,
  Paperclip,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { Company, Review } from "./types";
import {
  getCompanyOpportunities,
  sendProposal,
  getProfileImageUrl,
} from "@/lib/api";
import { MediaImage } from "@/components/ui/media-image";
import {
  formatTimeline,
  buildTimelineData,
  timelineToDays,
} from "@/lib/timeline-utils";
import { toast } from "sonner";

type Milestone = {
  sequence: number;
  title: string;
  description?: string;
  amount: number;
  dueDate: string;
};

type ProposalFormData = {
  coverLetter: string;
  bidAmount: string;
  timelineAmount: string;
  timelineUnit: "day" | "week" | "month" | "";
  milestones: Milestone[];
  attachments: File[];
};

type TransformedOpportunity = {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  budget: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  originalTimeline: string | null;
  originalTimelineInDays: number;
  skills: string[];
  category: string;
  priority: string;
  requirements: string[];
  deliverables: string[];
  proposals: number;
  hasSubmitted: boolean;
  postedTime: string;
  originalData: Record<string, unknown>;
};

type SortOption = "newest" | "oldest" | "highest" | "lowest";

export default function CompanyDetailClient({
  company,
  reviews,
}: {
  company: Company;
  reviews: Review[];
}) {
  const [saved, setSaved] = useState<boolean>(!!company.saved);

  // Reviews filtering and pagination
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  const sortedReviews = useMemo(() => {
    const sorted = [...(reviews || [])];
    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      case "highest":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  }, [reviews, sortBy]);

  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

  // Reset to page 1 when sort changes
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Opportunities state
  const [opportunities, setOpportunities] = useState<TransformedOpportunity[]>(
    []
  );
  const [loadingOpportunities, setLoadingOpportunities] = useState(true);
  const [selectedOpportunity, setSelectedOpportunity] =
    useState<TransformedOpportunity | null>(null);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);
  const [proposalData, setProposalData] = useState<ProposalFormData>({
    coverLetter: "",
    bidAmount: "",
    timelineAmount: "",
    timelineUnit: "",
    milestones: [],
    attachments: [],
  });
  const [proposalErrors, setProposalErrors] = useState<{
    bidAmount?: string;
    timelineAmount?: string;
    timelineUnit?: string;
    coverLetter?: string;
    milestones?: string;
  }>({});

  // Helper functions for media gallery
  const getMediaUrl = (url: string) => {
    // Use the same helper as profile images for consistency
    return getProfileImageUrl(url);
  };

  const isImageUrl = (url: string) => {
    if (!url) return false;
    // Check if it's an image file extension or data URL
    return (
      /\.(jpg|jpeg|png|gif|webp)$/i.test(url) ||
      url.includes("image") ||
      url.startsWith("data:image")
    );
  };

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goToPrevious = () => {
    const images = company.mediaGallery || [];
    setCurrentImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    const images = company.mediaGallery || [];
    setCurrentImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        const images = company.mediaGallery || [];
        setCurrentImageIndex((prev) =>
          prev > 0 ? prev - 1 : images.length - 1
        );
      } else if (e.key === "ArrowRight") {
        const images = company.mediaGallery || [];
        setCurrentImageIndex((prev) =>
          prev < images.length - 1 ? prev + 1 : 0
        );
      } else if (e.key === "Escape") {
        setLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, company.mediaGallery]);

  // Update saved state when company prop changes (e.g., after refresh)
  useEffect(() => {
    setSaved(!!company.saved);
  }, [company.saved]);

  // Fetch opportunities for this company
  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        setLoadingOpportunities(true);
        const response = await getCompanyOpportunities(company.id);
        if (response.success && response.data) {
          // Transform opportunities to match the format expected by the UI
          const transformed = response.data.map(
            (opp: Record<string, unknown>) => ({
              id: String(opp.id || ""),
              title: String(opp.title || ""),
              description: String(opp.description || ""),
              fullDescription: String(opp.description || ""),
              budget: `RM ${
                (opp.budgetMin as number)?.toLocaleString() || 0
              } - RM ${(opp.budgetMax as number)?.toLocaleString() || 0}`,
              budgetMin: (opp.budgetMin as number) || 0,
              budgetMax: (opp.budgetMax as number) || 0,
              timeline:
                formatTimeline(opp.timeline as string) || "Not specified",
              originalTimeline: (opp.timeline as string) || null,
              originalTimelineInDays: (() => {
                if (!opp.timeline) return 0;
                const timelineStr = String(opp.timeline).toLowerCase().trim();
                const match = timelineStr.match(
                  /^(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)$/
                );
                if (match) {
                  const amount = Number(match[1]);
                  const unit = match[2].replace(/s$/, "");
                  return timelineToDays(amount, unit);
                }
                return 0;
              })(),
              skills: Array.isArray(opp.skills) ? (opp.skills as string[]) : [],
              category: String(opp.category || ""),
              priority: String(opp.priority || ""),
              requirements: Array.isArray(opp.requirements)
                ? (opp.requirements as string[])
                : [],
              deliverables: Array.isArray(opp.deliverables)
                ? (opp.deliverables as string[])
                : [],
              proposals: (opp.proposalCount as number) || 0,
              hasSubmitted: Boolean(opp.hasProposed),
              postedTime: new Date(
                String(opp.createdAt || "")
              ).toLocaleDateString(),
              originalData: opp,
            })
          );
          setOpportunities(transformed);
        }
      } catch (error) {
        console.error("Error fetching opportunities:", error);
        toast.error("Failed to load opportunities");
      } finally {
        setLoadingOpportunities(false);
      }
    };

    fetchOpportunities();
  }, [company.id]);

  const getUserAndToken = () => {
    if (typeof window === "undefined") return { userId: "", token: "" };
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token") || "";
      return { userId: user?.id || "", token };
    } catch {
      return { userId: "", token: "" };
    }
  };

  const handleSaveToggle = async () => {
    try {
      const { userId, token } = getUserAndToken();
      if (!userId || !token) {
        alert("Please login to save companies");
        return;
      }

      const method = saved ? "DELETE" : "POST";
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        }/companies/${company.id}/save?userId=${encodeURIComponent(userId)}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setSaved(!saved);
      } else {
        const data = await response.json();
        alert(data.message || "Failed to update saved status");
      }
    } catch (error) {
      console.error("Error toggling save status:", error);
      alert("Failed to update saved status");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
      {/* Back + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant={saved ? "default" : "outline"}
            onClick={handleSaveToggle}
            className={`${
              saved
                ? "bg-red-600 active:bg-red-700 sm:hover:bg-red-700 text-white"
                : ""
            } w-full sm:w-auto text-xs sm:text-sm`}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 ${
                saved ? "fill-current" : ""
              }`}
            />{" "}
            {saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start gap-3 sm:gap-5">
            <Avatar className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
              <AvatarImage src={getProfileImageUrl(company.avatar)} />
              <AvatarFallback>
                <Building2 className="w-8 h-8 sm:w-10 sm:h-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold break-words">
                  {company.name}
                </h1>
                {company.verified && (
                  <Badge className="bg-green-100 text-green-800 text-xs shrink-0">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Verified
                  </Badge>
                )}
                {!company.verified && (
                  <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs shrink-0">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Not Verified
                  </Badge>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600 mt-1 break-words">
                {company.industry}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                  <b>{company.rating}</b> ({company.reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="break-words">{company.location}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  {company.projectsPosted} projects posted
                </span>
                {company.establishedYear && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    Est. {company.establishedYear}
                  </span>
                )}
                {company.employeeCount && (
                  <span>{company.employeeCount} employees</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  Member since {company.memberSince}
                </span>
              </div>
            </div>
          </div>
          <Separator className="my-3 sm:my-4" />
          <p className="text-sm sm:text-base text-gray-800 break-words">
            {company.description}
          </p>
          {company.website && (
            <div className="mt-3 sm:mt-4">
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 active:text-blue-800 sm:hover:text-blue-800 break-all"
              >
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="break-all">{company.website}</span>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Details & Reviews */}
      <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              {company.mission && (
                <div>
                  <h4 className="font-semibold text-sm sm:text-base mb-2">
                    Mission
                  </h4>
                  <p className="text-sm sm:text-base text-gray-700 break-words">
                    {company.mission}
                  </p>
                </div>
              )}
              {company.values && company.values.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm sm:text-base mb-2">
                    Values
                  </h4>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {company.values.map((value) => (
                      <Badge
                        key={value}
                        variant="secondary"
                        className="text-xs"
                      >
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {company.categoriesHiringFor &&
                company.categoriesHiringFor.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm sm:text-base mb-2">
                      Categories Hiring For
                    </h4>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {company.categoriesHiringFor.map((category) => (
                        <Badge
                          key={category}
                          variant="secondary"
                          className="text-xs"
                        >
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              {company.employeeCount && (
                <div>
                  <h4 className="font-semibold text-sm sm:text-base mb-2">
                    Employee Count
                  </h4>
                  <p className="text-sm sm:text-base text-gray-700">
                    {company.employeeCount.toLocaleString()} employees
                  </p>
                </div>
              )}
              {company.establishedYear && (
                <div>
                  <h4 className="font-semibold text-sm sm:text-base mb-2">
                    Established
                  </h4>
                  <p className="text-sm sm:text-base text-gray-700">
                    {company.establishedYear}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Gallery */}
          {company.mediaGallery && company.mediaGallery.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl">
                  Media Gallery
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Company images and visual content
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                  {company.mediaGallery.map((url, index) => (
                    <div
                      key={index}
                      className="relative group border rounded-lg overflow-hidden bg-white active:shadow-md sm:hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => isImageUrl(url) && openLightbox(index)}
                    >
                      <div className="w-full h-32 sm:h-48 bg-gray-50 relative overflow-hidden">
                        {isImageUrl(url) ? (
                          <MediaImage
                            src={url}
                            alt={`Company media ${index + 1}`}
                            className="w-full h-full"
                            onClick={() => openLightbox(index)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 sm:group-hover:bg-opacity-10 transition-opacity" />
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
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Reviews</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Reviews given by this company
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              {reviews && reviews.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {/* Filter */}
                  <div className="flex justify-end">
                    <Select value={sortBy} onValueChange={handleSortChange}>
                      <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="highest">Highest Rating</SelectItem>
                        <SelectItem value="lowest">Lowest Rating</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reviews */}
                  <div className="space-y-3 sm:space-y-4">
                    {paginatedReviews.map((review) => (
                      <div
                        key={review.id}
                        className="border rounded-lg p-3 sm:p-4"
                      >
                        <div className="flex items-start justify-between mb-2 gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm sm:text-base break-words">
                              {review.author}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current" />
                            <span className="text-sm sm:text-base">
                              {review.rating}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm sm:text-base text-gray-700 break-words">
                          {review.text}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          {review.date}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage((prev) => Math.max(1, prev - 1));
                            }}
                            href="#"
                            className={
                              currentPage === 1
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(page);
                              }}
                              href="#"
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}
                        <PaginationItem>
                          <PaginationNext
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage((prev) =>
                                Math.min(totalPages, prev + 1)
                              );
                            }}
                            href="#"
                            className={
                              currentPage === totalPages
                                ? "pointer-events-none opacity-50"
                                : "cursor-pointer"
                            }
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No reviews yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-6">
          {company.preferredContractTypes &&
            company.preferredContractTypes.length > 0 && (
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Preferred Contract Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6 flex flex-wrap gap-1.5 sm:gap-2">
                  {company.preferredContractTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </CardContent>
              </Card>
            )}

          {company.languages && company.languages.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Languages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 flex flex-wrap gap-1.5 sm:gap-2">
                {company.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Contact Information Card - Only show if privacy settings allow */}
          {(company.email || company.phone) && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Contact Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Direct contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                {company.email && (
                  <div>
                    <p className="text-gray-500">Email</p>
                    <a
                      href={`mailto:${company.email}`}
                      className="font-medium text-blue-600 active:text-blue-800 sm:hover:underline break-all"
                    >
                      {company.email}
                    </a>
                  </div>
                )}
                {company.phone && (
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <a
                      href={`tel:${company.phone}`}
                      className="font-medium text-blue-600 active:text-blue-800 sm:hover:underline"
                    >
                      {company.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Information Card */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                Additional Information
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Company preferences and details
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 text-xs sm:text-sm">
              {company.remotePolicy && (
                <div>
                  <p className="text-gray-500">Remote Policy</p>
                  <p className="font-medium break-words">
                    {company.remotePolicy}
                  </p>
                </div>
              )}
              {company.hiringFrequency && (
                <div>
                  <p className="text-gray-500">Hiring Frequency</p>
                  <p className="font-medium capitalize break-words">
                    {company.hiringFrequency}
                  </p>
                </div>
              )}
              {company.averageBudgetRange && (
                <div>
                  <p className="text-gray-500">Average Budget Range</p>
                  <p className="font-medium break-words">
                    {company.averageBudgetRange}
                  </p>
                </div>
              )}
              {company.socialLinks &&
                Array.isArray(company.socialLinks) &&
                company.socialLinks.length > 0 && (
                  <div>
                    <p className="text-gray-500">Social Links</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {company.socialLinks.map(
                        (link: string, index: number) => (
                          <a
                            key={index}
                            href={
                              link.startsWith("http") ? link : `https://${link}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 active:text-blue-800 sm:hover:underline text-xs break-all"
                          >
                            {link}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Opportunities Section */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">
            Open Opportunities
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            Available projects from this company that you can submit proposals
            for
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {loadingOpportunities ? (
            <div className="flex items-center justify-center py-8 sm:py-12">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-sm sm:text-base text-gray-600">
                Loading opportunities...
              </span>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <Building2 className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                No open opportunities
              </h3>
              <p className="text-sm sm:text-base text-gray-600">
                This company doesn&apos;t have any open projects at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {opportunities.map((opp) => (
                <Card
                  key={opp.id}
                  className="active:shadow-md sm:hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                          <CardTitle className="text-lg sm:text-xl break-words">
                            {opp.title}
                          </CardTitle>
                          {opp.priority === "High" && (
                            <Badge className="bg-red-100 text-red-800 text-xs shrink-0">
                              <Clock className="w-3 h-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                          {opp.hasSubmitted && (
                            <Badge className="bg-green-100 text-green-800 text-xs shrink-0">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Submitted
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm sm:text-base line-clamp-2 break-words">
                          {opp.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div>
                          <div className="flex items-center text-green-600 font-semibold text-sm sm:text-base">
                            <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                            <span className="break-words">{opp.budget}</span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-500 break-words">
                            {opp.timeline}
                          </p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
                          {opp.proposals} proposals
                        </div>
                        <p className="text-xs text-gray-400">
                          {opp.postedTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {opp.skills.slice(0, 6).map((skill: string) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {opp.skills.length > 6 && (
                        <Badge variant="secondary" className="text-xs">
                          +{opp.skills.length - 6} more
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 sm:pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOpportunity(opp);
                          setIsProposalModalOpen(true);
                          setProposalData({
                            coverLetter: "",
                            bidAmount: "",
                            timelineAmount: "",
                            timelineUnit: "",
                            milestones: [],
                            attachments: [],
                          });
                          setProposalErrors({});
                        }}
                        disabled={opp.hasSubmitted}
                        className="text-xs sm:text-sm"
                      >
                        {opp.hasSubmitted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Already Submitted
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Submit Proposal
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposal Submission Modal */}
      <Dialog open={isProposalModalOpen} onOpenChange={setIsProposalModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Submit Proposal
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Submit your proposal for &quot;{selectedOpportunity?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 sm:space-y-6">
            {/* Bid Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="bidAmount" className="text-xs sm:text-sm">
                  Your Bid Amount (RM) *
                </Label>
                <Input
                  id="bidAmount"
                  type="number"
                  placeholder="15000"
                  value={proposalData.bidAmount}
                  onChange={(e) =>
                    setProposalData((prev) => ({
                      ...prev,
                      bidAmount: e.target.value,
                    }))
                  }
                  className={`text-sm sm:text-base ${
                    proposalErrors.bidAmount
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }`}
                />
                {proposalErrors.bidAmount && (
                  <p className="text-xs text-red-600 mt-1">
                    {proposalErrors.bidAmount}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 break-words">
                  Client budget range: RM{" "}
                  {selectedOpportunity?.budgetMin?.toLocaleString() || "0"} - RM{" "}
                  {selectedOpportunity?.budgetMax?.toLocaleString() || "0"}
                </p>
              </div>
              <div>
                <Label htmlFor="timeline" className="text-xs sm:text-sm">
                  Delivery Timeline *
                </Label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    id="timelineAmount"
                    type="number"
                    placeholder="e.g. 2"
                    min="1"
                    value={proposalData.timelineAmount}
                    onChange={(e) =>
                      setProposalData((prev) => ({
                        ...prev,
                        timelineAmount: e.target.value,
                      }))
                    }
                    className={`text-sm sm:text-base ${
                      proposalErrors.timelineAmount
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }`}
                  />
                  <Select
                    value={proposalData.timelineUnit}
                    onValueChange={(value: "day" | "week" | "month") =>
                      setProposalData((prev) => ({
                        ...prev,
                        timelineUnit: value,
                      }))
                    }
                  >
                    <SelectTrigger
                      className={`text-sm sm:text-base ${
                        proposalErrors.timelineUnit
                          ? "border-red-500 focus:ring-red-500"
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
                {proposalErrors.timelineAmount && (
                  <p className="text-xs text-red-600 mt-1">
                    {proposalErrors.timelineAmount}
                  </p>
                )}
                {proposalErrors.timelineUnit && (
                  <p className="text-xs text-red-600 mt-1">
                    {proposalErrors.timelineUnit}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 break-words">
                  Company timeline:{" "}
                  {selectedOpportunity?.originalTimeline
                    ? formatTimeline(selectedOpportunity.originalTimeline)
                    : "Not specified"}
                </p>
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <Label htmlFor="coverLetter" className="text-xs sm:text-sm">
                Cover Letter *
              </Label>
              <Textarea
                id="coverLetter"
                placeholder="Introduce yourself and explain why you're the best fit for this project..."
                className={`min-h-[120px] text-sm sm:text-base ${
                  proposalErrors.coverLetter
                    ? "border-red-500 focus-visible:ring-red-500"
                    : ""
                }`}
                value={proposalData.coverLetter}
                onChange={(e) =>
                  setProposalData((prev) => ({
                    ...prev,
                    coverLetter: e.target.value,
                  }))
                }
              />
              {proposalErrors.coverLetter && (
                <p className="text-xs text-red-600 mt-1">
                  {proposalErrors.coverLetter}
                </p>
              )}
            </div>

            {/* Milestones */}
            <div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
                <Label className="text-xs sm:text-sm">
                  Project Milestones <span className="text-red-500">*</span>
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setProposalData((prev) => ({
                      ...prev,
                      milestones: [
                        ...prev.milestones,
                        {
                          sequence: prev.milestones.length + 1,
                          title: "",
                          description: "",
                          amount: 0,
                          dueDate: new Date().toISOString().slice(0, 10),
                        },
                      ],
                    }));
                  }}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  + Add Milestone
                </Button>
              </div>
              {proposalData.milestones.length === 0 && (
                <p
                  className={`text-xs sm:text-sm ${
                    proposalErrors.milestones
                      ? "text-red-600 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {proposalErrors.milestones ||
                    "At least one milestone is required."}
                </p>
              )}
              <div className="space-y-3">
                {proposalData.milestones.map((m, i) => (
                  <Card key={i}>
                    <CardContent className="p-3 sm:p-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-1">
                          <label className="text-xs sm:text-sm font-medium">
                            Seq
                          </label>
                          <Input
                            type="number"
                            value={i + 1}
                            disabled
                            className="text-sm sm:text-base"
                          />
                        </div>
                        <div className="sm:col-span-12 md:col-span-4">
                          <label className="text-xs sm:text-sm font-medium">
                            Title
                          </label>
                          <Input
                            value={m.title}
                            onChange={(e) => {
                              const updated = [...proposalData.milestones];
                              updated[i] = {
                                ...updated[i],
                                title: e.target.value,
                              };
                              setProposalData((prev) => ({
                                ...prev,
                                milestones: updated,
                              }));
                            }}
                            className="text-sm sm:text-base"
                          />
                        </div>
                        <div className="sm:col-span-12 md:col-span-3">
                          <label className="text-xs sm:text-sm font-medium">
                            Amount (RM)
                          </label>
                          <Input
                            type="number"
                            value={String(m.amount ?? 0)}
                            onChange={(e) => {
                              const updated = [...proposalData.milestones];
                              updated[i] = {
                                ...updated[i],
                                amount: Number(e.target.value),
                              };
                              setProposalData((prev) => ({
                                ...prev,
                                milestones: updated,
                              }));
                            }}
                            className="text-sm sm:text-base"
                          />
                        </div>
                        <div className="sm:col-span-12 md:col-span-4">
                          <label className="text-xs sm:text-sm font-medium">
                            Due Date
                          </label>
                          <Input
                            type="date"
                            value={(m.dueDate || "").slice(0, 10)}
                            onChange={(e) => {
                              const updated = [...proposalData.milestones];
                              updated[i] = {
                                ...updated[i],
                                dueDate: e.target.value,
                              };
                              setProposalData((prev) => ({
                                ...prev,
                                milestones: updated,
                              }));
                            }}
                            className="text-sm sm:text-base"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium">
                          Description
                        </label>
                        <Textarea
                          rows={2}
                          value={m.description || ""}
                          onChange={(e) => {
                            const updated = [...proposalData.milestones];
                            updated[i] = {
                              ...updated[i],
                              description: e.target.value,
                            };
                            setProposalData((prev) => ({
                              ...prev,
                              milestones: updated,
                            }));
                          }}
                          className="text-sm sm:text-base"
                        />
                      </div>
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setProposalData((prev) => ({
                              ...prev,
                              milestones: prev.milestones.filter(
                                (_, idx) => idx !== i
                              ),
                            }));
                          }}
                          className="text-xs sm:text-sm"
                        >
                          Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              {proposalErrors.milestones && (
                <p className="text-xs text-red-600 mt-1">
                  {proposalErrors.milestones}
                </p>
              )}
            </div>

            {/* Attachments */}
            <div>
              <Label className="text-xs sm:text-sm">
                Attachments (Optional)
              </Label>
              <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length + proposalData.attachments.length > 3) {
                      toast.error("You can only upload up to 3 files");
                      return;
                    }
                    for (const file of files) {
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error(`"${file.name}" is larger than 10 MB`);
                        return;
                      }
                    }
                    setProposalData((prev) => ({
                      ...prev,
                      attachments: [...prev.attachments, ...files],
                    }));
                    e.target.value = "";
                  }}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Paperclip className="w-6 h-6 sm:w-8 sm:h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-xs sm:text-sm text-gray-600">
                    Click to upload portfolio, resume, or relevant documents
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, TXT, JPG, PNG (Max 10MB each, Max 3 files)
                  </p>
                </label>
              </div>
              {proposalData.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {proposalData.attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-gray-50 p-2 rounded"
                    >
                      <span className="text-xs sm:text-sm text-gray-700 truncate flex-1 mr-2">
                        {file.name}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setProposalData((prev) => ({
                            ...prev,
                            attachments: prev.attachments.filter(
                              (_, i) => i !== index
                            ),
                          }));
                        }}
                        className="text-xs sm:text-sm flex-shrink-0"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsProposalModalOpen(false)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                // Validation
                const errors: {
                  bidAmount?: string;
                  timelineAmount?: string;
                  timelineUnit?: string;
                  coverLetter?: string;
                  milestones?: string;
                } = {};
                const bidAmountNum = Number(proposalData.bidAmount);
                if (
                  !proposalData.bidAmount ||
                  isNaN(bidAmountNum) ||
                  bidAmountNum <= 0
                ) {
                  errors.bidAmount =
                    "Bid amount is required and must be positive";
                } else if (selectedOpportunity) {
                  if (
                    bidAmountNum < selectedOpportunity.budgetMin ||
                    bidAmountNum > selectedOpportunity.budgetMax
                  ) {
                    errors.bidAmount = `Bid amount must be between RM ${selectedOpportunity.budgetMin.toLocaleString()} and RM ${selectedOpportunity.budgetMax.toLocaleString()}`;
                  }
                }

                const timelineAmountNum = Number(proposalData.timelineAmount);
                if (
                  !proposalData.timelineAmount ||
                  isNaN(timelineAmountNum) ||
                  timelineAmountNum <= 0
                ) {
                  errors.timelineAmount = "Timeline amount is required";
                }
                if (!proposalData.timelineUnit) {
                  errors.timelineUnit = "Timeline unit is required";
                } else if (
                  selectedOpportunity &&
                  selectedOpportunity.originalTimelineInDays > 0
                ) {
                  const providerTimelineInDays = timelineToDays(
                    timelineAmountNum,
                    proposalData.timelineUnit
                  );
                  if (
                    providerTimelineInDays >
                    selectedOpportunity.originalTimelineInDays
                  ) {
                    errors.timelineAmount = `Your timeline must be equal to or less than the company's timeline (${formatTimeline(
                      selectedOpportunity.originalTimeline
                    )})`;
                  }
                }

                if (
                  !proposalData.coverLetter ||
                  proposalData.coverLetter.trim().length < 20
                ) {
                  errors.coverLetter =
                    "Cover letter must be at least 20 characters";
                }

                if (proposalData.milestones.length === 0) {
                  errors.milestones = "At least one milestone is required";
                } else {
                  const sumMilestones = proposalData.milestones.reduce(
                    (sum, m) => sum + (Number(m.amount) || 0),
                    0
                  );
                  if (bidAmountNum > 0 && sumMilestones !== bidAmountNum) {
                    errors.milestones = `Total of milestones (RM ${sumMilestones}) must equal your bid amount (RM ${bidAmountNum})`;
                  }
                }

                setProposalErrors(errors);
                if (Object.keys(errors).length > 0) {
                  toast.error("Please fix the errors before submitting");
                  return;
                }

                try {
                  setSubmittingProposal(true);
                  const { timeline, timelineInDays } = buildTimelineData(
                    Number(proposalData.timelineAmount),
                    proposalData.timelineUnit
                  );

                  if (!selectedOpportunity) {
                    toast.error("No opportunity selected");
                    return;
                  }

                  const formData = new FormData();
                  formData.append(
                    "serviceRequestId",
                    String(selectedOpportunity.originalData.id || "")
                  );
                  formData.append("bidAmount", bidAmountNum.toString());
                  formData.append("deliveryTime", timelineInDays.toString());
                  formData.append("timeline", timeline);
                  formData.append("timelineInDays", timelineInDays.toString());
                  formData.append("coverLetter", proposalData.coverLetter);

                  proposalData.milestones.forEach((m, idx) => {
                    formData.append(
                      `milestones[${idx}][sequence]`,
                      String(idx + 1)
                    );
                    formData.append(`milestones[${idx}][title]`, m.title);
                    formData.append(
                      `milestones[${idx}][description]`,
                      m.description || ""
                    );
                    formData.append(
                      `milestones[${idx}][amount]`,
                      String(m.amount)
                    );
                    formData.append(
                      `milestones[${idx}][dueDate]`,
                      new Date(m.dueDate).toISOString()
                    );
                  });

                  proposalData.attachments.forEach((file) => {
                    formData.append("attachments", file);
                  });

                  const response = await sendProposal(formData);
                  if (response.success) {
                    toast.success("Proposal submitted successfully!");
                    setIsProposalModalOpen(false);
                    if (selectedOpportunity) {
                      setOpportunities((prev) =>
                        prev.map((opp) =>
                          opp.id === selectedOpportunity.id
                            ? {
                                ...opp,
                                hasSubmitted: true,
                                proposals: opp.proposals + 1,
                              }
                            : opp
                        )
                      );
                    }
                    setProposalData({
                      coverLetter: "",
                      bidAmount: "",
                      timelineAmount: "",
                      timelineUnit: "",
                      milestones: [],
                      attachments: [],
                    });
                    setProposalErrors({});
                  } else {
                    toast.error(
                      response.message || "Failed to submit proposal"
                    );
                  }
                } catch (error: unknown) {
                  console.error("Error submitting proposal:", error);
                  const errorMessage =
                    error instanceof Error
                      ? error.message
                      : "Failed to submit proposal";
                  toast.error(errorMessage);
                } finally {
                  setSubmittingProposal(false);
                }
              }}
              disabled={submittingProposal}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              {submittingProposal ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  Submit Proposal
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Gallery Lightbox */}
      {company.mediaGallery && company.mediaGallery.length > 0 && (
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
          <DialogContent className="max-w-4xl w-[90vw] max-h-[85vh] p-0 bg-black/95 border-none">
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

              {/* Previous Button */}
              {company.mediaGallery.length > 1 && (
                <Button
                  variant="default"
                  size="icon"
                  className="absolute left-2 z-50 bg-white/90 hover:bg-white text-gray-900 shadow-lg rounded-full w-12 h-12"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}

              {/* Next Button */}
              {company.mediaGallery.length > 1 && (
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
                {isImageUrl(company.mediaGallery[currentImageIndex]) ? (
                  <div className="relative w-full h-full max-w-full max-h-[70vh] flex items-center justify-center">
                    <Image
                      src={getMediaUrl(company.mediaGallery[currentImageIndex])}
                      alt={`Company media ${currentImageIndex + 1}`}
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
              {company.mediaGallery.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-full text-sm font-medium">
                  {currentImageIndex + 1} / {company.mediaGallery.length}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
