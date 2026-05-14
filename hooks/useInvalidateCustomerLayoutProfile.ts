"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { queryKeys } from "@/lib/query-keys";

/** Call after company profile save, logo upload, or other header-visible profile updates. */
export function useInvalidateCustomerLayoutProfile() {
  const queryClient = useQueryClient();
  return useCallback(() => {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.customer.profile,
    });
  }, [queryClient]);
}
