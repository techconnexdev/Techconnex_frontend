"use client";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useI18n } from "@/contexts/I18nProvider";

export default function FiltersBar({
  search, onSearch, category, onCategory,
}: {
  search: string;
  onSearch: (v: string) => void;
  category: string;
  onCategory: (v: string) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder={t("provider.opportunities.searchPlaceholder")}
          className="pl-10"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <Select value={category} onValueChange={onCategory}>
        <SelectTrigger className="w-full sm:w-56">
          <SelectValue placeholder={t("provider.opportunities.demo.allCategories")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("provider.opportunities.demo.allCategories")}</SelectItem>
          <SelectItem value="submitted">{t("provider.opportunities.filter.submitted")}</SelectItem>
          <SelectItem value="not-submitted">{t("provider.opportunities.filter.notSubmitted")}</SelectItem>
          <SelectItem value="web">{t("provider.opportunities.demo.category.web")}</SelectItem>
          <SelectItem value="mobile">{t("provider.opportunities.demo.category.mobile")}</SelectItem>
          <SelectItem value="cloud">{t("provider.opportunities.demo.category.cloud")}</SelectItem>
          <SelectItem value="data">{t("provider.opportunities.demo.category.data")}</SelectItem>
          <SelectItem value="iot">{t("provider.opportunities.demo.category.iot")}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
