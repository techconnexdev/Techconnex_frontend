"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MessageSquare,
  Calendar,
  Filter,
  Search,
  Plus,
  Reply,
  Clock,
} from "lucide-react";
import { CustomerLayout } from "@/components/customer-layout";
import { useToast } from "@/hooks/use-toast";
import {
  useCompanyReviews,
  useCompanyReviewStatistics,
  useCompletedProjectsForReview,
  useReviewActions,
  type Review,
  type CompletedProject,
} from "@/lib/hooks/useReviews";
import { getProfileImageUrl } from "@/lib/api";

type ReviewFormState = {
  projectId: string;
  rating: number;
  content: string;
  communicationRating: number;
  qualityRating: number;
  timelinessRating: number;
  professionalismRating: number;
};

const CUSTOMER_CATEGORY_KEYS = [
  "communicationRating",
  "qualityRating",
  "timelinessRating",
  "professionalismRating",
] as const;

function computeCustomerOverallRating(form: ReviewFormState) {
  const ratings = CUSTOMER_CATEGORY_KEYS.map((key) => form[key]).filter(
    (value) => value > 0
  );
  if (ratings.length !== CUSTOMER_CATEGORY_KEYS.length) {
    return 0;
  }
  const average =
    ratings.reduce((sum, value) => sum + value, 0) / ratings.length;
  return Number(average.toFixed(1));
}

function hasAllCustomerCategoryRatings(form: ReviewFormState) {
  return CUSTOMER_CATEGORY_KEYS.every((key) => form[key] > 0);
}

type CompanyProject = CompletedProject & {
  hasReview?: boolean;
  existingReview?: Review | null;
};

const initialReviewForm: ReviewFormState = {
  projectId: "",
  rating: 0,
  content: "",
  communicationRating: 0,
  qualityRating: 0,
  timelinessRating: 0,
  professionalismRating: 0,
};

