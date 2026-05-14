"use client";

import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import productImage from "@/public/assets/product-image.png";
import {
  ComponentPropsWithoutRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useI18n } from "@/contexts/I18nProvider";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  ValueAnimationTransition,
} from "framer-motion";
import Heading from "./Services/Heading";

const HERO_RECTANGLE_FROM = "#2D6DFC";
const HERO_RECTANGLE_TO = "#614EF8";

type TabDef = {
  icon: string;
  title: string;
  isNew: boolean;
  backgroundPositionX: number;
  backgroundPositionY: number;
  backgroundSizeX: number;
};

const FeatureTab = (
  probs: TabDef & ComponentPropsWithoutRef<"div"> & { selected: boolean },
) => {
  const { t } = useI18n();
  const tabRef = useRef<HTMLDivElement>(null);
  const dotlottieRef = useRef<DotLottie | null>(null);

  const xPrecentage = useMotionValue(0);
  const yPrecentage = useMotionValue(0);

  const maskImage = useMotionTemplate`radial-gradient(80px 80px at ${xPrecentage}% ${yPrecentage}%,black,transparent)`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!tabRef.current || !probs.selected) return;

    xPrecentage.set(0);
    yPrecentage.set(0);

    const { height, width } = tabRef.current.getBoundingClientRect();

    const circumference = height * 2 + width * 2;
    const times = [
      0,
      width / circumference,
      (width + height) / circumference,
      (width * 2 + height) / circumference,
      1,
    ];

    animate(xPrecentage, [0, 100, 100, 0, 0], {
      times: times,
      duration: 4,
      repeat: Infinity,
      ease: "linear",
    });
    animate(yPrecentage, [0, 0, 100, 100, 0], {
      times: times,
      duration: 4,
      repeat: Infinity,
      ease: "linear",
    });
  }, [probs.selected, xPrecentage, yPrecentage]);

  const handleTabHover = () => {
    if (dotlottieRef.current === null) return;
    dotlottieRef.current.play();
  };
  return (
    <div
      ref={tabRef}
      onMouseEnter={handleTabHover}
      className="relative flex p-3 sm:p-3.5 rounded-xl gap-3 items-center lg:flex-1 overflow-hidden bg-white/60 backdrop-blur-md border border-white/60 shadow-[0_2px_12px_rgba(59,130,246,0.08)] hover:bg-white/80 hover:border-blue-200/60 hover:shadow-[0_4px_20px_rgba(59,130,246,0.12)] transition-all duration-300 cursor-pointer"
      onClick={probs.onClick}
    >
      {probs.selected && (
        <motion.div
          style={{ maskImage: maskImage }}
          className="absolute inset-0 -m-px border-2 border-blue-400/70 rounded-xl pointer-events-none"
        ></motion.div>
      )}

      <div className="h-12 w-12 rounded-lg inline-flex items-center justify-center bg-white/50 border border-white/60 shrink-0">
        <DotLottieReact
          dotLottieRefCallback={(dotLottie) => {
            dotlottieRef.current = dotLottie;
          }}
          src={probs.icon}
          className="h-5 w-5 invert"
          autoplay
        ></DotLottieReact>
      </div>
      <div className="font-medium text-gray-900">{probs.title}</div>
      {probs.isNew && (
        <div className="text-xs rounded-full px-2 py-0.5 bg-blue-400/20 text-blue-700 font-semibold border border-blue-300/40">
          {t("home.features.new")}
        </div>
      )}
    </div>
  );
};

export const Features = () => {
  const { t } = useI18n();
  const tabs: TabDef[] = useMemo(
    () => [
      {
        icon: "/assets/lottie/vroom.lottie",
        title: t("home.features.tab.dashboard"),
        isNew: false,
        backgroundPositionX: 0,
        backgroundPositionY: 0,
        backgroundSizeX: 110,
      },
      {
        icon: "/assets/lottie/click.lottie",
        title: t("home.features.tab.analytics"),
        isNew: false,
        backgroundPositionX: 100,
        backgroundPositionY: 27,
        backgroundSizeX: 177,
      },
      {
        icon: "/assets/lottie/stars.lottie",
        title: t("home.features.tab.matching"),
        isNew: true,
        backgroundPositionX: 98,
        backgroundPositionY: 100,
        backgroundSizeX: 135,
      },
    ],
    [t],
  );

  const [selectedTab, setSelectedTab] = useState(0);

  const backgroundPositionX = useMotionValue(tabs[0].backgroundPositionX);
  const backgroundPositionY = useMotionValue(tabs[0].backgroundPositionY);
  const backgroundSizeX = useMotionValue(tabs[0].backgroundSizeX);

  const backgroundPosition = useMotionTemplate`${backgroundPositionX}% ${backgroundPositionY}%`;
  const backgroundSize = useMotionTemplate`${backgroundSizeX}% auto`;

  const handleSelectTab = (index: number) => {
    setSelectedTab(index);

    // Only run animations on the client side
    if (typeof window === "undefined") return;

    const animateOptions: ValueAnimationTransition = {
      duration: 2,
      ease: "easeInOut",
    };
    animate(
      backgroundSizeX,
      [backgroundSizeX.get(), 100, tabs[index].backgroundSizeX],
      animateOptions,
    );
    animate(
      backgroundPositionX,
      [backgroundPositionX.get(), tabs[index].backgroundPositionX],
      animateOptions,
    );
    animate(
      backgroundPositionY,
      [backgroundPositionY.get(), tabs[index].backgroundPositionY],
      animateOptions,
    );
  };

  return (
    <section id="features" className="relative py-24 md:py-20 overflow-hidden ">
      {/* Blurred background circles */}
      <div
        className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[80px] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute top-1/2 left-0 w-[320px] h-[320px] rounded-full bg-blue-700/15 blur-[70px] pointer-events-none"
        aria-hidden
      />

      <div className="container relative">
        <Heading
          tag="Features"
          title={t("home.features.title")}
          text={t("home.features.subtitle")}
        />
        
        <div className="mt-10 flex flex-col lg:flex-row gap-3">
          {tabs.map((tab, tabIndex) => (
            <FeatureTab
              {...tab}
              selected={selectedTab === tabIndex}
              onClick={() => handleSelectTab(tabIndex)}
              key={tab.title}
            />
          ))}
        </div>
        <div className="relative mx-auto mt-8 w-full max-w-4xl">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 z-0 w-full -translate-x-1/2 -translate-y-1/2 rounded-[40px] shadow-[0_2px_90px_rgba(45,109,252,0.28)]"
            style={{
              width: "min(94vw, 1240px)",
              height: "min(32vw, 470px)",
              background: `linear-gradient(90deg, ${HERO_RECTANGLE_FROM} 0%, ${HERO_RECTANGLE_TO} 100%)`,
            }}
            aria-hidden
          />
          <div className="relative z-10 mx-auto w-full max-w-3xl rounded-2xl border border-white/70 bg-white/50 p-2 backdrop-blur-xl shadow-[0_4px_24px_rgba(59,130,246,0.1)]">
            <motion.div
              className="aspect-video overflow-hidden rounded-xl border border-white/60 bg-cover shadow-inner"
              style={{
                backgroundPosition,
                backgroundSize,
                backgroundImage: `url(${productImage.src})`,
              }}
            ></motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};
