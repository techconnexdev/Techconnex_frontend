"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Eye, MapPin, MessageSquare, Star, Heart, Building2, Sparkles, ChevronRight } from "lucide-react";
import type { Company } from "../types";
import { useRouter } from "next/navigation";
import { getProfileImageUrl } from "@/lib/api";

export default function CompanyCard({ company }: { company: Company }) {
  const router = useRouter();
  const [saved, setSaved] = useState<boolean>(!!company.saved);
  const [expanded, setExpanded] = useState<boolean>(false);

  // Update saved state when company prop changes (e.g., after refresh)
  useEffect(() => {
    setSaved(!!company.saved);
  }, [company.saved]);

  const handleContact = () => {
    // Navigate to chat with this company
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
    <Card className="group relative hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage
                src={getProfileImageUrl(company.avatar)}
              />
              <AvatarFallback>
                <Building2 className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            {company.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">
                {company.name}
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-1">{company.industry}</p>
            <p className="text-xs text-gray-500">{company.companySize}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* AI Badge Indicator */}
        {company.aiExplanation && (
          <div className="absolute top-3 right-3 opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-medium shadow-md">
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">AI Insights</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="font-medium">{company.rating}</span>
            <span className="text-sm text-gray-500">
              ({company.reviewCount})
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-3 h-3" />
            {company.location}
          </div>
        </div>

        <p className="text-sm text-gray-600 line-clamp-3">
          {company.description}
        </p>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Projects Posted</p>
            <p className="font-semibold">{company.projectsPosted}</p>
          </div>
          <div>
            <p className="text-gray-500">Total Spent</p>
            <p className="font-semibold">
              RM{company.totalSpend.toLocaleString()}
            </p>
          </div>
          {company.establishedYear && (
            <div>
              <p className="text-gray-500">Established</p>
              <p className="font-semibold">{company.establishedYear}</p>
            </div>
          )}
          {company.employeeCount && (
            <div>
              <p className="text-gray-500">Employees</p>
              <p className="font-semibold">{company.employeeCount}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Member since {company.memberSince}
          </span>
        </div>

        {/* AI Explanation - Responsive: Hover on desktop, Click on mobile */}
        {company.aiExplanation && (
          <div className="mt-2 sm:mt-3 overflow-hidden w-full">
            <div
              className={`lg:group-hover:hidden ${
                expanded ? "hidden" : "block"
              } transition-all duration-300`}
            >
              <button
                onClick={() => setExpanded(expanded ? false : true)}
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium touch-manipulation"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">
                  Hover to see AI insights
                </span>
                <span className="sm:hidden">Tap to see AI insights</span>
                <ChevronRight
                  className={`w-3 h-3 shrink-0 transition-transform ${
                    expanded ? "rotate-90" : ""
                  }`}
                />
              </button>
            </div>

            <div
              className={`lg:group-hover:block ${
                expanded ? "block" : "hidden"
              } animate-in fade-in slide-in-from-top-2 duration-300`}
            >
              <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-200 shadow-md">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-blue-900">
                    About this company
                  </p>
                  <button
                    onClick={() => setExpanded(false)}
                    className="ml-auto lg:hidden text-blue-600 hover:text-blue-800 p-1"
                  >
                    ×
                  </button>
                </div>
                <div className="text-xs sm:text-sm text-blue-800 space-y-1.5 sm:space-y-2">
                  {company.aiExplanation
                    .split("\n")
                    .filter((line: string) => line.trim())
                    .map((line: string, index: number) => {
                      const cleanLine = line.replace(/^[•\-\*]\s*/, "").trim();
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
                              isWarning ? "text-red-600" : "text-blue-600"
                            }`}
                          >
                            •
                          </span>
                          <span
                            className={`leading-relaxed break-words ${
                              isWarning ? "text-red-800 font-medium" : ""
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

        <div className="flex gap-2 pt-2">
          {company.allowMessages !== false && (
            <Button size="sm" className="flex-1" onClick={handleContact}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact
            </Button>
          )}
          <Button
            size="sm"
            variant={saved ? "default" : "outline"}
            onClick={handleSaveToggle}
            className={saved ? "bg-red-600 hover:bg-red-700 text-white" : ""}
          >
            <Heart className={`w-4 h-4 ${saved ? "fill-current" : ""}`} />
          </Button>
          <Link href={`/provider/companies/${company.id}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              View Profile
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
