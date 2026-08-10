"use client";

import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import Nav from "@/components/Nav";
import Simulator, { DefaultConditions } from "@/components/Simulator";

type Current = {
  timestamp: string;
  soil_moisture_pct: number;
  soil_temp_c: number;
  air_temp_c: number;
  air_humidity_pct: number;
  rainfall_mm_24h: number;
};

type Recommendation = {
  action: "irrigate" | "wait";
  label: string;
  confidence: number;
  confidence_label: string;
  reason: string;
  suggested_water_l: number;
};

type Plot = {
  plot_id: string;
  growth_stage: string;
  growth_stage_label: string;
  days_since_planting: number;
  current: Current;
  recommendation: Recommendation;
  stage_tip: string;
  moisture_trend: { day: string; soil_moisture_pct: number }[];
  recent_irrigations: { timestamp: string; water_applied_l: number }[];
};

type Feed = {
  generated_at: string;
  best_model: string;
  plots: Plot[];
  tips: string[];
};

type SimModel = {
  features: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  lr_coef: number[];
  lr_intercept: number;
  error?: string;
};

function Droplet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.5c3.6 4.2 6.5 8 6.5 11.6A6.5 6.5 0 0 1 5.5 14.1C5.5 10.5 8.4 6.7 12 2.5Zm0 3.4C9.8 8.7 7.9 11.7 7.9 14a4.1 4.1 0 1 0 8.2 0c0-2.3-1.9-5.3-4.1-8.1Z" />
    </svg>
  );
}

