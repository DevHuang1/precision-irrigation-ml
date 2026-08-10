"""Ingest, clean, and feature-engineer sensor data into a model-ready table.

The pipeline is deliberately schema-driven: as long as a future real-data CSV
has the same column names as ``data/raw/synthetic_sensor_log.csv`` it drops in
with zero code changes (see README "Swapping in real field data").

For datasets with arbitrary sampling intervals, pass ``--interval-min auto``
or omit the flag to let the pipeline infer the median interval from the data.
"""

from __future__ import annotations

import argparse
import statistics
from pathlib import Path

import numpy as np
import pandas as pd

RAW_PATH = Path("data/raw/synthetic_sensor_log.csv")
PROCESSED_PATH = Path("data/processed/features.csv")
INTERVAL_MIN = 30  # sampling interval of the synthetic data

DATASET_PATHS = {
    "synthetic": RAW_PATH,
    "fbk": Path("data/real_datasets/fbk_soil_moisture/converted/fbk_soil_moisture.csv"),
    "zenodo": Path("data/real_datasets/zenodo_cotton/converted/zenodo_cotton.csv"),
    "unipr": Path("data/real_datasets/unipr_tomato/converted/unipr_tomato.csv"),
    "unipr_evolving": Path("data/real_datasets/unipr_tomato_evolving/converted/unipr_tomato_evolving.csv"),
}

# (col, low, high) used for out-of-range clipping during cleaning
SENSOR_BOUNDS = {
    "soil_moisture_pct": (0.0, 100.0),
    "soil_temp_c": (-10.0, 50.0),
    "air_temp_c": (-30.0, 60.0),
    "air_humidity_pct": (0.0, 100.0),
    "rainfall_mm_24h": (0.0, 300.0),
}

GROWTH_STAGES = ("establishment", "vegetative", "flowering", "maturity")

BASE_FEATURES = [
    "soil_moisture_pct",
    "soil_temp_c",
    "air_temp_c",
    "air_humidity_pct",
    "rainfall_mm_24h",
    "rainfall_mm_72h",
    "soil_moisture_t1",
    "soil_moisture_t2",
    "soil_moisture_3h_mean",
    "time_of_day_sin",
    "time_of_day_cos",
    "days_since_planting",
]
STAGE_FEATURES = [f"growth_stage_{s}" for s in GROWTH_STAGES]
MODEL_FEATURES = BASE_FEATURES + STAGE_FEATURES

META_COLUMNS = ["timestamp", "plot_id", "water_applied_l", "irrigated_next_flag"]


