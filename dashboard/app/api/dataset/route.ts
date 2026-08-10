import { NextResponse } from "next/server";
import { datasetInfo, saveRawCsv, validateRawCsv, REQUIRED_COLUMNS } from "@/lib/dataset";

export const dynamic = "force-dynamic";

const MAX_BYTES = 50 * 1024 * 1024;

export async function GET() {
  return NextResponse.json({ info: datasetInfo(), requiredColumns: REQUIRED_COLUMNS });
}

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `File too large (${(file.size / 1e6).toFixed(1)} MB). Max 50 MB.` },
        { status: 413 },
      );
    }
    const text = await file.text();
    const validation = validateRawCsv(text);
    if (!validation.ok) {
      return NextResponse.json({ validation }, { status: 422 });
    }
    saveRawCsv(text);
    return NextResponse.json({
      message: `Saved ${validation.rows.toLocaleString()} rows — replacing the current dataset. Run the pipeline to rebuild models.`,
      validation,
      info: datasetInfo(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}
