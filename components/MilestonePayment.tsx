"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface MilestonePaymentProps {
  milestone: {
    id: string;
    title: string;
    amount: number;
    projectId: string;
  };
  onSuccess?: () => void;
  type: string;
}
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function CheckoutForm({ milestone, type }: MilestonePaymentProps) {
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
      // Confirm payment with Stripe
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/${type}/payments/success?milestoneId=${milestone.id}`,
        },
      });

      if (error) {
        setErrorMessage(error.message || "Payment failed");
        setIsProcessing(false);
      }
    } catch {
      setErrorMessage("An unexpected error occurred");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {errorMessage}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing
          ? "Processing..."
          : `Pay MYR ${milestone.amount.toFixed(2)}`}
      </button>
    </form>
  );
}

export default function MilestonePayment({
  milestone,
  type,
}: MilestonePaymentProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
        }),
      });

      const data = await response.json();

      if (data.success) {
        setClientSecret(data.data.clientSecret);
      } else {
        alert(data.message || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Payment initiation error:", error);
      alert("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Pay for Milestone</h3>
        <p className="text-gray-600 mb-4">{milestone.title}</p>
        <p className="text-2xl font-bold mb-6">
          MYR {milestone.amount.toFixed(2)}
        </p>
        <button
          onClick={initiatePayment}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Continue to Payment"}
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
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Complete Payment</h3>
      <p className="text-gray-600 mb-2">{milestone.title}</p>
      <p className="text-2xl font-bold mb-6">
        MYR {milestone.amount.toFixed(2)}
      </p>

      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm milestone={milestone} type={type} />
      </Elements>
    </div>
  );
}
