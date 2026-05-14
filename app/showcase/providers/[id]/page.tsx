import Link from "next/link";
import { cookies } from "next/headers";
import ProviderDetailClient from "@/components/customer/providers/ProviderDetailClient";
import type {
  Provider,
  Review,
  PortfolioItem,
} from "@/components/customer/providers/types";
import { notFound } from "next/navigation";
import jwt from "jsonwebtoken";
import { getUserFriendlyErrorMessage } from "@/lib/errors";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function ShowcaseProviderDetailPage({
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

  let provider: Provider | null = null;
  let portfolio: PortfolioItem[] = [];
  let reviews: Review[] = [];

  const url = new URL(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/providers/${id}`,
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
      }
    }
  } catch (error) {
    getUserFriendlyErrorMessage(error, "showcase provider detail fetch");
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
      /* optional */
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 md:px-8 md:pt-28">
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 -ml-2 gap-2 text-slate-600"
        asChild
      >
        <Link href="/showcase?tab=providers">
          <ArrowLeft className="h-4 w-4" />
          Showcase
        </Link>
      </Button>
      <ProviderDetailClient
        provider={provider}
        portfolio={portfolio}
        reviews={reviews}
        viewerPreferredCurrency={viewerPreferredCurrency}
        publicGuestMode={!token || !userId}
      />
    </div>
  );
}