export default function CustomerReviewsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"given" | "received" | "pending">(
    "given"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRating, setSelectedRating] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] =
    useState<ReviewFormState>(initialReviewForm);
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
    [searchTerm, selectedRating, sortBy]
  );

  const {
    reviews: givenReviews = [],
    loading: givenLoading,
    error: givenError,
    refetch: refetchGivenReviews,
  } = useCompanyReviews({ ...filterParams, status: "given" });

  const {
    reviews: receivedReviews = [],
    loading: receivedLoading,
    error: receivedError,
    refetch: refetchReceivedReviews,
  } = useCompanyReviews({ ...filterParams, status: "received" });

  const { statistics, loading: statsLoading } = useCompanyReviewStatistics();

  const {
    projects: completedProjects = [],
    loading: projectsLoading,
    refetch: refetchProjects,
  } = useCompletedProjectsForReview();

  const {
    createReview,
    updateReview,
    deleteReview,
    createReply,
    loading: actionLoading,
  } = useReviewActions();

  const companyProjects = completedProjects as CompanyProject[];

  const pendingProjects = useMemo(
    () => companyProjects.filter((project) => !project.hasReview),
    [companyProjects]
  );

  const availableProjectsForReview = useMemo(
    () => companyProjects.filter((project) => !project.hasReview),
    [companyProjects]
  );

  const stats = useMemo(
    () => ({
      totalReviews: statistics?.totalReviews ?? 0,
      averageRating: statistics?.averageRating ?? 0,
      pendingReviews: statistics?.pendingReviews ?? pendingProjects.length,
    }),
    [statistics, pendingProjects.length]
  );

  const handleReviewFormChange = (values: Partial<ReviewFormState>) => {
    setReviewForm((prev) => {
      const next = { ...prev, ...values };
      return {
        ...next,
        rating: computeCustomerOverallRating(next),
      };
    });
  };

  const handleReviewDialogOpenChange = (open: boolean) => {
    setIsReviewDialogOpen(open);
    if (!open) {
      setEditingReview(null);
      setReviewForm({
        ...initialReviewForm,
        rating: computeCustomerOverallRating(initialReviewForm),
      });
    }
  };

  const handleReplyDialogOpenChange = (open: boolean) => {
    setReplyDialogOpen(open);
    if (!open) {
      setReplyingReview(null);
      setReplyContent("");
    }
  };

  const handleOpenCreateReview = (projectId?: string) => {
    setActiveTab("given");
    setEditingReview(null);
    const targetProjectId =
      projectId ?? availableProjectsForReview[0]?.id ?? "";

    if (!targetProjectId) {
      toast({
        title: "No projects available",
        description: "All completed and disputed projects already have reviews.",
      });
      return;
    }

    const resetForm: ReviewFormState = {
      ...initialReviewForm,
      projectId: targetProjectId,
    };
    setReviewForm({
      ...resetForm,
      rating: computeCustomerOverallRating(resetForm),
    });
    setIsReviewDialogOpen(true);
  };

  const handleOpenEditReview = (review: Review) => {
    setActiveTab("given");
    setEditingReview(review);
    const fallbackCategoryValue =
      review.rating && review.rating > 0
        ? Math.max(1, Math.min(5, Math.round(review.rating)))
        : 0;
    const nextForm: ReviewFormState = {
      projectId: review.projectId,
      rating: 0,
      content: review.content || "",
      communicationRating: review.communicationRating ?? fallbackCategoryValue,
      qualityRating: review.qualityRating ?? fallbackCategoryValue,
      timelinessRating: review.timelinessRating ?? fallbackCategoryValue,
      professionalismRating:
        review.professionalismRating ?? fallbackCategoryValue,
    };
    setReviewForm({
      ...nextForm,
      rating: computeCustomerOverallRating(nextForm),
    });
    setIsReviewDialogOpen(true);
  };

  const handleDeleteReview = async (reviewId: string) => {
    const confirmed = window.confirm(
      "Delete this review? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteReview(reviewId);
      toast({
        title: "Review deleted",
        description: "The review has been removed successfully.",
      });
      refetchGivenReviews();
      refetchProjects();
    } catch (error: unknown) {
      toast({
        title: "Unable to delete review",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitReview = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (
      !hasAllCustomerCategoryRatings(reviewForm) ||
      !reviewForm.content.trim()
    ) {
      toast({
        title: "Missing details",
        description: "Please rate every category and share your feedback.",
        variant: "destructive",
      });
      return;
    }

    const overallRating = computeCustomerOverallRating(reviewForm);
    if (overallRating === 0) {
      toast({
        title: "Incomplete categories",
        description: "Please rate all categories to calculate your rating.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingReview) {
        await updateReview(editingReview.id, {
          content: reviewForm.content.trim(),
          rating: overallRating,
          communicationRating: reviewForm.communicationRating,
          qualityRating: reviewForm.qualityRating,
          timelinessRating: reviewForm.timelinessRating,
          professionalismRating: reviewForm.professionalismRating,
        });

        toast({
          title: "Review updated",
          description: "Your review has been updated successfully.",
        });
      } else {
        const selectedProject = companyProjects.find(
          (project) => project.id === reviewForm.projectId
        );

        if (!selectedProject || !selectedProject.provider?.id) {
          throw new Error(
            "We could not match the selected project with a provider."
          );
        }

        await createReview({
          projectId: selectedProject.id,
          recipientId: selectedProject.provider.id,
          content: reviewForm.content.trim(),
          rating: overallRating,
          communicationRating: reviewForm.communicationRating,
          qualityRating: reviewForm.qualityRating,
          timelinessRating: reviewForm.timelinessRating,
          professionalismRating: reviewForm.professionalismRating,
        });

        toast({
          title: "Review submitted",
          description: "Thank you for sharing feedback with this provider.",
        });
      }

      handleReviewDialogOpenChange(false);
      refetchGivenReviews();
      refetchProjects();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unable to save your review.";
      toast({
        title: message.includes("already exists")
          ? "Review already submitted"
          : "Something went wrong",
        description: message.includes("already exists")
          ? "This project already has a review. Please edit the existing review instead."
          : message,
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
        title: "Reply required",
        description: "Enter your response before submitting.",
        variant: "destructive",
      });
      return;
    }

    try {
      await createReply(replyingReview.id, replyContent.trim());
      toast({
        title: "Reply posted",
        description: "Your response has been shared with the provider.",
      });
      handleReplyDialogOpenChange(false);
      refetchReceivedReviews();
    } catch (error: unknown) {
      toast({
        title: "Unable to post reply",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-4 sm:px-6 lg:px-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Company Reviews
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
              Track the reviews you have written, feedback from providers, and
              any outstanding reviews for completed or disputed projects.
            </p>
          </div>
          <Button
            onClick={() => handleOpenCreateReview()}
            disabled={
              projectsLoading || availableProjectsForReview.length === 0
            }
            className="w-full sm:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Write Review
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <StatsCard
            title="Total Reviews"
            value={
              statsLoading
                ? "…"
                : stats.totalReviews.toString().padStart(1, "0")
            }
            icon={<MessageSquare className="h-8 w-8 text-blue-600" />}
            helper="Combined reviews given and received"
          />
          <StatsCard
            title="Average Rating"
            value={statsLoading ? "…" : stats.averageRating.toFixed(1) ?? "0.0"}
            icon={<Star className="h-8 w-8 text-yellow-500" />}
            helper="From reviews received by providers"
          />
          <StatsCard
            title="Pending Reviews"
            value={
              statsLoading
                ? "…"
                : stats.pendingReviews.toString().padStart(1, "0")
            }
            icon={<Calendar className="h-8 w-8 text-orange-500" />}
            helper="Providers awaiting feedback"
          />
        </div>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center">
              <div className="flex flex-1 items-center gap-2">
                <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <Input
                  placeholder="Search by provider or project"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={selectedRating} onValueChange={setSelectedRating}>
                  <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All ratings</SelectItem>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating} stars
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48 text-sm sm:text-base">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest first</SelectItem>
                    <SelectItem value="oldest">Oldest first</SelectItem>
                    <SelectItem value="highest">Highest rating</SelectItem>
                    <SelectItem value="lowest">Lowest rating</SelectItem>
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
        >
          <TabsList className="w-full sm:w-auto flex flex-col sm:flex-row h-auto sm:h-10 bg-gray-100 p-2 sm:p-3 rounded-lg">
            <TabsTrigger value="given" className="text-xs sm:text-sm w-full sm:w-auto data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md">
              Reviews Given
            </TabsTrigger>
            <TabsTrigger value="received" className="text-xs sm:text-sm w-full sm:w-auto data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md">
              Reviews Received
            </TabsTrigger>
            <TabsTrigger value="pending" className="text-xs sm:text-sm w-full sm:w-auto data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-md">
              Pending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="given" className="pt-6">
            <ReviewList
              reviews={givenReviews}
              loading={givenLoading}
              error={givenError}
              type="given"
              emptyMessage="You haven't reviewed any providers yet."
              onEdit={handleOpenEditReview}
              onDelete={(review) => handleDeleteReview(review.id)}
            />
          </TabsContent>

          <TabsContent value="received" className="pt-6">
            <ReviewList
              reviews={receivedReviews}
              loading={receivedLoading}
              error={receivedError}
              type="received"
              emptyMessage="No providers have reviewed your company yet."
              onReply={handleOpenReply}
            />
          </TabsContent>

          <TabsContent value="pending" className="pt-6">
            <PendingProjectsList
              projects={pendingProjects}
              loading={projectsLoading}
              onWriteReview={(projectId) => handleOpenCreateReview(projectId)}
            />
          </TabsContent>
        </Tabs>

        <ReviewDialog
          open={isReviewDialogOpen}
          onOpenChange={handleReviewDialogOpenChange}
          formState={reviewForm}
          onChange={handleReviewFormChange}
          onSubmit={handleSubmitReview}
          projects={
            editingReview ? companyProjects : availableProjectsForReview
          }
          isSubmitting={actionLoading}
          mode={editingReview ? "edit" : "create"}
        />

        <ReplyDialog
          open={replyDialogOpen}
          onOpenChange={handleReplyDialogOpenChange}
          review={replyingReview}
          replyContent={replyContent}
          onReplyContentChange={setReplyContent}
          onSubmit={handleSubmitReply}
          isSubmitting={actionLoading}
        />
      </div>
    </CustomerLayout>
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
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{helper}</p>
        </div>
        <div className="rounded-full bg-gray-100 p-3 flex-shrink-0 ml-2">{icon}</div>
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
  onEdit,
  onDelete,
  onReply,
}: ReviewListProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Loading reviews...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-destructive">
          {error || "Unable to load reviews."}
        </CardContent>
      </Card>
    );
  }

  if (!reviews.length) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-10 w-10 text-muted-foreground" />}
        title="No reviews"
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
  onReply,
}: {
  review: Review;
  type: "given" | "received";
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  onReply?: (review: Review) => void;
}) {
  const counterparty = type === "given" ? review.recipient : review.reviewer;
  const projectTitle = review.project?.title ?? "Project";
  const reply = review.ReviewReply?.[0];

  // Get profile image URL from customerProfile or providerProfile
  const profileImageUrl = getProfileImageUrl(
    (counterparty as { customerProfile?: { profileImageUrl?: string } })?.customerProfile?.profileImageUrl ||
    (counterparty as { providerProfile?: { profileImageUrl?: string } })?.providerProfile?.profileImageUrl ||
    undefined
  );

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
                {counterparty?.name ?? "Unknown"}
              </h3>
              <p className="text-sm text-gray-600 mb-1 truncate">{projectTitle}</p>
              <p className="text-xs text-gray-500">
                {new Date(review.createdAt).toLocaleDateString("en-US", {
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
                ? "You reviewed this provider"
                : "Provider review"}
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
          {review.communicationRating ? (
            <CategoryScore
              label="Communication"
              value={review.communicationRating}
            />
          ) : null}
          {review.qualityRating ? (
            <CategoryScore label="Quality" value={review.qualityRating} />
          ) : null}
          {review.timelinessRating ? (
            <CategoryScore label="Timeliness" value={review.timelinessRating} />
          ) : null}
          {review.professionalismRating ? (
            <CategoryScore
              label="Professionalism"
              value={review.professionalismRating}
            />
          ) : null}
        </div>

        {/* Reply section */}
        {reply && (
          <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 sm:p-4 mt-4">
            <p className="text-sm font-semibold text-gray-900 mb-1">Your reply</p>
            <p className="text-xs text-gray-500 mb-2">
              {new Date(reply.createdAt).toLocaleDateString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
              })}
            </p>
            <p className="text-sm text-gray-700 leading-relaxed">{reply.content}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-4 pt-4 border-t border-gray-200">
          <Badge 
            variant="secondary" 
            className="text-xs bg-gray-100 text-gray-700"
          >
            {type === "given" ? "Published" : "Received"}
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
                {reply ? "Replied" : "Reply"}
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
  onWriteReview,
}: {
  projects: CompanyProject[];
  loading: boolean;
  onWriteReview: (projectId: string) => void;
}) {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-muted-foreground">
          Loading pending projects...
        </CardContent>
      </Card>
    );
  }

  if (!projects.length) {
    return (
      <EmptyState
        icon={<Clock className="h-10 w-10 text-muted-foreground" />}
        title="You're all caught up"
        description="Every completed and disputed project has been reviewed."
      />
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {projects.map((project) => (
        <Card key={project.id} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="flex flex-col gap-4 p-4 sm:p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{project.title}</h3>
                {project.status === "DISPUTED" && (
                  <Badge variant="destructive" className="text-xs">
                    Disputed
                  </Badge>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-1">
                {project.provider?.name ?? "Provider"}
              </p>
              <p className="text-xs text-gray-500">
                {project.completedDate
                  ? new Date(project.completedDate).toLocaleDateString("en-US", {
                      month: "2-digit",
                      day: "2-digit",
                      year: "numeric",
                    })
                  : "Completion date unavailable"}
              </p>
            </div>
            <Button 
              onClick={() => onWriteReview(project.id)}
              className="w-full sm:w-auto text-xs sm:text-sm"
            >
              <Plus className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              Write Review
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
  formState: ReviewFormState;
  onChange: (values: Partial<ReviewFormState>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  projects: CompanyProject[];
  isSubmitting: boolean;
  mode: "create" | "edit";
}) {
  const hasAllRatings = hasAllCustomerCategoryRatings(formState);
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
            {mode === "edit" ? "Edit review" : "Write a review"}
          </DialogTitle>
          <DialogDescription>
            Share transparent feedback with service providers.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label>Project</Label>
            <Select
              value={formState.projectId}
              onValueChange={(value) => onChange({ projectId: value })}
              disabled={mode === "edit" || !hasProjects}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select completed or disputed project" />
              </SelectTrigger>
              <SelectContent>
                {hasProjects ? (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title} — {project.provider?.name ?? "Provider"}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    No projects available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {!hasProjects && mode === "create" && (
              <p className="mt-2 text-xs text-muted-foreground">
                All completed and disputed projects already have reviews.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <RatingInput
              label="Communication"
              value={formState.communicationRating}
              onChange={(value) => onChange({ communicationRating: value })}
            />
            <RatingInput
              label="Quality"
              value={formState.qualityRating}
              onChange={(value) => onChange({ qualityRating: value })}
            />
            <RatingInput
              label="Timeliness"
              value={formState.timelinessRating}
              onChange={(value) => onChange({ timelinessRating: value })}
            />
            <RatingInput
              label="Professionalism"
              value={formState.professionalismRating}
              onChange={(value) => onChange({ professionalismRating: value })}
            />
          </div>

          <div>
            <Label>Overall rating (computed)</Label>
            <div className="mt-2 flex items-center gap-2">
              <RatingStars rating={formState.rating} />
              <span className="text-xs text-muted-foreground">
                {formState.rating
                  ? `${formState.rating.toFixed(1)}/5`
                  : "Rate every category to calculate"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Automatically averaged from Communication, Quality, Timeliness,
              and Professionalism ratings.
            </p>
          </div>

          <div>
            <Label>Feedback</Label>
            <Textarea
              rows={4}
              placeholder="Describe your experience working with this provider."
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
              Cancel
            </Button>
            <Button type="submit" disabled={disableSubmit}>
              {isSubmitting ? "Saving..." : mode === "edit" ? "Save" : "Submit"}
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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reply to review</DialogTitle>
          <DialogDescription>
            Respond publicly to the provider&apos;s feedback.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded border p-3 text-sm text-muted-foreground">
            {review?.content}
          </div>
          <Textarea
            rows={4}
            placeholder="Write your reply..."
            value={replyContent}
            onChange={(event) => onReplyContentChange(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={isSubmitting || !replyContent}>
            {isSubmitting ? "Posting..." : "Post reply"}
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
  optional = false,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  optional?: boolean;
}) {
  return (
    <div>
      <Label className="flex items-center justify-between">
        {label}
        {optional && (
          <span className="text-xs text-muted-foreground">Optional</span>
        )}
      </Label>
      <div className="mt-2 flex items-center gap-2">
        <RatingStars rating={value} interactive onSelect={onChange} />
        <span className="text-xs text-muted-foreground">
          {value ? `${value}/5` : "Not rated"}
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
        const isHalfFilled = value === Math.ceil(rating) && rating % 1 !== 0 && value > rating;
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
      <span className="text-sm sm:text-base font-semibold text-gray-900">{value.toFixed(1)}</span>
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
