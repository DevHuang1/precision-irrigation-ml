"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GROWTH_STAGES, STAGE_LABELS, STAGE_TIPS } from "@/lib/farmers";

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
  suggested_water_l: number;
};

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
  hour: number;
};

function buildFeatures(input: Input): Record<string, number> {
  const { soil_moisture_pct, soil_temp_c, air_temp_c, air_humidity_pct,
    rainfall_mm_24h, days_since_planting, growth_stage, hour } = input;
  const theta = (2 * Math.PI * hour) / 24;
  const feats: Record<string, number> = {
    soil_moisture_pct,
    soil_temp_c,
    air_temp_c,
    air_humidity_pct,
    rainfall_mm_24h,
    rainfall_mm_72h: rainfall_mm_24h * 3,
    soil_moisture_t1: soil_moisture_pct,
    soil_moisture_t2: soil_moisture_pct,
    soil_moisture_3h_mean: soil_moisture_pct,
    time_of_day_sin: Math.sin(theta),
    time_of_day_cos: Math.cos(theta),
    days_since_planting,
  };
  for (const s of GROWTH_STAGES) {
    feats[`growth_stage_${s}`] = s === growth_stage ? 1 : 0;
  }
  return feats;
}

export default function Simulator({
  sim,
  defaults,
}: {
  sim: SimModel;
  defaults: DefaultConditions;
}) {
  const [soil, setSoil] = useState(defaults.soil_moisture_pct);
  const [airTemp, setAirTemp] = useState(defaults.air_temp_c);
  const [soilTemp, setSoilTemp] = useState(defaults.soil_temp_c);
  const [humidity, setHumidity] = useState(defaults.air_humidity_pct);
  const [rain, setRain] = useState(defaults.rainfall_mm_24h);
  const [days, setDays] = useState(defaults.days_since_planting);
  const [stage, setStage] = useState(defaults.growth_stage);
  const [hour, setHour] = useState(8);

  const baseInput: Input = useMemo(
    () => ({
      soil_moisture_pct: soil,
      soil_temp_c: soilTemp,
      air_temp_c: airTemp,
      air_humidity_pct: humidity,
      rainfall_mm_24h: rain,
      days_since_planting: days,
      growth_stage: stage,
      hour,
    }),
    [soil, airTemp, soilTemp, humidity, rain, days, stage, hour],
  );

  const feats = useMemo(() => buildFeatures(baseInput), [baseInput]);

  const proba = useMemo(() => scoreProbability(sim, feats), [sim, feats]);
  const action = proba >= 0.5 ? "irrigate" : "wait";
  const reason = useMemo(() => {
    const parts =
      action === "irrigate"
        ? [
            `Soil moisture is ${soil.toFixed(0)}% — below the comfort zone for the current growth stage.`,
          ]
        : [`Soil moisture is ${soil.toFixed(0)}% — your crops have enough water for now.`];
    if (rain < 1) parts.push("There has been no meaningful rain in the last 24h.");
    else parts.push("Recent rain has refreshed the soil.");
    if (airTemp >= 25) parts.push("Temperatures are high, so the soil is drying faster.");
    return parts.join(" ");
  }, [action, soil, rain, airTemp]);

  const sensitivity = useMemo(() => {
    const out: { soil_moisture_pct: number; probability: number }[] = [];
    for (let m = 0; m <= 100; m += 2) {
      const f = buildFeatures({ ...baseInput, soil_moisture_pct: m });
      out.push({ soil_moisture_pct: m, probability: +(scoreProbability(sim, f) * 100).toFixed(1) });
    }
    return out;
  }, [sim, baseInput]);

  const slider =
    "w-full accent-blue-600";
  const row = "grid grid-cols-1 gap-4 md:grid-cols-2";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm lg:col-span-2">
        <h2 className="text-lg font-semibold text-zinc-900">Simulate conditions</h2>
        <p className="text-xs text-zinc-500">
          Drag the sliders to explore scenarios and watch the recommendation
          change live.
        </p>

        <div className={row}>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Soil moisture</span>
            <span className="float-right font-semibold text-blue-600">
              {soil.toFixed(0)}%
            </span>
            <input
              type="range" min={0} max={100} value={soil} className={slider}
              onChange={(e) => setSoil(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Air temperature</span>
            <span className="float-right font-semibold text-blue-600">
              {airTemp.toFixed(0)}°C
            </span>
            <input
              type="range" min={-5} max={45} value={airTemp} className={slider}
              onChange={(e) => setAirTemp(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Soil temperature</span>
            <span className="float-right font-semibold text-blue-600">
              {soilTemp.toFixed(0)}°C
            </span>
            <input
              type="range" min={0} max={45} value={soilTemp} className={slider}
              onChange={(e) => setSoilTemp(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Air humidity</span>
            <span className="float-right font-semibold text-blue-600">
              {humidity.toFixed(0)}%
            </span>
            <input
              type="range" min={0} max={100} value={humidity} className={slider}
              onChange={(e) => setHumidity(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Rain — last 24h</span>
            <span className="float-right font-semibold text-blue-600">
              {rain.toFixed(0)} mm
            </span>
            <input
              type="range" min={0} max={60} value={rain} className={slider}
              onChange={(e) => setRain(Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Days since planting</span>
            <span className="float-right font-semibold text-blue-600">
              {days} days
            </span>
            <input
              type="range" min={0} max={120} value={days} className={slider}
              onChange={(e) => setDays(Number(e.target.value))}
            />
          </label>
        </div>

        <div className={row}>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Growth stage</span>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800"
            >
              {GROWTH_STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-zinc-700">Time of day</span>
            <span className="float-right font-semibold text-blue-600">
              {hour.toString().padStart(2, "0")}:00
            </span>
            <input
              type="range" min={0} max={23} value={hour} className={slider}
              onChange={(e) => setHour(Number(e.target.value))}
            />
          </label>
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
          <p className="text-sm font-medium text-white/80">Model recommendation</p>
          <p className="mt-1 text-3xl font-bold">
            {action === "irrigate" ? "Water now" : "No watering needed"}
          </p>
          <p className="mt-1 text-sm text-white/90">
            {action === "irrigate"
              ? `Suggested: ~${defaults.suggested_water_l} L`
              : "No water needed this round"}
          </p>
          <p className="mt-3 text-sm text-white/95">{reason}</p>
          <p className="mt-2 text-xs text-white/75">
            Irrigation probability: {(proba * 100).toFixed(1)}% · model:{" "}
            {sim.features.length} features
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="mb-1 text-base font-semibold text-zinc-900">
            How soil moisture changes the decision
          </h3>
          <p className="mb-3 text-xs text-zinc-500">
            Probability of needing irrigation as soil moisture varies, with all
            other conditions fixed.
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensitivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="soil_moisture_pct"
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "soil moisture (%)",
                    position: "insideBottom",
                    offset: -2,
                    style: { fontSize: 11, fill: "#71717a" },
                  }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  label={{
                    value: "irrigation probability (%)",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle", fontSize: 11, fill: "#71717a" },
                  }}
                />
                <Tooltip
                  formatter={(v) => [`${v}%`, "probability"]}
                  labelFormatter={(v) => `${v}% moisture`}
                />
                <Line
                  type="monotone"
                  dataKey="probability"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            Stage tip: {STAGE_TIPS[stage]}. Assumption: soil moisture has been
            steady for the past few hours, and rain over the last 3 days was
            similar to today.
          </p>
        </div>
      </div>
    </div>
  );
}
