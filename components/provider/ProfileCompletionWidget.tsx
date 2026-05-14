"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle, Circle, ChevronDown, User } from "lucide-react";
import Link from "next/link";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { useI18n } from "@/contexts/I18nProvider";
import {
  useProviderCompletion,
  type CompletionChecklistItem,
} from "@/contexts/ProviderCompletionContext";

const CHECKLIST_I18N_KEY: Record<string, MessageKey> = {
  name: "provider.profileCompletion.checklist.name",
  email: "provider.profileCompletion.checklist.email",
  phone: "provider.profileCompletion.checklist.phone",
  resume: "provider.profileCompletion.checklist.resume",
  profileImageUrl: "provider.profileCompletion.checklist.profileImageUrl",
  bio: "provider.profileCompletion.checklist.bio",
  location: "provider.profileCompletion.checklist.location",
  availability: "provider.profileCompletion.checklist.availability",
  languages: "provider.profileCompletion.checklist.languages",
  skills: "provider.profileCompletion.checklist.skills",
  yearsExperience: "provider.profileCompletion.checklist.yearsExperience",
  hourlyRate: "provider.profileCompletion.checklist.hourlyRate",
  minimumProjectBudget: "provider.profileCompletion.checklist.minimumProjectBudget",
  maximumProjectBudget: "provider.profileCompletion.checklist.maximumProjectBudget",
  preferredProjectDuration: "provider.profileCompletion.checklist.preferredProjectDuration",
  website: "provider.profileCompletion.checklist.website",
  portfolioLinks: "provider.profileCompletion.checklist.portfolioLinks",
  certifications: "provider.profileCompletion.checklist.certifications",
  portfolios: "provider.profileCompletion.checklist.portfolios",
};

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      {done ? (
        <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-gray-300" />
      )}
      <span className={done ? "text-gray-700" : "text-gray-500"}>
        {label}
      </span>
    </div>
  );
}

export function ProfileCompletionWidget() {
  const { t } = useI18n();
  const { completion, checklist, loading } = useProviderCompletion();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
        {t("provider.profileCompletion.widget.loading")}
      </div>
    );
  }

  if (completion >= 100) {
    return null;
  }

  const doneCount = checklist.filter((c) => c.done).length;
  const totalCount = checklist.length;

  const checklistLabel = (item: CompletionChecklistItem) => {
    const key = CHECKLIST_I18N_KEY[item.key];
    return key ? t(key) : item.label;
  };

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
              title={t("provider.profileCompletion.widget.percentTitle", { pct: completion })}
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
          <span className="hidden sm:inline text-gray-500">
            {t("provider.profileCompletion.widget.profile")}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-72 max-h-[70vh] overflow-y-auto p-0"
      >
        <div className="px-4 py-3 border-b bg-gray-50">
          <p className="text-sm font-semibold text-gray-900">
            {t("provider.profileCompletion.widget.heading")}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("provider.profileCompletion.widget.itemsProgress", {
              done: doneCount,
              total: totalCount,
            })}
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
            <ChecklistItem
              key={item.key}
              label={checklistLabel(item)}
              done={item.done}
            />
          ))}
        </div>
        <div className="p-3 border-t bg-gray-50">
          <Link href="/provider/profile">
            <Button variant="outline" size="sm" className="w-full">
              <User className="h-4 w-4 mr-2" />
              {t("provider.profileCompletion.widget.completeCta")}
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
