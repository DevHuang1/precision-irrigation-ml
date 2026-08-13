"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate, JSAnimation } from "animejs";

export type StickerState = "resting" | "working";

const TOTAL_FRAMES = 10;

export default function AnimatedSticker({
  state,
  onChange,
}: {
  state: StickerState;
  onChange: (next: StickerState) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const animRef = useRef<JSAnimation | null>(null);
  const frameRef = useRef({ value: 0 });

  const frameRange = useMemo(() => {
    if (state === "resting") {
      return { start: 5, end: 9 };
    }
    return { start: 0, end: 4 };
  }, [state]);

  useEffect(() => {
    frameRef.current.value = frameRange.start;
    if (imgRef.current) {
      imgRef.current.src = `/sticker-frames/frame_${String(frameRange.start).padStart(2, '0')}.png`;
    }
  }, [state, frameRange.start]);

  useEffect(() => {
    if (!imgRef.current) return;

    animRef.current?.pause();

    if (!isHovered) {
      frameRef.current.value = frameRange.start;
      imgRef.current.src = `/sticker-frames/frame_${String(frameRange.start).padStart(2, '0')}.png`;
      return;
    }

    animRef.current = animate(frameRef.current, {
      value: frameRange.end + 1,
      duration: (frameRange.end - frameRange.start + 1) * 180,
      easing: "linear",
      loop: true,
      update: () => {
        const frameIndex = Math.floor(frameRef.current.value);
        const actualFrame = frameRange.start + (frameIndex - frameRange.start) % (frameRange.end - frameRange.start + 1);
        const paddedIndex = String(actualFrame).padStart(2, '0');
        imgRef.current!.src = `/sticker-frames/frame_${paddedIndex}.png`;
      },
    });

    return () => {
      animRef.current?.pause();
    };
  }, [isHovered, frameRange.start, frameRange.end]);

  const label = state === "working" ? "Researcher is working" : "Researcher is resting";

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="rounded-2xl border border-white/10 bg-white/55 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-200 dark:bg-slate-900/70 dark:text-slate-100"
        style={{
          opacity: isHovered ? 1 : 0.85,
          transform: isHovered ? "translateY(-4px)" : "translateY(0)",
        }}
      >
        {label}
      </div>

      <button
        type="button"
        onClick={() => onChange(state === "working" ? "resting" : "working")}
        className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-white/50 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition-all duration-200 hover:scale-105 active:scale-95 dark:bg-slate-900/60"
        aria-label={`Switch to ${state === "working" ? "resting" : "working"} mode`}
      >
        <img
          ref={imgRef}
          src={`/sticker-frames/frame_${String(frameRange.start).padStart(2, '0')}.png`}
          alt="Sticker"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </button>
    </div>
  );
}
