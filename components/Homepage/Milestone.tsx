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
      className="bg-gradient-to-b from bg-white to-blue-700 py-20"
    >
      <div className="container">
        <h2 className="text-5xl md:text-6xl font-medium text-center tracking-tighter">
          Tech the Milestone. Connect the Result.
        </h2>
        <p className="text-gray-950 text-lg md:text-xl max-w-2xl mx-auto tracking-tight text-center mt-5">
          No more guessing games. Connect with partners through a
          milestone-driven workflow where progress is updated in real-time,
          giving both sides the confidence to focus on high-quality execution.
        </p>
        <motion.div
          style={{
            opacity: opacity,
            rotateX: rotateX,
            transformPerspective: "800px",
          }}
        >
          <Image
            src={milestone}
            alt="milestone"
            className="mt-14"
            ref={appImage}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Milestone;
