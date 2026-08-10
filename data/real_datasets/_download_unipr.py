import sys
from pathlib import Path

import requests

DEST = Path("data/real_datasets/unipr_tomato/raw")


def main() -> None:
    r = requests.get(
        "https://data.mendeley.com/public-api/datasets/35wh56287y", timeout=60)
    r.raise_for_status()
    DEST.mkdir(parents=True, exist_ok=True)
    for f in r.json().get("files", []):
        name = f["filename"]
        url = f["content_details"]["download_url"]
        out = DEST / name
        if out.exists() and out.stat().st_size == f["content_details"]["size"]:
            print(f"skip {name}")
            continue
        print(f"download {name} ...")
        with requests.get(url, stream=True, timeout=180) as dr:
            dr.raise_for_status()
            with open(out, "wb") as fh:
                for chunk in dr.iter_content(chunk_size=1 << 16):
                    fh.write(chunk)
        print(f"OK {name}: {out.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
