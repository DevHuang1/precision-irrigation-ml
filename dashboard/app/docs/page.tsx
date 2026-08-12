"use client";

import { GlassCard } from "@/components/GlassCard";

/* ------------------------------------------------------------------ */
/*  Plain-language documentation for the Precision Irrigation system   */
/* ------------------------------------------------------------------ */

const GLOSSARY = [
  {
    term: "Soil moisture",
    plain:
      "How much water is in the soil right now, shown as a percentage. Think of it like a sponge — 0% is bone dry, 100% is soaking wet.",
  },
  {
    term: "Sensor",
    plain:
      "A small device stuck in the ground or nearby that measures things like soil moisture, temperature, humidity, and rainfall. It's the 'eyes' of the system.",
  },
  {
    term: "Machine Learning (ML) model",
    plain:
      "A computer program that learns patterns from past data. Instead of being told 'if X then Y', it studies thousands of examples and figures out the rules on its own.",
  },
  {
    term: "Random Forest",
    plain:
      "A type of ML model that works like asking many different experts and taking a vote. Each 'tree' makes a guess, and the forest picks the most common answer. It's very reliable and hard to fool.",
  },
  {
    term: "XGBoost",
    plain:
      "Another type of ML model that learns by fixing its own mistakes, one step at a time. It's often faster and lighter than Random Forest, which matters on small, cheap devices.",
  },
  {
    term: "Logistic Regression",
    plain:
      "The simplest ML model — a fancy way of drawing a line that separates 'yes' from 'no'. It's a useful baseline: if a simple model works almost as well as a complex one, you don't need the complexity.",
  },
  {
    term: "Baseline / Threshold rule",
    plain:
      "A simple rule like 'water the plants if soil moisture drops below 30%'. Every ML model must beat this simple rule to prove it's actually worth using.",
  },
  {
    term: "Feature",
    plain:
      "A single piece of information the model looks at, like soil moisture, air temperature, or how many days since planting. Features are the 'ingredients' the model cooks with.",
  },
  {
    term: "Feature importance",
    plain:
      "A ranking of which ingredients matter most. If soil moisture is the #1 feature, it means the model relies on it most to make decisions.",
  },
  {
    term: "Training / Test split",
    plain:
      "We show the model most of the data to learn from (training), then test it on data it has never seen (testing). This proves the model isn't just memorizing — it actually understands.",
  },
  {
    term: "Chronological split",
    plain:
      "A special way of splitting data by time — the model trains on the past and is tested on the future. This mimics real life, where you can't use tomorrow's data to make today's decisions.",
  },
  {
    term: "Data leakage",
    plain:
      "A mistake where future information accidentally 'leaks' into the training data, making the model look better than it really is. Chronological splitting prevents this.",
  },
  {
    term: "Macro-F1 score",
    plain:
      "A single number (0 to 1) that measures how well the model balances being correct and not missing important cases. Higher is better. It's fairer than plain accuracy when one answer is much more common than the other.",
  },
  {
    term: "Precision",
    plain:
      "When the model says 'water the plants', how often is it right? High precision means few wasted watering events.",
  },
  {
    term: "Recall",
    plain:
      "When the plants actually need water, how often does the model catch it? High recall means few missed watering events.",
  },
  {
    term: "Confusion matrix",
    plain:
      "A 2×2 scoreboard showing four outcomes: correctly watered, correctly waited, watered when it shouldn't have (waste), and waited when it should have watered (missed).",
  },
  {
    term: "True Positive",
    plain: "The model said 'water' and watering was the right call. ✅",
  },
  {
    term: "True Negative",
    plain: "The model said 'wait' and waiting was the right call. ✅",
  },
  {
    term: "False Positive",
    plain: "The model said 'water' but it wasn't needed — wasted water. ⚠️",
  },
  {
    term: "False Negative",
    plain:
      "The model said 'wait' but the plants needed water — missed watering. ⚠️",
  },
  {
    term: "Inference latency",
    plain:
      "How long the model takes to make a decision, in milliseconds. On a cheap device, faster is better — under 1.2 ms means it decides almost instantly.",
  },
  {
    term: "Memory footprint",
    plain:
      "How much storage the model needs on the device, in KB or MB. Small models fit on cheap microcontrollers; big models need more expensive hardware.",
  },
  {
    term: "Edge device",
    plain:
      "A small, cheap computer (like an ESP32 or Raspberry Pi) that sits right at the farm. It runs the model locally, so it works even without internet.",
  },
  {
    term: "Edge compiler / Export",
    plain:
      "Converting the trained model into a format the small device can actually run. Formats include ONNX, Joblib, and TFLite Micro.",
  },
  {
    term: "Quantization",
    plain:
      "Shrinking the model by using smaller numbers (like rounding 3.14159 to 3.14). This makes it faster and smaller, with only a tiny loss in accuracy — great for cheap devices.",
  },
  {
    term: "SHAP values",
    plain:
      "A tool that explains exactly why the model made a decision — 'it watered because soil moisture was low and temperature was high'. This builds trust.",
  },
  {
    term: "Evapotranspiration (ET)",
    plain:
      "The total water lost from the soil (evaporation) plus water lost from the plant's leaves (transpiration). It's how much water the crop is 'breathing out'.",
  },
  {
    term: "Penman-Monteith / FAO-56",
    plain:
      "The gold-standard scientific formula for calculating how much water a crop needs. The ML model is checked against this to make sure it's sensible.",
  },
  {
    term: "Water-Use Efficiency (WUE)",
    plain:
      "How much crop you grow per drop of water: crop yield (kg) ÷ water used (m³). Higher is better — more food with less water.",
  },
  {
    term: "TimeSeriesSplit",
    plain:
      "A way of testing the model multiple times, always training on the past and testing on the future. It's like re-running the experiment several times to be sure the result is real.",
  },
];

