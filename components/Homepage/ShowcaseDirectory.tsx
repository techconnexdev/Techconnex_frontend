"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  DollarSign,
  Sparkles,
  Star,
  User,
  Users,
} from "lucide-react";
import type {
  HomepageCompany,
  HomepageFreelancer,
  HomepageJob,
} from "@/lib/homepage-api";
import { useI18n } from "@/contexts/I18nProvider";
import { pickLocalizedField } from "@/lib/i18n/cmsField";
import { getProfileImageUrl } from "@/lib/api";

type TabType = "projects" | "providers" | "companies";
type Variant = "showcase" | "talent";

function ProfileAvatar({ src, alt }: { src?: string | null; alt: string }) {
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

function normalizeTab(raw: string | null, variant: Variant): TabType {
  if (raw === "providers" || raw === "companies" || raw === "projects") {
    if (variant === "talent" && raw === "projects") return "providers";
    return raw;
  }
  return variant === "talent" ? "providers" : "projects";
}

export interface ShowcaseDirectoryProps {
  variant?: Variant;
  latestJobs: HomepageJob[];
  topFreelancers: HomepageFreelancer[];
  topCompanies: HomepageCompany[];
}

export default function ShowcaseDirectory({
  variant = "showcase",
  latestJobs,
  topFreelancers,
  topCompanies,
}: ShowcaseDirectoryProps) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const syncUrl = pathname === "/showcase";

  const [tab, setTab] = useState<TabType>(() =>
    normalizeTab(searchParams.get("tab"), variant)
  );

  useEffect(() => {
    setTab(normalizeTab(searchParams.get("tab"), variant));
  }, [searchParams, variant]);

  const setTabAndRoute = useCallback(
    (next: TabType) => {
      setTab(next);
      if (syncUrl) {
        router.replace(`/showcase?tab=${next}`, { scroll: false });
      }
    },
    [router, syncUrl]
  );

  const jobs = latestJobs ?? [];
  const providers = topFreelancers ?? [];
  const companies = topCompanies ?? [];

  const tabMeta = useMemo(() => {
    const items =
      tab === "projects" ? jobs : tab === "providers" ? providers : companies;
    const indexDigit =
      tab === "projects" ? "01" : tab === "providers" ? "02" : "03";
    const label =
      tab === "projects"
        ? t("home.showcase.tabProjects")
        : tab === "providers"
          ? t("home.showcase.tabProviders")
          : t("home.showcase.tabCompanies");
    return { items, indexDigit, label, count: items.length };
  }, [tab, jobs, providers, companies, t]);

  const hero =
    variant === "talent"
      ? {
          eyebrow: t("talent.pageLabel"),
          title: t("talent.pageHeading"),
          subtitle: t("talent.pageSubheading"),
        }
      : {
          eyebrow: t("home.showcase.heroEyebrow"),
          title: t("home.showcase.heroTitle"),
          subtitle: t("home.showcase.heroSubtitle"),
        };

  const tabs: { id: TabType; label: string }[] =
    variant === "talent"
      ? [
          { id: "providers", label: t("home.showcase.tabProviders") },
          { id: "companies", label: t("home.showcase.tabCompanies") },
        ]
      : [
          { id: "projects", label: t("home.showcase.tabProjects") },
          { id: "providers", label: t("home.showcase.tabProviders") },
          { id: "companies", label: t("home.showcase.tabCompanies") },
        ];

  return (
    <section className="relative w-full overflow-hidden pb-24 pt-28 md:pb-32 md:pt-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-[25%] top-[-10%] h-[min(520px,70vw)] w-[min(900px,120vw)] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(45,109,252,0.14)_0%,transparent_68%)]" />
        <div className="absolute right-[-18%] top-[18%] h-[420px] w-[min(720px,90vw)] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(97,78,248,0.11)_0%,transparent_70%)]" />
        <div
          className="absolute inset-0 opacity-[0.45]"
          style={{
            backgroundImage: `linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)`,
            backgroundSize: "56px 56px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 0%, black 20%, transparent 75%)",
          }}
        />
        <div className="absolute left-[8%] top-[46%] hidden h-px w-32 rotate-[125deg] bg-gradient-to-r from-transparent via-[#2D6DFC]/40 to-transparent md:block" />
        <div className="absolute bottom-[22%] right-[12%] hidden h-px w-40 rotate-45 bg-gradient-to-r from-transparent via-[#614EF8]/35 to-transparent md:block" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 md:px-12">
        <div className="relative mb-14 md:mb-20 md:grid md:grid-cols-[1fr_auto] md:items-end md:gap-12">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 font-mono-custom text-xs tracking-[0.22em] text-[#185df9]/80 uppercase">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {hero.eyebrow}
            </p>
            <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-gray-900 md:text-5xl lg:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-gray-600 md:text-lg">
              {hero.subtitle}
            </p>
          </div>

          <div className="mt-10 hidden text-right md:mt-0 md:block">
            <p className="font-mono-custom text-[clamp(4rem,12vw,7rem)] font-bold leading-none tracking-tighter text-[#2D6DFC]/[0.12]">
              {tabMeta.indexDigit}
            </p>
            <p className="mt-2 text-sm font-medium text-slate-500">
              {tabMeta.label}
              <span className="mx-2 text-slate-300">·</span>
              {t("home.showcase.listedCount", { count: tabMeta.count })}
            </p>
          </div>
        </div>

        <div className="sticky top-[76px] z-20 mb-10 md:top-[88px]">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white/80 p-2 shadow-[0_8px_30px_rgba(15,23,42,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/70 dark:border-neutral-800 dark:bg-neutral-950/75">
            {tabs.map(({ id, label }) => {
              const active = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTabAndRoute(id)}
                  className={`relative rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    active
                      ? "text-white"
                      : "text-slate-600 hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  {active && (
                    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#2D6DFC] to-[#614EF8] shadow-[0_4px_14px_rgba(45,109,252,0.35)]" />
                  )}
                  <span className="relative">{label}</span>
                </button>
              );
            })}
            <div className="ml-auto hidden items-center gap-2 pr-2 text-xs font-medium text-slate-500 sm:flex">
              <span className="h-1 w-1 rounded-full bg-[#2D6DFC]" />
              {t("home.showcase.liveDirectory")}
            </div>
          </div>
        </div>

        {tab === "projects" && variant === "showcase" && (
          <>
            {jobs.length === 0 ? (
              <EmptyState
                icon={<Briefcase className="h-10 w-10" />}
                message={t("home.showcase.emptyProjects")}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {jobs.map((job, index) => (
                  <article
                    key={job.id}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#2D6DFC]/40 hover:shadow-[0_22px_45px_rgba(45,109,252,0.14)] dark:bg-neutral-950/40 dark:border-neutral-800"
                  >
                    <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#2D6DFC]/15 to-[#614EF8]/10 blur-xl" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2D6DFC] to-[#614EF8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative">
                      <p className="mb-2 font-mono-custom text-xs tracking-wider text-[#185df9] uppercase">
                        {job.category}
                      </p>
                      <h2 className="mb-3 line-clamp-2 font-display text-2xl text-gray-900 dark:text-neutral-100">
                        {pickLocalizedField(
                          job as unknown as Record<string, unknown>,
                          "title",
                          locale
                        ) || job.title}
                      </h2>
                      <div className="mb-4 flex items-center gap-2 text-sm text-slate-700 dark:text-neutral-300">
                        <DollarSign className="h-4 w-4 shrink-0 text-[#185df9]" />
                        <span>
                          ${job.budgetMin.toLocaleString()} — $
                          {job.budgetMax.toLocaleString()}
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
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/showcase/projects/${job.id}`}
                          className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/30 bg-white px-3.5 py-2 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
                        >
                          {t("home.showcase.viewProjectBrief")}
                        </Link>
                        <Link
                          href="/auth/register?role=provider"
                          className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/20 bg-[#2D6DFC]/5 px-3.5 py-2 text-sm font-semibold text-[#185df9] transition-colors hover:bg-[#2D6DFC]/10"
                        >
                          {t("home.parallax.signUpApply")}
                          <ArrowUpRight className="h-4 w-4 opacity-70" />
                        </Link>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute top-4 right-4 font-mono-custom text-3xl font-bold text-[#2D6DFC]/20">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "providers" && (
          <>
            {providers.length === 0 ? (
              <EmptyState
                icon={<User className="h-10 w-10" />}
                message={
                  variant === "talent"
                    ? t("talent.empty")
                    : t("home.showcase.emptyProviders")
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {providers.map((f, index) => (
                  <article
                    key={f.id}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#2D6DFC]/40 hover:shadow-[0_22px_45px_rgba(45,109,252,0.14)] dark:bg-neutral-950/40 dark:border-neutral-800"
                  >
                    <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#2D6DFC]/15 to-[#614EF8]/10 blur-xl" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2D6DFC] to-[#614EF8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative flex items-start gap-4">
                      <ProfileAvatar
                        src={getProfileImageUrl(f.profileImageUrl)}
                        alt={f.name}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-lg font-medium text-gray-900 dark:text-neutral-100">
                          {pickLocalizedField(
                            f as unknown as Record<string, unknown>,
                            "name",
                            locale
                          ) || f.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-neutral-400">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                            <Star className="h-3.5 w-3.5 fill-amber-500" />
                            {f.rating.toFixed(1)}
                          </span>
                          <span className="text-slate-400">·</span>
                          <span>
                            {t("home.tour.projectsCount", {
                              count: f.totalProjects,
                            })}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/showcase/providers/${f.id}`}
                            className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/30 bg-white px-3 py-1.5 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
                          >
                            {t("home.showcase.viewProfile")}
                          </Link>
                          <Link
                            href="/auth/register?role=customer"
                            className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/20 bg-[#2D6DFC]/5 px-3 py-1.5 text-sm font-semibold text-[#185df9] transition-colors hover:bg-[#2D6DFC]/10"
                          >
                            {t("home.tour.hireTalent")}
                            <ArrowUpRight className="h-4 w-4 opacity-70" />
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute top-4 right-4 font-mono-custom text-3xl font-bold text-[#2D6DFC]/20">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "companies" && (
          <>
            {companies.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-10 w-10" />}
                message={
                  variant === "talent"
                    ? t("talent.empty")
                    : t("home.showcase.emptyCompanies")
                }
              />
            ) : (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {companies.map((c, index) => (
                  <article
                    key={c.id}
                    className="group relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.06)] transition-all duration-300 hover:-translate-y-1 hover:border-[#2D6DFC]/40 hover:shadow-[0_22px_45px_rgba(45,109,252,0.14)] dark:bg-neutral-950/40 dark:border-neutral-800"
                  >
                    <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#2D6DFC]/15 to-[#614EF8]/10 blur-xl" />
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#2D6DFC] to-[#614EF8] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="relative flex items-start gap-4">
                      <ProfileAvatar
                        src={getProfileImageUrl(c.profileImageUrl)}
                        alt={c.name}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-lg font-medium text-gray-900 dark:text-neutral-100">
                          {pickLocalizedField(
                            c as unknown as Record<string, unknown>,
                            "name",
                            locale
                          ) || c.name}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-600 dark:text-neutral-400">
                          {c.industry && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-slate-700 dark:bg-neutral-800 dark:text-neutral-200">
                              <Building2 className="h-3.5 w-3.5" />
                              {c.industry}
                            </span>
                          )}
                          {c.employeeCount != null && (
                            <span className="inline-flex items-center gap-1 text-slate-500 dark:text-neutral-500">
                              <Users className="h-3.5 w-3.5" />
                              {t("home.tour.employeesCount", {
                                count: c.employeeCount,
                              })}
                            </span>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Link
                            href={`/showcase/companies/${c.id}`}
                            className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/30 bg-white px-3 py-1.5 text-sm font-semibold text-[#185df9] shadow-sm transition-colors hover:bg-blue-50"
                          >
                            {t("home.showcase.viewCompanyProfile")}
                          </Link>
                          {/* <Link
                            href="/provider/companies"
                            className="inline-flex items-center gap-2 rounded-full border border-[#2D6DFC]/20 bg-[#2D6DFC]/5 px-3 py-1.5 text-sm font-semibold text-[#185df9] transition-colors hover:bg-[#2D6DFC]/10"
                          >
                            {t("home.showcase.viewCompanyNetwork")}
                            <ArrowUpRight className="h-4 w-4 opacity-70" />
                          </Link> */}
                        </div>
                      </div>
                    </div>
                    <div className="pointer-events-none absolute top-4 right-4 font-mono-custom text-3xl font-bold text-[#2D6DFC]/20">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}

        <div className="relative mt-16 overflow-hidden rounded-[2rem] border border-slate-200/90 bg-gradient-to-br from-[#2D6DFC] via-[#614EF8] to-[#614EF8] p-8 text-white shadow-[0_24px_60px_rgba(15,23,42,0.35)] md:p-12 md:px-14">
          <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-[#2D6DFC]/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-[#614EF8]/20 blur-3xl" />
          <div className="relative flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <p className="font-mono-custom text-xs tracking-[0.2em] text-sky-300/90 uppercase">
                {t("home.showcase.bottomEyebrow")}
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight md:text-3xl">
                {t("home.showcase.bottomTitle")}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300 md:text-base">
                {t("home.showcase.bottomSubtitle")}
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/auth/register?role=customer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-sky-50"
              >
                {t("home.showcase.bottomCtaHire")}
                <ArrowUpRight className="h-4 w-4" />
              </Link>
              <Link
                href="/auth/register?role=provider"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                {t("home.showcase.bottomCtaWork")}
              </Link>
            </div>
          </div>
        </div>

        {variant === "showcase" && (
          <p className="mt-10 text-center text-sm text-slate-500">
            <Link href="/#showcase" className="font-semibold text-[#185df9] hover:underline">
              {t("home.showcase.backToHome")}
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}

function EmptyState({
  icon,
  message,
}: {
  icon: ReactNode;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-slate-200 bg-slate-50/50 py-20 text-center dark:border-neutral-800 dark:bg-neutral-950/30">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2D6DFC]/10 text-[#185df9]">
        {icon}
      </div>
      <p className="max-w-md text-slate-600 dark:text-neutral-400">{message}</p>
    </div>
  );
}
