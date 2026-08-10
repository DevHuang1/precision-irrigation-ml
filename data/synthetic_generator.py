"""Generate a realistic synthetic sensor log for two vegetable plots.

Output schema matches Section 5.1 of the project plan, so real field data
with the same column names can be dropped into the pipeline unchanged.

Simulation model
----------------
* weather: seasonal + diurnal air temperature, humidity, and rainfall events
* soil moisture: exponential decay (faster when hot/dry and during peak crop
  water use), jump after irrigation / rainfall infiltration
* irrigation: triggered stochastically once soil moisture crosses a
  growth-stage-dependent threshold; liters of water logged per event
* ``irrigated_next_flag``: True if any irrigation event occurs within the next
  ``--next-window-hours`` hours (the classification target)

A small fraction of sensor cells are deliberately corrupted (NaN or out of
range) so the cleaning step in ``src.data_pipeline.py`` has something to do.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

PLOT_IDS = ("treatment", "control")

GROWTH_STAGES = ("establishment", "vegetative", "flowering", "maturity")

# days_since_planting -> crop growth stage
STAGE_BOUNDS = ((0, 15, "establishment"), (15, 45, "vegetative"),
                (45, 70, "flowering"), (70, 10_000, "maturity"))

# relative crop water demand per stage (proxy for crop coefficient Kc)
STAGE_CROP_FACTOR = {"establishment": 0.70, "vegetative": 1.00,
                     "flowering": 1.15, "maturity": 0.65}

# nominal soil-moisture trigger point per stage (with stochastic jitter)
STAGE_IRR_THRESHOLD = {"establishment": 35.0, "vegetative": 30.0,
                       "flowering": 32.0, "maturity": 28.0}

SENSOR_ARTIFACT_VALUES = (-999.0, 130.0, -50.0, 250.0)


def growth_stage(days_since_planting: float) -> str:
    for lo, hi, stage in STAGE_BOUNDS:
        if lo <= days_since_planting < hi:
            return stage
    return "maturity"


def _simulate_weather(rng: np.random.Generator, n: int, interval_min: int):
    """Return a DataFrame of per-interval weather for both plots (shared)."""
    hours = np.arange(n) * (interval_min / 60.0)
    day = hours / 24.0

    # mild seasonal warming over the (assumed ~90 day) cycle
    season = 15.0 + 10.0 * np.sin(np.pi * np.clip(day / 90.0, 0.0, 1.0) * 0.9)
    diurnal = 7.0 * np.sin(2.0 * np.pi * (hours - 9.0) / 24.0)  # peak ~15:00
    air_temp_c = season + diurnal + rng.normal(0.0, 1.0, n)

    air_humidity_pct = np.clip(
        65.0 - 0.8 * (air_temp_c - 15.0) + rng.normal(0.0, 6.0, n), 20.0, 95.0)

    soil_temp_c = np.clip(air_temp_c * 0.75 + 8.0 + rng.normal(0.0, 1.2, n),
                          5.0, 45.0)
    return {"air_temp_c": air_temp_c, "air_humidity_pct": air_humidity_pct,
            "soil_temp_c": soil_temp_c}


def _simulate_rainfall(rng: np.random.Generator, n: int, interval_min: int):
    """Return (mm per interval, rolling 24h mm) — event-based rainfall."""
    per_interval = np.zeros(n)
    n_per_day = 24 * 60 // interval_min
    n_days = n // n_per_day + 1
    for d in range(n_days):
        if rng.random() < 0.18:
            event_len_h = rng.uniform(2.0, 8.0)
            n_int = max(1, int(event_len_h * 60 / interval_min))
            total_mm = rng.uniform(2.0, 18.0)
            profile = np.exp(-np.linspace(0, n_int, n_int) / (n_int / 3.0))
            profile /= profile.sum()
            start = d * n_per_day
            end = min(start + n_int, n)
            per_interval[start:end] += profile[:end - start] * total_mm

    mm_24h = (pd.Series(per_interval)
              .rolling(n_per_day, min_periods=1).sum().to_numpy())
    return per_interval, mm_24h


def _simulate_plot(rng: np.random.Generator, n: int, interval_min: int,
                   weather: dict, next_window_hours: int):
    """Simulate one plot's soil moisture, irrigation events and labels."""
    dt_h = interval_min / 60.0
    sm_true = rng.uniform(55.0, 70.0)
    soil_moisture = np.zeros(n)
    water_applied = np.zeros(n)
    irrigation = np.zeros(n, dtype=bool)

    for t in range(n):
        stage = growth_stage(t * dt_h / 24.0)
        kc = STAGE_CROP_FACTOR[stage]
        temp = weather["soil_temp_c"][t]
        hum = weather["air_humidity_pct"][t]
        # per-hour soil moisture decay: base * crop demand * temp * aridity
        rate = 0.004 * kc * (1.0 + 0.012 * (temp - 20.0)) * (1.0 + (70.0 - hum) / 400.0)
        sm_true -= sm_true * max(rate, 0.0) * dt_h

        # rainfall infiltration (10 mm -> roughly +2.5% moisture)
        sm_true += weather["rain_interval_mm"][t] * 0.25
        sm_true = min(sm_true, 80.0)

        # stochastic irrigation trigger: noisy threshold boundary
        threshold = STAGE_IRR_THRESHOLD[stage] + rng.uniform(-4.0, 4.0)
        if sm_true < threshold:
            target = 68.0
            water = max(target - sm_true, 1.0) * 30.0 * rng.uniform(0.9, 1.1)
            water_applied[t] = water
            irrigation[t] = True
            sm_true = target + rng.normal(0.0, 1.0)

        soil_moisture[t] = np.clip(sm_true + rng.normal(0.0, 1.5), 0.0, 100.0)

    window = int(next_window_hours * 60 / interval_min)
    n_int = pd.Series(np.arange(n), dtype=np.int64)
    irrigated_next = np.zeros(n, dtype=bool)
    # forward-looking: any irrigation in (t, t+window]
    for t in range(n):
        nxt = n_int[(n_int > t) & (n_int <= t + window)]
        if len(nxt):
            irrigated_next[t] = irrigation[nxt.to_numpy()].any()

    days = np.round(np.arange(n) * dt_h / 24.0).astype(int)
    return soil_moisture, water_applied, irrigated_next, days


