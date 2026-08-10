import sys
import urllib.parse
from pathlib import Path

import requests

TARGETS = {
    "zenodo_cotton": [
        ("https://zenodo.org/api/records/17550127/files/"
         "Year%202023%20Rahim%20Yar%20Khanlatitude%20=%2028.41987%20longitude%20=%2070.30345"
         "(2023Cotton)%20.xlsx%20-%20NDVI.csv/content",
         "ndvi_2023.csv"),
        ("https://zenodo.org/api/records/17550127/files/"
         "2024completesheet%20-%20IoT%20Data%202024.csv/content",
         "iot_2024.csv"),
    ],
}


def download(url: str, dest: Path) -> None:
    r = requests.get(url, timeout=180)
    r.raise_for_status()
    dest.write_bytes(r.content)
    print(f"OK {dest.name}: {len(r.content) / 1e6:.2f} MB")


def main() -> None:
    which = sys.argv[1] if len(sys.argv) > 1 else "zenodo_cotton"
    dest = Path("data/real_datasets") / which / "raw"
    dest.mkdir(parents=True, exist_ok=True)
    for url, name in TARGETS.get(which, []):
        download(url, dest / name)


if __name__ == "__main__":
    main()
