import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = "https://www.techconnex.vip";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/auth/", "/admin/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}