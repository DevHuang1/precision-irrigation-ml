"use client";

import { useEffect, useRef, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */
interface TitleSlide {
  id: string;
  title: string;
  subtitle: string;
  type: "title";
  tag: string;
  sources?: string[];
  variant?: "hero";
}

interface ContentSlide {
  id: string;
  title: string;
  type: "content";
  bullets: Array<string | { heading: string; text?: string; items?: string[] }>;
  pillars?: Array<{ icon: string; label: string; desc: string }>;
  highlights?: Array<{ icon: string; label: string; desc: string }>;
  subItems?: string[];
  flow?: string[];
  layers?: Array<{ label: string; desc: string }>;
  columns?: Array<{ heading: string; items: string[] }>;
  variant?: "hero" | "light";
}

interface GridSlide {
  id: string;
  title: string;
  type: "grid";
  cards: Array<{ title: string; items: string[] }>;
  note?: string;
  variant?: "hero" | "light";
}

interface TableSlide {
  id: string;
  title: string;
  type: "table";
  columns: string[];
  rows: Array<Record<string, string> | string[]>;
  bullets?: Array<
    string | { heading: string; text?: string; items?: string[] }
  >;
  variant?: "hero" | "light";
}

type SlideData = TitleSlide | ContentSlide | GridSlide | TableSlide;

/* ------------------------------------------------------------------ */
/*  Slide data — enriched from all PDF sources (v2 + v3 + Dev Pack)   */
/*  Colors and design tokens extracted directly from the PDFs          */
/* ------------------------------------------------------------------ */
const SLIDES: SlideData[] = [
  {
    id: "title",
    title: "AI-Powered Precision Irrigation",
    subtitle:
      "Research Proposal v3 — A matured research proposal with reviewed literature, refined methodology, system design, and execution roadmap.",
    type: "title",
    tag: "Research Proposal v3",
    sources: [
      "AI_Precision_Irrigation_Proposal_v3.pdf",
      "AI_Precision_Irrigation_Development.pdf",
      "Green_Beige_Modern_Agriculture_Presentation.pdf",
    ],
    variant: "hero",
  },
  {
    id: "problem",
    title: "Problem & Background",
    type: "content",
    bullets: [
      {
        heading: "Key Problem",
        text: "How can AI-powered irrigation improve water efficiency while remaining affordable, low-power, and practical for local vegetable farmers to actually adopt and trust?",
      },
      {
        heading: "Background",
        text: "Agriculture accounts for the largest share of global freshwater withdrawals of any sector. Water scarcity and increasingly variable rainfall are placing sustainable vegetable farming under growing pressure. Conventional, schedule-based irrigation routinely over- or under-applies water, wasting a scarce resource and stressing crops. Precision-irrigation technologies exist, but cost, connectivity requirements, and complexity keep them out of reach for most small-scale vegetable farmers.",
      },
    ],
    pillars: [
      {
        icon: "🌍",
        label: "Freshwater Stress",
        desc: "Largest sector withdrawal globally",
      },
      {
        icon: "🌡️",
        label: "Climate Variability",
        desc: "Unpredictable rainfall disrupts scheduling",
      },
      {
        icon: "💰",
        label: "Adoption Barriers",
        desc: "Cost, connectivity & complexity block smallholders",
      },
    ],
  },
  {
    id: "aim",
    title: "Research Aim",
    type: "content",
    bullets: [
      {
        heading: "Aim",
        text: "To investigate the effectiveness and practical feasibility of a low-cost, machine-learning-integrated edge precision irrigation system for sustainable vegetable farming.",
      },
    ],
    highlights: [
      {
        icon: "🤖",
        label: "Technology",
        desc: "ML-based prediction and automated, sensor-driven irrigation control",
      },
      {
        icon: "💧",
        label: "Sustainability",
        desc: "Measurable gains in water-use efficiency without sacrificing crop yield",
      },
      {
        icon: "👨‍🌾",
        label: "Adoption",
        desc: "Real-world cost, usability, and trust barriers for smallholder farmers",
      },
    ],
  },
  {
    id: "questions",
    title: "Research Questions",
    type: "content",
    bullets: [
      {
        heading: "Main Question",
        text: "To what extent can a low-cost, machine-learning-integrated edge precision irrigation system improve water-use efficiency and support vegetable crop productivity — and what technical, economic, and socio-cultural factors influence its adoption by local farmers?",
      },
    ],
    subItems: [
      "How accurately can ML predict irrigation requirements from sensor data?",
      "Can the system meaningfully reduce water consumption versus conventional practice?",
      "How does AI-guided irrigation affect vegetable crop productivity?",
      "Which model — Random Forest or XGBoost — performs best on low-cost edge hardware?",
      "What barriers most influence whether farmers adopt and trust the system?",
    ],
  },
  {
    id: "objectives",
    title: "Research Objectives",
    type: "content",
    bullets: [
      {
        heading: "System & Measurement",
        items: [
          "Develop a low-cost, edge-based precision irrigation prototype",
          "Collect soil and environmental data across a full vegetable crop cycle",
          "Develop and benchmark ML models (Random Forest, XGBoost) for irrigation prediction",
          "Evaluate water consumption, crop yield, and water-use efficiency (WUE)",
        ],
      },
      {
        heading: "Evaluation & Practice",
        items: [
          "Compare AI-guided irrigation against conventional farmer practice under matched conditions",
          "Investigate farmer perceptions, trust, and adoption barriers via mixed methods",
          "Benchmark on-device inference cost (latency, memory, power) for edge feasibility",
          "Propose practical, costed recommendations for local implementation",
        ],
      },
    ],
  },
  {
    id: "literature",
    title: "Literature Review",
    type: "content",
    bullets: [
      {
        heading: "What the Literature Already Tells Us",
        text: "16 studies (2021–2026) reviewed across four themes directly relevant to this system.",
      },
    ],
    columns: [
      {
        heading: "ML for Irrigation Prediction",
        items: [
          "Random Forest and XGBoost consistently lead classical benchmarks (84–97% accuracy)",
          "Predict irrigation timing and volume from sensor data",
        ],
      },
      {
        heading: "Low-Cost Edge & IoT Hardware",
        items: [
          "On-device inference avoids rural connectivity failure points",
          "Modular ESP32-based rigs cut hardware cost by roughly half in field trials",
        ],
      },
      {
        heading: "Evapotranspiration & Soil Modeling",
        items: [
          "Recent-history soil moisture often predicts irrigation need as well as full Penman-Monteith",
          "Achieves this with far fewer sensors required",
        ],
      },
      {
        heading: "Farmer Adoption",
        items: [
          "Cost, complexity, and trust — not accuracy — are the top-ranked reasons smallholders reject precision-agriculture tools",
        ],
      },
    ],
  },
  {
    id: "literature-matrix",
    title: "Literature Matrix — Key Studies",
    type: "table",
    columns: ["Study (Source, Year)", "Focus", "Key Finding"],
    rows: [
      /* Theme A — ML for Irrigation Prediction & Scheduling */
      {
        "Study (Source, Year)":
          "Intelligent Irrigation Scheduling — Academia.edu, 2025",
        Focus: "DT, RF, Naive Bayes",
        "Key Finding":
          "Near-perfect accuracy on ~150k records, 197 crop types, 10 soil classes",
      },
      {
        "Study (Source, Year)":
          "Smart IoT-Driven Precision Agriculture — PLOS ONE, 2025",
        Focus: "RF, XGBoost, LightGBM, CatBoost + fuzzy logic",
        "Key Finding":
          "RF ~97% crop classification, ~96% yield; solar-powered fuzzy-logic controller",
      },
      {
        "Study (Source, Year)": "Sustainable Irrigation System — PMC, 2021",
        Focus: "DT, RF, Neural Network, SVM",
        "Key Finding":
          "Random Forest top performer at ~84.6% accuracy for irrigation timing",
      },
      {
        "Study (Source, Year)":
          "On-Device AI for Climate-Resilient Farming — Sci. Reports, 2025",
        Focus: "Edge-deployed Random Forest",
        "Key Finding":
          "Lightweight RF ran on consumer smart-display, no cloud, ~90% accuracy",
      },
      {
        "Study (Source, Year)": "Scalable ML Framework — ScienceDirect, 2025",
        Focus: "XGBoost soil-water depletion",
        "Key Finding": "XGBoost matched FAO-56 within ±4mm (R² ≥ 0.72)",
      },
      {
        "Study (Source, Year)": "Basil Yield Prediction — arXiv, 2025",
        Focus: "RF, XGBoost, hybrid RF-XGBoost",
        "Key Finding":
          "RF robust on noisy IoT data but has interpretability/compute limits on edge",
      },
      /* Theme B — Low-Cost Edge Computing & IoT Hardware */
      {
        "Study (Source, Year)":
          "IoT Low-Cost Smart Farming — ResearchGate, 2022",
        Focus: "Cloud-based IoT sensing",
        "Key Finding":
          "Sensor suite matches proposed architecture; cloud-dependent (this study avoids)",
      },
      {
        "Study (Source, Year)": "TinyML-Enabled IoT — ResearchGate, 2026",
        Focus: "On-device AI / TinyML",
        "Key Finding":
          "Blueprint for on-device inference where rural cloud/internet is unreliable",
      },
      {
        "Study (Source, Year)":
          "Edge-IoT/AI 'Irrigation in a Box' — IOS Press, 2022",
        Focus: "Fog-IoT/AI",
        "Key Finding":
          "Plug-and-sense, low-cost, open-source system aimed at smallholder communities",
      },
      {
        "Study (Source, Year)":
          "Low-Cost Modular Irrigation — ScienceDirect, 2026",
        Focus: "ESP32 edge hardware",
        "Key Finding":
          "Custom valve cut cost from ~$50 to ~$25 over 100-week Uganda trial",
      },
      {
        "Study (Source, Year)":
          "Smart Drip Irrigation IoT Review — Springer, 2025",
        Focus: "Review",
        "Key Finding":
          "Rural connectivity, hardware cost, energy are recurring smallholder barriers",
      },
      /* Theme C — Evapotranspiration & Soil-Moisture Modeling */
      {
        "Study (Source, Year)":
          "Deep Learning Evapotranspiration — Sci. Reports, 2025",
        Focus: "Deep learning vs. Penman-Monteith",
        "Key Finding":
          "Approximates FAO-56 reference ET with fewer meteorological inputs",
      },
      {
        "Study (Source, Year)": "Soil Moisture Forecast — ScienceDirect, 2022",
        Focus: "Data-driven soil-moisture forecasting",
        "Key Finding":
          "Past soil moisture + precip forecast outperformed full ET/hydraulic models",
      },
      {
        "Study (Source, Year)":
          "ML for Watermelon Irrigation — ScienceDirect, 2025",
        Focus: "RF vs. ANN, real vegetable crop",
        "Key Finding":
          "ANN outperformed RF (R² up to 0.92) across four irrigation treatments",
      },
      /* Theme D — Farmer Adoption of Precision/Smart Agriculture */
      {
        "Study (Source, Year)":
          "PA Adoption Meta-Analysis — MDPI Sustainability, 2025",
        Focus: "Meta-analysis, 85 studies / 1,472 farms",
        "Key Finding":
          "Benefits scale with farm size; smallholders face steeper adoption barriers",
      },
      {
        "Study (Source, Year)":
          "PA Adoption, North China Plain — Springer, 2021",
        Focus: "Qualitative interviews",
        "Key Finding":
          "Cost, suitability, and trust are dominant barriers for small-scale family farms",
      },
      {
        "Study (Source, Year)": "PA Technology Adoption, Kentucky — MDPI, 2025",
        Focus: "TAM-based farmer survey",
        "Key Finding":
          "Cost (~20%), complexity (~15%), unclear profitability (~12%) — top barriers",
      },
    ],
  },
  {
    id: "gap",
    title: "Research Gap & Contribution",
    type: "content",
    bullets: [
      {
        heading: "Identified Gap",
        text: "The literature evaluates model accuracy, water-use efficiency, crop productivity, and farmer adoption largely in isolation. Very few studies examine all four together on the same low-cost system.",
      },
      {
        heading: "Proposed Contribution",
        text: "A low-cost, edge-based AI irrigation system evaluated jointly from a technical perspective and a socio-technical (farmer adoption) perspective — moving beyond 'how accurate is the model?' to: 'Does the AI actually save water, support crop production, and provide a solution farmers can realistically adopt?'",
      },
    ],
    flow: [
      "ML Performance",
      "Water-Use Efficiency",
      "Crop Productivity",
      "Farmer Adoption",
    ],
  },
  {
    id: "architecture",
    title: "System Architecture",
    type: "content",
    bullets: [
      "Sensors → Edge Device → ML Model → Irrigation Decision → Automated Pump / Valve → Vegetable Crop",
      "Sensors: Soil Moisture | Temperature | Humidity | Water Flow",
      "ML: Random Forest / XGBoost → Irrigation Decision → Automated Pump / Valve",
    ],
    layers: [
      {
        label: "Sensing",
        desc: "Soil moisture, temperature, humidity, water flow — sampled every 15–30 min",
      },
      {
        label: "Edge",
        desc: "ESP32 / Raspberry Pi class — local processing, no continuous internet",
      },
      {
        label: "Decision",
        desc: "Trained RF/XGBoost model converts readings into irrigation action",
      },
      {
        label: "Actuation",
        desc: "Automated pump / solenoid valve executes drip or sprinkler",
      },
      {
        label: "Feedback",
        desc: "Post-irrigation readings close the loop for retraining; rule-based fallback if model/sensor unavailable",
      },
    ],
  },
  {
    id: "methodology",
    title: "Research Methodology",
    type: "content",
    bullets: [
      {
        heading: "Design",
        text: "Explanatory sequential mixed-methods design — a quantitative field trial, followed by an embedded qualitative adoption study, combined through a joint-display analysis. This directly answers the proposal's framing: moving beyond 'how accurate is the AI?' to 'does it actually save water, support production, and get adopted?'",
      },
    ],
    columns: [
      {
        heading: "Quantitative Strand",
        items: [
          "Soil moisture, temperature & humidity (continuous)",
          "Water applied per irrigation event",
          "Crop yield at harvest",
          "ML model prediction accuracy",
          "Water-use efficiency (WUE)",
        ],
      },
      {
        heading: "Qualitative Strand",
        items: [
          "Semi-structured interviews (8–15 farmers)",
          "TAM-based usability & acceptance survey",
          "Trust in AI-driven irrigation decisions",
          "Perceived cost vs. benefit",
          "Inductive thematic coding of transcripts",
        ],
      },
    ],
  },
  {
    id: "experimental-design",
    title: "Experimental Design",
    type: "table",
    columns: ["Variable", "Instrument", "Frequency"],
    rows: [
      {
        Variable: "Soil moisture (%)",
        Instrument: "Capacitive soil sensor (2 depths if feasible)",
        Frequency: "Every 15–30 min",
      },
      {
        Variable: "Temperature & humidity",
        Instrument: "DHT22 / SHT-class sensor",
        Frequency: "Every 15–30 min",
      },
      {
        Variable: "Water applied",
        Instrument: "In-line flow meter",
        Frequency: "Per irrigation event",
      },
      {
        Variable: "Rainfall",
        Instrument: "Rain gauge / weather API",
        Frequency: "Continuous",
      },
      {
        Variable: "Crop growth stage & yield",
        Instrument: "Manual observation log",
        Frequency: "Weekly / at harvest",
      },
    ],
    bullets: [
      {
        heading: "Treatment vs. Control",
        text: "Treatment plot — irrigated automatically by the trained ML model via the edge device. Control plot — irrigated using the farmer's conventional schedule-based practice. Both plots: same crop, same planting date, comparable soil and light conditions — isolating irrigation method as the variable of interest. WUE = Crop Yield (kg) ÷ Total Water Applied (m³)",
      },
    ],
  },
  {
    id: "ml-plan",
    title: "Machine Learning Model Development",
    type: "content",
    bullets: [
      {
        heading: "Model Comparison",
        text: "Four-model comparison with explicit baseline threshold.",
      },
    ],
    columns: [
      {
        heading: "Models & Roles",
        items: [
          "Rule-based threshold — Sanity-check floor ('Irrigate if soil moisture < X%')",
          "Random Forest — Primary candidate; 84–97% accuracy in literature; robust to noisy sensors; interpretable",
          "XGBoost — Primary candidate; matches/beats RF on regression; lighter/faster for edge inference",
          "Linear/logistic regression — Secondary baseline; cheap interpretability check",
        ],
      },
      {
        heading: "Training & Validation",
        items: [
          "Chronological split (NOT random shuffle) — avoids leaking future data",
          "TimeSeriesSplit (k=5) for hyperparameter tuning",
          "Metrics: Accuracy/F1 (classification) or RMSE/MAE/R² (regression)",
          "Benchmark vs. FAO-56 Penman-Monteith agronomic standard",
        ],
      },
    ],
    highlights: [
      {
        icon: "🔍",
        label: "Explainability",
        desc: "SHAP values / feature importance (Gini > 0.1)",
      },
      {
        icon: "📦",
        label: "Edge Export",
        desc: "joblib / ONNX; quantize to int8 for microcontrollers",
      },
      {
        icon: "🛡️",
        label: "Safety Fallback",
        desc: "Rule-based threshold if model/sensor unavailable",
      },
    ],
  },
  {
    id: "roadmap",
    title: "Execution Roadmap",
    type: "table",
    columns: ["Phase", "Focus", "Duration"],
    rows: [
      {
        Phase: "Phase 0",
        Focus: "Literature Consolidation",
        Duration: "2 wks",
      },
      {
        Phase: "Phase 1",
        Focus: "System & Sensor Design Finalization",
        Duration: "2 wks",
      },
      {
        Phase: "Phase 2",
        Focus: "Protocol & Ethics Sign-off",
        Duration: "2 wks",
      },
      { Phase: "Phase 3", Focus: "Pilot Data Collection", Duration: "2–3 wks" },
      {
        Phase: "Phase 4",
        Focus: "ML Pipeline Build (parallel)",
        Duration: "3–4 wks",
      },
      {
        Phase: "Phase 5",
        Focus: "Full-Season Field Trial",
        Duration: "8–14 wks",
      },
      { Phase: "Phase 6", Focus: "Retrain & Edge Deploy", Duration: "2–3 wks" },
      { Phase: "Phase 7", Focus: "Adoption Study", Duration: "2–3 wks" },
      {
        Phase: "Phase 8",
        Focus: "Analysis, Triangulation & Write-Up",
        Duration: "3–4 wks",
      },
    ],
    bullets: [
      {
        heading: "Phase 8 Detail",
        text: "Combine WUE, yield, and model-accuracy results with adoption-barrier findings using a joint-display table; write the discussion, limitations, and practical recommendations.",
      },
    ],
  },
  {
    id: "risks",
    title: "Risks & Known Limitations",
    type: "table",
    columns: ["Risk", "Impact", "Mitigation"],
    rows: [
      {
        Risk: "Sensor failure or drift during trial",
        Impact: "Gaps or noise in time series",
        Mitigation: "Periodic manual spot-checks; log downtime explicitly",
      },
      {
        Risk: "Single-site, single-season scope",
        Impact: "Limits statistical generalizability",
        Mitigation: "Frame findings as feasibility evidence, not broad claims",
      },
      {
        Risk: "Farmers override or distrust automation",
        Impact: "Confounds AI-vs-conventional comparison",
        Mitigation:
          "Log every manual override with timestamp and reason as qualitative data",
      },
      {
        Risk: "Edge hardware too weak for full model",
        Impact: "Undermines 'low-cost edge' claim",
        Mitigation:
          "Benchmark inference early; keep lighter fallback model ready",
      },
      {
        Risk: "Ethics/IRB approval delay",
        Impact: "Delays farmer-facing data collection",
        Mitigation:
          "Submit in Phase 0/1, in parallel with hardware procurement",
      },
    ],
  },
  {
    id: "outcomes",
    title: "Expected Outcomes & Contribution",
    type: "content",
    bullets: [
      {
        heading: "Expected Outcomes",
        items: [
          "A working, low-cost AI precision-irrigation prototype",
          "A quantified improvement in water-use efficiency vs. conventional irrigation",
          "A benchmarked comparison of ML models for irrigation prediction on edge hardware",
          "Evidence on vegetable crop productivity under AI-guided irrigation",
          "An evidence-based account of the barriers that shape farmer adoption",
        ],
      },
      {
        heading: "Research Contribution",
        text: "Technology + Sustainability + Human Adoption. This study moves beyond 'how accurate is the AI?' to ask whether it actually saves water, supports production, and offers a solution farmers can realistically adopt.",
      },
    ],
  },
  {
    id: "closing",
    title: "Thank You",
    subtitle:
      "Questions, feedback, and collaboration are welcome as this proposal moves into field deployment.",
    type: "title",
    tag: "Research Proposal v3 — Fradel and Spies",
    variant: "hero",
  },
];

/* ------------------------------------------------------------------ */
/*  PDF-EXACT COLOR TOKENS                                             */
/*  Extracted directly from the proposal PDFs (see analysis):         */
/*   #14532d deep forest green · #1f6033 mid green · #86c65a lime       */
/*   #95d854 bright lime · #e4f1d9 sage · #fcfdfb cream                 */
/*   #1f2b22 charcoal text · #d9ebcb light text                        */
/* ------------------------------------------------------------------ */
const PDF_COLORS = {
  deepGreen: "#14532d",
  midGreen: "#1f6033",
  lime: "#86c65a",
  brightLime: "#95d854",
  sage: "#e4f1d9",
  cream: "#fcfdfb",
  darkText: "#1f2b22",
  lightText: "#d9ebcb",
  mutedGreen: "#5b6b57",
  charcoal: "#223022",
  beige: "#faf9ed",
} as const;

/* ------------------------------------------------------------------ */
/*  Progress Bar                                                       */
/* ------------------------------------------------------------------ */
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total === 0 ? 0 : ((current + 1) / total) * 100;
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 h-1"
      style={{ backgroundColor: `${PDF_COLORS.sage}66` }}
    >
      <div
        className="h-full transition-all duration-500 ease-out"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(to right, ${PDF_COLORS.lime}, ${PDF_COLORS.brightLime})`,
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide Counter                                                      */
/* ------------------------------------------------------------------ */
function SlideCounter({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="fixed top-3 right-4 z-40 hidden rounded-full px-3 py-1 text-xs font-medium shadow-sm backdrop-blur-md sm:block"
      style={{
        backgroundColor: `${PDF_COLORS.sage}cc`,
        color: PDF_COLORS.deepGreen,
        border: `1px solid ${PDF_COLORS.lime}55`,
      }}
    >
      Slide {current + 1} / {total}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide Renderer                                                     */
/* ------------------------------------------------------------------ */
function Slide({ data, index }: { data: SlideData; index: number }) {
  const variant = (data as { variant?: string }).variant || "light";

  /* ---------- HERO / TITLE SLIDES (dark green bg) ---------- */
  if (data.type === "title") {
    const d = data as TitleSlide;
    return (
      <div
        className="flex h-full flex-col items-center justify-center text-center px-6 rounded-3xl"
        style={{
          background: `linear-gradient(135deg, ${PDF_COLORS.deepGreen} 0%, ${PDF_COLORS.midGreen} 100%)`,
          border: `1px solid ${PDF_COLORS.lime}33`,
          boxShadow:
            "inset 0 1px 0 0 rgba(134,198,90,0.30), inset 0 -1px 0 0 rgba(0,0,0,0.30), 0 4px 6px -1px rgba(20,83,45,0.20), 0 12px 24px -4px rgba(20,83,45,0.25)",
        }}
      >
        <div
          className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold backdrop-blur-md"
          style={{
            backgroundColor: `${PDF_COLORS.lime}1f`,
            color: PDF_COLORS.lightText,
            border: `1px solid ${PDF_COLORS.lime}55`,
          }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              backgroundColor: PDF_COLORS.lime,
              boxShadow: `0 0 8px ${PDF_COLORS.lime}99`,
            }}
          />
          {d.tag}
        </div>
        <h1
          className="mb-4 leading-tight"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            color: PDF_COLORS.lightText,
            letterSpacing: "-0.02em",
          }}
        >
          {d.title}
        </h1>
        <p
          className="max-w-2xl leading-relaxed"
          style={{
            color: `${PDF_COLORS.lightText}d9`,
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
          }}
        >
          {d.subtitle}
        </p>
        {d.sources && (
          <div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            style={{ color: `${PDF_COLORS.lightText}99` }}
          >
            {d.sources.map((src, i) => (
              <span
                key={i}
                className="rounded-lg px-3 py-1.5 text-xs"
                style={{
                  border: `1px solid ${PDF_COLORS.lime}3a`,
                  backgroundColor: `${PDF_COLORS.lime}14`,
                  color: `${PDF_COLORS.lightText}cc`,
                }}
              >
                {src}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---------- TABLE SLIDES ---------- */
  if (data.type === "table") {
    const d = data as TableSlide;
    const isHero = variant === "hero";
    const hasBullets = "bullets" in data && data.bullets;
    return (
      <div className="flex h-full flex-col justify-center px-6">
        <h2
          className="mb-6"
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
            fontWeight: 700,
            color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
            letterSpacing: "-0.01em",
          }}
        >
          {d.title}
        </h2>
        <div
          className="overflow-x-auto rounded-2xl mb-6"
          style={{
            border: `1px solid ${PDF_COLORS.lime}33`,
            backgroundColor: isHero
              ? `${PDF_COLORS.deepGreen}cc`
              : PDF_COLORS.sage,
            boxShadow:
              "0 4px 6px -1px rgba(20,83,45,0.08), 0 12px 24px -4px rgba(20,83,45,0.06)",
          }}
        >
          <table className="w-full text-left">
            <thead>
              <tr
                style={{
                  borderBottom: `1px solid ${PDF_COLORS.lime}33`,
                  backgroundColor: isHero
                    ? `${PDF_COLORS.midGreen}99`
                    : `${PDF_COLORS.sage}e6`,
                }}
              >
                {(d.columns ?? []).map((c, ci) => (
                  <th
                    key={String(ci)}
                    className="whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide"
                    style={{
                      color: isHero
                        ? PDF_COLORS.lightText
                        : PDF_COLORS.deepGreen,
                    }}
                  >
                    {String(c)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(d.rows ?? []).map((row, i) => (
                <tr
                  key={i}
                  className="transition-colors"
                  style={{ borderBottom: `1px solid ${PDF_COLORS.lime}1a` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = isHero
                      ? `${PDF_COLORS.midGreen}88`
                      : `${PDF_COLORS.sage}e6`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  {(Array.isArray(row) ? row : Object.values(row)).map(
                    (cell, j) => (
                      <td
                        key={j}
                        className="whitespace-nowrap px-4 py-3"
                        style={{
                          color: isHero
                            ? `${PDF_COLORS.lightText}ee`
                            : PDF_COLORS.charcoal,
                          fontSize: "0.875rem",
                        }}
                      >
                        {String(cell)}
                      </td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {hasBullets && (
          <div className="space-y-5">
            {(d.bullets ?? []).map((b, i) => (
              <div key={i} className="flex gap-4">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: PDF_COLORS.lime,
                    boxShadow: `0 0 8px ${PDF_COLORS.lime}55`,
                  }}
                />
                <div>
                  {typeof b === "string" ? (
                    <p
                      className="text-sm md:text-base leading-relaxed"
                      style={{
                        color: isHero
                          ? `${PDF_COLORS.lightText}ee`
                          : PDF_COLORS.charcoal,
                      }}
                    >
                      {b}
                    </p>
                  ) : (
                    <>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: isHero
                            ? PDF_COLORS.lightText
                            : PDF_COLORS.charcoal,
                        }}
                      >
                        {b.heading}
                      </p>
                      <p
                        className="mt-1 text-sm leading-relaxed"
                        style={{
                          color: isHero
                            ? `${PDF_COLORS.lightText}cc`
                            : PDF_COLORS.mutedGreen,
                        }}
                      >
                        {b.text}
                      </p>
                      {b.items && (
                        <ul className="mt-2 space-y-1">
                          {(b.items ?? []).map((item, j) => (
                            <li
                              key={j}
                              className="flex gap-2 text-xs"
                              style={{
                                color: isHero
                                  ? `${PDF_COLORS.lightText}aa`
                                  : PDF_COLORS.mutedGreen,
                              }}
                            >
                              <span
                                className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                                style={{ backgroundColor: PDF_COLORS.lime }}
                              />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  /* ---------- GRID SLIDES ---------- */
  if (data.type === "grid") {
    const d = data as GridSlide;
    const isHero = variant === "hero";
    return (
      <div className="flex h-full flex-col justify-center px-6">
        <h2
          className="mb-6"
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
            fontWeight: 700,
            color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
            letterSpacing: "-0.01em",
          }}
        >
          {d.title}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {(d.cards ?? []).map((card, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: isHero
                  ? `${PDF_COLORS.midGreen}cc`
                  : PDF_COLORS.sage,
                border: `1px solid ${PDF_COLORS.lime}33`,
                boxShadow:
                  "inset 0 1px 0 0 rgba(134,198,90,0.25), 0 4px 6px -1px rgba(20,83,45,0.08)",
              }}
            >
              <h3
                className="text-sm font-semibold mb-2"
                style={{
                  color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
                }}
              >
                {card.title}
              </h3>
              <ul className="space-y-1.5">
                {card.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex gap-2 text-xs"
                    style={{
                      color: isHero
                        ? `${PDF_COLORS.lightText}cc`
                        : PDF_COLORS.mutedGreen,
                    }}
                  >
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: PDF_COLORS.lime }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {d.note && (
          <div
            className="rounded-2xl p-5"
            style={{
              border: `1px solid ${PDF_COLORS.lime}33`,
              backgroundColor: isHero
                ? `${PDF_COLORS.midGreen}99`
                : `${PDF_COLORS.sage}d9`,
              color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
            }}
          >
            <p className="text-sm">
              <span className="font-semibold">Edge Deployment Strategy. </span>
              {d.note}
            </p>
          </div>
        )}
      </div>
    );
  }

  /* ---------- DEFAULT CONTENT SLIDES ---------- */
  const d = data as ContentSlide;
  const isHero = variant === "hero";

  return (
    <div className="flex h-full flex-col justify-center px-6">
      <h2
        className="mb-6"
        style={{
          fontSize: "clamp(1.5rem, 3vw, 2.25rem)",
          fontWeight: 700,
          color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
          letterSpacing: "-0.01em",
        }}
      >
        {d.title}
      </h2>

      {/* Pillars */}
      {d.pillars && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {d.pillars.map((p, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 text-center transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: isHero
                  ? `${PDF_COLORS.midGreen}cc`
                  : PDF_COLORS.sage,
                border: `1px solid ${PDF_COLORS.lime}33`,
                boxShadow:
                  "inset 0 1px 0 0 rgba(134,198,90,0.25), 0 4px 6px -1px rgba(20,83,45,0.06)",
              }}
            >
              <span className="text-2xl mb-2 block">{p.icon}</span>
              <p
                className="text-sm font-semibold"
                style={{
                  color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
                }}
              >
                {p.label}
              </p>
              <p
                className="text-xs mt-1"
                style={{
                  color: isHero
                    ? `${PDF_COLORS.lightText}cc`
                    : PDF_COLORS.mutedGreen,
                }}
              >
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Highlights */}
      {d.highlights && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          {d.highlights.map((h, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 text-center transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: isHero
                  ? `${PDF_COLORS.midGreen}cc`
                  : PDF_COLORS.sage,
                border: `1px solid ${PDF_COLORS.lime}33`,
                boxShadow:
                  "inset 0 1px 0 0 rgba(134,198,90,0.25), 0 4px 6px -1px rgba(20,83,45,0.06)",
              }}
            >
              <span className="text-2xl mb-2 block">{h.icon}</span>
              <p
                className="text-sm font-semibold"
                style={{
                  color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
                }}
              >
                {h.label}
              </p>
              <p
                className="text-xs mt-1"
                style={{
                  color: isHero
                    ? `${PDF_COLORS.lightText}cc`
                    : PDF_COLORS.mutedGreen,
                }}
              >
                {h.desc}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Flow diagram */}
      {d.flow && (
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {d.flow.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <div
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200"
                style={{
                  backgroundColor: isHero
                    ? `${PDF_COLORS.midGreen}cc`
                    : PDF_COLORS.sage,
                  border: `1px solid ${PDF_COLORS.lime}33`,
                  color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
                }}
              >
                {step}
              </div>
              {i < d.flow!.length - 1 && (
                <span className="text-lg" style={{ color: PDF_COLORS.lime }}>
                  ↓
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Layers */}
      {d.layers && (
        <div className="mb-6 space-y-3">
          {d.layers.map((layer, i) => (
            <div
              key={i}
              className="rounded-xl p-4 flex items-start gap-4 transition-all duration-200"
              style={{
                backgroundColor: isHero
                  ? `${PDF_COLORS.midGreen}a6`
                  : PDF_COLORS.sage,
                border: `1px solid ${PDF_COLORS.lime}2a`,
                boxShadow:
                  "inset 0 1px 0 0 rgba(134,198,90,0.20), 0 2px 4px -1px rgba(20,83,45,0.06)",
              }}
            >
              <div
                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                style={{
                  backgroundColor: `${PDF_COLORS.lime}33`,
                  color: isHero ? PDF_COLORS.lightText : PDF_COLORS.deepGreen,
                  border: `1px solid ${PDF_COLORS.lime}55`,
                }}
              >
                {i + 1}
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
                  }}
                >
                  {layer.label}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{
                    color: isHero
                      ? `${PDF_COLORS.lightText}cc`
                      : PDF_COLORS.mutedGreen,
                  }}
                >
                  {layer.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bullets */}
      <div className="space-y-5">
        {(d.bullets ?? []).map((b, i) => (
          <div key={i} className="flex gap-4">
            <span
              className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
              style={{
                backgroundColor: PDF_COLORS.lime,
                boxShadow: `0 0 8px ${PDF_COLORS.lime}55`,
              }}
            />
            <div>
              {typeof b === "string" ? (
                <p
                  className="text-sm md:text-base leading-relaxed"
                  style={{
                    color: isHero
                      ? `${PDF_COLORS.lightText}ee`
                      : PDF_COLORS.charcoal,
                  }}
                >
                  {b}
                </p>
              ) : (
                <>
                  <p
                    className="text-sm font-semibold"
                    style={{
                      color: isHero
                        ? PDF_COLORS.lightText
                        : PDF_COLORS.charcoal,
                    }}
                  >
                    {b.heading}
                  </p>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{
                      color: isHero
                        ? `${PDF_COLORS.lightText}cc`
                        : PDF_COLORS.mutedGreen,
                    }}
                  >
                    {b.text}
                  </p>
                  {b.items && (
                    <ul className="mt-2 space-y-1">
                      {(b.items ?? []).map((item, j) => (
                        <li
                          key={j}
                          className="flex gap-2 text-xs"
                          style={{
                            color: isHero
                              ? `${PDF_COLORS.lightText}aa`
                              : PDF_COLORS.mutedGreen,
                          }}
                        >
                          <span
                            className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                            style={{ backgroundColor: PDF_COLORS.lime }}
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sub-items */}
      {d.subItems && (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {d.subItems.map((q, i) => (
            <div
              key={i}
              className="rounded-xl p-4 transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: isHero
                  ? `${PDF_COLORS.midGreen}a6`
                  : PDF_COLORS.sage,
                border: `1px solid ${PDF_COLORS.lime}2a`,
              }}
            >
              <p
                className="text-sm"
                style={{
                  color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
                }}
              >
                {q}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Two-column layout */}
      {d.columns && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {d.columns.map((col, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5"
              style={{
                backgroundColor: isHero
                  ? `${PDF_COLORS.midGreen}b3`
                  : PDF_COLORS.sage,
                border: `1px solid ${PDF_COLORS.lime}33`,
                boxShadow:
                  "inset 0 1px 0 0 rgba(134,198,90,0.25), 0 4px 6px -1px rgba(20,83,45,0.06)",
              }}
            >
              <h3
                className="text-sm font-semibold mb-3"
                style={{
                  color: isHero ? PDF_COLORS.lightText : PDF_COLORS.charcoal,
                }}
              >
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.items.map((item, j) => (
                  <li
                    key={j}
                    className="flex gap-2 text-sm"
                    style={{
                      color: isHero
                        ? `${PDF_COLORS.lightText}cc`
                        : PDF_COLORS.mutedGreen,
                    }}
                  >
                    <span
                      className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: PDF_COLORS.lime }}
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function ResearchPage() {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = SLIDES.length;

  /* --- Scroll-snap detection ------------------------------------- */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const slides = container.querySelectorAll("[data-slide]");
      if (!slides.length) return;
      const containerRect = container.getBoundingClientRect();
      let closest = 0;
      let closestDist = Infinity;
      slides.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const dist = Math.abs(rect.top - containerRect.top);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      });
      setCurrent(closest);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  /* --- Keyboard navigation --------------------------------------- */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setCurrent((c) => Math.min(c + 1, total - 1));
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setCurrent((c) => Math.max(c - 1, 0));
      } else if (e.key === "Home") {
        e.preventDefault();
        setCurrent(0);
      } else if (e.key === "End") {
        e.preventDefault();
        setCurrent(total - 1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [total]);

  /* --- Scroll to slide ------------------------------------------- */
  const scrollTo = (idx: number) => {
    setCurrent(idx);
    const el = containerRef.current?.querySelector(`[data-slide="${idx}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  /* --- Fullscreen presenter mode --------------------------------- */
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  return (
    <div
      className="relative z-10 h-screen overflow-hidden font-sans"
      style={{ backgroundColor: PDF_COLORS.cream }}
    >
      <ProgressBar current={current} total={total} />
      <SlideCounter current={current} total={total} />

      {/* Top toolbar */}
      <div className="fixed top-14 right-4 z-40 hidden items-center gap-2 sm:flex">
        <button
          onClick={toggleFullscreen}
          className="rounded-xl px-3 py-1.5 text-xs font-medium shadow-sm backdrop-blur-md transition-colors"
          style={{
            backgroundColor: `${PDF_COLORS.sage}cc`,
            color: PDF_COLORS.deepGreen,
            border: `1px solid ${PDF_COLORS.lime}55`,
          }}
        >
          Present
        </button>
      </div>

      <div className="flex h-full pt-8">
        {/* Slide deck */}
        <main
          ref={containerRef}
          className="flex-1 h-full overflow-y-auto snap-y snap-mandatory scroll-smooth"
        >
          <div className="max-w-5xl mx-auto">
            {SLIDES.map((slide, i) => {
              const isHero = (slide as { variant?: string }).variant === "hero";
              return (
                <div
                  key={slide.id}
                  data-slide={i}
                  className="snap-start min-h-[calc(100vh-2rem)] md:min-h-full flex items-center py-10 px-6 md:px-12"
                >
                  <div
                    className={`w-full rounded-3xl p-8 md:p-12 ${isHero ? "" : "glass-card"}`}
                  >
                    <Slide data={slide} index={i} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <footer
            className="py-8 text-center text-xs"
            style={{ color: PDF_COLORS.mutedGreen }}
          >
            <p>Research Proposal v3 — Prepared: August 2026</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
