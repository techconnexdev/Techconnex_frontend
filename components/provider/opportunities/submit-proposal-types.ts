export type ProposalMilestone = {
  sequence: number;
  title: string;
  description?: string;
  amount: number;
  /** Raw project-currency amount while typing (when pref ≠ project currency). */
  amountProjectStr?: string;
  dueDate?: string;
  daysFromStart?: number;
  durationAmount?: string;
  durationUnit?: "day" | "week" | "month" | "";
};

export type ProposalFormData = {
  coverLetter: string;
  bidAmount: string;
  /** Mirrored bid in client/project currency when currencies differ. */
  bidAmountProject: string;
  timelineAmount: string;
  timelineUnit: "day" | "week" | "month" | "";
  milestones: ProposalMilestone[];
  attachments: File[];
};

export type ProposalFieldErrors = {
  bidAmount?: string;
  timelineAmount?: string;
  timelineUnit?: string;
  coverLetter?: string;
  milestones?: string;
  attachments?: string;
  milestoneFields?: Record<
    number,
    {
      title?: string;
      description?: string;
      amount?: string;
      dueDate?: string;
      daysFromStart?: string;
      durationAmount?: string;
      durationUnit?: string;
    }
  >;
};

/** Context shown next to bid/timeline fields (budget range, client timeline). */
export type SubmitProposalProjectContext = {
  title: string;
  /** Service request currency (amounts stored for client / project) */
  projectCurrencyCode: string;
  /** Provider preferred currency (matches bid input & backend conversion source) */
  preferredCurrencyCode: string;
  budgetMin: number;
  budgetMax: number;
  /** Client’s budget bounds as originally set (project / listing currency). */
  clientBudgetMin: number;
  clientBudgetMax: number;
  /** Raw timeline string from the opportunity (e.g. "2 weeks") */
  originalTimeline: string | null;
  /** Locked FX snapshot from the opportunity (same as backend uses when present) */
  fxSnapshotRatesJson: Record<string, { unit: number; middleRate: number }> | null;
  fxSnapshotDate: string | null;
  fxSnapshotSession: string | null;
};
