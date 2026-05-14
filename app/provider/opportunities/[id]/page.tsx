"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Globe,
  CheckCircle,
  Loader2,
  ThumbsUp,
  Eye,
} from "lucide-react";
import { PROPOSAL_REQUIRED } from "@/contexts/ProviderCompletionContext";
import { ProfileCompletionGateModal } from "@/components/provider/ProfileCompletionGateModal";
import {
  getProviderOpportunityById,
  getProviderProfileCompletion,
} from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { FriendlyErrorState } from "@/components/FriendlyErrorState";
import { formatTimeline } from "@/lib/timeline-utils";
import { MarkdownViewer } from "@/components/markdown/MarkdownViewer";
import { useI18n } from "@/contexts/I18nProvider";

type OpportunityMilestone = {
  id?: string;
  order?: number;
  title: string;
  description?: string;
  amount?: number;
  dueDate?: string;
  daysFromStart?: number;
};

type OpportunityCustomer = {
  id?: string;
  name?: string;
  email?: string;
  customerProfile?: {
    profileImageUrl?: string;
    location?: string;
    website?: string;
    industry?: string;
    companySize?: string;
    projectsPosted?: number;
  };
};

type Opportunity = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  budgetMin?: number;
  budgetMax?: number;
  displayBudgetMin?: number;
  displayBudgetMax?: number;
  originalBudgetMin?: number;
  originalBudgetMax?: number;
  originalCurrencyCode?: string;
  currencyCode?: string;
  displayCurrencyCode?: string;
  conversionMeta?: {
    snapshotDate?: string | null;
    snapshotSession?: string | null;
    usedSnapshot?: boolean;
  };
  timeline?: string;
  priority?: string;
  skills?: string[];
  requirements?: string | string[];
  deliverables?: string | string[];
  milestones?: OpportunityMilestone[];
  customer?: OpportunityCustomer;
  hasProposed?: boolean;
  createdAt: string;
  _count?: {
    proposals?: number;
  };
};