def _inject_artifacts(df: pd.DataFrame, rng: np.random.Generator,
                      frac: float = 0.002) -> pd.DataFrame:
    """Corrupt a small fraction of sensor cells (NaN / out-of-range)."""
    out = df.copy()
    cols = [c for c in ("soil_moisture_pct", "soil_temp_c", "air_temp_c",
                        "air_humidity_pct", "rainfall_mm_24h") if c in out.columns]
    n_bad = int(len(out) * len(cols) * frac)
    for _ in range(n_bad):
        c = cols[rng.integers(0, len(cols))]
        i = rng.integers(0, len(out))
        out.loc[i, c] = (np.nan if rng.random() < 0.5
                         else rng.choice(SENSOR_ARTIFACT_VALUES))
    return out


def generate(days: int = 90, interval_min: int = 30, seed: int = 42,
             next_window_hours: int = 24,
             start: str = "2025-06-01T06:00:00") -> pd.DataFrame:
    """Generate the full two-plot synthetic sensor log."""
    rng = np.random.default_rng(seed)
    n = days * (24 * 60 // interval_min)
    timestamps = pd.date_range(start, periods=n, freq=f"{interval_min}min")

    weather = _simulate_weather(rng, n, interval_min)
    rain_interval_mm, rainfall_mm_24h = _simulate_rainfall(rng, n, interval_min)
    weather["rain_interval_mm"] = rain_interval_mm

    frames = []
    for plot_idx, plot_id in enumerate(PLOT_IDS):
        sm, water, flag, days_d = _simulate_plot(
            rng, n, interval_min, weather, next_window_hours)
        frames.append(pd.DataFrame({
            "timestamp": timestamps,
            "plot_id": plot_id,
            "soil_moisture_pct": sm,
            "soil_temp_c": weather["soil_temp_c"],
            "air_temp_c": weather["air_temp_c"],
            "air_humidity_pct": weather["air_humidity_pct"],
            "rainfall_mm_24h": rainfall_mm_24h,
            "days_since_planting": days_d,
            "crop_growth_stage": [growth_stage(d) for d in days_d],
            "water_applied_l": water,
            "irrigated_next_flag": flag,
        }))
    df = pd.concat(frames, ignore_index=True)
    return _inject_artifacts(df, rng)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--days", type=int, default=90)
    parser.add_argument("--interval-min", type=int, default=30)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--next-window-hours", type=int, default=24,
                        help="classification horizon for irrigated_next_flag")
    parser.add_argument("--output", type=Path,
                        default=Path("data/raw/synthetic_sensor_log.csv"))
    args = parser.parse_args()

    df = generate(days=args.days, interval_min=args.interval_min,
                  seed=args.seed, next_window_hours=args.next_window_hours)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.output, index=False)
    n_pos = int(df["irrigated_next_flag"].sum())
    print(f"wrote {len(df)} rows -> {args.output}")
    print(f"label balance: {n_pos}/{len(df)} ({100 * n_pos / len(df):.1f}% positive)")


if __name__ == "__main__":
    main()
