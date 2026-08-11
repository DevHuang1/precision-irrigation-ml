"""Convert real-field datasets to the canonical 11-column raw schema.

Each converter returns a DataFrame with exactly these columns:
    timestamp, plot_id, soil_moisture_pct, soil_temp_c, air_temp_c,
    air_humidity_pct, rainfall_mm_24h, days_since_planting,
    crop_growth_stage, water_applied_l, irrigated_next_flag

Run all converters:
    python -m data.real_datasets.convert

Run a single dataset:
    python -m data.real_datasets.convert fbk_soil_moisture
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
import pandas as pd

REAL_ROOT = Path("data/real_datasets")
CONVERTED_ROOT = REAL_ROOT / "converted"

SCHEMA_COLUMNS = [
    "timestamp",
    "plot_id",
    "soil_moisture_pct",
    "soil_temp_c",
    "air_temp_c",
    "air_humidity_pct",
    "rainfall_mm_24h",
    "days_since_planting",
    "crop_growth_stage",
    "water_applied_l",
    "irrigated_next_flag",
]

GROWTH_STAGES = ("establishment", "vegetative", "flowering", "maturity")

# Default forward window in hours for computing irrigated_next_flag
FORWARD_WINDOW_H = 24


def _growth_stage_from_days(days: float) -> str:
    d = int(days)
    if d < 15:
        return "establishment"
    elif d < 45:
        return "vegetative"
    elif d < 70:
        return "flowering"
    else:
        return "maturity"


def _ensure_schema(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    for col in SCHEMA_COLUMNS:
        if col not in df.columns:
            if col == "crop_growth_stage":
                df[col] = "unknown"
            elif col == "irrigated_next_flag":
                df[col] = False
            elif col == "water_applied_l":
                df[col] = 0.0
            elif col == "days_since_planting":
                df[col] = 0
            elif col == "rainfall_mm_24h":
                df[col] = 0.0
            else:
                df[col] = np.nan
    return df[SCHEMA_COLUMNS]


def convert_fbk_soil_moisture() -> pd.DataFrame:
    raw = REAL_ROOT / "fbk_soil_moisture" / "raw"
    out = REAL_ROOT / "fbk_soil_moisture" / "converted"
    out.mkdir(parents=True, exist_ok=True)

    # Load weather data (shared across all plots in a consortium)
    weather_files = sorted(raw.glob("historical_weather_data_consortium*.parquet"))
    weather_frames = []
    for wf in weather_files:
        df = pd.read_parquet(wf)
        cid = wf.stem.replace("historical_weather_data_", "")
        df = df.reset_index()
        df["consortium"] = cid
        weather_frames.append(df)
    weather = pd.concat(weather_frames, ignore_index=True)
    weather["timestamp"] = pd.to_datetime(weather["result_time"])
    weather = weather.rename(columns={
        "temperature_2m_mean": "air_temp_c",
        "relative_humidity_2m": "air_humidity_pct",
        "precipitation": "precip_mm",
        "soil_temperature_0_to_7cm_mean": "soil_temp_c",
        "soil_moisture_0_to_7cm": "soil_moisture_pct",
    })

    # Aggregate weather to daily rainfall (mm per day -> rainfall_mm_24h)
    weather_daily = (weather.groupby(["consortium", pd.Grouper(key="timestamp", freq="1D")])
                     .agg({"precip_mm": "sum", "air_temp_c": "mean",
                           "air_humidity_pct": "mean", "soil_temp_c": "mean",
                           "soil_moisture_pct": "mean"})
                     .reset_index())
    weather_daily = weather_daily.rename(columns={"precip_mm": "rainfall_mm_24h"})

    # Load field sensor data (water content / soil moisture per datastream)
    sensor_files = sorted(raw.glob("field_sensor_data_consortium*.parquet"))
    sensor_frames = []
    for sf in sensor_files:
        df = pd.read_parquet(sf).reset_index()
        cid = sf.stem.replace("field_sensor_data_", "")
        df["consortium"] = cid
        df["timestamp"] = pd.to_datetime(df["result_time"])
        df = df.rename(columns={"result": "sensor_value"})
        sensor_frames.append(df[["consortium", "timestamp", "datastream_name",
                                 "sensor_type", "sensor_value", "ground_offset"]])
    sensors = pd.concat(sensor_frames, ignore_index=True)

    # Use only Water Content sensors for soil moisture
    wc = sensors[sensors["sensor_type"] == "Water Content"].copy()
    wc = wc.rename(columns={"sensor_value": "soil_moisture_pct"})

    # Build plot_id from datastream name (sector + management)
    def _extract_plot_id(name: str) -> str:
        import re
        m = re.match(r"(consortium\d+_sector\d+_(?:[A-Z]+\d*_)?management\d+)", name)
        if m:
            return m.group(1)
        m = re.match(r"(consortium\d+_[A-Z]+_sector\d+)", name)
        if m:
            return m.group(1)
        return name

    wc["plot_id"] = wc["datastream_name"].apply(_extract_plot_id)
    wc = wc.dropna(subset=["plot_id"])

    # Merge weather
    wc = wc.merge(weather_daily[["consortium", "timestamp", "rainfall_mm_24h",
                                 "air_temp_c", "air_humidity_pct", "soil_temp_c"]],
                  on=["consortium", "timestamp"], how="left")

    # Load irrigation data and compute daily water applied per plot
    irrig_files = sorted(raw.glob("irrigation_data_consortium*.parquet"))
    irrig_frames = []
    for irf in irrig_files:
        df = pd.read_parquet(irf).reset_index()
        cid = irf.stem.replace("irrigation_data_", "")
        df["consortium"] = cid
        df["timestamp"] = pd.to_datetime(df["result_time"])
        df["water_applied_l"] = pd.to_numeric(df["result"], errors="coerce").fillna(0.0)
        # Map irrigation datastream to plot_id
        df["plot_id"] = df["datastream_name"].str.replace(r"_total$", "", regex=True)
        irrig_frames.append(df[["consortium", "plot_id", "timestamp", "water_applied_l"]])
    irrig = pd.concat(irrig_frames, ignore_index=True)

    wc = wc.merge(irrig[["consortium", "plot_id", "timestamp", "water_applied_l"]],
                   on=["consortium", "plot_id", "timestamp"], how="left")
    wc["water_applied_l"] = wc["water_applied_l"].fillna(0.0)

    # Days since planting: use first date per plot as day 0
    wc = wc.sort_values(["plot_id", "timestamp"])
    wc["days_since_planting"] = (wc.groupby("plot_id")["timestamp"]
                                  .transform(lambda s: (s - s.min()).dt.days))

    # Growth stage
    wc["crop_growth_stage"] = wc["days_since_planting"].apply(_growth_stage_from_days)

    # Compute irrigated_next_flag: was there any irrigation in the next 24h?
    wc = wc.sort_values(["plot_id", "timestamp"]).reset_index(drop=True)
    wc["irrigated_next_flag"] = False
    for pid, grp in wc.groupby("plot_id", sort=False):
        idx = grp.index
        ts = grp["timestamp"].values
        water = grp["water_applied_l"].values
        flags = np.zeros(len(ts), dtype=bool)
        for i in range(len(ts)):
            future = ts > ts[i]
            within_window = future & (ts <= ts[i] + np.timedelta64(FORWARD_WINDOW_H, "h"))
            if within_window.any() and water[within_window].sum() > 0:
                flags[i] = True
        wc.loc[idx, "irrigated_next_flag"] = flags

    df = _ensure_schema(wc)
    df.to_csv(out / "fbk_soil_moisture.csv", index=False)
    print(f"wrote {len(df)} rows -> {out / 'fbk_soil_moisture.csv'}")
    return df


def convert_zenodo_cotton() -> pd.DataFrame:
    raw = REAL_ROOT / "zenodo_cotton" / "raw"
    out = REAL_ROOT / "zenodo_cotton" / "converted"
    out.mkdir(parents=True, exist_ok=True)

    # IoT sensor data (irregular timestamps, per device)
    iot = pd.read_csv(raw / "iot_2024.csv")
    iot["timestamp"] = pd.to_datetime(iot["Data Added"], format="%d-%b-%Y %I:%M %p",
                                      errors="coerce")
    iot = iot.dropna(subset=["timestamp"]).sort_values(["Device ID", "timestamp"])

    # Map columns
    iot["plot_id"] = "device_" + iot["Device ID"].astype(str)
    iot["soil_moisture_pct"] = pd.to_numeric(iot["Soil Moisture"], errors="coerce")
    iot["soil_temp_c"] = pd.to_numeric(iot["Soil Temp"], errors="coerce")
    iot["air_temp_c"] = pd.to_numeric(iot["Temperature"], errors="coerce")
    iot["air_humidity_pct"] = pd.to_numeric(iot["Humidity"], errors="coerce")
    iot["water_applied_l"] = 0.0

    # NDVI data is daily aggregated — use for rainfall and temp context
    ndvi = pd.read_csv(raw / "ndvi_2023.csv")
    ndvi["timestamp"] = pd.to_datetime(ndvi["Date"], format="%d/%m/%Y", errors="coerce")
    ndvi = ndvi.dropna(subset=["timestamp"])
    ndvi = ndvi.rename(columns={
        "temperature_2m_mean(X)": "air_temp_c",
        "precipitation_sum": "rainfall_mm_24h",
    })
    ndvi["plot_id"] = "ndvi_daily"
    ndvi["soil_moisture_pct"] = pd.to_numeric(ndvi["soil moisture  smc (iot sensor Average) %"], errors="coerce")
    ndvi["air_humidity_pct"] = np.nan
    ndvi["soil_temp_c"] = np.nan
    ndvi["water_applied_l"] = 0.0

    # Combine
    iot_cols = ["timestamp", "plot_id", "soil_moisture_pct", "soil_temp_c",
                "air_temp_c", "air_humidity_pct", "water_applied_l"]
    ndvi_cols = ["timestamp", "plot_id", "soil_moisture_pct", "soil_temp_c",
                 "air_temp_c", "air_humidity_pct", "water_applied_l",
                 "rainfall_mm_24h"]

    iot = iot[list(c for c in iot_cols if c in iot.columns)]
    ndvi = ndvi[list(c for c in ndvi_cols if c in ndvi.columns)]

    df = pd.concat([iot, ndvi], ignore_index=True).sort_values(["plot_id", "timestamp"])

    # Days since planting: assume data starts around planting time
    df["days_since_planting"] = (df.groupby("plot_id")["timestamp"]
                                  .transform(lambda s: (s - s.min()).dt.days))
    df["crop_growth_stage"] = df["days_since_planting"].apply(_growth_stage_from_days)

    # Compute irrigated_next_flag
    df["irrigated_next_flag"] = False
    for pid, grp in df.groupby("plot_id", sort=False):
        idx = grp.index
        ts = grp["timestamp"].values
        water = grp["water_applied_l"].values
        flags = np.zeros(len(ts), dtype=bool)
        for i in range(len(ts)):
            future = ts > ts[i]
            within_window = future & (ts <= ts[i] + np.timedelta64(FORWARD_WINDOW_H, "h"))
            if within_window.any() and water[within_window].sum() > 0:
                flags[i] = True
        df.loc[idx, "irrigated_next_flag"] = flags

    df = _ensure_schema(df)
    df.to_csv(out / "zenodo_cotton.csv", index=False)
    print(f"wrote {len(df)} rows -> {out / 'zenodo_cotton.csv'}")
    return df


def convert_unipr_tomato() -> pd.DataFrame:
    raw = REAL_ROOT / "unipr_tomato" / "raw"
    out = REAL_ROOT / "unipr_tomato" / "converted"
    out.mkdir(parents=True, exist_ok=True)

    soil = pd.read_csv(raw / "stuard_soil_data.csv")
    soil["timestamp"] = pd.to_datetime(pd.to_numeric(soil["ts_generation"], errors="coerce"),
                                       unit="ms", errors="coerce")
    soil = soil.dropna(subset=["timestamp"])
    soil = soil.rename(columns={
        "humidity": "soil_moisture_pct",
        "temperature": "soil_temp_c",
        "line": "plot_id",
    })
    soil["plot_id"] = "stuard_line_" + soil["plot_id"].astype(str)

    water = pd.read_csv(raw / "stuard_water_meter_data.csv")
    water["timestamp"] = pd.to_datetime(pd.to_numeric(water["ts_generation"], errors="coerce"),
                                        unit="ms", errors="coerce")
    water = water.dropna(subset=["timestamp"])
    water = water.rename(columns={
        "current_volume": "water_volume_l",
        "line": "plot_id",
    })
    water["plot_id"] = "stuard_line_" + water["plot_id"].astype(str)

    # Compute water applied per interval as positive volume change
    water = water.sort_values(["plot_id", "timestamp"])
    water["water_volume_l"] = pd.to_numeric(water["water_volume_l"], errors="coerce")
    water["water_applied_l"] = water.groupby("plot_id")["water_volume_l"].diff().clip(lower=0)

    # Merge soil and water on nearest timestamp per plot
    soil = soil.sort_values(["plot_id", "timestamp"])
    water = water[["plot_id", "timestamp", "water_applied_l"]].sort_values(["plot_id", "timestamp"])

    def _merge_group(soil_grp, water_grp):
        return pd.merge_asof(
            soil_grp.sort_values("timestamp"),
            water_grp[["timestamp", "water_applied_l"]].sort_values("timestamp"),
            on="timestamp", direction="nearest", tolerance=pd.Timedelta("5min"),
        )

    merged = pd.concat(
        [_merge_group(soil_grp, water[water["plot_id"] == pid])
         for pid, soil_grp in soil.groupby("plot_id", sort=False)],
        ignore_index=True,
    )
    merged["water_applied_l"] = merged["water_applied_l"].fillna(0.0)

    # Air temp / humidity from indicators if available
    indicators = pd.read_csv(raw / "indicators.csv")
    indicators["timestamp"] = pd.to_datetime(indicators["Unnamed: 0"], unit="s", errors="coerce")
    indicators = indicators.dropna(subset=["timestamp"])
    indicators["air_temp_c"] = pd.to_numeric(indicators["daily_mean_temperature"], errors="coerce")
    indicators["plot_id"] = "indicators_daily"
    indicators["air_humidity_pct"] = np.nan
    indicators = indicators[["timestamp", "plot_id", "air_temp_c", "air_humidity_pct"]]

    # Since indicators is daily, upsample or just use as-is for the daily plot
    merged = pd.concat([merged, indicators], ignore_index=True)
    merged = merged.sort_values(["plot_id", "timestamp"])

    merged["days_since_planting"] = (merged.groupby("plot_id")["timestamp"]
                                      .transform(lambda s: (s - s.min()).dt.days))
    merged["crop_growth_stage"] = merged["days_since_planting"].apply(_growth_stage_from_days)

    # Compute irrigated_next_flag
    merged["irrigated_next_flag"] = False
    for pid, grp in merged.groupby("plot_id", sort=False):
        idx = grp.index
        ts = grp["timestamp"].values
        water_vals = grp["water_applied_l"].values
        flags = np.zeros(len(ts), dtype=bool)
        for i in range(len(ts)):
            future = ts > ts[i]
            within_window = future & (ts <= ts[i] + np.timedelta64(FORWARD_WINDOW_H, "h"))
            if within_window.any() and water_vals[within_window].sum() > 0:
                flags[i] = True
        merged.loc[idx, "irrigated_next_flag"] = flags

    df = _ensure_schema(merged)
    df.to_csv(out / "unipr_tomato.csv", index=False)
    print(f"wrote {len(df)} rows -> {out / 'unipr_tomato.csv'}")
    return df


def convert_unipr_tomato_evolving() -> pd.DataFrame:
    raw = REAL_ROOT / "unipr_tomato_evolving" / "raw"
    out = REAL_ROOT / "unipr_tomato_evolving" / "converted"
    out.mkdir(parents=True, exist_ok=True)

    frames = []

    # Environmental data (air temp, humidity, pressure, CO2)
    for year in (2023, 2024, 2025):
        env_file = raw / f"environmental{year}.csv"
        if not env_file.exists():
            continue
        df = pd.read_csv(env_file)
        df["timestamp"] = pd.to_datetime(df["ts_generation"], unit="ms", errors="coerce")
        df = df.dropna(subset=["timestamp"])
        df["plot_id"] = "env_" + df["generated_by"].str[:8]
        df["air_temp_c"] = pd.to_numeric(df["temperature"], errors="coerce")
        df["air_humidity_pct"] = pd.to_numeric(df["humidity"], errors="coerce")
        df["soil_moisture_pct"] = np.nan
        df["soil_temp_c"] = np.nan
        df["water_applied_l"] = 0.0
        frames.append(df[["timestamp", "plot_id", "soil_moisture_pct", "soil_temp_c",
                          "air_temp_c", "air_humidity_pct", "water_applied_l"]])

    # Soil data
    for year in (2023, 2024, 2025):
        soil_file = raw / f"soil{year}.csv"
        if not soil_file.exists():
            continue
        df = pd.read_csv(soil_file)
        df["timestamp"] = pd.to_datetime(df["ts_generation"], unit="ms", errors="coerce")
        df = df.dropna(subset=["timestamp"])
        df["plot_id"] = "soil_line_" + df["line"].astype(str)
        df["soil_moisture_pct"] = pd.to_numeric(df["humidity"], errors="coerce")
        df["soil_temp_c"] = pd.to_numeric(df["temperature"], errors="coerce")
        df["air_temp_c"] = np.nan
        df["air_humidity_pct"] = np.nan
        df["water_applied_l"] = 0.0
        frames.append(df[["timestamp", "plot_id", "soil_moisture_pct", "soil_temp_c",
                          "air_temp_c", "air_humidity_pct", "water_applied_l"]])

    # Water meter data
    for year in (2023, 2024, 2025):
        wm_file = raw / f"water_meter{year}.csv"
        if not wm_file.exists():
            continue
        df = pd.read_csv(wm_file)
        df["timestamp"] = pd.to_datetime(df["ts_generation"], unit="ms", errors="coerce")
        df = df.dropna(subset=["timestamp"])
        df["plot_id"] = "watermeter_" + df["line"].astype(str)
        df = df.sort_values(["plot_id", "timestamp"])
        df["water_applied_l"] = df.groupby("plot_id")["current_volume"].diff().clip(lower=0)
        df["soil_moisture_pct"] = np.nan
        df["soil_temp_c"] = np.nan
        df["air_temp_c"] = np.nan
        df["air_humidity_pct"] = np.nan
        frames.append(df[["timestamp", "plot_id", "soil_moisture_pct", "soil_temp_c",
                          "air_temp_c", "air_humidity_pct", "water_applied_l"]])

    # Valve controller (valve state changes indicate irrigation)
    for year in (2024, 2025):
        vc_file = raw / f"valve_controller{year}.csv"
        if not vc_file.exists():
            continue
        df = pd.read_csv(vc_file)
        df["timestamp"] = pd.to_datetime(df["ts_generation"], unit="ms", errors="coerce")
        df = df.dropna(subset=["timestamp"])
        df["plot_id"] = "valve_" + df["line"].astype(str)
        df = df.sort_values(["plot_id", "timestamp"])
        df["valve_change"] = df.groupby("plot_id")["valve_state"].diff().abs().fillna(0)
        df["water_applied_l"] = (df["valve_change"] > 0).astype(float) * 5.0  # assume 5L per valve event
        df["soil_moisture_pct"] = np.nan
        df["soil_temp_c"] = np.nan
        df["air_temp_c"] = np.nan
        df["air_humidity_pct"] = np.nan
        frames.append(df[["timestamp", "plot_id", "soil_moisture_pct", "soil_temp_c",
                          "air_temp_c", "air_humidity_pct", "water_applied_l"]])

    df = pd.concat(frames, ignore_index=True).sort_values(["plot_id", "timestamp"])

    # Interpolate air temp/humidity from environmental data into other plots where possible
    # (simplified: just fill per-plot)
    for pid, grp in df.groupby("plot_id", sort=False):
        if grp["air_temp_c"].notna().any():
            df.loc[grp.index, "air_temp_c"] = grp["air_temp_c"].interpolate(method="linear", limit_area="inside")
        if grp["air_humidity_pct"].notna().any():
            df.loc[grp.index, "air_humidity_pct"] = grp["air_humidity_pct"].interpolate(method="linear", limit_area="inside")

    df["days_since_planting"] = (df.groupby("plot_id")["timestamp"]
                                  .transform(lambda s: (s - s.min()).dt.days))
    df["crop_growth_stage"] = df["days_since_planting"].apply(_growth_stage_from_days)

    # Compute irrigated_next_flag
    df["irrigated_next_flag"] = False
    for pid, grp in df.groupby("plot_id", sort=False):
        idx = grp.index
        ts = grp["timestamp"].values
        water_vals = grp["water_applied_l"].values
        flags = np.zeros(len(ts), dtype=bool)
        for i in range(len(ts)):
            future = ts > ts[i]
            within_window = future & (ts <= ts[i] + np.timedelta64(FORWARD_WINDOW_H, "h"))
            if within_window.any() and water_vals[within_window].sum() > 0:
                flags[i] = True
        df.loc[idx, "irrigated_next_flag"] = flags

    df = _ensure_schema(df)
    df.to_csv(out / "unipr_tomato_evolving.csv", index=False)
    print(f"wrote {len(df)} rows -> {out / 'unipr_tomato_evolving.csv'}")
    return df


def convert_kaggle_orig_irrigation() -> pd.DataFrame:
    """Kaggle 'Irrigation Prediction' — static agronomic records.

    No timestamps in source; synthesize a 30-min time series starting
    2023-01-01. Plot = per crop type. No water-applied data, so
    irrigated_next_flag is all False.
    """
    raw = REAL_ROOT / "kaggle_orig_irrigation" / "raw"
    out = REAL_ROOT / "kaggle_orig_irrigation" / "converted"
    out.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(raw / "irrigation_prediction.csv")
    df["timestamp"] = pd.date_range("2023-01-01", periods=len(df), freq="30min")
    df["plot_id"] = "crop_" + df["Crop_Type"].astype(str).str.lower().str.replace(" ", "_")
    df["soil_moisture_pct"] = pd.to_numeric(df["Soil_Moisture"], errors="coerce")
    df["soil_temp_c"] = np.nan
    df["air_temp_c"] = pd.to_numeric(df["Temperature_C"], errors="coerce")
    df["air_humidity_pct"] = pd.to_numeric(df["Humidity"], errors="coerce")
    df["rainfall_mm_24h"] = pd.to_numeric(df["Rainfall_mm"], errors="coerce")
    df["water_applied_l"] = 0.0

    # Map growth stage names to canonical set
    stage_map = {
        "Germination": "establishment",
        "Vegetative": "vegetative",
        "Flowering": "flowering",
        "Maturity": "maturity",
        "Harvesting": "maturity",
    }
    df["crop_growth_stage"] = df["Crop_Growth_Stage"].map(stage_map).fillna("maturity")

    df = df.sort_values(["plot_id", "timestamp"])
    df["days_since_planting"] = (df.groupby("plot_id")["timestamp"]
                                  .transform(lambda s: (s - s.min()).dt.days))
    df["irrigated_next_flag"] = False

    df = _ensure_schema(df)
    df.to_csv(out / "kaggle_orig_irrigation.csv", index=False)
    print(f"wrote {len(df)} rows -> {out / 'kaggle_orig_irrigation.csv'}")
    return df


def convert_kaggle_pi_iot() -> pd.DataFrame:
    """Kaggle 'IoT Sensor Data' — 100k sensor readings with ON/OFF status.

    No timestamps in source; synthesize a 30-min time series starting
    2023-01-01. Single plot. No water-applied data.
    """
    raw = REAL_ROOT / "kaggle_pi_iot" / "raw"
    out = REAL_ROOT / "kaggle_pi_iot" / "converted"
    out.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(raw / "iotsensordata.csv")
    df["timestamp"] = pd.date_range("2023-01-01", periods=len(df), freq="30min")
    df["plot_id"] = "pi_iot_plot"
    df["soil_moisture_pct"] = pd.to_numeric(df["Soil Moisture"], errors="coerce")
    df["soil_temp_c"] = pd.to_numeric(df["Temperature"], errors="coerce")
    df["air_temp_c"] = pd.to_numeric(df["Air temperature (C)"], errors="coerce")
    df["air_humidity_pct"] = pd.to_numeric(df["Air humidity (%)"], errors="coerce")
    df["rainfall_mm_24h"] = pd.to_numeric(df["rainfall"], errors="coerce")
    df["water_applied_l"] = 0.0

    df = df.sort_values(["plot_id", "timestamp"])
    df["days_since_planting"] = (df.groupby("plot_id")["timestamp"]
                                  .transform(lambda s: (s - s.min()).dt.days))
    df["crop_growth_stage"] = df["days_since_planting"].apply(_growth_stage_from_days)
    df["irrigated_next_flag"] = False

    df = _ensure_schema(df)
    df.to_csv(out / "kaggle_pi_iot.csv", index=False)
    print(f"wrote {len(df)} rows -> {out / 'kaggle_pi_iot.csv'}")
    return df


def convert_kaggle_sa() -> pd.DataFrame:
    """Kaggle 'Smart Agriculture' — crop moisture/temp/humidity with result.

    No timestamps in source; synthesize a 30-min time series starting
    2023-01-01. Plot = per crop type. No water-applied data.
    """
    raw = REAL_ROOT / "kaggle_sa" / "raw"
    out = REAL_ROOT / "kaggle_sa" / "converted"
    out.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(raw / "cropdata_updated.csv")
    df["timestamp"] = pd.date_range("2023-01-01", periods=len(df), freq="30min")
    df["plot_id"] = "crop_" + df["crop ID"].astype(str).str.lower().str.replace(" ", "_")
    df["soil_moisture_pct"] = pd.to_numeric(df["MOI"], errors="coerce")
    df["soil_temp_c"] = np.nan
    df["air_temp_c"] = pd.to_numeric(df["temp"], errors="coerce")
    df["air_humidity_pct"] = pd.to_numeric(df["humidity"], errors="coerce")
    df["rainfall_mm_24h"] = 0.0
    df["water_applied_l"] = 0.0

    # Map seedling stage to canonical growth stage
    stage_map = {
        "Germination": "establishment",
        "Seedling": "establishment",
        "Vegetative": "vegetative",
        "Flowering": "flowering",
        "Maturity": "maturity",
    }
    df["crop_growth_stage"] = df["Seedling Stage"].map(stage_map).fillna("maturity")

    df = df.sort_values(["plot_id", "timestamp"])
    df["days_since_planting"] = (df.groupby("plot_id")["timestamp"]
                                  .transform(lambda s: (s - s.min()).dt.days))
    df["irrigated_next_flag"] = False

    df = _ensure_schema(df)
    df.to_csv(out / "kaggle_sa.csv", index=False)
    print(f"wrote {len(df)} rows -> {out / 'kaggle_sa.csv'}")
    return df


CONVERTERS = {
    "fbk_soil_moisture": convert_fbk_soil_moisture,
    "zenodo_cotton": convert_zenodo_cotton,
    "unipr_tomato": convert_unipr_tomato,
    "unipr_tomato_evolving": convert_unipr_tomato_evolving,
    "kaggle_orig_irrigation": convert_kaggle_orig_irrigation,
    "kaggle_pi_iot": convert_kaggle_pi_iot,
    "kaggle_sa": convert_kaggle_sa,
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Convert real datasets to the 11-column raw schema")
    parser.add_argument("dataset", nargs="?", choices=list(CONVERTERS.keys()) + ["all"],
                        default="all")
    args = parser.parse_args()

    if args.dataset == "all":
        for name, fn in CONVERTERS.items():
            print(f"\n--- Converting {name} ---")
            try:
                fn()
            except Exception as e:
                print(f"FAILED {name}: {e}")
    else:
        CONVERTERS[args.dataset]()


if __name__ == "__main__":
    main()
