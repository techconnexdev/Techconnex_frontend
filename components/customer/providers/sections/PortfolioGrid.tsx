"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, FileText, ExternalLink } from "lucide-react";
import type { PortfolioItem } from "../types";
import { getProfileImageUrl } from "@/lib/api";

export default function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  if (!items?.length) {
    return (
      <div className="text-center py-8 sm:py-12">
        <Globe className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
          No portfolio items yet
        </h3>
        <p className="text-xs sm:text-sm text-gray-600">
          No portfolio items added yet.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
      {items.map((item) => {
        // Handle both cover and imageUrl fields (cover is legacy, imageUrl is new)
        const imageSource = (item as { imageUrl?: string; cover?: string }).imageUrl || item.cover;
        const normalizedImage = imageSource?.replace(/\\/g, "/") || "";
        const imageUrl = normalizedImage ? getProfileImageUrl(normalizedImage) : null;
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(normalizedImage);
        
        // Handle both url and externalUrl fields
        const rawExternalUrl = (item as { externalUrl?: string; url?: string }).externalUrl || item.url;
        // Normalize URL to ensure it has a protocol
        const normalizeUrl = (url: string | undefined): string | null => {
          if (!url || url === "#") return null;
          // If URL already has a protocol, return as is
          if (/^https?:\/\//i.test(url)) {
            return url;
          }
          // If URL starts with //, add https:
          if (url.startsWith("//")) {
            return `https:${url}`;
          }
          // Otherwise, add https:// prefix
          return `https://${url}`;
        };
        const externalUrl = normalizeUrl(rawExternalUrl);
        const hasExternalLink = externalUrl !== null;
        
        // Handle both tags and techStack fields
        const techStack = (item as { techStack?: string[]; tags?: string[] }).techStack || item.tags || [];
        
        return (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            {imageUrl ? (
              <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
                {isImage ? (
                <Image
                  src={imageUrl}
                    alt={item.title || "Portfolio item"}
                    width={400}
                    height={192}
                    className="w-full h-full object-cover"
                  unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <div className="text-center p-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <FileText className="w-8 h-8 text-gray-400" />
                            </div>
                      <p className="text-xs text-gray-500 truncate max-w-[200px]">
                        {normalizedImage.split("/").pop() || "File"}
                      </p>
                    </div>
                  </div>
                )}
                </div>
              ) : (
              <div className="relative bg-gradient-to-br from-green-50 to-teal-50 h-48 flex items-center justify-center rounded-t-lg">
                <div className="text-center p-4">
                  <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Globe className="w-8 h-8 text-green-600" />
                    </div>
                  <Badge variant="secondary" className="text-xs">
                    Portfolio
                  </Badge>
                  </div>
                </div>
              )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-base sm:text-lg line-clamp-1 flex-1">
                  {item.title}
                </h3>
            </div>
              {item.description && (
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {item.description}
                </p>
              )}
              {techStack && techStack.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {techStack.slice(0, 6).map((tech: string, techIndex: number) => (
                    <Badge key={techIndex} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {techStack.length > 6 && (
                    <Badge variant="secondary" className="text-xs">
                      +{techStack.length - 6} more
                    </Badge>
                  )}
                </div>
              )}
              <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                {item.client && (
                  <span className="font-medium truncate">{item.client}</span>
                )}
                {item.date && (
                  <span className="whitespace-nowrap ml-2">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                )}
              </div>
              {hasExternalLink && externalUrl && (
                <a
                  href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                  >
                    View Project
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
