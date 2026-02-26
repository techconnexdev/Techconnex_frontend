"use client";

import React from "react";
import { WobbleCard } from "../ui/wobble-card";

export function WobbleCardDemo() {
  return (
    <div
      id="about"
      className="relative bg-gradient-to-b from-blue-50/50 via-white to-blue-50/60 py-20 px-4 overflow-hidden"
    >
      {/* Subtle gradient overlays for consistent blue accent */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#185df9]/10 via-transparent to-blue-400/5 pointer-events-none" aria-hidden />
      <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-transparent to-[#185df9]/5 pointer-events-none" aria-hidden />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full relative">
        <WobbleCard
          containerClassName="col-span-1 lg:col-span-2 h-full bg-white/90 backdrop-blur-md border border-blue-200/50 min-h-[500px] lg:min-h-[300px] shadow-xl relative overflow-hidden"
          className=""
        >
          {/* Blue accent gradient */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#185df9]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" aria-hidden />

          <div className="max-w-xs relative">
            <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-gray-900">
              Tech that Thinks Ahead.
            </h2>
            <p className="mt-4 text-left text-base/6 text-gray-600">
              Leverage an AI layer that summarizes project scopes, optimizes
              costs, and provides real-time performance analytics. Focus on
              high-value execution while our Tech handles the insights{" "}
            </p>
          </div>
          <img
            src="/assets/hero-banner.jpg"
            width={500}
            height={500}
            alt="linear demo image"
            className="absolute -right-4 lg:-right-[40%] grayscale filter -bottom-10 object-contain rounded-2xl opacity-80"
          />
        </WobbleCard>
        <WobbleCard containerClassName="col-span-1 min-h-[300px] bg-white/90 backdrop-blur-md border border-blue-200/50 shadow-xl relative overflow-hidden">
          {/* Blue accent gradient */}
          <div className="absolute top-0 left-0 w-48 h-48 bg-[#185df9]/20 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" aria-hidden />

          <div className="relative">
            <h2 className="max-w-80 text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-gray-900">
              Connect with Certainty.
            </h2>
            <p className="mt-4 max-w-[26rem] text-left text-base/6 text-gray-600">
              Build partnerships on a foundation of trust. Our Tech uses e-KYC
              verification and automated escrow to ensure every Connection is
              legitimate and every payment is protected.{" "}
            </p>
          </div>
        </WobbleCard>
        <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-white/90 backdrop-blur-md border border-blue-200/50 shadow-xl min-h-[500px] lg:min-h-[600px] xl:min-h-[300px] relative overflow-hidden">
          {/* Blue gradient accents */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#185df9]/15 rounded-full blur-3xl -translate-y-1/2 -translate-x-1/2" aria-hidden />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl translate-y-1/2 translate-x-1/2" aria-hidden />

          <div className="max-w-sm relative">
            <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-gray-900">
              Tech the Vision. Connect the Ecosystem.
            </h2>
            <p className="mt-4 max-w-[26rem] text-left text-base/6 text-gray-600">
              Join a smart, AI-assisted space where companies, universities, and
              talent thrive together. From academic verification to enterprise
              dashboards, we provide the Tech to Connect your ambition to the
              global market.
            </p>
          </div>
          <img
            src="/assets/Milestone.png"
            width={500}
            height={500}
            alt="linear demo image"
            className="absolute -right-10 md:-right-[40%] lg:-right-[10%] -bottom-10 object-contain rounded-2xl opacity-80"
          />
        </WobbleCard>
      </div>
    </div>
  );
}
