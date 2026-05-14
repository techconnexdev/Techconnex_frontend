"use client";
import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import Image from "next/image";
import { motion, useAnimate, useReducedMotion } from "framer-motion";
import { useI18n } from "@/contexts/I18nProvider";
import { heroBanner } from "@/public/assets";
import heroBannerMobile from "@/public/homepage/mobile.png";
import brandLogo from "@/public/logo.png";

const GRADIENT_FROM = "#2D6DFC";
const GRADIENT_TO = "#614EF8";

/** Matches the finished panel — morph animates border radius into this value */
const PANEL_RADIUS_PX = 40;

const BAR_WIDTH_PX = 280;
const BAR_HEIGHT_PX = 8;
/** Extra panel height added upward only (bottom edge stays fixed) */
const PANEL_TOP_EXTENSION_PX = 150;
/** Wider final panel cap */
const PANEL_MAX_WIDTH_PX = 1240;
const MOBILE_BREAKPOINT_PX = 768;
const MOBILE_FRAME_EXTRA_HEIGHT_PX = 0;
const MOBILE_PANEL_HEIGHT_REDUCTION_PX = 76;
const MOBILE_FRAME_MAX_HEIGHT_PX = 520;

/** Extra clip height so rest-offset + float never clips the bezel */
const MOCKUP_FRAME_BLEED_PX = 0;

/**
 * Dashboard mockup (slide-up + fade-in), then subtle floating loop.
 * Tune delays/durations here only.
 */
export const HERO_MOCKUP_ANIM = {
  delaySec: 0.14,
  slideDurationSec: 1.14,
  fadeDurationSec: 0.95,
  /** Smooth lift — soft landing */
  slideEase: [0.2, 0.85, 0.33, 1] as const,
  fadeEase: [0.22, 1, 0.38, 1] as const,
  initialOpacity: 0,
  finalOpacity: 1,
  /** Sits slightly lower after entrance */
  restOffsetYPx: 16,
  /** Oscillation: moves up from rest by this many px, then returns */
  floatRangePx: 7,
  floatDurationSec: 3.6,
  /** Pause after slide-in before float starts (seconds) */
  floatDelayAfterSlideSec: 0.22,
} as const;

const HERO_TITLE_REVEAL = {
  delayAfterMockupSec: 0.16,
  panelShiftYPx: 0,
} as const;

function morphTargetSize() {
  if (typeof window === "undefined") return { w: 1100, h: 340 };
  const isPhone = window.innerWidth < MOBILE_BREAKPOINT_PX;
  const w = Math.min(window.innerWidth * 0.94, PANEL_MAX_WIDTH_PX);
  // Wide, relatively shallow rectangle like the reference (not full viewport height)
  const h = isPhone
    ? Math.min(Math.round(window.innerHeight * 0.22), 220)
    : Math.min(Math.round(window.innerHeight * 0.28), 340);
  return { w, h };
}

/** Approximate mockup height (image + bezel) at hero width — frame uses max(panel, this) so clip fits everything with bottom aligned to the panel bottom */
function heroMockupApproxHeightPx(panelOuterWidth: number, isPhone: boolean) {
  const pad = 28;
  const inner = Math.min(920, Math.max(240, panelOuterWidth - pad));
  const source = isPhone ? heroBannerMobile : heroBanner;
  const imgH = (source.height * inner) / source.width;
  const bezelY = 26;
  const phoneFrameBoost = isPhone ? MOBILE_FRAME_EXTRA_HEIGHT_PX : 0;
  const rawHeight = Math.ceil(
    imgH + bezelY + MOCKUP_FRAME_BLEED_PX + phoneFrameBoost,
  );
  return isPhone ? Math.min(rawHeight, MOBILE_FRAME_MAX_HEIGHT_PX) : rawHeight;
}

function panelVisualHeightPx(panelHeight: number, isPhone: boolean) {
  if (!isPhone) return panelHeight + PANEL_TOP_EXTENSION_PX;
  return Math.max(
    120,
    panelHeight + PANEL_TOP_EXTENSION_PX - MOBILE_PANEL_HEIGHT_REDUCTION_PX,
  );
}

export type HeroProps = {
  onIntroComplete?: () => void;
  isReadyToComplete?: boolean;
};

/**
 * Hero intro: white → loading bar → morph to gradient panel → dashboard mockup slides up over the panel.
 */
