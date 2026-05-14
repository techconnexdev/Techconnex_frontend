import { useEffect, useState } from "react";
import { useI18n } from "@/contexts/I18nProvider";
import CardSwap from "@/components/CardSwap";
import { milestone, billing, oppurtunities } from "@/public/assets";

export default function SearchCta() {
  const { t } = useI18n();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const syncViewport = () => {
      setIsMobile(window.matchMedia("(max-width: 768px)").matches);
    };
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const cardClass =
    "overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]";

  return (
    <section id="get-started" className="container px-4 pb-16 sm:px-6 md:pb-24">
      <div className="relative isolate overflow-hidden rounded-2xl bg-[#2D6DFC] px-4 pt-12 after:pointer-events-none after:absolute after:inset-0 after:inset-ring after:inset-ring-white/10 sm:-mx-6 sm:rounded-3xl sm:px-10 sm:pt-16 after:sm:rounded-3xl md:px-14 md:pt-24 lg:mx-0 lg:flex lg:gap-x-20 lg:px-24 lg:pt-0">
        <svg
          viewBox="0 0 1024 1024"
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 -z-10 size-256 -translate-y-1/2 mask-[radial-gradient(closest-side,white,transparent)] sm:left-full sm:-ml-80 lg:left-1/2 lg:ml-0 lg:-translate-x-1/2 lg:translate-y-0"
        >
          <circle
            r={512}
            cx={512}
            cy={512}
            fill="url(#759c1415-0410-454c-8f7c-9a820de03641)"
            fillOpacity="0.7"
          />
          <defs>
            <radialGradient id="759c1415-0410-454c-8f7c-9a820de03641">
              <stop stopColor="#7775D6" />
              <stop offset={1} stopColor="#E935C1" />
            </radialGradient>
          </defs>
        </svg>
        <div className="mx-auto max-w-md text-center lg:mx-0 lg:flex-auto lg:py-32 lg:text-left">
          <h2 className="text-2xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            Boost your productivity. Start using Techconnex today.
          </h2>
          <p className="mt-5 text-base/7 text-pretty text-gray-300 sm:mt-6 sm:text-lg/8">
          Connect with verified talents, find the right projects, and grow your network.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:mt-10 lg:justify-start">
              <a
                href="#"
                className="rounded-md bg-gray-700 px-3.5 py-2.5 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-gray-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                {' '}
                Get started{' '}
              </a>
              {/* <a href="#" className="text-sm/6 font-semibold text-white hover:text-gray-100">
                Learn more
                <span aria-hidden="true">→</span>
              </a> */}
            </div>
        </div>
        <div className="relative mt-12 w-full overflow-visible lg:mt-8 lg:max-w-2xl lg:translate-x-1/2">
          <CardSwap
            width={isMobile ? 320 : 780}
            height={isMobile ? 230 : 430}
            cardDistance={isMobile ? 24 : 54}
            verticalDistance={isMobile ? 22 : 56}
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
                src={billing.src}
                alt={t("home.milestone.imageAlt")}
                className="size-full object-cover object-top"
              />
            </div>
            <div className={`card ${cardClass}`}>
              <img
                src={oppurtunities.src}
                alt={t("home.milestone.imageAlt")}
                className="size-full object-cover object-top"
              />
            </div>
          </CardSwap>
        </div>
      </div>
    </section>
  );
}
