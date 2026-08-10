"use client";

import { useEffect, useMemo, useState } from "react";
import Nav from "@/components/Nav";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Value = string | number | boolean;
type Row = Record<string, Value>;

type RawPayload = { rows: Row[]; count: number };
type ProcessedPayload = { columns: string[]; rows: Row[]; count: number };
type ResultsPayload = { rows: Row[]; count: number };

function formatNumber(v: Value, digits = 3): string {
  if (typeof v === "number") return v.toFixed(digits);
  return String(v);
}

function titleCase(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function Home() {
  const [raw, setRaw] = useState<RawPayload | null>(null);
  const [processed, setProcessed] = useState<ProcessedPayload | null>(null);
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [r, p, res] = await Promise.all([
          fetch("/api/raw").then((r) => r.json()),
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
  }, []);

  const moistureSeries = useMemo(() => {
    if (!raw) return [];
    const byDay: Record<string, Record<string, { sum: number; n: number }>> = {};
    for (const row of raw.rows) {
      const ts = String(row.timestamp).slice(0, 10);
      const plot = String(row.plot_id);
      const m = Number(row.soil_moisture_pct);
      if (!Number.isFinite(m)) continue;
      byDay[ts] ??= {};
      byDay[ts][plot] ??= { sum: 0, n: 0 };
      byDay[ts][plot].sum += m;
      byDay[ts][plot].n += 1;
    }
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, plots]) => {
        const point: Record<string, string | number> = { day };
        for (const [plot, { sum, n }] of Object.entries(plots)) {
          point[plot] = sum / n;
        }
        return point;
      });
  }, [raw]);

  const comparison = useMemo(() => {
    if (!results) return [];
    return [...results.rows].sort(
      (a, b) => Number(b.macro_f1) - Number(a.macro_f1),
    );
  }, [results]);

  const bestModel = comparison[0];

  return (
    <main className="min-h-screen bg-zinc-50 p-6 font-sans">
      <div className="mx-auto max-w-6xl">
        <Nav />

        <header className="mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Precision Irrigation — Monitoring Dashboard
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          AI-powered precision irrigation pipeline for sustainable vegetable
          farming.
        </p>
      </header>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Failed to load dashboard data: {error}. Run the Python pipeline first
          (see README) so <code className="font-mono">data/</code> and{" "}
          <code className="font-mono">results/</code> exist.
        </div>
      )}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card label="Raw sensor rows" value={raw ? raw.count.toLocaleString() : "…"} />
        <Card
          label="Processed feature rows"
          value={processed ? processed.count.toLocaleString() : "…"}
        />
        <Card
          label="Best model (macro-F1)"
          value={bestModel ? `${bestModel.model} (${formatNumber(bestModel.macro_f1)})` : "…"}
        />
      </section>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-medium text-zinc-900">
          Raw sensor log — daily mean soil moisture
        </h2>
        <p className="mb-4 text-xs text-zinc-500">
          Soil moisture (%) averaged per day, per plot.
        </p>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={moistureSeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11 }}
                label={{
                  value: "soil moisture (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fontSize: 11, fill: "#71717a" },
                }}
              />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="treatment" stroke="#2563eb" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="control" stroke="#16a34a" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-1 text-lg font-medium text-zinc-900">Processed features</h2>
        <p className="mb-4 text-xs text-zinc-500">
          Last {processed?.rows.length ?? 0} rows of the cleaned,
          feature-engineered dataset ({processed?.columns.length ?? 0} columns).
        </p>
        <DataTable rows={processed?.rows ?? []} />
      </section>

      <section className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-zinc-900">
            Model comparison — chronological test set
          </h2>
          <p className="mb-4 text-xs text-zinc-500">
            Sorted by macro-F1. Accuracy alone is misleading given the class
            imbalance.
          </p>
          <DataTable rows={comparison} highlight="logistic_regression" />
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="mb-1 text-lg font-medium text-zinc-900">Macro-F1 by model</h2>
          <p className="mb-4 text-xs text-zinc-500">
            The ML model should beat the naive threshold baseline.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={comparison.map((r) => ({ model: String(r.model), macro_f1: Number(r.macro_f1) }))}
                margin={{ left: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} />
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
                      fill={String(r.model) === "logistic_regression" ? "#2563eb" : "#a1a1aa"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-zinc-900">{value}</p>
    </div>
  );
}

function DataTable({ rows, highlight }: { rows: Row[]; highlight?: string }) {
  if (rows.length === 0) {
    return <p className="text-sm text-zinc-400">No data available.</p>;
  }
  const columns = Object.keys(rows[0]);
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            {columns.map((c) => (
              <th key={c} className="whitespace-nowrap px-3 py-2 font-medium">
                {titleCase(c)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row, i) => (
            <tr
              key={i}
              className={
                highlight && String(row.model) === highlight ? "bg-blue-50" : ""
              }
            >
              {columns.map((c) => (
                <td
                  key={c}
                  className="whitespace-nowrap px-3 py-2 tabular-nums text-zinc-700"
                >
                  {formatNumber(row[c], 4)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
