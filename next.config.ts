import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

export default nextConfig;
