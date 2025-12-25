"use client";

import { useEffect, useState } from "react";
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

/** Props come from the server page */
export default function FindCompaniesClient({
  locations,
  ratings,
}: {
  industries: Option[];
  locations: Option[];
  companySizes: Option[];
  ratings: Option[];
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState(
    locations[0]?.value ?? "all"
  );
  const [ratingFilter, setRatingFilter] = useState(ratings[0]?.value ?? "all");
  const [verifiedFilter, setVerifiedFilter] = useState("all"); // all | verified | unverified
  const [sortBy, setSortBy] = useState("rating");
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    if (locationFilter !== "all") params.append("location", locationFilter);
    if (ratingFilter !== "all") params.append("rating", ratingFilter);
    if (verifiedFilter === "verified") params.append("verified", "true");
    if (verifiedFilter === "unverified") params.append("verified", "false");

    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;

    const fetchData = async () => {
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
              const draftRes = await getCompanyAiDrafts(profileIds);
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
          console.error("API error:", data.message);
          setCompanies([]);
        }
      } catch (err) {
        console.error("Failed to fetch companies:", err);
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchQuery, locationFilter, ratingFilter, verifiedFilter]);

  // Sort companies based on selected option
  const sortedCompanies = [...companies].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "projects":
        return (b.projectsPosted || 0) - (a.projectsPosted || 0);
      case "spend":
        return (b.totalSpend || 0) - (a.totalSpend || 0);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Find Companies</h1>
          <p className="text-gray-600">
            Discover companies looking for ICT professionals
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/provider/companies/saved">
            <Button variant="outline">
              <Heart className="w-4 h-4 mr-2" />
              Saved Companies
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters (Search + Location + Rating + Verified) */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, industry..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
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
              <SelectTrigger>
                <SelectValue placeholder="Verification Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Companies</SelectItem>
                <SelectItem value="verified">Verified Only</SelectItem>
                <SelectItem value="unverified">Unverified Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Results header */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          {filteredCompanies.length} companies found
        </p>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Highest Rated</SelectItem>
            <SelectItem value="verified">Verified First</SelectItem>
            <SelectItem value="projects">Most Projects</SelectItem>
            <SelectItem value="spend">Highest Spender</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {loading ? (
        <p>Loading companies...</p>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((c) => (
            <CompanyCard key={c.id} company={c} />
          ))}
        </div>
      )}
    </div>
  );
}
