import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
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
