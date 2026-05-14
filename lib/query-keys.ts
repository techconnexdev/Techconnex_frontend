/**
 * Central query keys for TanStack Query — use the same keys for
 * `useQuery`, `prefetchQuery`, and `invalidateQueries`.
 */
export const queryKeys = {
  provider: {
    dashboard: ["provider", "dashboard"] as const,
    /** Shell header avatar / name — long-lived cache, invalidate on profile updates */
    profile: ["provider", "layout", "profile"] as const,
  },
  customer: {
    dashboard: ["customer", "dashboard"] as const,
    /** Shell header avatar / name — long-lived cache, invalidate on company profile updates */
    profile: ["customer", "layout", "profile"] as const,
  },
} as const;
