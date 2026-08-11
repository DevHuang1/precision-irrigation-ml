"use client";

import { forwardRef } from "react";

export type GlassVariant = "thin" | "medium" | "thick";

interface GlassCardProps {
  children: React.ReactNode;
  variant?: GlassVariant;
  className?: string;
  padding?: "sm" | "md" | "lg" | "none";
  border?: boolean;
  onClick?: () => void;
}

const variantClasses: Record<GlassVariant, string> = {
  thin:
    "bg-white/45 dark:bg-slate-900/55 " +
    "after:pointer-events-none after:absolute after:inset-0 " +
    "after:rounded-[inherit] " +
    "after:border after:border-white/30 dark:after:border-white/8 " +
    "after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]",
  medium:
    "bg-white/70 dark:bg-slate-900/75 " +
    "after:pointer-events-none after:absolute after:inset-0 " +
    "after:rounded-[inherit] " +
    "after:border after:border-white/15 dark:after:border-white/8 " +
    "after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.5),inset_0_-1px_0_0_rgba(0,0,0,0.3)]",
  thick:
    "bg-white/88 dark:bg-slate-950/92 " +
    "after:pointer-events-none after:absolute after:inset-0 " +
    "after:rounded-[inherit] " +
    "after:border after:border-white/8 dark:after:border-white/5 " +
    "after:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),inset_0_-1px_0_0_rgba(0,0,0,0.4)]",
};

const paddingClasses = {
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
  none: "p-0",
};

const shadowClasses = {
  thin: "shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_4px_12px_-2px_rgba(0,0,0,0.08)]",
  medium: "shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_0_0_0_1px_rgba(255,255,255,0.3)]",
  thick: "shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_12px_24px_-4px_rgba(0,0,0,0.12),_0_0_0_1px_rgba(255,255,255,0.05)]",
};

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  function GlassCard(
    { children, variant = "medium", className = "", padding = "md", border = true, onClick },
    ref,
  ) {
    const baseClasses = [
      "relative isolate overflow-hidden rounded-[18px] transition-all duration-200",
      "backdrop-blur-[20px] saturate-170",
      "supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-slate-900/75",
      variantClasses[variant],
      shadowClasses[variant],
       paddingClasses[padding],
       ...(border ? [] : ["after:border-transparent"]),
    ];

    if (onClick) {
      baseClasses.push(
        "cursor-pointer",
        "hover:scale-[1.01]",
        "active:scale-[0.985] active:transition-transform active:duration-75",
      );
    }

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={[...baseClasses, className].filter(Boolean).join(" ")}
      >
        <span className="absolute inset-0 rounded-[inherit] bg-[url('/noise.svg')] opacity-[0.015] dark:opacity-[0.025] pointer-events-none mix-blend-overlay" />
        {children}
      </div>
    );
  },
);

GlassCard.displayName = "GlassCard";

export function glassClassName(variant: GlassVariant = "medium"): string {
  return [
    "relative isolate overflow-hidden rounded-[18px]",
    "backdrop-blur-[20px] saturate-170",
    "supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-slate-900/75",
    variantClasses[variant],
    shadowClasses[variant],
  ].join(" ");
}

export function glassCardClassName(variant: GlassVariant = "medium"): string {
  return [
    "relative isolate overflow-hidden rounded-2xl",
    "backdrop-blur-[20px] saturate-170",
    "supports-[backdrop-filter]:bg-white/70 supports-[backdrop-filter]:dark:bg-slate-900/75",
    variantClasses[variant],
    shadowClasses[variant],
  ].join(" ");
}
