"use client";
import Image from "next/image";
import React, { useRef } from "react";
import { milestone } from "@/public/assets";
import { motion, useScroll, useTransform } from "framer-motion";

const Milestone = () => {
  const appImage = useRef<HTMLImageElement>(null);
  const { scrollYProgress } = useScroll({
    target: appImage,
    offset: ["start end", "end end"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [14, 0]);
  const opacity = useTransform(scrollYProgress, [0, 1], [0.5, 1]);

  return (
    <div
      id="milestones"
      className="relative py-24 md:py-32 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-blue-50/50"
    >
      {/* Blurred background circles */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(85vw,600px)] h-[600px] rounded-full bg-blue-600/20 blur-[100px] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute bottom-0 right-1/4 w-[380px] h-[380px] rounded-full bg-blue-500/15 blur-[80px] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute top-1/3 left-0 w-[280px] h-[280px] rounded-full bg-blue-700/15 blur-[70px] pointer-events-none"
        aria-hidden
      />

      {/* Soft bottom edge to blend into next section */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-100/20 pointer-events-none" aria-hidden />

      <div className="container relative">
        <p className="text-center font-mono text-xs md:text-sm tracking-[0.25em] text-[#185df9] mb-4 uppercase">
          Milestone-driven
        </p>
        <h2 className="text-4xl font-semibold !leading-tight mb-4 md:text-5xl md:mb-5 lg:text-6xl text-center text-gray-900 tracking-tight">
          Tech the Milestone. Connect the Result.
        </h2>
        <p className="text-center text-gray-600 md:text-xl mx-auto mt-8 md:mt-12 leading-relaxed">
          No more guessing games. Connect with partners through a
          milestone-driven workflow where progress is updated in real-time,
          giving both sides the confidence to focus on high-quality execution.
        </p>

        {/* Glassy image container */}
        <motion.div
          style={{
            opacity,
            rotateX,
            transformPerspective: "800px",
          }}
          className="mt-14 md:mt-16 mx-auto"
        >
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden bg-slate-200/40 backdrop-blur-xl border border-slate-300/50 shadow-[0_8px_32px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.5)] p-2 md:p-3">
            <Image
              src={milestone}
              alt="Milestone-driven workflow"
              className="w-full h-auto rounded-xl md:rounded-2xl"
              ref={appImage}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Milestone;
