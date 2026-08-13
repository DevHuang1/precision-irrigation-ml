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
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);

  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionStartRef = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);
  const frameIndexRef = useRef(0);
  const lastTickRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const frameRange = useMemo(() => {
    if (state === "resting") {
      return { start: 5, end: 9 };
    }
    return { start: 0, end: 4 };
  }, [state]);

  const frameWidth = 1536 / COLS;
  const frameHeight = 1024 / ROWS;

  useEffect(() => {
    frameIndexRef.current = frameRange.start;
    lastTickRef.current = 0;
    setCurrentFrameIndex(frameRange.start);
  }, [state, frameRange.start]);

  useEffect(() => {
    const img = new window.Image();
    img.src = "/me.png";
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setIsLoaded(false);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    const animate = (timestamp: number) => {
      if (!lastTickRef.current) {
        lastTickRef.current = timestamp;
      }

      const speed = 400;
      const elapsed = timestamp - lastTickRef.current;

      if (elapsed >= speed) {
        lastTickRef.current = timestamp - (elapsed % speed);
        frameIndexRef.current += 1;
        if (frameIndexRef.current > frameRange.end) {
          frameIndexRef.current = frameRange.start;
        }
        setCurrentFrameIndex(frameIndexRef.current);
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isLoaded, frameRange.start, frameRange.end]);

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
  }, [isDragging, position]);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = { x: touch.clientX, y: touch.clientY };
    positionStartRef.current = { ...position };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const dx = touch.clientX - dragStartRef.current.x;
      const dy = touch.clientY - dragStartRef.current.y;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        hasMovedRef.current = true;
      }
      setPosition({
        x: positionStartRef.current.x + dx,
        y: positionStartRef.current.y + dy,
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, position]);

  const handleClick = () => {
    if (!hasMovedRef.current) {
      onChange(state === "working" ? "resting" : "working");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onChange(state === "working" ? "resting" : "working");
    }
  };

  const currentFrame = getFrameCoords(currentFrameIndex);
  const label = state === "working" ? "Researcher is working" : "Researcher is resting";

  return (
    <div
      className="fixed z-50 flex flex-col items-end gap-2"
      style={{
        right: `${96 + position.x}px`,
        bottom: `${96 + position.y}px`,
        cursor: isDragging ? "grabbing" : "grab",
        touchAction: "none",
      }}
    >
      <div
        className="rounded-2xl border border-white/10 bg-white/55 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-200 dark:bg-slate-900/70 dark:text-slate-100 select-none"
        style={{
          opacity: isDragging ? 0.9 : 0.85,
          transform: isDragging ? "translateY(-2px)" : "translateY(0)",
        }}
      >
        {label}
      </div>

      <button
        type="button"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-white/50 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition-all duration-200 hover:scale-105 active:scale-95 dark:bg-slate-900/60"
        aria-label={`Switch to ${state === "working" ? "resting" : "working"} mode`}
        style={{
          cursor: isDragging ? "grabbing" : "pointer",
          backgroundImage: isLoaded ? "url(/me.png)" : "none",
          backgroundSize: `${COLS * frameWidth}px ${ROWS * frameHeight}px`,
          backgroundPosition: `-${currentFrame.col * frameWidth}px -${currentFrame.row * frameHeight}px`,
          backgroundRepeat: "no-repeat",
        }}
      >
        {!isLoaded && (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600 dark:border-slate-600 dark:border-t-slate-300" />
          </div>
        )}
      </button>
    </div>
  );
}
