"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  CheckCircle2,
  Building2,
  User,
  CreditCard,
  MessageSquare,
  Loader2,
  AlertCircle,
  ExternalLink,
  FolderOpen,
  Upload,
  FileText,
  X,
} from "lucide-react";
import { getAdminPaymentById, confirmAdminBankTransfer, getProfileImageUrl } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Image from "next/image";

type PaymentDetail = {
  id: string;
  amount: number;
  currency: string;
  platformFeeAmount: number;
  providerAmount: number;
  method: string;
  status: string;
  createdAt: string;
  escrowedAt?: string;
  releasedAt?: string;
  bankTransferStatus?: string;
  bankTransferRef?: string;
  metadata?: Record<string, unknown>;
  project: {
    id: string;
    title: string;
    description: string;
    customer: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      customerProfile?: {
        profileImageUrl?: string;
        industry?: string;
        location?: string;
        companySize?: string;
        website?: string;
      };
      settings?: {
        showEmail: boolean;
        showPhone: boolean;
        allowMessages: boolean;
      };
    };
    provider: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      providerProfile?: {
        profileImageUrl?: string;
        major?: string;
        location?: string;
        hourlyRate?: number;
        website?: string;
        payoutMethods?: Array<{
          id: string;
          type: string;
          label?: string;
          bankName?: string;
          accountNumber?: string;
          accountHolder?: string;
          accountEmail?: string;
          walletId?: string;
        }>;
      };
      settings?: {
        showEmail: boolean;
        showPhone: boolean;
        allowMessages: boolean;
      };
    };
  };
  milestone: {
    id: string;
    title: string;
    description: string;
    amount: number;
    status: string;
    dueDate?: string;
  };
  Invoice?: {
    id: string;
    invoiceNumber: string;
    totalAmount: number;
  };
};

