import sys
from pathlib import Path

import requests

IDS = {
    "unipr_tomato_evolving": "h8sfcf9487",
}


def main() -> None:
    key = sys.argv[1] if len(sys.argv) > 1 else "unipr_tomato_evolving"
    only = sys.argv[2].split(",") if len(sys.argv) > 2 else []
    dest = Path("data/real_datasets") / key / "raw"
    dest.mkdir(parents=True, exist_ok=True)

    r = requests.get(
        f"https://data.mendeley.com/public-api/datasets/{IDS[key]}",
        timeout=60)
    r.raise_for_status()
    for f in r.json().get("files", []):
        name = f["filename"]
        if only and name not in only:
            continue
        size = f["content_details"]["size"]
        out = dest / name
        if out.exists() and out.stat().st_size == size:
            print(f"skip {name}")
            continue
        url = f["content_details"]["download_url"]
        print(f"download {name} ...")
        with requests.get(url, stream=True, timeout=600) as dr:
            dr.raise_for_status()
            with open(out, "wb") as fh:
                for chunk in dr.iter_content(chunk_size=1 << 16):
                    fh.write(chunk)
        print(f"OK {name}: {out.stat().st_size / 1e6:.2f} MB")


if __name__ == "__main__":
    main()
