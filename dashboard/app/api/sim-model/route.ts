import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { repoPath } from "@/lib/csv";

export const dynamic = "force-dynamic";

const DEFAULT_FILE = repoPath("results", "sim_model.json");

function loadModel(path: string) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const datasetId = url.searchParams.get("dataset") || "synthetic";

  if (datasetId !== "synthetic") {
    const dsFile = repoPath("results", `sim_model_${datasetId}.json`);
    const dsModel = loadModel(dsFile);
    if (dsModel) return NextResponse.json(dsModel);
  }

  try {
    const sim = JSON.parse(readFileSync(DEFAULT_FILE, "utf-8"));
    return NextResponse.json(sim);
  } catch {
    return NextResponse.json(
      { error: "sim_model.json not found — run: python -m src.export_farmer_feed" },
      { status: 404 },
    );
  }
}