export default function PaymentDetailClient({
  paymentId,
}: {
  paymentId: string;
}) {
  const router = useRouter();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [transferRef, setTransferRef] = useState("");
  const [transferProofFile, setTransferProofFile] = useState<File | null>(null);
  const [transferProofPreview, setTransferProofPreview] = useState<
    string | null
  >(null);
  const [confirming, setConfirming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchPayment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getAdminPaymentById(paymentId);
      if (response.success) {
        setPayment(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch payment:", error);
    } finally {
      setLoading(false);
    }
  }, [paymentId]);

  useEffect(() => {
    fetchPayment();
  }, [fetchPayment]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "application/pdf",
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/gif",
      ];
      const validExtensions = [
        ".pdf",
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
        ".gif",
      ];
      const fileExt = "." + file.name.split(".").pop()?.toLowerCase();

      if (
        !validTypes.includes(file.type) &&
        !validExtensions.includes(fileExt)
      ) {
        alert(
          "Invalid file type. Only PDF and image files (JPG, PNG, WEBP, GIF) are allowed."
        );
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert("File size exceeds 10MB limit.");
        return;
      }

      setTransferProofFile(file);

      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setTransferProofPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setTransferProofPreview(null);
      }
    }
  };

  const handleRemoveFile = () => {
    setTransferProofFile(null);
    setTransferProofPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmTransfer = async () => {
    // Check if payout methods exist
    if (
      !payment?.project?.provider?.providerProfile?.payoutMethods ||
      payment.project.provider.providerProfile.payoutMethods.length === 0
    ) {
      alert(
        "Cannot proceed: Provider has no payout method configured. Please contact the provider to add their payment details."
      );
      return;
    }

    if (!transferRef.trim() && !transferProofFile) {
      alert("Please enter a transfer reference or upload a proof document");
      return;
    }

    try {
      setConfirming(true);
      const response = await confirmAdminBankTransfer(
        paymentId,
        transferRef.trim() || "",
        transferProofFile
      );
      if (response.success) {
        alert("Bank transfer confirmed successfully");
        setShowConfirmDialog(false);
        setTransferRef("");
        setTransferProofFile(null);
        setTransferProofPreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        fetchPayment(); // Refresh payment data
      }
    } catch (error: unknown) {
      console.error("Failed to confirm transfer:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to confirm bank transfer";
      alert(errorMessage);
    } finally {
      setConfirming(false);
    }
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowConfirmDialog(false);
      setTransferRef("");
      setTransferProofFile(null);
      setTransferProofPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      setShowConfirmDialog(true);
    }
  };

  const isReadyToTransfer =
    payment?.status === "ESCROWED" && payment?.milestone?.status === "APPROVED";

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Loading payment details...</span>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Payment Not Found
        </h2>
        <p className="text-gray-600 mb-4">
          The payment you&apos;re looking for doesn&apos;t exist.
        </p>
        <Button onClick={() => router.push("/admin/payments")}>
          Back to Payments
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/admin/payments")}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Payment Details
            </h1>
            <p className="text-gray-600">
              Transaction ID: {payment.id.slice(0, 8)}
            </p>
          </div>
        </div>
        {isReadyToTransfer && (
          <Button
            onClick={() => setShowConfirmDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Confirm Bank Transfer
          </Button>
        )}
      </div>

      {/* Ready to Transfer Alert */}
      {isReadyToTransfer && (
        <>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-blue-900">
                    Ready for Bank Transfer
                  </p>
                  <p className="text-sm text-blue-700">
                    This payment is escrowed and the milestone is approved. You
                    can now process the bank transfer.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payout Method Info for Transfer */}
          {payment.project.provider.providerProfile?.payoutMethods &&
          payment.project.provider.providerProfile.payoutMethods.length > 0 ? (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-900">
                  <CreditCard className="w-5 h-5" />
                  Transfer To Provider Account
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {payment.project.provider.providerProfile.payoutMethods.map(
                    (method, index) => (
                      <div
                        key={method.id}
                        className="p-4 bg-white rounded-lg border-2 border-green-200"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-green-600 text-white">
                            {method.type}
                          </Badge>
                          {method.label && (
                            <p className="text-sm font-semibold text-gray-900">
                              {method.label}
                            </p>
                          )}
                        </div>
                        {method.bankName && (
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-gray-500">Bank Name</p>
                                <p className="font-semibold text-gray-900">
                                  {method.bankName}
                                </p>
                              </div>
                              {method.accountNumber && (
                                <div>
                                  <p className="text-gray-500">
                                    Account Number
                                  </p>
                                  <p className="font-semibold text-gray-900 font-mono">
                                    {method.accountNumber}
                                  </p>
                                </div>
                              )}
                              {method.accountHolder && (
                                <div>
                                  <p className="text-gray-500">
                                    Account Holder
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {method.accountHolder}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {method.accountEmail && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-sm">Email</p>
                            <p className="font-semibold text-gray-900">
                              {method.accountEmail}
                            </p>
                          </div>
                        )}
                        {method.walletId && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-sm">Wallet ID</p>
                            <p className="font-semibold text-gray-900 font-mono">
                              {method.walletId}
                            </p>
                          </div>
                        )}
                        {payment.project.provider.providerProfile
                          ?.payoutMethods &&
                          payment.project.provider.providerProfile.payoutMethods
                            .length > 1 &&
                          index === 0 && (
                            <p className="text-xs text-gray-500 mt-2 italic">
                              Note: Multiple payout methods available. Please
                              use the first/default method or contact provider
                              for preferred method.
                            </p>
                          )}
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900 mb-1">
                      No Payout Method Available
                    </p>
                    <p className="text-sm text-orange-700 mb-3">
                      The provider has not added any payout method. Please
                      contact them to provide their bank account or payment
                      details before processing the transfer.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const avatar = getProfileImageUrl(
                          payment.project.provider.providerProfile?.profileImageUrl
                        );
                        router.push(
                          `/admin/messages?userId=${
                            payment.project.provider.id
                          }&name=${encodeURIComponent(
                            payment.project.provider.name
                          )}&avatar=${encodeURIComponent(avatar)}&projectId=${
                            payment.project.id
                          }&paymentId=${payment.id}`
                        );
                      }}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Provider
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
              <CardDescription>Transaction details and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="text-2xl font-bold">
                    RM{payment.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge
                    className={
                      payment.status === "TRANSFERRED"
                        ? "bg-green-100 text-green-800"
                        : payment.status === "ESCROWED"
                        ? "bg-blue-100 text-blue-800"
                        : payment.status === "RELEASED"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {payment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Platform Fee</p>
                  <p className="text-lg font-semibold">
                    RM{payment.platformFeeAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Provider Amount</p>
                  <p className="text-lg font-semibold text-green-600">
                    RM{payment.providerAmount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="text-lg">{payment.method}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created At</p>
                  <p className="text-sm">{formatDate(payment.createdAt)}</p>
                </div>
                {payment.escrowedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Escrowed At</p>
                    <p className="text-sm">{formatDate(payment.escrowedAt)}</p>
                  </div>
                )}
                {payment.releasedAt && (
                  <div>
                    <p className="text-sm text-gray-500">Released At</p>
                    <p className="text-sm">{formatDate(payment.releasedAt)}</p>
                  </div>
                )}
                {payment.bankTransferRef && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">
                      Transfer Reference / Proof
                    </p>
                    {payment.bankTransferRef.startsWith("http://") ||
                    payment.bankTransferRef.startsWith("https://") ? (
                      <a
                        href={payment.bankTransferRef}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View File
                        </Button>
                      </a>
                    ) : (
                      <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded border">
                        {payment.bankTransferRef}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Project Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Project Information</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    router.push(`/admin/projects/${payment.project.id}`)
                  }
                >
                  <FolderOpen className="w-4 h-4 mr-2" />
                  View Project
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Project Title</p>
                <p className="text-lg font-semibold">{payment.project.title}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-sm">{payment.project.description}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-500">Milestone</p>
                <p className="text-lg font-semibold">
                  {payment.milestone.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {payment.milestone.description}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge
                    className={
                      payment.milestone.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }
                  >
                    {payment.milestone.status}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Amount: RM{payment.milestone.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messaging Section */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
              <CardDescription>
                Communicate with customer or provider about this payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendingMessage}
                  className="flex-1"
                >
                  {sendingMessage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Navigate to messages with project context
                    // Try to find a conversation with either customer or provider
                    const targetUserId =
                      payment.project.customer?.id ||
                      payment.project.provider?.id;
                    if (targetUserId) {
                      router.push(
                        `/admin/messages?userId=${targetUserId}&projectId=${payment.project.id}&paymentId=${payment.id}`
                      );
                    } else {
                      router.push(
                        `/admin/messages?projectId=${payment.project.id}&paymentId=${payment.id}`
                      );
                    }
                  }}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  View Messages
                </Button>
              </div>
            </CardContent>
          </Card> */}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Customer
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const avatar = getProfileImageUrl(
                        payment.project.customer.customerProfile?.profileImageUrl
                      );
                      router.push(
                        `/admin/messages?userId=${
                          payment.project.customer.id
                        }&name=${encodeURIComponent(
                          payment.project.customer.name
                        )}&avatar=${encodeURIComponent(avatar)}&projectId=${
                          payment.project.id
                        }&paymentId=${payment.id}`
                      );
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/users/${payment.project.customer.id}`)
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={getProfileImageUrl(payment.project.customer.customerProfile?.profileImageUrl)}
                  />
                  <AvatarFallback>
                    {payment.project.customer.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {payment.project.customer.name}
                  </p>
                  {payment.project.customer.customerProfile?.industry && (
                    <p className="text-sm text-gray-500">
                      {payment.project.customer.customerProfile.industry}
                    </p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                {payment.project.customer.settings?.showEmail && (
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">
                      {payment.project.customer.email}
                    </p>
                  </div>
                )}
                {payment.project.customer.settings?.showPhone &&
                  payment.project.customer.phone && (
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium">
                        {payment.project.customer.phone}
                      </p>
                    </div>
                  )}
                {payment.project.customer.customerProfile?.location && (
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">
                      {payment.project.customer.customerProfile.location}
                    </p>
                  </div>
                )}
                {payment.project.customer.customerProfile?.website && (
                  <div>
                    <p className="text-gray-500">Website</p>
                    <a
                      href={payment.project.customer.customerProfile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {payment.project.customer.customerProfile.website}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Provider Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Provider
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const avatar =
                        payment.project.provider.providerProfile
                          ?.profileImageUrl || "";
                      router.push(
                        `/admin/messages?userId=${
                          payment.project.provider.id
                        }&name=${encodeURIComponent(
                          payment.project.provider.name
                        )}&avatar=${encodeURIComponent(avatar)}&projectId=${
                          payment.project.id
                        }&paymentId=${payment.id}`
                      );
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/users/${payment.project.provider.id}`)
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Profile
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage
                    src={getProfileImageUrl(payment.project.provider.providerProfile?.profileImageUrl)}
                  />
                  <AvatarFallback>
                    {payment.project.provider.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">
                    {payment.project.provider.name}
                  </p>
                  {payment.project.provider.providerProfile?.major && (
                    <p className="text-sm text-gray-500">
                      {payment.project.provider.providerProfile.major}
                    </p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                {payment.project.provider.settings?.showEmail && (
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="font-medium">
                      {payment.project.provider.email}
                    </p>
                  </div>
                )}
                {payment.project.provider.settings?.showPhone &&
                  payment.project.provider.phone && (
                    <div>
                      <p className="text-gray-500">Phone</p>
                      <p className="font-medium">
                        {payment.project.provider.phone}
                      </p>
                    </div>
                  )}
                {payment.project.provider.providerProfile?.location && (
                  <div>
                    <p className="text-gray-500">Location</p>
                    <p className="font-medium">
                      {payment.project.provider.providerProfile.location}
                    </p>
                  </div>
                )}
                {typeof payment.project.provider.providerProfile?.hourlyRate ===
                  "number" && (
                  <div>
                    <p className="text-gray-500">Hourly Rate</p>
                    <p className="font-medium">
                      RM{payment.project.provider.providerProfile.hourlyRate}/hr
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payout Methods (Always show for reference) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payout Methods
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payment.project.provider.providerProfile?.payoutMethods &&
              payment.project.provider.providerProfile.payoutMethods.length >
                0 ? (
                <div className="space-y-3">
                  {payment.project.provider.providerProfile.payoutMethods.map(
                    (method) => (
                      <div key={method.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary">{method.type}</Badge>
                          {method.label && (
                            <p className="text-sm font-medium">
                              {method.label}
                            </p>
                          )}
                        </div>
                        {method.bankName && (
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-500">
                              Bank: {method.bankName}
                            </p>
                            {method.accountNumber && (
                              <p className="text-gray-500">
                                Account: ****{method.accountNumber.slice(-4)}
                              </p>
                            )}
                            {method.accountHolder && (
                              <p className="text-gray-500">
                                Holder: {method.accountHolder}
                              </p>
                            )}
                          </div>
                        )}
                        {method.accountEmail && (
                          <p className="text-sm text-gray-500">
                            Email: {method.accountEmail}
                          </p>
                        )}
                        {method.walletId && (
                          <p className="text-sm text-gray-500">
                            Wallet: {method.walletId}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 mb-3">
                    No payout methods configured
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const avatar =
                        payment.project.provider.providerProfile
                          ?.profileImageUrl || "";
                      router.push(
                        `/admin/messages?userId=${
                          payment.project.provider.id
                        }&name=${encodeURIComponent(
                          payment.project.provider.name
                        )}&avatar=${encodeURIComponent(avatar)}&projectId=${
                          payment.project.id
                        }&paymentId=${payment.id}`
                      );
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Contact Provider
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirm Transfer Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b flex-shrink-0">
            <DialogTitle className="text-xl">Confirm Bank Transfer</DialogTitle>
            <DialogDescription>
              Upload a proof document (PDF or image) or enter a transfer
              reference number to confirm this payment has been transferred.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4 px-6 overflow-y-auto flex-1">
            {/* Amount Info */}
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Amount to Transfer
                  </p>
                  <p className="text-2xl font-bold text-blue-900 mt-1">
                    RM {payment.providerAmount.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-700">Payment ID</p>
                  <p className="text-xs font-mono text-blue-900">
                    {payment.id.slice(0, 8)}...
                  </p>
                </div>
              </div>
            </div>

            {/* Payout Methods */}
            {payment.project.provider.providerProfile?.payoutMethods &&
            payment.project.provider.providerProfile.payoutMethods.length >
              0 ? (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Transfer To Provider Account
                </label>
                <div className="space-y-3">
                  {payment.project.provider.providerProfile.payoutMethods.map(
                    (method) => (
                      <div
                        key={method.id}
                        className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <Badge className="bg-green-600 text-white">
                            {method.type}
                          </Badge>
                          {method.label && (
                            <p className="text-sm font-semibold text-gray-900">
                              {method.label}
                            </p>
                          )}
                        </div>
                        {method.bankName && (
                          <div className="space-y-2 text-sm">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-gray-500">Bank Name</p>
                                <p className="font-semibold text-gray-900">
                                  {method.bankName}
                                </p>
                              </div>
                              {method.accountNumber && (
                                <div>
                                  <p className="text-gray-500">
                                    Account Number
                                  </p>
                                  <p className="font-semibold text-gray-900 font-mono">
                                    {method.accountNumber}
                                  </p>
                                </div>
                              )}
                              {method.accountHolder && (
                                <div className="col-span-2">
                                  <p className="text-gray-500">
                                    Account Holder
                                  </p>
                                  <p className="font-semibold text-gray-900">
                                    {method.accountHolder}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        {method.accountEmail && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-sm">Email</p>
                            <p className="font-semibold text-gray-900">
                              {method.accountEmail}
                            </p>
                          </div>
                        )}
                        {method.walletId && (
                          <div className="mt-2">
                            <p className="text-gray-500 text-sm">Wallet ID</p>
                            <p className="font-semibold text-gray-900 font-mono">
                              {method.walletId}
                            </p>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-orange-900 mb-1">
                      No Payout Method Available
                    </p>
                    <p className="text-sm text-orange-700 mb-3">
                      The provider has not added any payout method. Please
                      contact them before processing the transfer.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const avatar = getProfileImageUrl(
                          payment.project.provider.providerProfile?.profileImageUrl
                        );
                        router.push(
                          `/admin/messages?userId=${
                            payment.project.provider.id
                          }&name=${encodeURIComponent(
                            payment.project.provider.name
                          )}&avatar=${encodeURIComponent(avatar)}&projectId=${
                            payment.project.id
                          }&paymentId=${payment.id}`
                        );
                        setShowConfirmDialog(false);
                      }}
                      className="border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contact Provider
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Transfer Reference */}
            <div>
              <label
                htmlFor="transferRef"
                className="text-sm font-medium mb-2 block"
              >
                Transfer Reference (Optional if uploading proof)
              </label>
              <Input
                id="transferRef"
                value={transferRef}
                onChange={(e) => setTransferRef(e.target.value)}
                placeholder="e.g., TRF-2024-001234"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the bank transfer reference number if available
              </p>
            </div>

            {/* File Upload */}
            <div>
              <label
                htmlFor="transferProof"
                className="text-sm font-medium mb-2 block"
              >
                Upload Transfer Proof
              </label>
              <div className="space-y-3">
                {!transferProofFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      Click to upload proof document
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF or Image (JPG, PNG, WEBP, GIF) up to 10MB
                    </p>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {transferProofPreview ? (
                          <div className="w-16 h-16 rounded border overflow-hidden">
                            <Image
                              src={transferProofPreview}
                              alt="Preview"
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded border flex items-center justify-center bg-gray-50">
                            <FileText className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {transferProofFile.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(transferProofFile.size / 1024 / 1024).toFixed(2)}{" "}
                            MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveFile}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  id="transferProof"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,application/pdf,image/*"
                  onChange={handleFileSelect}
                />
                {transferProofFile && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Change File
                  </Button>
                )}
              </div>
            </div>

            {/* Info Note */}
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Note:</strong> Either provide a transfer reference or
                upload a proof document. The uploaded file will be saved as the
                transfer reference.
              </p>
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={confirming}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTransfer}
              disabled={
                (!transferRef.trim() && !transferProofFile) ||
                confirming ||
                !payment.project.provider.providerProfile?.payoutMethods ||
                payment.project.provider.providerProfile.payoutMethods
                  .length === 0
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {confirming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm Transfer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
