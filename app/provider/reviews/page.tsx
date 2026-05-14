"use client";

import type React from "react";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Star,
  Search,
  Filter,
  Plus,
  Calendar,
  MessageSquare,
  Reply,
  Clock,
  Award,
} from "lucide-react";
import { ProviderReviewsTour } from "@/components/provider/ProviderReviewsTour";
import { useToast } from "@/hooks/use-toast";
import {
  useProviderReviews,
  useProviderReviewStatistics,
  useProviderCompletedProjectsForReview,
  useReviewActions,
  type Review,
  type CompletedProject,
} from "../../../lib/hooks/useReviews";
import { getProfileImageUrl } from "@/lib/api";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { useI18n } from "@/contexts/I18nProvider";

const PROVIDER_CATEGORY_KEYS = [
  "communicationRating",
  "clarityRating",
  "paymentRating",
  "professionalismRating",
] as const;

type ProviderReviewFormState = {
  projectId: string;
  rating: number;
  content: string;
  communicationRating: number;
  clarityRating: number;
  paymentRating: number;
  professionalismRating: number;
};

const initialReviewForm: ProviderReviewFormState = {
  projectId: "",
  rating: 0,
  content: "",
  communicationRating: 0,
  clarityRating: 0,
  paymentRating: 0,
  professionalismRating: 0,
};

const computeProviderOverallRating = (form: ProviderReviewFormState) => {
  const ratings = PROVIDER_CATEGORY_KEYS.map((key) => form[key]).filter(
    (value) => value > 0,
  );
  if (ratings.length !== PROVIDER_CATEGORY_KEYS.length) {
    return 0;
  }
  const average =
    ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  return Number(average.toFixed(1));
};

const hasAllProviderCategoryRatings = (form: ProviderReviewFormState) =>
  PROVIDER_CATEGORY_KEYS.every((key) => form[key] > 0);

