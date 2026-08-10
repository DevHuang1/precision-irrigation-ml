import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { repoPath, parseCsv } from "./csv";

export const repoRoot = (): string => repoPath();
export const PYTHON = (): string => path.join(repoRoot(), ".venv", "bin", "python");

export const RAW_FILE = (): string =>
  repoPath("data", "raw", "synthetic_sensor_log.csv");
export const PROCESSED_FILE = (): string =>
  repoPath("data", "processed", "features.csv");
export const FARMER_FEED_FILE = (): string =>
  repoPath("results", "farmer_feed.json");

export const REQUIRED_COLUMNS = [
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
];

export const KNOWN_STAGES = [
  "establishment",
  "vegetative",
  "flowering",
  "maturity",
];

const execFileAsync = promisify(execFile);

function mtime(file: string): string | null {
  try {
    return new Date(statSync(file).mtimeMs).toISOString();
  } catch {
    return null;
  }
}

function rowsIn(file: string): number {
  try {
    return parseCsv(readFileSync(file, "utf-8")).length;
  } catch {
    return 0;
  }
}

export function datasetInfo() {
  return {
    raw: {
      exists: mtime(RAW_FILE()) !== null,
      rows: rowsIn(RAW_FILE()),
      mtime: mtime(RAW_FILE()),
    },
    processed: {
      exists: mtime(PROCESSED_FILE()) !== null,
      rows: rowsIn(PROCESSED_FILE()),
      mtime: mtime(PROCESSED_FILE()),
    },
    farmerFeed: { exists: mtime(FARMER_FEED_FILE()) !== null },
  };
}

export async function runPipeline(): Promise<
  { module: string; ok: boolean; output: string }[]
> {
  const steps = [
    "src.data_pipeline",
    "src.train",
    "src.evaluate",
    "src.export_farmer_feed",
  ];
  const results: { module: string; ok: boolean; output: string }[] = [];
  for (const module of steps) {
    try {
      const { stdout, stderr } = await execFileAsync(PYTHON(), ["-m", module], {
        cwd: repoRoot(),
        timeout: 120_000,
        maxBuffer: 20 * 1024 * 1024,
      });
      results.push({ module, ok: true, output: (stdout + stderr).trim() });
    } catch (e: unknown) {
      const err = e as { stdout?: string; stderr?: string; message?: string };
      results.push({
        module,
        ok: false,
        output: (err.stdout ?? "") + "\n" + (err.stderr ?? err.message ?? String(e)),
      });
      break;
    }
  }
  return results;
}

export function validateRawCsv(
  text: string,
): {
  ok: boolean;
  errors: string[];
  warnings: string[];
  rows: number;
  columns: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows = parseCsv(text);
  if (rows.length === 0) {
    errors.push("The file is empty or has no data rows.");
    return { ok: false, errors, warnings, rows: 0, columns: [] };
  }
  const columns = Object.keys(rows[0]);
  const missing = REQUIRED_COLUMNS.filter((c) => !columns.includes(c));
  if (missing.length > 0) {
    errors.push(
      `Missing required columns: ${missing.join(", ")}. Expected: ${REQUIRED_COLUMNS.join(", ")}.`,
    );
  }
  const stages = new Set(rows.map((r) => r.crop_growth_stage).filter(Boolean));
  const unknown = [...stages].filter((s) => !KNOWN_STAGES.includes(s));
  if (unknown.length > 0) {
    warnings.push(
      `Unknown growth stages: ${unknown.join(", ")}. They will be treated as "maturity" — map them to one of ${KNOWN_STAGES.join(", ")} for best results.`,
    );
  }
  const badTs = rows.filter((r) => Number.isNaN(Date.parse(r.timestamp)));
  if (badTs.length > 0) {
    warnings.push(
      `${badTs.length} rows have unparseable timestamps (e.g. "${badTs[0].timestamp}"). They may be dropped.`,
    );
  }
  return { ok: errors.length === 0, errors, warnings, rows: rows.length, columns };
}

export function saveRawCsv(text: string): void {
  writeFileSync(RAW_FILE(), text);
}
