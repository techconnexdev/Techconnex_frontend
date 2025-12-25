"use client";

import { useEffect, useState, useCallback } from "react";
import { CustomerLayout } from "@/components/customer-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Eye, MapPin, Star, Trash2 } from "lucide-react";
import { getProfileImageUrl } from "@/lib/api";

type SavedProvider = {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  location: string;
  bio?: string;
  hourlyRate: number;
  availability: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  responseTime: string;
  skills: string[];
  verified?: boolean;
  topRated?: boolean;
  savedAt?: string;
};

export default function SavedProvidersPage() {
  const [providers, setProviders] = useState<SavedProvider[]>([]);
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
        setProviders([]);
        setLoading(false);
        return;
      }
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        }/providers/users/${encodeURIComponent(userId)}/saved-providers`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await res.json();
      setProviders(data.providers || []);
    } catch (e) {
      console.error("Failed to fetch saved providers", e);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchSaved();
  }, [fetchSaved]);

  const unsave = async (providerId: string) => {
    try {
      const userId = getUserId();
      if (!userId || !token) return;
      const res = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"
        }/providers/${providerId}/save?userId=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ token added here
          },
        }
      );
      if (!res.ok) throw new Error("Failed to unsave");
      setProviders((prev) => prev.filter((p) => p.id !== providerId));
    } catch (e) {
      console.error(e);
      alert("Failed to remove saved provider");
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Saved Providers
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Providers you have bookmarked
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm sm:text-base text-gray-600 text-center py-8">
            Loading saved providers...
          </p>
        ) : providers.length === 0 ? (
          <p className="text-sm sm:text-base text-gray-600 text-center py-8">
            You have no saved providers yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
            {providers.map((provider) => (
              <Card
                key={provider.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3 sm:pb-4 p-4 sm:p-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <Avatar className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex-shrink-0">
                      <AvatarImage src={getProfileImageUrl(provider.avatar)} />
                      <AvatarFallback className="text-xs sm:text-sm lg:text-base">
                        {provider.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                          {provider.name}
                        </h3>
                        {provider.topRated && (
                          <Badge className="bg-yellow-100 text-yellow-800 text-[10px] sm:text-xs">
                            Top Rated
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{provider.location}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                      <span className="font-medium text-xs sm:text-sm">
                        {provider.rating}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-500">
                        ({provider.reviewCount})
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500">
                      RM{provider.hourlyRate}/hr
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                    {provider.bio}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {provider.skills.slice(0, 4).map((skill) => (
                      <Badge
                        key={skill}
                        variant="secondary"
                        className="text-[10px] sm:text-xs"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Link
                      href={`/customer/providers/${provider.id}`}
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs sm:text-sm"
                      >
                        <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
                        View Profile
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => unsave(provider.id)}
                      className="text-xs sm:text-sm w-full sm:w-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />{" "}
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CustomerLayout>
  );
}
