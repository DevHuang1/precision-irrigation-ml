import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { coerceRow, parseCsv, repoPath } from "@/lib/csv";

type Row = Record<string, string | number | boolean>;

export const dynamic = "force-dynamic";

const RAW_FILES: Record<string, string> = {
  synthetic: repoPath("data", "raw", "synthetic_sensor_log.csv"),
  fbk: repoPath("data", "real_datasets", "fbk_soil_moisture", "converted", "fbk_soil_moisture.csv"),
  zenodo: repoPath("data", "real_datasets", "zenodo_cotton", "converted", "zenodo_cotton.csv"),
  unipr: repoPath("data", "real_datasets", "unipr_tomato", "converted", "unipr_tomato.csv"),
  unipr_evolving: repoPath("data", "real_datasets", "unipr_tomato_evolving", "converted", "unipr_tomato_evolving.csv"),
};

const MAX_COMBINED_ROWS = 100_000;

function readCsv(file: string): Row[] {
  return parseCsv(readFileSync(file, "utf-8")).map(coerceRow);
}

function sampleRows(rows: Row[], maxRows: number): Row[] {
  if (rows.length <= maxRows) return rows;
  const step = rows.length / maxRows;
  const sampled: Row[] = [];
  for (let i = 0; i < maxRows; i++) {
    sampled.push(rows[Math.floor(i * step)]);
  }
  return sampled;
}

function computeDailyAggregates(rows: Row[]): { day: string; avg: number; change: number; direction: "up" | "down" | "flat" }[] {
  const byDay: Record<string, { sum: number; n: number }> = {};
  for (const row of rows) {
    const ts = String(row.timestamp).slice(0, 10);
    const m = Number(row.soil_moisture_pct);
    if (!Number.isFinite(m)) continue;
    byDay[ts] ??= { sum: 0, n: 0 };
    byDay[ts].sum += m;
    byDay[ts].n += 1;
  }

  const sorted = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, { sum, n }]) => ({ day, avg: sum / n }));

  const out: { day: string; avg: number; change: number; direction: "up" | "down" | "flat" }[] = [];
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const dataset = url.searchParams.get("dataset") || "synthetic";

  if (dataset === "combined") {
    const allRows: Row[] = [];
    const counts: Record<string, number> = {};
    for (const id of ["synthetic", "fbk", "zenodo", "unipr", "unipr_evolving"]) {
      const file = RAW_FILES[id];
      try {
        const rows = readCsv(file);
        counts[id] = rows.length;
        for (let i = 0; i < rows.length; i++) {
          allRows.push(rows[i]);
        }
      } catch {
        // skip missing datasets
      }
    }

    const sampled = sampleRows(allRows, MAX_COMBINED_ROWS);
    const chartData = computeDailyAggregates(allRows);

    return NextResponse.json({
      rows: sampled,
      count: allRows.length,
      dataset: "combined",
      breakdown: counts,
      sampled: sampled.length,
      chartData,
    });
  }

  const file = RAW_FILES[dataset] || RAW_FILES.synthetic;
  try {
    const rows = readCsv(file);
    const chartData = computeDailyAggregates(rows);
    return NextResponse.json({ rows, count: rows.length, dataset, chartData });
  } catch {
    return NextResponse.json(
      { error: `raw data for ${dataset} not found` },
      { status: 404 },
    );
  }
}
