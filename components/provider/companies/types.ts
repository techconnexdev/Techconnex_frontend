export type Company = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  allowMessages?: boolean;
  avatar?: string;
  industry: string;
  location: string;
  companySize: string;
  rating: number;
  reviewCount: number;
  totalSpend: number;
  projectsPosted: number;
  description?: string;
  website?: string | null;
  memberSince: string;
  verified?: boolean;
  saved?: boolean;
  aiExplanation?: string; // AI-generated summary
  customerProfileId?: string; // ID for fetching AI drafts
  // Additional fields for detail view
  employeeCount?: number | null;
  establishedYear?: number | null;
  annualRevenue?: number | null;
  fundingStage?: string | null;
  mission?: string | null;
  values?: string[];
  languages?: string[];
  categoriesHiringFor?: string[];
  preferredContractTypes?: string[];
  remotePolicy?: string | null;
  hiringFrequency?: string | null;
  averageBudgetRange?: string | null;
  socialLinks?: string[];
  mediaGallery?: string[];
};

export type Option = { value: string; label: string };

export type Review = {
  id: string;
  author: string;
  rating: number;
  date: string; // ISO
  text: string;
  provider?: {
    name: string;
    location: string;
    rating: number;
  };
};

