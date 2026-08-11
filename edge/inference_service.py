"""Raspberry-Pi-side inference + actuation logic (skeleton).

The ESP32 reports sensor readings over serial/MQTT; this service builds the
same feature vector the models were trained on and decides whether to
actuate irrigation. Falls back to the rule-based threshold if the model is
unavailable or readings are out of range (safety fallback from Section 5.5).
"""

from __future__ import annotations


import sys
from pathlib import Path

import joblib
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from src.data_pipeline import MODEL_FEATURES

EXPORTED = Path(__file__).resolve().parent / "exported"


class InferenceService:
    def __init__(self, model_path: Path | None = None,
                 fallback_threshold: float = 30.0):
        model_path = model_path or (EXPORTED / "best_model.joblib")
        self.model = joblib.load(model_path)
        self.fallback_threshold = fallback_threshold

    def predict(self, features: dict) -> dict:
        df = pd.DataFrame([features])[MODEL_FEATURES].astype(float)
        if df.isna().any().any() or (df.abs() > 1e6).any().any():
            decision = bool(features.get("soil_moisture_pct", 0.0)
                            < self.fallback_threshold)
            return {"irrigate": decision, "fallback": True,
                    "confidence": None}
        p = self.model.predict_proba(df)[0][1]
        return {"irrigate": bool(p >= 0.5), "fallback": False,
                "confidence": float(p)}


if __name__ == "__main__":
    import sys
    svc = InferenceService()
    row = {"soil_moisture_pct": 24.0, "soil_temp_c": 22.0, "air_temp_c": 28.0,
           "air_humidity_pct": 55.0, "rainfall_mm_24h": 0.0,
           "rainfall_mm_72h": 2.0, "soil_moisture_t1": 25.0,
           "soil_moisture_t2": 26.0, "soil_moisture_3h_mean": 25.0,
           "time_of_day_sin": 0.0, "time_of_day_cos": 1.0,
           "days_since_planting": 40,
           "growth_stage_establishment": 0, "growth_stage_vegetative": 1,
           "growth_stage_flowering": 0, "growth_stage_maturity": 0}
    print(svc.predict(row))
