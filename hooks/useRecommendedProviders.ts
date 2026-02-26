"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getRecommendedProviders } from "@/lib/api";
import { getProfileImageUrl } from "@/lib/api";

export type RecommendedProvider = {
  id: string;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  completedJobs: number;
  hourlyRate: number;
  location: string;
  avatar: string;
  skills: string[];
  verified: boolean;
  matchScore?: number;
  recommendedFor?: { id?: string; title?: string; [key: string]: unknown };
  aiExplanation: string | null;
  yearsExperience?: number;
  successRate?: number;
  responseTime?: number;
  workPreference?: string;
  availability?: string;
};

function mapApiProviderToRecommended(provider: Record<string, unknown>): RecommendedProvider {
  return {
    id: String(provider.id ?? ""),
    name: String(provider.name ?? ""),
    specialty: String(provider.major ?? "ICT Professional"),
    rating: Number(provider.rating ?? 0),
    reviewCount: Number(provider.reviewCount ?? 0),
    completedJobs: Number(provider.completedJobs ?? 0),
    hourlyRate: Number(provider.hourlyRate ?? 0),
    location: String(provider.location ?? "Malaysia"),
    avatar: getProfileImageUrl(
      (provider.avatar as string | undefined) ||
        (provider.profileImageUrl as string | undefined)
    ),
    skills: Array.isArray(provider.skills) ? (provider.skills as string[]) : [],
    verified: Boolean(provider.isVerified),
    matchScore: typeof provider.matchScore === "number" ? provider.matchScore : undefined,
    recommendedFor: provider.recommendedForServiceRequest as RecommendedProvider["recommendedFor"],
    aiExplanation: (provider.aiExplanation as string) || null,
    yearsExperience: typeof provider.yearsExperience === "number" ? provider.yearsExperience : undefined,
    successRate: typeof provider.successRate === "number" ? provider.successRate : undefined,
    responseTime: typeof provider.responseTime === "number" ? provider.responseTime : undefined,
    workPreference: typeof provider.workPreference === "string" ? provider.workPreference : undefined,
    availability: typeof provider.availability === "string" ? provider.availability : undefined,
  };
}

export type UseRecommendedProvidersResult = {
  providers: RecommendedProvider[];
  loading: boolean;
  error: string | null;
  cacheInfo: { cachedAt: number | null; nextRefreshAt: number | null };
  refetch: () => Promise<void>;
};

/**
 * Single source for AI-recommended providers. Pass serviceRequestId to get
 * top 5 for that opportunity only (same algorithm as provider opportunities).
 */
export function useRecommendedProviders(serviceRequestId?: string): UseRecommendedProvidersResult {
  const [providers, setProviders] = useState<RecommendedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{
    cachedAt: number | null;
    nextRefreshAt: number | null;
  }>({ cachedAt: null, nextRefreshAt: null });

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRecommendedProviders(serviceRequestId);
      if (res.success && Array.isArray(res.recommendations)) {
        setProviders(res.recommendations.map((p: Record<string, unknown>) => mapApiProviderToRecommended(p)));
        setCacheInfo({
          cachedAt: res.cachedAt ?? null,
          nextRefreshAt: res.nextRefreshAt ?? null,
        });
      } else {
        setProviders([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load recommendations");
      setProviders([]);
    } finally {
      setLoading(false);
    }
  }, [serviceRequestId]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Auto-refresh when 2-hour cache expires (same as customer providers "AI find providers" and provider AI Recommended)
  const refetchRef = useRef(fetchProviders);
  refetchRef.current = fetchProviders;
  useEffect(() => {
    const next = cacheInfo.nextRefreshAt;
    if (next == null || typeof next !== "number") return;
    const now = Date.now();
    if (next <= now) {
      refetchRef.current();
      return;
    }
    const delay = next - now;
    const timeoutId = setTimeout(() => refetchRef.current(), delay);
    return () => clearTimeout(timeoutId);
  }, [cacheInfo.nextRefreshAt]);

  return { providers, loading, error, cacheInfo, refetch: fetchProviders };
}
