"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AdminLayout } from "@/components/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Search,
  Trash2,
  Eye,
  MessageSquare,
  Building2,
  User,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  reviewer: {
    id: string;
    name: string;
    email: string;
    role?: string[];
  };
  recipient: {
    id: string;
    name: string;
    email: string;
    role?: string[];
  };
  project: {
    id: string;
    title: string;
  };
  communicationRating?: number;
  qualityRating?: number;
  timelinessRating?: number;
  professionalismRating?: number;
  ReviewReply?: Array<{
    id: string;
    content: string;
    createdAt: string;
  }>;
}

interface Stats {
  totalReviews: number;
  averageRating: number;
  companyReviews: number;
  providerReviews: number;
}

export default function AdminReviewsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"all" | "company" | "provider">(
    "all"
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalReviews: 0,
    averageRating: 0,
    companyReviews: 0,
    providerReviews: 0,
  });

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      // Build endpoint based on active tab
      let endpoint = "/admin/reviews";
      if (activeTab === "company") {
        endpoint = "/admin/reviews?type=company";
      } else if (activeTab === "provider") {
        endpoint = "/admin/reviews?type=provider";
      }

      // Fetch reviews
      const reviewsResponse = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Fetch statistics
      const statsResponse = await fetch(`${API_URL}/admin/reviews/statistics`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (reviewsResponse.ok && statsResponse.ok) {
        const reviewsData = await reviewsResponse.json();
        const statsData = await statsResponse.json();

        setReviews(reviewsData.reviews || []);
        setStats({
          totalReviews: statsData.stats.totalReviews || 0,
          averageRating: statsData.stats.averageRating || 0,
          companyReviews: statsData.stats.companyReviews || 0,
          providerReviews: statsData.stats.providerReviews || 0,
        });
      } else {
        throw new Error("Failed to fetch reviews");
      }
    } catch (error: unknown) {
      console.error("Error loading reviews:", error);
      toast({
        title: "Error loading reviews",
        description: error instanceof Error ? error.message : "Failed to load reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, toast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDeleteReview = async (reviewId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this review? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

      const response = await fetch(`${API_URL}/admin/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Review deleted",
          description: "The review has been permanently deleted.",
        });
        fetchReviews();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete review");
      }
    } catch (error: unknown) {
      console.error("Error deleting review:", error);
      toast({
        title: "Error deleting review",
        description: error instanceof Error ? error.message : "Failed to delete review",
        variant: "destructive",
      });
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const matchesSearch =
      review.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.reviewer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.project.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRating =
      ratingFilter === "all" ||
      Math.round(review.rating).toString() === ratingFilter;

    return matchesSearch && matchesRating;
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Reviews Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and monitor all reviews from companies and providers
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Reviews
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReviews}</div>
              <p className="text-xs text-gray-600 mt-1">All time reviews</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.averageRating.toFixed(1)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Platform average</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Company Reviews
              </CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.companyReviews}</div>
              <p className="text-xs text-gray-600 mt-1">By companies</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Provider Reviews
              </CardTitle>
              <User className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.providerReviews}</div>
              <p className="text-xs text-gray-600 mt-1">By providers</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Tabs */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>All Reviews</CardTitle>
                <CardDescription>
                  View and manage all platform reviews
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={ratingFilter} onValueChange={setRatingFilter}>
                  <SelectTrigger className="w-full sm:w-32">
                    <SelectValue placeholder="Rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Ratings</SelectItem>
                    <SelectItem value="5">5 Stars</SelectItem>
                    <SelectItem value="4">4 Stars</SelectItem>
                    <SelectItem value="3">3 Stars</SelectItem>
                    <SelectItem value="2">2 Stars</SelectItem>
                    <SelectItem value="1">1 Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            >
              <TabsList>
                <TabsTrigger value="all">All Reviews</TabsTrigger>
                <TabsTrigger value="company">Company Reviews</TabsTrigger>
                <TabsTrigger value="provider">Provider Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading reviews...</p>
                    </div>
                  </div>
                ) : filteredReviews.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No reviews found
                    </h3>
                    <p className="text-gray-600">
                      {searchTerm || ratingFilter !== "all"
                        ? "Try adjusting your filters"
                        : "No reviews have been submitted yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredReviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        onDelete={handleDeleteReview}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function ReviewCard({
  review,
  onDelete,
}: {
  review: Review;
  onDelete: (id: string) => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            <Avatar>
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>{review.reviewer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={`/admin/users/${review.reviewer.id}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {review.reviewer.name}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                  <p className="text-sm text-gray-600">
                    reviewed{" "}
                    <Link
                      href={`/admin/users/${review.recipient.id}`}
                      className="text-gray-900 hover:text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                    >
                      {review.recipient.name}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(review.rating)
                            ? "text-yellow-400 fill-current"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">
                    {review.rating.toFixed(1)}
                  </span>
                </div>
              </div>

              <p className="text-sm text-gray-700">{review.content}</p>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span className="inline-flex items-center gap-1">
                  Project:{" "}
                  <Link
                    href={`/admin/projects/${review.project.id}`}
                    className="text-gray-900 hover:text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    {review.project.title}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </span>
                <span>•</span>
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                {review.ReviewReply && review.ReviewReply.length > 0 && (
                  <>
                    <span>•</span>
                    <Badge variant="secondary" className="text-xs">
                      Has Reply
                    </Badge>
                  </>
                )}
              </div>

              {showDetails && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Detailed Ratings
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {review.communicationRating && (
                      <div>
                        <span className="text-gray-600">Communication:</span>{" "}
                        <span className="font-medium">
                          {review.communicationRating}/5
                        </span>
                      </div>
                    )}
                    {review.qualityRating && (
                      <div>
                        <span className="text-gray-600">Quality:</span>{" "}
                        <span className="font-medium">
                          {review.qualityRating}/5
                        </span>
                      </div>
                    )}
                    {review.timelinessRating && (
                      <div>
                        <span className="text-gray-600">Timeliness:</span>{" "}
                        <span className="font-medium">
                          {review.timelinessRating}/5
                        </span>
                      </div>
                    )}
                    {review.professionalismRating && (
                      <div>
                        <span className="text-gray-600">Professionalism:</span>{" "}
                        <span className="font-medium">
                          {review.professionalismRating}/5
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(review.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