export default function FarmerView() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [sim, setSim] = useState<SimModel | null>(null);
  const [simMode, setSimMode] = useState(false);
  const [simPlot, setSimPlot] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/farmer-feed").then((r) =>
        r.ok ? r.json() : r.json().then((j) => Promise.reject(j.error)),
      ),
      fetch("/api/sim-model")
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([f, s]) => {
        setFeed(f);
        setSim(s);
        setSimPlot(f.plots[0]?.plot_id ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  const activePlot = feed?.plots.find((p) => p.plot_id === simPlot) ?? feed?.plots[0];

  const simDefaults: DefaultConditions | null = activePlot
    ? {
        plot_id: activePlot.plot_id,
        soil_moisture_pct: activePlot.current.soil_moisture_pct,
        soil_temp_c: activePlot.current.soil_temp_c,
        air_temp_c: activePlot.current.air_temp_c,
        air_humidity_pct: activePlot.current.air_humidity_pct,
        rainfall_mm_24h: activePlot.current.rainfall_mm_24h,
        days_since_planting: activePlot.days_since_planting,
        growth_stage: activePlot.growth_stage,
        suggested_water_l: activePlot.recommendation.suggested_water_l,
      }
    : null;

  if (error) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6 font-sans">
        <Nav />
        <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      </main>
    );
  }

  if (!feed) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6 font-sans">
        <Nav />
        <p className="mx-auto max-w-4xl text-sm text-zinc-500">
          Loading your daily irrigation guidance…
        </p>
      </main>
    );
  }

  const needsWater = feed.plots.filter((p) => p.recommendation.action === "irrigate");
  const allGood = feed.plots.filter((p) => p.recommendation.action === "wait");

  return (
    <main className="min-h-screen bg-zinc-50 p-6 font-sans">
      <div className="mx-auto max-w-4xl">
        <Nav />

        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900">
              Good morning, farmer
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Here is what to do with your crops today. Updated{" "}
              {feed.generated_at}.
            </p>
          </div>
          {sim && (
            <button
              onClick={() => setSimMode((v) => !v)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                simMode
                  ? "bg-blue-600 text-white"
                  : "border border-blue-600 text-blue-600 hover:bg-blue-50"
              }`}
            >
              {simMode ? "Exit simulation mode" : "Simulation mode"}
            </button>
          )}
        </header>

        {simMode ? (
          <section className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <label className="text-sm font-medium text-zinc-700">
                Start from plot
              </label>
              <select
                value={simPlot}
                onChange={(e) => setSimPlot(e.target.value)}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm capitalize text-zinc-800"
              >
                {feed.plots.map((p) => (
                  <option key={p.plot_id} value={p.plot_id}>
                    {p.plot_id}
                  </option>
                ))}
              </select>
            </div>
            {sim && simDefaults && !sim.error && (
              <Simulator sim={sim} defaults={simDefaults} />
            )}
            {sim?.error && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                {sim.error}
              </div>
            )}
          </section>
        ) : (
          <>
          <section className="mb-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 p-6 text-white shadow-sm">
          <p className="text-sm font-medium text-emerald-100">Today&apos;s summary</p>
          <p className="mt-1 text-2xl font-bold leading-snug">
            {needsWater.length === 0
              ? "No watering needed today — your soil has enough water."
              : `${needsWater.length} of ${feed.plots.length} plots need watering today.`}
          </p>
          <p className="mt-2 text-sm text-emerald-50">
            {allGood.length > 0 &&
              `${allGood.map((p) => p.plot_id).join(" and ")} can wait. `}
            {needsWater.length > 0 &&
              `Start with ${needsWater.map((p) => p.plot_id).join(" and ")}.`}
            Water in the early morning or evening to save water.
          </p>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6">
          {feed.plots.map((plot) => (
            <PlotCard key={plot.plot_id} plot={plot} />
          ))}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Handy watering tips</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-700">
            {feed.tips.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                {tip}
              </li>
            ))}
          </ul>
        </section>
          </>
        )}
      </div>
    </main>
  );
}

function PlotCard({ plot }: { plot: Plot }) {
  const { recommendation: rec, current } = plot;
  const irrigate = rec.action === "irrigate";
  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div
        className={`flex flex-wrap items-center justify-between gap-4 px-6 py-4 ${
          irrigate ? "bg-amber-50" : "bg-emerald-50"
        }`}
      >
        <div>
          <h3 className="text-lg font-bold capitalize text-zinc-900">
            {plot.plot_id} plot
          </h3>
          <p className="text-sm text-zinc-500">
            {plot.growth_stage_label} · day {plot.days_since_planting}
          </p>
        </div>
        <div
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white ${
            irrigate ? "bg-amber-500" : "bg-emerald-600"
          }`}
        >
          <Droplet className="h-4 w-4" />
          {rec.label}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-base text-zinc-700">{rec.reason}</p>

          {irrigate ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm text-amber-700">
                Suggested amount:{" "}
                <span className="text-xl font-bold text-amber-800">
                  ~{rec.suggested_water_l} L
                </span>{" "}
                per watering event.
              </p>
              <p className="mt-1 text-xs text-amber-600">
                {rec.confidence_label} the model expects irrigation is needed.
              </p>
            </div>
          ) : (
            <p className="text-xs text-zinc-400">
              Model confidence: {rec.confidence_label}.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Reading label="Soil moisture" value={`${current.soil_moisture_pct}%`}
              tone={irrigate ? "amber" : "green"} />
            <Reading label="Air temperature" value={`${current.air_temp_c}°C`} />
            <Reading label="Rain (24h)" value={`${current.rainfall_mm_24h} mm`} />
            <Reading label="Air humidity" value={`${current.air_humidity_pct}%`} />
          </div>

          <p className="text-xs italic text-zinc-500">{plot.stage_tip}</p>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Soil moisture — last 7 days
            </p>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={plot.moisture_trend}>
                  <Tooltip
                    formatter={(v) => [`${v}%`, "soil moisture"]}
                    labelStyle={{ fontSize: 12 }}
                  />
                  <defs>
                    <linearGradient id={`moist-${plot.plot_id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="soil_moisture_pct"
                    stroke="#2563eb"
                    strokeWidth={2}
                    fill={`url(#moist-${plot.plot_id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {plot.recent_irrigations.length > 0 && (
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Last watering
              </p>
              {plot.recent_irrigations
                .slice(-2)
                .reverse()
                .map((ev, i) => (
                  <p key={i} className="text-sm text-zinc-600">
                    {ev.timestamp.slice(0, 16).replace("T", " ")} —{" "}
                    {ev.water_applied_l} L
                  </p>
                ))}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function Reading({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "amber";
}) {
  return (
    <div className="rounded-lg border border-zinc-100 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-zinc-400">{label}</p>
      <p
        className={`text-lg font-semibold ${
          tone === "green"
            ? "text-emerald-600"
            : tone === "amber"
              ? "text-amber-600"
              : "text-zinc-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
