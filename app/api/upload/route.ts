import { NextRequest, NextResponse } from "next/server";
import { parseExcelBuffer, computeColumnStats } from "@/lib/excel-parser";
import { buildSearchIndex } from "@/lib/search";
import { saveSession } from "@/lib/session-store";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const sessionId = formData.get("sessionId") as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided. Please select an Excel or CSV file to upload." },
        { status: 400 }
      );
    }

    if (!sessionId || typeof sessionId !== "string" || sessionId.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Session ID is missing. Please refresh the page and try again." },
        { status: 400 }
      );
    }

    // File size: reject 0-byte and >10 MB files
    if (file.size === 0) {
      return NextResponse.json(
        { success: false, error: "The uploaded file is empty (0 bytes). Please upload a valid Excel or CSV file." },
        { status: 400 }
      );
    }

    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return NextResponse.json(
        { success: false, error: `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed size is 10 MB.` },
        { status: 400 }
      );
    }

    // Extension-based type check (MIME types are unreliable across OSes)
    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith(".xlsx") && !nameLower.endsWith(".xls") && !nameLower.endsWith(".csv")) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type "${file.name.split(".").pop()}". Please upload an Excel file (.xlsx, .xls) or a CSV file (.csv).`,
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // parseExcelBuffer throws with clear messages for all edge cases
    const parsed = parseExcelBuffer(buffer, file.name);
    const stats = computeColumnStats(parsed.rows, parsed.headers);

    const fuse = buildSearchIndex(parsed.rows, parsed.headers);
    await saveSession(sessionId, parsed, fuse);

    return NextResponse.json({
      success: true,
      message: `Successfully loaded ${parsed.totalRows.toLocaleString()} student record${parsed.totalRows !== 1 ? "s" : ""} across ${parsed.headers.length} columns.`,
      data: {
        fileName: parsed.fileName,
        totalRows: parsed.totalRows,
        headers: parsed.headers,
        warning: parsed.warning,
        stats,
      },
    });
  } catch (err: unknown) {
    console.error("[upload] Error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while processing the file. Please try again.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
