"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { getProfileImageUrl } from "@/lib/api";

interface MediaImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: () => void;
}

export function MediaImage({
  src,
  alt,
  className = "",
  onClick,
  onError,
}: MediaImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>("");

  useEffect(() => {
    if (src) {
      const url = getProfileImageUrl(src);
      setImageUrl(url);
      // Reset states when src changes
      setImageError(false);
      setImageLoaded(false);
    }
  }, [src]);

  const handleError = () => {
    setImageError(true);
    if (onError) onError();
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  if (!src || !imageUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  if (imageError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
      >
        <ImageIcon className="w-8 h-8 text-gray-400" />
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse z-0">
          <ImageIcon className="w-8 h-8 text-gray-300" />
        </div>
      )}
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className={`${imageLoaded ? "opacity-100 z-10" : "opacity-0 z-0"} transition-opacity duration-300`}
        style={{
          objectFit: "cover",
          cursor: onClick ? "pointer" : "default",
        }}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        unoptimized
      />
    </div>
  );
}

