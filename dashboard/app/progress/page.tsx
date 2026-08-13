"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { GlassCard } from "@/components/GlassCard";

/* ------------------------------------------------------------------ */
/*  Project progress data — grounded in the real repo state            */
/* ------------------------------------------------------------------ */

type PhaseStatus = "done" | "active" | "upcoming";

interface Phase {
  id: string;
  label: string;
  short: string;
  status: PhaseStatus;
  progress: number; // 0–100
  detail: string;
  icon: string;
  metrics?: { label: string; value: string }[];
}

const PHASES: Phase[] = [
  {
    id: "papers",
    label: "Literature Review",
    short: "Papers received & reviewed",
    status: "done",
    progress: 100,
    detail:
      "16 studies (2021–2026) reviewed across ML prediction, edge hardware, evapotranspiration modeling, and farmer adoption. Research proposal v3 consolidated.",
    icon: "📚",
    metrics: [
      { label: "Studies reviewed", value: "16" },
      { label: "Themes", value: "4" },
      { label: "Proposal", value: "v3" },
    ],
  },
  {
    id: "datasets",
    label: "Dataset Acquisition",
    short: "Real datasets downloaded & converted",
    status: "done",
    progress: 100,
    detail:
      "Five real-world datasets downloaded and converted to the canonical 11-column schema: FBK Soil Moisture, Zenodo Cotton, UniPR Tomato (Stuard), UniPR Tomato Evolving, and Kaggle variants.",
    icon: "🗄️",
    metrics: [
      { label: "Datasets", value: "5+" },
      { label: "UniPR Evolving rows", value: "887K" },
      { label: "Schema", value: "11 cols" },
    ],
  },
  {
    id: "training",
    label: "Model Training",
    short: "Training on 1M+ rows of data",
    status: "active",
    progress: 68,
    detail:
      "Currently training the ML pipeline on the combined dataset — over 1 million rows across all real datasets. Models: threshold baseline, logistic regression, Random Forest, XGBoost. Chronological split, TimeSeriesSplit tuning.",
    icon: "🤖",
    metrics: [
      { label: "Rows in training", value: "1M+" },
      { label: "Models", value: "4" },
      { label: "Split", value: "70/15/15" },
    ],
  },
  {
    id: "evaluation",
    label: "Evaluation & Benchmarking",
    short: "Compare ML vs. baseline threshold",
    status: "upcoming",
    progress: 0,
    detail:
      "Evaluate every model against the naive threshold rule (irrigate when soil_moisture < X). Report accuracy, precision, recall, F1 per class on the held-out chronological test set. Feature importance analysis.",
    icon: "📊",
  },
  {
    id: "edge",
    label: "Edge Deployment",
    short: "Export & deploy to ESP32 / Pi",
    status: "upcoming",
    progress: 0,
    detail:
      "Export best model to joblib/ONNX, quantize to int8 for microcontrollers, benchmark inference latency/memory/power on edge hardware. Rule-based safety fallback.",
    icon: "🔌",
  },
  {
    id: "field",
    label: "Field Trial & Adoption",
    short: "Full-season field trial + farmer study",
    status: "upcoming",
    progress: 0,
    detail:
      "Treatment vs. control plots, WUE measurement, crop yield, farmer interviews (8–15), TAM-based survey. Joint-display analysis of technical + socio-technical results.",
    icon: "🌱",
  },
];

/* Dataset stats from datasets.md */
const DATASET_STATS = [
  { name: "Synthetic", rows: 8640, color: "#86c65a" },
  { name: "FBK", rows: 6681, color: "#1f6033" },
  { name: "Zenodo", rows: 142, color: "#95d854" },
  { name: "UniPR Stuard", rows: 32666, color: "#14532d" },
  { name: "UniPR Evolving", rows: 887109, color: "#5b6b57" },
  { name: "Kaggle IoT", rows: 100000, color: "#86c65a" },
  { name: "Kaggle SA", rows: 16411, color: "#1f6033" },
  { name: "Kaggle Orig", rows: 10000, color: "#95d854" },
];

