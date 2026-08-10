"""Pipeline tests: generator schema, cleaning, no NaN, no leakage, baseline."""

import pandas as pd
import numpy as np
import joblib

from data.synthetic_generator import generate, PLOT_IDS, GROWTH_STAGES
from src.data_pipeline import (MODEL_FEATURES, clean, chronological_split,
                               engineer_features, load_raw, build_model_data)
from src.train import fit_threshold_rule
from src.threshold_rule import ThresholdRule
from src.export_farmer_feed import export_farmer_feed

SCHEMA_COLUMNS = [
    "timestamp", "plot_id", "soil_moisture_pct", "soil_temp_c", "air_temp_c",
    "air_humidity_pct", "rainfall_mm_24h", "days_since_planting",
    "crop_growth_stage", "water_applied_l", "irrigated_next_flag",
]


def test_generator_schema():
    df = generate(days=4, seed=1)
    assert list(df.columns) == SCHEMA_COLUMNS
    assert len(df) == 4 * 48 * len(PLOT_IDS)
    assert set(df["plot_id"]) == set(PLOT_IDS)
    assert set(df["crop_growth_stage"]).issubset(set(GROWTH_STAGES))
    assert df["days_since_planting"].dtype.kind == "i"
    assert df["irrigated_next_flag"].dtype == bool
    assert (df["water_applied_l"] >= 0).all()


def test_pipeline_no_nan_or_inf(tmp_path):
    raw = tmp_path / "synthetic_sensor_log.csv"
    generate(days=6, seed=7).to_csv(raw, index=False)
    df = engineer_features(clean(load_raw(raw)))
    # cleaning contract: sensor readings are back inside valid bounds
    for col, (lo, hi) in [("soil_moisture_pct", (0, 100)),
                          ("air_humidity_pct", (0, 100)),
                          ("rainfall_mm_24h", (0, 300))]:
        assert df[col].between(lo, hi).all()
    feat_cols = [c for c in MODEL_FEATURES if c in df.columns]
    df = df.dropna(subset=feat_cols)
    assert not df[feat_cols].isna().any().any()
    assert not np.isinf(df[feat_cols].to_numpy(dtype=float)).any()
    assert {"soil_moisture_t1", "soil_moisture_t2",
            "soil_moisture_3h_mean", "rainfall_mm_72h"}.issubset(feat_cols)


def test_chronological_split_never_leaks():
    df = pd.DataFrame({
        "timestamp": pd.date_range("2025-01-01", periods=100, freq="h"),
        "value": np.arange(100.0),
    })
    train, val, test = chronological_split(df, val_frac=0.15, test_frac=0.15)
    assert train["timestamp"].max() < val["timestamp"].min()
    assert val["timestamp"].max() < test["timestamp"].min()
    assert len(train) == 70 and len(val) == 15 and len(test) == 15


def test_threshold_rule_roundtrip(tmp_path):
    rng = np.random.default_rng(0)
    X = pd.DataFrame({"soil_moisture_pct": rng.uniform(5, 80, 500)})
    y = (X["soil_moisture_pct"] < 30).astype(int)
    rule = fit_threshold_rule(X, y)
    assert 5.0 <= rule.threshold <= 60.0
    pred = rule.predict(X)
    assert set(pred).issubset({0, 1})
    path = tmp_path / "rule.joblib"
    joblib.dump(rule, path)
    loaded = joblib.load(path)
    np.testing.assert_array_equal(loaded.predict(X), pred)


def test_export_writes_joblib(tmp_path):
    rule = ThresholdRule(28.0)
    path = tmp_path / "model.joblib"
    joblib.dump(rule, path)
    assert path.exists() and path.stat().st_size > 0


def test_export_farmer_feed_schema(tmp_path):
    import json
    import numpy as np
    from sklearn.linear_model import LogisticRegression

    raw = tmp_path / "synthetic_sensor_log.csv"
    generate(days=6, seed=5).to_csv(raw, index=False)
    feats = build_model_data(engineer_features(clean(load_raw(raw))))
    feats_path = tmp_path / "features.csv"
    feats.to_csv(feats_path, index=False)

    model_dir = tmp_path / "models"
    model_dir.mkdir()
    X = feats[MODEL_FEATURES]
    y = feats["irrigated_next_flag"].astype(int)
    joblib.dump(LogisticRegression(max_iter=2000).fit(X, y),
                model_dir / "logistic_regression.joblib")

    out = export_farmer_feed(feats_path, model_dir, tmp_path / "results")
    feed = json.loads(out.read_text())
    assert feed["best_model"] == "logistic_regression"
    assert len(feed["plots"]) == len(feats["plot_id"].unique())
    for p in feed["plots"]:
        assert p["recommendation"]["action"] in ("irrigate", "wait")
        assert p["recommendation"]["reason"]
        assert p["recommendation"]["label"]
        assert 0.0 <= p["recommendation"]["confidence"] <= 1.0
        assert p["recommendation"]["suggested_water_l"] >= 0.0
    assert p["current"]["soil_moisture_pct"] >= 0.0
    assert p["moisture_trend"]
    assert p["growth_stage_label"]


# ---------------------------------------------------------------------------
# Real-dataset conversion + pipeline tests
# ---------------------------------------------------------------------------

def test_converters_schema():
    """Every converted dataset must have the 11-column raw schema."""
    from pathlib import Path
    from data.real_datasets.convert import CONVERTERS

    for name, converter in CONVERTERS.items():
        out_path = Path("data/real_datasets") / name / "converted" / f"{name}.csv"
        if not out_path.exists():
            converter()
        df = pd.read_csv(out_path)
        assert list(df.columns) == SCHEMA_COLUMNS, f"{name} schema mismatch"
        assert len(df) > 0, f"{name} is empty"


def test_auto_infer_interval():
    """Pipeline must infer 15-min, 30-min, and 60-min intervals correctly."""
    from src.data_pipeline import _infer_interval_min

    for interval in (15, 30, 60):
        df = generate(days=2, interval_min=interval, seed=42)
        inferred = _infer_interval_min(df)
        assert inferred == interval, f"expected {interval}, got {inferred}"


def test_pipeline_with_converted_fbk():
    """FBK converted data must pass through the pipeline without crashing."""
    from pathlib import Path
    from src.data_pipeline import prepare, _infer_interval_min

    path = Path("data/real_datasets/fbk_soil_moisture/converted/fbk_soil_moisture.csv")
    if not path.exists():
        from data.real_datasets.convert import convert_fbk_soil_moisture
        convert_fbk_soil_moisture()

    df = prepare(path, interval_min="auto", save_to=None)
    assert len(df) > 0
    assert set(MODEL_FEATURES).issubset(df.columns)


def test_pipeline_with_converted_unipr():
    """UniPR converted data must pass through the pipeline without crashing."""
    from pathlib import Path
    from src.data_pipeline import prepare

    path = Path("data/real_datasets/unipr_tomato/converted/unipr_tomato.csv")
    if not path.exists():
        from data.real_datasets.convert import convert_unipr_tomato
        convert_unipr_tomato()

    df = prepare(path, interval_min="auto", save_to=None)
    # UniPR soil data lacks air_temp_c / air_humidity_pct, so rows are dropped;
    # the key assertion is that the pipeline does not crash.
    assert isinstance(df, pd.DataFrame)
