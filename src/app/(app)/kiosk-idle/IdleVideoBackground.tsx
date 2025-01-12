"use client";

import React, { useEffect, useRef, useState, memo } from "react";
import Image from "next/image";

/**
 * A separate, memoized component for playing kiosk idle videos
 * so that changing language won't forcibly remount the video.
 */

type KioskIdleVideo = {
  video?: {
    s3_url?: string;
    url?: string;
  };
};

type IdleVideoBackgroundProps = {
  kioskIdleVideos?: KioskIdleVideo[];
  kioskIdleImage?: {
    url?: string;
  };
};

function IdleVideoBackgroundComponent({
  kioskIdleVideos,
  kioskIdleImage,
}: IdleVideoBackgroundProps) {
  // 1) We parse out the video URLs if they exist
  const videos = (kioskIdleVideos || [])
    .map((item) => item?.video?.s3_url || item?.video?.url)
    .filter(Boolean) as string[];

  // Single fallback image
  const imageUrl = kioskIdleImage?.url ?? "";

  // 2) Local state + refs
  const [currentVideoIdx, setCurrentVideoIdx] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoTimeRef = useRef(0);

  // 3) Determine if we have multiple videos
  const totalVideos = videos.length;
  const hasVideos = totalVideos > 0;
  const hasImage = !!imageUrl;

  // 4) If there's only 1 video, we can set `loop` attribute
  const singleVideo = totalVideos === 1;
  const loopEnabled = singleVideo; // if exactly 1 video, we'll set loop

  // 5) On mount (and whenever currentVideoIdx changes), load the correct src
  useEffect(() => {
    if (!hasVideos || !videoRef.current) return;

    const player = videoRef.current;

    // Set new src for the current video
    player.src = videos[currentVideoIdx];

    // If we store playback time, restore it
    player.currentTime = videoTimeRef.current;

    // Attempt to play
    player
      .play()
      .catch((err) => console.warn("Autoplay blocked or error:", err));
  }, [currentVideoIdx, hasVideos, videos]);

  // 6) Keep track of the time so we don’t lose position if the parent re-renders
  useEffect(() => {
    const player = videoRef.current;
    if (!player) return;

    const handleTimeUpdate = () => {
      videoTimeRef.current = player.currentTime;
    };

    player.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      player.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, []);

  // 7) On video end => go next if multiple
  const handleVideoEnded = () => {
    if (!hasVideos) return;
    // Reset stored time to 0 for the next video
    videoTimeRef.current = 0;

    // If multiple videos => next index
    if (!singleVideo) {
      setCurrentVideoIdx((prev) => (prev + 1) % totalVideos);
    } else {
      // If there's exactly 1 video, we do nothing
      // because we have `loop` attribute set
    }
  };

  // 8) Render: either a video or fallback image
  if (hasVideos) {
    return (
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        onEnded={handleVideoEnded}
        loop={loopEnabled} // loop if single video
      />
    );
  }

  if (hasImage) {
    return (
      <Image
        src={imageUrl}
        alt="Kiosk Idle"
        layout="fill"
        objectFit="cover"
        className="absolute inset-0"
      />
    );
  }

  // If no videos + no image => fallback
  return <div className="absolute inset-0 bg-black" />;
}

// We use `memo` to avoid re-rendering unless props change
const IdleVideoBackground = memo(IdleVideoBackgroundComponent);
export default IdleVideoBackground;
