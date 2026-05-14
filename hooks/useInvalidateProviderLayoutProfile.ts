"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "@/lib/query-keys";

/** Call after profile image upload, name change, or other header-visible profile updates. */
export function useInvalidateProviderLayoutProfile() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.provider.profile,
    });
  }, [queryClient]);
}
