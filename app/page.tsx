import { Metadata } from "next";
import Header from "@/components/Homepage/Header";
import Hero from "@/components/Homepage/Hero";
import Brand from "@/components/Homepage/Brand";
import { Features } from "@/components/Homepage/Features";
import Services from "@/components/Homepage/Services/Services";
import Milestone from "@/components/Homepage/Milestone";
import Footer from "@/components/Homepage/Footer";
import { WorldMapDemo } from "@/components/Homepage/WorldMap";
import ParallaxGallery from "@/components/Homepage/ParallaxGallery";
import TourSchedule from "@/components/Homepage/TourSchedule";
import VideoPlayer from "@/components/Homepage/VideoPlayer";
import { fetchHomepageData } from "@/lib/homepage-api";

export const metadata: Metadata = {
  title: "Techconnex",
  description: "Techconnex is an AI freelancing platform connecting talented freelancers with businesses worldwide. Find projects, collaborate, and grow your career.",
  keywords: ['freelancing', 'Techconnex', 'remote work', 'hire freelancers', 'projects', 'jobs', 'gig economy'],
  authors: [{ name: 'Techconnex', url: 'https://www.techconnex.vip' }],
  creator: 'Techconnex',
  publisher: 'Techconnex',
  themeColor: '#1E40AF',
  openGraph: {
    title: 'Techconnex - Freelancing Platform',
    description: 'Techconnex is an AI freelancing platform connecting talented freelancers with businesses worldwide.',
    url: 'https://www.techconnex.vip',
    siteName: 'Techconnex',
    images: [
      { url: '/og-image.png', width: 1200, height: 630, alt: 'Techconnex Freelancing Platform' },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Techconnex - Freelancing Platform',
    description: 'Techconnex is an AI freelancing platform connecting talented freelancers with businesses worldwide.',
    site: '@Techconnex',
    creator: '@Techconnex',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: { index: true, follow: true },
  },
};

/**
 * Simple structure: no loading.tsx (was painting skeleton first and hurting LCP),
 * no client wrapper (was forcing one big bundle). Lenis removed from critical path.
 * Smooth scroll for anchor links via CSS in globals.
 * Homepage hooks: fetch public data (jobs, freelancers, companies) server-side for unauthenticated visitors.
 */
export default async function LandingPage() {
  const homepageData = await fetchHomepageData();

  return (
    <div className="relative isolate">
      <Header />
      <main className="overflow-x-hidden">
        <Hero />
        <VideoPlayer />
        <Brand />
        <Features />
        <Services />
        <Milestone />
        <ParallaxGallery latestJobs={homepageData?.latestJobs ?? undefined} />
        <TourSchedule
          topFreelancers={homepageData?.topFreelancers ?? undefined}
          topCompanies={homepageData?.topCompanies ?? undefined}
        />
        <WorldMapDemo />
        <Footer />
      </main>
    </div>
  );
}
