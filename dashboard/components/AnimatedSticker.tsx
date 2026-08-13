"use client";

import { useEffect, useMemo, useState } from "react";

export type StickerState = "resting" | "working";

const TOTAL_FRAMES = 10;
const ROWS = 2;
const COLS = 5;

function getFrameCoords(frameIndex: number) {
  const col = frameIndex % COLS;
  const row = Math.floor(frameIndex / COLS);
  return { col, row };
}

export default function AnimatedSticker({
  state,
  onChange,
}: {
  state: StickerState;
  onChange: (next: StickerState) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);

  const frameRange = useMemo(() => {
    if (state === "resting") {
      return { start: 0, end: 4 };
    }
    return { start: 5, end: 9 };
  }, [state]);

  useEffect(() => {
    setCurrentFrame(frameRange.start);
  }, [state, frameRange.start]);

  useEffect(() => {
    if (!isHovered) return;
    const interval = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        if (next > frameRange.end) {
          return frameRange.start;
        }
        return next;
      });
    }, 180);
    return () => clearInterval(interval);
  }, [isHovered, frameRange.start, frameRange.end]);

  const frameWidth = 1536 / COLS;
  const frameHeight = 1024 / ROWS;
  const { col, row } = getFrameCoords(currentFrame);

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
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{
            width: `${frameWidth}px`,
            height: `${frameHeight}px`,
            backgroundImage: "url(/me.png)",
            backgroundPosition: `-${col * frameWidth}px -${row * frameHeight}px`,
            backgroundSize: `${COLS * frameWidth}px ${ROWS * frameHeight}px`,
            transform: "scale(0.8)",
            transformOrigin: "center",
            imageRendering: "auto",
          }}
        />
      </button>
    </div>
  );
}
