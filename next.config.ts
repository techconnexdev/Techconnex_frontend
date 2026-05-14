import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

function apiOriginImageRemotePattern(): {
  protocol: "http" | "https";
  hostname: string;
  port?: string;
  pathname: string;
} | null {
  const raw = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  try {
    const u = new URL(raw);
    const protocol = u.protocol === "https:" ? "https" : "http";
    const entry: {
      protocol: "http" | "https";
      hostname: string;
      port?: string;
      pathname: string;
    } = {
      protocol,
      hostname: u.hostname,
      pathname: "/**",
    };
    if (u.port) entry.port = u.port;
    return entry;
  } catch {
    return {
      protocol: "http",
      hostname: "localhost",
      port: "4000",
      pathname: "/**",
    };
  }
}

const apiPattern = apiOriginImageRemotePattern();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pub-1b42bf42946146b099454ebfefcf05bb.r2.dev",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      ...(apiPattern ? [apiPattern] : []),
    ],
  },
  // Strip console.* in production (keeps error/warn if you need them)
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error"] }
        : false,
  },
  // Reduce JS bundle size: tree-shake these packages instead of loading full libs
  experimental: {
    optimizePackageImports: [
      "framer-motion",
      "motion",
      "lucide-react",
      "@radix-ui/react-accordion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-select",
      "@radix-ui/react-avatar",
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? "cybernet-bs",
  project: process.env.SENTRY_PROJECT ?? "techconnex_frontend",
  silent: !process.env.CI,
});
