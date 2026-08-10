import pandas as pd
from pathlib import Path

p = Path("data/real_datasets/unipr_tomato/raw")

soil = pd.read_csv(p / "stuard_soil_data.csv")
soil["ts"] = pd.to_datetime(soil["ts_generation"], unit="ms", errors="coerce")
print("soil lines:", sorted(soil["line"].unique()))
for c in ("humidity", "temperature", "electrical_conductivity"):
    s = pd.to_numeric(soil[c], errors="coerce")
    print(f"soil {c}:", s.describe().round(1).to_dict())

wm = pd.read_csv(p / "stuard_water_meter_data.csv")
wm["ts"] = pd.to_datetime(wm["ts_generation"], unit="ms", errors="coerce")
bad = wm["ts"].isna()
print("bad wm ts:", bad.sum(), "of", len(wm))
wm = wm[~bad]
print("wm lines:", sorted(wm["line"].unique()))
for line in sorted(wm["line"].unique()):
    d = wm[wm["line"] == line].sort_values("ts")
    dvol = d["current_volume"].diff().clip(lower=0)
    print(f"line {line}: rows {len(d)}, ts {d['ts'].min()}->{d['ts'].max()}, "
          f"max vol {d['current_volume'].max()}, max delta {dvol.max():.2f}, "
          f"n delta>0 {(dvol > 0).sum()}")
