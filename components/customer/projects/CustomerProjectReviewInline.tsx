"use client";

import { useCallback, useEffect, useState } from "react";
import type React from "react";
import NextLink from "next/link";
import { Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  getCompletedProjectsForCompanyReview,
  createCompanyReview,
} from "@/lib/api";
import { useI18n } from "@/contexts/I18nProvider";
import { useToast } from "@/hooks/use-toast";
import { getUserFriendlyErrorMessage } from "@/lib/errors";

type CompletedListing = {
  id: string;
  hasReview?: boolean;
  provider?: { id?: string };
};

type ReviewFormState = {
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
    (value) => value > 0,
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

const initialForm: ReviewFormState = {
  rating: 0,
  content: "",
  communicationRating: 0,
  qualityRating: 0,
  timelinessRating: 0,
  professionalismRating: 0,
};

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
          value === Math.ceil(rating) &&
          rating % 1 !== 0 &&
          value > rating;
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
            ? t("customer.reviews.rating.valueOutOfFive", { n: String(value) })
            : t("customer.reviews.rating.notRated")}
        </span>
      </div>
    </div>
  );
}

export function CustomerProjectReviewInline({
  projectId,
  providerId,
  providerName,
  projectCompleted,
}: {
  projectId: string | undefined;
  providerId: string | undefined;
  providerName: string | undefined;
  projectCompleted: boolean;
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [hasReview, setHasReview] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ReviewFormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);

  const loadReviewFlag = useCallback(async () => {
    if (!projectId || !projectCompleted) {
      setLoadingStatus(false);
      return;
    }
    setLoadingStatus(true);
    try {
      const data = await getCompletedProjectsForCompanyReview();
      const list = (data.projects || []) as CompletedListing[];
      const row = list.find((p) => p.id === projectId);
      setHasReview(Boolean(row?.hasReview));
    } catch {
      setHasReview(false);
    } finally {
      setLoadingStatus(false);
    }
  }, [projectId, projectCompleted]);

  useEffect(() => {
    void loadReviewFlag();
  }, [loadReviewFlag]);

  const updateForm = useCallback((partial: Partial<ReviewFormState>) => {
    setForm((prev) => {
      const next = { ...prev, ...partial };
      const overall = computeCustomerOverallRating(next);
      return { ...next, rating: overall };
    });
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !projectId ||
      !providerId ||
      !hasAllCustomerCategoryRatings(form) ||
      !form.content.trim()
    ) {
      toast({
        title: t("customer.reviews.toast.missingDetailsTitle"),
        description: t("customer.reviews.toast.missingDetailsDesc"),
        variant: "destructive",
      });
      return;
    }

    const overallRating = computeCustomerOverallRating(form);
    if (overallRating === 0) {
      toast({
        title: t("customer.reviews.toast.incompleteCategoriesTitle"),
        description: t("customer.reviews.toast.incompleteCategoriesDesc"),
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      await createCompanyReview({
        projectId,
        recipientId: providerId,
        content: form.content.trim(),
        rating: overallRating,
        communicationRating: form.communicationRating,
        qualityRating: form.qualityRating,
        timelinessRating: form.timelinessRating,
        professionalismRating: form.professionalismRating,
      });
      toast({
        title: t("customer.reviews.toast.submittedTitle"),
        description: t("customer.reviews.toast.submittedDesc"),
      });
      setDialogOpen(false);
      setForm(initialForm);
      setHasReview(true);
    } catch (error: unknown) {
      const rawMessage =
        error instanceof Error
          ? error.message
          : t("customer.reviews.error.saveFailed");
      const isAlreadyExists = rawMessage.toLowerCase().includes("already");
      toast({
        title: isAlreadyExists
          ? t("customer.reviews.toast.alreadyExistsTitle")
          : t("customer.reviews.toast.genericErrorTitle"),
        description: isAlreadyExists
          ? t("customer.reviews.toast.alreadyExistsDesc")
          : getUserFriendlyErrorMessage(error, "project inline review"),
        variant: "destructive",
      });
      if (isAlreadyExists) {
        setHasReview(true);
        setDialogOpen(false);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!projectCompleted || !projectId || !providerId) {
    return null;
  }

  if (loadingStatus) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("customer.projects.detail.reviewPrompt.loading")}
        </CardContent>
      </Card>
    );
  }

  if (hasReview) {
    return (
      <Card className="border-green-200 bg-green-50/50">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-400" />
            {t("customer.projects.detail.reviewPrompt.submittedTitle")}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t("customer.projects.detail.reviewPrompt.submittedDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <Button variant="outline" size="sm" asChild>
            <NextLink href="/customer/reviews">
              {t("customer.projects.detail.reviewPrompt.viewReviews")}
            </NextLink>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasAllRatings = hasAllCustomerCategoryRatings(form);
  const disableSubmit =
    !form.content.trim() || !hasAllRatings || submitting;

  return (
    <>
      <Card className="border-blue-200 bg-blue-50/40">
        <CardHeader className="p-4 sm:p-6 pb-2">
          <CardTitle className="text-base sm:text-lg">
            {t("customer.projects.detail.reviewPrompt.title")}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {t("customer.projects.detail.reviewPrompt.description", {
              name: providerName || t("customer.projects.detail.unknownProvider"),
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <Button type="button" onClick={() => setDialogOpen(true)} size="sm">
            <Star className="mr-2 h-4 w-4" />
            {t("customer.projects.detail.reviewPrompt.cta")}
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setForm(initialForm);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t("customer.projects.detail.reviewDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {t("customer.reviews.dialog.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <RatingInput
                label={t("customer.reviews.category.communication")}
                value={form.communicationRating}
                onChange={(value) => updateForm({ communicationRating: value })}
              />
              <RatingInput
                label={t("customer.reviews.category.quality")}
                value={form.qualityRating}
                onChange={(value) => updateForm({ qualityRating: value })}
              />
              <RatingInput
                label={t("customer.reviews.category.timeliness")}
                value={form.timelinessRating}
                onChange={(value) => updateForm({ timelinessRating: value })}
              />
              <RatingInput
                label={t("customer.reviews.category.professionalism")}
                value={form.professionalismRating}
                onChange={(value) =>
                  updateForm({ professionalismRating: value })
                }
              />
            </div>

            <div>
              <Label>{t("customer.reviews.dialog.overallLabel")}</Label>
              <div className="mt-2 flex items-center gap-2">
                <RatingStars rating={form.rating} />
                <span className="text-xs text-muted-foreground">
                  {form.rating
                    ? t("customer.reviews.dialog.overallScore", {
                        score: form.rating.toFixed(1),
                      })
                    : t("customer.reviews.dialog.rateAllCategories")}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t("customer.reviews.dialog.overallComputedHint")}
              </p>
            </div>

            <div>
              <Label>{t("customer.reviews.dialog.feedback")}</Label>
              <Textarea
                rows={4}
                placeholder={t("customer.reviews.dialog.feedbackPlaceholder")}
                value={form.content}
                onChange={(event) => updateForm({ content: event.target.value })}
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                type="button"
                onClick={() => setDialogOpen(false)}
              >
                {t("customer.reviews.dialog.cancel")}
              </Button>
              <Button type="submit" disabled={disableSubmit}>
                {submitting
                  ? t("customer.reviews.dialog.saving")
                  : t("customer.reviews.dialog.submit")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