const Hero = ({ onIntroComplete, isReadyToComplete = true }: HeroProps) => {
  const { t } = useI18n();
  const [, animate] = useAnimate();
  const prefersReducedMotion = useReducedMotion();

  const whiteLayerRef = useRef<HTMLDivElement>(null);
  const introLogoRef = useRef<HTMLDivElement>(null);
  const barTrackRef = useRef<HTMLDivElement>(null);
  const barFillRef = useRef<HTMLDivElement>(null);
  const introHostRef = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLElement>(null);

  const introAliveRef = useRef(true);
  const onIntroCompleteRef = useRef(onIntroComplete);
  const readyToCompleteRef = useRef(isReadyToComplete);
  useEffect(() => {
    onIntroCompleteRef.current = onIntroComplete;
  }, [onIntroComplete]);
  useEffect(() => {
    readyToCompleteRef.current = isReadyToComplete;
  }, [isReadyToComplete]);

  /**
   * introVisualDone  – in-flow content is mounted (starts as soon as swap begins)
   * fixedLayerGone   – fixed intro elements are unmounted (after FLIP + fade-out)
   */
  const [introVisualDone, setIntroVisualDone] = useState(false);
  const [fixedLayerGone, setFixedLayerGone] = useState(false);
  const [introHostTopPx, setIntroHostTopPx] = useState(0);
  const [titleVisible, setTitleVisible] = useState(false);
  const [isPhoneViewport, setIsPhoneViewport] = useState(false);
  const [panelSize, setPanelSize] = useState<{ w: number; h: number } | null>(
    null,
  );

  /** Ref on the outermost in-flow wrapper — receives the FLIP translate */
  const inFlowWrapperRef = useRef<HTMLDivElement>(null);
  /** Ref on the in-flow gradient div — used only for measuring its natural center-Y */
  const inFlowGradientRef = useRef<HTMLDivElement>(null);
  const heroFrameHeight =
    panelSize == null
      ? 0
      : Math.max(
          panelVisualHeightPx(panelSize.h, isPhoneViewport),
          heroMockupApproxHeightPx(panelSize.w, isPhoneViewport),
        );
  const heroAvailableHeight = `calc(100dvh - ${Math.max(0, introHostTopPx)}px)`;

  const runIntro = useCallback(async () => {
    if (!introAliveRef.current) return;
    if (
      !barTrackRef.current ||
      !barFillRef.current ||
      !whiteLayerRef.current ||
      !introHostRef.current
    ) {
      return;
    }

    const track = barTrackRef.current;
    const fill = barFillRef.current;
    const whiteLayer = whiteLayerRef.current;

    const isPhone = window.innerWidth < MOBILE_BREAKPOINT_PX;
    const { w: tw, h: th } = morphTargetSize();
    setPanelSize({ w: tw, h: th });

    // 1) Fill bar left → right; TechConnex mark fades OUT as the bar begins to scale
    await Promise.all([
      animate(
        fill,
        { scaleX: 1 },
        { duration: 1.12, ease: [0.33, 0.02, 0.22, 1] },
      ),
      !prefersReducedMotion && introLogoRef.current
        ? animate(
            introLogoRef.current,
            { opacity: [1, 0], y: [0, -10] },
            {
              duration: 0.5,
              ease: [0.22, 1, 0.36, 1],
            },
          )
        : Promise.resolve(),
    ]);
    if (introLogoRef.current) {
      introLogoRef.current.style.opacity = "0";
    }
    if (!introAliveRef.current) return;
    while (introAliveRef.current && !readyToCompleteRef.current) {
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 50);
      });
    }
    if (!introAliveRef.current) return;

    // 2) Morph track → large panel: interpolate width/height/borderRadius together so corners feel continuous
    await animate(fill, { opacity: 0 }, { duration: 0.08 });
    if (!introAliveRef.current) return;

    track.style.overflow = "hidden";
    track.style.backgroundColor = "transparent";
    track.style.background = `linear-gradient(90deg, ${GRADIENT_FROM} 0%, ${GRADIENT_TO} 100%)`;

    await animate(
      track,
      {
        width: [BAR_WIDTH_PX, tw],
        height: [BAR_HEIGHT_PX, panelVisualHeightPx(th, isPhone)],
        // Keep the bottom border line stable while extending only upward.
        y: [0, -PANEL_TOP_EXTENSION_PX / 2],
        // Match initial pill (9999) → final panel corners so radius interpolates smoothly with width/height
        borderRadius: ["9999px", `${PANEL_RADIUS_PX}px`],
        boxShadow: [
          "0 1px 3px rgba(15, 23, 42, 0.06)",
          "0 28px 90px rgba(45, 109, 252, 0.28)",
        ],
      },
      { duration: 0.98, ease: [0.29, 0.94, 0.35, 1] },
    );
    if (!introAliveRef.current) return;

    // 3) Fade the white scrim — morphed shape stays until we swap to in-flow panel
    await animate(
      whiteLayer,
      { opacity: 0 },
      { duration: 0.62, ease: [0.22, 1, 0.42, 1] },
    );
    if (!introAliveRef.current) return;
    whiteLayer.style.pointerEvents = "none";

    // 4) FLIP swap — prevent the visual jump caused by fixed→in-flow reposition.
    //    a) Snapshot the fixed panel center-Y before React re-renders.
    const trackRect = track.getBoundingClientRect();
    const fixedCenterY = trackRect.top + trackRect.height / 2;

    //    b) Mount in-flow content (fixed layer stays visible via fixedLayerGone=false).
    setIntroVisualDone(true);

    //    c) Wait two rAFs so React has committed the new DOM nodes.
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    if (!introAliveRef.current) return;

    //    d) Measure where the in-flow gradient landed naturally.
    const gradRect = inFlowGradientRef.current?.getBoundingClientRect();
    const dy = gradRect
      ? fixedCenterY - (gradRect.top + gradRect.height / 2)
      : 0;

    //    e) Strict handoff (no overlap): place in-flow at fixed panel position first,
    //       then remove fixed layer, then animate in-flow to its natural slot.
    if (inFlowWrapperRef.current && Math.abs(dy) > 0.5) {
      inFlowWrapperRef.current.style.transform = `translateY(${dy}px)`;
    }
    setFixedLayerGone(true);
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    if (!introAliveRef.current) return;

    if (Math.abs(dy) > 0.5 && inFlowWrapperRef.current) {
      await animate(
        inFlowWrapperRef.current,
        { y: [dy, 0] },
        { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
      );
    }
    if (!introAliveRef.current) return;

    //    f) Intro is now fully handed off to in-flow.
    onIntroCompleteRef.current?.();
  }, [animate, prefersReducedMotion]);

  useEffect(() => {
    introAliveRef.current = true;
    const id = requestAnimationFrame(() => {
      void runIntro();
    });
    return () => {
      introAliveRef.current = false;
      cancelAnimationFrame(id);
    };
  }, [runIntro]);

  useLayoutEffect(() => {
    const measure = () => {
      const top = heroSectionRef.current?.getBoundingClientRect().top ?? 0;
      setIntroHostTopPx(top);
      setIsPhoneViewport(window.innerWidth < MOBILE_BREAKPOINT_PX);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!introVisualDone) {
      setTitleVisible(false);
      return;
    }
    const revealMs =
      (HERO_MOCKUP_ANIM.delaySec +
        Math.max(
          HERO_MOCKUP_ANIM.slideDurationSec,
          HERO_MOCKUP_ANIM.fadeDurationSec,
        ) +
        HERO_TITLE_REVEAL.delayAfterMockupSec) *
      1000;
    const id = window.setTimeout(() => setTitleVisible(true), revealMs);
    return () => window.clearTimeout(id);
  }, [introVisualDone]);

  useEffect(() => {
    if (!introVisualDone) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
    /** Unlock scroll after mockup entrance — avoids scrollbar/dvw jump layered with motion.start */
    const unlockMs =
      (HERO_MOCKUP_ANIM.delaySec +
        Math.max(
          HERO_MOCKUP_ANIM.slideDurationSec,
          HERO_MOCKUP_ANIM.fadeDurationSec,
        ) +
        0.12) *
      1000;
    const id = window.setTimeout(() => {
      document.body.style.overflow = "";
    }, unlockMs);
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = "";
    };
  }, [introVisualDone]);

  return (
    <>
      {!fixedLayerGone && (
        <>
          {/* White scrim BELOW the bar so the loading strip is visible on white */}
          <div
            ref={whiteLayerRef}
            className="pointer-events-none fixed inset-0 z-[100] bg-white"
            aria-hidden
          />
          <div
            ref={introHostRef}
            className="pointer-events-none fixed inset-x-0 z-[200] flex flex-col items-center justify-center gap-8 px-4"
            style={{
              top: introHostTopPx,
              height: heroAvailableHeight,
            }}
          >
            <div
              ref={introLogoRef}
              className="flex shrink-0 items-center justify-center"
              style={{ opacity: 1 }}
              aria-hidden
            >
              <Image
                src={brandLogo}
                alt=""
                priority
                sizes="(max-width: 768px) 96px, 128px"
                className="h-auto w-24 md:w-32"
                style={{ height: "auto" }}
              />
            </div>
            <div
              ref={barTrackRef}
              className="relative shrink-0 overflow-hidden shadow-sm"
              style={{
                width: BAR_WIDTH_PX,
                height: BAR_HEIGHT_PX,
                borderRadius: 9999,
                backgroundColor: "#e8ecf4",
              }}
            >
              <div
                ref={barFillRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  background: `linear-gradient(90deg, ${GRADIENT_FROM} 0%, ${GRADIENT_TO} 100%)`,
                  transformOrigin: "left center",
                  transform: "scaleX(0)",
                }}
              />
            </div>
          </div>
        </>
      )}

      <section
        ref={heroSectionRef}
        className="relative flex items-center justify-center bg-white pt-32 px-4"
        style={{ minHeight: heroAvailableHeight }}
        aria-label="Hero"
      >
        {introVisualDone && panelSize && (
          <motion.div
            initial={false}
            animate={{ y: titleVisible ? HERO_TITLE_REVEAL.panelShiftYPx : 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full"
            style={{ maxWidth: panelSize.w }}
          >
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{
                opacity: titleVisible ? 1 : 0,
                y: titleVisible ? 0 : -12,
              }}
              transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-none relative z-20 w-full overflow-hidden text-center text-black"
              style={{
                maxHeight: titleVisible ? "clamp(6rem, 19vw, 14rem)" : 0,
                marginBottom: 0,
              }}
              aria-hidden
            >
              <div className="text-[clamp(2.4rem,7.4vw,146px)] font-light leading-[0.95] tracking-[0.01em]">
                Smart Tech.
              </div>
              {/*
                "Meaningful Connections." — bolder treatment:
                  1. Higher-weight gradient headline with stronger contrast
                  2. Thick straight accent line (no cozy wave)
                  3. Pulsing spark dots for subtle energy
              */}
              <div className="relative mt-1 text-[clamp(1.2rem,3.5vw,70px)] font-semibold leading-[0.9] tracking-[0.02em] uppercase">
                <span
                  className="hero-gradient-flow-text"
                  style={{
                    background:
                      "linear-gradient(90deg, #0B2FA6 0%, #2D6DFC 34%, #614EF8 68%, #0C2A88 100%)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  Meaningful Connections.
                </span>

                {/* ② Bold underline accent — draws left to right */}
                <motion.span
                  className="pointer-events-none mx-auto mt-2 block h-[4px] w-[min(82%,560px)] rounded-full bg-gradient-to-r from-[#0E3CC8] via-[#2D6DFC] to-[#614EF8]"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={titleVisible ? { scaleX: 1, opacity: 1 } : { scaleX: 0, opacity: 0 }}
                  transition={{ duration: 0.75, delay: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: "left center" }}
                  aria-hidden
                />

                {/* ③ Spark dots — absolute, loop-pulse at different phases */}
                {(
                  [
                    { top: "-55%", left:  "3%",  delay: "0.3s",  size: 5, color: "#2D6DFC" },
                    { top: "-40%", left: "97%",  delay: "1.1s",  size: 4, color: "#614EF8" },
                    { top:  "75%", left: "88%",  delay: "0.7s",  size: 3, color: "#A78BFA" },
                    { top:  "80%", left:  "1%",  delay: "1.6s",  size: 3, color: "#2D6DFC" },
                  ] as const
                ).map((dot, i) => (
                  <span
                    key={i}
                    className="pointer-events-none absolute rounded-full"
                    style={{
                      top: dot.top,
                      left: dot.left,
                      width: dot.size,
                      height: dot.size,
                      backgroundColor: dot.color,
                      opacity: titleVisible ? undefined : 0,
                      animation: titleVisible
                        ? `hero-dot-pulse 2.4s ${dot.delay} ease-in-out infinite`
                        : "none",
                    }}
                    aria-hidden
                  />
                ))}
              </div>
            </motion.div>

            <div
              ref={inFlowWrapperRef}
              className="relative mx-auto w-full"
            >
            <div
              className="relative isolate mx-auto w-full"
              style={{
                minHeight: heroFrameHeight,
                transform: "translateZ(0)",
              }}
            >
              {/*
                Clip frame + gradient are plain DOM (no layoutId) so Framer never re-projects the panel when the mockup moves.
              */}
              <div
                className="pointer-events-none absolute inset-0 z-[1] overflow-hidden"
                style={{
                  height: heroFrameHeight,
                  borderTopLeftRadius: PANEL_RADIUS_PX,
                  borderTopRightRadius: PANEL_RADIUS_PX,
                  transform: "translateZ(0)",
                }}
                aria-hidden
              >
                <div
                  ref={inFlowGradientRef}
                  className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto w-full shadow-[0_28px_90px_rgba(45,109,252,0.28)]"
                  style={{
                    // Match fixed morph end state: taller upward, same bottom line.
                    height: panelVisualHeightPx(panelSize.h, isPhoneViewport),
                    borderRadius: PANEL_RADIUS_PX,
                    background: `linear-gradient(90deg, ${GRADIENT_FROM} 0%, ${GRADIENT_TO} 100%)`,
                    transform: "translateZ(0)",
                    backfaceVisibility: "hidden",
                  }}
                  aria-hidden
                />
                <motion.div
                  className="absolute bottom-0 left-0 right-0 flex justify-center px-2 pb-1 md:px-3"
                  initial={{
                    y: "100%",
                    opacity: HERO_MOCKUP_ANIM.initialOpacity,
                  }}
                  animate={{
                    y: 0,
                    opacity: HERO_MOCKUP_ANIM.finalOpacity,
                  }}
                  transition={{
                    delay: HERO_MOCKUP_ANIM.delaySec,
                    y: {
                      duration: HERO_MOCKUP_ANIM.slideDurationSec,
                      ease: HERO_MOCKUP_ANIM.slideEase,
                    },
                    opacity: {
                      duration: HERO_MOCKUP_ANIM.fadeDurationSec,
                      ease: HERO_MOCKUP_ANIM.fadeEase,
                    },
                  }}
                >
                  <motion.div
                    className="flex w-full justify-center"
                    initial={{ y: HERO_MOCKUP_ANIM.restOffsetYPx }}
                    animate={
                      prefersReducedMotion
                        ? { y: HERO_MOCKUP_ANIM.restOffsetYPx }
                        : {
                            y: [
                              HERO_MOCKUP_ANIM.restOffsetYPx,
                              HERO_MOCKUP_ANIM.restOffsetYPx -
                                HERO_MOCKUP_ANIM.floatRangePx,
                            ],
                          }
                    }
                    transition={
                      prefersReducedMotion
                        ? { duration: 0 }
                        : {
                            y: {
                              duration:
                                HERO_MOCKUP_ANIM.floatDurationSec / 2,
                              repeat: Infinity,
                              repeatType: "mirror",
                              ease: "easeInOut",
                              delay:
                                HERO_MOCKUP_ANIM.delaySec +
                                HERO_MOCKUP_ANIM.slideDurationSec +
                                HERO_MOCKUP_ANIM.floatDelayAfterSlideSec,
                            },
                          }
                    }
                  >
                    <div className="w-full max-w-[220px] md:max-w-[920px]">
                      <div className="overflow-hidden rounded-[11px] border-[9px] border-zinc-950 bg-zinc-950 shadow-[0_28px_70px_-8px_rgba(0,0,0,0.55)] ring-1 ring-white/10 md:rounded-[15px] md:border-[11px]">
                        <Image
                          src={heroBannerMobile}
                          alt={t("home.hero.bannerAlt")}
                          width={heroBannerMobile.width}
                          height={heroBannerMobile.height}
                          className="block h-auto w-full md:hidden"
                          priority
                          sizes="100vw"
                          style={{
                            transform: "translateZ(0)",
                            backfaceVisibility: "hidden",
                          }}
                        />
                        <Image
                          src={heroBanner}
                          alt={t("home.hero.bannerAlt")}
                          width={heroBanner.width}
                          height={heroBanner.height}
                          className="hidden h-auto w-full md:block"
                          priority
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 920px"
                          style={{
                            transform: "translateZ(0)",
                            backfaceVisibility: "hidden",
                          }}
                        />
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </div>
            </div>
            </div>
          </motion.div>
        )}
      </section>
    </>
  );
};

export default Hero;
