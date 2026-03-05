"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CompletionChecklistItem = {
  key: string;
  label: string;
  done: boolean;
};

export type ProviderCompletionData = {
  completion: number;
  suggestions: string[];
  checklist: CompletionChecklistItem[];
  totalFields?: number;
  completedFields?: number;
};

type ProviderCompletionContextValue = {
  completion: number;
  checklist: CompletionChecklistItem[];
  loading: boolean;
  refetch: () => Promise<void>;
  /** Require at least this % to contact/message (40) */
  canContact: boolean;
  /** Require at least this % to submit proposals (50) */
  canSubmitProposal: boolean;
};

const CONTACT_REQUIRED = 40;
const PROPOSAL_REQUIRED = 50;

const defaultValue: ProviderCompletionContextValue = {
  completion: 0,
  checklist: [],
  loading: true,
  refetch: async () => {},
  canContact: false,
  canSubmitProposal: false,
};

const ProviderCompletionContext =
  createContext<ProviderCompletionContextValue>(defaultValue);

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    : "";

export function ProviderCompletionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [completion, setCompletion] = useState(0);
  const [checklist, setChecklist] = useState<CompletionChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletion = useCallback(async () => {
    if (!API_BASE) return;
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setCompletion(0);
      setChecklist([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/provider/profile/completion`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setCompletion(0);
        setChecklist([]);
        return;
      }
      const json = await res.json();
      const data = (json.data || json) as ProviderCompletionData;
      const comp = typeof data.completion === "number" ? data.completion : 0;
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      setCompletion(comp);
      setChecklist(list);
    } catch {
      setCompletion(0);
      setChecklist([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletion();
  }, [fetchCompletion]);

  const value: ProviderCompletionContextValue = {
    completion,
    checklist,
    loading,
    refetch: fetchCompletion,
    canContact: completion >= CONTACT_REQUIRED,
    canSubmitProposal: completion >= PROPOSAL_REQUIRED,
  };

  return (
    <ProviderCompletionContext.Provider value={value}>
      {children}
    </ProviderCompletionContext.Provider>
  );
}

export function useProviderCompletion() {
  const ctx = useContext(ProviderCompletionContext);
  return ctx ?? defaultValue;
}

export { CONTACT_REQUIRED, PROPOSAL_REQUIRED };
