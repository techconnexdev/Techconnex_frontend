"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

export default function FiltersBar({
  search, onSearch, category, onCategory,
}: {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search opportunities by title, client, or skills…"
          className="pl-10"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <Select value={category} onValueChange={onCategory}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="submitted">Already Submitted</SelectItem>
          <SelectItem value="not-submitted">Not Submitted</SelectItem>
          <SelectItem value="web">Web Development</SelectItem>
          <SelectItem value="mobile">Mobile Development</SelectItem>
          <SelectItem value="cloud">Cloud Services</SelectItem>
          <SelectItem value="data">Data Analytics</SelectItem>
          <SelectItem value="iot">IoT Solutions</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
