"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useI18n } from "@/contexts/I18nProvider";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

interface MilestonePaymentProps {
  milestone: {
    id: string;
    title: string;
    amount: number;
    projectId: string;
    /** Project budget currency (milestone amounts are in this currency). */
    currency?: string;
  };
  onSuccess?: () => void;
  type: string;
}
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// Must match backend: 5% platform fee charged to customer
const CUSTOMER_FEE_PERCENTAGE = 0.05;

function CheckoutForm({
  milestone,
  type,
  totalAmount,
  payCurrency,
}: MilestonePaymentProps & { totalAmount: number; payCurrency: string }) {
  const { t } = useI18n();
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Confirm payment with Stripe (redirect for 3DS / FPX; otherwise completes in-page)
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/${type}/payments/success?milestoneId=${milestone.id}`,
        },
        redirect: "if_required",
      });

      if (error) {
        setErrorMessage(
          error.message || t("customer.projects.detail.milestonePayment.errorFailed"),
        );
        setIsProcessing(false);
        return;
      }

      // No redirect required — same success page + poll until webhook marks ESCROWED
      if (paymentIntent?.id) {
        window.location.assign(
          `${window.location.origin}/${type}/payments/success?payment_intent=${encodeURIComponent(
            paymentIntent.id,
          )}&redirect_status=succeeded`,
        );
        return;
      }

      setIsProcessing(false);
    } catch {
      setErrorMessage(t("customer.projects.detail.milestonePayment.errorUnexpected"));
      setIsProcessing(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 sm:space-y-4 flex flex-col h-full"
    >
      <div className="flex-1 min-h-0 overflow-y-auto -mr-1 sm:mr-0 pr-1 sm:pr-0">
        <PaymentElement />
      </div>

      <div className="flex-shrink-0 space-y-3 sm:space-y-4">
        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2 sm:py-3 rounded text-sm sm:text-base">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
        >
          {isProcessing
            ? t("customer.projects.detail.milestonePayment.processing")
            : t("customer.projects.detail.milestonePayment.payAmount", {
                currency: payCurrency,
                amount: totalAmount.toFixed(2),
              })}
        </button>
      </div>
    </form>
  );
}

export default function MilestonePayment({
  milestone,
  type,
}: MilestonePaymentProps) {
  const { t } = useI18n();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [resolvedCurrency, setResolvedCurrency] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const payCurrency = (
    resolvedCurrency ||
    milestone.currency ||
    "MYR"
  ).toUpperCase();

  const initiatePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/payments/initiate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          projectId: milestone.projectId,
          milestoneId: milestone.id,
          amount: milestone.amount,
          currency: payCurrency,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClientSecret(data.data.clientSecret);
        setTotalAmount(data.data.amount ?? null);
        if (typeof data.data?.currency === "string") {
          setResolvedCurrency(data.data.currency);
        }
      } else {
        alert(
          typeof data.message === "string" && data.message.trim()
            ? data.message
            : t("customer.projects.detail.milestonePayment.alertInitFailed"),
        );
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert(t("customer.projects.detail.milestonePayment.alertInitFailed"));
    } finally {
      setLoading(false);
    }
  };

  const displayTotal =
    totalAmount ?? milestone.amount * (1 + CUSTOMER_FEE_PERCENTAGE);

  if (!clientSecret) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow max-w-full">
        <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">
          {t("customer.projects.detail.milestonePayment.titlePrepare")}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 break-words">
          {milestone.title}
        </p>
        <div className="mb-4 sm:mb-6 space-y-1">
          <p className="text-sm text-gray-600">
            {t("customer.projects.detail.milestonePayment.breakdown", {
              currency: payCurrency,
              amount: milestone.amount.toFixed(2),
            })}
          </p>
          <p className="text-xl sm:text-2xl font-bold">
            {t("customer.projects.detail.milestonePayment.total", {
              currency: payCurrency,
              amount: displayTotal.toFixed(2),
            })}
          </p>
        </div>
        <button
          onClick={initiatePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm sm:text-base font-medium"
        >
          {loading
            ? t("customer.projects.detail.milestonePayment.loading")
            : t("customer.projects.detail.milestonePayment.continue")}
        </button>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: "stripe" as const,
    },
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow max-w-full max-h-[90vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
      <div className="flex-shrink-0 mb-3 sm:mb-4">
        <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">
          {t("customer.projects.detail.milestonePayment.titleComplete")}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 mb-2 break-words">
          {milestone.title}
        </p>
        <p className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          {t("customer.projects.detail.milestonePayment.total", {
            currency: payCurrency,
            amount: displayTotal.toFixed(2),
          })}
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm
            milestone={milestone}
            type={type}
            totalAmount={displayTotal}
            payCurrency={payCurrency}
          />
        </Elements>
      </div>
    </div>
  );
}
