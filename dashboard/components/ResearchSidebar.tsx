"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";

// NAV ITEMS (Preserved exact data binding & routes)
export const NAV_ITEMS = [
  { id: "home", label: "Home", href: "/", icon: HomeIcon },
  {
    id: "engineer",
    label: "Engineer View",
    href: "/engineer",
    icon: ChartIcon,
  },
  { id: "farmer", label: "Farmer View", href: "/farmer", icon: SproutIcon },
  {
    id: "visualization",
    label: "Visualization",
    href: "/visualization",
    icon: PulseIcon,
  },
  { id: "progress", label: "Progress", href: "/progress", icon: ProgressIcon },
  { id: "docs", label: "Documentation", href: "/docs", icon: BookIcon },
  { id: "research", label: "Research", href: "/research", icon: FlaskIcon },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

interface ResearchSidebarProps {
  initialCollapsed?: boolean;
  className?: string;
}

export default function ResearchSidebar({
  initialCollapsed = false,
  className = "",
}: ResearchSidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync theme with localStorage and documentElement (Default: LIGHT)
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as
      | "light"
      | "dark"
      | null;
    const activeTheme = storedTheme || "light";
    setTheme(activeTheme);
    if (activeTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <>
      {/* --- MOBILE TRIGGER BUTTON --- */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 dark:bg-[#0f1117]/85 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8),_0_8px_20px_rgba(0,0,0,0.06)] text-slate-800 dark:text-slate-100 transition-transform active:scale-95 md:hidden"
        aria-label="Open Navigation Drawer"
      >
        <MenuIcon />
      </button>

      {/* --- MOBILE BACKDROP & DRAWER (VisionOS Liquid Glass Sheet) --- */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 z-40 bg-slate-900/20 dark:bg-black/50 backdrop-blur-md md:hidden"
            />
            {/* Mobile Sheet */}
            <motion.aside
              initial={{ x: "-100%", opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed top-2 left-2 bottom-2 z-50 w-[280px] rounded-3xl bg-white/90 dark:bg-[#12151d]/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_20px_50px_rgba(0,0,0,0.1)] flex flex-col p-4 md:hidden overflow-hidden"
            >
              <SidebarContent
                pathname={pathname}
                isCollapsed={false}
                onToggleCollapse={() => setIsMobileOpen(false)}
                theme={theme}
                onToggleTheme={toggleTheme}
                isMobile
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* --- DESKTOP FLOATING GLASS SIDEBAR --- */}
      <motion.aside
        animate={{ width: isCollapsed ? 84 : 280 }}
        transition={{ type: "spring", stiffness: 350, damping: 32 }}
        className="fixed top-3 left-3 bottom-3 z-40 hidden md:flex flex-col rounded-2xl bg-white/85 dark:bg-[#12151d]/60 backdrop-blur-2xl saturate-170 border border-slate-200/80 dark:border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),_0_20px_40px_-15px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),_0_25px_50px_-12px_rgba(0,0,0,0.5)] p-3 overflow-hidden ${className}"
      >
        <SidebarContent
          pathname={pathname}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          theme={theme}
          onToggleTheme={toggleTheme}
        />
      </motion.aside>
    </>
  );
}

function SidebarContent({
  pathname,
  isCollapsed,
  onToggleCollapse,
  theme,
  onToggleTheme,
  isMobile = false,
}: {
  pathname: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  isMobile?: boolean;
}) {
  return (
    <div className="relative z-10 flex h-full flex-col justify-between">
      {/* BRAND / HEADER */}
      <div>
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center gap-3">
            {/* Glowing Brand Badge */}
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-xs font-bold text-white shadow-[0_2px_6px_-1px_rgba(0,0,0,0.25),_inset_0_1px_1px_rgba(255,255,255,0.35)]">
              PI
            </div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <p className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                  Precision Irrigation
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Research Dashboard
                </p>
              </motion.div>
            )}
          </div>

          {/* Desktop Collapse Rail Toggle */}
          {!isMobile && (
            <button
              onClick={onToggleCollapse}
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100/80 dark:bg-white/5 hover:bg-slate-200/80 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <ChevronIcon isCollapsed={isCollapsed} />
            </button>
          )}
        </div>

        {/* Separator Highlight */}
        <div className="my-2 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

        {/* NAVIGATION ITEMS */}
        <nav className="mt-2 space-y-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <SidebarLink
                key={item.id}
                item={item}
                active={isActive}
                isCollapsed={isCollapsed}
              />
            );
          })}
        </nav>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="pt-3 space-y-2">
        <div className="mb-2 h-[1px] w-full bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

        {/* LIGHT / DARK MODE TOGGLE BUTTON */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToggleTheme}
          className={`flex w-full items-center justify-between rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-white/5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10 ${
            isCollapsed ? "justify-center px-0" : ""
          }`}
          title={
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
        >
          <div className="flex items-center gap-2">
            {theme === "dark" ? <MoonIcon /> : <SunIcon />}
            {!isCollapsed && (
              <span>{theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
            )}
          </div>
          {!isCollapsed && (
            <div
              className={`h-4 w-7 rounded-full p-0.5 transition-colors duration-200 ${
                theme === "dark" ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`h-3 w-3 rounded-full bg-white transition-transform duration-200 ${
                  theme === "dark" ? "translate-x-3" : "translate-x-0"
                }`}
              />
            </div>
          )}
        </motion.button>
      </div>
    </div>
  );
}

function SidebarLink({
  item,
  active,
  isCollapsed,
}: {
  item: NavItem;
  active: boolean;
  isCollapsed: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-xs font-medium transition-all duration-200 outline-none ${
        active
          ? "text-slate-900 dark:text-white font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-white/5"
      }`}
    >
      {/* Dynamic Animated Glass Pill Active Indicator */}
      {active && (
        <motion.div
          layoutId="activeLiquidPill"
          className="pointer-events-none absolute inset-0 rounded-2xl bg-white/90 dark:bg-white/15 backdrop-blur-md border border-slate-200/90 dark:border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.06),_inset_0_1px_1px_rgba(255,255,255,1)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]"
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
          }}
        />
      )}

      {/* Icon */}
      <span className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
        <item.icon active={active} />
      </span>

      {/* Label */}
      {!isCollapsed && (
        <span className="relative z-10 truncate tracking-tight">
          {item.label}
        </span>
      )}

      {/* Active Neon Accent Dot */}
      {active && (
        <motion.div
          layoutId="activeDot"
          className="relative z-10 ml-auto h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 30,
          }}
        />
      )}
    </Link>
  );
}

