import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://techconnex.vip/";
  return [
    {url: baseUrl, lastModified: new Date(), changeFrequency: "monthly", priority: 1},
    {url: `${baseUrl}customer`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8},
    {url: `${baseUrl}provider`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8},
    {url: `${baseUrl}terms`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3},
    {url: `${baseUrl}privacy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3},
    {url: `${baseUrl}cookies`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3},
  ];
}