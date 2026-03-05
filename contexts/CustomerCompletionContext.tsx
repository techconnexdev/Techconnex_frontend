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

export type CustomerCompletionData = {
  completion: number;
  suggestions: string[];
  checklist: CompletionChecklistItem[];
  totalFields?: number;
  completedFields?: number;
};

type CustomerCompletionContextValue = {
  completion: number;
  checklist: CompletionChecklistItem[];
  loading: boolean;
  /** Refetch and return the current completion % (from API). Use this to decide on click. */
  refetch: () => Promise<number>;
  /** Optional: minimum % to post projects (soft gate) */
  canPostProject: boolean;
};

const POST_PROJECT_REQUIRED = 60;

const defaultValue: CustomerCompletionContextValue = {
  completion: 0,
  checklist: [],
  loading: true,
  refetch: async () => 0,
  canPostProject: false,
};

const CustomerCompletionContext =
  createContext<CustomerCompletionContextValue>(defaultValue);

function getApiBase(): string {
  if (typeof window === "undefined") return "";
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
}

export function CustomerCompletionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [completion, setCompletion] = useState(0);
  const [checklist, setChecklist] = useState<CompletionChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCompletion = useCallback(async (): Promise<number> => {
    const apiBase = getApiBase();
    if (!apiBase) {
      setLoading(false);
      return 0;
    }
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setCompletion(0);
      setChecklist([]);
      setLoading(false);
      return 0;
    }
    setLoading(true);
    const url = `${apiBase}/company/profile/completion`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setCompletion(0);
        setChecklist([]);
        return 0;
      }
      const json = await res.json();
      // API returns { success: true, data: { completion, suggestions, checklist, ... } }
      const data = (json.data ?? json) as CustomerCompletionData;
      const comp = typeof data.completion === "number" ? data.completion : 0;
      const list = Array.isArray(data.checklist) ? data.checklist : [];
      setCompletion(comp);
      setChecklist(list);
      return comp;
    } catch (err) {
      console.error("[CustomerCompletion] Fetch error", err);
      setCompletion(0);
      setChecklist([]);
      return 0;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompletion();
  }, [fetchCompletion]);

  // Allow posting while completion is loading; only gate when we know completion < 60%
  const canPostProject = loading || completion >= POST_PROJECT_REQUIRED;

  useEffect(() => {
    console.log("[CustomerCompletion] state", {
      loading,
      completion,
      canPostProject,
      required: POST_PROJECT_REQUIRED,
    });
  }, [loading, completion, canPostProject]);

  const value: CustomerCompletionContextValue = {
    completion,
    checklist,
    loading,
    refetch: fetchCompletion,
    canPostProject,
  };

  return (
    <CustomerCompletionContext.Provider value={value}>
      {children}
    </CustomerCompletionContext.Provider>
  );
}

export function useCustomerCompletion() {
  const ctx = useContext(CustomerCompletionContext);
  return ctx ?? defaultValue;
}

export { POST_PROJECT_REQUIRED };
