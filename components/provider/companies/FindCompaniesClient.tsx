"use client";

import { useEffect, useState, useCallback } from "react";
import { ProviderCompaniesTour } from "@/components/provider/ProviderCompaniesTour";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Heart, Search } from "lucide-react";
import CompanyCard from "./sections/CompanyCard";
import type { Company, Option } from "./types";
import { getCompanyAiDrafts, getProfileImageUrl } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { FriendlyErrorState } from "@/components/FriendlyErrorState";
import { useI18n } from "@/contexts/I18nProvider";
import { ProviderCompaniesListSkeleton } from "@/components/provider/ProviderCompaniesSkeletons";
import { Skeleton } from "@/components/ui/skeleton";

/** Props come from the server page */
export default function FindCompaniesClient({
  ratings,
}: {
  industries: Option[];
  locations: Option[];
  companySizes: Option[];
  ratings: Option[];
}) {
  const { t, locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState(ratings[0]?.value ?? "all");
  const [verifiedFilter, setVerifiedFilter] = useState("all"); // all | verified | unverified
  const [sortBy, setSortBy] = useState("rating");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setError(null);
    setLoading(true);
    const userJson =
      typeof window !== "undefined" ? localStorage.getItem("user") : null;
    const userId = (() => {
      try {
        return userJson ? JSON.parse(userJson)?.id || "" : "";
      } catch {
        return "";
      }
    })();

    const params = new URLSearchParams();
    if (userId) params.append("userId", userId);
    if (searchQuery) params.append("search", searchQuery);
    if (ratingFilter !== "all") params.append("rating", ratingFilter);
    if (verifiedFilter === "verified") params.append("verified", "true");
    if (verifiedFilter === "unverified") params.append("verified", "false");

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    try {
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        }/companies?${params.toString()}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const data = await res.json();

      if (data.success) {
        // Transform avatar URLs
        let transformedCompanies = (data.companies || []).map(
          (company: Company) => ({
            ...company,
            avatar: getProfileImageUrl(company.avatar),
          })
        );

        // If any customerProfileIds exist, fetch AiDraft summaries and merge into companies
        const profileIds = transformedCompanies
          .map((c: Company) => c.customerProfileId)
          .filter(Boolean);
        if (profileIds.length > 0 && token) {
          try {
            const draftRes = await getCompanyAiDrafts(profileIds, locale);
            if (draftRes?.success && Array.isArray(draftRes.drafts)) {
              const draftMap = new Map(
                draftRes.drafts.map((d: { referenceId: string; summary: string }) => [d.referenceId, d.summary])
              );
              transformedCompanies = transformedCompanies.map(
                (c: Company) => ({
                  ...c,
                  aiExplanation:
                    c.customerProfileId && draftMap.has(c.customerProfileId)
                      ? draftMap.get(c.customerProfileId)
                      : c.aiExplanation,
                })
              );
            }
          } catch (err) {
            console.warn("Failed to fetch AI drafts for companies", err);
          }
        }

        setCompanies(transformedCompanies);
      } else {
        setError(
          getUserFriendlyErrorMessage(undefined, "provider find companies"),
        );
        setCompanies([]);
      }
    } catch (err) {
      setError(getUserFriendlyErrorMessage(err, "provider find companies"));
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, ratingFilter, verifiedFilter, locale]);

  const ratingLabel = useCallback(
    (opt: Option) => {
      switch (opt.value) {
        case "all":
          return t("provider.companies.filter.allRatings");
        case "5.0+":
          return t("provider.companies.rating.stars5");
        case "4.8+":
          return t("provider.companies.rating.stars48");
        case "4.5+":
          return t("provider.companies.rating.stars45");
        case "4.0+":
          return t("provider.companies.rating.stars40");
        case "3.5+":
          return t("provider.companies.rating.stars35");
        case "3.0+":
          return t("provider.companies.rating.stars30");
        case "2.5+":
          return t("provider.companies.rating.stars25");
        case "2.0+":
          return t("provider.companies.rating.stars20");
        case "1.5+":
          return t("provider.companies.rating.stars15");
        case "1.0+":
          return t("provider.companies.rating.stars10");
        default:
          return opt.label;
      }
    },
    [t],
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sort companies based on selected option
  const sortedCompanies = [...companies].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "projects":
        return (b.projectsPosted || 0) - (a.projectsPosted || 0);
      case "newest":
        // Backend already handles newest sorting, so just maintain order
        return 0;
      case "verified":
        // Sort verified companies first
        if (a.verified && !b.verified) return -1;
        if (!a.verified && b.verified) return 1;
        return 0;
      default:
        return 0;
    }
  });

  const filteredCompanies = sortedCompanies; // backend handles filtering, frontend handles sorting

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
      <ProviderCompaniesTour />
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4" data-tour-step="0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("provider.companies.title")}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {t("provider.companies.subtitle")}
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto" data-tour-step="1">
          <Link href="/provider/companies/saved" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto text-xs sm:text-sm">
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              {t("provider.companies.savedCompanies")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters (Search + Rating + Verified) */}
      <Card data-tour-step="2">
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={t("provider.companies.searchPlaceholder")}
                className="pl-10 text-sm sm:text-base"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue
                  placeholder={t("provider.companies.filter.allRatings")}
                />
              </SelectTrigger>
              <SelectContent>
                {ratings.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {ratingLabel(r)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger className="text-sm sm:text-base">
                <SelectValue
                  placeholder={t(
                    "provider.companies.filter.verificationPlaceholder",
                  )}
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("provider.companies.filter.allCompanies")}
                </SelectItem>
                <SelectItem value="verified">
                  {t("provider.companies.filter.verifiedOnly")}
                </SelectItem>
                <SelectItem value="unverified">
                  {t("provider.companies.filter.unverifiedOnly")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results header + Grid */}
      <div data-tour-step="3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
          {loading ? (
            <Skeleton className="h-5 w-44 sm:w-56 max-w-full" aria-hidden />
          ) : (
            <p className="text-sm sm:text-base text-gray-600">
              {t("provider.companies.resultsCount", {
                n: filteredCompanies.length,
              })}
            </p>
          )}
          <Select value={sortBy} onValueChange={setSortBy} disabled={loading}>
            <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
              <SelectValue
                placeholder={t("provider.companies.sort.placeholder")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">
                {t("provider.companies.sort.highestRated")}
              </SelectItem>
              <SelectItem value="verified">
                {t("provider.companies.sort.verifiedFirst")}
              </SelectItem>
              <SelectItem value="projects">
                {t("provider.companies.sort.mostProjects")}
              </SelectItem>
              <SelectItem value="newest">
                {t("provider.companies.sort.newest")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

      {/* Grid */}
      {loading ? (
        <ProviderCompaniesListSkeleton
          loadingLabel={t("provider.companies.loading")}
        />
      ) : error ? (
        <FriendlyErrorState
          variant="block"
          message={error}
          onRetry={() => {
            setError(null);
            fetchData();
          }}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-stretch">
          {filteredCompanies.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
