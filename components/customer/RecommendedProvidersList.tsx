"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  MapPin,
  Sparkles,
  ChevronRight,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import type { RecommendedProvider } from "@/hooks/useRecommendedProviders";
import { formatProviderMoney } from "@/lib/provider-currency-format";
import { CustomerRecommendedProvidersCompactSkeleton } from "@/components/customer/CustomerPageSkeletons";

type RecommendedProvidersListProps = {
  providers: RecommendedProvider[];
  loading: boolean;
  error: string | null;
  cacheInfo?: { cachedAt: number | null; nextRefreshAt: number | null };
  onContact?: (provider: RecommendedProvider) => void;
  showCacheInfo?: boolean;
  compact?: boolean;
  emptyMessage?: string;
};

export function RecommendedProvidersList({
  providers,
  loading,
  error,
  cacheInfo,
  onContact,
  showCacheInfo = false,
  compact = false,
  emptyMessage,
}: RecommendedProvidersListProps) {
  const { t, locale } = useI18n();
  const resolvedEmptyMessage =
    emptyMessage ??
    `${t("customer.providers.recommended.emptyTitle")}. ${t("customer.providers.recommended.emptyBody")}`;
  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(
    null,
  );
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const handleCardMouseEnter = (providerId: string) => {
    clearHideTimer();
    setExpandedProviderId(providerId);
  };

  const handleCardMouseLeave = (providerId: string) => {
    clearHideTimer();
    hideTimerRef.current = setTimeout(() => {
      setExpandedProviderId((current) =>
        current === providerId ? null : current,
      );
      hideTimerRef.current = null;
    }, 180);
  };

  useEffect(() => {
    return () => {
      clearHideTimer();
    };
  }, []);

  if (loading) {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-live="polite"
        className="py-1"
      >
        <span className="sr-only">{t("customer.providers.loading.list")}</span>
        <CustomerRecommendedProvidersCompactSkeleton
          count={compact ? 2 : 3}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-6 sm:py-8 text-sm sm:text-base">
        {error}
      </div>
    );
  }

  if (providers.length === 0) {
    return (
      <div className="text-center text-gray-500 py-6 sm:py-8 text-sm sm:text-base">
        {resolvedEmptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {showCacheInfo &&
        cacheInfo?.cachedAt != null &&
        cacheInfo?.nextRefreshAt != null && (
          <div className="text-xs text-gray-500 mb-2">
            {(() => {
              const now = Date.now();
              const ageMs = now - cacheInfo.cachedAt;
              const remainingMs = cacheInfo.nextRefreshAt - now;
              const ageMinutes = Math.floor(ageMs / 60000);
              const remainingMinutes = Math.floor(remainingMs / 60000);
              const remainingHours = Math.floor(remainingMinutes / 60);
              const remainingMins = remainingMinutes % 60;
              const updatedLabel =
                ageMinutes <= 0
                  ? t("customer.providers.cache.justNow")
                  : ageMinutes === 1
                    ? t("customer.providers.cache.updatedOneMinute")
                    : t("customer.providers.cache.updatedMinutes", {
                        n: ageMinutes,
                      });
              const nextLabel =
                remainingMs > 0
                  ? remainingHours > 0
                    ? t("customer.providers.cache.nextHoursMinutes", {
                        h: remainingHours,
                        m: remainingMins,
                      })
                    : t("customer.providers.cache.nextMinutes", {
                        m: Math.max(1, remainingMins),
                      })
                  : null;
              return (
                <>
                  <span>{updatedLabel}</span>
                  {nextLabel && (
                    <>
                      {" • "}
                      <span>{nextLabel}</span>
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}
      {providers.map((provider) => (
        <div
          key={provider.id}
          className={`group relative border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 bg-white ${
            compact ? "p-3" : "p-4 sm:p-5"
          }`}
          onMouseEnter={() => handleCardMouseEnter(provider.id)}
          onMouseLeave={() => handleCardMouseLeave(provider.id)}
        >
          {Boolean(provider.aiExplanation) && (
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-medium shadow-md">
                <Sparkles className="w-3 h-3" />
                <span>{t("customer.providers.badge.aiInsights")}</span>
              </div>
            </div>
          )}

          <div
            className={`flex items-start space-x-2 sm:space-x-3 ${compact ? "pr-16" : "pr-20"}`}
          >
            <Avatar
              className={
                compact
                  ? "w-9 h-9 flex-shrink-0"
                  : "w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
              }
            >
              <AvatarImage src={provider.avatar || "/placeholder.svg"} />
              <AvatarFallback>{provider.name?.charAt(0) || "?"}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h4 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors text-sm sm:text-base">
                  {provider.name}
                </h4>
                {typeof provider.matchScore === "number" && (
                  <Badge
                    className={`text-xs font-semibold ${
                      provider.matchScore >= 80
                        ? "bg-green-100 text-green-700 border-green-300"
                        : provider.matchScore >= 60
                          ? "bg-blue-100 text-blue-700 border-blue-300"
                          : "bg-yellow-100 text-yellow-700 border-yellow-300"
                    }`}
                  >
                    {t("customer.providers.matchPercent", {
                      score: provider.matchScore,
                    })}
                  </Badge>
                )}
                {!provider.verified && (
                  <Badge className="text-xs bg-red-100 text-red-700 border-red-300">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {t("customer.providers.badge.notVerified")}
                  </Badge>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-600 truncate">
                {provider.specialty}
              </p>
              {Boolean(provider.recommendedFor?.title) && (
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  {t("customer.providers.recommendedFor", {
                    title: provider.recommendedFor?.title ?? "",
                  })}
                </p>
              )}
              {compact &&
                provider.availability != null &&
                provider.availability !== "" && (
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        provider.availability === "available" ||
                        provider.availability === "Available"
                          ? "bg-green-500"
                          : provider.availability === "busy"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                      }`}
                    />
                    <span className="text-xs text-gray-600 capitalize">
                      {provider.availability}
                    </span>
                  </div>
                )}
              {!compact && (
                <>
                  <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                    <span className="text-xs sm:text-sm font-medium">
                      {typeof provider.rating === "number"
                        ? provider.rating.toFixed(1)
                        : "0.0"}
                    </span>
                    {typeof provider.reviewCount === "number" &&
                      provider.reviewCount > 0 && (
                        <span className="text-xs sm:text-sm text-gray-500">
                          ({provider.reviewCount}{" "}
                          {provider.reviewCount === 1
                            ? t("customer.dashboard.stats.review")
                            : t("customer.dashboard.stats.reviews")})
                        </span>
                      )}
                    <span className="text-xs sm:text-sm text-gray-500">
                      •{" "}
                      {t("customer.providers.jobsCount", {
                        n:
                          typeof provider.completedJobs === "number"
                            ? provider.completedJobs
                            : 0,
                      })}
                    </span>
                    {typeof provider.yearsExperience === "number" &&
                      provider.yearsExperience > 0 && (
                        <span className="text-xs text-gray-500">
                          {t("customer.providers.yearsExpShort", {
                            years: provider.yearsExperience,
                          })}
                        </span>
                      )}
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                    <span className="text-xs text-gray-500 truncate">
                      {provider.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        provider.availability === "available" ||
                        provider.availability === "Available"
                          ? "bg-green-500"
                          : provider.availability === "busy"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                      }`}
                    />
                    <span className="text-xs text-gray-600 capitalize">
                      {provider.availability || "—"}
                    </span>
                    {provider.workPreference && (
                      <span className="text-xs text-gray-500 capitalize">
                        • {provider.workPreference}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5 sm:mt-2">
                    {provider.skills.slice(0, 2).map((skill) => (
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
                    {t("customer.providers.detail.hourlyRateLine", {
                      rate: formatProviderMoney(
                        typeof provider.hourlyRate === "number"
                          ? provider.hourlyRate
                          : 0,
                        provider.preferredCurrency,
                        locale,
                      ),
                    })}
                  </p>
                </>
              )}
            </div>
          </div>

          {Boolean(provider.aiExplanation) &&
            typeof provider.aiExplanation === "string" && (
              <div className="mt-3 sm:mt-4 overflow-hidden">
                <div
                  className={`${
                    expandedProviderId === provider.id ? "hidden" : "block"
                  } transition-all duration-300`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedProviderId(
                        expandedProviderId === provider.id ? null : provider.id,
                      )
                    }
                    className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 active:text-blue-800 font-medium touch-manipulation"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">
                      {t("customer.providers.hoverAiInsights")}
                    </span>
                    <span className="sm:hidden">
                      {t("customer.providers.tapAiInsights")}
                    </span>
                    <ChevronRight
                      className={`w-3 h-3 shrink-0 transition-transform ${
                        expandedProviderId === provider.id ? "rotate-90" : ""
                      }`}
                    />
                  </button>
                </div>
                <div
                  className={`${
                    expandedProviderId === provider.id ? "block" : "hidden"
                  } animate-in fade-in slide-in-from-top-2 duration-300`}
                >
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-lg border-2 border-blue-200 shadow-md">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                        <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-blue-900">
                        {t("customer.providers.whyRecommended")}
                      </p>
                      <button
                        type="button"
                        onClick={() => setExpandedProviderId(null)}
                        className="ml-auto lg:hidden text-blue-600 hover:text-blue-800 p-1"
                        aria-label={t("customer.providers.closeInsightsAria")}
                      >
                        <span className="text-lg">×</span>
                      </button>
                    </div>
                    <div className="text-xs sm:text-sm text-blue-800 space-y-1.5 sm:space-y-2">
                      {provider.aiExplanation
                        .split("\n")
                        .filter((line) => line.trim())
                        .map((line, index) => {
                          const cleanLine = line
                            .replace(/^[•\-*]\s*/, "")
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

          <div className="flex gap-2 mt-3 sm:mt-4 pt-3 border-t border-gray-200 group-hover:border-blue-200 transition-colors">
            <Link
              href={`/customer/providers/${provider.id}`}
              className="flex-1"
            >
              <Button
                size="sm"
                variant="outline"
                className="w-full text-xs sm:text-sm group-hover:border-blue-600 group-hover:text-blue-600 transition-colors"
              >
                {t("customer.providers.viewProfile")}
                <ChevronRight className="w-3.5 h-3.5 ml-1.5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            {onContact && (
              <Button
                size="sm"
                className="flex-1 text-xs sm:text-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300"
                onClick={() => onContact(provider)}
              >
                <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {t("customer.providers.contact")}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
