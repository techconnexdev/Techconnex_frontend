"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  MapPin,
  Globe,
  Eye,
  ThumbsUp,
  ArrowUpRight,
} from "lucide-react";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import { formatTimeline } from "@/lib/timeline-utils";
import { useI18n } from "@/contexts/I18nProvider";
import type { PublicShowcaseOpportunity } from "@/lib/homepage-api";
import { getProfileImageUrl } from "@/lib/api";

function formatCurrency(amount: number, currencyCode: string = "MYR") {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function useProviderLoggedIn() {
  const [canSubmitProposal, setCanSubmitProposal] = useState(false);
  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const raw = localStorage.getItem("user");
      const user = raw ? JSON.parse(raw) : {};
      const roles = Array.isArray(user?.role)
        ? user.role
        : user?.role
          ? [user.role]
          : [];
      setCanSubmitProposal(!!token && roles.includes("PROVIDER"));
    } catch {
      setCanSubmitProposal(false);
    }
  }, []);
  return canSubmitProposal;
}

export default function ShowcasePublicProjectDetailClient({
  opportunity,
}: {
  opportunity: PublicShowcaseOpportunity;
}) {
  const { t } = useI18n();
  const canSubmitProposal = useProviderLoggedIn();

  const skills = Array.isArray(opportunity.skills) ? opportunity.skills : [];

  const requirements =
    typeof opportunity.requirements === "string"
      ? opportunity.requirements
      : Array.isArray(opportunity.requirements)
        ? opportunity.requirements
            .map((r: string | unknown) => `- ${String(r)}`)
            .join("\n")
        : "";

  const deliverables =
    typeof opportunity.deliverables === "string"
      ? opportunity.deliverables
      : Array.isArray(opportunity.deliverables)
        ? opportunity.deliverables
            .map((d: string | unknown) => `- ${String(d)}`)
            .join("\n")
        : "";

  const clientAvatarUrl = getProfileImageUrl(
    opportunity.customer?.customerProfile?.profileImageUrl,
  );

  const displayCurrency =
    opportunity.displayCurrencyCode ||
    opportunity.currencyCode ||
    "MYR";

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-1 sm:px-2 lg:px-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <Button variant="outline" asChild className="w-full sm:w-auto text-xs sm:text-sm">
          <Link href="/showcase?tab=projects">
            <ArrowLeft className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
            {t("home.showcase.projectDetail.back")}
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="break-words text-2xl font-bold text-gray-900 sm:text-3xl dark:text-neutral-50">
            {opportunity.title}
          </h1>
          {opportunity.description && (
            <p className="mt-1 break-words text-sm text-gray-600 sm:text-base dark:text-neutral-400">
              {opportunity.description}
            </p>
          )}
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          {canSubmitProposal ? (
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
              <Link href={`/provider/opportunities/${opportunity.id}/proposal`}>
                <ThumbsUp className="mr-2 h-4 w-4" />
                {t("provider.opportunities.submitProposal")}
              </Link>
            </Button>
          ) : (
            <Button asChild className="bg-blue-600 text-white hover:bg-blue-700 sm:w-auto">
              <Link href={`/auth/register?role=provider`}>
                {t("home.parallax.signUpApply")}
                <ArrowUpRight className="ml-2 h-4 w-4 opacity-90" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-4 sm:space-y-6 lg:col-span-2">
          <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
            <TabsList
              className={`grid h-auto w-full ${
                opportunity.milestones?.length ? "grid-cols-2" : "grid-cols-1"
              }`}
            >
              <TabsTrigger value="overview" className="px-2 text-xs sm:px-4 sm:text-sm">
                {t("provider.opportunities.detail.tab.overview")}
              </TabsTrigger>
              {opportunity.milestones && opportunity.milestones.length > 0 && (
                <TabsTrigger value="milestones" className="px-2 text-xs sm:px-4 sm:text-sm">
                  {t("provider.opportunities.detail.milestonesTab", {
                    n: opportunity.milestones.length,
                  })}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-lg sm:text-xl">
                    {t("provider.opportunities.details.projectDetails")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 sm:space-y-4 sm:p-6">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    <div>
                      <Label className="text-xs font-medium text-gray-500 sm:text-sm">
                        {t("provider.opportunities.detail.category")}
                      </Label>
                      <p className="mt-1 text-base sm:text-lg">{opportunity.category}</p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500 sm:text-sm">
                        {t("provider.opportunities.detail.status")}
                      </Label>
                      <div className="mt-1">
                        <Badge className="bg-green-100 text-xs text-green-800">
                          {t("provider.opportunities.detail.statusOpen")}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500 sm:text-sm">
                        {t("provider.opportunities.detail.budgetRange")}
                      </Label>
                      <p className="mt-1 break-words text-base font-medium sm:text-lg">
                        {formatCurrency(
                          opportunity.displayBudgetMin ?? opportunity.budgetMin ?? 0,
                          displayCurrency,
                        )}{" "}
                        —{" "}
                        {formatCurrency(
                          opportunity.displayBudgetMax ?? opportunity.budgetMax ?? 0,
                          displayCurrency,
                        )}
                      </p>
                      <p className="mt-1 break-words text-xs text-gray-500">
                        {t("home.showcase.projectDetail.originalBudgetLabel")}{" "}
                        {formatCurrency(
                          opportunity.originalBudgetMin ?? opportunity.budgetMin ?? 0,
                          opportunity.originalCurrencyCode ||
                            opportunity.currencyCode ||
                            "MYR",
                        )}{" "}
                        —{" "}
                        {formatCurrency(
                          opportunity.originalBudgetMax ?? opportunity.budgetMax ?? 0,
                          opportunity.originalCurrencyCode ||
                            opportunity.currencyCode ||
                            "MYR",
                        )}
                      </p>
                      {opportunity.conversionMeta?.snapshotDate && (
                        <p className="mt-1 text-xs text-gray-500">
                          {t("home.showcase.projectDetail.fxAsOf", {
                            date: String(opportunity.conversionMeta.snapshotDate),
                          })}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500 sm:text-sm">
                        {t("provider.opportunities.detail.timelineLabel")}
                      </Label>
                      <p className="mt-1 break-words text-base sm:text-lg">
                        {formatTimeline(opportunity.timeline ?? undefined) ||
                          t("customer.dashboard.timelineNotSpecified")}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500 sm:text-sm">
                        {t("provider.opportunities.detail.priority")}
                      </Label>
                      <div className="mt-1">
                        <Badge className="text-xs">{opportunity.priority || "medium"}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-gray-500 sm:text-sm">
                        {t("provider.opportunities.detail.proposalsLabel")}
                      </Label>
                      <p className="mt-1 text-base sm:text-lg">
                        {t("provider.opportunities.detail.proposalsReceived", {
                          n: opportunity._count?.proposals ?? 0,
                        })}
                      </p>
                    </div>
                  </div>

                  {skills.length > 0 && (
                    <div>
                      <Label className="text-xs font-medium text-gray-500 sm:text-sm">
                        {t("provider.opportunities.detail.requiredSkills")}
                      </Label>
                      <div className="mt-2 flex flex-wrap gap-1.5 sm:gap-2">
                        {skills.map((skill: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {requirements ? (
                    <div>
                      <Label className="text-xs font-medium text-gray-500 sm:text-sm">
                        {t("provider.opportunities.details.requirements")}
                      </Label>
                      <div className="prose mt-2 max-w-none text-gray-700 dark:prose-invert">
                        <MarkdownViewer
                          content={requirements}
                          className="prose max-w-none text-gray-700 dark:text-neutral-300"
                          emptyMessage={t("provider.opportunities.details.noRequirements")}
                        />
                      </div>
                    </div>
                  ) : null}

                  {deliverables ? (
                    <div>
                      <Label className="text-xs font-medium text-gray-500 sm:text-sm">
                        {t("provider.opportunities.details.deliverables")}
                      </Label>
                      <div className="prose mt-2 max-w-none text-gray-700 dark:prose-invert">
                        <MarkdownViewer
                          content={deliverables}
                          className="prose max-w-none text-gray-700 dark:text-neutral-300"
                          emptyMessage={t("provider.opportunities.details.noDeliverables")}
                        />
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </TabsContent>

            {opportunity.milestones && opportunity.milestones.length > 0 && (
              <TabsContent value="milestones" className="space-y-4 sm:space-y-6">
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                      {t("provider.opportunities.detail.companyMilestonesTitle")}
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {t("provider.opportunities.detail.companyMilestonesHint")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-3 sm:space-y-4">
                      {opportunity.milestones.map((milestone, index: number) => (
                        <div key={milestone.id || index} className="rounded-lg border p-3 sm:p-4">
                          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-2 sm:items-center sm:gap-3">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-medium sm:h-8 sm:w-8 sm:text-sm">
                                {milestone.order ?? index + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h4 className="break-words text-sm font-medium sm:text-base">
                                  {milestone.title}
                                </h4>
                                {milestone.description && (
                                  <p className="break-words text-xs text-gray-600 sm:text-sm dark:text-neutral-400">
                                    {milestone.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="text-base font-semibold sm:text-lg">
                                {formatCurrency(milestone.amount || 0, displayCurrency)}
                              </p>
                              {milestone.dueDate && (
                                <p className="text-xs text-gray-500 sm:text-sm">
                                  {t("provider.opportunities.detail.due", {
                                    date: new Date(milestone.dueDate).toLocaleDateString(),
                                  })}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                {t("provider.opportunities.details.clientInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <Avatar className="h-12 w-12 shrink-0 sm:h-16 sm:w-16">
                  <AvatarImage src={clientAvatarUrl} />
                  <AvatarFallback>{opportunity.customer?.name?.charAt(0) || "C"}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="break-words text-sm font-semibold sm:text-lg">
                      {opportunity.customer?.name ||
                        t("provider.opportunities.detail.notAvailable")}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                    {opportunity.customer?.customerProfile?.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                        <span className="break-words text-gray-600 dark:text-neutral-400">
                          {opportunity.customer.customerProfile.location}
                        </span>
                      </div>
                    )}
                    {opportunity.customer?.customerProfile?.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 shrink-0 text-gray-400 sm:h-4 sm:w-4" />
                        <a
                          href={
                            opportunity.customer.customerProfile.website.startsWith("http")
                              ? opportunity.customer.customerProfile.website
                              : `https://${opportunity.customer.customerProfile.website}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="break-all text-blue-600 hover:underline"
                        >
                          {opportunity.customer.customerProfile.website}
                        </a>
                      </div>
                    )}
                    {opportunity.customer?.customerProfile?.industry && (
                      <div>
                        <span className="text-gray-500">
                          {t("provider.opportunities.details.industry")}{" "}
                        </span>
                        <span className="break-words text-gray-700 dark:text-neutral-300">
                          {opportunity.customer.customerProfile.industry}
                        </span>
                      </div>
                    )}
                    {opportunity.customer?.customerProfile?.companySize && (
                      <div>
                        <span className="text-gray-500">
                          {t("provider.opportunities.details.companySize")}{" "}
                        </span>
                        <span className="break-words text-gray-700 dark:text-neutral-300">
                          {opportunity.customer.customerProfile.companySize}
                        </span>
                      </div>
                    )}
                    {opportunity.customer?.customerProfile?.projectsPosted !== undefined && (
                      <div>
                        <span className="text-gray-500">
                          {t("provider.opportunities.detail.projectsPostedLabel")}{" "}
                        </span>
                        <span className="text-gray-700 dark:text-neutral-300">
                          {opportunity.customer.customerProfile.projectsPosted ?? 0}
                        </span>
                      </div>
                    )}
                  </div>
                  {opportunity.customer?.id && (
                    <Button variant="outline" size="sm" className="mt-2 w-full text-xs sm:text-sm" asChild>
                      <Link href={`/showcase/companies/${opportunity.customer.id}`}>
                        <Eye className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {t("provider.opportunities.details.viewCompany")}
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                {t("provider.opportunities.detail.quickStats")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 sm:text-sm dark:text-neutral-400">
                  {t("provider.opportunities.detail.posted")}
                </span>
                <span className="text-xs font-semibold sm:text-sm">
                  {new Date(opportunity.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 sm:text-sm dark:text-neutral-400">
                  {t("provider.opportunities.details.proposals")}
                </span>
                <span className="text-xs font-semibold sm:text-sm">
                  {opportunity._count?.proposals ?? 0}
                </span>
              </div>
              {opportunity.priority && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600 sm:text-sm dark:text-neutral-400">
                    {t("provider.opportunities.detail.priorityLabel")}
                  </span>
                  <Badge className="text-xs">{opportunity.priority}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
