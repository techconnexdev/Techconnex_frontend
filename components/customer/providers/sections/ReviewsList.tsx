"use client";

import { Star } from "lucide-react";
import type { Review } from "../types";

export default function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (!reviews?.length) return <p className="text-xs sm:text-sm text-gray-500 text-center py-4">No reviews yet.</p>;
  return (
    <div className="space-y-3 sm:space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="p-3 sm:p-4 border rounded-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="font-medium text-xs sm:text-sm">{r.author}</div>
            <div className="flex items-center gap-1 text-yellow-600">
              <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current flex-shrink-0" />
              <span className="font-semibold text-xs sm:text-sm">{r.rating}</span>
            </div>
          </div>
          <div className="text-[10px] sm:text-xs text-gray-500 mt-1">{new Date(r.date).toLocaleDateString()}</div>
          <p className="mt-2 text-xs sm:text-sm text-gray-700 break-words">{r.text}</p>
        </div>
      ))}
    </div>
  );
}
