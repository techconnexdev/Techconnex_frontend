"use client";
import { heroData } from "@/constants";
import React from "react";
import { Button } from "../ui/button";
import { heroBanner } from "@/public/assets";
import { useRef } from "react";
import {
  motion,
  Variants,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";

const heroVariant: Variants = {
  start: {},
  end: {
    transition: { staggerChildren: 0.4 },
  },
};

const heroChildVariant: Variants = {
  start: { y: 30, opacity: 0, filter: "blur(5px)" },
  end: {
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: { duration: 0.7, ease: "easeOut" },
  },
};

const Hero = () => {
  const heroBannerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroBannerRef,
    offset: ["start 1080px", "50% start"],
  });

  const scrollYTransform = useTransform(scrollYProgress, [0, 1], [0.85, 1.15]);

  const scale = useSpring(scrollYTransform, {
    stiffness: 300,
    damping: 30,
    restDelta: 0.001,
  });

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerHeight = 80; // Approximate header height for offset
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-10 md:py-16">
      <motion.div
        variants={heroVariant}
        initial="start"
        animate="end"
        className="container text-center"
      >
        <div className="max-w-screen-md mx-auto">
          <motion.p
            variants={heroChildVariant}
            initial="start"
            animate="end"
            className="text-sm uppercase tracking-wider bg-white/80 text-gray-700 max-w-max mx-auto px-3 py-1 rounded-full 
          border border-blue-200/50 backdrop-blur-md shadow-sm mb-6 md:mb-10"
          >
            {heroData.sectionSubtitle}
          </motion.p>
          <motion.h2
            variants={heroChildVariant}
            className="text-4xl font-semibold !leading-tight mb-4 md:text-5xl md:mb-5 lg:text-6xl"
          >
            {heroData.sectionTitle}
            <span className="relative isolate ms-4">
              {heroData.decoTitle}
              <span
                className="absolute -z-10 top-2 -left-6 -right-4 bottom-0.5 bg-gradient-to-r from-blue-100/60 to-orange-100/60 rounded-full px-8 ms-3 border border-blue-200/30 
              shadow-[inset_0px_0px_30px_0px] shadow-blue-200/30 md:top-3 md:bottom-1 lg:top-4 lg:bottom-2"
              ></span>
            </span>
          </motion.h2>
          <motion.p
            variants={heroChildVariant}
            className="text-muted-foreground md:text-xl"
          >
            {heroData.sectionText}
          </motion.p>
          <motion.div
            variants={heroChildVariant}
            className="flex justify-center gap-4 mt-6 md:mt-10"
          >
            <Link href="/auth/register">
              <Button>Connect with Talent</Button>
            </Link>
            <Button
              variant={"ghost"}
              onClick={() => scrollToSection("features")}
            >
              Explore Our Tech
            </Button>
          </motion.div>
        </div>
        <div className="relative mt-12 max-w-screen-xl mx-auto isolate rounded-xl md:mt-16">
          <motion.figure
            className="bg-white/80 border border-blue-200/50 backdrop-blur-md rounded-xl shadow-2xl overflow-hidden"
            initial={{
              y: 120,
              opacity: 0,
              filter: "blur(5px)",
            }}
            animate={{
              y: 0,
              opacity: 1,
              filter: "blur(0px)",
            }}
            transition={{
              duration: 1.5,
              delay: 0.5,
              ease: "backInOut",
            }}
            ref={heroBannerRef}
            style={{ scale }}
          >
            <img
              src={
                typeof heroBanner === "string"
                  ? heroBanner
                  : (heroBanner as { src: string }).src
              }
              alt="TechConnex Dashboard"
              className="w-full h-auto"
              loading="eager"
              style={{
                imageRendering: "auto",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
              }}
            />
          </motion.figure>
          <motion.div
            className="absolute bg-blue-400/20 inset-5 blur-[50px] -z-10"
            initial={{
              scale: 0.8,
              opacity: 0,
            }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 0.5, ease: "backInOut" }}
          ></motion.div>
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-700/15 to-blue-700 blur-[200px] scale-y-75 scale-x-125 rounded-full -z-10"
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 2, delay: 1.5, ease: "backOut" }}
          ></motion.div>
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
