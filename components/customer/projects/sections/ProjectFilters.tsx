"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { useI18n } from "@/contexts/I18nProvider";
import type { Project } from "../types";

export default function ProjectFilters({
  search,
  setSearch,
  status,
  setStatus,
}: {
  search: string;
  setSearch: (v: string) => void;
  status: "all" | Project["status"];
  setStatus: (v: "all" | Project["status"]) => void;
}) {
  const { t } = useI18n();
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <div className="relative md:col-span-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder={t("customer.projects.demo.searchExtended")}
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <Select
        value={status}
        onValueChange={(v) => setStatus(v as "all" | Project["status"])}
      >
        <SelectTrigger>
          <SelectValue placeholder={t("customer.projects.list.filterStatus")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t("customer.projects.demo.filterAll")}
          </SelectItem>
          <SelectItem value="pending">
            {t("customer.projects.list.filter.pending")}
          </SelectItem>
          <SelectItem value="in_progress">
            {t("customer.projects.list.filter.inProgress")}
          </SelectItem>
          <SelectItem value="completed">
            {t("customer.projects.list.filter.completed")}
          </SelectItem>
          <SelectItem value="on_hold">
            {t("customer.projects.list.filter.onHold")}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
