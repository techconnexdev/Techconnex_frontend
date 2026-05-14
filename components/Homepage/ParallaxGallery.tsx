"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  DollarSign,
  ChevronDown,
  ChevronUp,
  User,
  Building2,
  Star,
  Users,
} from "lucide-react";
import { parallaxGalleryConfig } from "./config";
import type {
  HomepageJob,
  HomepageFreelancer,
  HomepageCompany,
} from "@/lib/homepage-api";
import { useI18n } from "@/contexts/I18nProvider";
import { pickLocalizedField } from "@/lib/i18n/cmsField";
import { getProfileImageUrl } from "@/lib/api";

interface ParallaxGalleryProps {
  latestJobs?: HomepageJob[];
  topFreelancers?: HomepageFreelancer[];
  topCompanies?: HomepageCompany[];
}

const INITIAL_VISIBLE = 6 as const;
type TabType = "projects" | "providers" | "companies";

function ProfileAvatar({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = !!src && !imageFailed;

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/70 bg-gradient-to-br from-slate-100 to-slate-200 ring-2 ring-white shadow-md shadow-slate-900/10">
      {hasImage ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes="56px"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#2D6DFC]/15 to-[#614EF8]/20 text-[#2D6DFC]">
          <User className="h-7 w-7" />
        </div>
      )}
    </div>
  );
}

