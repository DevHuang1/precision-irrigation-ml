"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  GROWTH_STAGES,
  SOIL_FACTORS,
  SOIL_LABELS,
  SOIL_TYPES,
  STAGE_LABELS,
  STAGE_TIPS,
  TARGET_MOISTURE,
} from "@/lib/farmers";

type SimModel = {
  features: string[];
  scaler_mean: number[];
  scaler_scale: number[];
  lr_coef: number[];
  lr_intercept: number;
};

export type DefaultConditions = {
  plot_id: string;
  soil_moisture_pct: number;
  soil_temp_c: number;
  air_temp_c: number;
  air_humidity_pct: number;
  rainfall_mm_24h: number;
  days_since_planting: number;
  growth_stage: string;
  soil_type: string;
  suggested_water_l: number;
};

type DatasetOption = {
  id: string;
  label: string;
  description: string;
  plot_id: string;
  defaults: Omit<DefaultConditions, "plot_id" | "suggested_water_l">;
};

const DATASETS: DatasetOption[] = [
  {
    id: "synthetic",
    label: "Synthetic (demo)",
    description: "Clean 30-min data for treatment and control plots",
    plot_id: "treatment",
    defaults: {
      soil_moisture_pct: 55,
      soil_temp_c: 22,
      air_temp_c: 24,
      air_humidity_pct: 60,
      rainfall_mm_24h: 0,
      days_since_planting: 45,
      growth_stage: "vegetative",
      soil_type: "loamy",
    },
  },
  {
    id: "fbk",
    label: "FBK Soil Moisture",
    description: "Multi-consortium daily sensors, 2023–2024",
    plot_id: "consortium0_sector0_ELMED_3342387_management1",
    defaults: {
      soil_moisture_pct: 17,
      soil_temp_c: 14,
      air_temp_c: 15,
      air_humidity_pct: 71,
      rainfall_mm_24h: 10,
      days_since_planting: 120,
      growth_stage: "vegetative",
      soil_type: "loamy",
    },
  },
  {
    id: "zenodo",
    label: "Zenodo Cotton",
    description: "IoT device + NDVI, Rahim Yar Khan, Pakistan",
    plot_id: "device_170",
    defaults: {
      soil_moisture_pct: 14,
      soil_temp_c: 38,
      air_temp_c: 37,
      air_humidity_pct: 70,
      rainfall_mm_24h: 0,
      days_since_planting: 60,
      growth_stage: "vegetative",
      soil_type: "sandy",
    },
  },
  {
    id: "unipr",
    label: "UniPR Tomato (Stuard)",
    description: "3-line ~10-min sensor platform, Italy",
    plot_id: "stuard_line_1",
    defaults: {
      soil_moisture_pct: 26,
      soil_temp_c: 24,
      air_temp_c: 22,
      air_humidity_pct: 65,
      rainfall_mm_24h: 0,
      days_since_planting: 30,
      growth_stage: "vegetative",
      soil_type: "loamy",
    },
  },
  {
    id: "unipr_evolving",
    label: "UniPR Tomato Evolving",
    description: "Multi-year multi-sensor time series, Italy",
    plot_id: "soil_line_1",
    defaults: {
      soil_moisture_pct: 23,
      soil_temp_c: 24,
      air_temp_c: 25,
      air_humidity_pct: 63,
      rainfall_mm_24h: 0,
      days_since_planting: 90,
      growth_stage: "flowering",
      soil_type: "loamy",
    },
  },
];

function sigmoid(z: number): number {
  return 1 / (1 + Math.exp(-z));
}

function scoreProbability(
  sim: SimModel,
  feats: Record<string, number>,
): number {
  const mean = sim.scaler_mean;
  const scale = sim.scaler_scale;
  let z = sim.lr_intercept;
  sim.features.forEach((name, i) => {
    const v = feats[name] ?? 0;
    z += ((v - mean[i]) / scale[i]) * sim.lr_coef[i];
  });
  return sigmoid(z);
}

type Input = {
  soil_moisture_pct: number;
  soil_temp_c: number;
  air_temp_c: number;
  air_humidity_pct: number;
  rainfall_mm_24h: number;
  days_since_planting: number;
  growth_stage: string;
  soil_type: string;
  hour: number;
};