export default function OpportunityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const opportunityId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [proposalCompletionChecking, setProposalCompletionChecking] =
    useState(false);
  const [proposalGateOpen, setProposalGateOpen] = useState(false);

  const loadOpportunity = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProviderOpportunityById(opportunityId);
      if (response.success) {
        setOpportunity(response.opportunity);
      } else {
        setError(
          getUserFriendlyErrorMessage(undefined, "provider opportunity detail"),
        );
      }
    } catch (err: unknown) {
      const apiErr = err as {
        status?: number;
        code?: string;
        projectId?: string;
      };

      if (
        apiErr?.code === "OPPORTUNITY_MOVED_TO_PROJECT" &&
        typeof apiErr.projectId === "string"
      ) {
        router.replace(`/provider/projects/${apiErr.projectId}`);
        return;
      }

      if (apiErr?.code === "OPPORTUNITY_MOVED_TO_PROJECT") {
        setError(t("provider.opportunities.detail.redirectProjectMissing"));
        return;
      }

      if (apiErr?.code === "OPPORTUNITY_NO_LONGER_AVAILABLE") {
        setError(t("provider.opportunities.detail.opportunityFilled"));
        return;
      }

      if (apiErr?.status === 403) {
        setError(t("provider.opportunities.detail.permissionDenied"));
        return;
      }

      if (apiErr?.status === 404) {
        setError(t("provider.opportunities.detail.notFound"));
        return;
      }

      setError(getUserFriendlyErrorMessage(err, "provider opportunity detail"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (opportunityId) {
      loadOpportunity();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [opportunityId]);

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0 py-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Skeleton className="h-9 w-full sm:w-28 rounded-md" />
          <div className="space-y-2 w-full">
            <Skeleton className="h-8 w-64 sm:w-96 max-w-full" />
            <Skeleton className="h-4 w-44 sm:w-60" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <Card className="lg:col-span-2">
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-72 max-w-full" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="pt-2 flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
              <Skeleton className="h-10 w-full rounded-md" />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-44" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-16 w-full rounded-lg" />
            <Skeleton className="h-16 w-full rounded-lg" />
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("provider.opportunities.detail.loadingDesc")}
          </p>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="flex items-center justify-center min-h-[400px] px-4">
        <div className="w-full max-w-md">
          <FriendlyErrorState
            variant="block"
            message={
              error ||
              getUserFriendlyErrorMessage(
                undefined,
                "provider opportunity detail",
              )
            }
            onRetry={() => {
              setError(null);
              loadOpportunity();
            }}
          />
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
            <Button variant="default" asChild className="text-xs sm:text-sm">
              <Link href="/provider/opportunities">
                {t("provider.opportunities.detail.browseAllOpportunities")}
              </Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-xs sm:text-sm"
            >
              {t("provider.opportunities.detail.goBack")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Format currency
  const formatCurrency = (amount: number, currencyCode: string = "MYR") =>
    new Intl.NumberFormat("en-MY", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 2,
    }).format(amount || 0);

  // Get skills array
  const skills = Array.isArray(opportunity.skills) ? opportunity.skills : [];

  // Get requirements and deliverables (handle both string and array formats)
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

  // Get client profile image
  const clientAvatar = opportunity.customer?.customerProfile?.profileImageUrl;

  const clientAvatarUrl = clientAvatar
    ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${clientAvatar.startsWith("/") ? "" : "/"}${clientAvatar}`
    : "/placeholder.svg";

  return (
    <>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
            {t("provider.opportunities.detail.back")}
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
              {opportunity.title}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 break-words">
              {opportunity.description}
            </p>
          </div>
          <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
            {opportunity.hasProposed ? (
              <Button
                variant="outline"
                disabled
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {t("provider.opportunities.detail.proposalSubmitted")}
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  setProposalCompletionChecking(true);
                  try {
                    const res = await getProviderProfileCompletion();
                    const data = res?.data ?? res;
                    const completion =
                      typeof (data as { completion?: number })?.completion ===
                      "number"
                        ? (data as { completion: number }).completion
                        : 0;
                    if (completion < PROPOSAL_REQUIRED) {
                      setProposalGateOpen(true);
                      return;
                    }
                    router.push(
                      `/provider/opportunities/${opportunityId}/proposal`,
                    );
                  } catch {
                    setProposalGateOpen(true);
                  } finally {
                    setProposalCompletionChecking(false);
                  }
                }}
                disabled={proposalCompletionChecking}
                className="bg-blue-600 active:bg-blue-700 sm:hover:bg-blue-700 text-white w-full sm:w-auto text-xs sm:text-sm"
              >
                {proposalCompletionChecking ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 animate-spin" />
                ) : (
                  <ThumbsUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                )}
                {proposalCompletionChecking
                  ? t("provider.opportunities.checking")
                  : t("provider.opportunities.submitProposal")}
              </Button>
            )}
          </div>
        </div>

        {/* Project Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-1 h-auto">
                <TabsTrigger
                  value="overview"
                  className="text-xs sm:text-sm px-2 sm:px-4"
                >
                  {t("provider.opportunities.detail.tab.overview")}
                </TabsTrigger>
                {opportunity.milestones &&
                  opportunity.milestones.length > 0 && (
                    <TabsTrigger
                      value="milestones"
                      className="text-xs sm:text-sm px-2 sm:px-4"
                    >
                      {t("provider.opportunities.detail.milestonesTab", {
                        n: opportunity.milestones.length,
                      })}
                    </TabsTrigger>
                  )}
              </TabsList>

              <TabsContent value="overview" className="space-y-4 sm:space-y-6">
                {/* Project Details */}
                <Card>
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-lg sm:text-xl">
                      {t("provider.opportunities.details.projectDetails")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.opportunities.detail.category")}
                        </Label>
                        <p className="text-base sm:text-lg mt-1">
                          {opportunity.category}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.opportunities.detail.status")}
                        </Label>
                        <div className="mt-1">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {t("provider.opportunities.detail.statusOpen")}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.opportunities.detail.budgetRange")}
                        </Label>
                        <p className="text-base sm:text-lg mt-1 break-words font-medium">
                          {formatCurrency(
                            opportunity.displayBudgetMin ??
                              opportunity.budgetMin ??
                              0,
                            opportunity.displayCurrencyCode ||
                              opportunity.currencyCode ||
                              "MYR",
                          )}{" "}
                          -{" "}
                          {formatCurrency(
                            opportunity.displayBudgetMax ??
                              opportunity.budgetMax ??
                              0,
                            opportunity.displayCurrencyCode ||
                              opportunity.currencyCode ||
                              "MYR",
                          )}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 break-words">
                          Original:{" "}
                          {formatCurrency(
                            opportunity.originalBudgetMin ??
                              opportunity.budgetMin ??
                              0,
                            opportunity.originalCurrencyCode ||
                              opportunity.currencyCode ||
                              "MYR",
                          )}{" "}
                          -{" "}
                          {formatCurrency(
                            opportunity.originalBudgetMax ??
                              opportunity.budgetMax ??
                              0,
                            opportunity.originalCurrencyCode ||
                              opportunity.currencyCode ||
                              "MYR",
                          )}
                        </p>
                        {opportunity.conversionMeta?.snapshotDate && (
                          <p className="text-xs text-gray-500 mt-1">
                            Conversion as of{" "}
                            {opportunity.conversionMeta.snapshotDate}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.opportunities.detail.timelineLabel")}
                        </Label>
                        <p className="text-base sm:text-lg mt-1 break-words">
                          {formatTimeline(opportunity.timeline) ||
                            t("customer.dashboard.timelineNotSpecified")}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.opportunities.detail.priority")}
                        </Label>
                        <div className="mt-1">
                          <Badge className="text-xs">
                            {opportunity.priority || "medium"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.opportunities.detail.proposalsLabel")}
                        </Label>
                        <p className="text-base sm:text-lg mt-1">
                          {t(
                            "provider.opportunities.detail.proposalsReceived",
                            {
                              n: opportunity._count?.proposals || 0,
                            },
                          )}
                        </p>
                      </div>
                    </div>

                    {skills.length > 0 && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.opportunities.detail.requiredSkills")}
                        </Label>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                          {skills.map((skill: string, index: number) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {requirements && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          Requirements
                        </Label>
                        <div className="mt-2 prose max-w-none text-gray-700">
                          <MarkdownViewer
                            content={requirements}
                            className="prose max-w-none text-gray-700"
                            emptyMessage="No requirements specified"
                          />
                        </div>
                      </div>
                    )}

                    {deliverables && (
                      <div>
                        <Label className="text-xs sm:text-sm font-medium text-gray-500">
                          {t("provider.opportunities.details.deliverables")}
                        </Label>
                        <div className="mt-2 prose max-w-none text-gray-700">
                          <MarkdownViewer
                            content={deliverables}
                            className="prose max-w-none text-gray-700"
                            emptyMessage={t(
                              "provider.opportunities.details.noDeliverables",
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {opportunity.milestones && opportunity.milestones.length > 0 && (
                <TabsContent
                  value="milestones"
                  className="space-y-4 sm:space-y-6"
                >
                  <Card>
                    <CardHeader className="p-4 sm:p-6">
                      <CardTitle className="text-lg sm:text-xl">
                        {t(
                          "provider.opportunities.detail.companyMilestonesTitle",
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {t(
                          "provider.opportunities.detail.companyMilestonesHint",
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6">
                      <div className="space-y-3 sm:space-y-4">
                        {opportunity.milestones.map(
                          (milestone: OpportunityMilestone, index: number) => (
                            <div
                              key={milestone.id || index}
                              className="border rounded-lg p-3 sm:p-4"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-2">
                                <div className="flex items-center gap-2 sm:gap-3">
                                  <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                                    {milestone.order || index + 1}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-medium text-sm sm:text-base break-words">
                                      {milestone.title}
                                    </h4>
                                    {milestone.description && (
                                      <p className="text-xs sm:text-sm text-gray-600 break-words">
                                        {milestone.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="text-left sm:text-right">
                                  <p className="text-base sm:text-lg font-semibold">
                                    {formatCurrency(milestone.amount || 0)}
                                  </p>
                                  {milestone.dueDate && (
                                    <p className="text-xs sm:text-sm text-gray-500">
                                      {t("provider.opportunities.detail.due", {
                                        date: new Date(
                                          milestone.dueDate,
                                        ).toLocaleDateString(),
                                      })}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  {t("provider.opportunities.details.clientInfo")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                    <AvatarImage src={clientAvatarUrl} />
                    <AvatarFallback>
                      {opportunity.customer?.name?.charAt(0) || "C"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="font-semibold text-sm sm:text-lg break-words">
                        {opportunity.customer?.name ||
                          t("provider.opportunities.detail.notAvailable")}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-600 break-words">
                        {opportunity.customer?.email || ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
                      {opportunity.customer?.customerProfile?.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-600 break-words">
                            {opportunity.customer.customerProfile.location}
                          </span>
                        </div>
                      )}
                      {opportunity.customer?.customerProfile?.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <a
                            href={
                              opportunity.customer.customerProfile.website.startsWith(
                                "http",
                              )
                                ? opportunity.customer.customerProfile.website
                                : `https://${opportunity.customer.customerProfile.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 active:text-blue-800 sm:hover:underline break-all"
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
                          <span className="text-gray-700 break-words">
                            {opportunity.customer.customerProfile.industry}
                          </span>
                        </div>
                      )}
                      {opportunity.customer?.customerProfile?.companySize && (
                        <div>
                          <span className="text-gray-500">
                            {t(
                              "provider.opportunities.details.companySize",
                            )}{" "}
                          </span>
                          <span className="text-gray-700 break-words">
                            {opportunity.customer.customerProfile.companySize}
                          </span>
                        </div>
                      )}
                      {opportunity.customer?.customerProfile?.projectsPosted !==
                        undefined && (
                        <div>
                          <span className="text-gray-500">
                            {t(
                              "provider.opportunities.detail.projectsPostedLabel",
                            )}{" "}
                          </span>
                          <span className="text-gray-700">
                            {opportunity.customer.customerProfile
                              .projectsPosted || 0}
                          </span>
                        </div>
                      )}
                    </div>
                    {opportunity.customer?.id && (
                      <Link
                        href={`/provider/companies/${opportunity.customer.id}`}
                        className="block"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs sm:text-sm"
                        >
                          <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                          {t("provider.opportunities.details.viewCompany")}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  {t("provider.opportunities.detail.quickStats")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">
                    {t("provider.opportunities.detail.posted")}
                  </span>
                  <span className="font-semibold text-xs sm:text-sm">
                    {new Date(opportunity.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">
                    {t("provider.opportunities.details.proposals")}
                  </span>
                  <span className="font-semibold text-xs sm:text-sm">
                    {opportunity._count?.proposals || 0}
                  </span>
                </div>
                {opportunity.priority && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm text-gray-600">
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
      <ProfileCompletionGateModal
        open={proposalGateOpen}
        onOpenChange={setProposalGateOpen}
        requiredPercent={PROPOSAL_REQUIRED}
        actionLabel={t("provider.opportunities.gate.submitProposals")}
      />
    </>
  );
}
