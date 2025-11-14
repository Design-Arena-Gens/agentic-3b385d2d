"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";

interface PlayPauseButtonProps {
  src: string;
  clipId: string;
  disabled?: boolean;
}

export function PlayPauseButton({ src, clipId, disabled = false }: PlayPauseButtonProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleEnded = () => setIsPlaying(false);
    video.addEventListener("ended", handleEnded);
    return () => {
      video.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={togglePlayback}
        disabled={disabled || !src}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-white shadow-lg hover:bg-accentMuted disabled:cursor-not-allowed disabled:opacity-40"
        aria-label={isPlaying ? "Pause clip" : "Play clip"}
      >
        {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
      </button>
      <video
        key={clipId}
        ref={videoRef}
        src={src}
        className="h-24 w-40 rounded-xl border border-white/10 object-cover"
        controls={false}
        preload="metadata"
      />
    </div>
  );
}
