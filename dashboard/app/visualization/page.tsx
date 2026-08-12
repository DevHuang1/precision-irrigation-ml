"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ================================================================== */
/*  Types                                                             */
/* ================================================================== */
type Phase = "collect" | "process" | "deliver";

type Packet = {
  id: number;
  from: number; // sensor index
  kind: "data" | "delivery";
};

type LogEntry = {
  id: number;
  time: string;
  text: string;
  kind: "data" | "process" | "deliver";
};

/* ================================================================== */
/*  Geometry helpers                                                  */
/* ================================================================== */
function sampleQuad(
  p0: { x: number; y: number },
  cp: { x: number; y: number },
  p1: { x: number; y: number },
  steps = 24,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;
    pts.push({
      x: mt * mt * p0.x + 2 * mt * t * cp.x + t * t * p1.x,
      y: mt * mt * p0.y + 2 * mt * t * cp.y + t * t * p1.y,
    });
  }
  return pts;
}

/* ================================================================== */
/*  Layout constants (SVG viewBox 0 0 1200 640)                       */
/* ================================================================== */
const MODEL = { x: 585, y: 320, w: 210, h: 150 };
const FARMER = { x: 975, y: 320, w: 190, h: 150 };

const SENSORS = [
  { x: 110, y: 130, label: "Plot A", moisture: 68 },
  { x: 110, y: 300, label: "Plot B", moisture: 41 },
  { x: 110, y: 470, label: "Plot C", moisture: 55 },
  { x: 285, y: 130, label: "Plot D", moisture: 32 },
  { x: 285, y: 300, label: "Plot E", moisture: 60 },
  { x: 285, y: 470, label: "Plot F", moisture: 47 },
];

/* Neural network node positions (inside model box, scaled to model coords) */
const NN_LAYERS = [
  [
    { x: 620, y: 265 },
    { x: 620, y: 320 },
    { x: 620, y: 375 },
  ],
  [
    { x: 680, y: 250 },
    { x: 680, y: 320 },
    { x: 680, y: 390 },
  ],
  [
    { x: 740, y: 240 },
    { x: 740, y: 320 },
    { x: 740, y: 400 },
  ],
  [{ x: 785, y: 320 }],
];

