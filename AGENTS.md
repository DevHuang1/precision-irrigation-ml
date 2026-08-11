# AGENTS.md — Precision Irrigation ML

This file provides context for Kilo AI when working on this repository. Read me first
before making changes.

## Project Overview

ML pipeline for "AI-Powered Precision Irrigation for Sustainable Vegetable Farming".
The goal: help vegetable farmers decide **when to irrigate** using low-cost sensors
and a small, edge-deployable ML model.

There is **no real field data yet** — everything is validated against a synthetic
dataset whose schema (11 columns) is the contract for future real-data drop-in. See
`data/synthetic_generator.py` and `README.md` §"Swapping in real field data".

The central question: **Can a simple ML model beat a naive threshold rule
("irrigate when soil_moisture < X")?** If not, report that honestly.

## Key Conventions

1. **Chronological splitting** — never shuffle. First 70 % train, next 15 % validate,
   last 15 % test. See `chronological_split()` in `src/data_pipeline.py`.
2. **`TimeSeriesSplit`** for tuning (`src/tune.py`), not k-fold. Avoids future leakage.
3. **Every model must be compared against the `baseline` threshold rule** in
   `results/model_comparison.csv`. The ML model must earn its keep.
4. **Edge deployability** matters — exported model size in KB is a metric, not just
   accuracy.
5. **Feature columns are derived automatically** — do not add `time_of_day_*`,
   lagged-moisture, rolling-rainfall, or growth-stage one-hots to raw data. They are
   engineered in `engineer_features()`.

## Running Locally

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

python -m data.synthetic_generator      # -> data/raw/synthetic_sensor_log.csv
python -m src.data_pipeline             # -> data/processed/features.csv
python -m src.tune                      # optional: TimeSeriesSplit tuning
python -m src.train                     # -> models/*.joblib
python -m src.evaluate                  # -> results/model_comparison.csv, feature_importance.png
python -m src.export_farmer_feed         # -> results/farmer_feed.json
python -m src.export_edge_model          # -> edge/exported/best_model.joblib (+ .onnx if available)
pytest                                   # unit tests
```

## Dashboard (Next.js)

```bash
cd dashboard && npm install && npm run dev  # -> http://localhost:3000
```

Two views: `/farmer` (plain-language recommendation) and `/` (technical charts/tables).

## Repository Layout

```
data/          raw/ + processed/ + real_datasets/ (FBK, Zenodo, UniPR)
src/           data_pipeline.py, train.py, evaluate.py, tune.py,
                export_edge_model.py, export_farmer_feed.py, threshold_rule.py
edge/          firmware/ (ESP32), inference_service.py
dashboard/     Next.js app (app/, components/, lib/)
tests/         pytest unit tests
models/        *.joblib + metadata.json + features.json
results/        model_comparison.csv, feature_importance.png, farmer_feed.json
notebooks/     01_eda.ipynb (exploratory analysis starter)
```

## Git Ignored Artifacts

The following are generated and not committed: `__pycache__/`, `.venv/`, `data/raw/*.csv`,
`data/processed/*.csv`, `models/*.joblib`, `models/*.json`, `results/*.csv`, `results/*.png`,
`edge/exported/*.` Always check `git status` before committing.
