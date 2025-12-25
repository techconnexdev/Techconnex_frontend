"use client";

import { useState, useEffect } from "react";
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
  MapPin,
  Star,
  CheckCircle2,
  MessageSquare,
  Heart,
  Award,
  Loader2,
  Globe,
  FileText,
  ExternalLink,
} from "lucide-react";
import type { Provider, PortfolioItem, Review } from "./types";
import PortfolioGrid from "./sections/PortfolioGrid";
import ReviewsList from "./sections/ReviewsList";
import { useRouter } from "next/navigation";
import { getProviderCompletedProjects, getProfileImageUrl, getResumeByUserId, getR2DownloadUrl } from "@/lib/api";
import ProposalPopup from "./ProposalPopup";

export default function ProviderDetailClient({
  provider,
  portfolio,
  reviews,
}: {
  provider: Provider;
  portfolio: PortfolioItem[];
  reviews: Review[];
}) {
  const [saved, setSaved] = useState<boolean>(!!provider.saved);
  const [portfolioProjects, setPortfolioProjects] = useState<Array<{
    id: string;
    title: string;
    description?: string;
    category?: string;
    technologies?: string[];
    client?: string;
    completedDate?: string;
  }>>([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [isProposalPopupOpen, setIsProposalPopupOpen] = useState(false);
  const [resume, setResume] = useState<{ fileUrl: string; uploadedAt: string } | null>(null);
  const router = useRouter();

  // Update saved state when provider prop changes (e.g., after refresh)
  useEffect(() => {
    setSaved(!!provider.saved);
  }, [provider.saved]);

  // Load completed projects
  useEffect(() => {
    const loadCompletedProjects = async () => {
      try {
        setLoadingPortfolio(true);
        const response = await getProviderCompletedProjects(provider.id);
        if (response.success && response.data) {
          setPortfolioProjects(response.data);
        }
      } catch (error) {
        console.error("Failed to load completed projects:", error);
      } finally {
        setLoadingPortfolio(false);
      }
    };

    loadCompletedProjects();
  }, [provider.id]);

  // Load resume
  useEffect(() => {
    const loadResume = async () => {
      try {
        const response = await getResumeByUserId(provider.id);
        if (response.success && response.data) {
          setResume(response.data);
        }
      } catch (error) {
        // Resume is optional, so we don't show error
        console.error("Failed to load resume:", error);
      }
    };

    loadResume();
  }, [provider.id]);

  const handleDownloadResume = async () => {
    if (!resume?.fileUrl) return;

    try {
      const downloadUrl = await getR2DownloadUrl(resume.fileUrl);
      window.open(downloadUrl.downloadUrl, "_blank");
    } catch (error: unknown) {
      alert("Failed to download resume: " + (error instanceof Error ? error.message : "Unknown error"));
    }
  };

  const handleContact = (provider: Provider) => {
    const avatarUrl = getProfileImageUrl(provider.avatar);
    router.push(
      `/customer/messages?userId=${provider.id}&name=${encodeURIComponent(
        provider.name
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
        alert("Please login to save providers");
        return;
      }

      const method = saved ? "DELETE" : "POST";
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
        }/providers/${provider.id}/save?userId=${encodeURIComponent(userId)}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ token added here
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
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant={saved ? "default" : "outline"}
            onClick={handleSaveToggle}
            className={`text-xs sm:text-sm w-full sm:w-auto ${
              saved ? "bg-red-600 hover:bg-red-700 text-white" : ""
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 ${
                saved ? "fill-current" : ""
              }`}
            />{" "}
            {saved ? "Saved" : "Save"}
          </Button>

          {provider.allowMessages !== false && (
            <Button
              onClick={(e) => {
                e.preventDefault(); // prevents Link from triggering navigation
                handleContact(provider);
              }}
              className="text-xs sm:text-sm w-full sm:w-auto"
            >
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Contact
            </Button>
          )}
        </div>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            <Avatar className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 flex-shrink-0 mx-auto sm:mx-0">
              <AvatarImage
                src={getProfileImageUrl(provider.avatar)}
              />
              <AvatarFallback>{provider.name?.[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5 sm:mb-1">
                <h1 className="text-xl sm:text-2xl font-bold break-words">
                  {provider.name}
                </h1>
                {provider.verified && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    Verified
                  </Badge>
                )}
                {provider.topRated && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    Top Rated
                  </Badge>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600 break-words">
                {provider.major || "ICT Professional"} • {provider.company}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                  <b>{provider.rating}</b> ({provider.reviewCount})
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{provider.location}</span>
                </span>
                <span className="whitespace-nowrap">
                  RM{provider.hourlyRate}/hr
                </span>
                <span className="whitespace-nowrap">
                  {provider.completedJobs} completed jobs
                </span>
                {provider.yearsExperience && provider.yearsExperience > 0 && (
                  <span className="whitespace-nowrap">
                    {provider.yearsExperience} years experience
                  </span>
                )}
                <span className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {provider.languages?.map((l) => (
                    <Badge
                      key={l}
                      variant="secondary"
                      className="text-[10px] sm:text-xs"
                    >
                      {l}
                    </Badge>
                  ))}
                </span>
              </div>
            </div>
          </div>
          <Separator className="my-3 sm:my-4" />
          <p className="text-sm sm:text-base text-gray-800 break-words">
            {provider.bio}
          </p>
          <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
            {provider.skills.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="text-[10px] sm:text-xs"
              >
                {s}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Portfolio</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Recent work and case studies
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <PortfolioGrid items={portfolio} />
            </CardContent>
          </Card>

          {/* Completed Projects */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                Completed Projects
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Showcase of completed work
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {loadingPortfolio ? (
                <div className="flex items-center justify-center py-8 sm:py-12">
                  <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-xs sm:text-sm text-gray-600">
                    Loading projects...
                  </span>
                </div>
              ) : portfolioProjects.length === 0 ? (
                <div className="text-center py-8 sm:py-12 px-4">
                  <Globe className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                    No completed projects yet
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Completed projects will appear here automatically once the
                    provider finishes working on them.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                  {portfolioProjects.map((project) => (
                    <Card
                      key={project.id}
                      className="hover:shadow-lg transition-shadow"
                    >
                      <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 h-40 sm:h-48 flex items-center justify-center rounded-t-lg">
                        <div className="text-center p-3 sm:p-4">
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <Award className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                          </div>
                          <Badge
                            variant="secondary"
                            className="text-[10px] sm:text-xs"
                          >
                            {project.category || "Project"}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-3 sm:p-4">
                        <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1.5 sm:mb-2 line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                          {project.description || "No description provided"}
                        </p>
                        {project.technologies &&
                          project.technologies.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                              {project.technologies
                                .slice(0, 6)
                                .map((tech: string, index: number) => (
                                  <Badge
                                    key={index}
                                    variant="secondary"
                                    className="text-[10px] sm:text-xs"
                                  >
                                    {tech}
                                  </Badge>
                                ))}
                              {project.technologies.length > 6 && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] sm:text-xs"
                                >
                                  +{project.technologies.length - 6} more
                                </Badge>
                              )}
                            </div>
                          )}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs sm:text-sm text-gray-500">
                          <span className="font-medium truncate">
                            {project.client}
                          </span>
                          {project.completedDate && (
                            <span className="whitespace-nowrap">
                              {new Date(
                                project.completedDate
                              ).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">Reviews</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                What clients say
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <ReviewsList reviews={reviews} />
            </CardContent>
          </Card>

          {/* Resume */}
          {resume && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">Resume</CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Provider&apos;s resume
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">Resume</p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        Uploaded on {new Date(resume.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadResume}
                    className="text-xs sm:text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                Hire {provider.name.split(" ")[0]}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Start a project or send a message
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
              <Button
                onClick={() => setIsProposalPopupOpen(true)}
                className="w-full text-xs sm:text-sm"
              >
                Request a Proposal
              </Button>
              {provider.allowMessages !== false && (
                <Button
                  variant="outline"
                  className="w-full text-xs sm:text-sm"
                  onClick={(e) => {
                    e.preventDefault();
                    handleContact(provider);
                  }}
                >
                  Send Message
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                Specialties
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Best-fit project types
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5 sm:gap-2 p-4 sm:p-6 pt-0">
              {provider.specialties.map((sp) => (
                <Badge
                  key={sp}
                  variant="secondary"
                  className="text-[10px] sm:text-xs"
                >
                  {sp}
                </Badge>
              ))}
            </CardContent>
          </Card>

          {/* Contact Information Card - Only show if privacy settings allow */}
          {(provider.email || provider.phone) && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Contact Information
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Direct contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm p-4 sm:p-6 pt-0">
                {provider.email && (
                  <div>
                    <p className="text-gray-500">Email</p>
                    <a
                      href={`mailto:${provider.email}`}
                      className="font-medium text-blue-600 hover:underline break-all"
                    >
                      {provider.email}
                    </a>
                  </div>
                )}
                {provider.phone && (
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <a
                      href={`tel:${provider.phone}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {provider.phone}
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
                Work preferences and details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm p-4 sm:p-6 pt-0">
              {provider.workPreference && (
                <div>
                  <p className="text-gray-500">Work Preference</p>
                  <p className="font-medium capitalize">
                    {provider.workPreference}
                  </p>
                </div>
              )}
              {provider.teamSize && provider.teamSize > 1 && (
                <div>
                  <p className="text-gray-500">Team Size</p>
                  <p className="font-medium">{provider.teamSize} members</p>
                </div>
              )}
              {(provider.minimumProjectBudget ||
                provider.maximumProjectBudget) && (
                <div>
                  <p className="text-gray-500">Project Budget Range</p>
                  <p className="font-medium">
                    {provider.minimumProjectBudget &&
                    provider.maximumProjectBudget
                      ? `RM ${provider.minimumProjectBudget.toLocaleString()} - RM ${provider.maximumProjectBudget.toLocaleString()}`
                      : provider.minimumProjectBudget
                      ? `From RM ${provider.minimumProjectBudget.toLocaleString()}`
                      : provider.maximumProjectBudget
                      ? `Up to RM ${provider.maximumProjectBudget.toLocaleString()}`
                      : "—"}
                  </p>
                </div>
              )}
              {provider.preferredProjectDuration && (
                <div>
                  <p className="text-gray-500">Preferred Project Duration</p>
                  <p className="font-medium">
                    {provider.preferredProjectDuration}
                  </p>
                </div>
              )}
              {provider.website && (
                <div>
                  <p className="text-gray-500">Website</p>
                  <a
                    href={
                      provider.website.startsWith("http")
                        ? provider.website
                        : `https://${provider.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {provider.website}
                  </a>
                </div>
              )}
              {provider.certificationsCount &&
                provider.certificationsCount > 0 && (
                  <div>
                    <p className="text-gray-500">Certifications</p>
                    <p className="font-medium">
                      {provider.certificationsCount} certification
                      {provider.certificationsCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* Certifications List */}
          {provider.certifications && provider.certifications.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Certifications
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Verified credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 sm:space-y-3 p-4 sm:p-6 pt-0">
                {provider.certifications.map((cert) => (
                  <div
                    key={cert.id}
                    className="border-b pb-2.5 sm:pb-3 last:border-0"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-xs sm:text-sm break-words">
                          {cert.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 break-words">
                          {cert.issuer}
                        </p>
                        <p className="text-[10px] sm:text-xs text-gray-400">
                          Issued:{" "}
                          {new Date(cert.issuedDate).toLocaleDateString()}
                        </p>
                      </div>
                      {cert.verified && (
                        <Badge className="bg-green-100 text-green-800 text-[10px] sm:text-xs flex-shrink-0">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Proposal Popup */}
      <ProposalPopup
        providerId={provider.id}
        providerName={provider.name}
        isOpen={isProposalPopupOpen}
        onClose={() => setIsProposalPopupOpen(false)}
        onSuccess={() => {
          // Refresh or show success message
          console.log("Proposal request sent successfully");
        }}
      />
    </div>
  );
}
