"use client";

import { useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";

type Row = Record<string, string | number | boolean>;

type Payload = {
  rows: Row[];
  count: number;
  dataset: string;
  error?: string;
};

const PAGE_SIZES = [100, 500, 1000];

function formatCell(v: string | number | boolean): string {
  if (typeof v === "boolean") return v ? "true" : "false";
  if (typeof v === "number") {
    if (Number.isInteger(v)) return v.toLocaleString();
    return v.toLocaleString(undefined, { maximumFractionDigits: 4 });
  }
  return v;
}

export default function RawDataExplorer({
  datasetId,
}: {
  datasetId: string;
}) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(500);
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
  }, [datasetId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const offset = page * pageSize;
    fetch(
      `/api/raw?dataset=${encodeURIComponent(datasetId)}&offset=${offset}&limit=${pageSize}`,
    )
      .then((r) => r.json())
      .then((p: Payload) => {
        if (cancelled) return;
        if (p.error) {
          setError(p.error);
          setData(null);
        } else {
          setData(p);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [datasetId, page, pageSize]);

  const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1;
  const from = data ? Math.min(data.count, page * pageSize + 1) : 0;
  const to = data ? Math.min(data.count, (page + 1) * pageSize) : 0;

  const goTo = (p: number) => {
    setPage(Math.max(0, Math.min(totalPages - 1, p)));
  };

  const columns = data && data.rows.length > 0 ? Object.keys(data.rows[0]) : [];

  return (
    <GlassCard variant="medium" padding="lg">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100">
            Full raw rows — browse all data
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {data
              ? `${data.count.toLocaleString()} total rows · showing ${from.toLocaleString()}–${to.toLocaleString()}`
              : "Loading…"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Page size
          </label>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs text-slate-800 dark:text-slate-100 shadow-sm"
          >
            {PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s.toLocaleString()} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2 font-medium">#</th>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
            {(data?.rows ?? []).map((row, i) => (
              <tr
                key={i}
                className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
              >
                <td className="px-3 py-1.5 tabular-nums text-slate-400">
                  {page * pageSize + i + 1}
                </td>
                {columns.map((c) => (
                  <td
                    key={c}
                    className="whitespace-nowrap px-3 py-1.5 tabular-nums text-slate-700 dark:text-slate-300"
                  >
                    {formatCell(row[c])}
                  </td>
                ))}
              </tr>
            ))}
            {(!data || data.rows.length === 0) && !loading && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-3 py-6 text-center text-slate-400"
                >
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Page {page + 1} of {totalPages.toLocaleString()}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => goTo(page - 1)}
            disabled={page === 0 || loading}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ‹ Prev
          </button>
          <input
            type="number"
            min={1}
            max={totalPages}
            value={page + 1}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v) && v >= 1) goTo(v - 1);
            }}
            className="w-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-center text-xs text-slate-800 dark:text-slate-100 shadow-sm"
            aria-label="Jump to page"
          />
          <button
            onClick={() => goTo(page + 1)}
            disabled={page >= totalPages - 1 || loading}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 shadow-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next ›
          </button>
        </div>
      </div>
    </GlassCard>
  );
}
