# Datasets

This directory contains the raw and converted datasets used in the precision-irrigation-ml pipeline.

## Raw datasets

### FBK Soil Moisture Consortium

| Property | Value |
|----------|-------|
| **Source** | Hugging Face (`FBPack/fbk_soil_moisture`) |
| **Files** | 19 parquet files (field sensors, irrigation, weather, remote sensing, locations) |
| **Consortia** | consortium0, consortium1, consortium2 |
| **Date range** | 2023-01-03 to 2024-12-03 |
| **Sensor types** | Water Content, Soil Moisture Tension |
| **Spatial resolution** | ~24 datastreams per consortium (sector + management plots) |
| **Temporal resolution** | Daily (field sensors, weather); irregular (irrigation) |

The FBK dataset is a multi-consortium soil-moisture monitoring system. Each consortium contains several sectors with multiple management plots. Field sensor data provides daily water-content readings, while irrigation data logs cumulative water meter volumes. Historical weather data supplies daily air temperature, relative humidity, precipitation, soil temperature, and reference evapotranspiration (ET0).

### Zenodo Cotton

| Property | Value |
|----------|-------|
| **Source** | Zenodo (record 17550127) |
| **Files** | `iot_2024.csv`, `ndvi_2023.csv` |
| **Date range** | IoT: Oct 2024 – Nov 2024; NDVI: May 2023 – ongoing |
| **Spatial resolution** | Single IoT device (Device ID 170) |
| **Temporal resolution** | IoT: irregular (~daily); NDVI: ~5-day intervals |

The Zenodo cotton dataset combines near-real-time IoT sensor readings with satellite-derived NDVI and climate data for a cotton field in Rahim Yar Khan, Pakistan. The IoT device logs soil moisture, soil temperature, air temperature, humidity, and nutrient levels. The NDVI file provides daily aggregated weather variables (temperature, precipitation, wind, radiation), vegetation indices (NDVI, EVI, VHI), and calculated irrigation requirements.

### UniPR Tomato (Stuard)

| Property | Value |
|----------|-------|
| **Source** | Mendeley Data (`35wh56287y`) |
| **Files** | `stuard_soil_data.csv`, `stuard_water_meter_data.csv`, `indicators.csv`, `README.TXT` |
| **Date range** | 2023-06-28 onwards |
| **Spatial resolution** | 3 lines (stuard_line_1, stuard_line_2, stuard_line_3) |
| **Temporal resolution** | ~10-minute intervals |

The UniPR tomato dataset comes from the Stuard smart irrigation platform. Soil sensors report electrical conductivity, humidity, and temperature every ~10 minutes per line. Water meters log cumulative volume with millisecond timestamps, allowing volume-difference calculation of applied water. The indicators file provides daily mean temperatures for context.

### UniPR Tomato Evolving

| Property | Value |
|----------|-------|
| **Source** | Mendeley Data (`h8sfcf9487`) |
| **Files** | 22 CSV files across 2023–2025 |
| **Date range** | 2023–2025 |
| **Spatial resolution** | Multiple sensor lines and environmental stations |
| **Temporal resolution** | ~1-minute to ~5-minute intervals |

The evolving UniPR dataset is a large, multi-year time series with environmental sensors (CO2, pressure, temperature, humidity), soil sensors (electrical conductivity, humidity, temperature), water meters, valve controllers, and plant sensors (stem, leaf, fruit, water potential). This dataset is significantly larger than the others and covers multiple growing seasons.

## Converted datasets

All raw datasets are converted to the canonical 11-column schema via `python -m data.real_datasets.convert`:

| Column | Type | Notes |
|--------|------|-------|
| `timestamp` | datetime | ISO-8601, chronologically sorted |
| `plot_id` | string | Unique identifier per plot/sensor/line |
| `soil_moisture_pct` | float | 0–100 (clipped) |
| `soil_temp_c` | float | Celsius |
| `air_temp_c` | float | Celsius |
| `air_humidity_pct` | float | 0–100 |
| `rainfall_mm_24h` | float | Rolling 24h rainfall |
| `days_since_planting` | int | Days from first record per plot |
| `crop_growth_stage` | string | establishment / vegetative / flowering / maturity |
| `water_applied_l` | float | Liters per interval (0 when none) |
| `irrigated_next_flag` | bool | True if water applied within next 24h |

### Conversion notes

- **FBK**: Water Content sensors are used for soil moisture. Plot IDs are extracted from datastream names (sector + management). Daily precipitation from weather data becomes `rainfall_mm_24h`. Irrigation cumulative volumes are differenced to get per-interval applied water.
- **Zenodo**: IoT and NDVI data are concatenated. IoT provides high-frequency sensor readings; NDVI provides daily weather context. `rainfall_mm_24h` is available only from NDVI rows.
- **UniPR (Stuard)**: Soil and water meter timestamps are aligned with `merge_asof` (5-minute tolerance). Water applied is computed as positive volume differences. Air temperature comes from the indicators file (daily).
- **UniPR Evolving**: Multiple sensor types are concatenated. Environmental data provides air conditions; soil data provides soil moisture/temperature; water meters provide applied water; valve state changes indicate irrigation events (~5L per event).

## Using converted data

```bash
# Convert all datasets
python -m data.real_datasets.convert

# Convert a single dataset
python -m data.real_datasets.convert fbk_soil_moisture

# Run the pipeline on a converted dataset
python -m src.data_pipeline --dataset fbk --interval-min auto
python -m src.data_pipeline --dataset unipr_evolving --interval-min auto
```

## Dataset statistics

| Dataset | Rows | Plots | Date range | Interval |
|---------|------|-------|------------|----------|
| Synthetic | 8,640 | 2 | 90 days | 30 min |
| FBK | 6,681 | 14 | 2023-08 – 2024-12 | daily |
| Zenodo | 142 | 1 | 2024-05 – 2024-11 | irregular |
| UniPR (Stuard) | 32,666 | 3 | 2023-06 – ongoing | ~10 min |
| UniPR Evolving | 887,109 | many | 2023–2025 | ~1–5 min |