def _infer_interval_min(df: pd.DataFrame) -> int:
    """Return the most common per-plot sampling interval in minutes."""
    diffs = []
    for _, grp in df.groupby("plot_id", sort=False):
        ts = grp["timestamp"].sort_values()
        d = ts.diff().dropna()
        if len(d):
            diffs.append(d.mode().iloc[0])
    if not diffs:
        return INTERVAL_MIN
    median_mode = pd.Timedelta(statistics.median(diffs))
    return max(1, int(median_mode.total_seconds() // 60))


def load_raw(path: Path | str) -> pd.DataFrame:
    df = pd.read_csv(path)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    return df.sort_values(["timestamp", "plot_id"]).reset_index(drop=True)


def clean(df: pd.DataFrame) -> pd.DataFrame:
    """Clip out-of-range sensors, interpolate missing values, coerce types."""
    df = df.copy()
    for col, (lo, hi) in SENSOR_BOUNDS.items():
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").clip(lo, hi)
    if "water_applied_l" in df.columns:
        df["water_applied_l"] = (pd.to_numeric(df["water_applied_l"],
                                               errors="coerce")
                                 .fillna(0.0).clip(lower=0.0))
    if "irrigated_next_flag" in df.columns:
        df["irrigated_next_flag"] = (df["irrigated_next_flag"].fillna(False)
                                     .astype(bool))
    if "crop_growth_stage" in df.columns:
        df["crop_growth_stage"] = (df["crop_growth_stage"].fillna("unknown")
                                   .astype(str))

    num_cols = [c for c in SENSOR_BOUNDS if c in df.columns]
    for _, grp in df.groupby("plot_id", sort=False):
        df.loc[grp.index, num_cols] = (grp[num_cols]
                                       .interpolate(method="linear",
                                                    limit_area="inside"))
    return df


def engineer_features(df: pd.DataFrame, interval_min: int | str = INTERVAL_MIN):
    """Add lagged / rolling / cyclical / growth-stage features per plot."""
    if interval_min == "auto" or interval_min is None:
        interval_min = _infer_interval_min(df)
    df = df.sort_values(["plot_id", "timestamp"]).reset_index(drop=True)
    out = df.copy()
    g = df.groupby("plot_id", sort=False)

    out["soil_moisture_t1"] = g["soil_moisture_pct"].shift(1)
    out["soil_moisture_t2"] = g["soil_moisture_pct"].shift(2)
    win3h = max(1, 3 * 60 // interval_min)
    out["soil_moisture_3h_mean"] = (g["soil_moisture_pct"]
                                    .transform(lambda s: s.rolling(
                                        win3h, min_periods=1).mean()))
    # 72h rainfall: sum of the (rolling 24h) daily totals across 3 windows
    out["rainfall_mm_72h"] = (g["rainfall_mm_24h"]
                              .transform(lambda s: s.rolling(
                                  3, min_periods=1).sum()))

    hour = df["timestamp"].dt.hour + df["timestamp"].dt.minute / 60.0
    out["time_of_day_sin"] = np.sin(2.0 * np.pi * hour / 24.0)
    out["time_of_day_cos"] = np.cos(2.0 * np.pi * hour / 24.0)

    stage_dummies = (pd.get_dummies(df["crop_growth_stage"],
                                    prefix="growth_stage")
                     .reindex(columns=STAGE_FEATURES, fill_value=0)
                     .astype(int))
    out = pd.concat([out, stage_dummies], axis=1)
    return out


def build_model_data(df: pd.DataFrame, dropna: bool = True) -> pd.DataFrame:
    """Keep model features + target/meta columns; drop incomplete rows."""
    keep = list(MODEL_FEATURES) + list(META_COLUMNS)
    keep = [c for c in keep if c in df.columns]
    out = df[keep].copy()
    out["irrigated_next_flag"] = out["irrigated_next_flag"].astype(int)
    if dropna:
        out = out.dropna(subset=[c for c in MODEL_FEATURES if c in out.columns])
    return out


def chronological_split(df: pd.DataFrame, val_frac: float = 0.15,
                        test_frac: float = 0.15):
    """Time-based split — never shuffles, so no future leakage into training."""
    df = df.sort_values("timestamp").reset_index(drop=True)
    n = len(df)
    n_test = int(round(n * test_frac))
    n_val = int(round(n * val_frac))
    n_train = n - n_val - n_test
    train = df.iloc[:n_train]
    val = df.iloc[n_train:n_train + n_val]
    test = df.iloc[n_train + n_val:]
    return train, val, test


def prepare(path: Path | str = RAW_PATH,
            interval_min: int | str = INTERVAL_MIN,
            save_to: Path | str | None = PROCESSED_PATH) -> pd.DataFrame:
    """End-to-end: load -> clean -> engineer -> model-ready table."""
    df = clean(load_raw(path))
    if interval_min == "auto" or interval_min is None:
        interval_min = _infer_interval_min(df)
    df = build_model_data(engineer_features(df, interval_min))
    if save_to is not None:
        Path(save_to).parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(save_to, index=False)
        print(f"wrote {len(df)} rows x {df.shape[1]} cols -> {save_to}")
    return df


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=None,
                        help="Path to raw CSV (overrides --dataset)")
    parser.add_argument("--dataset", choices=list(DATASET_PATHS.keys()),
                        default="synthetic",
                        help="Pre-registered dataset alias")
    parser.add_argument("--output", type=Path, default=PROCESSED_PATH)
    parser.add_argument("--interval-min", type=str, default="auto",
                        help="Sampling interval in minutes, or 'auto' to infer")
    args = parser.parse_args()

    if args.input is None:
        args.input = DATASET_PATHS[args.dataset]

    interval = int(args.interval_min) if args.interval_min != "auto" else "auto"
    prepare(args.input, interval_min=interval, save_to=args.output)


if __name__ == "__main__":
    main()