function buildFeatures(input: Input): Record<string, number> {
  const {
    soil_moisture_pct,
    soil_temp_c,
    air_temp_c,
    air_humidity_pct,
    rainfall_mm_24h,
    days_since_planting,
    growth_stage,
    soil_type,
    hour,
  } = input;

  const theta = (2 * Math.PI * hour) / 24;

  const decay = 0.96;
  const t1 = soil_moisture_pct * decay;
  const t2 = soil_moisture_pct * decay * decay;
  const hist = soil_moisture_pct * 0.6 + t1 * 0.3 + t2 * 0.1;
  const rain72 = rainfall_mm_24h * 2.4;

  const feats: Record<string, number> = {
    soil_moisture_pct,
    soil_temp_c,
    air_temp_c,
    air_humidity_pct,
    rainfall_mm_24h,
    rainfall_mm_72h: rain72,
    soil_moisture_t1: t1,
    soil_moisture_t2: t2,
    soil_moisture_3h_mean: hist,
    time_of_day_sin: Math.sin(theta),
    time_of_day_cos: Math.cos(theta),
    days_since_planting,
  };
  for (const s of GROWTH_STAGES) {
    feats[`growth_stage_${s}`] = s === growth_stage ? 1 : 0;
  }
  return feats;
}

function computeSuggestedWater(
  moisture: number,
  stage: string,
  soilType: string,
): number {
  const target = TARGET_MOISTURE[stage] || 60;
  const deficit = Math.max(0, target - moisture);
  const factor = SOIL_FACTORS[soilType] || 1.0;
  const base = deficit * factor * 1.2;
  return Math.round(base * 10) / 10;
}

const SCENARIOS: { label: string; icon: string; apply: (i: Input) => Input }[] = [
  {
    label: "Dry spell",
    icon: "☀️",
    apply: (i) => ({
      ...i,
      rainfall_mm_24h: 0,
      air_temp_c: Math.max(i.air_temp_c, 32),
      air_humidity_pct: Math.min(i.air_humidity_pct, 30),
    }),
  },
  {
    label: "Heavy rain",
    icon: "🌧️",
    apply: (i) => ({
      ...i,
      rainfall_mm_24h: 25,
      air_temp_c: Math.min(i.air_temp_c, 28),
      air_humidity_pct: Math.max(i.air_humidity_pct, 80),
    }),
  },
  {
    label: "Heatwave",
    icon: "🔥",
    apply: (i) => ({
      ...i,
      air_temp_c: 40,
      air_humidity_pct: 20,
      rainfall_mm_24h: 0,
    }),
  },
  {
    label: "Cool day",
    icon: "❄️",
    apply: (i) => ({
      ...i,
      air_temp_c: 18,
      air_humidity_pct: 70,
      soil_temp_c: Math.min(i.soil_temp_c, 22),
    }),
  },
];

