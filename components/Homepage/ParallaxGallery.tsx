"use client";
import { useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Ticket, ArrowRight, Briefcase, DollarSign } from "lucide-react";
import { parallaxGalleryConfig } from "./config";
import type { HomepageJob } from "@/lib/homepage-api";

gsap.registerPlugin(ScrollTrigger);

interface ParallaxGalleryProps {
  /** Real latest jobs from API; when set, horizontal gallery shows these instead of config images */
  latestJobs?: HomepageJob[];
}

const ParallaxGallery = ({ latestJobs }: ParallaxGalleryProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const parallaxContainerRef = useRef<HTMLDivElement>(null);
  const topRowRef = useRef<HTMLDivElement>(null);
  const bottomRowRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const galleryTrackRef = useRef<HTMLDivElement>(null);
  const scrollTriggerRefs = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Parallax strips animation
      if (topRowRef.current && bottomRowRef.current) {
        const st1 = ScrollTrigger.create({
          trigger: parallaxContainerRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1,
          onUpdate: (self) => {
            const progress = self.progress;
            if (topRowRef.current) {
              gsap.set(topRowRef.current, {
                x: -progress * 300,
              });
            }
            if (bottomRowRef.current) {
              gsap.set(bottomRowRef.current, {
                x: progress * 300 - 150,
              });
            }
          },
        });
        scrollTriggerRefs.current.push(st1);
      }

      // Horizontal gallery scroll
      if (galleryRef.current && galleryTrackRef.current) {
        const trackWidth = galleryTrackRef.current.scrollWidth;
        const viewportWidth = window.innerWidth;

        const st2 = ScrollTrigger.create({
          trigger: galleryRef.current,
          start: "top top",
          end: () => `+=${trackWidth - viewportWidth}`,
          pin: true,
          scrub: 1,
          onUpdate: (self) => {
            if (galleryTrackRef.current) {
              const x = -self.progress * (trackWidth - viewportWidth);
              gsap.set(galleryTrackRef.current, { x });
            }
          },
        });
        scrollTriggerRefs.current.push(st2);
      }
    }, sectionRef);

    return () => {
      ctx.revert();
      scrollTriggerRefs.current.forEach((st) => st.kill());
      scrollTriggerRefs.current = [];
    };
  }, []);

  const hasGalleryItems =
    (latestJobs?.length ?? 0) > 0 ||
    parallaxGalleryConfig.galleryImages.length > 0;
  if (
    parallaxGalleryConfig.parallaxImagesTop.length === 0 &&
    !hasGalleryItems &&
    !parallaxGalleryConfig.sectionTitle
  ) {
    return null;
  }

  const scrollToTalent = () => {
    const talentSection = document.getElementById("talent");
    if (talentSection) {
      talentSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="relative w-full bg-gradient-to-b from-slate-50/80 via-white to-blue-50/50"
    >
      {/* Parallax Strips Section */}
      <div
        ref={parallaxContainerRef}
        className="relative py-20 overflow-hidden"
      >
        {/* Section header */}
        <div className="px-12 mb-12">
          <p className="font-mono-custom text-xs text-[#185df9]/70 uppercase tracking-wider mb-2">
            {parallaxGalleryConfig.sectionLabel}
          </p>
          <h2 className="text-4xl font-semibold !leading-tight mb-4 md:text-5xl md:mb-5 lg:text-6xl text-gray-900 tracking-tight">
            {parallaxGalleryConfig.sectionTitle}
          </h2>
        </div>

        {/* Top row - moves left */}
        <div ref={topRowRef} className="flex gap-4 mb-4 will-change-transform">
          {parallaxGalleryConfig.parallaxImagesTop.map((image) => (
            <div
              key={image.id}
              className="relative flex-shrink-0 w-[400px] h-[250px] overflow-hidden rounded-lg image-hover-scale border border-blue-200/40 shadow-lg"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={400}
                height={250}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          ))}
        </div>

        {/* Bottom row - moves right */}
        <div
          ref={bottomRowRef}
          className="flex gap-4 will-change-transform"
          style={{ transform: "translateX(-150px)" }}
        >
          {parallaxGalleryConfig.parallaxImagesBottom.map((image) => (
            <div
              key={image.id}
              className="relative flex-shrink-0 w-[400px] h-[250px] overflow-hidden rounded-lg image-hover-scale border border-blue-200/40 shadow-lg"
            >
              <Image
                src={image.src}
                alt={image.alt}
                width={400}
                height={250}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          ))}
        </div>
      </div>

      {/* Marquee Section */}
      <div className="relative py-8 bg-blue-50/60 overflow-hidden border-y border-blue-200/30">
        <div className="animate-marquee flex whitespace-nowrap">
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="flex items-center gap-8 mx-8 text-2xl font-display text-gray-500/70"
            >
              {parallaxGalleryConfig.marqueeTexts.map((text, j) => (
                <span key={j}>{text}</span>
              ))}
              <Ticket className="w-6 h-6" />
              <ArrowRight className="w-6 h-6" />
            </span>
          ))}
        </div>
      </div>

      {/* Horizontal Gallery Section */}
      <div ref={galleryRef} className="relative h-screen overflow-hidden">
        {/* Gallery header */}
        <div className="absolute top-12 left-12">
          <p className="font-mono-custom text-xs text-[#185df9]/70 uppercase tracking-wider mb-2">
            {parallaxGalleryConfig.galleryLabel}
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-gray-900">
            {parallaxGalleryConfig.galleryTitle}
          </h2>
        </div>

        {/* Horizontal scrolling track */}
        <div
          ref={galleryTrackRef}
          className="flex items-center gap-8 h-full px-12 pt-24 will-change-transform"
        >
          {latestJobs && latestJobs.length > 0 ? (
            <>
              {latestJobs.map((job, index) => (
                <div
                  key={job.id}
                  className="relative flex-shrink-0 group"
                  style={{ marginTop: index % 2 === 0 ? "0" : "60px" }}
                >
                  <div className="relative w-[450px] min-h-[300px] overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-blue-200/30 shadow-xl flex flex-col">
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <p className="font-mono-custom text-xs text-[#185df9] mb-2 uppercase tracking-wider">
                          {job.category}
                        </p>
                        <h3 className="font-display text-2xl text-white drop-shadow-md mb-3 line-clamp-2">
                          {job.title}
                        </h3>
                        <div className="flex items-center gap-2 text-white/90 text-sm mb-3">
                          <DollarSign className="w-4 h-4 flex-shrink-0" />
                          <span>
                            ${job.budgetMin.toLocaleString()} – $
                            {job.budgetMax.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(job.skills ?? []).slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="px-2 py-0.5 bg-[#185df9]/20 text-blue-200 rounded text-xs"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Link
                        href="/auth/register?role=customer"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#185df9] hover:text-blue-300 transition-colors"
                      >
                        <Briefcase className="w-4 h-4" />
                        Sign up to apply
                      </Link>
                    </div>
                    <div className="absolute inset-0 bg-[#185df9]/0 group-hover:bg-[#185df9]/10 transition-colors duration-300 pointer-events-none" />
                  </div>
                  <div className="absolute -top-8 -left-4 font-mono-custom text-7xl text-blue-700/50 font-bold">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </>
          ) : (
            parallaxGalleryConfig.galleryImages.map((image, index) => (
              <div
                key={image.id}
                className="relative flex-shrink-0 group cursor-pointer"
                style={{ marginTop: index % 2 === 0 ? "0" : "60px" }}
              >
                <div className="relative w-[450px] h-[300px] overflow-hidden rounded-xl">
                  <Image
                    src={image.src}
                    alt={image.title}
                    width={450}
                    height={300}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                  <div className="absolute bottom-6 left-6">
                    <p className="font-mono-custom text-xs text-[#185df9] mb-1">
                      {image.date}
                    </p>
                    <h3 className="font-display text-2xl text-white drop-shadow-md">
                      {image.title}
                    </h3>
                  </div>

                  <div className="absolute inset-0 bg-[#185df9]/0 group-hover:bg-[#185df9]/10 transition-colors duration-300" />
                </div>

                <div className="absolute -top-8 -left-4 font-mono-custom text-7xl text-blue-700/50 font-bold">
                  {String(index + 1).padStart(2, "0")}
                </div>
              </div>
            ))
          )}

          {/* End CTA */}
          <div className="flex-shrink-0 flex flex-col items-center justify-center w-[300px] h-[300px]">
            <button
              onClick={scrollToTalent}
              className="group flex flex-col items-center gap-4 text-gray-700 hover:text-[#185df9] transition-colors"
            >
              <div className="w-20 h-20 rounded-full border border-blue-200/60 group-hover:border-[#185df9] flex items-center justify-center transition-colors bg-white/80">
                <ArrowRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
              </div>
              <span className="font-display text-lg uppercase tracking-wider">
                {parallaxGalleryConfig.endCtaText}
              </span>
            </button>
          </div>
        </div>

        {/* Scroll progress indicator */}
        <div className="absolute bottom-12 left-12 right-12 h-px bg-blue-200/50">
          <div className="h-full bg-[#185df9]/60 w-0" id="gallery-progress" />
        </div>
      </div>
    </section>
  );
};

export default ParallaxGallery;
