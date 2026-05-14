"use client";

import { useEffect, useState } from "react";
import BetaBanner from "@/components/BetaBanner";
import Header from "@/components/Homepage/Header";
import Hero from "@/components/Homepage/Hero";
import Brand from "@/components/Homepage/Brand";
import { Features } from "@/components/Homepage/Features";
import Services from "@/components/Homepage/Services/Services";
import Footer from "@/components/Homepage/Footer";
import { WorldMapDemo } from "@/components/Homepage/WorldMap";
import ParallaxGallery from "@/components/Homepage/ParallaxGallery";
import VideoPlayer from "@/components/Homepage/VideoPlayer";
import type { HomepageData } from "@/lib/homepage-api";
import SearchCta from "./cta";
import Bento from "./bento";
import Steps from "./Steps";

type Props = {
  homepageData: HomepageData | null;
};

/**
 * BetaBanner + Header stay mounted so layout doesn’t jump when the hero intro ends.
 * The hero fullscreen overlay sits above them until intro completes.
 *
 * Below-the-fold sections stay gated until `heroIntroDone`.
 */
export default function HomeShell({ homepageData }: Props) {
  const [heroIntroDone, setHeroIntroDone] = useState(false);
  const [pageAssetsReady, setPageAssetsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.readyState === "complete") {
      setPageAssetsReady(true);
      return;
    }

    const onLoad = () => setPageAssetsReady(true);
    window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !heroIntroDone) return;

    const scrollToHashTarget = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const sectionId = decodeURIComponent(hash.slice(1));
      if (!sectionId) return;

      const target = document.getElementById(sectionId);
      if (!target) return;

      const headerOffset = 88;
      const top =
        target.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    };

    // Run once after reveal (for direct /#showcase visits)
    const timerId = window.setTimeout(scrollToHashTarget, 60);
    // Keep hash navigation working while staying on homepage
    window.addEventListener("hashchange", scrollToHashTarget);

    return () => {
      window.clearTimeout(timerId);
      window.removeEventListener("hashchange", scrollToHashTarget);
    };
  }, [heroIntroDone]);

  return (
    <div className="relative isolate">
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[90]">
        <div className="pointer-events-auto">
          <BetaBanner />
          <Header />
        </div>
      </div>
      <main className="overflow-x-hidden">
        <Hero
          isReadyToComplete={pageAssetsReady}
          onIntroComplete={() => setHeroIntroDone(true)}
        />
        {heroIntroDone && (
          <div className="[&_.home-flow+_.home-flow]:mt-6 md:[&_.home-flow+_.home-flow]:mt-20">
            <div className="home-flow">
              <Brand />
            </div>
            <div className="home-flow">
              <VideoPlayer />
            </div>
            <div className="home-flow">
              <ParallaxGallery
                latestJobs={homepageData?.latestJobs ?? undefined}
                topFreelancers={homepageData?.topFreelancers ?? undefined}
                topCompanies={homepageData?.topCompanies ?? undefined}
              />
            </div>
            <div className="home-flow">
              <Steps />
            </div>
            <div className="home-flow">
              <Features />
            </div>
            <div className="home-flow">
              <Bento />
            </div>
            <div className="home-flow pt-16 md:pt-24">
              <SearchCta />
            </div>
            {/* <WorldMapDemo /> */}
            <div className="home-flow">
              <Footer />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
