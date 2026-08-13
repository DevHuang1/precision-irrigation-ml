"use client";

import { useRef, useState } from "react";

export type StickerState = "resting" | "working";

function getFrameUrl(state: StickerState) {
  return state === "working"
    ? "/sticker-frames/frame_00.png"
    : "/sticker-frames/frame_05.png";
}

export default function AnimatedSticker({
  state,
  onChange,
}: {
  state: StickerState;
  onChange: (next: StickerState) => void;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragState = useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
    moved: false,
  });

  const label =
    state === "working" ? "🔥 Researcher is working" : "💤 Researcher is resting";

  const handlePointerDown = (e: React.PointerEvent) => {
    dragState.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
      moved: false,
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragState.current.moved = true;
    }
    setPosition({
      x: dragState.current.initialX + dx,
      y: dragState.current.initialY + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    dragState.current.dragging = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  const handleClick = () => {
    if (dragState.current.moved) {
      dragState.current.moved = false;
      return;
    }
    onChange(state === "working" ? "resting" : "working");
  };

  return (
    <div
      className="fixed z-50 flex flex-col items-end gap-2"
      style={{
        right: 24,
        bottom: 24,
        transform: `translate(${position.x}px, ${position.y}px)`,
        touchAction: "none",
      }}
    >
      <div className="rounded-2xl border border-white/10 bg-white/55 px-3 py-1.5 text-xs font-medium text-slate-800 shadow-[0_8px_24px_-6px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all duration-200 dark:bg-[#0f1117]/75 dark:text-slate-100">
        {label}
      </div>

      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="cursor-grab active:cursor-grabbing"
      >
        <button
          type="button"
          onClick={handleClick}
          className="relative h-24 w-24 overflow-hidden rounded-full border border-white/20 bg-white/50 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.25)] backdrop-blur-2xl transition-all duration-200 hover:scale-105 active:scale-95 dark:bg-slate-900/60"
          aria-label={`Switch to ${state === "working" ? "resting" : "working"} mode`}
        >
          <img
            src={getFrameUrl(state)}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </button>
      </div>
    </div>
  );
}
