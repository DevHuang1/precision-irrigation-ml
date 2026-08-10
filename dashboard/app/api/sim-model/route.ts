import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { repoPath } from "@/lib/csv";

export const dynamic = "force-dynamic";

const FILE = repoPath("results", "sim_model.json");

export async function GET() {
  try {
    const sim = JSON.parse(readFileSync(FILE, "utf-8"));
    return NextResponse.json(sim);
  } catch {
    return NextResponse.json(
      { error: "sim_model.json not found — run: python -m src.export_farmer_feed" },
      { status: 404 },
    );
  }
}
