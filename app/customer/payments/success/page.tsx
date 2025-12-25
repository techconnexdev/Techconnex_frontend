
// pages/payment/success.tsx
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const paymentIntent = searchParams.get("payment_intent");
    
    if (paymentIntent) {
      // Payment was successful (Stripe redirected here)
      setStatus("success");
    } else {
      setStatus("error");
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Processing payment...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">✕</div>
          <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
          <p className="text-gray-600 mb-6">Something went wrong with your payment.</p>
          <Link href="/customer/projects" className="text-blue-600 hover:underline">
            Return to Projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md">
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been received and is now held in escrow. 
          The provider will start working on your milestone.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>What happens next?</strong><br />
            Once the provider completes the milestone and you approve it, 
            the funds will be released to them.
          </p>
        </div>
        <Link
          href="/customer/projects"
          className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700"
        >
          View Project
        </Link>
      </div>
    </div>
  );
}