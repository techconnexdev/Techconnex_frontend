"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  Star,
  CheckCircle2,
  CheckCircle,
  MessageSquare,
  Heart,
  Award,
  Loader2,
  Globe,
  FileText,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Provider, PortfolioItem, Review } from "./types";
import PortfolioGrid from "./sections/PortfolioGrid";
import { CustomerProviderHourlyRate } from "./sections/CustomerProviderHourlyRate";
import ReviewsList from "./sections/ReviewsList";
import { useRouter } from "next/navigation";
import {
  getProviderCompletedProjects,
  getProfileImageUrl,
  getResumeByUserId,
  getR2DownloadUrl,
} from "@/lib/api";
import ProposalPopup from "./ProposalPopup";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/contexts/I18nProvider";
import { formatProviderMoney } from "@/lib/provider-currency-format";
import {
  convertWithSnapshot,
  hasCurrencyInSnapshot,
  normalizeCurrencyCode,
  type FxRatesMap,
} from "@/lib/fx-snapshot";

const COLLAPSED_MAX_HEIGHT = 320;
const COLLAPSED_MAX_HEIGHT_SIDEBAR = 280;

function CollapsibleSection({
  children,
  expanded,
  onToggle,
  maxHeight = COLLAPSED_MAX_HEIGHT,
  showMoreLabel,
  showLessLabel,
}: {
  children: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  maxHeight?: number;
  showMoreLabel: string;
  showLessLabel: string;
}) {
  return (
    <div className="flex flex-col">
      <div
        className="overflow-y-auto overflow-x-hidden transition-[max-height] duration-300 ease-out"
        style={{ maxHeight: expanded ? 2000 : maxHeight }}
      >
        {children}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="mt-2 text-xs text-gray-600 hover:text-gray-900 self-center flex items-center gap-1"
      >
        {expanded ? (
          <>
            <ChevronUp className="w-4 h-4" />
            {showLessLabel}
          </>
        ) : (
          <>
            <ChevronDown className="w-4 h-4" />
            {showMoreLabel}
          </>
        )}
      </Button>
    </div>
  );
}

