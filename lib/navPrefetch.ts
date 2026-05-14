import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { fetchCustomerDashboardData } from "@/lib/queries/customer-dashboard";
import { fetchProviderDashboardData } from "@/lib/queries/provider-dashboard";
import {
  DEFAULT_LOCALE,
  I18N_STORAGE_KEY,
  isLocale,
  type Locale,
} from "@/lib/i18n/locales";

const STALE_MS = 60 * 1000;

/**
 * Prefetch route-specific data when the user hovers or focuses a nav link so the
 * destination page can read from the TanStack Query cache immediately.
 *
 * Add entries here as more pages adopt `useQuery` with matching keys.
 */
export function prefetchForHref(queryClient: QueryClient, href: string) {
  const path = href.split("?")[0];
  let locale: Locale = DEFAULT_LOCALE;
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem(I18N_STORAGE_KEY);
    if (stored && isLocale(stored)) locale = stored;
  }

  if (path === "/provider/dashboard") {
    void queryClient.prefetchQuery({
      queryKey: [...queryKeys.provider.dashboard, locale],
      queryFn: () => fetchProviderDashboardData(locale),
      staleTime: STALE_MS,
    });
    return;
  }

  if (path === "/customer/dashboard") {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.customer.dashboard,
      queryFn: fetchCustomerDashboardData,
      staleTime: STALE_MS,
    });
  }
}
