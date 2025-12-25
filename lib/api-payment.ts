const token = typeof window !== "undefined" ? localStorage.getItem("token") : undefined;

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

interface CreatePaymentParams {
  projectId: string;
  milestoneId: string;
  amount: number;
  currency?: string;
}

export async function createPaymentIntentAPI({
  projectId,
  milestoneId,
  amount,
  currency = "MYR",
}: CreatePaymentParams) {
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/payments/create-intent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ projectId, milestoneId, amount, currency }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to create payment intent");
  return data as { success: boolean; clientSecret: string; paymentId: string };
}

interface FinalizePaymentParams {
  paymentId: string;
  success: boolean;
}

export async function finalizePaymentAPI({ paymentId, success }: FinalizePaymentParams) {
  if (!token) throw new Error("Not authenticated");

  const res = await fetch(`${API_BASE}/payments/finalize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ paymentId, success }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to finalize payment");
  return data as { success: boolean };
}
