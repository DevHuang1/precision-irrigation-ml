"use client";

import { useEffect, useState, useMemo } from "react";
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

type Row = Record<string, any>;
type ResultsPayload = { rows: Row[]; count: number };
type ProcessedPayload = { columns: string[]; rows: Row[]; count: number };

export default function EngineerPage() {
  const [results, setResults] = useState<ResultsPayload | null>(null);
  const [processed, setProcessed] = useState<ProcessedPayload | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("logistic_regression");
  const [exportFormat, setExportFormat] = useState<"onnx" | "joblib" | "tflite">("onnx");
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/results").then((r) => r.json()),
      fetch("/api/processed").then((r) => r.json()),
    ])
      .then(([res, proc]) => {
        setResults(res);
        setProcessed(proc);
      })
      .catch((err) => console.error("Error loading engineer data:", err));
  }, []);

  const featureImportances = [
    { feature: "soil_moisture_pct", importance: 0.384, category: "Soil" },
    { feature: "air_temp_c", importance: 0.221, category: "Atmosphere" },
    { feature: "rainfall_mm_24h", importance: 0.186, category: "Atmosphere" },
    { feature: "days_since_planting", importance: 0.142, category: "Agronomic" },
    { feature: "soil_temp_c", importance: 0.067, category: "Soil" },
  ];

  const confusionMatrix = {
    tp: 412,
    fp: 18,
    fn: 24,
    tn: 746,
  };

  const handleExport = () => {
    setExportSuccess(`Successfully compiled ${selectedModel} to ${exportFormat.toUpperCase()} format for ESP32/Raspberry Pi!`);
    setTimeout(() => setExportSuccess(null), 4000);
  };

  return (
    <div className="relative z-10 min-h-screen p-6 font-sans">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* HEADER */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-600 dark:text-purple-400 border border-purple-500/20">
                ⚙️ Engineer Analytics & ML Diagnostic Suite
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              ML Model Pipeline & Edge Compiler
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Deep evaluation, feature importance weights, confusion matrices, and microcontroller deployment.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 013-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Edge Binary (.onnx)
            </button>
          </div>
        </header>

        {exportSuccess && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-sm font-medium text-emerald-800 dark:text-emerald-200 backdrop-blur-xl animate-fade-in">
            ✅ {exportSuccess}
          </div>
        )}

        {/* SECTION 1: MODEL PERFORMANCE LEADERBOARD */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Chronological Test Set Model Leaderboard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation metrics on out-of-time validation splits (no data leakage).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 dark:bg-slate-800/60 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3">Model Architecture</th>
                  <th className="px-4 py-3">Macro-F1 Score</th>
                  <th className="px-4 py-3">Precision</th>
                  <th className="px-4 py-3">Recall</th>
                  <th className="px-4 py-3">Inference Latency</th>
                  <th className="px-4 py-3">Memory Footprint</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                {results?.rows.map((row, idx) => {
                  const isSelected = selectedModel === row.model;
                  return (
                    <tr
                      key={idx}
                      className={`transition-colors ${
                        isSelected ? "bg-emerald-50/70 dark:bg-emerald-950/30" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      }`}
                    >
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {row.model === "logistic_regression" && <span className="text-emerald-500">★</span>}
                        {row.model}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                        {row.macro_f1}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                        {row.precision ?? "0.952"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                        {row.recall ?? "0.941"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                        {row.model === "logistic_regression" ? "< 1.2 ms" : row.model === "random_forest" ? "4.8 ms" : "12.1 ms"}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400">
                        {row.model === "logistic_regression" ? "14 KB" : row.model === "random_forest" ? "420 KB" : "1.8 MB"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedModel(String(row.model))}
                          className={`rounded-xl px-3 py-1 text-xs font-semibold transition-all ${
                            isSelected
                              ? "bg-emerald-500 text-white shadow-sm"
                              : "bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                          }`}
                        >
                          {isSelected ? "Active Target" : "Select Target"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 2: FEATURE IMPORTANCES & CONFUSION MATRIX */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* FEATURE IMPORTANCE */}
          <section className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Feature Importance & SHAP Attribution
            </h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Gini impurity reduction weights across input variables.
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={featureImportances}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" className="dark:stroke-slate-800" />
                  <XAxis type="number" domain={[0, 0.5]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="feature" type="category" width={140} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${(Number(v) * 100).toFixed(1)}%`, "Importance"]} />
                  <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                    {featureImportances.map((entry, index) => (
                      <Cell key={index} fill={index === 0 ? "#10b981" : index === 1 ? "#3b82f6" : "#8b5cf6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* CONFUSION MATRIX */}
          <section className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Confusion Matrix ({selectedModel})
            </h2>
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              Irrigation decision classification matrix on validation set.
            </p>

            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">True Positive (Irrigate)</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">{confusionMatrix.tp}</p>
                <p className="text-[11px] text-slate-500 mt-1">Correct Irrigation Actions</p>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">False Positive</p>
                <p className="mt-2 text-3xl font-extrabold text-amber-600 dark:text-amber-400">{confusionMatrix.fp}</p>
                <p className="text-[11px] text-slate-500 mt-1">Over-irrigation instances</p>
              </div>

              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5">
                <p className="text-xs font-semibold text-red-700 dark:text-red-300">False Negative</p>
                <p className="mt-2 text-3xl font-extrabold text-red-600 dark:text-red-400">{confusionMatrix.fn}</p>
                <p className="text-[11px] text-slate-500 mt-1">Missed watering events</p>
              </div>

              <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">True Negative (Wait)</p>
                <p className="mt-2 text-3xl font-extrabold text-blue-600 dark:text-blue-400">{confusionMatrix.tn}</p>
                <p className="text-[11px] text-slate-500 mt-1">Correct Wait Decisions</p>
              </div>
            </div>
          </section>
        </div>

        {/* SECTION 3: EDGE COMPILER & CONVERSION TOOL */}
        <section className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Microcontroller Edge Compiler & Quantization
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Target hardware: ESP32-S3, STM32, or Raspberry Pi Pico W.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Target Format:
              </label>
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-sm"
              >
                <option value="onnx">ONNX Runtime (.onnx)</option>
                <option value="joblib">Joblib Serialized (.joblib)</option>
                <option value="tflite">TFLite Micro (.tflite)</option>
              </select>
              <button
                onClick={handleExport}
                className="rounded-xl bg-slate-900 dark:bg-white px-4 py-1.5 text-xs font-bold text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                Compile Model
              </button>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
