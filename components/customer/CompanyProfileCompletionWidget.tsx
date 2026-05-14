"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckCircle, Circle, ChevronDown, Building2 } from "lucide-react";
import Link from "next/link";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { useI18n } from "@/contexts/I18nProvider";
import {
  useCustomerCompletion,
  type CompletionChecklistItem,
} from "@/contexts/CustomerCompletionContext";

const CHECKLIST_I18N_KEY: Record<string, MessageKey> = {
  name: "customer.companyProfileCompletion.checklist.name",
  email: "customer.companyProfileCompletion.checklist.email",
  phone: "customer.companyProfileCompletion.checklist.phone",
  profileImageUrl: "customer.companyProfileCompletion.checklist.profileImageUrl",
  description: "customer.companyProfileCompletion.checklist.description",
  industry: "customer.companyProfileCompletion.checklist.industry",
  location: "customer.companyProfileCompletion.checklist.location",
  website: "customer.companyProfileCompletion.checklist.website",
  languages: "customer.companyProfileCompletion.checklist.languages",
  companySize: "customer.companyProfileCompletion.checklist.companySize",
  employeeCount: "customer.companyProfileCompletion.checklist.employeeCount",
  establishedYear: "customer.companyProfileCompletion.checklist.establishedYear",
  annualRevenue: "customer.companyProfileCompletion.checklist.annualRevenue",
  fundingStage: "customer.companyProfileCompletion.checklist.fundingStage",
  socialLinks: "customer.companyProfileCompletion.checklist.socialLinks",
  mediaGallery: "customer.companyProfileCompletion.checklist.mediaGallery",
  preferredContractTypes:
    "customer.companyProfileCompletion.checklist.preferredContractTypes",
  averageBudgetRange: "customer.companyProfileCompletion.checklist.averageBudgetRange",
  remotePolicy: "customer.companyProfileCompletion.checklist.remotePolicy",
  hiringFrequency: "customer.companyProfileCompletion.checklist.hiringFrequency",
  categoriesHiringFor: "customer.companyProfileCompletion.checklist.categoriesHiringFor",
  mission: "customer.companyProfileCompletion.checklist.mission",
  values: "customer.companyProfileCompletion.checklist.values",
  benefits: "customer.companyProfileCompletion.checklist.benefits",
};

function ChecklistItem({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2 py-1.5 text-sm">
      {done ? (
        <CheckCircle className="h-4 w-4 shrink-0 text-green-600" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-gray-300" />
      )}
      <span className={done ? "text-gray-700" : "text-gray-500"}>{label}</span>
    </div>
  );
}

export function CompanyProfileCompletionWidget() {
  const { t } = useI18n();
  const { completion, checklist, loading } = useCustomerCompletion();

  const checklistLabel = (item: CompletionChecklistItem) => {
    const key = CHECKLIST_I18N_KEY[item.key];
    return key ? t(key) : item.label;
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 px-2">
        {t("customer.companyProfileCompletion.widget.loading")}
      </div>
    );
  }

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
              title={t("customer.companyProfileCompletion.widget.percentTitle", {
                pct: completion,
              })}
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
            {t("customer.companyProfileCompletion.widget.profile")}
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
            {t("customer.companyProfileCompletion.widget.heading")}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("customer.companyProfileCompletion.widget.itemsProgress", {
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
          <Link href="/customer/profile/company">
            <Button variant="outline" size="sm" className="w-full">
              <Building2 className="h-4 w-4 mr-2" />
              {t("customer.companyProfileCompletion.widget.completeCta")}
            </Button>
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
