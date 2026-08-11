"use client";

export default function ResearchPage() {
  return (
    <div className="relative z-10 min-h-screen p-6 font-sans">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Research: AI-Powered Precision Irrigation
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            A living bridge between the research proposal and the executable study —
            incorporating methodology, literature, roadmap, and model development plan.
          </p>
        </header>

        {/* Problem & Background */}
        <Section title="Problem & Background">
          <div className="grid gap-6 md:grid-cols-2">
            <Card
              title="Key Problem"
              content="How can AI-powered irrigation improve water efficiency while remaining affordable and practical for local vegetable farmers?"
            />
            <Card
              title="Background"
              content="Agriculture is a major consumer of freshwater. Water scarcity and climate variability threaten sustainable farming. Traditional irrigation can lead to over-irrigation and water wastage. Small-scale farmers face cost and infrastructure barriers when adopting advanced precision agriculture technologies."
            />
          </div>
        </Section>

        {/* Research Aim */}
        <Section title="Research Aim">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <p className="text-base text-slate-700 dark:text-slate-300">
              To investigate the effectiveness and practical feasibility of a low-cost, machine-learning-integrated edge precision irrigation system for sustainable vegetable farming.
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <FocusArea icon="🤖" title="Technology" desc="ML prediction & automated irrigation" />
              <FocusArea icon="💧" title="Sustainability" desc="Water-Use Efficiency" />
              <FocusArea icon="👨‍🌾" title="Adoption" desc="Cost, usability & farmer acceptance" />
            </div>
          </div>
        </Section>

        {/* Research Questions */}
        <Section title="Research Questions">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <MainQuestion question="To what extent can a low-cost, machine-learning-integrated edge precision irrigation system improve water-use efficiency and support vegetable crop productivity, and what technical, economic, and socio-cultural factors influence its adoption by local farmers?" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <SubQuestion q="How accurately can ML predict irrigation requirements?" />
              <SubQuestion q="Can the system reduce water consumption?" />
              <SubQuestion q="How does it affect vegetable crop productivity?" />
              <SubQuestion q="Which ML model performs best?" />
              <SubQuestion q="What barriers influence farmer adoption?" />
            </div>
          </div>
        </Section>

        {/* Research Objectives */}
        <Section title="Research Objectives">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Develop a low-cost edge-based precision irrigation prototype",
              "Collect soil and environmental data throughout a vegetable crop cycle",
              "Develop and compare ML models for irrigation prediction",
              "Evaluate water consumption, crop yield, and WUE",
              "Compare AI-based and conventional irrigation",
              "Investigate farmer perceptions and adoption barriers",
              "Propose recommendations for practical local implementation",
            ].map((obj, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-4 shadow-sm backdrop-blur-xl"
              >
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Objective {i + 1}</span>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{obj}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Research Gap */}
        <Section title="Research Gap">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Identified Gap</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Less attention is given to the combined evaluation of ML Performance, Water-Use Efficiency, Crop Productivity, and Farmer Adoption.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Proposed Contribution</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  A low-cost, edge-based AI irrigation system evaluated from both technical and socio-technical perspectives.
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* System Architecture */}
        <Section title="System Architecture">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              {["Sensors", "Edge Device", "ML Model", "Irrigation Decision", "Automated Pump / Valve", "Vegetable Crop"].map((step, i, arr) => (
                <span key={i} className="flex items-center gap-3">
                  <span className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 font-medium text-emerald-700 dark:text-emerald-300">
                    {step}
                  </span>
                  {i < arr.length - 1 && <span className="text-slate-400">→</span>}
                </span>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-slate-500 dark:text-slate-400">
              Sensors: Soil Moisture | Temperature | Humidity | Water Flow
              <br />
              ML: Random Forest / XGBoost → Irrigation Decision → Automated Pump / Valve
            </p>
          </div>
        </Section>

        {/* Research Roadmap */}
        <Section title="Research Roadmap">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <div className="space-y-4">
              {[
                { phase: "Phase 0", focus: "Literature consolidation", duration: "2 weeks", activities: "Expand matrix to 25–35 sources; write related-work narrative" },
                { phase: "Phase 1", focus: "System & sensor design finalization", duration: "2 weeks", activities: "Lock sensor list, edge board, bill of materials" },
                { phase: "Phase 2", focus: "Hardware build & bench testing", duration: "3 weeks", activities: "Assemble prototype, validate sensors, test valve/relay" },
                { phase: "Phase 3", focus: "Field site & protocol setup", duration: "2 weeks", activities: "Install plots, baseline soil survey, install firmware" },
                { phase: "Phase 4", focus: "Model development (synthetic → real)", duration: "4 weeks", activities: "Build pipeline on synthetic data, then swap in real sensor data" },
                { phase: "Phase 5", focus: "Field data collection", duration: "8–12 weeks", activities: "Run full crop cycle, log sensor data, apply model recommendations" },
                { phase: "Phase 6", focus: "Analysis & mixed-methods integration", duration: "3 weeks", activities: "Quantitative WUE/yield analysis + qualitative farmer interviews" },
                { phase: "Phase 7", focus: "Dissemination", duration: "2 weeks", activities: "Write up, package code/data, prepare presentation" },
              ].map((p) => (
                <div key={p.phase} className="flex gap-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 p-4">
                  <div className="w-24 shrink-0">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{p.phase}</span>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{p.duration}</p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{p.focus}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{p.activities}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Methodology */}
        <Section title="Research Methodology">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              This study adopts an <strong>explanatory sequential mixed-methods design</strong>: a quantitative phase (system deployment, ML model development, and water-use/yield measurement) runs first and largely in parallel with an embedded qualitative phase (farmer interviews and usability surveys).
            </p>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quantitative</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>• Soil moisture, temperature, humidity</li>
                  <li>• Water consumption & crop yield</li>
                  <li>• ML prediction accuracy</li>
                  <li>• Water-Use Efficiency (WUE)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Qualitative</h3>
                <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
                  <li>• Semi-structured farmer interviews (10–15 min, 8–15 farmers)</li>
                  <li>• Usability surveys</li>
                  <li>• Trust in AI</li>
                  <li>• Cost concerns & adoption barriers</li>
                </ul>
              </div>
            </div>
          </div>
        </Section>

        {/* ML Model Development Plan */}
        <Section title="ML Model Development Plan">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              The key move: <strong>do not wait for field data to start building</strong>. Build and validate the full pipeline now against a synthetic dataset generated from realistic ranges, then swap in real sensor data once Phase 5 collection is underway.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <ModelCard
                title="Data Schema"
                items={["timestamp (datetime)", "plot_id (string)", "soil_moisture_pct (0-100)", "soil_temp_c (10-40)", "air_temp_c", "air_humidity_pct (0-100)", "rainfall_mm_24h", "days_since_planting (int)", "crop_growth_stage (category)", "water_applied_l (float)"]}
              />
              <ModelCard
                title="Models"
                items={["Threshold baseline", "Logistic Regression", "Random Forest", "XGBoost"]}
              />
              <ModelCard
                title="Cross-Validation"
                items={["TimeSeriesSplit (k=5)", "Chronological split (no leakage)", "No random shuffle"]}
              />
              <ModelCard
                title="Explainability"
                items={["SHAP values", "Feature importance (Gini > 0.1)", "Agronomic benchmark (Penman-Monteith)"]}
              />
            </div>

            <div className="mt-6 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/30 p-4">
              <h3 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Edge Deployment Strategy</h3>
              <p className="mt-1 text-sm text-emerald-700 dark:text-emerald-300">
                Export the trained scikit-learn/XGBoost model via joblib/ONNX; for microcontrollers, quantize to int8 and bundle with a lightweight inference runtime.
              </p>
            </div>
          </div>
        </Section>

        {/* Literature Matrix Preview */}
        <Section title="Literature Matrix (Preview)">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
              16 studies (2021–2026), organized by four themes. Full matrix available in the PDF.
            </p>
            <div className="space-y-4">
              {[
                { theme: "Theme A — ML for Irrigation Prediction", studies: 6, highlight: "Decision trees, Random Forest, XGBoost on synthetic/secondary datasets" },
                { theme: "Theme B — Edge / IoT Hardware", studies: 4, highlight: "ESP32-based systems, low-cost valve designs (~$25), multi-farm deployments" },
                { theme: "Theme C — Environmental Modeling", studies: 3, highlight: "ET0 calculations, soil-moisture depletion curves, ANN/RF benchmarks" },
                { theme: "Theme D — Farmer Adoption", studies: 3, highlight: "Technology acceptance, cost barriers, trust in automated systems" },
              ].map((t) => (
                <div key={t.theme} className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-800/40 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{t.theme}</h3>
                    <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      {t.studies} studies
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{t.highlight}</p>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Expected Outcomes */}
        <Section title="Expected Outcomes & Contribution">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Expected Outcomes</h3>
                <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                  <li className="flex gap-2"><span className="text-emerald-500">✓</span> Low-cost AI precision irrigation prototype</li>
                  <li className="flex gap-2"><span className="text-emerald-500">✓</span> Improved understanding of water-use efficiency</li>
                  <li className="flex gap-2"><span className="text-emerald-500">✓</span> Comparison of ML models for irrigation prediction</li>
                  <li className="flex gap-2"><span className="text-emerald-500">✓</span> Evaluation of vegetable crop productivity</li>
                  <li className="flex gap-2"><span className="text-emerald-500">✓</span> Identification of farmer adoption barriers</li>
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Research Contribution</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  The study aims to move beyond evaluating &quot;How accurate is the AI?&quot; and investigate:
                </p>
                <p className="mt-2 text-sm font-medium text-slate-800 dark:text-slate-200">
                  &quot;Does the AI actually save water, support crop production, and provide a solution farmers can realistically adopt?&quot;
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* OpenCode Build Prompts */}
        <Section title="OpenCode Build Prompts">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-6 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Copy-paste-ready prompts for building the ML pipeline. Run Prompt 1 first — it does not require real field data and gets a working, evaluated baseline model in place immediately.
            </p>
            <div className="mt-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-4">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Prompt 1 — Scaffold the ML pipeline & get a synthetic-data baseline running</p>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                &quot;You are building the machine-learning pipeline for a research project: &apos;AI-Powered Precision Irrigation for Sustainable Vegetable Farming — Improving Water-Use Efficiency Through Low-Cost Edge Machine Learning.&apos; No real sensor data exists yet, so start with a realistic synthetic dataset and build the full pipeline against it.&quot;
              </p>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <footer className="mt-12 border-t border-slate-200 dark:border-slate-800 pt-6 text-center text-xs text-slate-400 dark:text-slate-500">
          <p>Research Proposal v2 + Research Development Pack — Prepared: August 2026</p>
          <p className="mt-1">Sources: AI_Precision_Irrigation_Development.pdf & Green_Beige_Modern_Agriculture_Presentation.pdf</p>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      {children}
    </section>
  );
}

function Card({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/70 dark:bg-slate-900/75 p-5 shadow-[0_1px_2px_-1px_rgba(0,0,0,0.06),_0_8px_20px_-4px_rgba(0,0,0,0.08),_inset_0_1px_0_0_rgba(255,255,255,0.5),_inset_0_-1px_0_0_rgba(0,0,0,0.3)] backdrop-blur-[20px] saturate-170">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{content}</p>
    </div>
  );
}

function FocusArea({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-4 text-center shadow-sm backdrop-blur-xl">
      <span className="text-2xl">{icon}</span>
      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400">{desc}</p>
    </div>
  );
}

function MainQuestion({ question }: { question: string }) {
  return (
    <div className="rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/30 p-4">
      <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Main Research Question</p>
      <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">{question}</p>
    </div>
  );
}

function SubQuestion({ q }: { q: string }) {
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 p-3">
      <p className="text-sm text-slate-700 dark:text-slate-300">{q}</p>
    </div>
  );
}

function ModelCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 p-4">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      <ul className="mt-2 space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-600 dark:text-slate-400">• {item}</li>
        ))}
      </ul>
    </div>
  );
}
