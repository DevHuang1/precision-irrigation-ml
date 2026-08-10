---
license: cc-by-nc-nd-4.0
language:
  - en
pretty_name: Soil Moisture Dataset
size_categories:
  - 100K<n<1M
task_categories:
  - tabular-regression
tags:
  - agriculture
  - soil-moisture
  - time-series
  - IoT
  - remote-sensing
  - weather
  - irrigation
  - Trentino
configs:
  - config_name: field_sensor_data
    data_files:
      - split: train
        path: "field_sensor_data_consortium*.parquet"
    features:
      - name: result_time
        dtype: "timestamp[ns]"
      - name: datastream_name
        dtype: string
      - name: result
        dtype: float64
      - name: datastream_id
        dtype: int64
      - name: sensor_type
        dtype: string
      - name: ground_offset
        dtype: float64
  - config_name: irrigation_data
    data_files:
      - split: train
        path: "irrigation_data_consortium*.parquet"
    features:
      - name: result_time
        dtype: "timestamp[ns]"
      - name: datastream_name
        dtype: string
      - name: result
        dtype: float64
      - name: datastream_id
        dtype: int64
  - config_name: locations_ids
    data_files:
      - split: train
        path: "locations_ids_consortium*.parquet"
    features:
      - name: datastream_name
        dtype: string
      - name: datastream_id
        dtype: int64
      - name: x
        dtype: float64
      - name: y
        dtype: float64
  - config_name: historical_weather_data
    data_files:
      - split: train
        path: "historical_weather_data_consortium*.parquet"
    features:
      - name: result_time
        dtype: "timestamp[ns]"
      - name: temperature_2m_mean
        dtype: float32
      - name: temperature_2m_min
        dtype: float32
      - name: temperature_2m_max
        dtype: float32
      - name: relative_humidity_2m
        dtype: float32
      - name: precipitation
        dtype: float32
      - name: et0_fao_evapotranspiration
        dtype: float32
      - name: wind_speed_10m
        dtype: float32
      - name: soil_temperature_0_to_7cm_mean
        dtype: float32
      - name: soil_temperature_0_to_7cm_min
        dtype: float32
      - name: soil_temperature_0_to_7cm_max
        dtype: float32
      - name: soil_moisture_0_to_7cm
        dtype: float32
      - name: direct_radiation
        dtype: float32
      - name: datastream_name
        dtype: string
  - config_name: forecasted_weather_data
    data_files:
      - split: train
        path: "forecasted_weather_data_consortium*.parquet"
    features:
      - name: result_time
        dtype: "timestamp[ns]"
      - name: datastream_name
        dtype: string
  - config_name: soil_type_data
    data_files:
      - split: train
        path: "soil_type_data_consortium*.parquet"
    features:
      - name: datastream_name
        dtype: string
      - name: datastream_id
        dtype: int64
      - name: uc
        dtype: string
      - name: Sand
        dtype: float64
      - name: Silt
        dtype: float64
      - name: Clay
        dtype: float64
      - name: soil_type
        dtype: string
      - name: Horizon
        dtype: string
      - name: "RZD_Modal_(cm)"
        dtype: float64
      - name: "Hrz_Lower_Limit_(cm)"
        dtype: float64
      - name: Skeletal
        dtype: float64
      - name: Organic_C
        dtype: float64
      - name: "CEC_(cmol/kg)"
        dtype: float64
      - name: "Active_Lime_(permil/Note)"
        dtype: string
  - config_name: remote_sensing_data
    data_files:
      - split: train
        path: "remote_sensing_data_final_consortium*.parquet"
    features:
      - name: result_time
        dtype: "timestamp[ns]"
      - name: datastream_name
        dtype: string
      - name: datastream_id
        dtype: int64
      - name: ndvi
        dtype: float64
      - name: grvi
        dtype: float64
      - name: rvi
        dtype: float64
      - name: rgi
        dtype: float64
      - name: aci
        dtype: float64
      - name: maci
        dtype: float64
      - name: gndvi
        dtype: float64
      - name: ngrdi
        dtype: float64
      - name: ngbdi
        dtype: float64
      - name: bgvi
        dtype: float64
      - name: brvi
        dtype: float64
      - name: wi
        dtype: float64
      - name: varig
        dtype: float64
      - name: gli
        dtype: float64
      - name: g_perc
        dtype: float64
      - name: ndmi
        dtype: float64
      - name: ndwi
        dtype: float64
      - name: reci
        dtype: float64
      - name: ndre_lower_end
        dtype: float64
      - name: ndre_upper_end
        dtype: float64
      - name: msavi
        dtype: float64
      - name: arvi
        dtype: float64
      - name: sipi
        dtype: float64
      - name: gci
        dtype: float64
  - config_name: weather_data
    data_files:
      - split: train
        path: "weather_data_consortium*.parquet"
