import Link from "next/link";
import { cookies } from "next/headers";
import CompanyDetailClient from "@/components/provider/companies/CompanyDetailClient";
import type { Company, Review } from "@/components/provider/companies/types";
import { notFound } from "next/navigation";
import jwt from "jsonwebtoken";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ShowcaseCompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = cookies();
  const token = (await cookieStore).get("token")?.value;
  const userCookie = (await cookieStore).get("user")?.value;

  let userId: string | null = null;

  if (userCookie) {
    try {
      const user = JSON.parse(userCookie);
      userId = user?.id || null;
    } catch {
      /* ignore */
    }
  }

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
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  const companyUrl = new URL(`${apiBase}/companies/${id}`);
  if (userId) companyUrl.searchParams.append("userId", userId);

  try {
    const companyResponse = await fetch(companyUrl.toString(), {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      cache: "no-store",
    });

    if (companyResponse.ok) {
      const companyData = await companyResponse.json();
      if (companyData.success) {
        company = companyData.company;
      }
    }

    if (company) {
      try {
        const reviewsResponse = await fetch(`${apiBase}/companies/${id}/reviews?page=1&limit=5`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          cache: "no-store",
        });
        if (reviewsResponse.ok) {
          const reviewsData = await reviewsResponse.json();
          if (reviewsData.success) {
            reviews = reviewsData.reviews || [];
          }
        }
      } catch {
        // Keep page usable even if reviews request fails.
      }
    }
  } catch (error) {
    console.error("Failed to fetch company details:", error);
  }

  if (!company) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-8 md:pt-28">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2 gap-2 text-slate-600" asChild>
        <Link href="/showcase?tab=companies">
          <ArrowLeft className="h-4 w-4" />
          Showcase
        </Link>
      </Button>
      <CompanyDetailClient company={company} reviews={reviews} />
    </div>
  );
}
