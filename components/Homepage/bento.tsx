"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { service2, service22 } from "@/public/assets";
import { brainwaveServicesIcons } from "@/constants";
import { useI18n } from "@/contexts/I18nProvider";
import Heading from "./Services/Heading";
import Section from "./Services/Section";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const cardVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 50,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const imageVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    x: -50,
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut",
      delay: 0.2,
    },
  },
};

/** Glass panels read on the gradient plate behind the grid */
const tileShell =
  "absolute inset-px rounded-lg bg-white/15 ring-1 ring-inset ring-white/25 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]";
const tileRing =
  "pointer-events-none absolute inset-px rounded-lg shadow-lg shadow-black/10 ring-1 ring-inset ring-white/30";
const bodyMuted = "text-blue-100/85";

export default function Bento() {
  const { t } = useI18n();
  const [isHovered, setIsHovered] = useState(false);
  const [isSmartCardHovered, setIsSmartCardHovered] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);
  const [mobileInsightsExpanded, setMobileInsightsExpanded] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <Section id="ai-intelligence">
      <div className="container pt-20 md:pt-14">
        <Heading
          title={t("home.services.headingTitle")}
          text={t("home.services.headingText")}
        />

        <motion.div
          className="relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="relative mt-10 sm:mt-16">
            <div
              className="pointer-events-none absolute -m-10 inset-0 rounded-[1.75rem] bg-gradient-to-br from-[#2D6DFC] to-[#614EF8] shadow-[0_24px_80px_-12px_rgba(45,109,252,0.45)] sm:rounded-[2rem]"
              aria-hidden
            />
            <div className="relative z-10 grid gap-4 lg:grid-cols-3 lg:grid-rows-2">
              <div className="relative lg:row-span-2">
                <div className={`${tileShell} lg:rounded-l-4xl`} />
                <motion.div
                  className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] lg:rounded-l-[calc(2rem+1px)]"
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  whileHover={{
                    scale: 1.02,
                    y: -5,
                    transition: { duration: 0.3 },
                  }}
                >
                  <div className="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                    <p className="mt-2 text-lg font-medium tracking-tight text-white max-lg:text-center">
                      Precision Recommendations
                    </p>
                    <p
                      className={`mt-2 max-w-lg text-sm/6 max-lg:text-center ${bodyMuted}`}
                    >
                      Our AI analyzes project requirements against provider
                      skills, past performance, and availability to provide a
                      "Match Score".
                    </p>
                  </div>
                  <div className="relative mt-8 flex min-h-[16rem] w-full flex-1 items-center justify-center px-6 pb-10 sm:mt-10 sm:min-h-[20rem]">
                    <motion.img
                      src="/homepage/AI.png"
                      alt="AI match insights preview"
                      className="h-auto w-full max-w-[34rem] select-none object-contain drop-shadow-[0_18px_60px_rgba(0,0,0,0.35)]"
                      variants={imageVariants}
                    />
                  </div>
                </motion.div>
                <div className={`${tileRing} lg:rounded-l-4xl`} />
              </div>
              <div className="relative lg:row-span-2">
                <div className={`${tileShell}`} />
                <motion.div
                  className="relative flex h-full min-h-[28rem] flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] lg:rounded-l-[calc(2rem+1px)] max-sm:min-h-[36rem]"
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  whileHover={{
                    scale: 1.02,
                    y: -5,
                    transition: { duration: 0.3 },
                  }}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <div className="relative z-10 px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                    <p className="mt-2 text-lg font-medium tracking-tight text-white max-lg:text-center">
                      Just Hover!
                    </p>
                    <p
                      className={`mt-2 max-w-lg text-sm/6 max-lg:text-center ${bodyMuted}`}
                    >
                      Our AI-driven engine extracts and highlights the most
                      relevant details from any profile, allowing you to vet,
                      compare, and decide with unparalleled speed and accuracy.
                    </p>
                    <button
                      type="button"
                      onClick={() => setMobileInsightsExpanded((prev) => !prev)}
                      className="lg:hidden mt-4 w-full rounded-full bg-white/20 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-opacity hover:bg-white/30"
                    >
                      {mobileInsightsExpanded
                        ? t("home.services.hideInsights")
                        : t("home.services.showInsights")}
                    </button>
                  </div>
                  <div className="relative flex min-h-[14rem] w-full flex-1 items-center justify-center px-6 pb-10 pt-4 sm:min-h-[18rem] sm:pb-14">
                    <motion.div
                      className="flex w-full items-center justify-center"
                      variants={imageVariants}
                    >
                      <img
                        src={
                          isSmallScreen
                            ? mobileInsightsExpanded
                              ? service2.src
                              : service22.src
                            : isHovered
                              ? service2.src
                              : service22.src
                        }
                        className="h-auto max-h-[260px] w-auto max-w-full object-contain transition-opacity duration-300 drop-shadow-[0_16px_48px_rgba(0,0,0,0.35)] sm:max-h-[380px] lg:max-h-[440px]"
                        width={400}
                        height={550}
                        alt={t("home.services.robotAlt")}
                      />
                    </motion.div>
                  </div>
                </motion.div>
                <div className={`${tileRing}`} />
              </div>
              {/* <div className="relative max-lg:row-start-1">
              <div className={`${tileShell} max-lg:rounded-t-4xl`} />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-t-[calc(2rem+1px)]">
                <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                  <p className="mt-2 text-lg font-medium tracking-tight text-white max-lg:text-center">
                  Just Hover!
                  </p>
                  <p
                    className={`mt-2 max-w-lg text-sm/6 max-lg:text-center ${bodyMuted}`}
                  >
                    Our AI-driven engine extracts and highlights the most relevant details from any profile, allowing you to vet, compare, and decide with unparalleled speed and accuracy.
                  </p>
                </div>
                <div className="flex flex-1 items-center justify-center px-8 max-lg:pt-10 max-lg:pb-12 sm:px-10 lg:pb-2">
                  <img
                    alt=""
                    src="https://tailwindcss.com/plus-assets/img/component-images/dark-bento-03-performance.png"
                    className="w-full max-lg:max-w-xs drop-shadow-[0_12px_40px_rgba(0,0,0,0.25)]"
                  />
                </div>
              </div>
              <div className={`${tileRing} max-lg:rounded-t-4xl`} />
              </div>
              <div className="relative max-lg:row-start-3 lg:col-start-2 lg:row-start-2">
              <div className={tileShell} />
              <div className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)]">
                <div className="px-8 pt-8 sm:px-10 sm:pt-10">
                  <p className="mt-2 text-lg font-medium tracking-tight text-white max-lg:text-center">
                    Security
                  </p>
                  <p
                    className={`mt-2 max-w-lg text-sm/6 max-lg:text-center ${bodyMuted}`}
                  >
                    Morbi viverra dui mi arcu sed. Tellus semper adipiscing
                    suspendisse semper morbi.
                  </p>
                </div>
                <div className="@container flex flex-1 items-center max-lg:py-6 lg:pb-2">
                  <img
                    alt=""
                    src="https://tailwindcss.com/plus-assets/img/component-images/dark-bento-03-security.png"
                    className="h-[min(152px,40cqw)] object-cover drop-shadow-[0_8px_28px_rgba(0,0,0,0.2)]"
                  />
                </div>
              </div>
              <div className={tileRing} />
              </div> */}
              <div className="relative lg:row-span-2">
                <div
                  className={`${tileShell} max-lg:rounded-b-4xl lg:rounded-r-4xl`}
                />
                <motion.div
                  className="relative flex h-full flex-col overflow-hidden rounded-[calc(var(--radius-lg)+1px)] max-lg:rounded-b-[calc(2rem+1px)] lg:rounded-r-[calc(2rem+1px)]"
                  variants={cardVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  whileHover={{
                    scale: 1.02,
                    y: -5,
                    transition: { duration: 0.3 },
                  }}
                  onMouseEnter={() => setIsSmartCardHovered(true)}
                  onMouseLeave={() => setIsSmartCardHovered(false)}
                >
                  <div className="px-8 pt-8 pb-3 sm:px-10 sm:pt-10 sm:pb-0">
                    <p className="mt-2 text-lg font-medium tracking-tight text-white max-lg:text-center">
                      Smart Data Extraction
                    </p>
                    <p
                      className={`mt-2 max-w-lg text-sm/6 max-lg:text-center ${bodyMuted}`}
                    >
                      Whether you are a company uploading a project brief or a
                      provider submitting a proposal, our AI analyzes your
                      documents in seconds to streamline your workflow.
                    </p>
                    <motion.ul className="mt-5 flex items-center justify-start gap-3">
                      {brainwaveServicesIcons.map((item, index) => (
                        <motion.li
                          key={`${item.src}-${index}`}
                          className={`rounded-2xl flex items-center justify-center invert`}
                          initial={{ opacity: 0, y: 22 }}
                          animate={
                            isSmartCardHovered
                              ? { opacity: 1, y: 0 }
                              : { opacity: 0, y: 22 }
                          }
                          transition={{
                            duration: 0.28,
                            ease: "easeOut",
                            delay: index * 0.06,
                          }}
                          whileHover={{
                            scale: 1.1,
                            rotate: 5,
                            transition: { duration: 0.2 },
                          }}
                        >
                          <div
                            className={
                              index === 2
                                ? "flex items-center justify-center w-full h-full bg-[#1844B2] rounded-[1rem]"
                                : ""
                            }
                          >
                            <img
                              src={item.src}
                              width={24}
                              height={24}
                              alt={t("home.services.iconAlt")}
                            />
                          </div>
                        </motion.li>
                      ))}
                    </motion.ul>
                  </div>
                  <div className="relative min-h-120 w-full grow">
                    <div className="absolute top-10 right-0 bottom-0 left-10 overflow-hidden rounded-tl-xl bg-[#062f8c]/90 outline outline-white/15 ring-1 ring-white/10">
                      <img
                        src="/homepage/AI_doc.png"
                        alt="AI document extraction preview"
                        className="size-full object-cover object-left"
                      />
                    </div>
                  </div>
                </motion.div>
                <div
                  className={`${tileRing} max-lg:rounded-b-4xl lg:rounded-r-4xl`}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
