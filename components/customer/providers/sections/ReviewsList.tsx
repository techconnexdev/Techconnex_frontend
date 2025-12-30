"use client";

import { useState, useMemo } from "react";
import { Star } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { Review } from "../types";

type SortOption = "newest" | "oldest" | "highest" | "lowest";

export default function ReviewsList({ reviews }: { reviews: Review[] }) {
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  const sortedReviews = useMemo(() => {
    const sorted = [...reviews];
    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );
      case "highest":
        return sorted.sort((a, b) => b.rating - a.rating);
      case "lowest":
        return sorted.sort((a, b) => a.rating - b.rating);
      default:
        return sorted;
    }
  }, [reviews, sortBy]);

  const totalPages = Math.ceil(sortedReviews.length / reviewsPerPage);
  const startIndex = (currentPage - 1) * reviewsPerPage;
  const endIndex = startIndex + reviewsPerPage;
  const paginatedReviews = sortedReviews.slice(startIndex, endIndex);

  // Reset to page 1 when sort changes
  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  if (!reviews?.length) {
    return <p className="text-gray-600">No reviews yet</p>;
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex justify-end">
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="oldest">Oldest First</SelectItem>
            <SelectItem value="highest">Highest Rating</SelectItem>
            <SelectItem value="lowest">Lowest Rating</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {paginatedReviews.map((review) => (
          <div key={review.id} className="border rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-medium">{review.author}</p>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span>{review.rating}</span>
              </div>
            </div>
            <p className="text-gray-700">{review.text}</p>
            <p className="text-xs text-gray-500 mt-2">{review.date}</p>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                }}
                href="#"
                className={
                  currentPage === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(page);
                  }}
                  href="#"
                  isActive={currentPage === page}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                onClick={(e) => {
                  e.preventDefault();
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                }}
                href="#"
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
