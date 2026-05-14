"use client";

import { milestone } from "@/public/assets";
import { useI18n } from "@/contexts/I18nProvider";
import CardSwap from "@/components/CardSwap";

const cardClass =
  "overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]";

const Milestone = () => {
  const { t } = useI18n();

  return (
    <section
      id="milestones"
      className="relative overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-blue-50/50 py-24 md:py-32"
    >
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[min(85vw,600px)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/20 blur-[100px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/4 bottom-0 h-[380px] w-[380px] rounded-full bg-blue-500/15 blur-[80px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/3 left-0 h-[280px] w-[280px] rounded-full bg-blue-700/15 blur-[70px]"
        aria-hidden
      />

      <div className="container relative">
        <p className="mb-4 text-center font-mono text-xs tracking-[0.25em] text-[#185df9] uppercase md:text-sm">
          {t("home.milestone.label")}
        </p>
        <h2 className="mb-4 text-center text-4xl font-semibold tracking-tight text-gray-900 md:mb-5 md:text-5xl lg:text-6xl">
          {t("home.milestone.title")}
        </h2>
        <p className="mx-auto mt-8 max-w-3xl text-center leading-relaxed text-gray-600 md:mt-12 md:text-xl">
          {t("home.milestone.subtitle")}
        </p>

        <div className="relative mx-auto mt-14 h-[560px] w-full max-w-[980px] md:mt-16">
          <CardSwap
            width={780}
            height={430}
            cardDistance={54}
            verticalDistance={56}
            delay={4200}
            pauseOnHover
            onCardClick={() => {}}
          >
            <div className={`card ${cardClass}`}>
              <img
                src={milestone.src}
                alt={t("home.milestone.imageAlt")}
                className="size-full object-cover object-top"
              />
            </div>
            <div className={`card ${cardClass}`}>
              <img
                src={milestone.src}
                alt={t("home.milestone.imageAlt")}
                className="size-full object-cover object-center brightness-[0.97]"
              />
            </div>
            <div className={`card ${cardClass}`}>
              <img
                src={milestone.src}
                alt={t("home.milestone.imageAlt")}
                className="size-full object-cover object-bottom brightness-[0.94]"
              />
            </div>
          </CardSwap>
        </div>
      </div>
    </section>
  );
};

export default Milestone;
