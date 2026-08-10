import { NextResponse } from "next/server";
import { coerceRow, readCsvJson, repoPath } from "@/lib/csv";

export const dynamic = "force-dynamic";

const FILE = repoPath("data", "processed", "features.csv");
const TAIL = 50;

export async function GET() {
  const rows = readCsvJson(FILE).map(coerceRow);
  const columns = Object.keys(rows[0] ?? {});
  return NextResponse.json({ columns, rows: rows.slice(-TAIL), count: rows.length });
}
