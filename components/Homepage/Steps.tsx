import React from "react";
import Section from "./Services/Section";
import { FeatureCarousel } from "../animated-feature-carousel";
import { service2, job, milestone } from "@/public/assets";
import Heading from "./Services/Heading";

const Steps = () => {
  const images = {
    alt: "Feature screenshot",
    step1img1: service2.src,
    step1img2: job.src,
    step2img1: "/homepage/AI.png",
    step2img2: "/homepage/AI.png",
    step3img: milestone.src,
    step4img: "/assets/escrow.png",
    step5img: "/homepage/approved.png",
    step6img: "/assets/amount.jpg",
  };
  return (
    <Section id="steps">
      <div className="pt-32 md:pt-14">
        <Heading
          tag="Steps"
          title={"Simple Steps to Start Your Project"}
          text={
            "Our milestone and escrow system guarantees security and full transparency for both clients and freelancers."
          }
        />
        <div className="w-full font-sans">
          <FeatureCarousel image={images} />
        </div>
      </div>
    </Section>
  );
};

export default Steps;
