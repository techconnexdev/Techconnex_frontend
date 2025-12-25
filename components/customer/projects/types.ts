export type ProjectStatus = "pending" | "in_progress" | "completed" | "on_hold";

export interface Project {
  id: string;
  title: string;
  description: string;
  provider: string | null;
  status: ProjectStatus;
  progress: number; // 0..100
  budget: number;
  spent: number;
  deadline: string; // ISO date or yyyy-mm-dd
  startDate: string; // ISO
  avatar: string;
  category: string;
  milestones: number;
  completedMilestones: number;
  proposals?: Array<Record<string, unknown>>;
  timeline?: string;
  priority?: "Low" | "Medium" | "High";
  ndaSigned?: boolean;
  aiStackSuggest?: string[];
  // Additional fields from service request
  budgetMin?: number;
  budgetMax?: number;
  requirements?: string;
  deliverables?: string;
  customer?: Record<string, unknown>;
  project?: Record<string, unknown>;
}

export interface Milestone {
  id: string;
  title: string;
  amount: number;
  due: string; // ISO
  status: "PENDING" | "PAID" | "RELEASED";
}

export interface Bid {
  id: string;
  provider: string;
  amount: number;
  timeline: string;
  rating: number; // 0..5
  summary: string;
}

export interface FileItem {
  id: string;
  name: string;
  size: string;
  uploadedAt: string; // ISO
  url?: string;
}

export interface MessageItem {
  id: string;
  author: string;
  at: string; // ISO
  text: string;
}
