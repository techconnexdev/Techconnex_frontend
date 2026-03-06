/**
 * Public homepage API types and server-side fetch.
 * Used by the landing page to show top freelancers, companies, and latest jobs.
 */

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
export async function fetchHomepageData(): Promise<HomepageData | null> {
  try {
    const res = await fetch(`${API_BASE}/public/homepage?limit=6`, {
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