const TOTAL_ROWS = DATASET_STATS.reduce((s, d) => s + d.rows, 0);

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */
function AnimatedNumber({
  value,
  format,
  duration = 1.6,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className="tabular">
      {format ? format(display) : Math.round(display).toLocaleString()}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated progress ring                                             */
/* ------------------------------------------------------------------ */
function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  sublabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    const start = performance.now();
    const duration = 1800;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (progress / 100) * c;

  return (
    <div ref={ref} className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(134,198,90,0.15)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ filter: "drop-shadow(0 0 6px rgba(134,198,90,0.4))" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#86c65a" />
            <stop offset="100%" stopColor="#1f6033" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular">
          {Math.round(progress)}%
        </span>
        {label && (
          <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {label}
          </span>
        )}
        {sublabel && (
          <span className="text-[10px] text-slate-400 dark:text-slate-500">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Animated bar                                                       */
/* ------------------------------------------------------------------ */
function AnimatedBar({
  value,
  color = "#86c65a",
  delay = 0,
}: {
  value: number;
  color?: string;
  delay?: number;
}) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/60 dark:bg-slate-800/60">
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${value}%` }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 1.4, delay, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full"
        style={{
          background: `linear-gradient(to right, ${color}88, ${color})`,
          boxShadow: `0 0 8px ${color}66`,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Phase timeline card                                                */
/* ------------------------------------------------------------------ */
function PhaseCard({ phase, index }: { phase: Phase; index: number }) {
  const statusColors: Record<PhaseStatus, string> = {
    done: "bg-emerald-500",
    active: "bg-amber-500",
    upcoming: "bg-slate-300 dark:bg-slate-700",
  };

  const statusLabel: Record<PhaseStatus, string> = {
    done: "Complete",
    active: "In progress",
    upcoming: "Upcoming",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <GlassCard variant="medium" padding="lg" className="h-full">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-xl">
              {phase.icon}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {phase.label}
              </h3>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {phase.short}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
              phase.status === "done"
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400"
                : phase.status === "active"
                  ? "bg-amber-500/15 text-amber-700 dark:text-amber-400"
                  : "bg-slate-500/10 text-slate-500 dark:text-slate-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                phase.status === "active" ? "animate-pulse" : ""
              } ${statusColors[phase.status]}`}
            />
            {statusLabel[phase.status]}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {phase.detail}
        </p>

        {phase.metrics && (
          <div className="mt-4 grid grid-cols-3 gap-3">
            {phase.metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 px-3 py-2 text-center"
              >
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {m.value}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Progress</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 tabular">
              {phase.progress}%
            </span>
          </div>
          <AnimatedBar
            value={phase.progress}
            color={phase.status === "active" ? "#f59e0b" : "#86c65a"}
            delay={index * 0.1}
          />
        </div>
      </GlassCard>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Dataset bar chart                                                  */
/* ------------------------------------------------------------------ */
function DatasetChart() {
  const maxRows = Math.max(...DATASET_STATS.map((d) => d.rows));
  return (
    <div className="space-y-3">
      {DATASET_STATS.map((d, i) => (
        <div key={d.name} className="flex items-center gap-3">
          <span className="w-28 shrink-0 text-xs font-medium text-slate-600 dark:text-slate-300">
            {d.name}
          </span>
          <div className="flex-1">
            <AnimatedBar
              value={(d.rows / maxRows) * 100}
              color={d.color}
              delay={i * 0.06}
            />
          </div>
          <span className="w-20 shrink-0 text-right text-xs font-semibold text-slate-700 dark:text-slate-300 tabular">
            {d.rows.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main page                                                          */
/* ------------------------------------------------------------------ */
export default function ProgressPage() {
  const activePhase = PHASES.find((p) => p.status === "active");
  const doneCount = PHASES.filter((p) => p.status === "done").length;
  const overallPct = Math.round(
    (PHASES.reduce((s, p) => s + p.progress, 0) / (PHASES.length * 100)) * 100,
  );

  return (
    <div className="relative z-10 min-h-screen p-4 font-sans sm:p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
            Research Progress
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Live status of the precision-irrigation ML pipeline — from
            literature review to field deployment.
          </p>
        </motion.header>

        {/* Hero stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <GlassCard variant="medium" padding="lg" className="text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                <AnimatedNumber
                  value={TOTAL_ROWS}
                  format={(n) => Math.round(n).toLocaleString()}
                />
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Total data rows
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <GlassCard variant="medium" padding="lg" className="text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                <AnimatedNumber value={5} />
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Real datasets
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <GlassCard variant="medium" padding="lg" className="text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                <AnimatedNumber value={16} />
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Papers reviewed
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <GlassCard variant="medium" padding="lg" className="text-center">
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                <AnimatedNumber value={doneCount} />
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Phases complete
              </p>
            </GlassCard>
          </motion.div>
        </div>

        {/* Overall progress + active phase */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-1"
          >
            <GlassCard
              variant="medium"
              padding="lg"
              className="flex h-full flex-col items-center justify-center text-center"
            >
              <ProgressRing
                value={overallPct}
                label="Overall"
                sublabel="pipeline"
              />
              <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                {doneCount} of {PHASES.length} phases complete
              </p>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="lg:col-span-2"
          >
            {activePhase && (
              <GlassCard variant="medium" padding="lg" className="h-full">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-2xl shadow-[0_2px_6px_-1px_rgba(0,0,0,0.25)]">
                    {activePhase.icon}
                    <motion.span
                      className="absolute -top-1 -right-1 flex h-3 w-3"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-500" />
                    </motion.span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                      Currently working on
                    </p>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {activePhase.label}
                    </h2>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {activePhase.detail}
                </p>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Training progress
                    </span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400 tabular">
                      {activePhase.progress}%
                    </span>
                  </div>
                  <AnimatedBar value={activePhase.progress} color="#f59e0b" />
                </div>
                {activePhase.metrics && (
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {activePhase.metrics.map((m) => (
                      <div
                        key={m.label}
                        className="rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/30 px-3 py-2 text-center"
                      >
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                          {m.value}
                        </p>
                        <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70">
                          {m.label}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}
          </motion.div>
        </div>

        {/* Dataset visualization */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <GlassCard variant="medium" padding="lg">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  Dataset scale
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Rows per dataset — combined training set exceeds 1M rows
                </p>
              </div>
              <div className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <AnimatedNumber
                  value={TOTAL_ROWS}
                  format={(n) => `${Math.round(n).toLocaleString()} rows`}
                />
              </div>
            </div>
            <DatasetChart />
          </GlassCard>
        </motion.section>

        {/* Phase timeline */}
        <section className="mb-8">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-100"
          >
            Pipeline phases
          </motion.h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {PHASES.map((phase, i) => (
              <PhaseCard key={phase.id} phase={phase} index={i} />
            ))}
          </div>
        </section>

        {/* Next steps */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard variant="medium" padding="lg">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              What's next
            </h2>
            <div className="mt-4 space-y-3">
              {[
                {
                  icon: "📊",
                  title: "Complete model evaluation",
                  desc: "Benchmark all 4 models against the baseline threshold rule on the held-out test set.",
                },
                {
                  icon: "🔌",
                  title: "Edge deployment",
                  desc: "Export best model to ONNX, quantize to int8, and benchmark on ESP32 / Raspberry Pi.",
                },
                {
                  icon: "🌱",
                  title: "Field trial",
                  desc: "Deploy treatment vs. control plots for a full growing season and measure WUE.",
                },
                {
                  icon: "👨‍🌾",
                  title: "Farmer adoption study",
                  desc: "Interviews and TAM-based survey with 8–15 local vegetable farmers.",
                },
              ].map((step, i) => (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/60 dark:border-white/10 bg-white/50 dark:bg-white/5 px-4 py-3"
                >
                  <span className="text-xl">{step.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {step.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </motion.section>
      </div>
    </div>
  );
}
