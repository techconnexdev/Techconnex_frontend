"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize } from "lucide-react";
import { videoPlayerConfig } from "./config";
import { useI18n } from "@/contexts/I18nProvider";

const HERO_RECTANGLE_FROM = "#2D6DFC";
const HERO_RECTANGLE_TO = "#614EF8";

export default function VideoPlayer() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPoster, setShowPoster] = useState(true);
  const useLocalVideo = Boolean(videoPlayerConfig.videoSrc);

  const togglePlay = () => {
    if (useLocalVideo && videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
        setShowPoster(false);
      } else {
        videoRef.current.pause();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (useLocalVideo && videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const enterFullscreen = () => {
    const target = useLocalVideo ? videoRef.current : videoContainerRef.current;
    if (target?.requestFullscreen) {
      target.requestFullscreen();
    }
  };

  // Sync play state with video element (local video only)
  useEffect(() => {
    if (!useLocalVideo || !videoRef.current) return;
    const video = videoRef.current;
    const onPlay = () => {
      setIsPlaying(true);
      setShowPoster(false);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setShowPoster(true);
    };
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("ended", onEnded);
    };
  }, [useLocalVideo]);

  useEffect(() => {
    if (!useLocalVideo || !videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted, useLocalVideo]);

  // If no video to show, don't render
  if (
    !videoPlayerConfig.videoSrc &&
    !videoPlayerConfig.videoUrl &&
    !videoPlayerConfig.posterImage
  ) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full min-h-screen pt-10 md:pt-14 flex flex-col items-center justify-center "
    >
      {/* Content */}
      <div className="relative z-5 mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <span
          ref={labelRef}
          className="block text-center font-mono text-xs md:text-sm tracking-[0.3em] text-[#185df9] mb-4 font-medium"
        >
          {t("home.video.sectionLabel")}
        </span>

        {/* Section Title */}
        <h2
          ref={titleRef}
          className="text-4xl font-semibold !leading-tight mb-4 md:text-5xl md:mb-5 lg:text-6xl text-center text-gray-900 tracking-tight"
        >
          {t("home.video.sectionTitle")}
        </h2>

        {/* Video Container — elevated card with glow */}
        <div className="relative">
          {/* Static hero-like rectangle behind the video (no animation) */}
          <div
            className="pointer-events-none absolute left-1/2 top-[60%] z-0 w-full -translate-x-1/2 -translate-y-1/2 rounded-[40px] shadow-[0_28px_90px_rgba(45,109,252,0.28)]"
            style={{
              width: "min(94vw, 1240px)",
              height: "min(32vw, 370px)",
              background: `linear-gradient(90deg, ${HERO_RECTANGLE_FROM} 0%, ${HERO_RECTANGLE_TO} 100%)`,
            }}
            aria-hidden
          />
          <div
            ref={videoContainerRef}
            className="relative z-10 w-full aspect-video overflow-hidden rounded-2xl border border-blue-200/50 bg-transparent shadow-2xl shadow-blue-900/20 ring-2 ring-blue-200/30 md:rounded-3xl"
          >
            {/* Local MP4 video */}
            {useLocalVideo && videoPlayerConfig.videoSrc ? (
              <>
                <video
                  ref={videoRef}
                  src={videoPlayerConfig.videoSrc}
                  poster={videoPlayerConfig.posterImage}
                  className="absolute inset-0 h-full w-full object-contain"
                  style={{ backgroundColor: "transparent" }}
                  playsInline
                  loop={false}
                  muted={isMuted}
                  onClick={togglePlay}
                  preload="metadata"
                />
                {/* Poster overlay with play button (hidden once playing) */}
                {showPoster && (
                  <div
                    className="absolute inset-0 cursor-pointer bg-contain bg-center bg-no-repeat"
                    style={{
                      backgroundImage: `url(${videoPlayerConfig.posterImage})`,
                      backgroundColor: "transparent",
                    }}
                    onClick={togglePlay}
                    aria-hidden
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      {/* Play button with subtle pulse ring */}
                      <div className="relative flex items-center justify-center p-6">
                        <div className="relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-white/30 bg-[#185df9] shadow-xl shadow-blue-700/30 md:h-24 md:w-24">
                          <Play
                            className="w-8 h-8 md:w-10 md:h-10 text-white ml-1"
                            fill="white"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : videoPlayerConfig.videoUrl ? (
              <iframe
                src={`${videoPlayerConfig.videoUrl}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&rel=0`}
                title={t("home.video.iframeTitle")}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div
                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                style={{
                  backgroundImage: `url(${videoPlayerConfig.posterImage})`,
                  backgroundColor: "transparent",
                }}
              >
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <button
                      onClick={togglePlay}
                      className="flex h-20 w-20 items-center justify-center rounded-full bg-[#185df9] md:h-24 md:w-24"
                    >
                      <Play
                        className="w-8 h-8 md:w-10 md:h-10 text-white ml-1"
                        fill="white"
                      />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Custom controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={toggleMute}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5 text-white" />
                    ) : (
                      <Volume2 className="w-5 h-5 text-white" />
                    )}
                  </button>
                </div>
                <button
                  onClick={enterFullscreen}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
                >
                  <Maximize className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <p
          ref={descriptionRef}
          className="text-center text-gray-600 md:text-xl mx-auto mt-8 md:mt-12 leading-relaxed"
        >
          {t("home.video.description")}
        </p>

        {/* CTA Buttons */}
        {/* <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
          <a
            href="#features"
            className="px-8 py-4 bg-[#185df9] text-white font-display text-sm tracking-wider rounded-full hover:bg-[#4d85ff] transition-all duration-300 hover:scale-105"
          >
            EXPLORE FEATURES
          </a>
          <a
            href="#talent"
            className="px-8 py-4 border border-white/20 text-white font-display text-sm tracking-wider rounded-full hover:bg-white/10 transition-all duration-300"
          >
            BROWSE TALENT
          </a>
        </div> */}
      </div>
    </section>
  );
}
