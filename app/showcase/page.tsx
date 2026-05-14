import { Suspense } from "react";
import type { Metadata } from "next";
import ShowcaseDirectory from "@/components/Homepage/ShowcaseDirectory";
import { fetchHomepageData } from "@/lib/homepage-api";

export const metadata: Metadata = {
  title: "Community showcase | Techconnex",
  description:
    "Browse featured projects, providers, and hiring companies from Techconnex — one scrollable directory tied to the homepage gallery.",
  openGraph: {
    title: "Community showcase | Techconnex",
    description:
      "Featured projects, talent, and companies in one place. Sign up to apply, hire, or explore the full network.",
    url: "https://www.techconnex.vip/showcase",
    siteName: "Techconnex",
    type: "website",
  },
};

function ShowcaseFallback() {
  return (
    <section className="min-h-[70vh] w-full px-6 pt-28 pb-24 md:px-12">
      <div className="mx-auto max-w-7xl animate-pulse space-y-8">
        <div className="h-4 w-40 rounded-full bg-slate-200" />
        <div className="h-12 max-w-lg rounded-xl bg-slate-200" />
        <div className="h-20 max-w-2xl rounded-xl bg-slate-100" />
        <div className="h-14 max-w-md rounded-2xl bg-slate-200" />
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((k) => (
            <div key={k} className="h-64 rounded-3xl bg-slate-100" />
          ))}
        </div>
      </div>
    </section>
  );
}

export default async function ShowcasePage() {
  const homepageData = await fetchHomepageData({ limit: 12 });

  return (
    <Suspense fallback={<ShowcaseFallback />}>
      <ShowcaseDirectory
        variant="showcase"
        latestJobs={homepageData?.latestJobs ?? []}
        topFreelancers={homepageData?.topFreelancers ?? []}
        topCompanies={homepageData?.topCompanies ?? []}
      />
    </Suspense>
  );
}
