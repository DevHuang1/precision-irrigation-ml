"""Export the winning model for edge deployment.

Writes:
* ``edge/exported/best_model.joblib`` — always
* ``edge/exported/best_model.onnx``   — best effort (requires skl2onnx + onnx)

Prints resulting file sizes in KB — this is a core edge-deployability claim of
the project and deserves its own evidence, not just accuracy numbers.
"""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd

from src.data_pipeline import MODEL_FEATURES, PROCESSED_PATH

MODELS_DIR = Path("models")
EXPORT_DIR = Path("edge/exported")


def best_model_name(results_dir: Path | str = Path("results")) -> str:
    csv = Path(results_dir) / "model_comparison.csv"
    if csv.exists():
        top = pd.read_csv(csv).iloc[0]["model"]
        if top != "baseline":
            return top
    # fall back to a tree ensemble if no comparison table yet
    for candidate in ("random_forest", "xgboost"):
        if (MODELS_DIR / f"{candidate}.joblib").exists():
            return candidate
    return "random_forest"


def export(processed_path: Path | str = PROCESSED_PATH,
           model_name: str | None = None,
           models_dir: Path | str = MODELS_DIR,
           export_dir: Path | str = EXPORT_DIR) -> Path:
    models_dir = Path(models_dir)
    export_dir = Path(export_dir)
    export_dir.mkdir(parents=True, exist_ok=True)

    name = model_name or best_model_name()
    model = joblib.load(models_dir / f"{name}.joblib")

    joblib_path = export_dir / "best_model.joblib"
    joblib.dump(model, joblib_path)

    onnx_path = None
    try:
        from skl2onnx import convert_sklearn
        from skl2onnx.common.data_types import FloatTensorType
        initial_types = [(f, FloatTensorType([None, 1])) for f in MODEL_FEATURES]
        onnx_model = convert_sklearn(model, initial_types=initial_types,
                                     target_opset=17)
        onnx_path = export_dir / "best_model.onnx"
        onnx_path.write_bytes(onnx_model.SerializeToString())
    except Exception as exc:  # ImportError or unsupported model type
        print(f"[export] ONNX export skipped: {exc}")
        print("[export] install onnx + skl2onnx and re-run for an .onnx artifact")

    size_kb = joblib_path.stat().st_size / 1024
    print(f"[export] model: {name}")
    print(f"[export] joblib: {joblib_path} ({size_kb:.1f} KB)")
    if onnx_path is not None:
        print(f"[export] onnx:   {onnx_path} "
              f"({onnx_path.stat().st_size / 1024:.1f} KB)")
    return joblib_path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed", type=Path, default=PROCESSED_PATH)
    parser.add_argument("--model", type=str, default=None,
                        help="model name to export (default: best from "
                             "results/model_comparison.csv)")
    parser.add_argument("--export-dir", type=Path, default=EXPORT_DIR)
    args = parser.parse_args()
    export(args.processed, args.model, export_dir=args.export_dir)


if __name__ == "__main__":
    main()
