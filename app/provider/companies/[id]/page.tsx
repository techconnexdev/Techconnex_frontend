// app/provider/companies/[id]/page.tsx
import { cookies } from "next/headers";
import { ProviderLayout } from "@/components/provider-layout";
import CompanyDetailClient from "@/components/provider/companies/CompanyDetailClient";
import type { Company, Review } from "@/components/provider/companies/types";
import { notFound } from "next/navigation";
import jwt from "jsonwebtoken";

export default async function CompanyDetailPage({
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

  let company: Company | null = null;
  let reviews: Review[] = [];

  // Build URL with userId query parameter if available
  const url = new URL(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/companies/${id}/full`
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
        company = data.company;
        reviews = data.reviews || [];
        
        // Note: Avatar URL transformation is handled by getProfileImageUrl in components
      } else {
        console.error("Backend returned success=false", data);
      }
    } else {
      console.error("Response not ok:", response.status);
    }
  } catch (error) {
    console.error("Failed to fetch company details:", error);
  }

  if (!company) {
    notFound();
  }

  return (
    <ProviderLayout>
      <CompanyDetailClient company={company} reviews={reviews} />
    </ProviderLayout>
  );
}

