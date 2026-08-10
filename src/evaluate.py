"""Evaluate saved models on the held-out chronological test set.

Reports accuracy, precision, recall and F1 per class for every model in a
single comparison table (console + ``results/model_comparison.csv``), and
writes a feature-importance bar chart for the best model.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.metrics import (accuracy_score, classification_report,
                             f1_score, precision_score, recall_score)

import joblib
from src.data_pipeline import (MODEL_FEATURES, PROCESSED_PATH,
                               build_model_data, chronological_split)

MODELS_DIR = Path("models")
RESULTS_DIR = Path("results")


def _metrics(name: str, y_true, y_pred, y_proba=None) -> dict:
    return {
        "model": name,
        "accuracy": accuracy_score(y_true, y_pred),
        "precision_0": precision_score(y_true, y_pred, pos_label=0,
                                       zero_division=0),
        "recall_0": recall_score(y_true, y_pred, pos_label=0,
                                 zero_division=0),
        "f1_0": f1_score(y_true, y_pred, pos_label=0, zero_division=0),
        "precision_1": precision_score(y_true, y_pred, pos_label=1,
                                       zero_division=0),
        "recall_1": recall_score(y_true, y_pred, pos_label=1,
                                 zero_division=0),
        "f1_1": f1_score(y_true, y_pred, pos_label=1, zero_division=0),
        "macro_f1": f1_score(y_true, y_pred, average="macro",
                             zero_division=0),
    }


def _feature_importance(model, features: list) -> pd.Series:
    """Built-in importance (trees) or |coef| (linear models)."""
    if hasattr(model, "feature_importances_"):
        imp = model.feature_importances_
    elif hasattr(model, "named_steps") and hasattr(model.named_steps.get("clf"),
                                                  "coef_"):
        imp = np.abs(model.named_steps["clf"].coef_).ravel()
    else:
        return None
    return pd.Series(imp, index=features, name="importance")


def evaluate(processed_path: Path | str = PROCESSED_PATH,
             models_dir: Path | str = MODELS_DIR,
             results_dir: Path | str = RESULTS_DIR) -> pd.DataFrame:
    df = build_model_data(pd.read_csv(processed_path,
                                      parse_dates=["timestamp"]))
    _, _, test = chronological_split(df)
    X_test, y_test = test[MODEL_FEATURES], test["irrigated_next_flag"].astype(int)

    models_dir = Path(models_dir)
    results_dir = Path(results_dir)
    results_dir.mkdir(parents=True, exist_ok=True)

    rows, preds = [], {}
    for name in ("baseline", "logistic_regression", "random_forest", "xgboost"):
        path = models_dir / f"{name}.joblib"
        if not path.exists():
            print(f"[evaluate] missing {path} — run python -m src.train first")
            continue
        model = joblib.load(path)
        y_pred = model.predict(X_test)
        preds[name] = y_pred
        rows.append(_metrics(name, y_test, y_pred))
        print(classification_report(y_test, y_pred, digits=3,
                                    target_names=["don't_irrigate", "irrigate"]))
        print("-" * 60)

    if not rows:
        raise SystemExit("no models evaluated")

    comparison = (pd.DataFrame(rows)
                  .sort_values("macro_f1", ascending=False)
                  .reset_index(drop=True))
    pd.set_option("display.width", 200)
    pd.set_option("display.float_format", lambda v: f"{v:.3f}")
    print("\nMODEL COMPARISON (chronological test set, sorted by macro-F1)")
    print(comparison.to_string(index=False))
    comparison.to_csv(results_dir / "model_comparison.csv", index=False)
    print(f"\nsaved results/model_comparison.csv")

    best_name = comparison.iloc[0]["model"]
    best = joblib.load(models_dir / f"{best_name}.joblib")
    print(f"\nbest model: {best_name} (macro-F1 {comparison.iloc[0]['macro_f1']:.3f})")

    importance = _feature_importance(best, MODEL_FEATURES)
    if importance is not None:
        imp = importance.sort_values(ascending=True)
        fig, ax = plt.subplots(figsize=(8, max(4, 0.35 * len(imp))))
        ax.barh(imp.index, imp.values, color="#2a6f97")
        ax.set_title(f"Feature importance — {best_name}")
        ax.set_xlabel("importance")
        fig.tight_layout()
        fig.savefig(results_dir / "feature_importance.png", dpi=150)
        plt.close(fig)
        print("saved results/feature_importance.png")
    else:
        print("no feature importance available for best model — skipping plot")

    # save test predictions for inspection / downstream use
    test_out = test[["timestamp", "plot_id", "irrigated_next_flag"]].copy()
    test_out["irrigated_next_flag"] = y_test
    test_out[f"pred_{best_name}"] = preds[best_name]
    test_out.to_csv(results_dir / "test_predictions.csv", index=False)
    print("saved results/test_predictions.csv")
    return comparison


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed", type=Path, default=PROCESSED_PATH)
    parser.add_argument("--models-dir", type=Path, default=MODELS_DIR)
    parser.add_argument("--results-dir", type=Path, default=RESULTS_DIR)
    args = parser.parse_args()
    evaluate(args.processed, args.models_dir, args.results_dir)


if __name__ == "__main__":
    main()