---

# Soil Moisture Dataset

## Dataset Description

A dataset of soil moisture measurements collected from on-field tensiometers and volumetric sensors, correlated with irrigation records, weather observations, satellite-derived vegetation indices, and static soil and crop characterisation. Covers an anonymised agricultural area in Trentino, Italy, across three regional consortiums.

- **Producer:** Fondazione Bruno Kessler (FBK) — OpenIoT research unit
- **Project ID:** `fbk.aif.soil_moisture_dataset`
- **Repository:** [it4lia/soil_moisture_dataset](https://huggingface.co/datasets/it4lia/soil_moisture_dataset)
- **Access:** Openly accessible via HuggingFace; `pandas` is sufficient to read all Parquet files
- **Useful for:** agronomists, irrigation managers, researchers, and developers working on irrigation decision-support and crop water management

---

## Dataset Structure

### Repository file tree

```
soil_moisture_dataset/
├── field_sensor_data_consortium{0,1,2}.parquet       # IoT sensor measurements
├── irrigation_data_consortium{0,1,2}.parquet         # Irrigation data
├── locations_ids_consortium{0,1,2}.parquet           # Location reference
├── historical_weather_data_consortium{0,1,2}.parquet # Historical weather data
├── forecasted_weather_data_consortium{0,1,2}.parquet # 7-day weather forecast
├── weather_data_consortium{0,1}.parquet              # On-site weather station
├── soil_type_data_consortium{0,1}.parquet            # Soil properties
├── remote_sensing_data_final_consortium{0,1}.parquet # Satellite spectral
└── crop_type_data_consortium{0,1,2}.pickle           # Crop information
```

**Consortium summary:**

| Sub-dataset | C0 (66 loc) | C1 (50 loc) | C2 (26 loc) |
|---|:---:|:---:|:---:|
| field_sensor_data | ✓ | ✓ | ✓ |
| irrigation_data | ✓ | ✓ | ✓ |
| locations_ids | ✓ | ✓ | ✓ |
| historical_weather_data | ✓ | ✓ | ✓ |
| forecasted_weather_data | ✓ | ✓ | ✓ |
| weather_data (on-site) | ✓ | ✓ | — |
| soil_type_data | ✓ | ✓ | — |
| remote_sensing_data | ✓ | ✓ | — |
| crop_type_data (pickle) | ✓ | ✓ | ✓ |

### Join keys

| Key | Use |
|---|---|
| `datastream_name` | Primary join key across all sub-datasets |
| `datastream_id` | Numeric alternative where available |

---

## Dataset Creation

### Data sources (from data provider)

| Data type | Origin |
|---|---|
| Soil moisture & irrigation | On-field IoT sensors owned by the FBK OpenIoT research unit |
| Weather (on-site) | Data from on-field weather station sensors |
| Weather (historical/forecasted gridded) | Public weather data |
| Satellite imagery | Public satellite data |
| Soil properties | Soil type information |
| Crop parameters | Crop type information |

### Collection

- **Provider:** Fondazione Bruno Kessler (FBK), OpenIoT research unit, Trentino, Italy
- **Geographic coverage:** Anonymised agricultural area in Trentino (exact locations not disclosed)
- **Temporal coverage:** 2023 and 2024 growing seasons
- **Frequency:** Daily
- **Format:** Apache Parquet (tabular data) + Python Pickle (crop model objects)

### Observed date ranges (from files)

| Sub-dataset | C0 | C1 | C2 |
|---|---|---|---|
| field_sensor_data | 2023-01-03 → 2024-12-03 | 2024-01-01 → 2024-11-14 | 2024-04-10 → 2025-08-25 |
| irrigation_data | 2023-07-01 → 2024-10-15 | 2024-05-07 → 2024-12-31 | 2024-04-15 → 2025-08-25 |
| historical_weather_data | 2023-01-01 → 2025-09-30 | 2023-01-01 → 2025-09-30 | 2023-01-01 → 2025-09-30 |
| forecasted_weather_data | 2023-01-01 → 2025-09-29 | 2023-01-01 → 2025-09-29 | 2023-01-01 → 2025-09-29 |
| weather_data (on-site) | 2023-01-01 → 2024-12-31 | 2023-01-01 → 2024-12-31 | — |
| remote_sensing_data | N/A | N/A | N/A— |

---

## Dataset Statistics

### Row counts

| Sub-dataset | C0 | C1 | C2 | Total |
|---|---:|---:|---:|---:|
| field_sensor_data | 13,346 | 4,705 | 4,981 | **23,032** |
| irrigation_data | 1,192 | 2,587 | 549 | **4,328** |
| locations_ids | 66 | 50 | 26 | **142** |
| weather_data (on-site) | 731 | 731 | — | **1,462** |
| historical_weather_data | 66,264 | 50,200 | 26,104 | **142,568** |
| forecasted_weather_data | 66,198 | 50,150 | 26,078 | **142,426** |
| soil_type_data | 66 | 50 | — | **116** |
| remote_sensing_data | 24,072 | 20,060 | — | **44,132** |
| **Grand total** | | | | **358,206** |

### File sizes (compressed Parquet on disk)

| Sub-dataset | C0 | C1 | C2 | Sub-total |
|---|---:|---:|---:|---:|
| field_sensor_data | 134 KB | 38 KB | 55 KB | 227 KB |
| irrigation_data | 7 KB | 12 KB | 6 KB | 25 KB |
| locations_ids | 5 KB | 5 KB | 4 KB | 14 KB |
| weather_data | 89 KB | 45 KB | — | 134 KB |
| historical_weather_data | 1,515 KB | 1,444 KB | 142 KB | 3,101 KB |
| forecasted_weather_data | 9,064 KB | 10,771 KB | 1,372 KB | 21,207 KB |
| soil_type_data | 11 KB | 11 KB | — | 22 KB |
| remote_sensing_data | 1,152 KB | 4,497 KB | — | 5,649 KB |
| **Total Parquet** | | | | **~30.4 MB** |

---


### Limitations

- Geographic coverage is a single Italian region (Trentino). Generalisation to other climates is not validated.
- Exact field locations are anonymised; coordinates cannot be used for spatial analysis.
- Sensor placement reflects operational decisions of the FBK OpenIoT unit, which may introduce selection bias toward actively managed fields.
- Crop model parameters (`crop_type_data`) are defined at consortium level, not per location.

---

## Usage

```python
import pandas as pd
import glob

# Load and concatenate field sensor data across all consortiums
# Note: cast ground_offset to float to handle int64 vs float64 difference in C2
dfs = []
for f in sorted(glob.glob("field_sensor_data_consortium*.parquet")):
    df = pd.read_parquet(f)
    df["ground_offset"] = df["ground_offset"].astype(float)
    dfs.append(df)
sensors = pd.concat(dfs)

# Filter to Water Content sensors only (not available in C1)
wc = sensors[sensors["sensor_type"] == "Water Content"]

# Load historical weather (note: datastream_name is the last column)
weather = pd.concat([
    pd.read_parquet(f) for f in sorted(glob.glob("historical_weather_data_consortium*.parquet"))
])

# Load remote sensing (columns are lowercase: ndvi, grvi, etc.)
rs = pd.concat([
    pd.read_parquet(f) for f in sorted(glob.glob("remote_sensing_data_final_consortium*.parquet"))
])
# Replace Inf before use
import numpy as np
rs = rs.replace([np.inf, -np.inf], np.nan)
```

For crop model objects (requires [`aquacrop`](https://pypi.org/project/aquacrop/)):

```python
import pickle
with open("crop_type_data_consortium0.pickle", "rb") as f:
    crop = pickle.load(f)
```
