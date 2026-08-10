"""Train the four candidate models on a chronological (non-shuffled) split.

Models trained and saved to ``models/`` via joblib:

* ``baseline``             — threshold rule "irrigate if soil_moisture < X"
* ``logistic_regression``  — cheap interpretability check
* ``random_forest``        — primary classical candidate
* ``xgboost``              — primary candidate, lighter at inference

If tuned artifacts exist in ``models/`` (from ``python -m src.tune``) they are
used; otherwise models are fit with defaults so the script always runs.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

from src.data_pipeline import (MODEL_FEATURES, PROCESSED_PATH,
                               build_model_data, chronological_split, prepare)
from src.threshold_rule import ThresholdRule, fit_threshold_rule

MODELS_DIR = Path("models")

MODEL_NAMES = ("baseline", "logistic_regression", "random_forest", "xgboost")


def _default_models():
    return {
        "logistic_regression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(max_iter=2000, random_state=0)),
        ]),
        "random_forest": RandomForestClassifier(random_state=0, n_jobs=-1),
        "xgboost": xgb.XGBClassifier(n_estimators=200, random_state=0,
                                     eval_metric="logloss", verbosity=0),
    }


def train(processed_path: Path | str = PROCESSED_PATH,
          models_dir: Path | str = MODELS_DIR) -> dict:
    df = build_model_data(pd.read_csv(processed_path,
                                      parse_dates=["timestamp"]))
    train_df, _, _ = chronological_split(df)
    X, y = train_df[MODEL_FEATURES], train_df["irrigated_next_flag"].astype(int)

    models_dir = Path(models_dir)
    models_dir.mkdir(parents=True, exist_ok=True)

    models = {"baseline": fit_threshold_rule(X, y)}
    for name, estimator in _default_models().items():
        tuned_path = models_dir / f"tuned_{name}.joblib"
        if tuned_path.exists():
            models[name] = joblib.load(tuned_path)
            print(f"[train] {name}: using tuned model from {tuned_path}")
        else:
            estimator.fit(X, y)
            models[name] = estimator
            print(f"[train] {name}: default params (run python -m src.tune "
                  "for tuning)")

    for name, model in models.items():
        joblib.dump(model, models_dir / f"{name}.joblib")
        print(f"[train] saved models/{name}.joblib")

    (models_dir / "metadata.json").write_text(json.dumps({
        "features": MODEL_FEATURES,
        "trained_on_rows": int(len(train_df)),
        "val_frac": 0.15,
        "test_frac": 0.15,
        "models": list(models.keys()),
    }, indent=2))
    return models


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed", type=Path, default=PROCESSED_PATH)
    parser.add_argument("--models-dir", type=Path, default=MODELS_DIR)
    args = parser.parse_args()

    if not Path(args.processed).exists():
        print("processed features not found — running data pipeline first")
        prepare(save_to=args.processed)
    train(args.processed, args.models_dir)


if __name__ == "__main__":
    main()
