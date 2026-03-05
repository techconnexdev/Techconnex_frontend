"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle, Circle, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import {
  useProviderCompletion,
  type CompletionChecklistItem,
} from "@/contexts/ProviderCompletionContext";

function ChecklistItem({ item }: { item: CompletionChecklistItem }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      {item.done ? (
        <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-gray-300" />
      )}
      <span className={item.done ? "text-gray-700" : "text-gray-500"}>
        {item.label}
      </span>
    </div>
  );
}

export function ProfileCompletionWidget() {
  const { completion, checklist, loading } = useProviderCompletion();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
        Profile...
      </div>
    );
  }

  // Hide when profile is 100% complete; show again when there are missing items
  if (completion >= 100) {
    return null;
  }

  const doneCount = checklist.filter((c) => c.done).length;
  const totalCount = checklist.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          <div className="flex items-center gap-1.5">
            <div
              className="h-2 w-12 rounded-full bg-gray-200 overflow-hidden"
              title={`${completion}% complete`}
            >
              <div
                className="h-full bg-blue-600 rounded-full transition-all"
                style={{ width: `${Math.min(100, completion)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
              {completion}%
            </span>
          </div>
          <span className="hidden sm:inline text-gray-500">Profile</span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 max-h-[70vh] overflow-y-auto p-0"
      >
        <div className="px-4 py-3 border-b bg-gray-50">
          <p className="text-sm font-semibold text-gray-900">
            Profile completion
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {doneCount} of {totalCount} items completed
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all"
              style={{ width: `${Math.min(100, completion)}%` }}
            />
          </div>
        </div>
        <div className="p-3 space-y-0.5">
          {checklist.map((item) => (
            <ChecklistItem key={item.key} item={item} />
          ))}
        </div>
        <div className="p-3 border-t bg-gray-50">
          <Link href="/provider/profile">
            <Button variant="outline" size="sm" className="w-full">
              <User className="h-4 w-4 mr-2" />
              Complete profile
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
