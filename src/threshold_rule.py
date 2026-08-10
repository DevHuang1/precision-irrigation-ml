"""Rule-based threshold baseline: 'irrigate if soil_moisture_pct < X'.

Defined in its own module so joblib pickles a stable import reference
(``src.threshold_rule``) regardless of which script is running, which makes
the saved artifact loadable from any entry point.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.metrics import f1_score


class ThresholdRule:
    """Rule-based floor that every ML model must beat."""

    def __init__(self, threshold: float, sm_col: str = "soil_moisture_pct"):
        self.threshold = float(threshold)
        self.sm_col = sm_col

    def predict(self, X: pd.DataFrame) -> np.ndarray:
        return (X[self.sm_col].to_numpy() < self.threshold).astype(int)

    def predict_proba(self, X: pd.DataFrame) -> np.ndarray:
        gap = self.threshold - X[self.sm_col].to_numpy()
        p = 1.0 / (1.0 + np.exp(-3.0 * np.clip(gap, -5, 5)))
        return np.column_stack([1.0 - p, p])


def fit_threshold_rule(X: pd.DataFrame, y: pd.Series,
                       sm_col: str = "soil_moisture_pct") -> ThresholdRule:
    """Pick the threshold maximizing macro-F1 on the training set."""
    best_th, best_f1 = 5.0, -1.0
    for th in np.linspace(5.0, 60.0, 111):
        pred = (X[sm_col].to_numpy() < th).astype(int)
        f1 = f1_score(y, pred, average="macro", zero_division=0)
        if f1 > best_f1:
            best_th, best_f1 = th, f1
    return ThresholdRule(best_th, sm_col)
