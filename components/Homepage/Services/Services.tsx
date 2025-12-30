"use client";
import Section from "./Section";
import Heading from "./Heading";
import {
  service1,
  service2,
  service22,
  service3,
  check,
} from "@/public/assets";
import { brainwaveServices, brainwaveServicesIcons } from "@/constants";
import {
  Gradient,
} from "./Design";
import Generating from "./Generating";
import { motion, Variants } from "framer-motion";
import { useState, useEffect } from "react";

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

const textVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 50,
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      delay: 0.3,
    },
  },
};

const listItemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

const iconVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      type: "spring",
      stiffness: 200,
    },
  }),
};

const Services = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsSmallScreen(window.innerWidth < 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <Section id="ai-intelligence">
      <div className="container">
        <Heading
          title="The Intelligence Behind the Connection."
          text="Beyond simple search, our AI understands your project needs and skill sets to create the perfect match instantly."
        />

        <motion.div
          className="relative"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <motion.div
            className="relative z-1 flex items-center h-[36rem] mb-5 p-8 bg-card/60 backdrop-blur-3xl border border-border rounded-3xl overflow-hidden shadow-lg lg:p-20 xl:h-[38rem]"
            variants={cardVariants}
            whileHover={{ scale: 1.01, transition: { duration: 0.2 } }}
          >
            <motion.div
              className="absolute top-16 left-12 max-sm:-left-80 max-md:-left-80 w-full h-full pointer-events-none md:top-20 md:w-3/5 xl:w-auto"
              variants={imageVariants}
            >
              <img
                className=" md:object-right"
                width={800}
                alt="Smartest AI"
                height={730}
                src={service1.src}
              />
            </motion.div>

            <motion.div
              className="relative z-1 max-w-[17rem] ml-auto"
              variants={textVariants}
            >
              <h4 className="h4 mb-4">Precision Recommendations</h4>
              <p className="body-2 mb-[3rem] text-muted-foreground">
                Our AI analyzes project requirements against provider skills,
                past performance, and availability to provide a &quot;Match Score&quot;.
              </p>
              <ul className="body-2">
                {brainwaveServices.map((item, index) => (
                  <motion.li
                    key={index}
                    className="flex items-start py-4 border-t border-border"
                    variants={listItemVariants}
                    custom={index}
                    whileHover={{ x: 5, transition: { duration: 0.2 } }}
                  >
                    <img width={24} height={24} src={check.src} alt="check" />
                    <p className="ml-4">{item}</p>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="absolute left-4 right-4 bottom-4 lg:left-1/2 lg-right-auto lg:bottom-8 lg:-translate-x-1/2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <Generating className="border-border border" />
            </motion.div>
          </motion.div>

          <motion.div
            className="relative z-1 grid gap-5 lg:grid-cols-2"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            <motion.div
              className="relative min-h-[39rem] max-sm:h-[44rem] bg-card/60 backdrop-blur-3xl border border-border rounded-3xl overflow-hidden shadow-lg"
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5, transition: { duration: 0.3 } }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              <motion.div
                className="absolute inset-0 flex items-center justify-center pb-40"
                variants={imageVariants}
              >
                <img
                  src={
                    !isSmallScreen && isHovered ? service2.src : service22.src
                  }
                  className="w-auto h-[70%] max-h-[500px] object-contain transition-opacity duration-300"
                  width={400}
                  height={550}
                  alt="robot"
                />
              </motion.div>

              <motion.div
                className="absolute inset-0 flex flex-col justify-end p-8 bg-gradient-to-b from-n-8/0 to-n-8/90 lg:p-15"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <h4 className="h4 mb-4">Just Hover!</h4>
                <p className="body-2 mb-[3rem] text-n-3">
                  Our AI-driven engine extracts and highlights the most relevant
                  details from any profile, allowing you to vet, compare, and
                  decide with unparalleled speed and accuracy.{" "}
                </p>
              </motion.div>

              {/* <PhotoChatMessage /> */}
            </motion.div>

            <motion.div
              className="p-4 bg-card/60 backdrop-blur-3xl border border-border rounded-3xl overflow-hidden shadow-lg lg:min-h-[46rem]"
              variants={cardVariants}
              whileHover={{ scale: 1.02, y: -5, transition: { duration: 0.3 } }}
            >
              <motion.div
                className="py-12 px-4 xl:px-8"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <h4 className="h4 mb-4">Smart Data Extraction</h4>
                <p className="body-2 mb-[2rem] text-n-3">
                  Whether you are a company uploading a project brief or a
                  provider submitting a proposal, our AI analyzes your documents
                  in seconds to streamline your workflow.
                </p>

                <motion.ul
                  className="flex items-center justify-between"
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {brainwaveServicesIcons.map((item, index) => (
                    <motion.li
                      key={index}
                      className={`rounded-2xl flex items-center justify-center ${
                        index === 2
                          ? "w-[3rem] h-[3rem] p-0.25 bg-conic-gradient md:w-[4.5rem] md:h-[4.5rem]"
                          : "flex w-10 h-10 bg-muted md:w-15 md:h-15"
                      }`}
                      variants={iconVariants}
                      custom={index}
                      whileHover={{
                        scale: 1.1,
                        rotate: 5,
                        transition: { duration: 0.2 },
                      }}
                    >
                      <div
                        className={
                          index === 2
                            ? "flex items-center justify-center w-full h-full bg-card rounded-[1rem]"
                            : ""
                        }
                      >
                        <img src={item.src} width={24} height={24} alt="icon" />
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>

              <motion.div
                className="relative h-[20rem] bg-secondary/50 rounded-xl overflow-hidden border border-border md:h-[25rem]"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.8, duration: 0.6, ease: "easeOut" }}
                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
              >
                <img
                  src={service3.src}
                  className="w-full h-full object-contain"
                  width={520}
                  height={400}
                  alt="Scary robot"
                />

                {/* <VideoChatMessage /> */}
                {/* <VideoBar /> */}
              </motion.div>
            </motion.div>
          </motion.div>

          <Gradient />
        </motion.div>
      </div>
    </Section>
  );
};

export default Services;