/* --- ICONS --- */
function SunIcon() {
  return (
    <svg
      className="h-4 w-4 text-amber-500 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg
      className="h-4 w-4 text-indigo-400 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4.5 w-4.5 transition-colors ${
        active ? "stroke-emerald-600 dark:stroke-emerald-400" : "stroke-current"
      }`}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function ChartIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4.5 w-4.5 transition-colors ${
        active ? "stroke-emerald-600 dark:stroke-emerald-400" : "stroke-current"
      }`}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function SproutIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4.5 w-4.5 transition-colors ${
        active ? "stroke-emerald-600 dark:stroke-emerald-400" : "stroke-current"
      }`}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477 4.5 1.253"
      />
    </svg>
  );
}

function BookIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4.5 w-4.5 transition-colors ${
        active ? "stroke-emerald-600 dark:stroke-emerald-400" : "stroke-current"
      }`}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    </svg>
  );
}

function FlaskIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4.5 w-4.5 transition-colors ${
        active ? "stroke-emerald-600 dark:stroke-emerald-400" : "stroke-current"
      }`}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
      />
    </svg>
  );
}

function ChevronIcon({ isCollapsed }: { isCollapsed: boolean }) {
  return (
    <svg
      className={`h-4 w-4 transition-transform duration-300 ${
        isCollapsed ? "rotate-180" : ""
      }`}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ProgressIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4.5 w-4.5 transition-colors ${
        active ? "stroke-emerald-600 dark:stroke-emerald-400" : "stroke-current"
      }`}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function PulseIcon({ active }: { active: boolean }) {
  return (
    <svg
      className={`h-4.5 w-4.5 transition-colors ${
        active ? "stroke-emerald-600 dark:stroke-emerald-400" : "stroke-current"
      }`}
      fill="none"
      strokeWidth={2}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
