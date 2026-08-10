"""Export a farmer-facing guidance feed from the trained models.

Reads the latest processed sensor rows, runs the best model, and writes a
plain-language ``results/farmer_feed.json`` that the Next.js dashboard serves
at ``/farmer``:

* current conditions per plot (moisture, temperature, rainfall, growth stage)
* a recommendation: irrigate now vs. wait, with confidence + human reasons
* a suggested water amount (from the average applied per growth stage)
* a 7-day soil-moisture trend per plot
"""

from __future__ import annotations

import json
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from src.data_pipeline import (GROWTH_STAGES, MODEL_FEATURES, PROCESSED_PATH,
                               build_model_data)

MODELS_DIR = Path("models")
RESULTS_DIR = Path("results")
BEST_MODEL = "logistic_regression"

STAGE_LABELS = {
    "establishment": "Just planted",
    "vegetative": "Growing",
    "flowering": "Flowering",
    "maturity": "Fruiting / maturity",
}

STAGE_SUGGESTION = {
    "establishment": "Sow-in stage: keep the topsoil moist with light, frequent water.",
    "vegetative": "Growing stage: steady water helps leaves and roots develop.",
    "flowering": "Flowering stage: avoid stress now — it sets your yield.",
    "maturity": "Fruiting stage: ease off slightly, but do not let soil dry out.",
}


def _stage_name(row: pd.Series) -> str:
    for s in GROWTH_STAGES:
        if row.get(f"growth_stage_{s}", 0):
            return s
    return "vegetative"


def _model_params(model) -> dict:
    """Expose a logistic-regression pipeline for in-browser simulation."""
    clf = (model.named_steps["clf"] if hasattr(model, "named_steps")
           and "clf" in model.named_steps else model)
    scaler = (model.named_steps["scaler"] if hasattr(model, "named_steps")
              and "scaler" in model.named_steps else None)
    return {
        "features": MODEL_FEATURES,
        "scaler_mean": scaler.mean_.tolist() if scaler is not None
                       else [0.0] * len(MODEL_FEATURES),
        "scaler_scale": scaler.scale_.tolist() if scaler is not None
                        else [1.0] * len(MODEL_FEATURES),
        "lr_coef": np.asarray(clf.coef_).ravel().tolist(),
        "lr_intercept": float(np.asarray(clf.intercept_).ravel()[0]),
        "classes": [int(c) for c in clf.classes_],
    }


def _reason(pred: int, proba: float, row: pd.Series) -> str:
    moisture = row["soil_moisture_pct"]
    rain = row["rainfall_mm_24h"]
    air_t = row["air_temp_c"]
    if pred == 1:
        parts = [
            f"Soil moisture is {moisture:.0f}% — below the comfort zone "
            f"for the current growth stage.",
        ]
        if rain < 1.0:
            parts.append("There has been no meaningful rain in the last 24h.")
        if air_t >= 25:
            parts.append("Temperatures are high, so the soil is drying faster.")
        return " ".join(parts)
    parts = [
        f"Soil moisture is {moisture:.0f}% — your crops have enough water "
        f"for now.",
    ]
    if rain >= 1.0:
        parts.append("Recent rain has refreshed the soil.")
    return " ".join(parts)


def _avg_water_per_stage(df: pd.DataFrame) -> dict[str, float]:
    applied = df[df["water_applied_l"] > 0].copy()
    out: dict[str, float] = {}
    for s in GROWTH_STAGES:
        mask = applied[f"growth_stage_{s}"] == 1
        mean = float(applied.loc[mask, "water_applied_l"].mean()) if mask.any() else 0.0
        out[s] = round(mean, 1)
    return out


def _daily_trend(df: pd.DataFrame, plot_id: str) -> list[dict]:
    sub = df[df["plot_id"] == plot_id].set_index("timestamp")
    daily = sub["soil_moisture_pct"].resample("1D").mean().dropna().tail(7)
    return [{"day": ts.strftime("%b %d"), "soil_moisture_pct": round(float(v), 1)}
            for ts, v in daily.items()]