export default function ProviderDetailClient({
  provider,
  portfolio,
  reviews,
  viewerPreferredCurrency,
  publicGuestMode = false,
}: {
  provider: Provider;
  portfolio: PortfolioItem[];
  reviews: Review[];
  /** Company user's Settings.preferredCurrency (from server); omit when logged out. */
  viewerPreferredCurrency?: string;
  /** Public showcase guest mode: hide direct contact/proposal actions. */
  publicGuestMode?: boolean;
}) {
  const { t, locale } = useI18n();

  const projectBudgetDisplay = useMemo(() => {
    const pc = normalizeCurrencyCode(provider.preferredCurrency || "MYR");
    const minV =
      provider.minimumProjectBudget != null
        ? Number(provider.minimumProjectBudget)
        : null;
    const maxV =
      provider.maximumProjectBudget != null
        ? Number(provider.maximumProjectBudget)
        : null;

    if (minV == null && maxV == null) return null;

    const fmtProv = (n: number) => formatProviderMoney(n, pc, locale);

    const primaryText =
      minV != null && maxV != null
        ? t("customer.providers.detail.budgetRange", {
            min: fmtProv(minV),
            max: fmtProv(maxV),
          })
        : minV != null
          ? t("customer.providers.detail.budgetFrom", { min: fmtProv(minV) })
          : maxV != null
            ? t("customer.providers.detail.budgetUpTo", {
                max: fmtProv(maxV),
              })
            : "—";

    const vc = normalizeCurrencyCode(viewerPreferredCurrency || pc);
    const ratesMap = provider.pricingFxSnapshotRatesJson as FxRatesMap;

    if (!viewerPreferredCurrency || vc === pc) {
      return {
        primaryText,
        secondaryText: null as string | null,
        footnote: null as string | null,
        conversionFailed: false,
        showCaptions: false,
        providerCode: pc,
        viewerCode: vc,
      };
    }

    if (
      !ratesMap ||
      !hasCurrencyInSnapshot(pc, ratesMap) ||
      !hasCurrencyInSnapshot(vc, ratesMap)
    ) {
      return {
        primaryText,
        secondaryText: null,
        footnote: null,
        conversionFailed: true,
        showCaptions: true,
        providerCode: pc,
        viewerCode: vc,
      };
    }

    const cMin =
      minV != null
        ? convertWithSnapshot({
            amount: minV,
            fromCurrencyCode: pc,
            toCurrencyCode: vc,
            ratesMap,
          })
        : null;
    const cMax =
      maxV != null
        ? convertWithSnapshot({
            amount: maxV,
            fromCurrencyCode: pc,
            toCurrencyCode: vc,
            ratesMap,
          })
        : null;

    if ((minV != null && cMin == null) || (maxV != null && cMax == null)) {
      return {
        primaryText,
        secondaryText: null,
        footnote: null,
        conversionFailed: true,
        showCaptions: true,
        providerCode: pc,
        viewerCode: vc,
      };
    }

    const fmtView = (n: number) => formatProviderMoney(n, vc, locale);

    const secondaryText =
      minV != null && maxV != null && cMin != null && cMax != null
        ? t("customer.providers.detail.budgetRange", {
            min: fmtView(cMin),
            max: fmtView(cMax),
          })
        : minV != null && cMin != null
          ? t("customer.providers.detail.budgetFrom", {
              min: fmtView(cMin),
            })
          : maxV != null && cMax != null
            ? t("customer.providers.detail.budgetUpTo", {
                max: fmtView(cMax),
              })
            : null;

    return {
      primaryText,
      secondaryText,
      footnote: provider.pricingFxSnapshotDate ?? null,
      conversionFailed: false,
      showCaptions: true,
      providerCode: pc,
      viewerCode: vc,
    };
  }, [
    provider.minimumProjectBudget,
    provider.maximumProjectBudget,
    provider.preferredCurrency,
    provider.pricingFxSnapshotRatesJson,
    provider.pricingFxSnapshotDate,
    viewerPreferredCurrency,
    locale,
    t,
  ]);

  const [saved, setSaved] = useState<boolean>(!!provider.saved);
  const [portfolioProjects, setPortfolioProjects] = useState<
    Array<{
      id: string;
      title: string;
      description?: string;
      category?: string;
      technologies?: string[];
      client?: string;
      completedDate?: string;
    }>
  >([]);
  const [loadingPortfolio, setLoadingPortfolio] = useState(false);
  const [isProposalPopupOpen, setIsProposalPopupOpen] = useState(false);
  const [resume, setResume] = useState<{
    fileUrl: string;
    uploadedAt: string;
  } | null>(null);
  const [portfolioExpanded, setPortfolioExpanded] = useState(false);
  const [completedProjectsExpanded, setCompletedProjectsExpanded] =
    useState(false);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [certificationsExpanded, setCertificationsExpanded] = useState(false);
  const [profilePhotoOpen, setProfilePhotoOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const dateLocale =
    locale === "ar" ? "ar" : locale === "id" ? "id-ID" : "en-MY";

  const profilePhotoSrc = getProfileImageUrl(provider.avatar);
  const hasProfilePhoto = Boolean(provider.avatar?.trim());

  // Update saved state when provider prop changes (e.g., after refresh)
  useEffect(() => {
    setSaved(!!provider.saved);
  }, [provider.saved]);

  // Load completed projects
  useEffect(() => {
    const loadCompletedProjects = async () => {
      try {
        setLoadingPortfolio(true);
        const response = await getProviderCompletedProjects(provider.id);
        if (response.success && response.data) {
          setPortfolioProjects(response.data);
        }
      } catch (error) {
        console.error("Failed to load completed projects:", error);
      } finally {
        setLoadingPortfolio(false);
      }
    };

    loadCompletedProjects();
  }, [provider.id]);

  // Load resume
  useEffect(() => {
    const loadResume = async () => {
      try {
        const response = await getResumeByUserId(provider.id);
        if (response.success && response.data) {
          setResume(response.data);
        }
      } catch (error) {
        // Resume is optional, so we don't show error
        console.error("Failed to load resume:", error);
      }
    };

    loadResume();
  }, [provider.id]);

  const handleDownloadResume = async () => {
    if (!resume?.fileUrl) return;

    try {
      const downloadUrl = await getR2DownloadUrl(resume.fileUrl);
      window.open(downloadUrl.downloadUrl, "_blank");
    } catch (error: unknown) {
      toast({
        title: t("customer.providers.toast.downloadFailed"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer provider detail resume download",
        ),
        variant: "destructive",
      });
    }
  };

  const handleContact = (provider: Provider) => {
    const avatarUrl = getProfileImageUrl(provider.avatar);
    router.push(
      `/customer/messages?userId=${provider.id}&name=${encodeURIComponent(
        provider.name,
      )}&avatar=${encodeURIComponent(avatarUrl)}`,
    );
  };
  const getUserAndToken = () => {
    if (typeof window === "undefined") return { userId: "", token: "" };
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      const token = localStorage.getItem("token") || "";
      return { userId: user?.id || "", token };
    } catch {
      return { userId: "", token: "" };
    }
  };

  const handleSaveToggle = async () => {
    try {
      const { userId, token } = getUserAndToken();
      if (!userId || !token) {
        alert(t("customer.providers.alert.loginToSave"));
        return;
      }

      const method = saved ? "DELETE" : "POST";
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
        }/providers/${provider.id}/save?userId=${encodeURIComponent(userId)}`,
        {
          method,
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ token added here
          },
        },
      );

      if (response.ok) {
        setSaved(!saved);
      } else {
        toast({
          title: t("customer.providers.toast.errorTitle"),
          description: getUserFriendlyErrorMessage(
            undefined,
            "customer provider detail save",
          ),
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: t("customer.providers.toast.errorTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "customer provider detail save",
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
      {/* Back + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {publicGuestMode ? (
            <Button
              onClick={() => router.push("/auth/login?role=customer")}
              className="text-xs sm:text-sm w-full sm:w-auto"
            >
              Sign in to hire
            </Button>
          ) : (
            <>
              <Button
                variant={saved ? "default" : "outline"}
                onClick={handleSaveToggle}
                className={`text-xs sm:text-sm w-full sm:w-auto ${
                  saved ? "bg-red-600 hover:bg-red-700 text-white" : ""
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 ${
                    saved ? "fill-current" : ""
                  }`}
                />{" "}
                {saved
                  ? t("customer.providers.detail.saved")
                  : t("customer.providers.detail.save")}
              </Button>

              {provider.allowMessages !== false && (
                <Button
                  onClick={(e) => {
                    e.preventDefault(); // prevents Link from triggering navigation
                    handleContact(provider);
                  }}
                  className="text-xs sm:text-sm w-full sm:w-auto"
                >
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                  {t("customer.providers.detail.contact")}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Header card */}
      <Card>
        <CardContent className="p-4 sm:p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5">
            {hasProfilePhoto ? (
              <button
                type="button"
                onClick={() => setProfilePhotoOpen(true)}
                className="mx-auto sm:mx-0 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 shrink-0 cursor-pointer"
                aria-label={t("customer.providers.detail.profilePhotoAria")}
              >
                <Avatar className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 pointer-events-none">
                  <AvatarImage src={profilePhotoSrc} alt="" />
                  <AvatarFallback>{provider.name?.[0]}</AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <Avatar className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 flex-shrink-0 mx-auto sm:mx-0">
                <AvatarImage src={profilePhotoSrc} alt="" />
                <AvatarFallback>{provider.name?.[0]}</AvatarFallback>
              </Avatar>
            )}
            <div className="flex-1 min-w-0 w-full sm:w-auto text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5 sm:mb-1">
                <h1 className="text-xl sm:text-2xl font-bold break-words">
                  {provider.name}
                </h1>
                {provider.verified && (
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {t("customer.providers.detail.verified")}
                  </Badge>
                )}
                {!provider.verified && (
                  <Badge className="bg-gray-100 text-gray-700 border-gray-300 text-xs">
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {t("customer.providers.detail.notVerified")}
                  </Badge>
                )}
                {provider.topRated && (
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                    {t("customer.providers.detail.topRated")}
                  </Badge>
                )}
              </div>
              <p className="text-sm sm:text-base text-gray-600 break-words">
                {provider.major || t("customer.providers.defaultMajor")} •{" "}
                {provider.company}
              </p>
              <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-400 fill-current flex-shrink-0" />
                  <b>{provider.rating}</b> ({provider.reviewCount})
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="truncate">{provider.location}</span>
                </span>
                <div className="min-w-0 text-center sm:text-left">
                  <CustomerProviderHourlyRate
                    provider={provider}
                    viewerPreferredCurrency={viewerPreferredCurrency}
                    primaryClassName="text-xs sm:text-sm text-gray-600"
                    secondaryClassName="text-xs sm:text-sm text-gray-600"
                    captionClassName="text-[10px] sm:text-xs text-gray-500"
                  />
                </div>
                <span className="whitespace-nowrap">
                  {t("customer.providers.detail.completedJobsLine", {
                    count: String(provider.completedJobs),
                  })}
                </span>
                <span className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  {provider.languages?.map((l) => (
                    <Badge
                      key={l}
                      variant="secondary"
                      className="text-[10px] sm:text-xs"
                    >
                      {l}
                    </Badge>
                  ))}
                </span>
              </div>
            </div>
          </div>
          <Separator className="my-3 sm:my-4" />
          <p className="text-sm sm:text-base text-gray-800 break-words">
            {provider.bio}
          </p>
          <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
            {provider.skills.map((s) => (
              <Badge
                key={s}
                variant="secondary"
                className="text-[10px] sm:text-xs"
              >
                {s}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Portfolio & Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-5 lg:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                {t("customer.providers.detail.portfolioTitle")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t("customer.providers.detail.portfolioDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <CollapsibleSection
                expanded={portfolioExpanded}
                onToggle={() => setPortfolioExpanded((v) => !v)}
                maxHeight={COLLAPSED_MAX_HEIGHT}
                showMoreLabel={t("customer.providers.detail.showMore")}
                showLessLabel={t("customer.providers.detail.showLess")}
              >
                <PortfolioGrid items={portfolio} />
              </CollapsibleSection>
            </CardContent>
          </Card>

          {/* Completed Projects */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                {t("customer.providers.detail.completedProjectsTitle")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t("customer.providers.detail.completedProjectsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <CollapsibleSection
                expanded={completedProjectsExpanded}
                onToggle={() => setCompletedProjectsExpanded((v) => !v)}
                maxHeight={COLLAPSED_MAX_HEIGHT}
                showMoreLabel={t("customer.providers.detail.showMore")}
                showLessLabel={t("customer.providers.detail.showLess")}
              >
                {loadingPortfolio ? (
                  <div className="flex items-center justify-center py-8 sm:py-12">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-gray-400" />
                    <span className="ml-2 text-xs sm:text-sm text-gray-600">
                      {t("customer.providers.detail.loadingProjects")}
                    </span>
                  </div>
                ) : portfolioProjects.length === 0 ? (
                  <div className="text-center py-8 sm:py-12 px-4">
                    <Globe className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 text-gray-300" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                      {t("customer.providers.detail.noCompletedTitle")}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {t("customer.providers.detail.noCompletedBody")}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
                    {portfolioProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="hover:shadow-lg transition-shadow"
                      >
                        <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 h-40 sm:h-48 flex items-center justify-center rounded-t-lg">
                          <div className="text-center p-3 sm:p-4">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                              <Award className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-[10px] sm:text-xs"
                            >
                              {project.category ||
                                t("customer.providers.detail.projectFallback")}
                            </Badge>
                          </div>
                        </div>
                        <CardContent className="p-3 sm:p-4">
                          <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-1.5 sm:mb-2 line-clamp-1">
                            {project.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 line-clamp-2">
                            {project.description ||
                              t("customer.providers.detail.noDescription")}
                          </p>
                          {project.technologies &&
                            project.technologies.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2 sm:mb-3">
                                {project.technologies
                                  .slice(0, 6)
                                  .map((tech: string, index: number) => (
                                    <Badge
                                      key={index}
                                      variant="secondary"
                                      className="text-[10px] sm:text-xs"
                                    >
                                      {tech}
                                    </Badge>
                                  ))}
                                {project.technologies.length > 6 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] sm:text-xs"
                                  >
                                    {t("customer.providers.detail.moreTech", {
                                      n: String(
                                        project.technologies.length - 6,
                                      ),
                                    })}
                                  </Badge>
                                )}
                              </div>
                            )}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 text-xs sm:text-sm text-gray-500">
                            <span className="font-medium truncate">
                              {project.client}
                            </span>
                            {project.completedDate && (
                              <span className="whitespace-nowrap">
                                {new Date(
                                  project.completedDate,
                                ).toLocaleDateString(dateLocale)}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CollapsibleSection>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                {t("customer.providers.detail.reviewsTitle")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t("customer.providers.detail.reviewsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              <CollapsibleSection
                expanded={reviewsExpanded}
                onToggle={() => setReviewsExpanded((v) => !v)}
                maxHeight={COLLAPSED_MAX_HEIGHT}
                showMoreLabel={t("customer.providers.detail.showMore")}
                showLessLabel={t("customer.providers.detail.showLess")}
              >
                <ReviewsList reviews={reviews} />
              </CollapsibleSection>
            </CardContent>
          </Card>

          {/* Resume */}
          {resume && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  {t("customer.providers.detail.resumeTitle")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t("customer.providers.detail.resumeDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="w-8 h-8 text-gray-400" />
                    <div>
                      <p className="font-medium text-sm sm:text-base">
                        {t("customer.providers.detail.resumeFileLabel")}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {t("customer.providers.detail.uploadedOn", {
                          date: new Date(resume.uploadedAt).toLocaleDateString(
                            dateLocale,
                          ),
                        })}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadResume}
                    className="text-xs sm:text-sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    {t("customer.providers.detail.download")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4 sm:space-y-5 lg:space-y-6">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                {t("customer.providers.detail.hireTitle", {
                  name: provider.name.split(" ")[0] ?? provider.name,
                })}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t("customer.providers.detail.hireDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
              {publicGuestMode ? (
                <Button
                  onClick={() => router.push("/auth/login?role=customer")}
                  className="w-full text-xs sm:text-sm"
                >
                  Sign in to hire
                </Button>
              ) : (
                <>
                  <Button
                    onClick={() => setIsProposalPopupOpen(true)}
                    className="w-full text-xs sm:text-sm"
                  >
                    {t("customer.providers.detail.requestProposal")}
                  </Button>
                  {provider.allowMessages !== false && (
                    <Button
                      variant="outline"
                      className="w-full text-xs sm:text-sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleContact(provider);
                      }}
                    >
                      {t("customer.providers.detail.sendMessage")}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                {t("customer.providers.detail.specialtiesTitle")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t("customer.providers.detail.specialtiesDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-1.5 sm:gap-2 p-4 sm:p-6 pt-0">
              {provider.specialties.map((sp) => (
                <Badge
                  key={sp}
                  variant="secondary"
                  className="text-[10px] sm:text-xs"
                >
                  {sp}
                </Badge>
              ))}
            </CardContent>
          </Card>

          {/* Contact Information Card - Only show if privacy settings allow */}
          {(provider.email || provider.phone) && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  {t("customer.providers.detail.contactInfoTitle")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t("customer.providers.detail.contactInfoDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm p-4 sm:p-6 pt-0">
                {provider.email && (
                  <div>
                    <p className="text-gray-500">
                      {t("customer.providers.detail.label.email")}
                    </p>
                    <a
                      href={`mailto:${provider.email}`}
                      className="font-medium text-blue-600 hover:underline break-all"
                    >
                      {provider.email}
                    </a>
                  </div>
                )}
                {provider.phone && (
                  <div>
                    <p className="text-gray-500">
                      {t("customer.providers.detail.label.phone")}
                    </p>
                    <a
                      href={`tel:${provider.phone}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {provider.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Information Card */}
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-base sm:text-lg">
                {t("customer.providers.detail.additionalTitle")}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {t("customer.providers.detail.additionalDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5 sm:space-y-3 text-xs sm:text-sm p-4 sm:p-6 pt-0">
              {provider.availability && (
                <div>
                  <p className="text-gray-500">
                    {t("customer.providers.detail.label.availability")}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        provider.availability === "available" ||
                        provider.availability === "Available"
                          ? "bg-green-500"
                          : provider.availability === "busy"
                            ? "bg-yellow-500"
                            : "bg-gray-400"
                      }`}
                    />
                    <p className="font-medium capitalize">
                      {provider.availability}
                    </p>
                  </div>
                </div>
              )}
              {provider.workPreference && (
                <div>
                  <p className="text-gray-500">
                    {t("customer.providers.detail.label.workPreference")}
                  </p>
                  <p className="font-medium capitalize">
                    {provider.workPreference}
                  </p>
                </div>
              )}
              {(provider.teamSize ?? 0) > 1 && (
                <div>
                  <p className="text-gray-500">
                    {t("customer.providers.detail.label.teamSize")}
                  </p>
                  <p className="font-medium">
                    {t("customer.providers.detail.teamMembers", {
                      n: String(provider.teamSize),
                    })}
                  </p>
                </div>
              )}
              {(provider.minimumProjectBudget ||
                provider.maximumProjectBudget) &&
                projectBudgetDisplay && (
                  <div>
                    <p className="text-gray-500">
                      {t("customer.providers.detail.label.projectBudget")}
                    </p>
                    <div className="space-y-2 mt-1">
                      <div>
                        <p className="font-medium">
                          {projectBudgetDisplay.primaryText}
                        </p>
                        {projectBudgetDisplay.showCaptions && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t(
                              "customer.providers.detail.budgetCaptionProvider",
                              {
                                code: projectBudgetDisplay.providerCode,
                              },
                            )}
                          </p>
                        )}
                      </div>
                      {projectBudgetDisplay.secondaryText ? (
                        <div className="pt-2 border-t border-gray-100">
                          <p className="font-medium">
                            {projectBudgetDisplay.secondaryText}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t("customer.providers.detail.budgetCaptionYours", {
                              code: projectBudgetDisplay.viewerCode,
                            })}
                          </p>
                        </div>
                      ) : null}
                      {projectBudgetDisplay.conversionFailed &&
                      viewerPreferredCurrency &&
                      normalizeCurrencyCode(viewerPreferredCurrency) !==
                        normalizeCurrencyCode(
                          provider.preferredCurrency || "MYR",
                        ) ? (
                        <p className="text-xs text-amber-800 bg-amber-50 rounded px-2 py-1.5">
                          {t(
                            "customer.providers.detail.budgetConversionUnavailable",
                          )}
                        </p>
                      ) : null}
                      {projectBudgetDisplay.footnote &&
                      projectBudgetDisplay.secondaryText ? (
                        <p className="text-xs text-gray-400 pt-0.5">
                          {t("customer.providers.detail.budgetFxFootnote", {
                            date: projectBudgetDisplay.footnote,
                          })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                )}
              {provider.yearsExperience != null &&
                provider.yearsExperience > 0 && (
                  <div>
                    <p className="text-gray-500">
                      {t("customer.providers.detail.label.yearsExperience")}
                    </p>
                    <p className="font-medium">
                      {t("customer.providers.card.years", {
                        n: String(provider.yearsExperience),
                      })}
                    </p>
                  </div>
                )}
              {provider.preferredProjectDuration && (
                <div>
                  <p className="text-gray-500">
                    {t("customer.providers.detail.label.preferredDuration")}
                  </p>
                  <p className="font-medium">
                    {provider.preferredProjectDuration}
                  </p>
                </div>
              )}
              {provider.website && (
                <div>
                  <p className="text-gray-500">
                    {t("customer.providers.detail.label.website")}
                  </p>
                  <a
                    href={
                      provider.website.startsWith("http")
                        ? provider.website
                        : `https://${provider.website}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {provider.website}
                  </a>
                </div>
              )}
              {(provider.certificationsCount ?? 0) > 0 && (
                <div>
                  <p className="text-gray-500">
                    {t("customer.providers.detail.label.certifications")}
                  </p>
                  <p className="font-medium">
                    {provider.certificationsCount === 1
                      ? t("customer.providers.detail.certificationCount", {
                          n: String(provider.certificationsCount),
                        })
                      : t(
                          "customer.providers.detail.certificationCountPlural",
                          {
                            n: String(provider.certificationsCount),
                          },
                        )}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Certifications List */}
          {provider.certifications && provider.certifications.length > 0 && (
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  {t("customer.providers.detail.certificationsListTitle")}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t("customer.providers.detail.certificationsListDesc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 pt-0">
                <CollapsibleSection
                  expanded={certificationsExpanded}
                  onToggle={() => setCertificationsExpanded((v) => !v)}
                  maxHeight={COLLAPSED_MAX_HEIGHT_SIDEBAR}
                  showMoreLabel={t("customer.providers.detail.showMore")}
                  showLessLabel={t("customer.providers.detail.showLess")}
                >
                  <div className="space-y-4">
                    {provider.certifications.map((cert) => (
                      <div
                        key={cert.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Award className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{cert.name}</p>
                              {cert.verified && (
                                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600">
                              {cert.issuer}
                            </p>
                            <p className="text-xs text-gray-500">
                              {t("customer.providers.detail.issued")}{" "}
                              {cert.issuedDate
                                ? new Date(cert.issuedDate).toLocaleDateString(
                                    dateLocale,
                                  )
                                : t("customer.providers.detail.notAvailable")}
                            </p>
                            {cert.serialNumber && (
                              <p className="text-xs text-gray-500 mt-1">
                                {t("customer.providers.detail.serial")}{" "}
                                {cert.serialNumber}
                              </p>
                            )}
                            {cert.sourceUrl && (
                              <a
                                href={
                                  cert.sourceUrl.startsWith("http://") ||
                                  cert.sourceUrl.startsWith("https://")
                                    ? cert.sourceUrl
                                    : `https://${cert.sourceUrl.trim()}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                              >
                                {t(
                                  "customer.providers.detail.verifyCertificate",
                                )}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CollapsibleSection>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={profilePhotoOpen} onOpenChange={setProfilePhotoOpen}>
        <DialogContent className="max-w-[min(100vw-1rem,56rem)] p-2 sm:p-4 border bg-background">
          <DialogTitle className="sr-only">
            {t("customer.providers.detail.dialogPhotoTitle", {
              name: provider.name ?? "",
            })}
          </DialogTitle>
          <div className="flex max-h-[85vh] items-center justify-center overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={profilePhotoSrc}
              alt={`${provider.name} profile photo`}
              className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Proposal Popup */}
      {!publicGuestMode && (
        <ProposalPopup
          providerId={provider.id}
          providerName={provider.name}
          isOpen={isProposalPopupOpen}
          onClose={() => setIsProposalPopupOpen(false)}
          onSuccess={() => {
            // Refresh or show success message
            console.log("Proposal request sent successfully");
          }}
        />
      )}
    </div>
  );
}
