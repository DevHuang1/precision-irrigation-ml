import { NextResponse } from "next/server";
import { coerceRow, readCsvJson, repoPath } from "@/lib/csv";

export const dynamic = "force-dynamic";

const FILE = repoPath("data", "raw", "synthetic_sensor_log.csv");

export async function GET() {
  const rows = readCsvJson(FILE).map(coerceRow);
  return NextResponse.json({ rows, count: rows.length });
}