def _recent_irrigations(df: pd.DataFrame, plot_id: str, n: int = 3) -> list[dict]:
    events = df[(df["plot_id"] == plot_id) & (df["water_applied_l"] > 0)]
    events = events.sort_values("timestamp").tail(n)
    return [{"timestamp": str(r.timestamp),
             "water_applied_l": round(float(r.water_applied_l), 1)}
            for r in events.itertuples()]


def export_farmer_feed(processed_path: Path | str = PROCESSED_PATH,
                       models_dir: Path | str = MODELS_DIR,
                       results_dir: Path | str = RESULTS_DIR) -> Path:
    df = build_model_data(pd.read_csv(processed_path,
                                      parse_dates=["timestamp"]))
    model = joblib.load(Path(models_dir) / f"{BEST_MODEL}.joblib")

    sim_model = _model_params(model)

    latest = (df.sort_values("timestamp")
               .groupby("plot_id", sort=False)
               .tail(1))
    X = latest[MODEL_FEATURES]
    proba = model.predict_proba(X)[:, 1]
    preds = model.predict(X)

    water_by_stage = _avg_water_per_stage(df)

    plots = []
    for (_, row), prob, pred in zip(latest.iterrows(), proba, preds):
        stage = _stage_name(row)
        confidence = float(prob if pred == 1 else 1.0 - prob)
        action = "irrigate" if pred == 1 else "wait"
        plots.append({
            "plot_id": str(row["plot_id"]),
            "growth_stage": stage,
            "growth_stage_label": STAGE_LABELS[stage],
            "days_since_planting": int(row["days_since_planting"]),
            "current": {
                "timestamp": str(row["timestamp"]),
                "soil_moisture_pct": round(float(row["soil_moisture_pct"]), 1),
                "soil_temp_c": round(float(row["soil_temp_c"]), 1),
                "air_temp_c": round(float(row["air_temp_c"]), 1),
                "air_humidity_pct": round(float(row["air_humidity_pct"]), 1),
                "rainfall_mm_24h": round(float(row["rainfall_mm_24h"]), 1),
            },
            "recommendation": {
                "action": action,
                "label": "Water now" if action == "irrigate"
                         else "No watering needed",
                "confidence": confidence,
                "confidence_label": (f"{confidence * 100:.0f}% sure" if
                                     confidence >= 0.6 else "less certain"),
                "reason": _reason(pred, prob, row),
                "suggested_water_l": (water_by_stage[stage] if pred == 1
                                      else 0.0),
            },
            "stage_tip": STAGE_SUGGESTION[stage],
            "moisture_trend": _daily_trend(df, str(row["plot_id"])),
            "recent_irrigations": _recent_irrigations(df, str(row["plot_id"])),
        })

    feed = {
        "generated_at": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M"),
        "best_model": BEST_MODEL,
        "plots": plots,
        "tips": [
            "Water in the early morning or evening to reduce evaporation.",
            "Check drips and emitters before you start watering.",
            "If rain is expected soon, you can safely skip today's watering.",
            "Keeping soil moisture steady beats big swings between wet and dry.",
        ],
    }

    results_dir = Path(results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)
    out = results_dir / "farmer_feed.json"

    def _default(o):
        if isinstance(o, (np.integer,)):
            return int(o)
        if isinstance(o, (np.floating,)):
            return float(o)
        if isinstance(o, (np.bool_,)):
            return bool(o)
        raise TypeError(f"not JSON serializable: {type(o)!r}")

    out.write_text(json.dumps(feed, indent=2, default=_default))
    print(f"saved {out} ({out.stat().st_size} bytes, {len(plots)} plots)")

    sim_out = results_dir / "sim_model.json"
    sim_out.write_text(json.dumps(sim_model, indent=2, default=_default))
    print(f"saved {sim_out} ({sim_out.stat().st_size} bytes)")
    return out


def main() -> None:
    export_farmer_feed()


if __name__ == "__main__":
    main()
