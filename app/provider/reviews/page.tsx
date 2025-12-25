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
} from "lucide-react";
import { ProviderLayout } from "@/components/provider-layout";
import { useToast } from "@/hooks/use-toast";
import {
  useProviderReviews,
  useProviderReviewStatistics,
  useProviderCompletedProjectsForReview,
  useReviewActions,
  type Review,
  type CompletedProject,
} from "../../../lib/hooks/useReviews";

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
    (value) => value > 0
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
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"given" | "received" | "pending">(
    "given"
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
    [searchTerm, selectedRating, sortBy]
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
    [completedProjects]
  );

  const stats = useMemo(
    () => ({
      totalReviews: statistics?.totalReviews ?? 0,
      averageRating: statistics?.averageRating ?? 0,
      pendingReviews:
        statistics?.pendingReviews ?? availableProjectsForReview.length,
    }),
    [statistics, availableProjectsForReview.length]
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
        title: "No companies available",
        description: "All completed projects already have reviews.",
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
    const confirmed = window.confirm(
      "Delete this review? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      await deleteReview(reviewId, true);
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
      !hasAllProviderCategoryRatings(reviewForm) ||
      !reviewForm.content.trim()
    ) {
      toast({
        title: "Missing details",
        description: "Please rate every category and share your feedback.",
        variant: "destructive",
      });
      return;
    }

    const overallRating = computeProviderOverallRating(reviewForm);
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
          true
        );

        toast({
          title: "Review updated",
          description: "Your review has been updated successfully.",
        });
      } else {
        const selectedProject = availableProjectsForReview.find(
          (project) => project.id === reviewForm.projectId
        );

        if (!selectedProject || !selectedProject.customer?.id) {
          throw new Error(
            "We could not match the selected project with a company."
          );
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
          true
        );

        toast({
          title: "Review submitted",
          description: "Thank you for sharing feedback with this company.",
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
      await createReply(replyingReview.id, replyContent.trim(), true);
      toast({
        title: "Reply posted",
        description: "Your response has been shared with the company.",
      });
      setReplyDialogOpen(false);
      setReplyContent("");
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
    <ProviderLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Reviews & Feedback
            </h1>
            <p className="text-muted-foreground">
              Manage the reviews you leave for clients and the feedback you
              receive.
            </p>
          </div>
          <Button
            onClick={() => handleOpenCreateReview()}
            disabled={
              projectsLoading || availableProjectsForReview.length === 0
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            Write Review
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
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
            helper="From reviews received by companies"
          />
          <StatsCard
            title="Pending Reviews"
            value={
              statsLoading
                ? "…"
                : stats.pendingReviews.toString().padStart(1, "0")
            }
            icon={<Calendar className="h-8 w-8 text-orange-500" />}
            helper="Clients awaiting your review"
          />
        </div>

        <Card>
          <CardContent className="flex flex-col gap-4 p-6 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search reviews by company or project"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Select value={selectedRating} onValueChange={setSelectedRating}>
                <SelectTrigger className="w-full sm:w-52">
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
                <SelectTrigger className="w-full sm:w-52">
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
          </CardContent>
        </Card>

        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "given" | "received" | "pending")
          }
        >
          <TabsList className="flex w-full flex-col sm:flex-row">
            <TabsTrigger value="given" className="flex-1">
              Reviews Given
            </TabsTrigger>
            <TabsTrigger value="received" className="flex-1">
              Reviews Received
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-1">
              Pending
            </TabsTrigger>
          </TabsList>

          <TabsContent value="given" className="pt-6">
            <ReviewList
              reviews={givenReviews}
              loading={givenLoading}
              error={givenError}
              type="given"
              emptyMessage="You haven't reviewed any companies yet."
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
              emptyMessage="No companies have reviewed you yet."
              onReply={handleOpenReply}
            />
          </TabsContent>

          <TabsContent value="pending" className="pt-6">
            <PendingProjectsList
              projects={availableProjectsForReview}
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
    </ProviderLayout>
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
      <CardContent className="flex items-center justify-between p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold text-foreground">{value}</p>
          <p className="text-xs text-muted-foreground">{helper}</p>
        </div>
        <div className="rounded-full bg-muted p-3">{icon}</div>
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
    <div className="space-y-4">
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

  const categories =
    type === "given"
      ? [
          { label: "Communication", value: review.communicationRating },
          { label: "Clarity", value: review.qualityRating },
          { label: "Payment", value: review.timelinessRating },
          { label: "Professionalism", value: review.professionalismRating },
        ]
      : [
          { label: "Quality", value: review.qualityRating },
          { label: "Timeliness", value: review.timelinessRating },
          { label: "Communication", value: review.communicationRating },
          { label: "Professionalism", value: review.professionalismRating },
        ];

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>
                {counterparty?.name?.charAt(0) ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground">
                {counterparty?.name ?? "Unknown"}
              </h3>
              <p className="text-sm text-muted-foreground">{projectTitle}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2">
              <RatingStars rating={review.rating || 0} />
              <span className="text-sm font-semibold text-foreground">
                {(review.rating || 0).toFixed(1)}
              </span>
            </div>
            <Badge variant="outline">
              {type === "given"
                ? "You reviewed this company"
                : "Company review"}
            </Badge>
          </div>
        </div>

        {review.content && (
          <p className="text-sm text-foreground">{review.content}</p>
        )}

        <div className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
          {categories.map(
            (category) =>
              category.value && (
                <CategoryScore
                  key={category.label}
                  label={category.label}
                  value={category.value}
                />
              )
          )}
        </div>

        {reply && (
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src="/placeholder.svg?height=24&width=24" />
                <AvatarFallback className="text-xs">
                  {review.recipient?.name?.charAt(0) ?? "You"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Your reply</span>
              <span className="text-xs text-muted-foreground">
                {new Date(reply.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-foreground">{reply.content}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between relative z-10">
          <Badge variant="secondary">
            {type === "given" ? "Published" : "Received"}
          </Badge>
          <div className="flex flex-wrap gap-2 relative z-10">
            {type === "given" && (
              <>
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit?.(review)}
                  className="relative z-50 pointer-events-auto"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete?.(review)}
                  className="relative z-50 pointer-events-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button> */}
              </>
            )}
            {type === "received" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReply?.(review)}
                disabled={Boolean(reply)}
                className="relative z-10"
              >
                <Reply className="mr-2 h-4 w-4" />
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
  projects: CompletedProject[];
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
        description="Every completed project has been reviewed."
      />
    );
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <Card key={project.id}>
          <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-foreground">
                {project.title || "Project"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {project.customer?.name ?? "Company"}
              </p>
              <p className="text-xs text-muted-foreground">
                {project.completedDate
                  ? new Date(project.completedDate).toLocaleDateString()
                  : "Completion date unavailable"}
              </p>
            </div>
            <Button onClick={() => onWriteReview(project.id)}>
              <Plus className="mr-2 h-4 w-4" />
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
  formState: ProviderReviewFormState;
  onChange: (values: Partial<ProviderReviewFormState>) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  projects: CompletedProject[];
  isSubmitting: boolean;
  mode: "create" | "edit";
}) {
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
            {mode === "edit" ? "Edit review" : "Write a review"}
          </DialogTitle>
          <DialogDescription>
            Share transparent feedback with your clients.
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
                <SelectValue placeholder="Select completed project" />
              </SelectTrigger>
              <SelectContent>
                {hasProjects ? (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title || "Project"} —{" "}
                      {project.customer?.name ?? "Company"}
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
                All completed projects already have reviews.
              </p>
            )}
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
              Automatically averaged from Communication, Clarity, Payment, and
              Professionalism ratings.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <RatingInput
              label="Communication"
              value={formState.communicationRating}
              onChange={(value) => onChange({ communicationRating: value })}
            />
            <RatingInput
              label="Clarity"
              value={formState.clarityRating}
              onChange={(value) => onChange({ clarityRating: value })}
            />
            <RatingInput
              label="Payment"
              value={formState.paymentRating}
              onChange={(value) => onChange({ paymentRating: value })}
            />
            <RatingInput
              label="Professionalism"
              value={formState.professionalismRating}
              onChange={(value) => onChange({ professionalismRating: value })}
            />
          </div>

          <div>
            <Label>Feedback</Label>
            <Textarea
              rows={4}
              placeholder="Describe your experience working with this company."
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
            Respond publicly to the company&apos;s feedback.
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
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <Label className="flex items-center justify-between">{label}</Label>
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
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`h-5 w-5 ${
            value <= rating ? "text-yellow-400" : "text-muted-foreground"
          } ${interactive ? "cursor-pointer" : ""}`}
          onClick={() => interactive && onSelect?.(value)}
        />
      ))}
    </div>
  );
}

function CategoryScore({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded border p-2">
      <span>{label}</span>
      <span className="font-medium text-foreground">{value.toFixed(1)}</span>
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
