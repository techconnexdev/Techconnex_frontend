"use client"
import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { talentPoolConfig } from './config';

gsap.registerPlugin(ScrollTrigger);

const TourSchedule = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeVenue, setActiveVenue] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      onEnter: () => setIsVisible(true),
    });

    scrollTriggerRef.current = st;

    return () => {
      st.kill();
    };
  }, []);

  useEffect(() => {
    if (!isVisible || !contentRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current?.querySelectorAll('.tour-item') || [],
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [isVisible]);

  // Null check: if config is empty, do not render (after all hooks)
  if (talentPoolConfig.categories.length === 0 && !talentPoolConfig.sectionTitle) {
    return null;
  }

  return (
    <section
      id="talent"
      ref={sectionRef}
      className="relative w-full min-h-screen bg-gradient-to-b from-blue-50/50 via-white to-blue-50/60 py-20 overflow-hidden"
    >

      {/* Content container */}
      <div ref={contentRef} className="relative max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="mb-16">
          <p className="font-mono-custom text-xs text-[#185df9]/80 uppercase tracking-wider mb-2">
            {talentPoolConfig.sectionLabel}
          </p>
          <h2 className="font-display text-5xl md:text-7xl text-gray-900">
            {talentPoolConfig.sectionTitle}
          </h2>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left: Category preview */}
          {talentPoolConfig.categories.length > 0 && (
            <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-4">
              <div className="sticky top-32 w-full">
                <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white/80 border border-blue-200/50 shadow-xl">
                  <img
                    src={talentPoolConfig.categories[activeVenue]?.image}
                    alt={talentPoolConfig.categories[activeVenue]?.name}
                    className="w-full h-full object-cover transition-opacity duration-500"
                  />

                  {/* Category title overlay on image */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
                    <p className="font-display text-2xl font-medium text-white">
                      {talentPoolConfig.categories[activeVenue]?.name}
                    </p>
                  </div>
                </div>

                {/* AI Insight — updates when hover changes category */}
                {talentPoolConfig.categories[activeVenue]?.aiInsight && (
                  <div className="mt-4  bg-white/80 backdrop-blur-sm border border-blue-200/40 p-4 shadow-md shadow-blue-900/5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#185df9]/10">
                        <Sparkles className="h-3.5 w-3.5 text-[#185df9]" aria-hidden />
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-[#185df9]">
                        AI Insight
                      </span>
                    </div>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={activeVenue}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm text-gray-700 leading-relaxed"
                      >
                        {talentPoolConfig.categories[activeVenue]?.aiInsight}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Right: Category list */}
          <div className="space-y-4">
            {talentPoolConfig.categories.map((category, index) => {
              return (
                <div
                  key={category.id}
                  className="tour-item group relative p-6 rounded-xl bg-white/90 backdrop-blur-sm border border-blue-200/50 hover:bg-white hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setActiveVenue(index)}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Category info */}
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-display text-lg text-black">
                          {category.name}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        {category.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-1 bg-[#185df9]/10 text-[#185df9] rounded text-xs font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        <span className="px-2 py-1 bg-slate-200/80 text-slate-600 rounded text-xs font-medium border border-slate-300/50">
                          + more
                        </span>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="flex-shrink-0">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-black/80 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>{talentPoolConfig.hireButtonText}</span>
                      </Link>
                    </div>
                  </div>

                  {/* Hover indicator */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-[#185df9] rounded-full group-hover:h-12 transition-all duration-300" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 text-center">
          <p className="font-mono-custom text-sm text-gray-600 mb-4">
            {talentPoolConfig.bottomNote}
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-4 bg-[#185df9] text-white font-display text-sm uppercase tracking-wider rounded-full hover:bg-[#1450d4] transition-colors shadow-lg"
          >
            {talentPoolConfig.bottomCtaText}
          </Link>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200/50 to-transparent" />
    </section>
  );
};

export default TourSchedule;
