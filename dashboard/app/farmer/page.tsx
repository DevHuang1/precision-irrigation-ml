"use client";

import { useEffect, useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";

import Simulator, { DefaultConditions } from "@/components/Simulator";
import { GlassCard } from "@/components/GlassCard";

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
  soil_type: string;
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
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2.5c3.6 4.2 6.5 8 6.5 11.6A6.5 6.5 0 0 1 5.5 14.1C5.5 10.5 8.4 6.7 12 2.5Zm0 3.4C9.8 8.7 7.9 11.7 7.9 14a4.1 4.1 0 1 0 8.2 0c0-2.3-1.9-5.3-4.1-8.1Z" />
    </svg>
  );
}

export default function FarmerView() {
  const [feed, setFeed] = useState<Feed | null>(null);
  const [sim, setSim] = useState<SimModel | null>(null);
  const [simMode, setSimMode] = useState(false);
  const [simPlot, setSimPlot] = useState<string>("");
  const [datasetId, setDatasetId] = useState("synthetic");
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

  useEffect(() => {
    if (!simMode) return;
    fetch(`/api/sim-model?datasetId=${encodeURIComponent(datasetId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null)
      .then((s) => setSim(s))
      .catch(() => {});
  }, [datasetId, simMode]);

  const activePlot =
    feed?.plots.find((p) => p.plot_id === simPlot) ?? feed?.plots[0];

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
        soil_type: activePlot.soil_type,
        suggested_water_l: activePlot.recommendation.suggested_water_l,
      }
    : null;

  if (error) {
    return (
      <div className="relative z-10 min-h-screen p-4 font-sans sm:p-6">
        <div className="mx-auto max-w-4xl rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="relative z-10 min-h-screen p-4 font-sans sm:p-6">
        <p className="mx-auto max-w-4xl text-sm text-slate-500">
          Loading your daily irrigation guidance…
        </p>
      </div>
    );
  }

  const needsWater = feed.plots.filter(
    (p) => p.recommendation.action === "irrigate",
  );
  const allGood = feed.plots.filter((p) => p.recommendation.action === "wait");

  return (
    <div className="relative z-10 min-h-screen p-4 font-sans sm:p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Good morning, farmer
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Here is what to do with your crops today. Updated{" "}
              {feed.generated_at}.
            </p>
          </div>
          {sim && (
            <button
              onClick={() => setSimMode((v) => !v)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                simMode
                  ? "bg-emerald-600 text-white shadow-[0_4px_20px_-2px_rgba(16,185,129,0.3)] active:scale-95"
                  : "border border-emerald-600/30 dark:border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-white/30 dark:hover:bg-emerald-950/30 active:scale-95"
              }`}
            >
              {simMode ? "Exit simulation mode" : "Simulation mode"}
            </button>
          )}
        </header>

        {simMode ? (
          <section className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Dataset context
              </label>
              <select
                value={datasetId}
                onChange={(e) => setDatasetId(e.target.value)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm capitalize text-slate-800 dark:text-slate-100"
              >
                {[
                  { id: "synthetic", label: "Synthetic (demo)" },
                  { id: "fbk", label: "FBK Soil Moisture" },
                  { id: "zenodo", label: "Zenodo Cotton" },
                  { id: "unipr", label: "UniPR Tomato" },
                  { id: "unipr_evolving", label: "UniPR Evolving" },
                ].map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Switch dataset to see different starting conditions
              </span>
            </div>
            {sim && simDefaults && !sim.error && (
              <Simulator
                sim={sim}
                defaults={simDefaults}
                datasetId={datasetId}
                onDatasetChange={setDatasetId}
              />
            )}
            {sim?.error && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                {sim.error}
              </div>
            )}
          </section>
        ) : (
          <>
            <section className="mb-8">
              <GlassCard variant="medium" padding="lg">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Today&apos;s summary
                </p>
                <p className="mt-1 text-2xl font-bold leading-snug text-slate-900 dark:text-slate-100">
                  {needsWater.length === 0
                    ? "No watering needed today — your soil has enough water."
                    : `${needsWater.length} of ${feed.plots.length} plots need watering today.`}
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {allGood.length > 0 &&
                    `${allGood.map((p) => p.plot_id).join(" and ")} can wait. `}
                  {needsWater.length > 0 &&
                    `Start with ${needsWater.map((p) => p.plot_id).join(" and ")}.`}
                  Water in the early morning or evening to save water.
                </p>
              </GlassCard>
            </section>

            <section className="mb-8 grid grid-cols-1 gap-6">
              {feed.plots.map((plot) => (
                <PlotCard key={plot.plot_id} plot={plot} />
              ))}
            </section>

            <section>
              <GlassCard variant="medium" padding="lg">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Handy watering tips
                </h2>
                <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                  {feed.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function PlotCard({ plot }: { plot: Plot }) {
  const { recommendation: rec, current } = plot;
  const irrigate = rec.action === "irrigate";
  return (
    <GlassCard variant="medium" padding="none">
      <div
        className={`flex flex-wrap items-center justify-between gap-4 px-6 py-4 ${
          irrigate
            ? "bg-amber-50/80 dark:bg-amber-950/40"
            : "bg-emerald-50/80 dark:bg-emerald-950/40"
        }`}
      >
        <div>
          <h3 className="text-lg font-bold capitalize text-slate-900 dark:text-slate-100">
            {plot.plot_id} plot
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
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
          <p className="text-base text-slate-700 dark:text-slate-300">
            {rec.reason}
          </p>

          {irrigate ? (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Suggested amount:{" "}
                <span className="text-xl font-bold text-amber-800 dark:text-amber-200">
                  ~{rec.suggested_water_l} L
                </span>{" "}
                per watering event.
              </p>
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                {rec.confidence_label} the model expects irrigation is needed.
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Model confidence: {rec.confidence_label}.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2">
            <Reading
              label="Soil moisture"
              value={`${current.soil_moisture_pct}%`}
              tone={irrigate ? "amber" : "green"}
            />
            <Reading
              label="Air temperature"
              value={`${current.air_temp_c}°C`}
            />
            <Reading
              label="Rain (24h)"
              value={`${current.rainfall_mm_24h} mm`}
            />
            <Reading
              label="Air humidity"
              value={`${current.air_humidity_pct}%`}
            />
          </div>

          <p className="text-xs italic text-slate-500 dark:text-slate-400">
            {plot.stage_tip}
          </p>
        </div>

        <div className="space-y-4">
          <GlassCard variant="thin" padding="md" className="space-y-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
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
                    <linearGradient
                      id={`moist-${plot.plot_id}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#10b981"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="100%"
                        stopColor="#10b981"
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="soil_moisture_pct"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill={`url(#moist-${plot.plot_id})`}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>

          {plot.recent_irrigations.length > 0 && (
            <GlassCard variant="thin" padding="md">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Last watering
              </p>
              {plot.recent_irrigations
                .slice(-2)
                .reverse()
                .map((ev, i) => (
                  <p
                    key={i}
                    className="text-sm text-slate-600 dark:text-slate-300"
                  >
                    {ev.timestamp.slice(0, 16).replace("T", " ")} —{" "}
                    {ev.water_applied_l} L
                  </p>
                ))}
            </GlassCard>
          )}
        </div>
      </div>
    </GlassCard>
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
    <GlassCard variant="thin" padding="sm">
      <p className="text-[11px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {label}
      </p>
      <p
        className={`text-lg font-semibold ${
          tone === "green"
            ? "text-emerald-600 dark:text-emerald-400"
            : tone === "amber"
              ? "text-amber-600 dark:text-amber-400"
              : "text-slate-800 dark:text-slate-200"
        }`}
      >
        {value}
      </p>
    </GlassCard>
  );
}