const ParallaxGallery = ({
  latestJobs,
  topFreelancers,
  topCompanies,
}: ParallaxGalleryProps) => {
  const { t, locale } = useI18n();
  const [activeTab, setActiveTab] = useState<TabType>("projects");
  const [showAll, setShowAll] = useState(false);

  const jobs = latestJobs ?? [];
  const providers = topFreelancers ?? [];
  const companies = topCompanies ?? [];
  const hasRealJobs = jobs.length > 0;
  const hasFallbackGallery = parallaxGalleryConfig.galleryImages.length > 0;

  const visibleJobs = useMemo(() => (showAll ? jobs : jobs.slice(0, INITIAL_VISIBLE)), [jobs, showAll]);
  const visibleProviders = useMemo(
    () => (showAll ? providers : providers.slice(0, INITIAL_VISIBLE)),
    [providers, showAll]
  );
  const visibleCompanies = useMemo(
    () => (showAll ? companies : companies.slice(0, INITIAL_VISIBLE)),
    [companies, showAll]
  );

  const hasAnyData =
    hasRealJobs || hasFallbackGallery || providers.length > 0 || companies.length > 0;

  if (!hasAnyData && !parallaxGalleryConfig.sectionTitle) {
    return null;
  }

  const hiddenCount =
    activeTab === "projects"
      ? Math.max(0, jobs.length - INITIAL_VISIBLE)
      : activeTab === "providers"
        ? Math.max(0, providers.length - INITIAL_VISIBLE)
        : Math.max(0, companies.length - INITIAL_VISIBLE);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setShowAll(false);
  };

  return (
    <section id="showcase" className="relative w-full pt-10 md:pt-14">
      <div className="mx-auto max-w-7xl px-6 md:px-12">
        <div className="mb-12">
          <p className="mb-2 font-mono-custom text-xs tracking-[0.2em] text-[#185df9]/75 uppercase">
            {t("home.parallax.sectionLabel")}
          </p>
          <h2 className="text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
            {t("home.parallax.galleryTitle")}
          </h2>
          <p className="mt-4 max-w-2xl text-gray-600">
            {t("home.parallax.sectionTitle")}
          </p>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleTabChange("projects")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "projects"
                ? "bg-[#2D6DFC] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Projects
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("providers")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "providers"
                ? "bg-[#2D6DFC] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Providers
          </button>
          <button
            type="button"
            onClick={() => handleTabChange("companies")}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === "companies"
                ? "bg-[#2D6DFC] text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Companies
          </button>
        </div>

        {activeTab === "projects" && (
          <>
            {hasRealJobs ? (
              <>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {visibleJobs.map((job, index) => (
                    <article
                      key={job.id}
                      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#2D6DFC]/40 hover:shadow-[0_22px_45px_rgba(45,109,252,0.14)]"
                    >
                      <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#2D6DFC]/15 to-[#614EF8]/10 blur-xl" />
                      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2D6DFC] to-[#614EF8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                      <div className="relative">
                        <p className="mb-2 font-mono-custom text-xs tracking-wider text-[#185df9] uppercase">
                          {job.category}
                        </p>
                        <h3 className="mb-3 line-clamp-2 font-display text-2xl text-gray-900">
                          {pickLocalizedField(job as unknown as Record<string, unknown>, "title", locale) ||
                            job.title}
                        </h3>

                        <div className="mb-4 flex items-center gap-2 text-sm text-slate-700">
                          <DollarSign className="h-4 w-4 shrink-0 text-[#185df9]" />
                          <span>
                            ${job.budgetMin.toLocaleString()} - ${job.budgetMax.toLocaleString()}
                          </span>
                        </div>

                        <div className="mb-5 flex flex-wrap gap-1.5">
                          {(job.skills ?? []).slice(0, 4).map((skill) => (
                            <span
                              key={skill}
                              className="rounded-full bg-[#2D6DFC]/10 px-2.5 py-1 text-xs font-medium text-[#185df9]"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>

                        <Link
                          href={`/showcase/projects/${job.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/20 bg-[#2D6DFC]/5 px-3.5 py-2 text-sm font-semibold text-[#185df9] transition-colors hover:bg-[#2D6DFC]/10"
                        >
                          <Briefcase className="h-4 w-4" />
                          View Job
                        </Link>
                      </div>

                      <div className="pointer-events-none absolute top-4 right-4 font-mono-custom text-3xl font-bold text-[#2D6DFC]/20">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                    </article>
                  ))}
                </div>

                {jobs.length > INITIAL_VISIBLE && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAll((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/25 bg-white px-6 py-3 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
                    >
                      {showAll ? "Show less" : `Show more${hiddenCount ? ` (${hiddenCount})` : ""}`}
                      {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                )}
                <div className="mt-4 flex justify-center">
                        <Link
                          href="/showcase?tab=projects"
                          className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/25 bg-white px-6 py-3 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
                        >
                          View all projects
                          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                        </Link>
                </div>
              </>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {parallaxGalleryConfig.galleryImages
                  .slice(0, showAll ? undefined : INITIAL_VISIBLE)
                  .map((image, index) => (
                    <article
                      key={image.id}
                      className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-3 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#2D6DFC]/35"
                    >
                      <div className="relative overflow-hidden rounded-2xl">
                        <Image
                          src={image.src}
                          alt={image.title}
                          width={600}
                          height={400}
                          className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="mb-1 text-xs text-blue-200">{image.date}</p>
                          <h3 className="font-display text-xl text-white">{image.title}</h3>
                        </div>
                      </div>
                      <div className="pointer-events-none absolute top-4 right-4 font-mono-custom text-3xl font-bold text-[#2D6DFC]/20">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                    </article>
                  ))}

                {parallaxGalleryConfig.galleryImages.length > INITIAL_VISIBLE && (
                  <div className="md:col-span-2 xl:col-span-3 mt-4 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowAll((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/25 bg-white px-6 py-3 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
                    >
                      {showAll ? "Show less" : "Show more"}
                      {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                )}
                <div className="md:col-span-2 xl:col-span-3 mt-2 flex justify-center">
                        <Link
                          href="/showcase?tab=projects"
                          className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/25 bg-white px-6 py-3 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
                        >
                          View all projects
                          <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
                        </Link>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "providers" && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleProviders.map((f, index) => (
                <div
                  key={f.id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#2D6DFC]/40 hover:shadow-[0_22px_45px_rgba(45,109,252,0.14)]"
                >
                  <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#2D6DFC]/15 to-[#614EF8]/10 blur-xl" />
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2D6DFC] to-[#614EF8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-start gap-4">
                    <ProfileAvatar src={getProfileImageUrl(f.profileImageUrl)} alt={f.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-medium text-gray-900">
                        {pickLocalizedField(f as unknown as Record<string, unknown>, "name", locale) || f.name}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 font-medium">
                          <Star className="h-3.5 w-3.5 fill-amber-500" />
                          {f.rating.toFixed(1)}
                        </span>
                        <span className="text-slate-400">·</span>
                        <span>{t("home.tour.projectsCount", { count: f.totalProjects })}</span>
                      </div>
                      <Link
                        href={`/showcase/providers/${f.id}`}
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/20 bg-[#2D6DFC]/5 px-3 py-1.5 text-sm font-semibold text-[#185df9] transition-colors hover:bg-[#2D6DFC]/10"
                      >
                        View Provider
                      </Link>
                    </div>
                  </div>
                  <div className="pointer-events-none absolute top-4 right-4 font-mono-custom text-3xl font-bold text-[#2D6DFC]/20">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                </div>
              ))}
            </div>

            {providers.length > INITIAL_VISIBLE && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/25 bg-white px-6 py-3 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
                >
                  {showAll ? "Show less" : `Show more${hiddenCount ? ` (${hiddenCount})` : ""}`}
                  {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <Link
                href="/showcase?tab=providers"
                className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/25 bg-white px-6 py-3 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
              >
                View all providers
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              </Link>
            </div>
          </>
        )}

        {activeTab === "companies" && (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {visibleCompanies.map((c, index) => (
                <div
                  key={c.id}
                  className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#2D6DFC]/40 hover:shadow-[0_22px_45px_rgba(45,109,252,0.14)]"
                >
                  <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#2D6DFC]/15 to-[#614EF8]/10 blur-xl" />
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2D6DFC] to-[#614EF8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <div className="relative flex items-start gap-4">
                    <ProfileAvatar src={getProfileImageUrl(c.profileImageUrl)} alt={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-medium text-gray-900">
                        {pickLocalizedField(c as unknown as Record<string, unknown>, "name", locale) || c.name}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600">
                        {c.industry && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
                            <Building2 className="h-3.5 w-3.5" />
                            {c.industry}
                          </span>
                        )}
                        {c.employeeCount != null && (
                          <span className="inline-flex items-center gap-1 text-slate-500">
                            <Users className="h-3.5 w-3.5" />
                            {t("home.tour.employeesCount", { count: c.employeeCount })}
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/showcase/companies/${c.id}`}
                        className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/20 bg-[#2D6DFC]/5 px-3 py-1.5 text-sm font-semibold text-[#185df9] transition-colors hover:bg-[#2D6DFC]/10"
                      >
                        View Company
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {companies.length > INITIAL_VISIBLE && (
              <div className="mt-10 flex justify-center">
                <button
                  type="button"
                  onClick={() => setShowAll((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/25 bg-white px-6 py-3 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
                >
                  {showAll ? "Show less" : "Show more"}
                  {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>
            )}
            <div className="mt-4 flex justify-center">
              <Link
                href="/showcase?tab=companies"
                className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/25 bg-white px-6 py-3 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
              >
                View all companies
                <ChevronDown className="h-4 w-4 rotate-[-90deg]" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ParallaxGallery;
