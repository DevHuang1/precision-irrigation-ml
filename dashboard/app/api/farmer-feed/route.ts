import { NextResponse } from "next/server";
import { readFileSync } from "node:fs";
import { repoPath } from "@/lib/csv";

export const dynamic = "force-dynamic";

const FILE = repoPath("results", "farmer_feed.json");

export async function GET() {
  try {
    const feed = JSON.parse(readFileSync(FILE, "utf-8"));
    return NextResponse.json(feed);
  } catch {
    return NextResponse.json(
      { error: "farmer_feed.json not found — run: python -m src.export_farmer_feed" },
      { status: 404 },
    );
  }
}