/* ================================================================== */
/*  Small SVG icons                                                   */
/* ================================================================== */
function PlantIcon({ color = "#1f6033" }: { color?: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden>
      <path
        d="M12 22V9M12 9c0-3 2-5 5-5 0 3-2 5-5 5Zm0 0c0-3-2-5-5-5 0 3 2 5 5 5Z"
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SensorDroplet({ active }: { active: boolean }) {
  return (
    <motion.span
      animate={
        active
          ? { scale: [1, 1.45, 1], opacity: [0.9, 1, 0.9] }
          : { scale: 1, opacity: 0.85 }
      }
      transition={
        active ? { duration: 1.1, repeat: Infinity } : { duration: 0.2 }
      }
      className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]"
    >
      <span className="h-1 w-1 rounded-full bg-white" />
    </motion.span>
  );
}

/* ================================================================== */
/*  Main Page                                                         */
/* ================================================================== */
export default function VisualizationPage() {
  const [phase, setPhase] = useState<Phase>("collect");
  const [play, setPlay] = useState(true);
  const [speed, setSpeed] = useState<1 | 2>(1);
  const [packets, setPackets] = useState<Packet[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [processingPct, setProcessingPct] = useState(0);
  const [activeSensor, setActiveSensor] = useState<number | null>(null);

  const idRef = useRef(1);
  const lastEmitRef = useRef(0);

  /* ---- live event feed ---- */
  const pushLog = (text: string, kind: LogEntry["kind"]) => {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLog((prev) =>
      [{ id: idRef.current++, time, text, kind }, ...prev].slice(0, 30),
    );
  };

  /* ---- phase watchdog: advance the pipeline automatically ---- */
  useEffect(() => {
    if (!play) return;
    const delay = speed === 2 ? 4500 : 9000;
    const id = setTimeout(() => {
      setPhase((p) => {
        if (p === "collect") {
          pushLog(
            "Batch complete — sending 6 sensor samples to the ML model",
            "process",
          );
          return "process";
        }
        if (p === "process") {
          pushLog(
            "Recommendations generated — delivering to farmer",
            "deliver",
          );
          return "deliver";
        }
        pushLog("New sensing cycle started on the field", "data");
        return "collect";
      });
    }, delay);
    return () => clearTimeout(id);
  }, [phase, play, speed]);

  /* ---- processing progress bar ---- */
  useEffect(() => {
    if (phase !== "process" || !play) {
      setProcessingPct(phase === "process" ? 100 : 0);
      return;
    }
    setProcessingPct(0);
    const iv = setInterval(
      () => setProcessingPct((p) => Math.min(100, p + 4)),
      60,
    );
    return () => clearInterval(iv);
  }, [phase, play]);

  /* ---- spawn sensor data particles ---- */
  useEffect(() => {
    if (!play) return;
    if (phase !== "collect") return;
    const iv = setInterval(() => {
      const now = Date.now();
      if (now - lastEmitRef.current < (speed === 2 ? 300 : 550)) return;
      lastEmitRef.current = now;
      const idx = Math.round(Math.random() * (SENSORS.length - 1));
      setActiveSensor(idx);
      setPackets((prev) => [
        ...prev,
        { id: idRef.current++, from: idx, kind: "data" },
      ]);
      pushLog(
        `Sensor on Plot ${String.fromCharCode(65 + idx)} → soil moisture ${SENSORS[idx].moisture}%`,
        "data",
      );
    }, 380);
    return () => clearInterval(iv);
  }, [play, phase, speed]);

  /* ---- spawn delivery packets ---- */
  useEffect(() => {
    if (!play) return;
    if (phase !== "deliver") return;
    let count = 0;
    const iv = setInterval(() => {
      if (count >= 4) return;
      count++;
      setPackets((prev) => [
        ...prev,
        { id: idRef.current++, from: 2, kind: "delivery" },
      ]);
      pushLog("Farmer notified — suggested water 45 L for Plot B", "deliver");
    }, 900);
    return () => clearInterval(iv);
  }, [play, phase]);

  /* ---- remove particles once they reach destination ---- */
  useEffect(() => {
    if (!play) return;
    const iv = setInterval(() => {
      setPackets((prev) => prev.filter((p, i) => i < 14));
    }, 2600);
    return () => clearInterval(iv);
  }, [play]);

  /* ---- recompute once packets change (so each has stable path) ---- */
  const traveling = useMemo(() => {
    return packets.map((p) => {
      const sensor = SENSORS[p.from];
      if (p.kind === "data") {
        const path = sampleQuad(
          { x: sensor.x + 26, y: sensor.y },
          { x: 430, y: sensor.y },
          { x: MODEL.x, y: MODEL.y + MODEL.h / 2 },
        );
        return { ...p, path };
      }
      const path = sampleQuad(
        { x: MODEL.x + MODEL.w, y: MODEL.y + MODEL.h / 2 },
        { x: 850, y: MODEL.y + MODEL.h / 2 },
        { x: FARMER.x, y: FARMER.y + 60 },
      );
      return { ...p, path };
    });
  }, [packets]);

  const stepIndex: Record<Phase, number> = {
    collect: 1,
    process: 2,
    deliver: 3,
  };
  const STEPS = [
    { key: "collect", label: "Data collection", sub: "Sensors read the field" },
    {
      key: "process",
      label: "ML processing",
      sub: "Model predicts irrigation",
    },
    {
      key: "deliver",
      label: "Farmer delivery",
      sub: "Actionable insight sent",
    },
  ];

  return (
    <div className="relative z-10 min-h-screen p-4 font-sans sm:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* ==================== HEADER ==================== */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                🎬 Live ML Pipeline Visualization
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              From Field to Farmer — Animated
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Watch sensor data travel from the crops, get processed by the ML
              model, and reach the farmer as clear irrigation advice.
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPlay((v) => !v)}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all"
            >
              {play ? (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Play
                </>
              )}
            </button>
            <button
              onClick={() => {
                setPackets([]);
                setLog([]);
                setProcessingPct(0);
                setPhase("collect");
                pushLog("Visualization restarted", "data");
              }}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              ↺ Restart
            </button>
            <button
              onClick={() => setSpeed((s) => (s === 1 ? 2 : 1))}
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800 active:scale-95 transition-all"
            >
              {speed}x speed
            </button>
          </div>
        </header>

        {/* ==================== STEP INDICATOR ==================== */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-3 backdrop-blur-xl shadow-sm sm:flex-row sm:items-center">
          {STEPS.map((s, i) => {
            const isActive = phase === s.key;
            const isDone = stepIndex[s.key as Phase] < stepIndex[phase];
            return (
              <div key={s.key} className="flex flex-1 items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-bold transition-all ${
                    isActive
                      ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-[0_0_16px_rgba(16,185,129,0.4)]"
                      : isDone
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <div className="min-w-0">
                  <p
                    className={`truncate text-sm font-semibold ${
                      isActive
                        ? "text-slate-900 dark:text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {s.label}
                  </p>
                  <p className="truncate text-[11px] text-slate-400 dark:text-slate-500">
                    {s.sub}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="ml-2 hidden flex-1 text-slate-300 dark:text-slate-600 lg:block">
                    →
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* ==================== SVG PIPELINE ==================== */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-white/80 via-white/60 to-emerald-50/50 dark:from-slate-900/75 dark:via-slate-900/55 dark:to-slate-950/70 p-3 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_12px_32px_-8px_rgba(0,0,0,0.12),inset_0_1px_0_0_rgba(255,255,255,0.5)] backdrop-blur-2xl">
          <svg
            viewBox="0 0 1200 640"
            className="h-auto w-full"
            role="img"
            aria-label="Animated ML pipeline"
          >
            <defs>
              <linearGradient id="dataGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <filter
                id="glowDot"
                x="-200%"
                y="-200%"
                width="500%"
                height="500%"
              >
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="glowModel"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ---- Field backdrop ---- */}
            <rect
              x="30"
              y="40"
              width="380"
              height="560"
              rx="28"
              fill="#eaf5e0"
              className="dark:fill-emerald-950/30"
            />
            <text
              x="60"
              y="75"
              fontSize="14"
              fontWeight="700"
              fill="#14532d"
              className="dark:fill-emerald-300"
            >
              🌱 FIELD · SENSORS
            </text>

            {/* ---- Farmer backdrop ---- */}
            <rect
              x="930"
              y="40"
              width="240"
              height="560"
              rx="28"
              fill="#eaf5e0"
              className="dark:fill-emerald-950/30"
            />
            <text
              x="960"
              y="75"
              fontSize="14"
              fontWeight="700"
              fill="#14532d"
              className="dark:fill-emerald-300"
            >
              👨‍🌾 FARMER
            </text>

            {/* ---- Connection paths (animated dashes) ---- */}
            <g
              stroke="#86c65a"
              strokeWidth="2"
              fill="none"
              className="opacity-60"
            >
              {SENSORS.map((s, i) => (
                <path
                  key={i}
                  d={`M ${s.x + 26} ${s.y} Q 430 ${s.y}, ${MODEL.x} ${MODEL.y + MODEL.h / 2}`}
                  strokeDasharray="6 6"
                  className="animate-[dash_1.2s_linear_infinite]"
                />
              ))}
              <path
                d={`M ${MODEL.x + MODEL.w} ${MODEL.y + MODEL.h / 2} Q 850 ${MODEL.y + MODEL.h / 2}, ${FARMER.x} ${FARMER.y + 60}`}
                strokeDasharray="6 6"
                className="animate-[dash_1.2s_linear_infinite]"
              />
            </g>

            {/* ---- Sensors on crops ---- */}
            {SENSORS.map((s, i) => (
              <g key={i}>
                <motion.g
                  animate={
                    phase === "collect"
                      ? { opacity: [0.85, 1, 0.85] }
                      : { opacity: 0.6 }
                  }
                  transition={
                    phase === "collect"
                      ? { duration: 2, repeat: Infinity, delay: i * 0.2 }
                      : {}
                  }
                >
                  <circle
                    cx={s.x}
                    cy={s.y}
                    r="34"
                    fill="none"
                    stroke="#86c65a"
                    strokeWidth="1.5"
                    className="opacity-40"
                  />
                  <circle
                    cx={s.x}
                    cy={s.y + 18}
                    r="44"
                    fill="none"
                    stroke="#95d854"
                    strokeWidth="1"
                    className="opacity-25"
                  />
                </motion.g>
                {/* Plant */}
                <g transform={`translate(${s.x - 10}, ${s.y - 10})`}>
                  <PlantIcon />
                </g>
                {/* Sensor droplet badge */}
                <g transform={`translate(${s.x + 12}, ${s.y - 18})`}>
                  <circle
                    r="10"
                    fill="none"
                    stroke={
                      phase === "collect" && activeSensor === i
                        ? "#10b981"
                        : "#a7f3d0"
                    }
                    strokeWidth="1.5"
                    className="opacity-70"
                  />
                  <circle r="7" fill="#10b981" className="opacity-90" />
                  <circle r="2.5" fill="#fff" className="opacity-90" />
                </g>
                {/* Label */}
                <text
                  x={s.x}
                  y={s.y + 52}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="600"
                  fill="#2f6b3a"
                  className="dark:fill-emerald-200"
                >
                  {s.label} · {s.moisture}%
                </text>
              </g>
            ))}

            {/* ---- ML MODEL NODE ---- */}
            <g filter={phase === "process" ? "url(#glowModel)" : undefined}>
              {/* Model body */}
              <motion.rect
                x={MODEL.x}
                y={MODEL.y}
                width={MODEL.w}
                height={MODEL.h}
                rx="22"
                fill="#ffffff"
                className="dark:fill-slate-900"
                stroke={phase === "process" ? "#10b981" : "#14532d"}
                strokeWidth={phase === "process" ? 3 : 1.5}
                animate={
                  phase === "process" ? { scale: [1, 1.02, 1] } : { scale: 1 }
                }
                transition={
                  phase === "process"
                    ? { duration: 0.9, repeat: Infinity }
                    : { duration: 0.2 }
                }
              />
              <text
                x={MODEL.x + MODEL.w / 2}
                y={MODEL.y - 18}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#ffffff"
                className="dark:fill-emerald-100"
              >
                🤖 ML MODEL
              </text>
              {/* Chip label inside */}
              <text
                x={MODEL.x + MODEL.w / 2}
                y={MODEL.y + 34}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill="#14532d"
                className="dark:fill-emerald-200"
              >
                Edge Inference
              </text>
              <text
                x={MODEL.x + MODEL.w / 2}
                y={MODEL.y + 50}
                textAnchor="middle"
                fontSize="9.5"
                fill="#5b6b57"
                className="dark:fill-emerald-300/70"
              >
                RF / XGBoost · logistic
              </text>
              <text
                x={MODEL.x + MODEL.w / 2}
                y={MODEL.y + 65}
                textAnchor="middle"
                fontSize="9"
                fill="#86c65a"
              >
                off-line · no cloud
              </text>

              {/* Neural network mini-graph */}
              <g>
                {/* connections */}
                {NN_LAYERS.slice(0, -1).map((layer, li) =>
                  layer.map((n, ni) =>
                    NN_LAYERS[li + 1].map((nn, nni) => (
                      <line
                        key={`${li}-${ni}-${nni}`}
                        x1={n.x}
                        y1={n.y}
                        x2={nn.x}
                        y2={nn.y}
                        stroke="#86c65a"
                        strokeWidth="1"
                        className="opacity-40"
                      />
                    )),
                  ),
                )}
                {/* nodes */}
                {NN_LAYERS.map((layer, li) =>
                  layer.map((n, ni) => (
                    <motion.circle
                      key={`${li}-${ni}`}
                      cx={n.x}
                      cy={n.y}
                      r="6"
                      fill={li === NN_LAYERS.length - 1 ? "#10b981" : "#a7f3d0"}
                      stroke="#14532d"
                      strokeWidth="1"
                      animate={
                        phase === "process"
                          ? { r: [6, 8, 6], opacity: [0.7, 1, 0.7] }
                          : { r: 6, opacity: 0.85 }
                      }
                      transition={
                        phase === "process"
                          ? {
                              duration: 0.8,
                              repeat: Infinity,
                              delay: li * 0.12 + ni * 0.06,
                            }
                          : {}
                      }
                    />
                  )),
                )}
              </g>

              {/* Processing status pill */}
              {phase === "process" && (
                <motion.g
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <rect
                    x={MODEL.x + 40}
                    y={MODEL.y + 108}
                    width={130}
                    height={26}
                    rx="13"
                    fill="#14532d"
                    className="dark:fill-emerald-950/80"
                  />
                  <text
                    x={MODEL.x + 105}
                    y={MODEL.y + 124}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#d9ebcb"
                  >
                    PROCESSING… {Math.round(processingPct)}%
                  </text>
                </motion.g>
              )}

              {/* Inactive status pill */}
              {phase !== "process" && (
                <text
                  x={MODEL.x + MODEL.w / 2}
                  y={MODEL.y + MODEL.h - 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#5b6b57"
                  className="dark:fill-emerald-300/60"
                >
                  {phase === "deliver" ? "✓ Ready — sending" : "Awaiting data…"}
                </text>
              )}
            </g>

            {/* ==================== TRAVELING PARTICLES ==================== */}
            <AnimatePresence>
              {traveling.map((p) => {
                const pts = p.path;
                const mid = pts[Math.floor(pts.length / 2)];
                const color = p.kind === "delivery" ? "#10b981" : "#f59e0b";
                return (
                  <motion.g key={p.id} filter="url(#glowDot)">
                    {/* trail */}
                    <motion.circle
                      r="6"
                      fill={color}
                      className="opacity-20"
                      animate={{
                        cx: pts.map((pt) => pt.x),
                        cy: pts.map((pt) => pt.y),
                      }}
                      transition={{
                        duration: p.kind === "delivery" ? 1.6 : 1.9,
                        ease: "easeInOut",
                      }}
                    />
                    {/* head */}
                    <motion.circle
                      r="4"
                      fill={color}
                      animate={{
                        cx: pts.map((pt) => pt.x),
                        cy: pts.map((pt) => pt.y),
                      }}
                      transition={{
                        duration: p.kind === "delivery" ? 1.6 : 1.9,
                        ease: "easeInOut",
                      }}
                    />
                    {/* label of value travelling */}
                    <motion.text
                      fontSize="9"
                      fontWeight="600"
                      fill={color}
                      textAnchor="middle"
                      dy="-8"
                      animate={{ x: mid.x, y: mid.y, opacity: [0, 1, 1, 0] }}
                      transition={{
                        duration: p.kind === "delivery" ? 1.6 : 1.9,
                        times: [0, 0.4, 0.7, 1],
                      }}
                    >
                      {p.kind === "delivery"
                        ? "45 L"
                        : `${SENSORS[p.from].moisture}%`}
                    </motion.text>
                  </motion.g>
                );
              })}
            </AnimatePresence>

            {/* ---- FARMER NODE ---- */}
            <g>
              {/* Phone / dashboard tablet */}
              <motion.g
                animate={phase === "deliver" ? { y: [0, -3, 0] } : { y: 0 }}
                transition={
                  phase === "deliver" ? { duration: 1.4, repeat: Infinity } : {}
                }
              >
                <rect
                  x={FARMER.x}
                  y={FARMER.y}
                  width={FARMER.w}
                  height={FARMER.h}
                  rx="22"
                  fill="#ffffff"
                  className="dark:fill-slate-900"
                  stroke={phase === "deliver" ? "#10b981" : "#14532d"}
                  strokeWidth={phase === "deliver" ? 3 : 1.5}
                />
                <text
                  x={FARMER.x + FARMER.w / 2}
                  y={FARMER.y - 18}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="#ffffff"
                  className="dark:fill-emerald-100"
                >
                  👨‍🌾 FARMER
                </text>

                {/* Recommendation card inside */}
                <rect
                  x={FARMER.x + 15}
                  y={FARMER.y + 16}
                  width={FARMER.w - 30}
                  height={70}
                  rx="14"
                  fill={phase === "deliver" ? "#10b981" : "#eaf5e0"}
                  className="dark:fill-emerald-950/50"
                />
                <text
                  x={FARMER.x + FARMER.w / 2}
                  y={FARMER.y + 42}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill={phase === "deliver" ? "#fff" : "#14532d"}
                >
                  {phase === "deliver" ? "💧 Water now" : "Waiting…"}
                </text>
                <text
                  x={FARMER.x + FARMER.w / 2}
                  y={FARMER.y + 60}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="800"
                  fill={phase === "deliver" ? "#fff" : "#5b6b57"}
                >
                  {phase === "deliver" ? "~45 L · 68%" : "—"}
                </text>

                {/* Phone dots (home indicator) */}
                <line
                  x1={FARMER.x + 60}
                  y1={FARMER.y + 112}
                  x2={FARMER.x + 130}
                  y2={FARMER.y + 112}
                  stroke="#d1d5db"
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="dark:stroke-slate-700"
                />
              </motion.g>
            </g>
          </svg>

          {/* Legend */}
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 px-2 pb-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Sensor
              data particle
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />{" "}
              Recommendation packet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-emerald-500/70" /> ML
              processing glow
            </span>
          </div>
        </div>

        {/* ==================== LIVE EVENT FEED + EXPLAINER ==================== */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Event feed */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-5 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                📡 Live event feed
              </h2>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                {play ? "Streaming" : "Paused"}
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence initial={false}>
                {log.length === 0 && (
                  <p className="text-sm text-slate-400 dark:text-slate-500">
                    Waiting for events… press Play to begin.
                  </p>
                )}
                {log.map((entry, i) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: i === 0 ? 1 : 0.65, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 rounded-xl border border-slate-200/70 dark:border-white/5 bg-slate-50/70 dark:bg-slate-800/40 px-3 py-2"
                  >
                    <span
                      className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
                        entry.kind === "deliver"
                          ? "bg-emerald-500"
                          : entry.kind === "process"
                            ? "bg-purple-500"
                            : "bg-amber-500"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs text-slate-700 dark:text-slate-300">
                        {entry.text}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] text-slate-400 dark:text-slate-500">
                      {entry.time}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {/* Explainer of the loop */}
          <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-emerald-950/30 dark:to-slate-900/75 p-5 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08)] backdrop-blur-2xl">
            <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">
              🔁 What you're watching
            </h2>
            <ol className="space-y-3">
              {[
                {
                  icon: "🛰️",
                  title: "1 · Sensors on the crops",
                  text: "Six plots read soil moisture, temperature, and humidity every 15–30 minutes. Each droplet is a live reading leaving the field.",
                },
                {
                  icon: "🧠",
                  title: "2 · Data reaches the ML model",
                  text: "The particle travels along the green path into the edge model. Inside, the neural network pulses as it predicts: water now, or wait?",
                },
                {
                  icon: "📲",
                  title: "3 · Farmer gets the insight",
                  text: "A clear, plain-language recommendation — like 'Water now · ~45 L' — is delivered. It works offline on a cheap edge device.",
                },
              ].map((s) => (
                <li key={s.title} className="flex gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/80 dark:bg-white/10 text-base shadow-sm">
                    {s.icon}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {s.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
