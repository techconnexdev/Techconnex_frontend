"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /** Data is "fresh" this long — no background refetch while navigating back. */
        staleTime: 60 * 1000,
        /** Keep unused cache entries for garbage collection after this. */
        gcTime: 5 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: true,
      },
    },
  });
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(makeQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
