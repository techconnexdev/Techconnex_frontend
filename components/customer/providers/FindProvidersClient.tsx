"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Heart,
  Search,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Star,
  MapPin,
  MessageSquare,
  Loader2,
} from "lucide-react";
import ProviderCard from "./sections/ProviderCard";
import type { Provider, Option } from "./types";
import {
  getRecommendedProviders,
  searchProviders,
  getProviderAiDrafts,
  getProfileImageUrl,
} from "@/lib/api";

// Extended provider type for recommended providers with AI-specific fields
type RecommendedProvider = Provider & {
  profileId?: string | null;
  specialty?: string;
  matchScore?: number;
  recommendedFor?: {
    title: string;
  };
  aiExplanation?: string | null;
  successRate?: number;
};

/** Props come from the server page */
export default function FindProvidersClient({
  ratings,
}: {
  ratings: Option[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState(ratings[0]?.value ?? "all");
  const [verifiedFilter, setVerifiedFilter] = useState("all"); // all | verified | unverified
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  // Recommended providers state
  const [recommendedProviders, setRecommendedProviders] = useState<RecommendedProvider[]>([]);
  const [loadingRecommended, setLoadingRecommended] = useState(true);
  const [errorRecommended, setErrorRecommended] = useState<string | null>(null);
  const [recommendationsCacheInfo, setRecommendationsCacheInfo] = useState<{
    cachedAt: number | null;
    nextRefreshAt: number | null;
  }>({ cachedAt: null, nextRefreshAt: null });
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
    null
  );

  // Fetch all providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const response = await searchProviders({
          search: searchQuery || undefined,
          rating: ratingFilter !== "all" ? ratingFilter : undefined,
          page: 1,
          limit: 100,
        });

        if (response.success) {
          let filtered = response.providers || [];

          // Apply verified filter on frontend since API might not support it
          if (verifiedFilter === "verified") {
            filtered = filtered.filter((p: Provider & { isVerified?: boolean; profileId?: string | null }) => p.isVerified === true);
          } else if (verifiedFilter === "unverified") {
            filtered = filtered.filter((p: Provider & { isVerified?: boolean; profileId?: string | null }) => p.isVerified !== true);
          }

          // For "All" tab: Only use AI drafts, ignore any aiExplanation from search results
          const profileIds = filtered
            .map((p: Provider & { profileId?: string | null }) => p.profileId)
            .filter(Boolean) as string[];
          if (profileIds.length > 0) {
            try {
              const draftRes = await getProviderAiDrafts(profileIds);
              if (draftRes?.success && Array.isArray(draftRes.drafts)) {
                const draftMap = new Map(
                  draftRes.drafts.map((d: { referenceId: string; summary: string }) => [d.referenceId, d.summary])
                );
                filtered = filtered.map((p: Provider & { profileId?: string | null }) => ({
                  ...p,
                  // Only use draft summary for "All" tab, ignore any aiExplanation from search API
                  aiExplanation:
                    p.profileId && draftMap.has(p.profileId)
                      ? draftMap.get(p.profileId) || null
                      : null,
                }));
              }
            } catch (err) {
              console.warn("Failed to fetch AI drafts for providers", err);
            }
          }

          setProviders(filtered);
        } else {
          setProviders([]);
        }
      } catch (err) {
        console.error("Failed to fetch providers:", err);
        setProviders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [searchQuery, ratingFilter, verifiedFilter]);

  // Fetch recommended providers
  useEffect(() => {
    const fetchRecommendedProviders = async () => {
      try {
        setLoadingRecommended(true);
        setErrorRecommended(null);

        const response = await getRecommendedProviders();
        if (response.success) {
          // Map recommended providers and include profileId if present
          const raw = response.recommendations || [];
          const mappedProviders: RecommendedProvider[] = raw.map((provider: Record<string, unknown>) => ({
            id: provider.id as string,
            profileId: (provider.profileId as string | undefined) || null,
            name: provider.name as string,
            specialty: (provider.major as string | undefined) || "ICT Professional",
            rating: (provider.rating as number | undefined) || 0,
            completedJobs: (provider.completedJobs as number | undefined) || 0,
            hourlyRate: (provider.hourlyRate as number | undefined) || 0,
            location: (provider.location as string | undefined) || "Malaysia",
            avatar: getProfileImageUrl(provider.avatar as string | undefined),
            skills: Array.isArray(provider.skills) ? (provider.skills as string[]) : [],
            verified: (provider.isVerified as boolean | undefined) || false,
            matchScore: provider.matchScore as number | undefined,
            recommendedFor: provider.recommendedForServiceRequest as { title: string } | undefined,
            // For "AI Recommended" tab: Use the aiExplanation from recommendation API, don't fetch drafts
            aiExplanation: (provider.aiExplanation as string | undefined) || null,
            yearsExperience: provider.yearsExperience as number | undefined,
            successRate: provider.successRate as number | undefined,
            responseTime: (provider.responseTime as string | undefined) || "",
            reviewCount: (provider.reviewCount as number | undefined) || 0,
            availability: (provider.availability as string | undefined) || "",
            specialties: Array.isArray(provider.specialties) ? (provider.specialties as string[]) : [],
          }));

          // Don't fetch drafts for recommended providers - use the aiExplanation from the recommendation API

          setRecommendedProviders(mappedProviders);
          setRecommendationsCacheInfo({
            cachedAt: response.cachedAt,
            nextRefreshAt: response.nextRefreshAt,
          });
        } else {
          setRecommendedProviders([]);
        }
      } catch (err) {
        console.error("Error fetching recommended providers:", err);
        setErrorRecommended(
          err instanceof Error
            ? err.message
            : "Failed to fetch recommended providers"
        );
        setRecommendedProviders([]);
      } finally {
        setLoadingRecommended(false);
      }
    };

    fetchRecommendedProviders();
  }, []);

  const filteredProviders = providers; // backend handles filtering

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Find ICT Professionals
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Discover and hire top-rated ICT experts for your projects
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Link href="/customer/providers/saved" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Saved Providers
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters (Search + Rating + Verified) */}
      <Card>
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, skills..."
                className="pl-10 text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="text-sm sm:text-base w-full">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                {ratings.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="text-sm sm:text-base w-full">
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Providers</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="recommended">AI Recommended</TabsTrigger>
          </TabsList>
          <Select defaultValue="rating">
            <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="experience">Most Experienced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* All Providers Tab */}
        <TabsContent value="all" className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <p className="text-sm sm:text-base text-gray-600">
              {filteredProviders.length} providers found
            </p>
          </div>
          {loading ? (
            <div className="text-center py-8 sm:py-12">
              <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-sm sm:text-base text-gray-600">
                Loading providers...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {filteredProviders.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* AI Recommended Providers Tab */}
        <TabsContent value="recommended" className="space-y-4 sm:space-y-6">
          {recommendationsCacheInfo.cachedAt &&
            recommendationsCacheInfo.nextRefreshAt && (
              <div className="text-xs text-gray-500 mb-2">
                {(() => {
                  const now = Date.now();
                  const cachedAt = recommendationsCacheInfo.cachedAt;
                  const nextRefreshAt = recommendationsCacheInfo.nextRefreshAt;
                  const ageMs = now - cachedAt;
                  const remainingMs = nextRefreshAt - now;

                  const ageMinutes = Math.floor(ageMs / 60000);
                  const remainingMinutes = Math.floor(remainingMs / 60000);
                  const remainingHours = Math.floor(remainingMinutes / 60);
                  const remainingMins = remainingMinutes % 60;

                  return (
                    <>
                      <span>
                        Updated: {ageMinutes} minute
                        {ageMinutes !== 1 ? "s" : ""} ago
                      </span>
                      {remainingMs > 0 && (
                        <>
                          {" • "}
                          <span>
                            Next refresh: in{" "}
                            {remainingHours > 0
                              ? `${remainingHours} hour${
                                  remainingHours !== 1 ? "s" : ""
                                } `
                              : ""}
                            {remainingMins} minute
                            {remainingMins !== 1 ? "s" : ""}
                          </span>
                        </>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

          {loadingRecommended ? (
            <div className="text-center py-8 sm:py-12">
              <Loader2 className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-sm sm:text-base text-gray-600">
                Loading recommended providers...
              </p>
            </div>
          ) : errorRecommended ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-xl">⚠️</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Error loading recommendations
                </h3>
                <p className="text-gray-600 mb-4">{errorRecommended}</p>
                <Button
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : recommendedProviders.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No recommended providers found
                </h3>
                <p className="text-gray-600">
                  Create a project request to get AI-matched provider
                  recommendations!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {recommendedProviders.map((provider) => {
                const isExpanded = expandedProviderId === provider.id;
                return (
                  <Card
                    key={provider.id}
                    className="group relative p-3 sm:p-4 md:p-5 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 bg-white"
                  >
                    {/* AI Badge Indicator - Desktop hover only */}
                    {provider.aiExplanation && (
                      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-medium shadow-md">
                          <Sparkles className="w-3 h-3" />
                          <span className="hidden sm:inline">AI Insights</span>
                        </div>
                      </div>
                    )}

                    <CardContent className="p-0">
                      <div className="flex items-start space-x-2 sm:space-x-3 pr-0 sm:pr-20">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                          <AvatarImage
                            src={provider.avatar || "/placeholder.svg"}
                          />
                          <AvatarFallback>
                            {provider.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base">
                              {provider.name}
                            </h4>
                            {provider.matchScore !== undefined && (
                              <Badge
                                className={`text-xs font-semibold shrink-0 ${
                                  provider.matchScore >= 80
                                    ? "bg-green-100 text-green-700 border-green-300"
                                    : provider.matchScore >= 60
                                    ? "bg-blue-100 text-blue-700 border-blue-300"
                                    : "bg-yellow-100 text-yellow-700 border-yellow-300"
                                }`}
                              >
                                {provider.matchScore}% match
                              </Badge>
                            )}
                            {!provider.verified && (
                              <Badge className="text-xs bg-red-100 text-red-700 border-red-300 shrink-0">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Not Verified
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 truncate">
                            {provider.specialty}
                          </p>
                          {provider.recommendedFor && (
                            <p className="text-xs text-blue-600 mt-1 font-medium">
                              Recommended for: {provider.recommendedFor.title}
                            </p>
                          )}
                          <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium">
                              {provider.rating.toFixed(1)}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-500">
                              ({provider.completedJobs} jobs)
                            </span>
                            {(provider.yearsExperience ?? 0) > 0 && (
                              <span className="text-xs text-gray-500">
                                • {provider.yearsExperience} years exp.
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="text-xs text-gray-500 truncate">
                              {provider.location}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                            {provider.skills
                              .slice(0, 2)
                              .map((skill: string) => (
                                <Badge
                                  key={skill}
                                  variant="secondary"
                                  className="text-xs group-hover:bg-blue-100 group-hover:text-blue-700 transition-colors border"
                                >
                                  {skill}
                                </Badge>
                              ))}
                            {provider.skills.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{provider.skills.length - 2}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs sm:text-sm font-medium text-blue-600 mt-1.5 sm:mt-2">
                            RM{provider.hourlyRate}/hour
                          </p>
                        </div>
                      </div>

                      {/* AI Explanation - Responsive: Hover on desktop, Click on mobile */}
                      {provider.aiExplanation && (
                        <div className="mt-3 sm:mt-4 overflow-hidden">
                          {/* Collapsed State - Desktop hover, Mobile click */}
                          <div
                            className={`lg:group-hover:hidden ${
                              isExpanded ? "hidden" : "block"
                            } transition-all duration-300`}
                          >
                            <button
                              onClick={() =>
                                setExpandedProviderId(
                                  isExpanded ? null : provider.id
                                )
                              }
                              className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium touch-manipulation"
                            >
                              <Sparkles className="w-3.5 h-3.5 shrink-0" />
                              <span className="hidden sm:inline">
                                Hover to see AI insights
                              </span>
                              <span className="sm:hidden">
                                Tap to see AI insights
                              </span>
                              <ChevronRight
                                className={`w-3 h-3 shrink-0 transition-transform ${
                                  isExpanded ? "rotate-90" : ""
                                }`}
                              />
                            </button>
                          </div>

                          {/* Expanded State - Shows on hover (desktop) or click (mobile) */}
                          <div
                            className={`lg:group-hover:block ${
                              isExpanded ? "block" : "hidden"
                            } animate-in fade-in slide-in-from-top-2 duration-300`}
                          >
                            <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-200 shadow-md">
                              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                                <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-blue-900">
                                  Why this provider is recommended:
                                </p>
                                {/* Close button for mobile */}
                                <button
                                  onClick={() => setExpandedProviderId(null)}
                                  className="ml-auto lg:hidden text-blue-600 hover:text-blue-800 p-1"
                                  aria-label="Close insights"
                                >
                                  <span className="text-lg">×</span>
                                </button>
                              </div>
                              <div className="text-xs sm:text-sm text-blue-800 space-y-1.5 sm:space-y-2">
                                {provider.aiExplanation
                                  .split("\n")
                                  .filter((line: string) => line.trim())
                                  .map((line: string, index: number) => {
                                    const cleanLine = line
                                      .replace(/^[•\-\*]\s*/, "")
                                      .trim();
                                    const isWarning =
                                      cleanLine.includes("⚠️") ||
                                      cleanLine.includes("Warning");
                                    return cleanLine ? (
                                      <div
                                        key={index}
                                        className={`flex items-start gap-2 sm:gap-3 ${
                                          isWarning
                                            ? "bg-red-50 p-2 rounded border border-red-200"
                                            : ""
                                        }`}
                                      >
                                        <span
                                          className={`mt-0.5 font-bold flex-shrink-0 ${
                                            isWarning
                                              ? "text-red-600"
                                              : "text-blue-600"
                                          }`}
                                        >
                                          •
                                        </span>
                                        <span
                                          className={`leading-relaxed break-words ${
                                            isWarning
                                              ? "text-red-800 font-medium"
                                              : ""
                                          }`}
                                        >
                                          {cleanLine}
                                        </span>
                                      </div>
                                    ) : null;
                                  })}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4 pt-3 border-t border-gray-200 group-hover:border-blue-200 transition-colors">
                        <Link
                          href={`/customer/providers/${provider.id}`}
                          className="flex-1"
                        >
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full text-xs sm:text-sm group-hover:border-blue-600 group-hover:text-blue-600 transition-colors"
                          >
                            View Profile
                            <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                        <Link
                          href={`/customer/messages?userId=${
                            provider.id
                          }&name=${encodeURIComponent(
                            provider.name
                          )}&avatar=${encodeURIComponent(
                            provider.avatar || ""
                          )}`}
                          className="flex-1"
                        >
                          <Button
                            size="sm"
                            className="w-full text-xs sm:text-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300"
                          >
                            <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Contact
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