export default function Simulator({
  sim,
  defaults,
  datasetId = "synthetic",
  onDatasetChange,
}: {
  sim: SimModel;
  defaults: DefaultConditions;
  datasetId?: string;
  onDatasetChange?: (id: string) => void;
}) {
  const [soil, setSoil] = useState(defaults.soil_moisture_pct);
  const [airTemp, setAirTemp] = useState(defaults.air_temp_c);
  const [soilTemp, setSoilTemp] = useState(defaults.soil_temp_c);
  const [humidity, setHumidity] = useState(defaults.air_humidity_pct);
  const [rain, setRain] = useState(defaults.rainfall_mm_24h);
  const [days, setDays] = useState(defaults.days_since_planting);
  const [stage, setStage] = useState(defaults.growth_stage);
  const [soilType, setSoilType] = useState(defaults.soil_type || "loamy");
  const [hour, setHour] = useState(8);

  const dataset = DATASETS.find((d) => d.id === datasetId) || DATASETS[0];

  const baseInput: Input = useMemo(
    () => ({
      soil_moisture_pct: soil,
      soil_temp_c: soilTemp,
      air_temp_c: airTemp,
      air_humidity_pct: humidity,
      rainfall_mm_24h: rain,
      days_since_planting: days,
      growth_stage: stage,
      soil_type: soilType,
      hour,
    }),
    [soil, airTemp, soilTemp, humidity, rain, days, stage, soilType, hour],
  );

  const feats = useMemo(() => buildFeatures(baseInput), [baseInput]);
  const proba = useMemo(() => scoreProbability(sim, feats), [sim, feats]);
  const action = proba >= 0.5 ? "irrigate" : "wait";
  const suggestedWater = useMemo(
    () => computeSuggestedWater(soil, stage, soilType),
    [soil, stage, soilType],
  );

  const reason = useMemo(() => {
    const target = TARGET_MOISTURE[stage] || 60;
    const deficit = target - soil;
    const parts: string[] = [];
    if (action === "irrigate") {
      parts.push(
        `Soil moisture is ${soil.toFixed(0)}% — ${deficit > 0 ? `${deficit.toFixed(0)}% below the ${target}% target for ${STAGE_LABELS[stage]}.` : "below the comfort zone for the current growth stage."}`,
      );
      if (rain < 1) parts.push("No meaningful rain in the last 24h.");
      else parts.push("Recent rain has refreshed the soil.");
      if (airTemp >= 25) parts.push("High temperatures are increasing evaporation.");
      if (soilType === "sandy")
        parts.push("Sandy soil drains quickly, so watch moisture closely.");
      if (soilType === "clay")
        parts.push("Clay holds water well — avoid overwatering.");
    } else {
      parts.push(
        `Soil moisture is ${soil.toFixed(0)}% — ${deficit <= 0 ? `at or above the ${target}% target for ${STAGE_LABELS[stage]}.` : "your crops have enough water for now."}`,
      );
      if (rain >= 1) parts.push("Recent rain has refreshed the soil.");
    }
    return parts.join(" ");
  }, [action, soil, rain, airTemp, stage, soilType]);

  const sensitivity = useMemo(() => {
    const out: { soil_moisture_pct: number; probability: number }[] = [];
    for (let m = 0; m <= 100; m += 2) {
      const f = buildFeatures({ ...baseInput, soil_moisture_pct: m });
      out.push({ soil_moisture_pct: m, probability: +(scoreProbability(sim, f) * 100).toFixed(1) });
    }
    return out;
  }, [sim, baseInput]);

  const confidence = useMemo(() => {
    const dist = Math.abs(proba - 0.5) * 2;
    return Math.min(1, dist + 0.5);
  }, [proba]);

  const slider =
    "w-full h-2 rounded-lg appearance-none cursor-pointer" +
    " accent-emerald-500" +
    " [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded" +
    " [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full" +
    " [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-slate-900";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_4px_12px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170 lg:col-span-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Simulate conditions</h2>
            <p className="text-xs text-slate-500">
              Pick a dataset context, then drag sliders or apply a scenario.
            </p>
          </div>
          {onDatasetChange && (
            <select
              value={datasetId}
              onChange={(e) => {
                const ds = DATASETS.find((d) => d.id === e.target.value);
                if (ds) {
                  onDatasetChange(ds.id);
                  setSoil(ds.defaults.soil_moisture_pct);
                  setAirTemp(ds.defaults.air_temp_c);
                  setSoilTemp(ds.defaults.soil_temp_c);
                  setHumidity(ds.defaults.air_humidity_pct);
                  setRain(ds.defaults.rainfall_mm_24h);
                  setDays(ds.defaults.days_since_planting);
                  setStage(ds.defaults.growth_stage);
                  setSoilType(ds.defaults.soil_type);
                }
              }}
               className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
             >
               {DATASETS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="rounded-xl border border-emerald-100/50 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-950/40 p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.6)]">
          <p className="text-xs font-medium text-slate-800">{dataset.label}</p>
          <p className="text-[11px] text-slate-600">{dataset.description}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            Plot: <span className="font-mono">{dataset.plot_id}</span>
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((s) => (
            <button
              key={s.label}
              onClick={() => {
                const next = s.apply(baseInput);
                setSoil(next.soil_moisture_pct);
                setAirTemp(next.air_temp_c);
                setSoilTemp(next.soil_temp_c);
                setHumidity(next.air_humidity_pct);
                setRain(next.rainfall_mm_24h);
              }}
               className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
            >
              {s.icon} {s.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Soil &amp; weather
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Soil moisture</span>
              <span className="float-right font-semibold text-emerald-600">
                {soil.toFixed(0)}%
              </span>
              <input
                type="range" min={0} max={100} value={soil} className={slider}
                onChange={(e) => setSoil(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Air temperature</span>
              <span className="float-right font-semibold text-emerald-600">
                {airTemp.toFixed(0)}°C
              </span>
              <input
                type="range" min={-5} max={45} value={airTemp} className={slider}
                onChange={(e) => setAirTemp(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Soil temperature</span>
              <span className="float-right font-semibold text-emerald-600">
                {soilTemp.toFixed(0)}°C
              </span>
              <input
                type="range" min={0} max={45} value={soilTemp} className={slider}
                onChange={(e) => setSoilTemp(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Air humidity</span>
              <span className="float-right font-semibold text-emerald-600">
                {humidity.toFixed(0)}%
              </span>
              <input
                type="range" min={0} max={100} value={humidity} className={slider}
                onChange={(e) => setHumidity(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Rain — last 24h</span>
              <span className="float-right font-semibold text-emerald-600">
                {rain.toFixed(0)} mm
              </span>
              <input
                type="range" min={0} max={60} value={rain} className={slider}
                onChange={(e) => setRain(Number(e.target.value))}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Days since planting</span>
              <span className="float-right font-semibold text-emerald-600">
                {days} days
              </span>
              <input
                type="range" min={0} max={120} value={days} className={slider}
                onChange={(e) => setDays(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Crop &amp; field
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Growth stage</span>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {GROWTH_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {STAGE_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Soil type</span>
              <select
                value={soilType}
                onChange={(e) => setSoilType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {SOIL_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {SOIL_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Time of day</span>
              <span className="float-right font-semibold text-emerald-600">
                {hour.toString().padStart(2, "0")}:00
              </span>
              <input
                type="range" min={0} max={23} value={hour} className={slider}
                onChange={(e) => setHour(Number(e.target.value))}
              />
            </label>
          </div>
        </div>
      </div>

      <div className="space-y-6 lg:col-span-3">
        <div
          className={`rounded-2xl p-6 text-white shadow-sm ${
            action === "irrigate"
              ? "bg-gradient-to-r from-amber-500 to-orange-500"
              : "bg-gradient-to-r from-emerald-600 to-green-500"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/80">Model recommendation</p>
              <p className="mt-1 text-3xl font-bold">
                {action === "irrigate" ? "Water now" : "No watering needed"}
              </p>
              <p className="mt-1 text-sm text-white/90">
                {action === "irrigate"
                  ? `Suggested: ~${suggestedWater} L`
                  : "No water needed this round"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/70">Confidence</p>
              <p className="text-2xl font-bold">{(confidence * 100).toFixed(0)}%</p>
              <div className="mt-1 h-2 w-24 rounded-full bg-white/30">
                <div
                  className="h-2 rounded-full bg-white"
                  style={{ width: `${confidence * 100}%` }}
                />
              </div>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/95">{reason}</p>
          <p className="mt-2 text-xs text-white/75">
            Irrigation probability: {(proba * 100).toFixed(1)}% · model:{" "}
            {sim.features.length} features
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
          <h3 className="mb-1 text-base font-semibold text-slate-900">
            How soil moisture changes the decision
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Probability of needing irrigation as soil moisture varies, with all
            other conditions fixed.
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensitivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="soil_moisture_pct"
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "soil moisture (%)",
                    position: "insideBottom",
                    offset: -2,
                    style: { fontSize: 11, fill: "#64748b" },
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "irrigation probability (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle", fontSize: 11, fill: "#64748b" },
                  }}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, "probability"]}
                  labelFormatter={(v) => `${v}% moisture`}
                />
                <ReferenceLine x={50} stroke="#ef4444" strokeDasharray="4 4" />
                <Line
                  type="monotone"
                  dataKey="probability"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-4 rounded bg-red-500" /> 50% threshold
            </span>
            <span>
              Stage tip: {STAGE_TIPS[stage]}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
