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

  const dragStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    originX: 0,
    originY: 0,
    moved: false,
  });

  const frameStateRef = useRef({
    index: 0,
    lastTick: 0,
    raf: null as number | null,
  });

  const frameRange = useMemo(() => {
    if (state === "resting") {
      return { start: 5, end: 9 };
    }
    return { start: 0, end: 4 };
  }, [state]);

  const frameWidth = Math.floor(1536 / COLS);
  const frameHeight = Math.floor(1024 / ROWS);

  useEffect(() => {
    frameStateRef.current.index = frameRange.start;
    frameStateRef.current.lastTick = 0;
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

    const tick = (timestamp: number) => {
      const frame = frameStateRef.current;
      if (!frame.lastTick) {
        frame.lastTick = timestamp;
      }

      const elapsed = timestamp - frame.lastTick;
      if (elapsed >= 400) {
        frame.lastTick = timestamp - (elapsed % 400);
        frame.index += 1;
        if (frame.index > frameRange.end) {
          frame.index = frameRange.start;
        }
        setCurrentFrameIndex(frame.index);
      }

      frame.raf = requestAnimationFrame(tick);
    };

    frameStateRef.current.raf = requestAnimationFrame(tick);

    return () => {
      if (frameStateRef.current.raf !== null) {
        cancelAnimationFrame(frameStateRef.current.raf);
        frameStateRef.current.raf = null;
      }
    };
  }, [isLoaded, frameRange.start, frameRange.end]);

  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStateRef.current = {
      active: true,
      startX: clientX,
      startY: clientY,
      originX: position.x,
      originY: position.y,
      moved: false,
    };
  };

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (clientX: number, clientY: number) => {
      const drag = dragStateRef.current;
      const dx = clientX - drag.startX;
      const dy = clientY - drag.startY;

      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        drag.moved = true;
      }

      setPosition({
        x: drag.originX - dx,
        y: drag.originY - dy,
      });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    const onMouseMove = (e: MouseEvent) => handlePointerMove(e.clientX, e.clientY);
    const onMouseUp = () => handlePointerUp();
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handlePointerMove(touch.clientX, touch.clientY);
    };
    const onTouchEnd = () => handlePointerUp();

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isDragging]);

  const handleClick = () => {
    if (!dragStateRef.current.moved) {
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
        onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          handlePointerDown(touch.clientX, touch.clientY);
        }}
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
