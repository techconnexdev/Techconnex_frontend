/**
 * Public homepage API types and server-side fetch.
 * Used by the landing page to show top freelancers, companies, and latest jobs.
 */

import { cache } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface HomepageFreelancer {
  id: string;
  name: string;
  rating: number;
  totalProjects: number;
  profileImageUrl: string | null;
}

export interface HomepageCompany {
  id: string;
  name: string;
  industry: string | null;
  employeeCount: number | null;
  profileImageUrl: string | null;
}

export interface HomepageJob {
  id: string;
  title: string;
  budgetMin: number;
  budgetMax: number;
  skills: string[];
  category: string;
  createdAt: string;
}

export interface HomepageData {
  topFreelancers: HomepageFreelancer[];
  topCompanies: HomepageCompany[];
  latestJobs: HomepageJob[];
}

/**
 * Fetch public homepage data from the backend. No auth required.
 * Returns null on failure so the page can fall back to config/placeholders.
 */
export interface PublicShowcaseOpportunityMilestone {
  id?: string;
  order?: number;
  title: string;
  description?: string | null;
  amount?: number | null;
  dueDate?: string | null;
}

export interface PublicShowcaseOpportunity {
  id: string;
  title: string;
  description?: string | null;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  displayBudgetMin?: number | null;
  displayBudgetMax?: number | null;
  originalBudgetMin?: number | null;
  originalBudgetMax?: number | null;
  currencyCode?: string;
  displayCurrencyCode?: string;
  originalCurrencyCode?: string;
  conversionMeta?: {
    snapshotDate?: string | null;
    snapshotSession?: string | null;
    usedSnapshot?: boolean;
  };
  timeline?: string | null;
  priority?: string | null;
  skills?: string[];
  requirements?: string | string[] | null;
  deliverables?: string | string[] | null;
  milestones?: PublicShowcaseOpportunityMilestone[];
  customer?: {
    id?: string;
    name?: string | null;
    isVerified?: boolean;
    customerProfile?: {
      companySize?: string | null;
      industry?: string | null;
      location?: string | null;
      website?: string | null;
      profileImageUrl?: string | null;
      projectsPosted?: number | null;
    } | null;
  } | null;
  _count?: { proposals?: number };
  createdAt: string;
  hasProposed?: boolean;
}

/**
 * Cached fetch for public OPEN service request detail (showcase project page).
 */
export const fetchPublicJobById = cache(async function fetchPublicJobById(
  id: string,
): Promise<{ success: true; opportunity: PublicShowcaseOpportunity } | null> {
  try {
    const res = await fetch(`${API_BASE}/public/jobs/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.opportunity) return null;
    return {
      success: true,
      opportunity: json.opportunity as PublicShowcaseOpportunity,
    };
  } catch {
    return null;
  }
});

export async function fetchHomepageData(options?: {
  /** Capped at 12 to match the public API. */
  limit?: number;
}): Promise<HomepageData | null> {
  try {
    const limit = Math.min(Math.max(options?.limit ?? 6, 1), 12);
    const res = await fetch(`${API_BASE}/public/homepage?limit=${limit}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    return json.data as HomepageData;
  } catch {
    return null;
  }
}
