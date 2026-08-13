"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const [currentFrame, setCurrentFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const frameRange = useMemo(() => {
    if (state === "resting") {
      return { start: 5, end: 9 };
    }
    return { start: 0, end: 4 };
  }, [state]);

  const frameWidth = Math.floor(1536 / COLS);
  const frameHeight = Math.floor(1024 / ROWS);

  useEffect(() => {
    setCurrentFrame(frameRange.start);
  }, [state, frameRange.start]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => {
        const next = prev + 1;
        if (next > frameRange.end) {
          return frameRange.start;
        }
        return next;
      });
    }, 500);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [frameRange.start, frameRange.end]);

  const { col, row } = getFrameCoords(currentFrame);
  const label = state === "working" ? "Researcher is working" : "Researcher is resting";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      <div className="rounded-2xl border border-white/10 bg-white/55 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-200 dark:bg-slate-900/70 dark:text-slate-100">
        {label}
      </div>

      <button
        type="button"
        onClick={() => onChange(state === "working" ? "resting" : "working")}
        className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-white/50 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition-all duration-200 hover:scale-105 active:scale-95 dark:bg-slate-900/60"
        aria-label={`Switch to ${state === "working" ? "resting" : "working"} mode`}
        style={{
          backgroundImage: "url(/me.png)",
          backgroundSize: `${COLS * frameWidth}px ${ROWS * frameHeight}px`,
          backgroundPosition: `-${col * frameWidth}px -${row * frameHeight}px`,
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>
  );
}
