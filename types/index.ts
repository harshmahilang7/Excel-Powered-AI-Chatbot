export interface StudentRow {
  [key: string]: string | number | null;
}

export interface ColumnStat {
  column: string;
  topValues: { value: string; count: number }[];
  total: number;
}

export interface ParsedExcel {
  headers: string[];
  rows: StudentRow[];
  totalRows: number;
  fileName: string;
  uploadedAt: string;
  warning?: string;
  stats?: ColumnStat[];
}

export interface SearchResult {
  row: StudentRow;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

// NDJSON stream event shapes
export type StreamEvent =
  | { type: "meta"; matchedRows: number; suggestions?: string[] }
  | { type: "chunk"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

export interface ApiUploadResponse {
  success: boolean;
  message: string;
  data?: {
    fileName: string;
    totalRows: number;
    headers: string[];
    warning?: string;
    stats?: ColumnStat[];
    suggestions?: string[];
  };
  error?: string;
}

export interface ApiChatRequest {
  query: string;
  sessionId: string;
}
