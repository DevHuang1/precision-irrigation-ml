import { NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { coerceRow, parseCsv, repoPath, splitCsvRow } from "@/lib/csv";

type Row = Record<string, string | number | boolean>;

export const dynamic = "force-dynamic";

const RAW_FILES: Record<string, string> = {
  synthetic: repoPath("data", "raw", "synthetic_sensor_log.csv"),
  fbk: repoPath(
    "data",
    "real_datasets",
    "fbk_soil_moisture",
    "converted",
    "fbk_soil_moisture.csv",
  ),
  zenodo: repoPath(
    "data",
    "real_datasets",
    "zenodo_cotton",
    "converted",
    "zenodo_cotton.csv",
  ),
  unipr: repoPath(
    "data",
    "real_datasets",
    "unipr_tomato",
    "converted",
    "unipr_tomato.csv",
  ),
  unipr_evolving: repoPath(
    "data",
    "real_datasets",
    "unipr_tomato_evolving",
    "converted",
    "unipr_tomato_evolving.csv",
  ),
  kaggle_orig: repoPath(
    "data",
    "real_datasets",
    "kaggle_orig_irrigation",
    "converted",
    "kaggle_orig_irrigation.csv",
  ),
  kaggle_pi_iot: repoPath(
    "data",
    "real_datasets",
    "kaggle_pi_iot",
    "converted",
    "kaggle_pi_iot.csv",
  ),
  kaggle_sa: repoPath(
    "data",
    "real_datasets",
    "kaggle_sa",
    "converted",
    "kaggle_sa.csv",
  ),
};

const MAX_COMBINED_ROWS = 100_000;
const COMBINED_IDS = [
  "synthetic",
  "fbk",
  "zenodo",
  "unipr",
  "unipr_evolving",
  "kaggle_orig",
  "kaggle_pi_iot",
  "kaggle_sa",
];

function readCsv(file: string): Row[] {
  return parseCsv(readFileSync(file, "utf-8")).map(coerceRow);
}

type DayAgg = { day: string; avg: number; change: number; direction: "up" | "down" | "flat" };

function finalizeDaily(
  byDay: Record<string, { sum: number; n: number }>,
): DayAgg[] {
  const sorted = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, { sum, n }]) => ({ day, avg: sum / n }));

  const out: DayAgg[] = [];
  for (let i = 0; i < sorted.length; i++) {
    const change = i > 0 ? sorted[i].avg - sorted[i - 1].avg : 0;
    out.push({
      day: sorted[i].day,
      avg: Math.round(sorted[i].avg * 10) / 10,
      change: Math.round(change * 10) / 10,
      direction: change > 0.5 ? "up" : change < -0.5 ? "down" : "flat",
    });
  }
  return out;
}

function computeDailyAggregates(rows: Row[]): DayAgg[] {
  const byDay: Record<string, { sum: number; n: number }> = {};
  for (const row of rows) {
    const ts = String(row.timestamp).slice(0, 10);
    const m = Number(row.soil_moisture_pct);
    if (!Number.isFinite(m)) continue;
    byDay[ts] ??= { sum: 0, n: 0 };
    byDay[ts].sum += m;
    byDay[ts].n += 1;
  }
  return finalizeDaily(byDay);
}

function rowFromCells(cells: string[], headers: string[]): Row {
  const raw: Record<string, string> = {};
  headers.forEach((h, idx) => (raw[h] = cells[idx] ?? ""));
  return coerceRow(raw);
}

/**
 * Stream a CSV file line-by-line so memory stays bounded even for
 * multi-hundred-MB files (e.g. the 887k-row UniPR Evolving export on
 * Railway's 512MB containers). Returns the number of data rows.
 */
async function streamCsv(
  file: string,
  onRow: (cells: string[], headers: string[]) => void,
): Promise<number> {
  const rl = createInterface({
    input: createReadStream(file),
    crlfDelay: Infinity,
  });
  let headers: string[] | null = null;
  let count = 0;
  for await (const line of rl) {
    if (line.length === 0) continue;
    const cells = splitCsvRow(line);
    if (headers === null) {
      headers = cells;
      continue;
    }
    count++;
    onRow(cells, headers);
  }
  return count;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dataset = url.searchParams.get("dataset") || "synthetic";
  const offset = Math.max(0, parseInt(url.searchParams.get("offset") || "0", 10) || 0);
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam
    ? Math.min(Math.max(parseInt(limitParam, 10) || 500, 1), 5000)
    : null;

  if (dataset === "combined") {
    // Pass 1: count rows per file and aggregate daily soil moisture.
    const counts: Record<string, number> = {};
    const byDay: Record<string, { sum: number; n: number }> = {};
    let total = 0;
    for (const id of COMBINED_IDS) {
      const file = RAW_FILES[id];
      try {
        counts[id] = await streamCsv(file, (cells, headers) => {
          const tsIdx = headers.indexOf("timestamp");
          const mIdx = headers.indexOf("soil_moisture_pct");
          if (tsIdx !== -1 && mIdx !== -1) {
            const ts = cells[tsIdx].slice(0, 10);
            const m = Number(cells[mIdx]);
            if (Number.isFinite(m)) {
              byDay[ts] ??= { sum: 0, n: 0 };
              byDay[ts].sum += m;
              byDay[ts].n += 1;
            }
          }
        });
        total += counts[id];
      } catch {
        // skip missing datasets
      }
    }

    // Pass 2: collect only the rows that will be returned (bounded memory).
    let rows: Row[] = [];
    if (limit !== null) {
      const start = offset;
      const end = offset + limit;
      let global = 0;
      for (const id of COMBINED_IDS) {
        const file = RAW_FILES[id];
        if (global >= end) break;
        try {
          await streamCsv(file, (cells, headers) => {
            if (global >= start && global < end) {
              rows.push(rowFromCells(cells, headers));
            }
            global++;
          });
        } catch {
          // skip missing datasets
        }
      }
    } else {
      // Evenly sample each dataset with a budget proportional to its share.
      const budgets: Record<string, number> = {};
      let assigned = 0;
      for (const id of COMBINED_IDS) {
        budgets[id] = total > 0 ? Math.floor((MAX_COMBINED_ROWS * counts[id]) / total) : 0;
        assigned += budgets[id];
      }
      for (const id of COMBINED_IDS) {
        if (assigned >= MAX_COMBINED_ROWS) break;
        budgets[id] += 1;
        assigned += 1;
      }
      for (const id of COMBINED_IDS) {
        const budget = budgets[id];
        if (budget <= 0) continue;
        const file = RAW_FILES[id];
        const count = counts[id];
        const step = count / budget;
        let local = 0;
        let picked = 0;
        try {
          await streamCsv(file, (cells, headers) => {
            if (picked < budget && local >= Math.floor(picked * step)) {
              rows.push(rowFromCells(cells, headers));
              picked++;
            }
            local++;
          });
        } catch {
          // skip missing datasets
        }
      }
    }

    return NextResponse.json({
      rows,
      count: total,
      dataset: "combined",
      breakdown: counts,
      sampled: rows.length,
      chartData: finalizeDaily(byDay),
    });
  }

  const file = RAW_FILES[dataset] || RAW_FILES.synthetic;
  try {
    const rows = readCsv(file);
    const chartData = computeDailyAggregates(rows);
    const pageRows = limit !== null ? rows.slice(offset, offset + limit) : rows;
    return NextResponse.json({
      rows: pageRows,
      count: rows.length,
      dataset,
      sampled: pageRows.length,
      chartData,
    });
  } catch {
    return NextResponse.json(
      { error: `raw data for ${dataset} not found` },
      { status: 404 },
    );
  }
}
