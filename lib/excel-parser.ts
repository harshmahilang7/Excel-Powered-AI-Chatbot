import * as XLSX from "xlsx";
import type { ParsedExcel, StudentRow, ColumnStat } from "@/types";

const STUDENT_KEYWORDS = [
  "name", "roll", "student", "class", "section", "room", "floor",
  "block", "seat", "course", "branch", "department", "year", "batch",
  "reg", "id", "no", "number", "hall",
];

function isStudentDatabase(headers: string[]): boolean {
  const lower = headers.map((h) => h.toLowerCase());
  return STUDENT_KEYWORDS.some((kw) => lower.some((h) => h.includes(kw)));
}

export function parseExcelBuffer(
  buffer: Buffer,
  fileName: string
): ParsedExcel & { warning?: string } {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: "buffer" });
  } catch {
    throw new Error(
      "File could not be read. It may be corrupted, password-protected, or not a valid Excel/CSV file."
    );
  }

  if (!workbook.SheetNames.length) {
    throw new Error("The Excel file contains no sheets.");
  }

  let sheet: XLSX.WorkSheet | null = null;
  let headersOnly = false;

  for (const name of workbook.SheetNames) {
    const s = workbook.Sheets[name];
    if (!s["!ref"]) continue;
    const range = XLSX.utils.decode_range(s["!ref"]);
    if (range.e.r === 0 && range.e.c >= 1) {
      headersOnly = true;
      sheet = s;
      break;
    }
    if (range.e.r >= 1 && range.e.c >= 1) {
      sheet = s;
      break;
    }
  }

  if (!sheet) {
    throw new Error(
      "The file is blank or contains no usable data. " +
        "Please upload a file that has column headers in the first row and records below."
    );
  }

  if (headersOnly) {
    throw new Error(
      "The file contains column headers but no data rows. " +
        "Please ensure records are present below the header row."
    );
  }

  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false,
  });

  if (rawRows.length === 0) {
    throw new Error(
      "No data rows found. The file may contain only a header row. " +
        "Please ensure records are present below the header row."
    );
  }

  const rawHeaders = Object.keys(rawRows[0]);
  const headers = rawHeaders.map((h) => String(h).trim()).filter(Boolean);

  if (headers.length === 0) {
    throw new Error(
      "No column headers detected. Please ensure the first row contains column names."
    );
  }

  if (headers.length === 1) {
    throw new Error(
      `Only one column detected: "${headers[0]}". A valid database needs multiple columns.`
    );
  }

  const usableHeaders = headers.slice(0, 100);

  const rows: StudentRow[] = [];
  for (const raw of rawRows) {
    const normalized: StudentRow = {};
    let hasAnyValue = false;

    for (const key of usableHeaders) {
      const rawKey = rawHeaders[usableHeaders.indexOf(key)] ?? key;
      const value = raw[rawKey];
      const strValue =
        value === null || value === undefined || String(value).trim() === ""
          ? null
          : String(value).trim().substring(0, 500);

      normalized[key] = strValue;
      if (strValue) hasAnyValue = true;
    }

    if (hasAnyValue) rows.push(normalized);
  }

  if (rows.length === 0) {
    throw new Error(
      "All rows in the file are empty after filtering. " +
        "Please upload a file that contains actual records."
    );
  }

  const activeHeaders = usableHeaders.filter((h) =>
    rows.some((row) => row[h] !== null && row[h] !== "")
  );

  const cleanRows = rows.map((row) => {
    const clean: StudentRow = {};
    for (const h of activeHeaders) clean[h] = row[h];
    return clean;
  });

  const warning = !isStudentDatabase(activeHeaders)
    ? "The uploaded file doesn't appear to contain typical student data columns (like Name, Roll No, Class, Section). " +
      "The chatbot will still try to answer questions, but accuracy may be lower."
    : undefined;

  return {
    headers: activeHeaders,
    rows: cleanRows,
    totalRows: cleanRows.length,
    fileName,
    uploadedAt: new Date().toISOString(),
    warning,
  };
}

export function computeColumnStats(rows: StudentRow[], headers: string[]): ColumnStat[] {
  return headers
    .map((col) => {
      const counts = new Map<string, number>();
      for (const row of rows) {
        const val = row[col];
        if (val === null || val === "") continue;
        const key = String(val);
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }

      // Skip high-cardinality columns (likely names/IDs — not useful for charts)
      if (counts.size > 30 || counts.size === 0) return null;

      const topValues = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([value, count]) => ({ value, count }));

      return { column: col, topValues, total: rows.length };
    })
    .filter((s): s is NonNullable<typeof s> => s !== null);
}

export function rowToText(row: StudentRow): string {
  return Object.entries(row)
    .filter(([, v]) => v !== null && v !== "")
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}
