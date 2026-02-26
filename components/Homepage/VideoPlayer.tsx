"use client"
import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { videoPlayerConfig } from './config';

gsap.registerPlugin(ScrollTrigger);

export default function VideoPlayer() {
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

  useEffect(() => {
    const section = sectionRef.current;
    const title = titleRef.current;
    const label = labelRef.current;
    const videoContainer = videoContainerRef.current;
    const description = descriptionRef.current;

    if (!section || !title || !label || !videoContainer || !description) return;

    const ctx = gsap.context(() => {
      // Label animation
      gsap.fromTo(
        label,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Title animation
      gsap.fromTo(
        title,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 75%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Video container animation
      gsap.fromTo(
        videoContainer,
        { opacity: 0, scale: 0.95 },
        {
          opacity: 1,
          scale: 1,
          duration: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 70%',
            toggleActions: 'play none none reverse',
          },
        }
      );

      // Description animation
      gsap.fromTo(
        description,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 60%',
            toggleActions: 'play none none reverse',
          },
        }
      );
    }, section);

    return () => ctx.revert();
  }, []);

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
    const onPlay = () => { setIsPlaying(true); setShowPoster(false); };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => { setIsPlaying(false); setShowPoster(true); };
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
    };
  }, [useLocalVideo]);

  useEffect(() => {
    if (!useLocalVideo || !videoRef.current) return;
    videoRef.current.muted = isMuted;
  }, [isMuted, useLocalVideo]);

  // If no video to show, don't render
  if (!videoPlayerConfig.videoSrc && !videoPlayerConfig.videoUrl && !videoPlayerConfig.posterImage) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative w-full min-h-screen pt-24 md:pt-60 flex flex-col items-center justify-center "
    >

      <div
        className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-blue-500/20 blur-[80px] pointer-events-none"
        aria-hidden
      />
      <div
        className="absolute top-1/2 left-0 w-[320px] h-[320px] rounded-full bg-blue-700/15 blur-[70px] pointer-events-none"
        aria-hidden
      />

      {/* Secondary softer glow — adds depth */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full bg-blue-600/25 blur-[80px] pointer-events-none"
        aria-hidden
      />
      {/* Subtle blue accent (existing, kept for harmony) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#185df9]/10 rounded-full blur-[150px] pointer-events-none" aria-hidden />

      {/* Content */}
      <div className="relative z-5 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Label */}
        <span
          ref={labelRef}
          className="block text-center font-mono text-xs md:text-sm tracking-[0.3em] text-[#185df9] mb-4 font-medium"
        >
          {videoPlayerConfig.sectionLabel}
        </span>

        {/* Section Title */}
        <h2
          ref={titleRef}
          className="text-4xl font-semibold !leading-tight mb-4 md:text-5xl md:mb-5 lg:text-6xl text-center text-gray-900 tracking-tight"
        >
          {videoPlayerConfig.sectionTitle}
        </h2>

        {/* Video Container — elevated card with glow */}
        <div
          ref={videoContainerRef}
          className="relative w-full aspect-video rounded-2xl md:rounded-3xl overflow-hidden bg-[#0f172a] border border-blue-200/50 shadow-2xl shadow-blue-900/20 ring-2 ring-blue-200/30 transition-all duration-500 hover:shadow-blue-700/25 hover:ring-blue-300/40 hover:scale-[1.01]"
        >
          {/* Local MP4 video */}
          {useLocalVideo && videoPlayerConfig.videoSrc ? (
            <>
              <video
                ref={videoRef}
                src={videoPlayerConfig.videoSrc}
                poster={videoPlayerConfig.posterImage}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                loop={false}
                muted={isMuted}
                onClick={togglePlay}
                preload="metadata"
              />
              {/* Poster overlay with play button (hidden once playing) */}
              {showPoster && (
                <div
                  className="absolute inset-0 bg-cover bg-center cursor-pointer"
                  style={{ backgroundImage: `url(${videoPlayerConfig.posterImage})` }}
                  onClick={togglePlay}
                  aria-hidden
                >
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/35 transition-colors duration-300">
                    {/* Play button with subtle pulse ring */}
                    <div className="relative flex items-center justify-center p-6">
                      <span className="absolute inset-0 rounded-full bg-[#185df9]/35 animate-ping-slow" aria-hidden />
                      <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#185df9] flex items-center justify-center hover:bg-[#2563eb] transition-all duration-300 hover:scale-110 shadow-xl shadow-blue-700/30 border-2 border-white/30 hover:border-white/50">
                        <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : videoPlayerConfig.videoUrl ? (
            <iframe
              src={`${videoPlayerConfig.videoUrl}?autoplay=${isPlaying ? 1 : 0}&mute=${isMuted ? 1 : 0}&rel=0`}
              title="Techconnex Demo"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${videoPlayerConfig.posterImage})` }}
            >
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <button
                    onClick={togglePlay}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-[#185df9] flex items-center justify-center hover:bg-[#4d85ff] transition-all duration-300 hover:scale-110"
                  >
                    <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Custom controls overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 z-10 group/controls">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all duration-200 hover:scale-105"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
                <button
                  onClick={toggleMute}
                  className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all duration-200 hover:scale-105"
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
                className="w-10 h-10 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center hover:bg-white/25 transition-all duration-200 hover:scale-105"
              >
                <Maximize className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Description */}
        <p
          ref={descriptionRef}
          className="text-center text-gray-600 md:text-xl mx-auto mt-8 md:mt-12 leading-relaxed"
        >
          {videoPlayerConfig.description}
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
