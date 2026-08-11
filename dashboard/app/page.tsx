"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Value = string | number | boolean;
type Row = Record<string, Value>;

type RawPayload = {
  rows: Row[];
  count: number;
  dataset: string;
  breakdown?: Record<string, number>;
  sampled?: number;
  chartData?: {
    day: string;
    avg: number;
    change: number;
    direction: "up" | "down" | "flat";
  }[];
};
type ProcessedPayload = { columns: string[]; rows: Row[]; count: number };
type ResultsPayload = { rows: Row[]; count: number };

const DATASETS = [
  { id: "synthetic", label: "Synthetic (demo)" },
  { id: "fbk", label: "FBK Soil Moisture" },
  { id: "zenodo", label: "Zenodo Cotton" },
  { id: "unipr", label: "UniPR Tomato" },
  { id: "unipr_evolving", label: "UniPR Evolving" },
  { id: "kaggle_orig", label: "Kaggle Irrigation Prediction" },
  { id: "kaggle_pi_iot", label: "Kaggle IoT Sensor" },
  { id: "kaggle_sa", label: "Kaggle Smart Agriculture" },
  { id: "combined", label: "Combined (all datasets)" },
];

function formatNumber(v: Value, digits = 3): string {
  if (typeof v === "number") return v.toFixed(digits);
  return String(v);
}

function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

import ProjectProgressBanner from "@/components/ProjectProgressBanner";
import { GlassCard } from "@/components/GlassCard";

