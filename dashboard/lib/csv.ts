import { readFileSync } from "node:fs";
import path from "node:path";

export function repoPath(...parts: string[]): string {
  return path.join(process.cwd(), "..", ...parts);
}

export function parseCsv(text: string): Record<string, string>[] {
  const rows: Record<string, string>[] = [];
  const lines = splitCsvLines(text);
  if (lines.length === 0) return rows;
  const headers = splitCsvRow(lines[0]);
  for (let i = 1; i < lines.length; i++) {
    const cells = splitCsvRow(lines[i]);
    if (cells.length === 0) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = cells[idx] ?? ""));
    rows.push(row);
  }
  return rows;
}

function splitCsvLines(text: string): string[] {
  const lines: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
    } else if (ch === "\n" && !inQuotes) {
      lines.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0) lines.push(cur);
  return lines;
}

function splitCsvRow(line: string): string[] {
  const cells: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  cells.push(cur);
  return cells.map((c) => c.replace(/\r$/, ""));
}

export function readCsvJson(filePath: string): Record<string, string>[] {
  return parseCsv(readFileSync(filePath, "utf-8"));
}

export function coerceRow(row: Record<string, string>): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v === "" || v === undefined) {
      out[k] = "";
    } else if (v === "True" || v === "true") {
      out[k] = true;
    } else if (v === "False" || v === "false") {
      out[k] = false;
    } else {
      const num = Number(v);
      out[k] = Number.isFinite(num) && v.trim() !== "" ? num : v;
    }
  }
  return out;
}
