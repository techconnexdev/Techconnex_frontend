import { Suspense } from "react";
import type { Metadata } from "next";
import BetaBanner from "@/components/BetaBanner";
import Footer from "@/components/Homepage/Footer";
import Header from "@/components/Homepage/Header";
import TalentDirectorySection from "@/components/Homepage/TalentDirectorySection";
import { fetchHomepageData } from "@/lib/homepage-api";

export const metadata: Metadata = {
  title: "Talent directory | Techconnex",
  description:
    "Browse featured freelancers and hiring companies on Techconnex. Sign up to connect, message, and run milestone-based projects.",
  openGraph: {
    title: "Talent directory | Techconnex",
    description:
      "Featured freelancers and companies recruiting on Techconnex—all in one directory.",
    url: "https://www.techconnex.vip/talent",
    siteName: "Techconnex",
    type: "website",
  },
};

function TalentFallback() {
  return (
    <section className="min-h-[60vh] w-full px-6 pt-28 pb-24 md:px-12">
      <div className="mx-auto max-w-7xl animate-pulse space-y-8">
        <div className="h-4 w-48 rounded-full bg-slate-200" />
        <div className="h-10 max-w-xl rounded-xl bg-slate-200" />
        <div className="h-12 rounded-2xl bg-slate-100 md:max-w-md" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-56 rounded-3xl bg-slate-100" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function TalentDirectoryPage() {
  const homepageData = await fetchHomepageData({ limit: 12 });

  return (
    <div className="relative isolate">
      <BetaBanner />
      <Header />
      <main className="overflow-x-hidden">
        <Suspense fallback={<TalentFallback />}>
          <TalentDirectorySection
            topFreelancers={homepageData?.topFreelancers ?? []}
            topCompanies={homepageData?.topCompanies ?? []}
          />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
