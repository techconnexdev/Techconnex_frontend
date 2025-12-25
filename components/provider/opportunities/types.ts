export type Opportunity = {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  client: string;
  budget: string;
  budgetType: "fixed" | "hourly";
  timeline: string;
  skills: string[];
  postedTime: string;
  matchScore: number;
  proposals: number;
  category: string; // e.g. 'web' | 'mobile' | 'cloud'
  location: string;
  clientRating: number;
  clientJobs: number;
  avatar?: string;
  urgent?: boolean;
  verified?: boolean;
  hasSubmitted?: boolean;
  requirements?: string[];
  deliverables?: string[];
  clientInfo?: {
    companySize?: string;
    industry?: string;
    memberSince?: string | number;
    totalSpent?: string;
    avgRating?: number;
  };
};

export type ProposalDraft = {
  coverLetter: string;
  bidAmount: string;
  timeline: string;
  milestones: string;
  attachments: File[];
};
