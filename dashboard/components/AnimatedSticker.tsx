"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const frameIndexRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const frameRange = useMemo(() => {
    if (state === "resting") {
      return { start: 5, end: 9 };
    }
    return { start: 0, end: 4 };
  }, [state]);

  useEffect(() => {
    frameIndexRef.current = frameRange.start;
    if (imgRef.current) {
      imgRef.current.src = `/sticker-frames/frame_${String(frameRange.start).padStart(2, '0')}.png`;
    }
  }, [state, frameRange.start]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    const speed = isHovered ? 180 : 400;

    intervalRef.current = setInterval(() => {
      frameIndexRef.current += 1;
      if (frameIndexRef.current > frameRange.end) {
        frameIndexRef.current = frameRange.start;
      }
      if (imgRef.current) {
        const paddedIndex = String(frameIndexRef.current).padStart(2, '0');
        imgRef.current.src = `/sticker-frames/frame_${paddedIndex}.png`;
      }
    }, speed);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isHovered, frameRange.start, frameRange.end]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    positionStartRef.current = { ...position };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }
      setPosition({
        x: positionStartRef.current.x + dx,
        y: positionStartRef.current.y + dy,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const handleClick = () => {
    if (!hasMovedRef.current) {
      onChange(state === "working" ? "resting" : "working");
    }
  };

  const label = state === "working" ? "Researcher is working" : "Researcher is resting";

  return (
    <div
      className="fixed z-50 flex flex-col items-end gap-2"
      style={{
        right: `${96 + position.x}px`,
        bottom: `${96 + position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
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
        onClick={handleClick}
        className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-white/50 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition-all duration-200 hover:scale-105 active:scale-95 dark:bg-slate-900/60"
        aria-label={`Switch to ${state === "working" ? "resting" : "working"} mode`}
        style={{ cursor: isDragging ? "grabbing" : "pointer" }}
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
