"use client";

import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import productImage from "@/public/assets/product-image.png";
import { ComponentPropsWithoutRef, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  ValueAnimationTransition,
} from "framer-motion";

const tabs = [
  {
    icon: "/assets/lottie/vroom.lottie",
    title: "User-friendly dashboard",
    isNew: false,
    backgroundPositionX: 0,
    backgroundPositionY: 0,
    backgroundSizeX: 110,
  },
  {
    icon: "/assets/lottie/click.lottie",
    title: "Performance Analytics",
    isNew: false,
    backgroundPositionX: 100,
    backgroundPositionY: 27,
    backgroundSizeX: 177,
  },
  {
    icon: "/assets/lottie/stars.lottie",
    title: "Smart AI Matching",
    isNew: true,

    backgroundPositionX: 98,
    backgroundPositionY: 100,
    backgroundSizeX: 135,
  },
];

const FeatureTab = (
  probs: (typeof tabs)[number] &
    ComponentPropsWithoutRef<"div"> & { selected: boolean }
) => {
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
      className="relative border border-blue-700/15 flex p-2.5 rounded-xl gap-2.5 items-center lg:flex-1 overflow-hidden"
      onClick={probs.onClick}
    >
      {probs.selected && (
        <motion.div
          style={{ maskImage: maskImage }}
          className="absolute inset-0 -m-px border-2 border-blue-700 rounded-xl pointer-events-none"
        ></motion.div>
      )}

      <div className="h-12 w-12 border-blue-700/15 rounded-lg inline-flex items-center justify-center">
        <DotLottieReact
          dotLottieRefCallback={(dotLottie) => {
            dotlottieRef.current = dotLottie;
          }}
          src={probs.icon}
          className="h-5 w-5 invert"
          autoplay
        ></DotLottieReact>
      </div>
      <div className="font-medium ">{probs.title}</div>
      {probs.isNew && (
        <div className="text-xs rounded-full px-2 py-0.5 bg-blue-300 text-blue font-semibold">
          New
        </div>
      )}
    </div>
  );
};

export const Features = () => {
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
      animateOptions
    );
    animate(
      backgroundPositionX,
      [backgroundPositionX.get(), tabs[index].backgroundPositionX],
      animateOptions
    );
    animate(
      backgroundPositionY,
      [backgroundPositionY.get(), tabs[index].backgroundPositionY],
      animateOptions
    );
  };

  return (
    <section id="features" className="py-60">
      <div className="container">
        <h2 className="text-5xl md:text-6xl font-medium text-center tracking-tighter">
          Focus on the Work, Not the Hustle.
        </h2>
        <p className="text-gray-950 text-lg md:text-xl max-w-2xl mx-auto tracking-tight text-center mt-5">
          Stop fighting for attention in bidding wars. Our AI finds the projects
          that fit your skills, while our smart dashboard handles the admin,
          earnings, and milestones for you.
        </p>
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
        <div className="border border-blue-700/20 p-2.5 rounded-xl mt-3">
          <motion.div
            className="aspect-video bg-cover border-blue-700/20 rounded-lg"
            style={{
              backgroundPosition,
              backgroundSize,
              backgroundImage: `url(${productImage.src})`,
            }}
          ></motion.div>
        </div>
      </div>
    </section>
  );
};
