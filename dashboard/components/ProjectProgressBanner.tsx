"use client";

import { motion } from "framer-motion";
import { useState } from "react";

interface ProgressBannerProps {
  totalSensorRows?: number;
  totalProcessedRows?: number;
  bestModelName?: string;
  bestModelF1?: string;
}

export default function ProjectProgressBanner({
  totalSensorRows = 835200,
  totalProcessedRows = 142000,
  bestModelName = "Logistic Regression",
  bestModelF1 = "0.968",
}: ProgressBannerProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "milestones" | "impact">("overview");

  const milestones = [
    { id: 1, title: "Sensor Infrastructure", status: "completed", date: "Q1 2026", progress: 100 },
    { id: 2, title: "Synthetic Baseline ML", status: "completed", date: "Q2 2026", progress: 100 },
    { id: 3, title: "Real-Time Data Pipeline", status: "completed", date: "Q2 2026", progress: 100 },
    { id: 4, title: "Edge Model Deployment", status: "active", date: "Q3 2026", progress: 85 },
    { id: 5, title: "Farmer Usability Study", status: "upcoming", date: "Q4 2026", progress: 20 },
  ];

  return (
    <div className="relative mb-8 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-white/90 via-white/80 to-slate-50/90 dark:from-slate-900/80 dark:via-slate-900/60 dark:to-slate-950/80 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_0_0_0_1px_rgba(255,255,255,0.3),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.4),_inset_0_-1px_0_0_rgba(0,0,0,0.4)] backdrop-blur-2xl saturate-170 transition-all">
      {/* Background Specular Ambient Orbs */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-emerald-500/10 dark:bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-blue-500/10 dark:bg-cyan-500/15 blur-3xl" />

      {/* TOP HEADER & LIVE STATUS BAR */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/70 dark:border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              100k Enterprise SaaS Engine Active
            </span>
            <span className="hidden sm:inline-block text-xs text-slate-400 dark:text-slate-500">•</span>
            <span className="hidden sm:inline-block text-xs font-medium text-slate-500 dark:text-slate-400">
              System Health: 99.94% Uptime
            </span>
          </div>

          <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            Overall Project Progress & AI Health Matrix
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Real-time telemetry, model optimization stage, and environmental impact benchmarks.
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex items-center gap-1 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-slate-100/80 dark:bg-slate-800/50 p-1 backdrop-blur-md">
          <button
            onClick={() => setActiveTab("overview")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "overview"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Executive Summary
          </button>
          <button
            onClick={() => setActiveTab("milestones")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "milestones"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Milestone Pipeline
          </button>
          <button
            onClick={() => setActiveTab("impact")}
            className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
              activeTab === "impact"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            Eco Impact
          </button>
        </div>
      </div>

      {/* CONTENT SECTIONS */}
      <div className="relative z-10 pt-5">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* OVERALL COMPLETION PROGRESS BAR */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 p-4 backdrop-blur-md shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Phase 4 Execution Status
                  </span>
                  <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                    84.5% Complete
                  </span>
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Target Launch: Q4 2026
                </span>
              </div>

              {/* Animated Multi-segment Progress Bar */}
              <div className="relative h-3.5 w-full overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800 p-0.5">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: "84.5%" }}
                  transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                />
              </div>

              <div className="mt-2.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Phase 1: Hardware Setup ✓</span>
                <span>Phase 2: Data Pipeline ✓</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Phase 3 & 4: Model Tuning & Edge (In Progress)</span>
                <span>Phase 5: Scale</span>
              </div>
            </div>

            {/* 4 CORE KPI SaaS WIDGETS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Widget 1: Efficiency */}
              <div className="group rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Water Efficiency
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    💧
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    94.2%
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    +14.8% vs. standard
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[94.2%] rounded-full bg-emerald-500" />
                </div>
              </div>

              {/* Widget 2: Water Saved */}
              <div className="group rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Cumulative Water Saved
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    📉
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    148,250 L
                  </span>
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    -32.4% usage
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[78%] rounded-full bg-blue-500" />
                </div>
              </div>

              {/* Widget 3: AI Model Accuracy */}
              <div className="group rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Best Model (Macro-F1)
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    🤖
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {bestModelF1}
                  </span>
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate max-w-[90px]">
                    {bestModelName}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[96.8%] rounded-full bg-purple-500" />
                </div>
              </div>

              {/* Widget 4: Active Telemetry */}
              <div className="group rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/40 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Total Ingested Sensors
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    ⚡
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {totalSensorRows.toLocaleString()}
                  </span>
                  <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                    rows processed
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-full w-[88%] rounded-full bg-amber-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "milestones" && (
          <div className="grid gap-3 sm:grid-cols-5">
            {milestones.map((m) => (
              <div
                key={m.id}
                className={`rounded-2xl border p-4 transition-all ${
                  m.status === "completed"
                    ? "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-100"
                    : m.status === "active"
                    ? "border-blue-500/40 bg-blue-500/10 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 text-slate-500 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span>Step {m.id}</span>
                  <span>{m.date}</span>
                </div>
                <h4 className="mt-2 text-xs font-bold leading-tight">{m.title}</h4>
                <div className="mt-3 flex items-center gap-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        m.status === "completed"
                          ? "bg-emerald-500"
                          : m.status === "active"
                          ? "bg-blue-500"
                          : "bg-slate-400"
                      }`}
                      style={{ width: `${m.progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold">{m.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "impact" && (
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 p-4">
              <span className="text-2xl">🌱</span>
              <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Yield Improvement</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                +22.4% estimated crop yield improvement due to precision soil-moisture maintenance.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 p-4">
              <span className="text-2xl">⚡</span>
              <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Energy Consumption</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                -28.1% lower pump energy consumption via automated sensor-triggered relay switches.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/40 p-4">
              <span className="text-2xl">👨‍🌾</span>
              <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">Farmer Cost Savings</h4>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Estimated ~$340 saved per hectare/season on water pumping & fuel costs.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
