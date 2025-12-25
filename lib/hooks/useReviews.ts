import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getCompanyReviews,
  getProviderReviews,
  createCompanyReview,
  createProviderReview,
  updateCompanyReview,
  updateProviderReview,
  deleteCompanyReview,
  deleteProviderReview,
  getCompanyReviewStatistics,
  getProviderReviewStatistics,
  getCompletedProjectsForCompanyReview,
  getCompletedProjectsForProviderReview,
  createReviewReply,
} from "../api";

// Types
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  pages?: number;
}

export interface Review {
  id: string;
  projectId: string;
  reviewerId: string;
  recipientId: string;
  content: string;
  rating: number;
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  clarityRating?: number;
  paymentRating?: number;
  company?: string;
  role?: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
    customerProfile?: {
      companySize: string;
      industry: string;
    };
    providerProfile?: {
      rating: number;
      totalReviews: number;
      location: string;
    };
  };
  recipient: {
    id: string;
    name: string;
    email: string;
    customerProfile?: {
      companySize: string;
      industry: string;
    };
    providerProfile?: {
      rating: number;
      totalReviews: number;
      location: string;
    };
  };
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
  };
  ReviewReply?: Array<{
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export interface ReviewStatistics {
  totalReviews: number;
  averageRating: number;
  pendingReviews?: number;
  givenReviews?: number;
  ratingDistribution: Array<{
    rating: number;
    _count: {
      rating: number;
    };
  }>;
}

export interface CompletedProject {
  id: string;
  title: string;
  description: string;
  category: string;
  amount?: number;
  completedDate?: string;
  provider?: {
    id: string;
    name: string;
    email: string;
    providerProfile?: {
      rating: number;
      totalReviews: number;
      location: string;
    };
  };
  customer?: {
    id: string;
    name: string;
    email: string;
    customerProfile?: {
      companySize: string;
      industry: string;
    };
  };
  project: {
    id: string;
    title: string;
    description: string;
    category: string;
  };
}

// Company Review Hooks
export function useCompanyReviews(params?: {
  page?: number;
  limit?: number;
  rating?: number;
  search?: string;
  sortBy?: string;
  status?: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const paramsString = useMemo(() => JSON.stringify(params), [params]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCompanyReviews(params);
      setReviews(data.reviews || []);
      setPagination(data.pagination || null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to fetch reviews");
      setError(error.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    pagination,
    refetch: fetchReviews,
  };
}

export function useCompanyReviewStatistics() {
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCompanyReviewStatistics();
      setStatistics(data.statistics);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to fetch statistics");
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
}

export function useCompletedProjectsForReview() {
  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCompletedProjectsForCompanyReview();
      setProjects(data.projects || []);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to fetch completed projects");
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}

// Provider Review Hooks
export function useProviderReviews(params?: {
  page?: number;
  limit?: number;
  rating?: number;
  search?: string;
  sortBy?: string;
  status?: string;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const paramsString = useMemo(() => JSON.stringify(params), [params]);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProviderReviews(params);
      setReviews(data.reviews || []);
      setPagination(data.pagination || null);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to fetch reviews");
      setError(error.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsString]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    loading,
    error,
    pagination,
    refetch: fetchReviews,
  };
}

export function useProviderReviewStatistics() {
  const [statistics, setStatistics] = useState<ReviewStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProviderReviewStatistics();
      setStatistics(data.statistics);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to fetch statistics");
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  return {
    statistics,
    loading,
    error,
    refetch: fetchStatistics,
  };
}

export function useProviderCompletedProjectsForReview() {
  const [projects, setProjects] = useState<CompletedProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCompletedProjectsForProviderReview();
      setProjects(data.projects || []);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to fetch completed projects");
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
  };
}

// Review Actions Hook
export function useReviewActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createReview = useCallback(async (
    reviewData: {
      projectId: string;
      recipientId: string;
      content: string;
      rating: number;
      communicationRating?: number;
      qualityRating?: number;
      timelinessRating?: number;
      professionalismRating?: number;
      clarityRating?: number;
      paymentRating?: number;
      company?: string;
      role?: string;
    },
    isProvider: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    try {
      if (isProvider) {
        return await createProviderReview(reviewData);
      } else {
        return await createCompanyReview(reviewData);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to create review");
      setError(error.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createReply = useCallback(async (
    reviewId: string,
    content: string,
    isProvider: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    try {
      return await createReviewReply(reviewId, content, isProvider);
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to create reply");
      setError(error.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateReview = useCallback(async (
    reviewId: string,
    reviewData: {
      content?: string;
      rating?: number;
      communicationRating?: number;
      qualityRating?: number;
      timelinessRating?: number;
      professionalismRating?: number;
    },
    isProvider: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    try {
      if (isProvider) {
        return await updateProviderReview(reviewId, reviewData);
      } else {
        return await updateCompanyReview(reviewId, reviewData);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to update review");
      setError(error.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteReview = useCallback(async (
    reviewId: string,
    isProvider: boolean = false
  ) => {
    setLoading(true);
    setError(null);
    try {
      if (isProvider) {
        return await deleteProviderReview(reviewId);
      } else {
        return await deleteCompanyReview(reviewId);
      }
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error("Failed to delete review");
      setError(error.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createReview,
    updateReview,
    deleteReview,
    createReply,
    loading,
    error,
  };
}
