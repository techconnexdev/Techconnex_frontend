"use client"
import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExternalLink, Sparkles, Star, Building2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { talentPoolConfig } from './config';
import { getProfileImageUrl } from '@/lib/api';
import type { HomepageFreelancer, HomepageCompany } from '@/lib/homepage-api';

gsap.registerPlugin(ScrollTrigger);

interface TourScheduleProps {
  /** Real top freelancers from API; when set, shown as cards with registration CTA */
  topFreelancers?: HomepageFreelancer[];
  /** Real top companies from API; when set, shown as cards with registration CTA */
  topCompanies?: HomepageCompany[];
}

const TourSchedule = ({ topFreelancers, topCompanies }: TourScheduleProps) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeVenue, setActiveVenue] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const scrollTriggerRef = useRef<ScrollTrigger | null>(null);

  const hasPublicData = (topFreelancers?.length ?? 0) > 0 || (topCompanies?.length ?? 0) > 0;

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

  // Null check: need either config categories or public API data
  if (
    !talentPoolConfig.sectionTitle &&
    !hasPublicData &&
    talentPoolConfig.categories.length === 0
  ) {
    return null;
  }

  return (
    <section
      id="talent"
      ref={sectionRef}
      className="relative w-full min-h-screen py-20 overflow-hidden"
    >
      {/* Background: subtle gradient + soft grid */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 via-white to-indigo-50/50" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #185df9 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Content container */}
      <div ref={contentRef} className="relative max-w-7xl mx-auto px-6 md:px-12">
        {/* Section header */}
        <div className="mb-16 text-center md:text-left">
          <p className="font-mono-custom text-xs text-[#185df9] uppercase tracking-[0.2em] mb-3">
            {talentPoolConfig.sectionLabel}
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-gray-900 tracking-tight max-w-4xl">
            {talentPoolConfig.sectionTitle}
          </h2>
          <p className="mt-4 text-gray-600 max-w-xl">
            Join our community of vetted talent and forward-thinking companies.
          </p>
        </div>

        {hasPublicData ? (
          <>
            {/* Top Freelancers — real data with registration hook */}
            {topFreelancers && topFreelancers.length > 0 && (
              <div className="mb-20">
                <div className="flex items-center gap-3 mb-8">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
                    <Star className="h-5 w-5 fill-amber-500" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl text-gray-900">
                      Top Freelancers
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Highly rated professionals ready for your next project
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topFreelancers.map((f) => (
                    <motion.div
                      key={f.id}
                      className="tour-item group relative p-6 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/80 hover:border-[#185df9]/30 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden"
                      whileHover={{ y: -4 }}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#185df9]/5 to-transparent rounded-bl-full" />
                      <div className="relative flex items-start gap-4">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-white shadow-lg bg-slate-100">
                          <Image
                            src={getProfileImageUrl(f.profileImageUrl)}
                            alt={f.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="font-display text-lg font-medium text-gray-900 truncate">
                            {f.name}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 font-medium">
                              <Star className="w-3.5 h-3.5 fill-amber-500" />
                              {f.rating.toFixed(1)}
                            </span>
                            <span className="text-slate-400">·</span>
                            <span>{f.totalProjects} projects</span>
                          </div>
                          <Link
                            href="/auth/register?role=customer"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#185df9] hover:text-[#1450d4] transition-colors group/link"
                          >
                            <span>View profile</span>
                            <ExternalLink className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Top Companies — real data with registration hook */}
            {topCompanies && topCompanies.length > 0 && (
              <div className="mb-20">
                <div className="flex items-center gap-3 mb-8">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#185df9]/10 text-[#185df9]">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-2xl md:text-3xl text-gray-900">
                      Top Companies
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Trusted businesses hiring on Techconnex
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {topCompanies.map((c) => (
                    <motion.div
                      key={c.id}
                      className="tour-item group relative p-6 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/80 hover:border-[#185df9]/30 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden"
                      whileHover={{ y: -4 }}
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#185df9]/5 to-transparent rounded-bl-full" />
                      <div className="relative flex items-start gap-4">
                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-white shadow-lg bg-slate-100">
                          <Image
                            src={getProfileImageUrl(c.profileImageUrl)}
                            alt={c.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="font-display text-lg font-medium text-gray-900 truncate">
                            {c.name}
                          </p>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-sm text-gray-600">
                            {c.industry && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                                <Building2 className="w-3.5 h-3.5" />
                                {c.industry}
                              </span>
                            )}
                            {c.employeeCount != null && (
                              <span className="inline-flex items-center gap-1 text-slate-500">
                                <Users className="w-3.5 h-3.5" />
                                {c.employeeCount} employees
                              </span>
                            )}
                          </div>
                          <Link
                            href="/auth/register?role=provider"
                            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#185df9] hover:text-[#1450d4] transition-colors group/link"
                          >
                            <span>Explore opportunities</span>
                            <ExternalLink className="w-4 h-4 transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5" />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom CTA for public data view */}
            <div className="relative mt-16 rounded-3xl bg-gradient-to-br from-[#185df9] to-[#0d3a9e] p-8 md:p-10 text-center overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.04\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-80" />
              <div className="relative">
                <p className="font-mono-custom text-xs text-blue-200 uppercase tracking-[0.2em] mb-2">
                  Get started
                </p>
                <p className="text-white/90 text-lg mb-6 max-w-md mx-auto">
                  {talentPoolConfig.bottomNote}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/auth/register?role=customer"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#185df9] font-display text-sm font-semibold uppercase tracking-wider rounded-full hover:bg-blue-50 transition-colors shadow-lg"
                  >
                    Hire talent
                  </Link>
                  <Link
                    href="/auth/register?role=provider"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 text-white font-display text-sm font-semibold uppercase tracking-wider rounded-full border-2 border-white/40 hover:bg-white/20 transition-colors"
                  >
                    {talentPoolConfig.bottomCtaText}
                  </Link>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Two-column layout: config categories */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {talentPoolConfig.categories.length > 0 && (
                <div className="hidden lg:flex lg:flex-col lg:items-center lg:gap-4">
                  <div className="sticky top-32 w-full">
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-xl shadow-slate-900/5 ring-1 ring-black/5">
                      <img
                        src={talentPoolConfig.categories[activeVenue]?.image}
                        alt={talentPoolConfig.categories[activeVenue]?.name}
                        className="w-full h-full object-cover transition-opacity duration-500"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                        <p className="font-display text-2xl font-medium text-white">
                          {talentPoolConfig.categories[activeVenue]?.name}
                        </p>
                      </div>
                    </div>
                    {talentPoolConfig.categories[activeVenue]?.aiInsight && (
                      <div className="mt-4 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/80 p-5 shadow-lg shadow-slate-900/5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#185df9]/10">
                            <Sparkles className="h-4 w-4 text-[#185df9]" aria-hidden />
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

              <div className="space-y-4">
                {talentPoolConfig.categories.map((category, index) => (
                  <motion.div
                    key={category.id}
                    className="tour-item group relative p-6 rounded-2xl bg-white/95 backdrop-blur-sm border border-slate-200/80 hover:border-[#185df9]/30 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 cursor-pointer overflow-hidden"
                    onMouseEnter={() => setActiveVenue(index)}
                    whileHover={{ x: 4 }}
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#185df9] rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="flex flex-col md:flex-row md:items-center gap-4 pl-2">
                      <div className="flex-grow">
                        <span className="font-display text-lg font-medium text-gray-900">
                          {category.name}
                        </span>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {category.skills.map((skill) => (
                            <span
                              key={skill}
                              className="px-2.5 py-1 bg-[#185df9]/10 text-[#185df9] rounded-lg text-xs font-medium"
                            >
                              {skill}
                            </span>
                          ))}
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                            + more
                          </span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Link
                          href="/auth/register?role=customer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors shadow-md"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>{talentPoolConfig.hireButtonText}</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="relative mt-20 rounded-3xl bg-gradient-to-br from-slate-50 to-blue-50/80 border border-slate-200/80 p-8 md:p-10 text-center">
              <p className="font-mono-custom text-xs text-gray-500 uppercase tracking-wider mb-2">
                Ready to start?
              </p>
              <p className="text-gray-700 mb-6">
                {talentPoolConfig.bottomNote}
              </p>
              <Link
                href="/auth/register?role=customer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#185df9] text-white font-display text-sm font-semibold uppercase tracking-wider rounded-full hover:bg-[#1450d4] transition-colors shadow-lg hover:shadow-xl hover:shadow-blue-900/20"
              >
                {talentPoolConfig.bottomCtaText}
              </Link>
            </div>
          </>
        )}
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#185df9]/20 to-transparent" />
    </section>
  );
};

export default TourSchedule;
