// app/customer/providers/page.tsx
import { cookies } from "next/headers";
import FindProvidersClient from "@/components/customer/providers/FindProvidersClient";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import jwt from "jsonwebtoken";

export const revalidate = 900;

export default async function ProvidersPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const userCookie = cookieStore.get("user")?.value;

  let userId: string | null = null;
  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      userId = user?.id ?? null;
    } catch {
      /* ignore */
    }
  }
  if (!userId && token) {
    try {
      const decoded = jwt.decode(token) as { userId?: string } | null;
      userId = decoded?.userId ?? null;
    } catch {
      /* ignore */
    }
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
      /* logged out or settings unavailable */
    }
  }

  let ratings = [
    { value: "all", label: "All Ratings" },
    { value: "5.0+", label: "5.0 Stars" },
    { value: "4.8+", label: "4.8+ Stars" },
    { value: "4.5+", label: "4.5+ Stars" },
    { value: "4.0+", label: "4.0+ Stars" },
    { value: "3.5+", label: "3.5+ Stars" },
    { value: "3.0+", label: "3.0+ Stars" },
    { value: "2.5+", label: "2.5+ Stars" },
    { value: "2.0+", label: "2.0+ Stars" },
    { value: "1.5+", label: "1.5+ Stars" },
    { value: "1.0+", label: "1.0+ Stars" },
  ];

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/providers/filters`, {
      next: { revalidate: 900 },
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        ratings = data.ratings || ratings;
      }
    }
  } catch (error) {
    getUserFriendlyErrorMessage(error, "customer providers filters");
  }

  return (
    <FindProvidersClient
      ratings={ratings}
      viewerPreferredCurrency={viewerPreferredCurrency}
    />
  );
}
