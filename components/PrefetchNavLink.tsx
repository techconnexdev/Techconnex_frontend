"use client";

import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import type { ComponentProps } from "react";
import { prefetchForHref } from "@/lib/navPrefetch";

type PrefetchNavLinkProps = ComponentProps<typeof Link>;

/**
 * Next.js `Link` with route prefetch plus TanStack Query data prefetch on hover/focus.
 * Keeps `prefetch` enabled for RSC/route JS; warms API cache for dashboard bundles.
 */
export function PrefetchNavLink({
  href,
  onMouseEnter,
  onFocus,
  prefetch = true,
  ...rest
}: PrefetchNavLinkProps) {
  const queryClient = useQueryClient();

  const warmQueryCache = () => {
    if (typeof href === "string") {
      prefetchForHref(queryClient, href);
    }
  };

  return (
    <Link
      href={href}
      prefetch={prefetch}
      onMouseEnter={(e) => {
        warmQueryCache();
        onMouseEnter?.(e);
      }}
      onFocus={(e) => {
        warmQueryCache();
        onFocus?.(e);
      }}
      {...rest}
    />
  );
}
