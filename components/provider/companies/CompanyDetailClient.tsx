"use client";

import { useState, useEffect } from "react";
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
  MapPin,
  Star,
  CheckCircle2,
  MessageSquare,
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
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { Company, Review } from "./types";
import { useRouter } from "next/navigation";
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

export default function CompanyDetailClient({
  company,
  reviews,
}: {
  company: Company;
  reviews: Review[];
}) {
  const [saved, setSaved] = useState<boolean>(!!company.saved);
  const router = useRouter();

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

  const handleContact = () => {
    const avatarUrl = getProfileImageUrl(company.avatar);
    router.push(
      `/provider/messages?userId=${company.id}&name=${encodeURIComponent(
        company.name
      )}&avatar=${encodeURIComponent(avatarUrl)}`
    );
  };

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
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
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
    <div className="space-y-8">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={saved ? "default" : "outline"}
            onClick={handleSaveToggle}
            className={saved ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          >
            <Heart className={`w-4 h-4 mr-2 ${saved ? "fill-current" : ""}`} />{" "}
            {saved ? "Saved" : "Save"}
          </Button>

          {company.allowMessages !== false && (
            <Button onClick={handleContact}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact
            </Button>
          )}
        </div>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-5">
            <Avatar className="w-20 h-20">
              <AvatarImage src={getProfileImageUrl(company.avatar)} />
              <AvatarFallback>
                <Building2 className="w-10 h-10" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{company.name}</h1>
                {company.verified && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle2 className="w-4 h-4 mr-1" />
                    Verified
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">
                {company.industry} • {company.companySize}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  <b>{company.rating}</b> ({company.reviewCount} reviews)
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {company.location}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  RM{company.totalSpend.toLocaleString()} total spent
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {company.projectsPosted} projects posted
                </span>
                {company.establishedYear && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Est. {company.establishedYear}
                  </span>
                )}
                {company.employeeCount && (
                  <span>{company.employeeCount} employees</span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Member since {company.memberSince}
                </span>
              </div>
            </div>
          </div>
          <Separator className="my-4" />
          <p className="text-gray-800">{company.description}</p>
          {company.website && (
            <div className="mt-4">
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <Globe className="w-4 h-4" />
                {company.website}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Details & Reviews */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {company.mission && (
                <div>
                  <h4 className="font-semibold mb-2">Mission</h4>
                  <p className="text-gray-700">{company.mission}</p>
                </div>
              )}
              {company.values && company.values.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Values</h4>
                  <div className="flex flex-wrap gap-2">
                    {company.values.map((value) => (
                      <Badge key={value} variant="secondary">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {company.categoriesHiringFor &&
                company.categoriesHiringFor.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">
                      Categories Hiring For
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {company.categoriesHiringFor.map((category) => (
                        <Badge key={category} variant="secondary">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              {company.employeeCount && (
                <div>
                  <h4 className="font-semibold mb-2">Employee Count</h4>
                  <p className="text-gray-700">
                    {company.employeeCount.toLocaleString()} employees
                  </p>
                </div>
              )}
              {company.establishedYear && (
                <div>
                  <h4 className="font-semibold mb-2">Established</h4>
                  <p className="text-gray-700">{company.establishedYear}</p>
                </div>
              )}
              {company.annualRevenue && (
                <div>
                  <h4 className="font-semibold mb-2">Annual Revenue</h4>
                  <p className="text-gray-700">
                    RM {Number(company.annualRevenue).toLocaleString()}
                  </p>
                </div>
              )}
              {company.fundingStage && (
                <div>
                  <h4 className="font-semibold mb-2">Funding Stage</h4>
                  <p className="text-gray-700">{company.fundingStage}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Gallery */}
          {company.mediaGallery && company.mediaGallery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Media Gallery</CardTitle>
                <CardDescription>
                  Company images and visual content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {company.mediaGallery.map((url, index) => (
                    <div
                      key={index}
                      className="relative group border rounded-lg overflow-hidden bg-white hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => isImageUrl(url) && openLightbox(index)}
                    >
                      <div className="w-full h-48 bg-gray-50 relative overflow-hidden">
                        {isImageUrl(url) ? (
                          <MediaImage
                            src={url}
                            alt={`Company media ${index + 1}`}
                            className="w-full h-full"
                            onClick={() => openLightbox(index)}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="w-12 h-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
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
            <CardHeader>
              <CardTitle>Reviews</CardTitle>
              <CardDescription>Reviews given by this company</CardDescription>
            </CardHeader>
            <CardContent>
              {reviews && reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b pb-4 last:border-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{review.author}</p>
                          {review.provider && (
                            <p className="text-sm text-gray-500">
                              {review.provider.location} • Rating:{" "}
                              {review.provider.rating}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span>{review.rating}</span>
                        </div>
                      </div>
                      <p className="text-gray-700">{review.text}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {review.date}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No reviews yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Projects Posted</span>
                <span className="font-semibold">{company.projectsPosted}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Spent</span>
                <span className="font-semibold text-green-600">
                  RM{company.totalSpend.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Rating</span>
                <span className="font-semibold">
                  {company.rating} ({company.reviewCount} reviews)
                </span>
              </div>
            </CardContent>
          </Card>

          {company.preferredContractTypes &&
            company.preferredContractTypes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Preferred Contract Types</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
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
              <CardHeader>
                <CardTitle>Languages</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
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
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>Direct contact details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm">
                {company.email && (
                  <div>
                    <p className="text-gray-500">Email</p>
                    <a
                      href={`mailto:${company.email}`}
                      className="font-medium text-blue-600 hover:underline break-all"
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
                      className="font-medium text-blue-600 hover:underline"
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
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
              <CardDescription>Company preferences and details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {company.remotePolicy && (
                <div>
                  <p className="text-gray-500">Remote Policy</p>
                  <p className="font-medium">{company.remotePolicy}</p>
                </div>
              )}
              {company.hiringFrequency && (
                <div>
                  <p className="text-gray-500">Hiring Frequency</p>
                  <p className="font-medium capitalize">
                    {company.hiringFrequency}
                  </p>
                </div>
              )}
              {company.averageBudgetRange && (
                <div>
                  <p className="text-gray-500">Average Budget Range</p>
                  <p className="font-medium">{company.averageBudgetRange}</p>
                </div>
              )}
              {company.fundingStage && (
                <div>
                  <p className="text-gray-500">Funding Stage</p>
                  <p className="font-medium">{company.fundingStage}</p>
                </div>
              )}
              {company.annualRevenue && (
                <div>
                  <p className="text-gray-500">Annual Revenue</p>
                  <p className="font-medium">
                    RM {Number(company.annualRevenue).toLocaleString()}
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
                            className="text-blue-600 hover:underline text-xs"
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
        <CardHeader>
          <CardTitle>Open Opportunities</CardTitle>
          <CardDescription>
            Available projects from this company that you can submit proposals
            for
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingOpportunities ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">
                Loading opportunities...
              </span>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No open opportunities
              </h3>
              <p className="text-gray-600">
                This company doesn&apos;t have any open projects at the moment.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <Card
                  key={opp.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{opp.title}</CardTitle>
                          {opp.priority === "High" && (
                            <Badge className="bg-red-100 text-red-800">
                              <Clock className="w-3 h-3 mr-1" />
                              Urgent
                            </Badge>
                          )}
                          {opp.hasSubmitted && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Submitted
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-base line-clamp-2">
                          {opp.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <div className="flex items-center text-green-600 font-semibold">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {opp.budget}
                          </div>
                          <p className="text-sm text-gray-500">
                            {opp.timeline}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="w-4 h-4 mr-1" />
                          {opp.proposals} proposals
                        </div>
                        <p className="text-xs text-gray-400">
                          {opp.postedTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
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

                    <div className="flex items-center justify-between pt-4 border-t">
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
                      >
                        {opp.hasSubmitted ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Already Submitted
                          </>
                        ) : (
                          <>
                            <ThumbsUp className="w-4 h-4 mr-2" />
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Submit Proposal</DialogTitle>
            <DialogDescription>
              Submit your proposal for &quot;{selectedOpportunity?.title}&quot;
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Bid Amount */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bidAmount">Your Bid Amount (RM) *</Label>
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
                  className={
                    proposalErrors.bidAmount
                      ? "border-red-500 focus-visible:ring-red-500"
                      : ""
                  }
                />
                {proposalErrors.bidAmount && (
                  <p className="text-xs text-red-600">
                    {proposalErrors.bidAmount}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Client budget range: RM{" "}
                  {selectedOpportunity?.budgetMin?.toLocaleString() || "0"} - RM{" "}
                  {selectedOpportunity?.budgetMax?.toLocaleString() || "0"}
                </p>
              </div>
              <div>
                <Label htmlFor="timeline">Delivery Timeline *</Label>
                <div className="flex gap-2">
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
                    className={
                      proposalErrors.timelineAmount
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
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
                      className={
                        proposalErrors.timelineUnit
                          ? "border-red-500 focus:ring-red-500"
                          : ""
                      }
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
                <p className="text-xs text-gray-500 mt-1">
                  Company timeline:{" "}
                  {selectedOpportunity?.originalTimeline
                    ? formatTimeline(selectedOpportunity.originalTimeline)
                    : "Not specified"}
                </p>
              </div>
            </div>

            {/* Cover Letter */}
            <div>
              <Label htmlFor="coverLetter">Cover Letter *</Label>
              <Textarea
                id="coverLetter"
                placeholder="Introduce yourself and explain why you're the best fit for this project..."
                className={`min-h-[120px] ${
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
                <p className="text-xs text-red-600">
                  {proposalErrors.coverLetter}
                </p>
              )}
            </div>

            {/* Milestones */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>
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
                >
                  + Add Milestone
                </Button>
              </div>
              {proposalData.milestones.length === 0 && (
                <p
                  className={`text-sm ${
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
                    <CardContent className="p-4 space-y-3">
                      <div className="grid md:grid-cols-12 gap-3">
                        <div className="md:col-span-1">
                          <label className="text-sm font-medium">Seq</label>
                          <Input type="number" value={i + 1} disabled />
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-sm font-medium">Title</label>
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
                          />
                        </div>
                        <div className="md:col-span-3">
                          <label className="text-sm font-medium">
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
                          />
                        </div>
                        <div className="md:col-span-4">
                          <label className="text-sm font-medium">
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
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
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
              <Label>Attachments (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
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
                  <Paperclip className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
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
                      <span className="text-sm text-gray-700">{file.name}</span>
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
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsProposalModalOpen(false)}
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
            >
              {submittingProposal ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
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
