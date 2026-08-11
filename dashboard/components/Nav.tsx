import Link from "next/link";

export default function Nav() {
  return (
    <nav className="mb-6 flex items-center justify-between rounded-[18px] border border-slate-200/50 dark:border-white/10 bg-white/45 dark:bg-slate-900/55 px-4 py-2.5 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_4px_12px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.6),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-180">
      <span className="text-sm font-semibold text-slate-800">
        Precision Irrigation
      </span>
      <div className="flex gap-1 text-sm">
          <Link
            href="/farmer"
            className="rounded-[14px] px-3 py-1.5 text-slate-600 dark:text-slate-400 transition-all hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/30 dark:hover:bg-slate-800/30 active:scale-95"
          >
            Farmer view
          </Link>
          <Link
            href="/"
            className="rounded-[14px] px-3 py-1.5 text-slate-600 dark:text-slate-400 transition-all hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/30 dark:hover:bg-slate-800/30 active:scale-95"
          >
          Engineer view
        </Link>
      </div>
    </nav>
  );
}