import Link from "next/link";

export default function Nav() {
  return (
    <nav className="mb-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2.5 shadow-sm">
      <span className="text-sm font-semibold text-zinc-800">
        Precision Irrigation
      </span>
      <div className="flex gap-1 text-sm">
        <Link
          href="/farmer"
          className="rounded-lg px-3 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          Farmer view
        </Link>
        <Link
          href="/"
          className="rounded-lg px-3 py-1.5 text-zinc-600 transition-colors hover:bg-zinc-100"
        >
          Engineer view
        </Link>
      </div>
    </nav>
  );
}
