"""Hyperparameter tuning using time-series-aware cross-validation.

Uses ``sklearn.model_selection.TimeSeriesSplit`` (NOT standard k-fold) so the
tuning folds never leak future observations into training. Run before
``python -m src.train`` to fit tuned models; train.py falls back to defaults
if the tuned artifacts are absent.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import RandomizedSearchCV, TimeSeriesSplit
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import xgboost as xgb

from src.data_pipeline import (PROCESSED_PATH, MODEL_FEATURES,
                               build_model_data, chronological_split,
                               load_raw, prepare)

MODELS_DIR = Path("models")

RF_GRID = {
    "n_estimators": [100, 200, 400],
    "max_depth": [None, 5, 10],
    "min_samples_leaf": [1, 2, 5],
}

XGB_GRID = {
    "n_estimators": [100, 200, 300],
    "max_depth": [3, 5, 7],
    "learning_rate": [0.05, 0.1, 0.2],
    "subsample": [0.7, 1.0],
    "colsample_bytree": [0.7, 1.0],
}

LR_GRID = {
    "clf__C": np.logspace(-3, 1, 8),
}


def make_ts_cv(n_splits: int = 3) -> TimeSeriesSplit:
    return TimeSeriesSplit(n_splits=n_splits)


def _load_data(processed_path):
    if Path(processed_path).exists():
        df = build_model_data(pd_read(processed_path))
    else:
        df = prepare(processed_path, save_to=None)
    return df


def pd_read(path):
    import pandas as pd
    return pd.read_csv(path, parse_dates=["timestamp"])


def tune(name: str, estimator, grid: dict, X, y, n_iter: int,
         random_state: int = 0):
    cv = make_ts_cv()
    search = RandomizedSearchCV(estimator, grid, n_iter=n_iter, cv=cv,
                                scoring="f1_macro", n_jobs=-1,
                                random_state=random_state, verbose=0)
    search.fit(X, y)
    print(f"[tune] {name}: best f1_macro={search.best_score_:.4f} "
          f"params={search.best_params_}")
    return search.best_estimator_


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed", type=Path, default=PROCESSED_PATH)
    parser.add_argument("--n-iter", type=int, default=10,
                        help="RandomizedSearchCV iterations per model")
    args = parser.parse_args()

    if not Path(args.processed).exists():
        print("processed features not found — running data pipeline first")
        prepare(save_to=args.processed)
    df = build_model_data(pd_read(args.processed))
    train, _, _ = chronological_split(df)
    X, y = train[MODEL_FEATURES], train["irrigated_next_flag"].astype(int)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    tuned = {
        "logistic_regression": tune(
            "logistic_regression",
            Pipeline([("scaler", StandardScaler()),
                      ("clf", LogisticRegression(max_iter=2000,
                                                 random_state=0))]),
            LR_GRID, X, y, args.n_iter),
        "random_forest": tune(
            "random_forest",
            RandomForestClassifier(random_state=0, n_jobs=-1),
            RF_GRID, X, y, args.n_iter),
        "xgboost": tune(
            "xgboost",
            xgb.XGBClassifier(random_state=0, eval_metric="logloss",
                              verbosity=0),
            XGB_GRID, X, y, args.n_iter),
    }
    for name, model in tuned.items():
        joblib.dump(model, MODELS_DIR / f"tuned_{name}.joblib")
        print(f"[tune] saved models/tuned_{name}.joblib")

    # remember which features were used, for re-exporting / edge deployment
    (MODELS_DIR / "features.json").write_text(
        json.dumps(MODEL_FEATURES))


if __name__ == "__main__":
    main()
