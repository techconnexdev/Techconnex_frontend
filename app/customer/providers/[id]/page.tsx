// app/customer/providers/[id]/page.tsx
import { cookies } from "next/headers";
import ProviderDetailClient from "@/components/customer/providers/ProviderDetailClient";
import type { Provider, Review, PortfolioItem } from "@/components/customer/providers/types";
import { notFound } from "next/navigation";
import jwt from "jsonwebtoken";
import { getUserFriendlyErrorMessage } from "@/lib/errors";

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // ✅ Read token and user from cookies
  const cookieStore = cookies();
  const token = (await cookieStore).get("token")?.value;
  const userCookie = (await cookieStore).get("user")?.value;

  // Extract userId from user cookie first, then from token
  let userId: string | null = null;
  
  // Try to get userId from user cookie
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      userId = user?.id || null;
    } catch {
      // Ignore parsing errors
    }
  }

  // If not found in cookie, try to decode from token
  if (!userId && token) {
    try {
      const decoded = jwt.decode(token) as { userId?: string } | null;
      userId = decoded?.userId || null;
    } catch (error) {
      console.error("Error decoding token:", error);
    }
  }

  let provider: Provider | null = null;
  let portfolio: PortfolioItem[] = [];
  let reviews: Review[] = [];

  // Build URL with userId query parameter if available
  const url = new URL(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/providers/${id}`
  );
  if (userId) {
    url.searchParams.append("userId", userId);
  }

  try {
    const response = await fetch(url.toString(), {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        provider = data.provider;
        portfolio = data.portfolio || [];
        reviews = data.reviews || [];
      } else {
        console.error("Backend returned success=false", data);
      }
    } else {
      console.error("Response not ok:", response.status);
    }
  } catch (error) {
    getUserFriendlyErrorMessage(error, "customer providers detail fetch");
  }

  if (!provider) {
    notFound();
  }

  let viewerPreferredCurrency: string | undefined;
  if (userId && token) {
    try {
      const settingsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/settings/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        },
      );
      if (settingsRes.ok) {
        const settingsJson: { preferredCurrency?: string } =
          await settingsRes.json();
        const cur = settingsJson?.preferredCurrency;
        if (typeof cur === "string" && /^[A-Z]{3}$/i.test(cur.trim())) {
          viewerPreferredCurrency = cur.trim().toUpperCase();
        }
      }
    } catch {
      // Logged-out or settings unavailable — client shows provider currency only
    }
  }

  return (
    <ProviderDetailClient
      provider={provider}
      portfolio={portfolio}
      reviews={reviews}
      viewerPreferredCurrency={viewerPreferredCurrency}
    />
  );
}
