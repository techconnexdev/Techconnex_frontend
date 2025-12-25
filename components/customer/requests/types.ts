export type Option = { value: string; label: string };

export interface ServiceRequest {
  id: string;
  customerId: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  aiStackSuggest: string[];
  priority: string;
  status: string;
  ndaSigned: boolean;
}

export interface ProviderRequest {
  id: string;
  providerId: string;
  providerName: string;
  providerAvatar: string;
  providerRating: number;
  providerLocation: string;
  providerResponseTime: string;
  serviceRequestId: string;
  projectTitle: string;
  bidAmount: number;
  proposedTimeline: string;
  coverLetter: string;
  status: "pending" | "accepted" | "rejected";
  submittedAt: string;
  skills: string[];
  portfolio: string[];
  experience: string;
  attachmentUrl?: string;
  serviceRequest: ServiceRequest;
}