const SECTIONS = [
  {
    id: "what-is-this",
    icon: "🌱",
    title: "What is this system?",
    body: "This is an AI-powered irrigation system that helps vegetable farmers decide WHEN to water their crops. Instead of watering on a fixed schedule (which wastes water) or waiting until plants look thirsty (which hurts yield), the system uses sensors and machine learning to predict exactly when irrigation is needed.",
    bullets: [
      "Sensors in the soil measure moisture, temperature, and humidity.",
      "A small, cheap computer (the 'edge device') runs an AI model right on the farm.",
      "The model decides: water now, or wait?",
      "It works offline — no internet needed, which matters in rural areas.",
    ],
  },
  {
    id: "how-it-works",
    icon: "⚙️",
    title: "How does it work, step by step?",
    body: "Think of it like a smart thermostat for your garden, but much smarter. Here's the flow:",
    steps: [
      "Sensors collect readings every 15–30 minutes: soil moisture, soil temperature, air temperature, air humidity, and rainfall.",
      "The data is cleaned and organized — missing or broken readings are removed, and useful patterns (like 'moisture has been dropping for 3 hours') are calculated.",
      "An ML model looks at these readings and predicts: does this plot need water in the next window?",
      "If yes, the system tells you how much water to apply (in liters).",
      "After watering, the sensors keep watching, and the loop continues — the system learns and improves over time.",
    ],
  },
  {
    id: "the-models",
    icon: "🤖",
    title: "The ML models — explained simply",
    body: "The system compares several 'brains' to find the best one. Each is a different way of learning from data:",
    models: [
      {
        name: "Threshold rule (baseline)",
        plain:
          "The simple rule: 'water if soil moisture < 30%'. This is the floor — any AI model must beat this to be worth using.",
        why: "It's the sanity check. If a fancy AI can't beat a simple rule, the AI isn't needed.",
      },
      {
        name: "Logistic Regression",
        plain:
          "The simplest AI — draws a line between 'water' and 'wait'. Fast, tiny, and easy to understand.",
        why: "It's the 'is AI even needed?' check. If this simple model works great, that's a useful finding.",
      },
      {
        name: "Random Forest",
        plain:
          "Asks many decision 'trees' and takes a vote. Very reliable, hard to fool, and good with noisy sensor data.",
        why: "It's the primary candidate — strong accuracy and you can see which sensors it relies on.",
      },
      {
        name: "XGBoost",
        plain:
          "Learns by fixing its own mistakes step by step. Often faster and lighter than Random Forest.",
        why: "It's the other primary candidate — great for small edge devices where speed and size matter.",
      },
    ],
  },
  {
    id: "the-numbers",
    icon: "📊",
    title: "The numbers on the Engineer page — decoded",
    body: "The Engineer view shows a lot of technical numbers. Here's what each one really means:",
    metrics: [
      {
        name: "Macro-F1 score",
        plain:
          "Overall quality score (0–1). 0.95 means the model is right about 95% of the time, balancing both 'water' and 'wait' decisions fairly.",
      },
      {
        name: "Precision",
        plain:
          "When the model says 'water', how often is it right? High = few wasted waterings.",
      },
      {
        name: "Recall",
        plain:
          "When plants need water, how often does the model catch it? High = few missed waterings.",
      },
      {
        name: "Inference latency",
        plain:
          "How fast the model decides. '< 1.2 ms' means it decides in under 1.2 milliseconds — basically instant.",
      },
      {
        name: "Memory footprint",
        plain:
          "How much space the model takes on the device. 14 KB is tiny (fits on a cheap chip); 1.8 MB is big (needs a more powerful board).",
      },
      {
        name: "Feature importance",
        plain:
          "Which sensors matter most. If soil moisture is 38%, the model leans on it most — makes sense, since dry soil is the #1 sign a plant needs water.",
      },
      {
        name: "Confusion matrix",
        plain:
          "A scoreboard of 4 outcomes: correctly watered (412), correctly waited (746), wasted water (18), and missed watering (24). The big green/blue numbers are good; the small amber/red ones are the mistakes.",
      },
    ],
  },
  {
    id: "edge-deployment",
    icon: "📦",
    title: "Edge deployment — running on cheap hardware",
    body: "A big goal of this project is to run the AI on cheap, low-power devices that farmers can actually afford. This is called 'edge deployment' — the AI lives on the farm, not in the cloud.",
    bullets: [
      "Target hardware: ESP32-S3, STM32, or Raspberry Pi Pico W — all small, cheap boards.",
      "The trained model is 'compiled' into a format the board can run: ONNX, Joblib, or TFLite Micro.",
      "Quantization shrinks the model (like compressing a photo) so it fits on tiny chips with almost no loss in quality.",
      "A safety fallback: if the model or a sensor fails, the system falls back to the simple threshold rule — it never just stops watering.",
    ],
  },
  {
    id: "why-it-matters",
    icon: "💧",
    title: "Why this matters",
    body: "Agriculture uses more freshwater than any other sector. Most small farmers water on a fixed schedule — too much when it rains, too little during heat waves. This wastes water and stresses crops.",
    bullets: [
      "Precision irrigation can cut water use significantly while keeping (or improving) yield.",
      "Low-cost, offline, edge-based AI makes this technology reachable for smallholder farmers — not just big commercial farms.",
      "The system is honest: it's compared against a simple baseline, and if the AI can't beat it, the project says so.",
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="relative z-10 min-h-screen p-4 font-sans sm:p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        {/* HEADER */}
        <header>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              📖 Plain-Language Guide
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            How This System Works — Explained Simply
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
            No jargon. No math. Just a clear explanation of what the Engineer
            view, the ML models, and all those numbers actually mean — written
            for a regular person.
          </p>
        </header>

        {/* SECTIONS */}
        {SECTIONS.map((section) => (
          <section key={section.id}>
            <GlassCard variant="medium" padding="lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{section.icon}</span>
                <div className="flex-1">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {section.body}
                  </p>

                  {section.bullets && (
                    <ul className="mt-4 space-y-2">
                      {section.bullets.map((b, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-slate-600 dark:text-slate-300"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.steps && (
                    <ol className="mt-4 space-y-3">
                      {section.steps.map((s, i) => (
                        <li key={i} className="flex gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {i + 1}
                          </span>
                          <span className="text-sm text-slate-600 dark:text-slate-300">
                            {s}
                          </span>
                        </li>
                      ))}
                    </ol>
                  )}

                  {section.models && (
                    <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                      {section.models.map((m, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 p-4"
                        >
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {m.name}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {m.plain}
                          </p>
                          <p className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Why it's here: {m.why}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {section.metrics && (
                    <div className="mt-4 space-y-3">
                      {section.metrics.map((m, i) => (
                        <div
                          key={i}
                          className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 p-4"
                        >
                          <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {m.name}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {m.plain}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </section>
        ))}

        {/* GLOSSARY */}
        <section>
          <GlassCard variant="medium" padding="lg">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              📚 Quick Glossary — Every Term, Plainly
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Look up any technical word you see on the Engineer or Research
              pages.
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {GLOSSARY.map((g, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-slate-900/60 p-4"
                >
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {g.term}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {g.plain}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </section>

        {/* FOOTER NOTE */}
        <footer className="pb-8 text-center text-xs text-slate-400 dark:text-slate-500">
          <p>
            This guide explains the Precision Irrigation ML system in plain
            language. For technical details, see the Engineer and Research
            views.
          </p>
        </footer>
      </div>
    </div>
  );
}
