"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Globe, FileText, ExternalLink, Calendar, User } from "lucide-react";
import type { PortfolioItem } from "../types";
import { getProfileImageUrl } from "@/lib/api";

export default function PortfolioGrid({ items }: { items: PortfolioItem[] }) {
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  const normalizeUrl = (url: string | undefined): string | null => {
    if (!url || url === "#") return null;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith("//")) return `https:${url}`;
    return `https://${url}`;
  };

  const getAttachment = (item: PortfolioItem) => {
    const imageSource =
      (item as { imageUrl?: string; cover?: string }).imageUrl || item.cover;
    const normalized = imageSource?.replace(/\\/g, "/") || "";
    if (!normalized) return null;
    const resolved = getProfileImageUrl(normalized);
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(normalized);
    return {
      url: resolved,
      fileName: normalized.split("/").pop() || "Attachment",
      isImage,
    };
  };

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
        const attachment = getAttachment(item);
        const imageUrl = attachment?.url ?? null;
        const isImage = attachment?.isImage ?? false;
        const rawExternalUrl =
          (item as { externalUrl?: string; url?: string }).externalUrl ||
          item.url;
        const externalUrl = normalizeUrl(rawExternalUrl);
        const hasExternalLink = externalUrl !== null;
        const techStack =
          (item as { techStack?: string[]; tags?: string[] }).techStack ||
          item.tags ||
          [];
        const fileViewUrl = imageUrl;

        return (
          <Card
            key={item.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            role="button"
            tabIndex={0}
            onClick={() => setSelectedItem(item)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setSelectedItem(item);
              }
            }}
          >
            {imageUrl ? (
              <div className="relative h-48 overflow-hidden rounded-t-lg bg-gray-100">
                <div className="block w-full h-full rounded-t-lg">
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
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 transition-colors">
                      <div className="text-center p-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {imageUrl.split("/").pop() || "File"}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">Click to open</p>
                      </div>
                    </div>
                  )}
                </div>
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
              <div className="flex flex-wrap items-center gap-3 gap-y-1">
                {fileViewUrl && (
                  <a
                    href={fileViewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isImage ? "View image" : "View file"}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                {hasExternalLink && externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    View Project
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">{selectedItem.title}</DialogTitle>
                <DialogDescription>
                  Full portfolio item details and attachments
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {(() => {
                  const attachment = getAttachment(selectedItem);
                  if (!attachment) return null;

                  return attachment.isImage ? (
                    <div className="overflow-hidden rounded-lg border bg-muted">
                      <Image
                        src={attachment.url}
                        alt={selectedItem.title || "Portfolio attachment"}
                        width={1200}
                        height={700}
                        className="w-full max-h-[420px] object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-muted-foreground" />
                        <p className="text-sm font-medium break-all">
                          {attachment.fileName}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    {selectedItem.client && (
                      <span className="inline-flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        {selectedItem.client}
                      </span>
                    )}
                    {selectedItem.date && (
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {new Date(selectedItem.date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <p className="text-sm leading-6 text-gray-700 whitespace-pre-wrap">
                    {selectedItem.description || "No description provided."}
                  </p>

                  {((selectedItem.techStack && selectedItem.techStack.length > 0) ||
                    (selectedItem.tags && selectedItem.tags.length > 0)) && (
                    <div className="flex flex-wrap gap-2">
                      {(selectedItem.techStack || selectedItem.tags || []).map(
                        (tech, index) => (
                          <Badge key={`${tech}-${index}`} variant="secondary">
                            {tech}
                          </Badge>
                        ),
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const attachment = getAttachment(selectedItem);
                    return attachment ? (
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        Open attachment
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : null;
                  })()}
                  {(() => {
                    const projectUrl = normalizeUrl(
                      (
                        selectedItem as { externalUrl?: string; url?: string }
                      ).externalUrl || selectedItem.url,
                    );
                    return projectUrl ? (
                      <a
                        href={projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1"
                      >
                        View external project
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : null;
                  })()}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