export default function Home() {
  const [raw, setRaw] = useState<RawPayload | null>(null);
  const [processed, setProcessed] = useState<ProcessedPayload | null>(null);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [datasetId, setDatasetId] = useState("synthetic");

  useEffect(() => {
    const load = async () => {
      try {
        const [r, p, res] = await Promise.all([
          fetch(`/api/raw?dataset=${encodeURIComponent(datasetId)}`).then((r) =>
            r.json(),
          ),
          fetch("/api/processed").then((r) => r.json()),
          fetch("/api/results").then((r) => r.json()),
        ]);
        setRaw(r);
        setProcessed(p);
        setResults(res);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    load();
  }, [datasetId]);

  const plotIds = useMemo(() => {
    if (!raw) return [];
    const ids = new Set<string>();
    for (const row of raw.rows) {
      const plot = String(row.plot_id);
      if (plot) ids.add(plot);
    }
    return [...ids];
  }, [raw]);

  const topPlotIds = useMemo(() => {
    if (!raw) return [];
    const counts: Record<string, number> = {};
    for (const row of raw.rows) {
      const plot = String(row.plot_id);
      if (plot) counts[plot] = (counts[plot] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id]) => id);
  }, [raw]);

  const palette = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#d946ef",
    "#84cc16",
    "#f43f5e",
    "#0ea5e9",
  ];

  const moistureSeries = useMemo(() => {
    if (!raw) return [];

    // Use server-side aggregated chart data if available (for combined mode with 800k+ rows)
    if (raw.chartData) {
      return raw.chartData.map((d) => ({ day: d.day, avg: d.avg }));
    }

    const byDay: Record<string, { sum: number; n: number }> = {};
    const byDayPlot: Record<
      string,
      Record<string, { sum: number; n: number }>
    > = {};
    for (const row of raw.rows) {
      const ts = String(row.timestamp).slice(0, 10);
      const plot = String(row.plot_id);
      const m = Number(row.soil_moisture_pct);
      if (!Number.isFinite(m)) continue;
      byDay[ts] ??= { sum: 0, n: 0 };
      byDay[ts].sum += m;
      byDay[ts].n += 1;
      if (datasetId !== "combined") {
        byDayPlot[ts] ??= {};
        byDayPlot[ts][plot] ??= { sum: 0, n: 0 };
        byDayPlot[ts][plot].sum += m;
        byDayPlot[ts][plot].n += 1;
      }
    }
    const sorted = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, { sum, n }]) => ({
        day,
        avg: Math.round((sum / n) * 10) / 10,
      }));

    if (datasetId === "combined") {
      return sorted.map(({ day, avg }) => ({ day, avg }));
    }

    return sorted.map(({ day, avg }) => {
      const point: Record<string, string | number> = { day, avg };
      const plots = byDayPlot[day];
      if (plots) {
        for (const plot of topPlotIds) {
          const p = plots[plot];
          if (p) point[plot] = Math.round((p.sum / p.n) * 10) / 10;
        }
      }
      return point;
    });
  }, [raw, datasetId, topPlotIds]);

  const changeSeries = useMemo(() => {
    if (!raw) return [];

    // Use server-side aggregated chart data if available
    if (raw.chartData) {
      return raw.chartData.map((d) => ({
        day: d.day,
        change: d.change,
        direction: d.direction,
      }));
    }

    const byDay: Record<string, { sum: number; n: number }> = {};
    for (const row of raw.rows) {
      const ts = String(row.timestamp).slice(0, 10);
      const m = Number(row.soil_moisture_pct);
      if (!Number.isFinite(m)) continue;
      byDay[ts] ??= { sum: 0, n: 0 };
      byDay[ts].sum += m;
      byDay[ts].n += 1;
    }
    const sorted = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, { sum, n }]) => ({ day, avg: sum / n }));

    const out: {
      day: string;
      change: number;
      direction: "up" | "down" | "flat";
    }[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const change = sorted[i].avg - sorted[i - 1].avg;
      out.push({
        day: sorted[i].day,
        change: Math.round(change * 10) / 10,
        direction: change > 0.5 ? "up" : change < -0.5 ? "down" : "flat",
      });
    }
    return out;
  }, [raw]);

  const comparison = useMemo(() => {
    if (!results) return [];
    return [...results.rows].sort(
      (a, b) => Number(b.macro_f1) - Number(a.macro_f1),
    );
  }, [results]);

  const bestModel = comparison[0];

  return (
    <div className="relative z-10 min-h-screen p-6 font-sans">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
              Precision Irrigation — Monitoring Dashboard
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              AI-powered precision irrigation pipeline for sustainable vegetable
              farming.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Dataset
            </label>
            <select
              value={datasetId}
              onChange={(e) => setDatasetId(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-100 shadow-sm"
            >
              {DATASETS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* 100K ENTERPRISE SAAS OVERALL PROGRESS BANNER */}
        <ProjectProgressBanner
          totalSensorRows={raw?.count}
          totalProcessedRows={processed?.count}
          bestModelName={bestModel ? String(bestModel.model) : undefined}
          bestModelF1={bestModel ? formatNumber(bestModel.macro_f1) : undefined}
        />

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            Failed to load dashboard data: {error}. Run the Python pipeline
            first (see README) so <code className="font-mono">data/</code> and{" "}
            <code className="font-mono">results/</code> exist.
          </div>
        )}

        {raw?.breakdown && (
          <section className="mb-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/80 dark:bg-blue-950/30 p-4 text-xs text-blue-700 dark:text-blue-300 backdrop-blur-sm">
            <span className="font-semibold">Combined dataset breakdown:</span>
            {Object.entries(raw.breakdown).map(([id, count]) => (
              <span key={id} className="ml-3">
                {id}: {count.toLocaleString()}
              </span>
            ))}
            {raw.sampled && raw.sampled < raw.count && (
              <span className="ml-3 text-blue-600 dark:text-blue-400">
                (showing {raw.sampled.toLocaleString()} sampled rows for
                performance)
              </span>
            )}
          </section>
        )}

        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card
            label="Raw sensor rows"
            value={raw ? raw.count.toLocaleString() : "…"}
          />
          <Card
            label="Processed feature rows"
            value={processed ? processed.count.toLocaleString() : "…"}
          />
          <Card
            label="Best model (macro-F1)"
            value={
              bestModel
                ? `${bestModel.model} (${formatNumber(bestModel.macro_f1)})`
                : "…"
            }
          />
        </section>

        <section className="mb-6">
          <GlassCard variant="medium" padding="lg">
            <h2 className="mb-1 text-lg font-medium text-slate-900 dark:text-slate-100">
              Raw sensor log — daily mean soil moisture
            </h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Soil moisture (%) averaged per day, per plot.{" "}
              {datasetId === "combined"
                ? "Showing combined data from all datasets."
                : `Dataset: ${DATASETS.find((d) => d.id === datasetId)?.label}`}
              .
            </p>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moistureSeries}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#cbd5e1"
                    className="dark:stroke-slate-800"
                  />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "soil moisture (%)",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fontSize: 11,
                        fill: "#64748b",
                      },
                    }}
                  />
                  <Tooltip />
                  {datasetId !== "combined" && (
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  )}
                  {datasetId === "combined" ? (
                    <Line
                      type="monotone"
                      dataKey="avg"
                      stroke="#10b981"
                      dot={false}
                      strokeWidth={2}
                    />
                  ) : (
                    topPlotIds.map((plot, i) => (
                      <Line
                        key={plot}
                        type="monotone"
                        dataKey={plot}
                        stroke={palette[i % palette.length]}
                        dot={false}
                        strokeWidth={2}
                      />
                    ))
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </section>

        <section className="mb-6">
          <GlassCard variant="medium" padding="lg">
            <h2 className="mb-1 text-lg font-medium text-slate-900 dark:text-slate-100">
              Daily moisture change (increase / decrease)
            </h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Day-over-day change in average soil moisture. Green = increase,
              red = decrease.
            </p>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={changeSeries} barSize={24}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#cbd5e1"
                    className="dark:stroke-slate-800"
                  />
                  <XAxis
                    dataKey="day"
                    tick={{ fontSize: 11 }}
                    angle={-30}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    label={{
                      value: "change (%)",
                      angle: -90,
                      position: "insideLeft",
                      style: {
                        textAnchor: "middle",
                        fontSize: 11,
                        fill: "#64748b",
                      },
                    }}
                  />
                  <Tooltip
                    formatter={(v) => [`${v}%`, "change"]}
                    labelFormatter={(v) => `From previous day`}
                    cursor={{ fill: "rgba(0,0,0,0.05)" }}
                  />
                  <ReferenceLine
                    y={0}
                    stroke="#18181b"
                    strokeWidth={2}
                    strokeDasharray="6 3"
                    label={{
                      value: "no change",
                      position: "right",
                      fontSize: 10,
                      fill: "#64748b",
                    }}
                  />
                  <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                    {changeSeries.map((entry, index) => (
                      <Cell
                        key={index}
                        fill={
                          entry.direction === "up"
                            ? "#10b981"
                            : entry.direction === "down"
                              ? "#ef4444"
                              : "#d4d4d8"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-green-500 shadow-sm" />{" "}
                Increase
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-red-500 shadow-sm" />{" "}
                Decrease
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm bg-zinc-300 dark:bg-zinc-600 shadow-sm" />{" "}
                Flat
              </span>
            </div>
          </GlassCard>
        </section>

        <section className="mb-6">
          <GlassCard variant="medium" padding="lg">
            <h2 className="mb-1 text-lg font-medium text-slate-900 dark:text-slate-100">
              Processed features
            </h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Last {processed?.rows.length ?? 0} rows of the cleaned,
              feature-engineered dataset ({processed?.columns.length ?? 0}{" "}
              columns).
            </p>
            <DataTable rows={processed?.rows ?? []} />
          </GlassCard>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GlassCard variant="medium" padding="lg">
            <h2 className="mb-1 text-lg font-medium text-slate-900 dark:text-slate-100">
              Model comparison — chronological test set
            </h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Sorted by macro-F1. Accuracy alone is misleading given the class
              imbalance.
            </p>
            <DataTable rows={comparison} highlight="logistic_regression" />
          </GlassCard>

          <GlassCard variant="medium" padding="lg">
            <h2 className="mb-1 text-lg font-medium text-slate-900 dark:text-slate-100">
              Macro-F1 by model
            </h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              The ML model should beat the naive threshold baseline.
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={comparison.map((r) => ({
                    model: String(r.model),
                    macro_f1: Number(r.macro_f1),
                  }))}
                  margin={{ left: 20 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#cbd5e1"
                    className="dark:stroke-slate-800"
                  />
                  <XAxis
                    type="number"
                    domain={[0, 1]}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="model"
                    width={150}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip />
                  <Bar dataKey="macro_f1" radius={[0, 4, 4, 0]}>
                    {comparison.map((r) => (
                      <Cell
                        key={String(r.model)}
                        fill={
                          String(r.model) === "logistic_regression"
                            ? "#10b981"
                            : "#a1a1aa"
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </section>
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <GlassCard variant="thin" padding="md" border={false}>
      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </GlassCard>
  );
}

function DataTable({ rows, highlight }: { rows: Row[]; highlight?: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-slate-400">No data available.</p>;
  }
  const columns = Object.keys(rows[0]);
  return (
    <GlassCard variant="medium" padding="none" border={false}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
            <tr>
              {columns.map((c) => (
                <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                  {titleCase(c)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
            {rows.map((row, i) => (
              <tr
                key={i}
                className={
                  highlight && String(row.model) === highlight
                    ? "bg-emerald-50/60 dark:bg-emerald-950/40"
                    : ""
                }
              >
                {columns.map((c) => (
                  <td
                    key={c}
                    className="whitespace-nowrap px-3 py-2 tabular-nums text-slate-700 dark:text-slate-300"
                  >
                    {formatNumber(row[c], 4)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}