export default function ProviderReviewsPage() {
  const { t, locale } = useI18n();
  const dateLocale =
    locale === "id" ? "id-ID" : locale === "ar" ? "ar" : "en-US";
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"given" | "received" | "pending">(
    "given",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] =
    useState<ProviderReviewFormState>(initialReviewForm);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyingReview, setReplyingReview] = useState<Review | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const filterParams = useMemo(
    () => ({
      search: searchTerm || undefined,
      rating:
        selectedRating === "all" ? undefined : parseInt(selectedRating, 10),
      sortBy,
    }),
    [searchTerm, selectedRating, sortBy],
  );

  const {
    reviews: givenReviews = [],
    loading: givenLoading,
    error: givenError,
    refetch: refetchGivenReviews,
  } = useProviderReviews({ ...filterParams, status: "given" });

  const {
    reviews: receivedReviews = [],
    loading: receivedLoading,
    error: receivedError,
    refetch: refetchReceivedReviews,
  } = useProviderReviews({ ...filterParams, status: "received" });

  const { statistics, loading: statsLoading } = useProviderReviewStatistics();
  const {
    projects: completedProjects = [],
    loading: projectsLoading,
    refetch: refetchProjects,
  } = useProviderCompletedProjectsForReview();

  const {
    createReview,
    updateReview,
    deleteReview,
    createReply,
    loading: actionLoading,
  } = useReviewActions();

  const availableProjectsForReview = useMemo(
    () => completedProjects,
    [completedProjects],
  );

  const stats = useMemo(
    () => ({
      totalReviews: statistics?.totalReviews ?? 0,
      averageRating: statistics?.averageRating ?? 0,
      pendingReviews:
        statistics?.pendingReviews ?? availableProjectsForReview.length,
    }),
    [statistics, availableProjectsForReview.length],
  );

  const handleReviewFormChange = (values: Partial<ProviderReviewFormState>) => {
    setReviewForm((prev) => {
      const next = { ...prev, ...values };
      return {
        ...next,
        rating: computeProviderOverallRating(next),
      };
    });
  };

  const handleReviewDialogOpenChange = (open: boolean) => {
    setIsReviewDialogOpen(open);
    if (!open) {
      setEditingReview(null);
      setReviewForm({
        ...initialReviewForm,
        rating: computeProviderOverallRating(initialReviewForm),
      });
    }
  };

  const handleOpenCreateReview = (projectId?: string) => {
    setActiveTab("given");
    setEditingReview(null);
    const targetProjectId =
      projectId ?? availableProjectsForReview[0]?.id ?? "";

    if (!targetProjectId) {
      toast({
        title: t("provider.reviews.toast.noCompaniesTitle"),
        description: t("provider.reviews.toast.noCompaniesDesc"),
      });
      return;
    }

    const nextForm: ProviderReviewFormState = {
      ...initialReviewForm,
      projectId: targetProjectId,
    };

    setReviewForm({
      ...nextForm,
      rating: computeProviderOverallRating(nextForm),
    });
    setIsReviewDialogOpen(true);
  };

  const handleOpenEditReview = (review: Review) => {
    setActiveTab("given");
    setEditingReview(review);
    const fallback =
      review.rating && review.rating > 0
        ? Math.max(1, Math.min(5, Math.round(review.rating)))
        : 0;
    const nextForm: ProviderReviewFormState = {
      projectId: review.projectId,
      rating: 0,
      content: review.content || "",
      communicationRating: review.communicationRating ?? fallback,
      clarityRating: review.qualityRating ?? fallback,
      paymentRating: review.timelinessRating ?? fallback,
      professionalismRating: review.professionalismRating ?? fallback,
    };

    setReviewForm({
      ...nextForm,
      rating: computeProviderOverallRating(nextForm),
    });
    setIsReviewDialogOpen(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = window.confirm(t("provider.reviews.confirm.delete"));
    if (!confirmed) return;

    try {
      await deleteReview(reviewId, true);
      toast({
        title: t("provider.reviews.toast.deletedTitle"),
        description: t("provider.reviews.toast.deletedDesc"),
      });
      refetchGivenReviews();
      refetchProjects();
    } catch (error: unknown) {
      toast({
        title: t("provider.reviews.toast.deleteFailedTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider reviews delete",
        ),
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (
      !hasAllProviderCategoryRatings(reviewForm) ||
      !reviewForm.content.trim()
    ) {
      toast({
        title: t("provider.reviews.toast.missingDetailsTitle"),
        description: t("provider.reviews.toast.missingDetailsDesc"),
        variant: "destructive",
      });
      return;
    }

    const overallRating = computeProviderOverallRating(reviewForm);
    if (overallRating === 0) {
      toast({
        title: t("provider.reviews.toast.incompleteCategoriesTitle"),
        description: t("provider.reviews.toast.incompleteCategoriesDesc"),
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingReview) {
        await updateReview(
          editingReview.id,
          {
            content: reviewForm.content.trim(),
            rating: overallRating,
            communicationRating: reviewForm.communicationRating,
            qualityRating: reviewForm.clarityRating,
            timelinessRating: reviewForm.paymentRating,
            professionalismRating: reviewForm.professionalismRating,
          },
          true,
        );

        toast({
          title: t("provider.reviews.toast.updatedTitle"),
          description: t("provider.reviews.toast.updatedDesc"),
        });
      } else {
        const selectedProject = availableProjectsForReview.find(
          (project) => project.id === reviewForm.projectId,
        );

        if (!selectedProject || !selectedProject.customer?.id) {
          throw new Error(t("provider.reviews.error.projectCompanyMismatch"));
        }

        await createReview(
          {
            projectId: selectedProject.id,
            recipientId: selectedProject.customer.id,
            content: reviewForm.content.trim(),
            rating: overallRating,
            communicationRating: reviewForm.communicationRating,
            clarityRating: reviewForm.clarityRating,
            paymentRating: reviewForm.paymentRating,
            professionalismRating: reviewForm.professionalismRating,
          },
          true,
        );

        toast({
          title: t("provider.reviews.toast.submittedTitle"),
          description: t("provider.reviews.toast.submittedDesc"),
        });
      }

      handleReviewDialogOpenChange(false);
      refetchGivenReviews();
      refetchProjects();
    } catch (error: unknown) {
      toast({
        title: t("provider.reviews.toast.genericErrorTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider reviews save",
        ),
        variant: "destructive",
      });
    }
  };

  const handleOpenReply = (review: Review) => {
    setActiveTab("received");
    setReplyingReview(review);
    setReplyContent("");
    setReplyDialogOpen(true);
  };

  const handleSubmitReply = async () => {
    if (!replyingReview || !replyContent.trim()) {
      toast({
        title: t("provider.reviews.toast.replyRequiredTitle"),
        description: t("provider.reviews.toast.replyRequiredDesc"),
        variant: "destructive",
      });
      return;
    }

    try {
      await createReply(replyingReview.id, replyContent.trim(), true);
      toast({
        title: t("provider.reviews.toast.replyPostedTitle"),
        description: t("provider.reviews.toast.replyPostedDesc"),
      });
      setReplyDialogOpen(false);
      setReplyContent("");
      refetchReceivedReviews();
    } catch (error: unknown) {
      toast({
        title: t("provider.reviews.toast.replyFailedTitle"),
        description: getUserFriendlyErrorMessage(
          error,
          "provider reviews reply",
        ),
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <ProviderReviewsTour />
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between" data-tour-step="0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {t("provider.reviews.title")}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              {t("provider.reviews.subtitle")}
            </p>
          </div>
          <Button
            onClick={() => handleOpenCreateReview()}
            disabled={
              projectsLoading || availableProjectsForReview.length === 0
            }
            className="w-full sm:w-auto"
            data-tour-step="1"
          >
            <Plus className="mr-2 h-4 w-4" />
            {t("provider.reviews.writeReview")}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" data-tour-step="2">
          <StatsCard
            title={t("provider.reviews.stats.totalTitle")}
            value={
              statsLoading
                ? "…"
                : stats.totalReviews.toString().padStart(1, "0")
            }
            icon={<Award className="h-8 w-8 text-blue-600" />}
            helper={t("provider.reviews.stats.totalHelper")}
          />
          <StatsCard
            title={t("provider.reviews.stats.avgTitle")}
            value={
              statsLoading ? "…" : (stats.averageRating.toFixed(1) ?? "0.0")
            }
            icon={<Star className="h-8 w-8 text-yellow-500" />}
            helper={t("provider.reviews.stats.avgHelper")}
          />
          <StatsCard
            title={t("provider.reviews.stats.pendingTitle")}
            value={
              statsLoading
                ? "…"
                : stats.pendingReviews.toString().padStart(1, "0")
            }
            icon={<Calendar className="h-8 w-8 text-orange-500" />}
            helper={t("provider.reviews.stats.pendingHelper")}
          />
        </div>

        <Card data-tour-step="3">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center">
              <div className="flex flex-1 items-center gap-2">
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <Input
                  placeholder={t("provider.reviews.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select
                  value={selectedRating}
                  onValueChange={setSelectedRating}
                >
                  <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue
                      placeholder={t("provider.reviews.filterPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("provider.reviews.filter.allRatings")}
                    </SelectItem>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {t("provider.reviews.filter.stars", { n: rating })}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                    <SelectValue
                      placeholder={t("provider.reviews.sortPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">
                      {t("provider.reviews.sort.newest")}
                    </SelectItem>
                    <SelectItem value="oldest">
                      {t("provider.reviews.sort.oldest")}
                    </SelectItem>
                    <SelectItem value="highest">
                      {t("provider.reviews.sort.highest")}
                    </SelectItem>
                    <SelectItem value="lowest">
                      {t("provider.reviews.sort.lowest")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "given" | "received" | "pending")
          }
          data-tour-step="4"
        >
          <TabsList className="w-full sm:w-auto flex flex-col sm:flex-row h-auto sm:h-10 bg-gray-100 p-2 sm:p-3 rounded-lg">
            <TabsTrigger
              value="given"
              className="text-xs sm:text-sm w-full sm:w-auto data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md"
            >
              {t("provider.reviews.tabs.given")}
            </TabsTrigger>
            <TabsTrigger
              value="received"
              className="text-xs sm:text-sm w-full sm:w-auto data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md"
            >
              {t("provider.reviews.tabs.received")}
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="text-xs sm:text-sm w-full sm:w-auto data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md"
            >
              {t("provider.reviews.tabs.pending")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="given" className="pt-6">
            <div data-tour-step="5">
            <ReviewList
              reviews={givenReviews}
              loading={givenLoading}
              error={givenError}
              type="given"
              emptyMessage={t("provider.reviews.empty.given")}
              dateLocale={dateLocale}
              onEdit={handleOpenEditReview}
              onDelete={(review) => handleDeleteReview(review.id)}
            />
            </div>
          </TabsContent>

          <TabsContent value="received" className="pt-6">
            <div data-tour-step="5">
            <ReviewList
              reviews={receivedReviews}
              loading={receivedLoading}
              error={receivedError}
              type="received"
              emptyMessage={t("provider.reviews.empty.received")}
              dateLocale={dateLocale}
              onReply={handleOpenReply}
            />
            </div>
          </TabsContent>

          <TabsContent value="pending" className="pt-6">
            <div data-tour-step="5">
            <PendingProjectsList
              projects={availableProjectsForReview}
              loading={projectsLoading}
              dateLocale={dateLocale}
              onWriteReview={(projectId) => handleOpenCreateReview(projectId)}
            />
            </div>
          </TabsContent>
        </Tabs>

        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={handleReviewDialogOpenChange}
          formState={reviewForm}
          onChange={handleReviewFormChange}
          onSubmit={handleSubmitReview}
          projects={availableProjectsForReview}
          isSubmitting={actionLoading}
          mode={editingReview ? "edit" : "create"}
        />

        <ReplyDialog
          open={replyDialogOpen}
          onOpenChange={setReplyDialogOpen}
          review={replyingReview}
          replyContent={replyContent}
          onReplyContentChange={setReplyContent}
          onSubmit={handleSubmitReply}
          isSubmitting={actionLoading}
        />
      </div>
    </>
  );
}

function StatsCard({
  title,
  value,
  icon,
  helper,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  helper: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4 sm:p-6">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm font-medium text-gray-600">
            {title}
          </p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
            {value}
          </p>
          <p className="text-xs text-gray-500 mt-1">{helper}</p>
        </div>
        <div className="rounded-full bg-gray-100 p-3 flex-shrink-0 ml-2">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

interface ReviewListProps {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  type: "given" | "received";
  emptyMessage: string;
  dateLocale: string;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onReply?: (review: Review) => void;
}

function ReviewList({
  reviews,
  loading,
  error,
  type,
  emptyMessage,
  dateLocale,
  onEdit,
  onDelete,
  onReply,
}: ReviewListProps) {
  const { t } = useI18n();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          {t("provider.reviews.loading.list")}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-destructive">
          {error || t("provider.reviews.error.loadFailed")}
        </CardContent>
      </Card>
    );
  }

  if (!reviews.length) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-10 w-10 text-muted-foreground" />}
        title={t("provider.reviews.empty.listTitle")}
        description={emptyMessage}
      />
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          type={type}
          dateLocale={dateLocale}
          onEdit={onEdit}
          onDelete={onDelete}
          onReply={onReply}
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  type,
  dateLocale,
  onReply,
}: {
  review: Review;
  type: "given" | "received";
  dateLocale: string;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onReply?: (review: Review) => void;
}) {
  const { t } = useI18n();
  const counterparty = type === "given" ? review.recipient : review.reviewer;
  const projectTitle =
    review.project?.title ?? t("provider.reviews.card.projectFallback");
  const reply = review.ReviewReply?.[0];

  // Get profile image URL from customerProfile or providerProfile
  const profileImageUrl = getProfileImageUrl(
    (counterparty as { customerProfile?: { profileImageUrl?: string } })
      ?.customerProfile?.profileImageUrl ||
      (counterparty as { providerProfile?: { profileImageUrl?: string } })
        ?.providerProfile?.profileImageUrl ||
      undefined,
  );

  const categories =
    type === "given"
      ? [
          {
            label: t("provider.reviews.category.communication"),
            value: review.communicationRating,
          },
          {
            label: t("provider.reviews.category.clarity"),
            value: review.qualityRating,
          },
          {
            label: t("provider.reviews.category.payment"),
            value: review.timelinessRating,
          },
          {
            label: t("provider.reviews.category.professionalism"),
            value: review.professionalismRating,
          },
        ]
      : [
          {
            label: t("provider.reviews.category.quality"),
            value: review.qualityRating,
          },
          {
            label: t("provider.reviews.category.timeliness"),
            value: review.timelinessRating,
          },
          {
            label: t("provider.reviews.category.communication"),
            value: review.communicationRating,
          },
          {
            label: t("provider.reviews.category.professionalism"),
            value: review.professionalismRating,
          },
        ];

  return (
    <Card className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          {/* Left side: User info */}
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            <Avatar className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0">
              <AvatarImage src={profileImageUrl} />
              <AvatarFallback className="bg-gray-100 text-gray-600 text-base sm:text-lg font-semibold">
                {counterparty?.name?.charAt(0)?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-1">
                {counterparty?.name ?? t("provider.reviews.card.unknownUser")}
              </h3>
              <p className="text-sm text-gray-600 mb-1 truncate">
                {projectTitle}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString(dateLocale, {
                  month: "2-digit",
                  day: "2-digit",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Right side: Rating */}
          <div className="flex flex-col items-start sm:items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <RatingStars rating={review.rating || 0} />
              <span className="text-base sm:text-lg font-bold text-gray-900">
                {(review.rating || 0).toFixed(1)}
              </span>
            </div>
            <Badge
              variant="outline"
              className="text-xs bg-gray-50 border-gray-200 text-gray-700"
            >
              {type === "given"
                ? t("provider.reviews.badge.youReviewedCompany")
                : t("provider.reviews.badge.companyReview")}
            </Badge>
          </div>
        </div>

        {/* Review content */}
        {review.content && (
          <p className="text-sm sm:text-base text-gray-700 mt-4 leading-relaxed">
            {review.content}
          </p>
        )}

        {/* Category ratings */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4">
          {categories.map(
            (category) =>
              category.value && (
                <CategoryScore
                  key={category.label}
                  label={category.label}
                  value={category.value}
                />
              ),
          )}
        </div>

        {/* Reply section */}
        {reply && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 sm:p-4 mt-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">
              {t("provider.reviews.reply.yourReply")}
            </p>
            <p className="text-xs text-gray-500 mb-2">
              {new Date(reply.createdAt).toLocaleDateString(dateLocale, {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">
              {reply.content}
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-200">
          <Badge
            variant="secondary"
            className="text-xs bg-gray-100 text-gray-700"
          >
            {type === "given"
              ? t("provider.reviews.badge.published")
              : t("provider.reviews.badge.receivedBadge")}
          </Badge>
          <div className="flex gap-2">
            {type === "received" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReply?.(review)}
                disabled={Boolean(reply)}
                className="text-xs sm:text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Reply className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {reply
                  ? t("provider.reviews.actions.replied")
                  : t("provider.reviews.actions.reply")}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function PendingProjectsList({
  projects,
  loading,
  dateLocale,
  onWriteReview,
}: {
  projects: CompletedProject[];
  loading: boolean;
  dateLocale: string;
  onWriteReview: (projectId: string) => void;
}) {
  const { t } = useI18n();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          {t("provider.reviews.pending.loading")}
        </CardContent>
      </Card>
    );
  }

  if (!projects.length) {
    return (
      <EmptyState
        icon={<Clock className="h-10 w-10 text-muted-foreground" />}
        title={t("provider.reviews.pending.caughtUpTitle")}
        description={t("provider.reviews.pending.caughtUpDesc")}
      />
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {projects.map((project) => (
        <Card
          key={project.id}
          className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <CardContent className="flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                  {project.title || t("provider.reviews.card.projectFallback")}
                </h3>
                {project.status === "DISPUTED" && (
                  <Badge variant="destructive" className="text-xs">
                    {t("provider.reviews.pending.disputed")}
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {project.customer?.name ??
                  t("provider.reviews.pending.companyFallback")}
              </p>
              <p className="text-xs text-gray-500">
                {project.completedDate
                  ? new Date(project.completedDate).toLocaleDateString(
                      dateLocale,
                      {
                        month: "2-digit",
                        day: "2-digit",
                        year: "numeric",
                      },
                    )
                  : t("provider.reviews.pending.dateUnavailable")}
              </p>
            </div>
            <Button
              onClick={() => onWriteReview(project.id)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Plus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              {t("provider.reviews.writeReview")}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ReviewDialog({
  open,
  onOpenChange,
  formState,
  onChange,
  onSubmit,
  projects,
  isSubmitting,
  mode,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formState: ProviderReviewFormState;
  onChange: (values: Partial<ProviderReviewFormState>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  projects: CompletedProject[];
  isSubmitting: boolean;
  mode: "create" | "edit";
}) {
  const { t } = useI18n();
  const hasAllRatings = hasAllProviderCategoryRatings(formState);
  const hasProjects = projects.length > 0;
  const disableSubmit =
    !formState.content.trim() ||
    !hasAllRatings ||
    (mode === "create" && (!formState.projectId || !hasProjects)) ||
    isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "edit"
              ? t("provider.reviews.dialog.editTitle")
              : t("provider.reviews.dialog.writeTitle")}
          </DialogTitle>
          <DialogDescription>
            {t("provider.reviews.dialog.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label>{t("provider.reviews.dialog.project")}</Label>
            <Select
              value={formState.projectId}
              onValueChange={(value) => onChange({ projectId: value })}
              disabled={mode === "edit" || !hasProjects}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={t("provider.reviews.dialog.projectPlaceholder")}
                />
              </SelectTrigger>
              <SelectContent>
                {hasProjects ? (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {t("provider.reviews.dialog.projectOption", {
                        title:
                          project.title ||
                          t("provider.reviews.card.projectFallback"),
                        company:
                          project.customer?.name ??
                          t("provider.reviews.dialog.companyFallback"),
                      })}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {t("provider.reviews.dialog.noProjectsOption")}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {!hasProjects && mode === "create" && (
              <p className="mt-2 text-xs text-muted-foreground">
                {t("provider.reviews.dialog.noProjectsHint")}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <RatingInput
              label={t("provider.reviews.category.communication")}
              value={formState.communicationRating}
              onChange={(value) => onChange({ communicationRating: value })}
            />
            <RatingInput
              label={t("provider.reviews.category.clarity")}
              value={formState.clarityRating}
              onChange={(value) => onChange({ clarityRating: value })}
            />
            <RatingInput
              label={t("provider.reviews.category.payment")}
              value={formState.paymentRating}
              onChange={(value) => onChange({ paymentRating: value })}
            />
            <RatingInput
              label={t("provider.reviews.category.professionalism")}
              value={formState.professionalismRating}
              onChange={(value) => onChange({ professionalismRating: value })}
            />
          </div>

          <div>
            <Label>{t("provider.reviews.dialog.overallLabel")}</Label>
            <div className="mt-2 flex items-center gap-2">
              <RatingStars rating={formState.rating} />
              <span className="text-xs text-muted-foreground">
                {formState.rating
                  ? t("provider.reviews.dialog.overallScore", {
                      score: formState.rating.toFixed(1),
                    })
                  : t("provider.reviews.dialog.rateAllCategories")}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("provider.reviews.dialog.overallComputedHint")}
            </p>
          </div>

          <div>
            <Label>{t("provider.reviews.dialog.feedback")}</Label>
            <Textarea
              rows={4}
              placeholder={t("provider.reviews.dialog.feedbackPlaceholder")}
              value={formState.content}
              onChange={(event) => onChange({ content: event.target.value })}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              {t("provider.reviews.dialog.cancel")}
            </Button>
            <Button type="submit" disabled={disableSubmit}>
              {isSubmitting
                ? t("provider.reviews.dialog.saving")
                : mode === "edit"
                  ? t("provider.reviews.dialog.save")
                  : t("provider.reviews.dialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReplyDialog({
  open,
  onOpenChange,
  review,
  replyContent,
  onReplyContentChange,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  review: Review | null;
  replyContent: string;
  onReplyContentChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  const { t } = useI18n();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("provider.reviews.replyDialog.title")}</DialogTitle>
          <DialogDescription>
            {t("provider.reviews.replyDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded border p-3 text-sm text-muted-foreground">
            {review?.content}
          </div>
          <Textarea
            rows={4}
            placeholder={t("provider.reviews.replyDialog.placeholder")}
            value={replyContent}
            onChange={(event) => onReplyContentChange(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("provider.reviews.replyDialog.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !replyContent}>
            {isSubmitting
              ? t("provider.reviews.replyDialog.posting")
              : t("provider.reviews.replyDialog.post")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RatingInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  const { t } = useI18n();

  return (
    <div>
      <Label className="flex items-center justify-between">{label}</Label>
      <div className="mt-2 flex items-center gap-2">
        <RatingStars rating={value} interactive onSelect={onChange} />
        <span className="text-xs text-muted-foreground">
          {value
            ? t("provider.reviews.rating.valueOutOfFive", { n: value })
            : t("provider.reviews.rating.notRated")}
        </span>
      </div>
    </div>
  );
}

function RatingStars({
  rating,
  interactive = false,
  onSelect,
}: {
  rating: number;
  interactive?: boolean;
  onSelect?: (value: number) => void;
}) {
  return (
    <div className="flex gap-0.5 sm:gap-1">
      {[1, 2, 3, 4, 5].map((value) => {
        const isFilled = value <= Math.floor(rating);
        const isHalfFilled =
          value === Math.ceil(rating) && rating % 1 !== 0 && value > rating;
        return (
          <Star
            key={value}
            className={`h-4 w-4 sm:h-5 sm:w-5 ${
              isFilled || isHalfFilled
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:scale-110 transition-transform" : ""}`}
            onClick={() => interactive && onSelect?.(value)}
          />
        );
      })}
    </div>
  );
}

function CategoryScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-2 sm:p-2.5">
      <span className="text-xs sm:text-sm text-gray-600">{label}</span>
      <span className="text-sm sm:text-base font-semibold text-gray-900">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

function EmptyState({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 p-8 text-center text-muted-foreground">
        {icon}
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
