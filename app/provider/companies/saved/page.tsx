"use client";

import { useEffect, useState, useCallback } from "react";
import { ProviderLayout } from "@/components/provider-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, MapPin, Star, Trash2, Building2 } from "lucide-react";
import type { Company } from "@/components/provider/companies/types";
import { getProfileImageUrl } from "@/lib/api";

export default function SavedCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("token") || "");
    }
  }, []);

  const getUserId = () => {
    if (typeof window === "undefined") return "";
    const userJson = localStorage.getItem("user");
    try {
      return userJson ? JSON.parse(userJson)?.id || "" : "";
    } catch {
      return "";
    }
  };

  const fetchSaved = useCallback(async () => {
    try {
      const userId = getUserId();
      if (!userId || !token) {
        setCompanies([]);
        setLoading(false);
        return;
      }
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        }/companies/users/${encodeURIComponent(userId)}/saved-companies`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      if (data.success) {
        // Avatar URLs are handled by getProfileImageUrl in the component
        setCompanies(data.companies || []);
      }
    } catch (e) {
      console.error("Failed to fetch saved companies", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const unsave = async (companyId: string) => {
    try {
      const userId = getUserId();
      if (!userId || !token) return;
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
        }/companies/${companyId}/save?userId=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error("Failed to unsave");
      setCompanies((prev) => prev.filter((c) => c.id !== companyId));
    } catch (e) {
      console.error(e);
      alert("Failed to remove saved company");
    }
  };

  return (
    <ProviderLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Saved Companies
            </h1>
            <p className="text-gray-600">Companies you have bookmarked</p>
          </div>
        </div>

        {loading ? (
          <p>Loading saved companies...</p>
        ) : companies.length === 0 ? (
          <p className="text-gray-600">You have no saved companies yet.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Card
                key={company.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-16 h-16">
                      <AvatarImage src={getProfileImageUrl(company.avatar)} />
                      <AvatarFallback>
                        <Building2 className="w-8 h-8" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {company.industry}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin className="w-3 h-3" /> {company.location}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{company.rating}</span>
                      <span className="text-sm text-gray-500">
                        ({company.reviewCount})
                      </span>
                    </div>
                    <div className="text-sm text-gray-500">
                      {company.projectsPosted} projects
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 line-clamp-2">
                    {company.description}
                  </p>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/provider/companies/${company.id}`}>
                      <Button size="sm" variant="outline" className="w-full">
                        <Eye className="w-4 h-4 mr-2" /> View Profile
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => unsave(company.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProviderLayout>
  );
}
