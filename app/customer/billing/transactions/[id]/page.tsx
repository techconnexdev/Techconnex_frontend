"use client";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Receipt,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  DollarSign,
  User,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { CustomerLayout } from "@/components/customer-layout";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, API_BASE } from "@/lib/api";

type Transaction = {
  id: string;
  stripePaymentIntentId: string;
  status: string;
  createdAt: string;
  amount: number;
  platformFeeAmount: number;
  method: string;
  timeline?: Array<{ status: string; timestamp: string }>;
  project: {
    title: string;
    provider: {
      name: string;
      email: string;
      phone: string;
      providerProfile?: {
        location?: string;
      };
    };
    customer: {
      name: string;
      email: string;
      phone: string;
      customerProfile?: {
        location?: string;
      };
    };
  };
  milestone: {
    title: string;
  };
};

export default function TransactionDetailPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { id } = useParams();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const json = await apiFetch(`/company/billing/${id}`);
        setTransaction(json.data);
      } catch (e: unknown) {
        console.error(e);
        const errorMessage = e instanceof Error ? e.message : "Failed to load transaction";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [id, toast]);

  if (loading) return <div>Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;
  if (!transaction) return <div>No transaction found</div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "failed":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Helper to map timeline status codes to user-friendly messages
  const getTimelineMessage = (status: string) => {
    switch (status) {
      case "ESCROW":
        return "Escrowed: Money still not received by provider";
      case "TRANSFERRED":
        return "Transferred: Money already received by provider";
      case "PENDING":
        return "Payment initiated, not yet paid";
      case "IN_PROGRESS":
        return "Payment processing";
      case "RELEASED":
        return "Ready for payout to provider";
      case "REFUNDED":
        return "Refunded to customer";
      case "FAILED":
        return "Payment failed";
      default:
        return status;
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const res = await fetch(`${API_BASE}/company/billing/${id}/receipt`);
      if (!res.ok) throw new Error("Failed to download receipt");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt_${transaction.stripePaymentIntentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: unknown) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : "Failed to download receipt";
      toast({
        title: "Error downloading receipt",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Derive timeline events: use provided timeline or fallback to current status
  const timelineEvents =
    transaction.timeline && transaction.timeline.length > 0
      ? transaction.timeline
      : [{ status: transaction.status, timestamp: transaction.createdAt }];

  return (
    <CustomerLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Transaction Details
              </h1>
              <p className="text-gray-600">
                Transaction ID: {transaction.stripePaymentIntentId}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDownloadReceipt}>
              <Receipt className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
            {/* <Button variant="outline" onClick={handleDownloadInvoice}>
              <FileText className="w-4 h-4 mr-2" />
              Download Invoice
            </Button> */}
          </div>
        </div>

        {/* Status Card */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transaction Amount</p>
                  <p className="text-3xl font-bold text-gray-900">
                    RM{transaction.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(transaction.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <Badge
                  className={`${getStatusColor(
                    transaction.status
                  )} text-lg px-4 py-2`}
                >
                  {getStatusIcon(transaction.status)}
                  <span className="ml-2 capitalize">{transaction.status}</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Transaction Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Overview</CardTitle>
                <CardDescription>
                  Complete details of this transaction
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* <div>
                    <p className="text-sm text-gray-500">Transaction Type</p>
                    <p className="font-medium capitalize">{transaction.type}</p>
                  </div> */}
                  <div>
                    <p className="text-sm text-gray-500">Reference Number</p>
                    <p className="font-medium">{transaction.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Project</p>
                    <p className="font-medium">{transaction.project.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Milestone</p>
                    <p className="font-medium">{transaction.milestone.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <p className="font-medium">{transaction.method}</p>
                    </div>
                  </div>
                  {/* <div>
                    <p className="text-sm text-gray-500">Invoice Number</p>
                    <p className="font-medium">{transaction.id}</p>
                  </div> */}
                </div>
              </CardContent>
            </Card>

            {/* Payment Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Breakdown</CardTitle>
                <CardDescription>Detailed cost breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      RM
                      {(
                        transaction.amount - transaction.platformFeeAmount
                      ).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Processing Fee</span>
                    <span className="font-medium">
                      RM{transaction.platformFeeAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">
                      RM{(0).toLocaleString()}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between py-2">
                    <span className="text-lg font-semibold">Total Amount</span>
                    <span className="text-lg font-bold text-blue-600">
                      RM{transaction.amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Details */}
            <Card>
              <CardHeader>
                <CardTitle>Payment Method Details</CardTitle>
                <CardDescription>
                  Information about the payment method used
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <CreditCard className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium">{transaction.method}</p>
                    <p className="text-sm text-gray-500">Payment Method</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transaction Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Transaction Timeline</CardTitle>
                <CardDescription>
                  Step-by-step transaction progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {timelineEvents.map((event: { status: string; timestamp: string }, index: number) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            event.status === "completed"
                              ? "bg-green-100"
                              : event.status === "processing"
                              ? "bg-blue-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {event.status === "completed" ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Clock className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        {index < timelineEvents.length - 1 && (
                          <div className="w-0.5 h-12 bg-gray-200 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <p className="font-medium capitalize">
                          {getTimelineMessage(event.status)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Provider Information */}
            <Card>
              <CardHeader>
                <CardTitle>Provider Information</CardTitle>
                <CardDescription>
                  Details about the service provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {transaction.project.provider.name}
                    </p>
                    <p className="text-sm text-gray-500">Service Provider</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  {/* <div className="flex items-start gap-2">
                    <Building className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="text-sm font-medium">
                        {transaction.project.provider.providerProfile
                          ?.company ||
                          transaction.project.provider.providerProfile
                            ?.businessName ||
                          ""}
                      </p>
                    </div>
                  </div> */}
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm font-medium">
                        {transaction.project.provider.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm font-medium">
                        {transaction.project.provider.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-sm font-medium">
                        {transaction.project.provider.providerProfile
                          ?.location || ""}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
                <CardDescription>Your billing information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {transaction.project.customer.name}
                    </p>
                    <p className="text-sm text-gray-500">Customer</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-3">
                  {/* <div className="flex items-start gap-2">
                    <Building className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Company</p>
                      <p className="text-sm font-medium">
                        {transaction.project.customer.customerProfile
                          ?.industry || ""}
                      </p>
                    </div>
                  </div> */}
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-sm font-medium">
                        {transaction.project.customer.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Phone className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="text-sm font-medium">
                        {transaction.project.customer.phone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="text-sm font-medium">
                        {transaction.project.customer.customerProfile
                          ?.location || ""}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            {/* <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={handleDownloadReceipt}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Download Receipt
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={handleDownloadInvoice}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download Invoice
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export as PDF
                </Button>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
